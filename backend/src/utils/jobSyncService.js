import { fetchAndStoreJobs } from '../workers/jobFetcher.js';
import { deactivateExpiredJobs } from '../workers/cleanupWorker.js';

const normalizeCompositeSignature = (job = {}) => {
    const external = String(job.externalId || job.externalJobId || job.id || '').trim().toLowerCase();
    const title = String(job.title || '').trim().toLowerCase();
    const company = String(job.company || '').trim().toLowerCase();
    const location = String(job.location || '').trim().toLowerCase();
    return `${external}|${title}|${company}|${location}`;
};

const normalizeSemanticSignature = (job = {}) => {
    const title = String(job.title || '').trim().toLowerCase();
    const company = String(job.company || '').trim().toLowerCase();
    const location = String(job.location || '').trim().toLowerCase();
    return `${title}|${company}|${location}`;
};

const syncLiveJobs = async ({ role = '', location = '', resultsPerPage = 50 } = {}) => {
    return fetchAndStoreJobs({ role, location, resultsPerPage });
};

const closeExpiredJobs = async () => {
    return deactivateExpiredJobs();
};

export {
    syncLiveJobs,
    closeExpiredJobs,
    normalizeCompositeSignature,
    normalizeSemanticSignature
};
