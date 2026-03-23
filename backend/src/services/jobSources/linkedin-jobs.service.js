import axios from 'axios';

const LINKEDIN_JOBS_API = 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `linkedin-${job.jobId || Date.now()}`,
    externalId: String(job.jobId || ''),
    externalJobId: String(job.jobId || ''),
    title: job.title || '',
    company: job.companyName || 'Unknown Company',
    location: job.location || 'Remote',
    category: 'Engineering',
    description: job.description || 'LinkedIn job opportunity',
    applyUrl: job.url || '',
    redirect_url: job.url || '',
    postedDate: job.listedDate ? new Date(job.listedDate) : new Date(),
    created: job.listedDate || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: 'LinkedIn'
});

export const fetchLinkedInJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        const response = await axios.get(LINKEDIN_JOBS_API, {
            params: {
                keywords: keyword,
                limit: resultsPerPage,
                start: 0
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const jobs = Array.isArray(response.data) ? response.data : [];
        return jobs.map(normalizeJob);
    } catch (error) {
        console.error(`LinkedIn fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
