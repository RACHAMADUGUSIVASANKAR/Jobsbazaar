import Job from '../models/Job.js';
import { aggregateJobsFromSources } from '../services/jobAggregator.js';
import { clearFeedCache } from '../utils/feedCache.js';

const now = () => new Date();

const toJobId = (job = {}) => {
    const source = String(job.source || 'source').toLowerCase();
    const external = String(job.externalId || job.externalJobId || '').trim();
    const fallback = String(job.dedupeHash || `${job.title || ''}-${job.company || ''}-${job.location || ''}`)
        .replace(/\s+/g, '-')
        .toLowerCase();
    return `${source}-${external || fallback}`;
};

export const fetchAndStoreJobs = async ({ location = '', role = '', resultsPerPage = 50 } = {}) => {
    const fetchedAt = now();
    const liveJobs = await aggregateJobsFromSources({
        location,
        keywords: role ? [role] : undefined,
        resultsPerPage
    });

    const incomingIds = liveJobs.map((job) => toJobId(job));
    const existingJobs = await Job.find({ id: { $in: incomingIds } })
        .select('id isActive')
        .lean();
    const existingMap = new Map(existingJobs.map((job) => [String(job.id), job]));

    let inserted = 0;
    let reactivated = 0;
    const insertDocs = [];
    const updateOps = [];

    for (const job of liveJobs) {
        const id = toJobId(job);
        const existing = existingMap.get(id);
        const basePayload = {
            id,
            externalId: String(job.externalId || job.externalJobId || ''),
            externalJobId: String(job.externalJobId || job.externalId || ''),
            title: job.title || '',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description || '',
            category: job.category || 'Engineering',
            domainCategory: job.category || 'backend',
            applyUrl: job.applyUrl || job.redirect_url || '',
            redirect_url: job.redirect_url || job.applyUrl || '',
            postedDate: job.postedDate ? new Date(job.postedDate) : fetchedAt,
            created: job.created || fetchedAt.toISOString(),
            skills: Array.isArray(job.skills) ? job.skills : [],
            salary_min: job.salary_min ?? null,
            salary_max: job.salary_max ?? null,
            contract_time: job.contract_time || 'full_time',
            source: job.source || 'Unknown',
            dedupeHash: String(job.dedupeHash || ''),
            dedupeCompositeSignature: String(job.dedupeHash || ''),
            dedupeSemanticSignature: `${String(job.title || '').toLowerCase()}|${String(job.company || '').toLowerCase()}|${String(job.location || '').toLowerCase()}`,
            isActive: true,
            status: 'Active',
            syncMissedCount: 0,
            missedFetchCycles: 0,
            sourceFetchedAt: fetchedAt,
            lastSeenAt: fetchedAt,
            closedAt: null,
            updatedAt: fetchedAt
        };

        if (!existing) {
            inserted += 1;
            insertDocs.push({ ...basePayload, createdAt: fetchedAt });
            continue;
        }

        if (existing.isActive === false) {
            reactivated += 1;
        }

        updateOps.push({
            updateOne: {
                filter: { id },
                update: { $set: basePayload }
            }
        });
    }

    if (insertDocs.length) {
        try {
            await Job.insertMany(insertDocs, { ordered: false });
        } catch (error) {
            // Ignore duplicate races caused by overlapping scheduler runs.
            if (error?.code !== 11000) {
                throw error;
            }
        }
    }

    if (updateOps.length) {
        await Job.bulkWrite(updateOps, { ordered: false });
    }

    let missesIncremented = 0;
    if (incomingIds.length > 0) {
        const staleUpdate = await Job.updateMany(
            { isActive: true, id: { $nin: incomingIds } },
            {
                $inc: { missedFetchCycles: 1, syncMissedCount: 1 },
                $set: { updatedAt: fetchedAt }
            }
        );
        missesIncremented = Number(staleUpdate.modifiedCount || 0);
    }

    clearFeedCache();

    return {
        liveJobs,
        inserted,
        reactivated,
        missesIncremented,
        closed: 0,
        fetchedAt: fetchedAt.toISOString()
    };
};

export default {
    fetchAndStoreJobs
};
