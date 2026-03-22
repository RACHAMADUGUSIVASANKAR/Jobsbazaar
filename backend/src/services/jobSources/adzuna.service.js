import axios from 'axios';

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
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
const DEFAULT_COUNTRIES = ['us', 'in', 'gb', 'ca', 'au', 'eu'];

const normalizeJob = (job = {}, country = 'in') => ({
    id: `adzuna-${country}-${job.id}`,
    externalJobId: String(job.id || ''),
    title: job.title || '',
    company: job.company?.display_name || 'Unknown Company',
    location: job.location?.display_name || 'Remote',
    category: job.category?.label || 'Engineering',
    description: job.description || 'No description available',
    redirect_url: job.redirect_url || '',
    created: job.created || new Date().toISOString(),
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    contract_time: job.contract_time || 'full_time',
    source: 'Adzuna'
});

const fetchCountryJobs = async ({ country, page, keywords, location, resultsPerPage }) => {
    const url = `${ADZUNA_BASE_URL}/${country}/search/${page}`;
    const response = await axios.get(url, {
        params: {
            app_id: APP_ID,
            app_key: APP_KEY,
            what: keywords,
            where: location,
            results_per_page: resultsPerPage,
            content_type: 'application/json'
        },
        timeout: 20000
    });

    const jobs = Array.isArray(response.data?.results) ? response.data.results : [];
    return jobs.map((job) => normalizeJob(job, country));
};

export const fetchAdzunaJobs = async ({ keywords = 'Software Engineer', location = '', resultsPerPage = 30 }) => {
    if (!APP_ID || !APP_KEY) {
        return [];
    }

    const countries = (process.env.JOB_FEED_COUNTRIES || DEFAULT_COUNTRIES.join(','))
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    const pagesToFetch = Number.parseInt(process.env.JOB_FEED_PAGES_PER_COUNTRY || '20', 10);
    const safePagesToFetch = Number.isFinite(pagesToFetch) ? Math.max(1, pagesToFetch) : 20;
    const pageList = Array.from({ length: safePagesToFetch }, (_, idx) => idx + 1);

    const keywordList = String(keywords || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    const effectiveKeywords = keywordList.length ? keywordList : DEFAULT_KEYWORDS;

    const tasks = [];
    for (const keyword of effectiveKeywords) {
        for (const country of countries) {
            for (const page of pageList) {
                tasks.push(
                    fetchCountryJobs({ country, page, keywords: keyword, location, resultsPerPage })
                        .catch((error) => {
                            console.error(`Adzuna fetch failed for ${country} page ${page} keyword '${keyword}':`, error?.message || error);
                            return [];
                        })
                );
            }
        }
    }

    const chunks = await Promise.all(tasks);
    return chunks.flat();
};
