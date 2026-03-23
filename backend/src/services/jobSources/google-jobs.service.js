import axios from 'axios';

const GOOGLE_JOBS_SEARCH = 'https://www.google.com/search';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
    id: `googlejobs-${job.jobId || Date.now()}`,
    externalId: String(job.jobId || ''),
    externalJobId: String(job.jobId || ''),
    title: job.title || '',
    company: job.companyName || 'Unknown Company',
    location: job.location || 'Remote',
    category: 'Engineering',
    description: job.description || 'Google Structured Data Job',
    applyUrl: job.jobUrl || '',
    redirect_url: job.jobUrl || '',
    postedDate: job.datePosted ? new Date(job.datePosted) : new Date(),
    created: job.datePosted || new Date().toISOString(),
    skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
    salary_min: job.baseSalary?.minValue ?? null,
    salary_max: job.baseSalary?.maxValue ?? null,
    contract_time: job.employmentType?.includes('FULL_TIME') ? 'full_time' : 'full_time',
    source: 'Google Jobs'
});

export const fetchGoogleJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        // Google Jobs search via structured data (limited functionality without API key)
        // Fallback: Return empty array or cached results
        // Note: Google Jobs API requires API key and is not freely available
        // This is a placeholder for potential future Google Jobs API integration
        console.warn('Google Jobs API requires authentication. Skipping for now.');
        return [];
    } catch (error) {
        console.error(`Google Jobs fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
