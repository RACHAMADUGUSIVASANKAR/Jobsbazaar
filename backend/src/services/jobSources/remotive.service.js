import axios from 'axios';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs';
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

const normalizeSearchTerms = (keywords = '') => {
    const base = String(keywords || '').trim();
    const tokens = base.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
    return [...new Set([base, ...tokens].filter(Boolean))].slice(0, 4);
};

const normalizeJob = (job = {}) => ({
    id: `remotive-${job.id}`,
    externalJobId: String(job.id || ''),
    title: job.title || '',
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote',
    category: job.category || 'Engineering',
    description: job.description || 'No description available',
    redirect_url: job.url || '',
    created: job.publication_date || new Date().toISOString(),
    salary_min: null,
    salary_max: null,
    contract_time: 'remote',
    source: 'Remotive'
});

export const fetchRemotiveJobs = async ({ keywords = 'Software Engineer', resultsPerPage = 30 }) => {
    const incomingTerms = String(keywords || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    const terms = [...new Set((incomingTerms.length ? incomingTerms : DEFAULT_KEYWORDS).flatMap((item) => normalizeSearchTerms(item)))];
    const seen = new Set();

    const termTasks = terms.map(async (term) => {
        try {
            const response = await axios.get(REMOTIVE_URL, {
                params: { search: term, limit: Math.max(resultsPerPage, 100) },
                timeout: 10000
            });
            const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
            return jobs.map(normalizeJob);
        } catch (error) {
            console.error(`Remotive fetch failed for term '${term}':`, error?.message || error);
            return [];
        }
    });

    const chunks = await Promise.all(termTasks);
    const merged = [];
    for (const job of chunks.flat()) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        merged.push(job);
    }

    return merged;
};
