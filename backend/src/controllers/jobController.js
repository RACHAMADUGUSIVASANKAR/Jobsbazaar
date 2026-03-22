import dbService from '../utils/dbService.js';
import matchingEngine from '../utils/matchingEngine.js';
import { syncLiveJobs } from '../utils/jobSyncService.js';
import emailService from '../utils/emailService.js';
import Job from '../models/Job.js';
import { buildCacheKey, getCache, setCache } from '../utils/feedCache.js';

const STALE_MS = 15 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 250;
const refreshState = new Map();

const getLatestSeenTs = (jobs = []) => {
  const latest = jobs
    .map((job) => new Date(job.lastSeenAt || job.updatedAt || 0).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];

  return latest || 0;
};

const parsePositiveInt = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const getRefreshKey = ({ role, location }) => `${String(role || '').toLowerCase()}::${String(location || '').toLowerCase()}`;

const queueBackgroundRefresh = ({ role, location, reason = 'stale', closeMissing = false }) => {
  const key = getRefreshKey({ role, location });
  const state = refreshState.get(key) || { running: false, lastRunAt: null, lastResult: null, lastError: null };

  if (state.running) {
    return { queued: false, reason: 'already-running', state };
  }

  state.running = true;
  refreshState.set(key, state);

  setImmediate(async () => {
    try {
      const result = await syncLiveJobs({ role, location, closeMissing, resultsPerPage: 50 });
      refreshState.set(key, {
        running: false,
        lastRunAt: new Date().toISOString(),
        lastResult: { ...result, triggerReason: reason },
        lastError: null
      });
    } catch (error) {
      refreshState.set(key, {
        running: false,
        lastRunAt: new Date().toISOString(),
        lastResult: null,
        lastError: error?.message || 'Unknown sync error'
      });
      console.error('Background live refresh failed:', error);
    }
  });

  return { queued: true, reason: 'scheduled', state: { ...state, running: true } };
};

const getActiveJobsSnapshot = async () => {
  const jobs = await Job.find({ isActive: true })
    .sort({ lastSeenAt: -1, updatedAt: -1 })
    .lean();
  return jobs;
};

const buildMongoFeedQuery = ({ role = '', location = '', query = {} } = {}) => {
  const mongoQuery = { isActive: true };
  const roleText = String(role || query.role || '').trim();
  const locationText = String(location || query.location || '').trim();
  const workMode = String(query.workMode || '').trim();
  const scoreBand = String(query.matchScore || '').trim();
  const skillsText = String(query.skills || '').trim();
  const datePosted = String(query.datePosted || '').trim();

  if (roleText) {
    mongoQuery.$or = [
      { title: { $regex: roleText, $options: 'i' } },
      { company: { $regex: roleText, $options: 'i' } },
      { description: { $regex: roleText, $options: 'i' } }
    ];
  }

  if (locationText) {
    mongoQuery.location = { $regex: locationText, $options: 'i' };
  }

  if (skillsText) {
    mongoQuery.description = { $regex: skillsText, $options: 'i' };
  }

  if (workMode && workMode !== 'All') {
    mongoQuery.contract_time = { $regex: workMode, $options: 'i' };
  }

  if (scoreBand === 'High') {
    mongoQuery.matchScore = { $gte: 70 };
  } else if (scoreBand === 'Medium') {
    mongoQuery.matchScore = { $gte: 40, $lt: 70 };
  } else if (scoreBand === 'Low') {
    mongoQuery.matchScore = { $lt: 40 };
  }

  if (datePosted && datePosted !== 'Any') {
    const mapping = {
      'Last 24 hours': 1,
      'Last 3 days': 3,
      'Last 7 days': 7,
      'Last 30 days': 30
    };
    const days = mapping[datePosted];
    if (days) {
      const start = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      mongoQuery.createdAt = { $gte: start };
    }
  }

  return mongoQuery;
};

const paginate = (items = [], { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) => {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedItems = items.slice(start, start + pageSize);

  return {
    items: pagedItems,
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1
    }
  };
};

