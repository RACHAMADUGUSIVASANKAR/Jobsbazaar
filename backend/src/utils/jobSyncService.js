import { fetchJobsFromSources } from '../services/jobSources/index.js';
import Job from '../models/Job.js';
import { clearFeedCache } from './feedCache.js';

const normalizeCompositeSignature = (job = {}) => {
    const jobId = String(job.id || '').trim().toLowerCase();
    const title = (job.title || '').trim().toLowerCase();
    const company = (job.company || '').trim().toLowerCase();
    const location = (job.location || '').trim().toLowerCase();
    return `${jobId}|${title}|${company}|${location}`;
};

const normalizeSemanticSignature = (job = {}) => {
    const title = (job.title || '').trim().toLowerCase();
    const company = (job.company || '').trim().toLowerCase();
    const location = (job.location || '').trim().toLowerCase();
    return `${title}|${company}|${location}`;
};

const buildLookupMaps = (existingJobs = []) => {
    const idMap = new Map();
    const compositeSignatureMap = new Map();
    const semanticSignatureMap = new Map();

    for (const job of existingJobs) {
        idMap.set(String(job.id), job);

        compositeSignatureMap.set(normalizeCompositeSignature(job), job);
        semanticSignatureMap.set(normalizeSemanticSignature(job), job);
    }

    return { idMap, compositeSignatureMap, semanticSignatureMap };
};

const syncLiveJobs = async ({ role = 'Software Engineer', location = '', resultsPerPage = 30, closeMissing = false } = {}) => {
    const fetchedAt = new Date();
    const liveJobs = await fetchJobsFromSources({
        keywords: role,
        location,
        resultsPerPage
    });

    const incomingIds = [...new Set(liveJobs.map((job) => String(job.id || '')).filter(Boolean))];
    const existingById = await Job.find({ id: { $in: incomingIds } })
        .select('id isActive')
        .lean();
    const existingMap = new Map(existingById.map((job) => [String(job.id), job]));

    let inserted = 0;
    let reactivated = 0;

    const bulkOps = [];
    for (const liveJob of liveJobs) {
        const id = String(liveJob.id || '').trim();
        if (!id) continue;

        const existing = existingMap.get(id);
        if (existing) {
            if (existing.isActive === false) reactivated += 1;
        } else {
            inserted += 1;
        }

        bulkOps.push({
            updateOne: {
                filter: { id },
                update: {
                    $set: {
                        ...liveJob,
                        dedupeCompositeSignature: normalizeCompositeSignature(liveJob),
                        dedupeSemanticSignature: normalizeSemanticSignature(liveJob),
                        isActive: true,
                        status: 'Active',
                        syncMissedCount: 0,
                        sourceFetchedAt: fetchedAt,
                        lastSeenAt: fetchedAt,
                        closedAt: null
                    },
                    $setOnInsert: {
                        createdAt: fetchedAt
                    }
                },
                upsert: true
            }
        });
    }

    if (bulkOps.length) {
        await Job.bulkWrite(bulkOps, { ordered: false });
    }

    // Freshness lifecycle: any active job not seen for 6 hours is marked inactive.
    const sixHoursAgo = new Date(Date.now() - (6 * 60 * 60 * 1000));
    const staleCandidates = await Job.find({ isActive: true, lastSeenAt: { $lt: sixHoursAgo } })
        .select('id syncMissedCount')
        .lean();

    let closed = 0;
    let missesIncremented = 0;
    if (staleCandidates.length) {
        const staleOps = staleCandidates.map((job) => {
            const nextMisses = Number(job.syncMissedCount || 0) + 1;
            if (nextMisses >= 3 || closeMissing) {
                closed += 1;
                return {
                    updateOne: {
                        filter: { id: job.id },
                        update: {
                            $set: {
                                isActive: false,
                                status: 'Job Closed',
                                syncMissedCount: nextMisses,
                                closedAt: fetchedAt
                            }
                        }
                    }
                };
            }

            missesIncremented += 1;
            return {
                updateOne: {
                    filter: { id: job.id },
                    update: {
                        $set: {
                            syncMissedCount: nextMisses
                        }
                    }
                }
            };
        });

        if (staleOps.length) {
            await Job.bulkWrite(staleOps, { ordered: false });
        }
    }

    clearFeedCache();

    return {
        liveJobs,
        inserted,
        reactivated,
        missesIncremented,
        closed,
        fetchedAt: fetchedAt.toISOString()
    };
};

const closeExpiredJobs = async ({ role = 'Software Engineer', location = '', resultsPerPage = 50 } = {}) => {
    const result = await syncLiveJobs({
        role,
        location,
        resultsPerPage,
        closeMissing: true
    });

    return {
        checked: result.liveJobs.length,
        closed: result.closed,
        fetchedAt: result.fetchedAt
    };
};

export { syncLiveJobs, closeExpiredJobs, normalizeCompositeSignature, normalizeSemanticSignature };
