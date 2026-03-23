import axios from 'axios';

const COMPANY_CAREERS = [
    {
        name: 'GitHub',
        url: 'https://github.com/about/careers',
        apiEndpoint: 'https://api.github.com/search/repositories?q=type:user+language:json+user:github'
    },
    {
        name: 'Google',
        url: 'https://careers.google.com/jobs/results/',
        apiEndpoint: 'https://www.google.com/careers/api/jobs'
    },
    {
        name: 'Microsoft',
        url: 'https://careers.microsoft.com/',
        apiEndpoint: 'https://careers.microsoft.com/us/en/api/jobs'
    },
    {
        name: 'Amazon',
        url: 'https://www.amazon.jobs/',
        apiEndpoint: 'https://www.amazon.jobs/api/jobs'
    },
    {
        name: 'Meta',
        url: 'https://www.metacareers.com/',
        apiEndpoint: 'https://www.metacareers.com/api/jobs'
    },
    {
        name: 'Apple',
        url: 'https://www.apple.com/careers/',
        apiEndpoint: 'https://www.apple.com/careers/api/jobs'
    }
];

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}, company = '') => ({
    id: `company-${company}-${job.id || Date.now()}`,
    externalId: String(job.jobId || job.id || ''),
    externalJobId: String(job.jobId || job.id || ''),
    title: job.title || job.position || '',
    company: company || 'Tech Company',
    location: job.location || 'Remote',
    category: 'Engineering',
    description: job.description || 'Career opportunity',
    applyUrl: job.url || job.applyUrl || '',
    redirect_url: job.url || job.applyUrl || '',
    postedDate: job.postedDate ? new Date(job.postedDate) : new Date(),
    created: job.postedDate || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: `${company} Careers`
});

export const fetchCompanyJobs = async ({ keyword = '', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    const allJobs = [];

    for (const company of COMPANY_CAREERS) {
        try {
            const response = await axios.get(company.apiEndpoint, {
                params: {
                    q: keyword || 'Software Engineer',
                    limit: resultsPerPage
                },
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const jobs = Array.isArray(response.data?.items)
                ? response.data.items
                : (Array.isArray(response.data?.jobs) ? response.data.jobs : []);

            const normalized = jobs.map((job) => normalizeJob(job, company.name));
            allJobs.push(...normalized);
        } catch (error) {
            console.error(`Company fetch failed for ${company.name}:`, error?.message || error);
        }
    }

    return allJobs.slice(0, resultsPerPage);
};
