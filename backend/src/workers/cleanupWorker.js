import Job from '../models/Job.js';
import { clearFeedCache } from '../utils/feedCache.js';

const CYCLES_TO_EXPIRE = Number(process.env.JOB_EXPIRE_AFTER_MISSED_CYCLES || 3);

export const deactivateExpiredJobs = async () => {
    const closedAt = new Date();
    const result = await Job.updateMany(
        {
            isActive: true,
            missedFetchCycles: { $gte: CYCLES_TO_EXPIRE }
        },
        {
            $set: {
                isActive: false,
                status: 'Job Closed',
                closedAt,
                updatedAt: closedAt
            }
        }
    );

    clearFeedCache();

    return {
        checked: Number(result.matchedCount || 0),
        closed: Number(result.modifiedCount || 0),
        threshold: CYCLES_TO_EXPIRE,
        closedAt: closedAt.toISOString()
    };
};

export default {
    deactivateExpiredJobs
};