const ensureFreshActiveJobs = async ({ role, location, forceRefresh = false }) => {
  const activeJobs = await getActiveJobsSnapshot();
  const stale = Date.now() - getLatestSeenTs(activeJobs) > STALE_MS;
  const shouldRefresh = forceRefresh || activeJobs.length < 5 || stale;

  let refreshQueued = false;
  if (shouldRefresh) {
    const refreshResult = queueBackgroundRefresh({ role, location, reason: forceRefresh ? 'forced' : stale ? 'stale' : 'low-inventory', closeMissing: false });
    refreshQueued = refreshResult.queued;
  }

  return {
    jobs: activeJobs,
    stale,
    refreshQueued
  };
};

const withMatchPayload = async (jobs = [], resumeText = '') => {
  return Promise.all(jobs.map(async (job) => {
    const match = await matchingEngine.analyzeMatch(resumeText, job.description);
    return {
      ...job,
      matchScore: match.score,
      matchExplanation: match.explanation,
      matchPipeline: match.pipeline
    };
  }));
};

const nowIso = () => new Date().toISOString();

const findUserByRequest = async (request) => {
  const profile = await dbService.find('users', (u) => u.id === request.user.id);
  return {
    id: request.user.id,
    email: profile?.email || request.user?.email || '',
    name: profile?.name || profile?.email?.split('@')[0] || 'User',
    resumeText: profile?.resumeText || ''
  };
};

const ensureJobForAction = async (jobId) => {
  const job = await Job.findOne({ id: String(jobId) }).lean();
  return job || null;
};

const appendTimeline = (application, status) => {
  const timeline = Array.isArray(application.timeline) ? application.timeline : [];
  return [...timeline, { status, date: nowIso() }];
};

const mapDecisionToStatus = (decision = '') => {
  const normalized = String(decision || '').trim().toLowerCase();
  if (normalized === 'applied-earlier') return 'Applied Earlier';
  if (normalized === 'yes' || normalized === 'applied') return 'Applied';
  if (normalized === 'revisit') return 'Revisit';
  if (normalized === 'duplicate') return 'Duplicate';
  if (normalized === 'skip' || normalized === 'no') return 'Skipped';
  return 'Applied';
};

