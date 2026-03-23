import { getWorkerStats } from '../utils/cronJobs.js';
import Job from '../models/Job.js';

export const getWorkerStats_endpoint = async (request, reply) => {
    try {
        const stats = getWorkerStats();
        const jobCount = await Job.countDocuments({ isActive: true });
        const inactiveCount = await Job.countDocuments({ isActive: false });

        return reply.send({
            success: true,
            timestamp: new Date().toISOString(),
            workers: stats,
            database: {
                activeJobs: jobCount,
                inactiveJobs: inactiveCount,
                totalJobs: jobCount + inactiveCount
            }
        });
    } catch (error) {
        console.error('[Admin] Worker stats endpoint error:', error);
        return reply.status(500).send({
            success: false,
            error: 'Failed to retrieve worker stats',
            message: error.message
        });
    }
};

export const getDeploymentStatus_endpoint = async (request, reply) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        const stats = getWorkerStats();

        // Check if workers are actively running
        const now = new Date();
        const fetchOk = stats.fetch.lastRun && (now - new Date(stats.fetch.lastRun)) < (20 * 60 * 1000); // Within 20 minutes
        const cleanupOk = stats.cleanup.lastRun && (now - new Date(stats.cleanup.lastRun)) < (7 * 60 * 60 * 1000); // Within 7 hours
        const scoreOk = stats.score.lastRun && (now - new Date(stats.score.lastRun)) < (7 * 60 * 60 * 1000); // Within 7 hours

        return reply.send({
            success: true,
            environment: process.env.NODE_ENV || 'development',
            isProd,
            timestamp: new Date().toISOString(),
            deployment: {
                mongodbConnected: !!process.env.MONGODB_URI,
                corsLocked: isProd ? process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'false' : null,
                jwt_secret_configured: !!process.env.JWT_SECRET,
                frontend_url: process.env.FRONTEND_URL ? 'configured' : 'missing'
            },
            workers: {
                fetch: { enabled: process.env.JOB_FETCHER_ENABLED !== 'false', healthy: fetchOk, lastRun: stats.fetch.lastRun },
                cleanup: { enabled: process.env.CLEANUP_WORKER_ENABLED !== 'false', healthy: cleanupOk, lastRun: stats.cleanup.lastRun },
                score: { enabled: process.env.MATCH_WORKER_ENABLED !== 'false', healthy: scoreOk, lastRun: stats.score.lastRun }
            }
        });
    } catch (error) {
        console.error('[Admin] Deployment status endpoint error:', error);
        return reply.status(500).send({
            success: false,
            error: 'Failed to retrieve deployment status',
            message: error.message
        });
    }
};
