import axios from 'axios';

const REMOTEOK_API = 'https://remoteok.com/api';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `remoteok-${job.id || Date.now()}`,
    externalId: String(job.id || ''),
    externalJobId: String(job.id || ''),
    title: job.title || '',
    company: job.company || 'Unknown Company',
    location: 'Remote',
    category: 'Engineering',
    description: job.description || 'Remote job opportunity',
    applyUrl: job.url || '',
    redirect_url: job.url || '',
    postedDate: job.date_posted ? new Date(job.date_posted * 1000) : new Date(),
    created: job.date_posted ? new Date(job.date_posted * 1000).toISOString() : new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: 'RemoteOK'
});

export const fetchRemoteOKJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        const response = await axios.get(REMOTEOK_API, {
            timeout: 12000
        });

        const jobs = Array.isArray(response.data) ? response.data.slice(0, resultsPerPage) : [];
        return jobs.map(normalizeJob);
    } catch (error) {
        console.error('RemoteOK fetch failed:', error?.message || error);
        return [];
    }
};
