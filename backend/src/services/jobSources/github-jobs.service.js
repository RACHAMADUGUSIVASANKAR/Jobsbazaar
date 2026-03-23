import axios from 'axios';

const GITHUB_JOBS_API = 'https://api.github.com/search/repositories?q=topic:jobs+language:json';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `github-${job.id || Date.now()}`,
    externalId: String(job.name || ''),
    externalJobId: String(job.id || ''),
    title: job.name ? job.name.replace(/-/g, ' ') : 'GitHub Job',
    company: 'GitHub',
    location: 'Remote',
    category: 'Engineering',
    description: job.description || 'Job listing from GitHub',
    applyUrl: job.html_url || '',
    redirect_url: job.html_url || '',
    postedDate: job.created_at ? new Date(job.created_at) : new Date(),
    created: job.created_at || new Date().toISOString(),
    skills: extractSkills(job.description || job.name || ''),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: 'GitHub Jobs'
});

export const fetchGitHubJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        const response = await axios.get(GITHUB_JOBS_API, {
            params: {
                per_page: resultsPerPage,
                sort: 'updated',
                order: 'desc'
            },
            timeout: 10000
        });

        const repos = Array.isArray(response.data?.items) ? response.data.items : [];
        return repos.map(normalizeJob);
    } catch (error) {
        console.error('GitHub Jobs fetch failed:', error?.message || error);
        return [];
    }
};
