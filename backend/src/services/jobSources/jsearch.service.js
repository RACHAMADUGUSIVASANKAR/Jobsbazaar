import axios from 'axios';

const JSEARCH_API_URL = 'https://jsearch.p.rapidapi.com/search';
const API_KEY = process.env.JSEARCH_API_KEY;
const API_HOST = 'jsearch.p.rapidapi.com';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'java', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `jsearch-${job.job_id || Date.now()}`,
    externalId: String(job.job_id || ''),
    externalJobId: String(job.job_id || ''),
    title: job.job_title || '',
    company: job.employer_name || 'Unknown Company',
    location: job.job_city ? `${job.job_city}, ${job.job_country || ''}`.trim() : (job.job_country || 'Remote'),
    category: 'Engineering',
    description: job.job_description || '',
    applyUrl: job.job_apply_link || '',
    redirect_url: job.job_apply_link || '',
    postedDate: job.job_posted_at_datetime_utc ? new Date(job.job_posted_at_datetime_utc) : new Date(),
    created: job.job_posted_at_datetime_utc || new Date().toISOString(),
    skills: extractSkills(`${job.job_title || ''} ${job.job_description || ''}`),
    salary_min: job.job_min_salary ?? null,
    salary_max: job.job_max_salary ?? null,
    contract_time: job.job_employment_type === 'FULLTIME' ? 'full_time' : (job.job_employment_type === 'PARTTIME' ? 'part_time' : 'full_time'),
    source: 'JSearch'
});

export const fetchJSearchJobs = async ({ keyword = 'Software Engineer', country = 'us', page = 1, resultsPerPage = 50 }) => {
    if (!API_KEY) {
        return [];
    }

    try {
        const response = await axios.get(JSEARCH_API_URL, {
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': API_HOST
            },
            params: {
                query: keyword,
                country,
                page,
                num_pages: resultsPerPage
            },
            timeout: 15000
        });

        const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
        return jobs.map(normalizeJob);
    } catch (error) {
        console.error(`JSearch fetch failed for '${keyword}' in ${country}:`, error?.message || error);
        return [];
    }
};
