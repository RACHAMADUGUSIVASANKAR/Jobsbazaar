import axios from 'axios';

const ARBEITNOW_URL = 'https://www.arbeitnow.com/api/job-board-api';
const DEFAULT_KEYWORDS = [
    'React',
    'Node.js',
    'Python',
    'Java',
    'Full-stack',
    'Backend',
    'Frontend',
    'AI engineer',
    'Internship',
    'Remote developer'
];

const normalizeJob = (job = {}) => ({
    id: `arbeitnow-${job.slug || job.title || Date.now()}`,
    externalJobId: String(job.slug || ''),
    title: job.title || '',
    company: job.company_name || 'Unknown Company',
    location: Array.isArray(job.location) ? job.location.join(', ') : (job.location || 'Remote'),
    category: Array.isArray(job.tags) ? job.tags.join(', ') : 'Engineering',
    description: job.description || 'No description available',
    redirect_url: job.url || '',
    created: job.created_at || new Date().toISOString(),
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

export const fetchArbeitnowJobs = async ({ keywords = 'Software Engineer', location = '', resultsPerPage = 30 }) => {
    try {
        const response = await axios.get(ARBEITNOW_URL, {
            timeout: 15000
        });

        const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
        const keywordList = String(keywords || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        const effectiveKeywords = keywordList.length ? keywordList : DEFAULT_KEYWORDS;

        const seen = new Set();
        const merged = [];
        for (const keyword of effectiveKeywords) {
            const filtered = jobs.filter((job) => matchesQuery(job, keyword, location));
            for (const job of filtered) {
                const normalized = normalizeJob(job);
                if (seen.has(normalized.id)) continue;
                seen.add(normalized.id);
                merged.push(normalized);
            }
        }

        return merged;
    } catch (error) {
        console.error('Arbeitnow fetch failed:', error?.message || error);
        return [];
    }
};
