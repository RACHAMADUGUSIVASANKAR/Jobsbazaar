import axios from 'axios';

const FRESHERSWORLD_API = 'https://freshersworld.com/jobs/api';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `freshersworld-${job.jobId || Date.now()}`,
    externalId: String(job.jobId || ''),
    externalJobId: String(job.jobId || ''),
    title: job.jobTitle || '',
    company: job.companyName || 'Unknown Company',
    location: job.jobLocation || 'India',
    category: 'Internship',
    description: job.jobDescription || 'Fresher job opportunity',
    applyUrl: job.applyUrl || '',
    redirect_url: job.applyUrl || '',
    postedDate: job.postedDate ? new Date(job.postedDate) : new Date(),
    created: job.postedDate || new Date().toISOString(),
    skills: extractSkills(`${job.jobTitle || ''} ${job.jobDescription || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: 'Freshersworld'
});

export const fetchFreshersWorldJobs = async ({ keyword = 'Software', country = 'in', page = 1, resultsPerPage = 50 }) => {
    try {
        const response = await axios.get(FRESHERSWORLD_API, {
            params: {
                keyword,
                page,
                limit: resultsPerPage
            },
            timeout: 12000
        });

        const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
        return jobs.map(normalizeJob);
    } catch (error) {
        console.error(`Freshersworld fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
