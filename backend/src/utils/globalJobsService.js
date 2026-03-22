import axios from 'axios';

/**
 * Global Job Service - Aggregates jobs from multiple worldwide providers
 * Includes: Stack Overflow, GitHub Jobs, We Work Remotely, AngelList, Reed, JustJoined, and more
 */

const SOURCES = {
    STACK_OVERFLOW: 'Stack Overflow',
    GITHUB: 'GitHub Jobs',
    WE_WORK_REMOTELY: 'We Work Remotely',
    ANGELLIST: 'AngelList',
    REED: 'Reed',
    JUST_JOINED: 'JustJoined',
    INDEED: 'Indeed',
    JOB_TITLE: 'JobTitle'
};

const API_TIMEOUTS = {
    DEFAULT: 8000,
    LONG: 10000
};

/**
 * Fetch Stack Overflow jobs via their public API
 */
const fetchStackOverflowJobs = async (searchTerms = 'software engineer', location = '') => {
    try {
        // Stack Overflow API allows filtering by tag and location query
        const tags = ['javascript', 'python', 'typescript', 'react', 'nodejs'].slice(0, 2);
        const tagParam = tags.join(';');

        const response = await axios.get('https://api.stackexchange.com/2.3/jobs', {
            params: {
                site: 'stackoverflow',
                tagged: tagParam,
                sort: 'creation',
                order: 'desc',
                pagesize: 30
            },
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data.items || []).map(job => ({
            id: `stackoverflow-${job.job_id}`,
            title: job.title || '',
            company: job.company_name || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description_excerpt || '',
            redirect_url: job.link || '',
            salary_min: null,
            salary_max: null,
            contract_time: 'Full Time',
            source: SOURCES.STACK_OVERFLOW,
            created: new Date(job.creation_date * 1000).toISOString(),
            posted: new Date(job.creation_date * 1000).toISOString(),
            category: 'Software Development'
        }));
    } catch (error) {
        console.warn('Stack Overflow fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch GitHub Jobs (free public API)
 */
const fetchGitHubJobs = async (searchTerms = 'javascript', location = '') => {
    try {
        const response = await axios.get('https://jobs.github.com/positions.json', {
            params: {
                description: searchTerms,
                location: location || '',
                page: 1
            },
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (Array.isArray(response.data) ? response.data : []).map(job => ({
            id: `github-${job.id}`,
            title: job.title || '',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description || '',
            redirect_url: job.url || '',
            salary_min: null,
            salary_max: null,
            contract_time: job.type || 'Full Time',
            source: SOURCES.GITHUB,
            created: new Date(job.created_at).toISOString(),
            posted: new Date(job.created_at).toISOString(),
            category: 'Software Development'
        }));
    } catch (error) {
        console.warn('GitHub Jobs fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch We Work Remotely jobs
 */
const fetchWeWorkRemotelyJobs = async (searchTerms = 'software', location = '') => {
    try {
        // We Work Remotely has a job board endpoint
        const response = await axios.get('https://weworkremotely.com/api/v1/jobs', {
            params: {
                job_title: searchTerms,
                category: 'software-development'
            },
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data.jobs || []).map(job => ({
            id: `weWorkRemotely-${job.id}`,
            title: job.title || '',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.description || '',
            redirect_url: job.url || '',
            salary_min: job.salary_min || null,
            salary_max: job.salary_max || null,
            contract_time: 'Full Time',
            source: SOURCES.WE_WORK_REMOTELY,
            created: new Date(job.published_at).toISOString(),
            posted: new Date(job.published_at).toISOString(),
            category: 'Remote Jobs'
        }));
    } catch (error) {
        console.warn('We Work Remotely fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch AngelList startup jobs
 */
const fetchAngelListJobs = async (searchTerms = 'software engineer', location = '') => {
    try {
        // AngelList API endpoint for jobs
        const response = await axios.post('https://api.angel.co/graphql', {
            query: `
        query {
          jobSearchResults(
            filters: {
              keywords: "${searchTerms}"
              jobTypes: [FULL_TIME]
            }
            first: 20
          ) {
            nodes {
              id
              title
              description
              locationNames
              company {
                name
                url
              }
              url
              publishedAt
            }
          }
        }
      `
        }, {
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data?.data?.jobSearchResults?.nodes || []).map(job => ({
            id: `angellist-${job.id}`,
            title: job.title || '',
            company: job.company?.name || 'Unknown Company',
            location: (job.locationNames || []).join(', ') || 'Remote',
            description: job.description || '',
            redirect_url: job.url || job.company?.url || '',
            salary_min: null,
            salary_max: null,
            contract_time: 'Full Time',
            source: SOURCES.ANGELLIST,
            created: new Date(job.publishedAt).toISOString(),
            posted: new Date(job.publishedAt).toISOString(),
            category: 'Startup Jobs'
        }));
    } catch (error) {
        console.warn('AngelList fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch JustJoined jobs (UK-based)
 */
const fetchJustJoinedJobs = async (searchTerms = 'software', location = '') => {
    try {
        const response = await axios.get('https://www.justjoined.com/api/jobs', {
            params: {
                q: searchTerms,
                location: location || 'UK',
                limit: 30
            },
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data.data || []).map(job => ({
            id: `justjoined-${job.id}`,
            title: job.title || '',
            company: job.company || 'Unknown Company',
            location: job.location || 'UK',
            description: job.description || '',
            redirect_url: job.link || '',
            salary_min: job.salary_min || null,
            salary_max: job.salary_max || null,
            contract_time: job.job_type || 'Full Time',
            source: SOURCES.JUST_JOINED,
            created: new Date(job.posted_at).toISOString(),
            posted: new Date(job.posted_at).toISOString(),
            category: 'Tech Jobs'
        }));
    } catch (error) {
        console.warn('JustJoined fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch Reed.co.uk jobs (UK tech jobs with salary data)
 */
const fetchReedJobs = async (searchTerms = 'software engineer', location = 'UK') => {
    try {
        const reedApiKey = process.env.REED_API_KEY || '';
        const response = await axios.get('https://www.reed.co.uk/api/1.0/search', {
            params: {
                keywords: searchTerms,
                locationName: location,
                resultsToTake: 30
            },
            timeout: API_TIMEOUTS.DEFAULT,
            auth: reedApiKey ? { username: reedApiKey, password: '' } : undefined,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data.results || []).map(job => ({
            id: `reed-${job.jobId}`,
            title: job.jobTitle || '',
            company: job.employerName || 'Unknown Company',
            location: job.locationName || 'UK',
            description: job.jobDescription || '',
            redirect_url: job.jobUrl || '',
            salary_min: job.minimumSalary || null,
            salary_max: job.maximumSalary || null,
            contract_time: job.contractType || 'Full Time',
            source: SOURCES.REED,
            created: new Date(job.datePosted).toISOString(),
            posted: new Date(job.datePosted).toISOString(),
            category: 'Tech Recruiter'
        }));
    } catch (error) {
        console.warn('Reed.co.uk fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch Indeed jobs via unofficial API
 */
const fetchIndeedJobs = async (searchTerms = 'software engineer', location = 'worldwide') => {
    try {
        const response = await axios.get('https://api.indeed.com/ads/apisearch', {
            params: {
                publisher: process.env.INDEED_PUBLISHER_ID || 'demo',
                q: searchTerms,
                l: location,
                sort: 'date',
                limit: 30,
                format: 'json'
            },
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        return (response.data.results || []).map(job => ({
            id: `indeed-${job.jobkey}`,
            title: job.jobtitle || '',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            description: job.snippet || '',
            redirect_url: job.url || '',
            salary_min: null,
            salary_max: null,
            contract_time: 'Full Time',
            source: SOURCES.INDEED,
            created: new Date(job.date).toISOString(),
            posted: new Date(job.date).toISOString(),
            category: 'Job Board'
        }));
    } catch (error) {
        console.warn('Indeed fetch failed:', error.message);
        return [];
    }
};

/**
 * Fetch from HackerNews jobs (unofficial aggregator)
 */
const fetchHackerNewsJobs = async (searchTerms = 'software engineer', location = '') => {
    try {
        const response = await axios.get('https://news.ycombinator.com/jobs.rss', {
            timeout: API_TIMEOUTS.DEFAULT,
            headers: { 'User-Agent': 'ai-job-tracker' }
        });

        // Parse RSS feed manually or use xml parser
        // For now, return empty since parsing requires xml parsing library
        return [];
    } catch (error) {
        console.warn('Hacker News fetch failed:', error.message);
        return [];
    }
};

/**
 * Deduplicate jobs by title + company + location
 */
const deduplicateJobs = (jobs) => {
    const seen = new Map();
    const result = [];

    for (const job of jobs) {
        const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
        if (!seen.has(key)) {
            seen.set(key, true);
            result.push(job);
        }
    }

    return result;
};

/**
 * Main export function: Fetch jobs from all providers and merge
 */
const fetchGlobalJobs = async (searchTerms = 'software engineer', location = '') => {
    try {
        const providers = [
            fetchStackOverflowJobs(searchTerms, location),
            fetchGitHubJobs(searchTerms, location),
            fetchWeWorkRemotelyJobs(searchTerms, location),
            fetchAngelListJobs(searchTerms, location),
            fetchJustJoinedJobs(searchTerms, location),
            fetchReedJobs(searchTerms, location),
            fetchIndeedJobs(searchTerms, location)
        ];

        // Run all providers in parallel
        const results = await Promise.allSettled(providers);
        const allJobs = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allJobs.push(...result.value);
            } else {
                console.warn(`Provider ${index} failed or rejected`);
            }
        });

        // Deduplicate and return
        return deduplicateJobs(allJobs);
    } catch (error) {
        console.error('Global jobs fetch failed:', error);
        return [];
    }
};

export {
    fetchGlobalJobs,
    fetchStackOverflowJobs,
    fetchGitHubJobs,
    fetchWeWorkRemotelyJobs,
    fetchAngelListJobs,
    fetchJustJoinedJobs,
    fetchReedJobs,
    fetchIndeedJobs,
    deduplicateJobs,
    SOURCES
};
