import crypto from 'crypto';
import { fetchJobsFromSources } from './jobSources/index.js';
import { categorizeJob } from '../utils/jobCategorizer.js';

const DEFAULT_KEYWORDS = [
    // Frontend
    'React', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'HTML', 'CSS',
    'Next.js', 'Remix', 'Gatsby', 'Web Developer', 'Frontend Developer',
    // Backend
    'Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'Ruby', 'C#',
    'Django', 'FastAPI', 'Flask', 'Spring', '.NET',
    'Backend Developer', 'API Developer',
    // AI/ML
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP',
    'AI Engineer', 'ML Engineer', 'Data Scientist',
    // Cloud
    'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker', 'Terraform',
    'Cloud Architect', 'DevOps Engineer',
    // Data
    'Data Analyst', 'Analytics', 'Tableau', 'Power BI', 'Spark',
    // Cyber
    'Cybersecurity', 'Security Engineer', 'Penetration Tester',
    // Mobile
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android',
    // Other
    'QA Engineer', 'SRE', 'CI/CD', 'Fullstack', 'Internship',
    'Software Engineer', 'Developer', 'Engineer',
    // Domains
    'Blockchain', 'Embedded', 'Game Developer'
];

const DEFAULT_COUNTRIES = [
    'us', 'in', 'gb', 'ca', 'au', 'de', 'fr', 'nl', 'sg',
    'jp', 'au', 'br', 'mx', 'ie', 'nz'
];

const DEFAULT_PAGE_END = 3;

const parseList = (value = '', fallback = []) => {
    const parsed = String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length ? parsed : fallback;
};

const createPageRange = (end = DEFAULT_PAGE_END) => {
    const safeEnd = Number.isFinite(Number(end)) ? Math.max(1, Number(end)) : DEFAULT_PAGE_END;
    return Array.from({ length: safeEnd }, (_, index) => index + 1);
};

const stableSignature = ({ title = '', company = '', location = '' } = {}) => {
    const raw = `${String(title).trim().toLowerCase()}|${String(company).trim().toLowerCase()}|${String(location).trim().toLowerCase()}`;
    return crypto.createHash('sha1').update(raw).digest('hex');
};

const dedupeJobs = (jobs = []) => {
    const seen = new Set();
    const deduped = [];

    for (const job of jobs) {
        const externalId = String(job.externalId || job.externalJobId || '').trim().toLowerCase();
        const signature = stableSignature(job);
        const key = externalId ? `ext:${externalId}` : `sig:${signature}`;
        if (seen.has(key)) continue;

        seen.add(key);
        deduped.push({
            ...job,
            dedupeHash: signature
        });
    }

    return deduped;
};

export const aggregateJobsFromSources = async ({
    keywords,
    countries,
    location = '',
    pageEnd,
    resultsPerPage = 50
} = {}) => {
    const keywordList = keywords && keywords.length
        ? keywords
        : parseList(process.env.JOB_FEED_KEYWORDS, DEFAULT_KEYWORDS);
    const countryList = countries && countries.length
        ? countries
        : parseList(process.env.JOB_FEED_COUNTRIES, DEFAULT_COUNTRIES);
    const pages = createPageRange(pageEnd || process.env.JOB_FEED_PAGE_END || DEFAULT_PAGE_END);

    // Build fetch tasks for keyword × country × page combinations
    const fetchTasks = [];
    for (const keyword of keywordList) {
        for (const country of countryList) {
            for (const page of pages) {
                fetchTasks.push(async () => {
                    try {
                        return await fetchJobsFromSources({
                            keyword,
                            country,
                            page,
                            location,
                            resultsPerPage
                        });
                    } catch (error) {
                        console.error(`Fetch failed for "${keyword}" in ${country} page ${page}:`, error?.message || error);
                        return [];
                    }
                });
            }
        }
    }

    // Execute all tasks in parallel
    const allResults = await Promise.all(fetchTasks.map((task) => task()));

    // Merge and dedupe results
    const merged = allResults.flat().filter((job) => job && job.title);
    const deduped = dedupeJobs(merged);

    // Categorize each job
    const categorized = deduped.map((job) => ({
        ...job,
        category: categorizeJob(job)
    }));

    return categorized;
};

export const aggregatorDefaults = {
    keywords: DEFAULT_KEYWORDS,
    countries: DEFAULT_COUNTRIES,
    pageEnd: DEFAULT_PAGE_END
};
