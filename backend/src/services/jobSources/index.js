import { fetchAdzunaJobs } from './adzuna.service.js';
import { fetchRemotiveJobs } from './remotive.service.js';
import { fetchArbeitnowJobs } from './arbeitnow.service.js';

const SOURCE_HANDLERS = {
    adzuna: fetchAdzunaJobs,
    remotive: fetchRemotiveJobs,
    arbeitnow: fetchArbeitnowJobs
};

const normalizeSources = () => {
    const configured = (process.env.JOB_SOURCES || 'adzuna,remotive,arbeitnow')
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    const valid = configured.filter((name) => Boolean(SOURCE_HANDLERS[name]));
    return valid.length > 0 ? valid : ['adzuna', 'remotive', 'arbeitnow'];
};

const dedupeByExternalOrSemantic = (jobs = []) => {
    const seen = new Set();
    const result = [];

    for (const job of jobs) {
        const externalKey = String(job.externalJobId || '').trim().toLowerCase();
        const semanticKey = `${String(job.title || '').trim().toLowerCase()}|${String(job.company || '').trim().toLowerCase()}|${String(job.location || '').trim().toLowerCase()}`;
        const key = externalKey ? `ext:${externalKey}` : `sem:${semanticKey}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(job);
    }

    return result;
};

export const fetchJobsFromSources = async ({ keywords = '', location = '', resultsPerPage = 50 } = {}) => {
    const selectedSources = normalizeSources();
    const tasks = selectedSources.map(async (sourceName) => {
        const handler = SOURCE_HANDLERS[sourceName];
        if (!handler) return [];

        try {
            return await handler({ keywords, location, resultsPerPage });
        } catch (error) {
            console.error(`Source ${sourceName} failed:`, error?.message || error);
            return [];
        }
    });

    const chunks = await Promise.all(tasks);
    const merged = chunks.flat().filter((job) => job && job.title);
    return dedupeByExternalOrSemantic(merged);
};

export const jobSourceHandlers = SOURCE_HANDLERS;
