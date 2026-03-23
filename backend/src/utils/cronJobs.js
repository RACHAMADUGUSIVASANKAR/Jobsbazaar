import cron from 'node-cron';
import dbService from './dbService.js';
import emailService from './emailService.js';
import Job from '../models/Job.js';
import { fetchAndStoreJobs } from '../workers/jobFetcher.js';
import { deactivateExpiredJobs } from '../workers/cleanupWorker.js';
import { refreshMatchScores } from '../workers/matchScoreWorker.js';

const hoursDiff = (from, to = new Date()) => {
  const a = new Date(from || 0).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (b - a) / (1000 * 60 * 60);
};

const saveNotification = async ({ userId, type, title, message, meta = {} }) => {
  await dbService.insert('notifications', {
    id: Date.now().toString(),
    userId,
    type,
    title,
    message,
    meta,
    read: false,
    timestamp: new Date().toISOString()
  });
};

const processApplicationEmailAutomations = async () => {
  const applications = await dbService.get('applications');
  const users = await dbService.get('users');
  const jobs = await dbService.get('jobs');

  for (const app of applications) {
    const user = users.find((u) => String(u.id) === String(app.userId));
    const job = jobs.find((j) => String(j.id) === String(app.jobId));
    if (!user?.email || !job) continue;

    const ageHours = hoursDiff(app.timestamp);
    const followUpSent = Boolean(app.emailFollowUpSentAt);
    if (ageHours >= 120 && !followUpSent && `${app.status || ''}`.toLowerCase().includes('applied')) {
      await emailService.sendFiveDayFollowUpReminder(user.email, user.name || 'User', job);
      await dbService.update('applications', app.id, {
        ...app,
        emailFollowUpSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await saveNotification({
        userId: app.userId,
        type: 'follow-up',
        title: '5-Day Follow-up Reminder Sent',
        message: `Follow-up reminder sent for ${job.title} at ${job.company}.`,
        meta: { jobId: app.jobId }
      });
    }

    const interviewStatus = `${app.status || ''}`.toLowerCase().includes('interview');
    const interviewReminderSent = Boolean(app.interviewReminderSentAt);
    if (interviewStatus && !interviewReminderSent) {
      await emailService.sendInterviewReminder(user.email, user.name || 'User', job, 'soon');
      await dbService.update('applications', app.id, {
        ...app,
        interviewReminderSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await saveNotification({
        userId: app.userId,
        type: 'interview-reminder',
        title: 'Interview Reminder Sent',
        message: `Interview reminder sent for ${job.title} at ${job.company}.`,
        meta: { jobId: app.jobId }
      });
    }
  }
};

const processNewMatchAlerts = async () => {
  const users = await dbService.get('users');
  const activeJobs = await Job.find({ isActive: true, matchScore: { $gte: 70 } })
    .sort({ matchScore: -1, createdAt: -1 })
    .lean();

  for (const user of users) {
    if (!user?.email) continue;

    const top = activeJobs
      .slice(0, 3);

    if (!top.length) continue;

    await emailService.sendNewMatchAlert(user.email, user.name || 'User', top);
    await saveNotification({
      userId: user.id,
      type: 'new-match',
      title: 'New High-Match Jobs',
      message: `We found ${top.length} new high-match opportunities for you.`,
      meta: { jobIds: top.map((j) => j.id) }
    });
  }
};

const processWeeklyDigest = async () => {
  const users = await dbService.get('users');
  const notifications = await dbService.get('notifications');
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const user of users) {
    if (!user?.email) continue;
    const userWeekly = notifications.filter((n) => String(n.userId) === String(user.id)
      && new Date(n.timestamp || 0).getTime() >= oneWeekAgo);

    const highlights = userWeekly.slice(0, 5).map((n) => `${n.title}: ${n.message}`);
    await emailService.sendWeeklyDigest(user.email, userWeekly.length, highlights);
  }
};

// Worker Stats Tracking (Phase 6 Observability)
const workerStats = {
  fetch: { lastRun: null, lastDuration: 0, runsTotal: 0, inserted: 0, reactivated: 0, missed: 0, closed: 0, lastError: null },
  cleanup: { lastRun: null, lastDuration: 0, runsTotal: 0, checked: 0, closed: 0, lastError: null },
  score: { lastRun: null, lastDuration: 0, runsTotal: 0, scored: 0, updated: 0, lastError: null }
};

export const getWorkerStats = () => ({ ...workerStats, snapshot: new Date().toISOString() });

const recordWorkerRun = (worker, result, duration, error = null) => {
  const stats = workerStats[worker];
  if (stats) {
    stats.lastRun = new Date().toISOString();
    stats.lastDuration = duration;
    stats.runsTotal += 1;
    stats.lastError = error ? String(error.message).slice(0, 100) : null;

    if (worker === 'fetch' && result) {
      stats.inserted = result.inserted || 0;
      stats.reactivated = result.reactivated || 0;
      stats.missed = result.missesIncremented || 0;
      stats.closed = result.closed || 0;
    } else if (worker === 'cleanup' && result) {
      stats.checked = result.checked || 0;
      stats.closed = result.closed || 0;
    } else if (worker === 'score' && result) {
      stats.scored = result.scoredJobs || 0;
      stats.updated = result.updatedJobs || 0;
    }
  }
};

const cronJobs = {
  start: () => {
    const fetchEnabled = process.env.JOB_FETCHER_ENABLED !== 'false';
    const cleanupEnabled = process.env.CLEANUP_WORKER_ENABLED !== 'false';
    const matchEnabled = process.env.MATCH_WORKER_ENABLED !== 'false';

    // 1. Fetch and merge new jobs every 15 minutes.
    cron.schedule('*/15 * * * *', async () => {
      if (!fetchEnabled) return;
      const startTime = Date.now();
      try {
        const result = await fetchAndStoreJobs({ role: '', location: '', resultsPerPage: 50 });
        const duration = Date.now() - startTime;
        recordWorkerRun('fetch', result, duration);
        console.log(`[Worker:Fetch] 15m sync completed in ${duration}ms. fetched=${result.liveJobs.length} inserted=${result.inserted} reactivated=${result.reactivated} misses=${result.missesIncremented} closed=${result.closed}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        recordWorkerRun('fetch', null, duration, error);
        console.error('[Worker:Fetch] 15m sync failed:', error.message);
      }
    });

    // 2. Mark expired jobs every 6 hours.
    cron.schedule('0 */6 * * *', async () => {
      if (!cleanupEnabled) return;
      const startTime = Date.now();
      try {
        const result = await deactivateExpiredJobs();
        const duration = Date.now() - startTime;
        recordWorkerRun('cleanup', result, duration);
        console.log(`[Worker:Cleanup] Expiry cleanup completed in ${duration}ms. checked=${result.checked} closed=${result.closed}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        recordWorkerRun('cleanup', null, duration, error);
        console.error('[Worker:Cleanup] Expiry cleanup failed:', error.message);
      }
    });

    // 3. Recompute match scores every 6 hours.
    cron.schedule('0 */6 * * *', async () => {
      if (!matchEnabled) return;
      const startTime = Date.now();
      try {
        const result = await refreshMatchScores();
        const duration = Date.now() - startTime;
        recordWorkerRun('score', result, duration);
        console.log(`[Worker:Score] Match score refresh completed in ${duration}ms. scored=${result.scoredJobs} updated=${result.updatedJobs}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        recordWorkerRun('score', null, duration, error);
        console.error('[Worker:Score] Score refresh failed:', error.message);
      }
    });

    // 4. Refresh best-match lifecycle metadata every hour.
    cron.schedule('15 * * * *', async () => {
      try {
        const refreshAt = new Date().toISOString();
        const updated = await Job.updateMany(
          {},
          { $set: { bestMatchRefreshedAt: new Date(refreshAt), updatedAt: new Date(refreshAt) } }
        );
        console.log(`Cron: Best-match metadata refresh completed for ${updated.modifiedCount || 0} jobs.`);
      } catch (error) {
        console.error('Cron best-match refresh failed:', error.message);
      }
    });

    // 5. Hourly automation: 5-day follow-up + interview reminders.
    cron.schedule('20 * * * *', async () => {
      try {
        await processApplicationEmailAutomations();
        console.log('Cron: Application email automations processed.');
      } catch (error) {
        console.error('Cron application email automations failed:', error.message);
      }
    });

    // 6. Daily new match alerts.
    cron.schedule('0 9 * * *', async () => {
      try {
        await processNewMatchAlerts();
        console.log('Cron: New match alerts processed.');
      } catch (error) {
        console.error('Cron new match alerts failed:', error.message);
      }
    });

    // 7. Weekly digest every Monday morning.
    cron.schedule('0 8 * * 1', async () => {
      try {
        await processWeeklyDigest();
        console.log('Cron: Weekly digest processed.');
      } catch (error) {
        console.error('Cron weekly digest failed:', error.message);
      }
    });
  }
};

export default cronJobs;
