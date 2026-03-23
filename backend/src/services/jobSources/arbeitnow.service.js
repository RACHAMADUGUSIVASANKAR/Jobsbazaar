import axios from 'axios';

const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';
const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `arbeitnow-${job.slug || job.title || Date.now()}`,
    externalId: String(job.slug || ''),
    externalJobId: String(job.slug || ''),
    title: job.title || '',
    company: job.company_name || 'Unknown Company',
    location: Array.isArray(job.location) ? job.location.join(', ') : (job.location || 'Remote'),
    category: Array.isArray(job.tags) ? job.tags.join(', ') : 'Engineering',
    description: job.description || 'No description available',
    applyUrl: job.url || '',
    redirect_url: job.url || '',
    postedDate: job.created_at ? new Date(job.created_at) : new Date(),
    created: job.created_at || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: job.remote ? 'remote' : 'full_time',
    source: 'Arbeitnow'
});

const matchesQuery = (job = {}, keywords = '', location = '') => {
    const jobText = `${job.title || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
    const locationText = `${job.location || ''}`.toLowerCase();
    const keywordOk = !keywords || jobText.includes(String(keywords).toLowerCase());
    const locationOk = !location || locationText.includes(String(location).toLowerCase());
    return keywordOk && locationOk;
};

export const fetchArbeitnowJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, location = '' }) => {
    if (page > 1) return [];

    try {
        const response = await axios.get(ARBEITNOW_URL, {
            timeout: 15000
        });

        const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
        const seen = new Set();
        const keywordText = String(keyword || '').trim();
        const effectiveLocation = location || country || '';
        const filtered = jobs.filter((job) => matchesQuery(job, keywordText, effectiveLocation));
        const merged = [];

        for (const job of filtered) {
            const normalized = normalizeJob(job);
            if (seen.has(normalized.id)) continue;
            seen.add(normalized.id);
            merged.push(normalized);
        }

        return merged;
    } catch (error) {
        console.error('Arbeitnow fetch failed:', error?.message || error);
        return [];
    }
};
