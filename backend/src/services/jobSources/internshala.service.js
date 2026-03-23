import axios from 'axios';

const INTERNSHALA_API = 'https://api.internshala.com/jobs/';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `internshala-${job.id || Date.now()}`,
    externalId: String(job.id || ''),
    externalJobId: String(job.id || ''),
    title: job.title || job.job_title || 'Job',
    company: job.company_name || job.company || 'Unknown Company',
    location: job.location || 'India',
    category: 'Internship',
    description: job.description || job.job_description || 'Internship opportunity',
    applyUrl: job.url || job.job_url || '',
    redirect_url: job.url || job.job_url || '',
    postedDate: job.posted_on ? new Date(job.posted_on) : new Date(),
    created: job.posted_on || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'internship',
    source: 'Internshala'
});

export const fetchInternshalaJobs = async ({ keyword = 'Software', country = 'in', page = 1, resultsPerPage = 50 }) => {
    try {
        const response = await axios.get(INTERNSHALA_API, {
            params: {
                q: keyword,
                page,
                no_of_jobs: resultsPerPage
            },
            timeout: 12000
        });

        const jobs = Array.isArray(response.data?.internships) ? response.data.internships : [];
        return jobs.map(normalizeJob);
    } catch (error) {
        console.error(`Internshala fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
