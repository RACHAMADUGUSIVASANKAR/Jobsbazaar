import axios from 'axios';

const WELLFOUND_API = 'https://www.wellfound.com/api/opportunities';
const API_KEY = process.env.WELLFOUND_API_KEY;

const extractSkills = (text = '') => {
  const source = String(text || '').toLowerCase();
  const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
  return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (job = {}) => ({
  id: `wellfound-${job.id || Date.now()}`,
  externalId: String(job.id || ''),
  externalJobId: String(job.id || ''),
  title: job.title || '',
  company: job.company?.name || 'Unknown Company',
  location: job.location || 'Remote',
  category: 'Engineering',
  description: job.description || 'Startup opportunity',
  applyUrl: job.url || '',
  redirect_url: job.url || '',
  postedDate: job.created_at ? new Date(job.created_at) : new Date(),
  created: job.created_at || new Date().toISOString(),
  skills: extractSkills(`${job.title || ''} ${job.description || ''}`),
  salary_min: job.salary_min ?? null,
  salary_max: job.salary_max ?? null,
  contract_time: job.job_type === 'full_time' ? 'full_time' : 'full_time',
  source: 'Wellfound'
});

export const fetchWellfoundJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
  if (!API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(WELLFOUND_API, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        q: keyword,
        page,
        limit: resultsPerPage
      },
      timeout: 12000
    });

    const jobs = Array.isArray(response.data?.items) ? response.data.items : [];
    return jobs.map(normalizeJob);
  } catch (error) {
    console.error(`Wellfound fetch failed for '${keyword}':`, error?.message || error);
    return [];
  }
};