const buildCoverLetterPack = async ({ user, job }) => {
  const role = job?.title || 'this role';
  const company = job?.company || 'your company';
  const location = job?.location || 'your location';
  const userName = user?.name || 'Candidate';

  return {
    coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${role} position at ${company}. My resume demonstrates practical experience aligned with this role, and I am motivated to contribute meaningful impact from day one.\n\nI have built and shipped projects using modern engineering practices, and I can quickly adapt to your stack and product goals. I am particularly interested in this opportunity because of ${company}'s focus and the role's scope in ${location}.\n\nThank you for your time and consideration. I would welcome the opportunity to discuss how my profile can support your team.\n\nSincerely,\n${userName}`,
    recruiterEmail: `Subject: Application for ${role} - ${userName}\n\nHello,\n\nI just applied for the ${role} role at ${company} and wanted to briefly introduce myself. I bring relevant project and technical experience and would love to discuss how I can contribute to your team.\n\nThank you for your time.\n\nBest regards,\n${userName}`,
    linkedInMessage: `Hi, I applied for the ${role} role at ${company}. I would love to connect and share how my background aligns with the team’s needs. Thanks for your time.`
  };
};

const jobController = {
  getJobFeed: async (request, reply) => {
    try {
      const role = request.query?.role || 'Software Engineer';
      const location = request.query?.location || '';
      const forceRefresh = request.query?.refresh === '1';
      const page = parsePositiveInt(request.query?.page, 1, { min: 1 });
      const pageSize = parsePositiveInt(request.query?.pageSize, DEFAULT_PAGE_SIZE, { min: 1, max: MAX_PAGE_SIZE });

      const user = await dbService.find('users', u => u.id === request.user.id);
      if (!user?.resumeText) {
        return reply.status(403).send({ message: 'Resume required for personalized matching' });
      }

      const cacheKey = buildCacheKey({
        userId: request.user.id,
        role,
        location,
        page,
        pageSize,
        filters: request.query
      });
      const cached = getCache(cacheKey);
      if (cached && !forceRefresh) {
        return reply.status(200).send(cached);
      }

      const mongoQuery = buildMongoFeedQuery({ role, location, query: request.query || {} });
      const [total, jobs] = await Promise.all([
        Job.countDocuments(mongoQuery),
        Job.find(mongoQuery)
          .sort({ lastSeenAt: -1, createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean()
      ]);

      const paged = paginate(jobs, { page, pageSize });
      paged.meta.total = total;
      paged.meta.totalPages = Math.max(1, Math.ceil(total / pageSize));
      paged.meta.hasNext = page < paged.meta.totalPages;
      paged.meta.hasPrev = page > 1;

      const latestSeenTs = await Job.findOne({ isActive: true })
        .sort({ lastSeenAt: -1 })
        .select('lastSeenAt')
        .lean();
      const stale = Date.now() - new Date(latestSeenTs?.lastSeenAt || 0).getTime() > STALE_MS;

      let refreshQueued = false;
      if (forceRefresh || stale || total < 300) {
        refreshQueued = queueBackgroundRefresh({
          role,
          location,
          reason: forceRefresh ? 'forced' : (stale ? 'stale' : 'low-inventory'),
          closeMissing: false
        }).queued;
      }

      const jobsWithScores = await withMatchPayload(paged.items, user.resumeText);
      const sortedPage = jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

      const responsePayload = {
        items: sortedPage,
        meta: {
          ...paged.meta,
          stale,
          refreshQueued,
          totalJobsWithGlobal: total,
          dbJobsCount: total,
          globalJobsCount: 0,
          lastSyncAt: latestSeenTs?.lastSeenAt ? new Date(latestSeenTs.lastSeenAt).toISOString() : null
        }
      };

      setCache(cacheKey, responsePayload);
      return reply.status(200).send(responsePayload);
    } catch (error) {
      console.error('Feed Error:', error);
      return reply.status(500).send({ message: 'Error fetching job feed' });
    }
  },

  refreshLiveJobs: async (request, reply) => {
    try {
      const role = request.body?.role || 'Software Engineer';
      const location = request.body?.location || '';
      const closeMissing = Boolean(request.body?.closeMissing);
      const queueResult = queueBackgroundRefresh({ role, location, reason: 'manual', closeMissing });
      const key = getRefreshKey({ role, location });
      const state = refreshState.get(key);

      return reply.status(202).send({
        message: queueResult.queued ? 'Live jobs refresh started' : 'Live jobs refresh already running',
        queued: queueResult.queued,
        running: state?.running || false,
        lastRunAt: state?.lastRunAt || null,
        lastResult: state?.lastResult || null,
        lastError: state?.lastError || null
      });
    } catch (error) {
      console.error('Refresh jobs error:', error);
      return reply.status(500).send({ message: 'Failed to refresh jobs' });
    }
  },

  getBestMatches: async (request, reply) => {
    try {
      const role = request.query?.role || 'Software Engineer';
      const location = request.query?.location || '';
      const user = await dbService.find('users', u => u.id === request.user.id);

      if (!user?.resumeText) {
        return reply.status(403).send({ message: 'Resume required for personalized matching' });
      }

      const mongoQuery = buildMongoFeedQuery({ role, location, query: request.query || {} });
      const jobs = await Job.find(mongoQuery)
        .sort({ lastSeenAt: -1, createdAt: -1 })
        .limit(300)
        .lean();

      const jobsWithScores = await withMatchPayload(jobs, user.resumeText);

      const bestMatches = jobsWithScores
        .filter(j => j.matchScore > 40)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 25);

      return reply.status(200).send(bestMatches);
    } catch (error) {
      return reply.status(500).send({ message: 'Error fetching best matches' });
    }
  },

  trackApply: async (request, reply) => {
    const { id } = request.params;
    const desiredStatus = request.body?.status;
    const user = await findUserByRequest(request);
    const job = await ensureJobForAction(id);

    const existing = await dbService.find(
      'applications',
      a => a.userId === request.user.id && a.jobId === id
    );

    if (existing) {
      if (desiredStatus && desiredStatus !== existing.status) {
        const updated = await dbService.update('applications', existing.id, {
          ...existing,
          status: desiredStatus,
          timeline: appendTimeline(existing, desiredStatus),
          updatedAt: nowIso()
        });

        return reply.status(200).send({ message: 'Application status updated', application: updated });
      }

      return reply.status(200).send({ message: 'Application already tracked', application: existing });
    }

    const application = {
      id: Date.now().toString(),
      jobId: id,
      userId: request.user.id,
      status: desiredStatus || 'Applied',
      timeline: [{ status: desiredStatus || 'Applied', date: nowIso() }],
      timestamp: nowIso(),
      updatedAt: nowIso()
    };
    await dbService.insert('applications', application);

    if (user.email && job) {
      await emailService.sendApplicationConfirmation(user.email, user.name, job);
    }

    return reply.status(200).send({ message: 'Application tracked' });
  },

  trackApplicationDecision: async (request, reply) => {
    const { id } = request.params;
    const { decision = '', source = '', note = '' } = request.body || {};
    const mappedStatus = mapDecisionToStatus(decision);
    const user = await findUserByRequest(request);
    const job = await ensureJobForAction(id);

    const existing = await dbService.find(
      'applications',
      a => a.userId === request.user.id && a.jobId === id
    );

    if (mappedStatus === 'Skipped' || mappedStatus === 'Duplicate') {
      const skippedEvent = {
        id: Date.now().toString(),
        userId: request.user.id,
        jobId: id,
        type: mappedStatus,
        source,
        note,
        timestamp: nowIso()
      };
      await dbService.insert('applicationEvents', skippedEvent);
      return reply.status(200).send({ message: `Marked as ${mappedStatus.toLowerCase()}` });
    }

    if (existing) {
      const duplicateStatus = existing.status === mappedStatus;
      const statusToPersist = duplicateStatus ? 'Revisit' : mappedStatus;
      const updated = await dbService.update('applications', existing.id, {
        ...existing,
        status: statusToPersist,
        timeline: appendTimeline(existing, statusToPersist),
        updatedAt: nowIso(),
        source,
        note
      });

      return reply.status(200).send({
        message: duplicateStatus ? 'Application revisited' : 'Application status updated',
        application: updated
      });
    }

    const created = await dbService.insert('applications', {
      id: Date.now().toString(),
      jobId: id,
      userId: request.user.id,
      status: mappedStatus,
      timeline: [{ status: mappedStatus, date: nowIso() }],
      timestamp: nowIso(),
      updatedAt: nowIso(),
      source,
      note
    });

    if (user.email && job) {
      await emailService.sendApplicationConfirmation(user.email, user.name, job);
    }

    return reply.status(200).send({ message: 'Application decision tracked', application: created });
  },

  saveJob: async (request, reply) => {
    const { id } = request.params;

    const existing = await dbService.find(
      'savedJobs',
      s => s.userId === request.user.id && s.jobId === id
    );

    if (existing) {
      return reply.status(200).send({ message: 'Job already saved', saved: existing });
    }

    const saved = {
      id: Date.now().toString(),
      jobId: id,
      userId: request.user.id,
      timestamp: new Date().toISOString()
    };
    await dbService.insert('savedJobs', saved);
    return reply.status(200).send({ message: 'Job saved' });
  },

  removeSavedJob: async (request, reply) => {
    const { id } = request.params;
    const saved = await dbService.find(
      'savedJobs',
      s => s.userId === request.user.id && s.jobId === id
    );

    if (!saved) {
      return reply.status(404).send({ message: 'Saved job not found' });
    }

    await dbService.delete('savedJobs', saved.id);
    return reply.status(200).send({ message: 'Removed from saved jobs' });
  },

  moveSavedToApplied: async (request, reply) => {
    const { id } = request.params;
    const saved = await dbService.find(
      'savedJobs',
      s => s.userId === request.user.id && s.jobId === id
    );

    if (saved) {
      await dbService.delete('savedJobs', saved.id);
    }

    const existing = await dbService.find(
      'applications',
      a => a.userId === request.user.id && a.jobId === id
    );

    if (existing) {
      return reply.status(200).send({ message: 'Already in applied jobs', application: existing });
    }

    const application = {
      id: Date.now().toString(),
      jobId: id,
      userId: request.user.id,
      status: 'Applied',
      timeline: [{ status: 'Applied', date: new Date().toISOString() }],
      timestamp: new Date().toISOString()
    };

    await dbService.insert('applications', application);
    const user = await findUserByRequest(request);
    const job = await ensureJobForAction(id);
    if (user.email && job) {
      await emailService.sendApplicationConfirmation(user.email, user.name, job);
    }
    return reply.status(200).send({ message: 'Moved to applied jobs', application });
  },

  getApplications: async (request, reply) => {
    try {
      const apps = await dbService.filter('applications', a => a.userId === request.user.id);
      const appJobIds = [...new Set(apps.map((app) => String(app.jobId)).filter(Boolean))];
      const jobs = appJobIds.length
        ? await Job.find({ id: { $in: appJobIds } }).lean()
        : [];
      const jobMap = new Map(jobs.map((job) => [String(job.id), job]));

      const enrichedApps = apps.map(app => {
        const job = jobMap.get(String(app.jobId));
        return {
          ...app,
          jobTitle: job?.title || 'Unknown Position',
          company: job?.company || 'Unknown Company',
          jobStatus: job?.isActive === false ? 'Job Closed' : 'Active'
        };
      });

      return reply.status(200).send(enrichedApps);
    } catch (error) {
      return reply.status(500).send({ message: 'Error fetching applications' });
    }
  },

  generateCoverLetterPack: async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await findUserByRequest(request);
      const job = await ensureJobForAction(id);

      if (!job) {
        return reply.status(404).send({ message: 'Job not found' });
      }

      const pack = await buildCoverLetterPack({ user, job });
      return reply.status(200).send(pack);
    } catch (error) {
      console.error('Cover letter generation error:', error);
      return reply.status(500).send({ message: 'Failed to generate cover letter pack' });
    }
  },

  getNotifications: async (request, reply) => {
    try {
      const notifications = await dbService.filter('notifications', (n) => n.userId === request.user.id);
      const sorted = notifications
        .slice()
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

      return reply.status(200).send(sorted);
    } catch (error) {
      return reply.status(500).send({ message: 'Error fetching notifications' });
    }
  },

  getSavedJobs: async (request, reply) => {
    try {
      const saved = await dbService.filter('savedJobs', s => s.userId === request.user.id);
      const savedIds = [...new Set(saved.map((item) => String(item.jobId)).filter(Boolean))];
      const jobs = savedIds.length
        ? await Job.find({ id: { $in: savedIds } }).lean()
        : [];
      const jobMap = new Map(jobs.map((job) => [String(job.id), job]));
      const user = await dbService.find('users', u => u.id === request.user.id);

      const savedJobDetails = await Promise.all(saved.map(async (s) => {
        const job = jobMap.get(String(s.jobId));
        if (!job) return null;
        const score = await matchingEngine.calculateScore(user.resumeText, job.description);
        return {
          ...job,
          matchScore: score,
          jobStatus: job?.isActive === false ? 'Job Closed' : 'Active'
        };
      }));

      return reply.status(200).send(savedJobDetails.filter(j => j !== null));
    } catch (error) {
      return reply.status(500).send({ message: 'Error fetching saved jobs' });
    }
  }
};

export default jobController;
