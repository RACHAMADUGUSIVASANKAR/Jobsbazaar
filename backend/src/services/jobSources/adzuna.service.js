import axios from 'axios';

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const DEFAULT_COUNTRY = 'us';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}, country = 'in') => ({
    id: `adzuna-${country}-${job.id}`,
    externalId: String(job.id || ''),
    externalJobId: String(job.id || ''),
    title: job.title || '',
    company: job.company?.display_name || 'Unknown Company',
    location: job.location?.display_name || 'Remote',
    category: job.category?.label || 'Engineering',
    description: job.description || 'No description available',
    applyUrl: job.redirect_url || '',
    redirect_url: job.redirect_url || '',
    postedDate: job.created ? new Date(job.created) : new Date(),
    created: job.created || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    contract_time: job.contract_time || 'full_time',
    source: 'Adzuna'
});

export const fetchAdzunaJobs = async ({ keyword = 'Software Engineer', country = DEFAULT_COUNTRY, page = 1, location = '', resultsPerPage = 30 }) => {
    if (!APP_ID || !APP_KEY) {
        return [];
    }

    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}`;
    try {
        const response = await axios.get(url, {
            params: {
                app_id: APP_ID,
                app_key: APP_KEY,
                what: keyword,
                where: location,
                results_per_page: resultsPerPage,
                content_type: 'application/json'
            },
            timeout: 20000
        });

        const jobs = Array.isArray(response.data?.results) ? response.data.results : [];
        return jobs.map((job) => normalizeJob(job, country));
    } catch (error) {
        console.error(`Adzuna fetch failed for ${country}, page ${page}, keyword '${keyword}':`, error?.message || error);
        return [];
    }
};
