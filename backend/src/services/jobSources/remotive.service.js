import axios from 'axios';

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs';
const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `remotive-${job.id}`,
    externalId: String(job.id || ''),
    externalJobId: String(job.id || ''),
    title: job.title || '',
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote',
    category: job.category || 'Engineering',
    description: job.description || 'No description available',
    applyUrl: job.url || '',
    redirect_url: job.url || '',
    postedDate: job.publication_date ? new Date(job.publication_date) : new Date(),
    created: job.publication_date || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'remote',
    source: 'Remotive'
});

export const fetchRemotiveJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 30 }) => {
    if (page > 1) return [];

    try {
        const response = await axios.get(REMOTIVE_URL, {
            params: { search: keyword, limit: Math.max(resultsPerPage, 100) },
            timeout: 10000
        });

        const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
        const normalized = jobs.map(normalizeJob);
        if (!country) return normalized;

        const countryLower = String(country).toLowerCase();
        return normalized.filter((job) => {
            const location = String(job.location || '').toLowerCase();
            return location.includes(countryLower) || location.includes('worldwide') || location.includes('remote');
        });
    } catch (error) {
        console.error(`Remotive fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
