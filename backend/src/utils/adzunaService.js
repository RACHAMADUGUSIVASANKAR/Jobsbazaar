import axios from 'axios';

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api/jobs';
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;
const DEFAULT_COUNTRIES = (process.env.JOB_FEED_COUNTRIES || 'us,in,gb,ca,au').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
const DEFAULT_PAGES_PER_COUNTRY = Number.parseInt(process.env.JOB_FEED_PAGES_PER_COUNTRY || '2', 10);

const mapAdzunaJob = (job) => ({
  id: job.id,
  title: job.title,
  company: job.company?.display_name || 'Unknown Company',
  location: job.location?.display_name || 'Remote',
  category: job.category?.label || 'Engineering',
  description: job.description || 'No description available',
  redirect_url: job.redirect_url,
  created: job.created,
  salary_min: job.salary_min,
  salary_max: job.salary_max,
  contract_time: job.contract_time || 'full_time',
  source: 'Adzuna'
});

const normalizeKeywords = (keywords = '') => String(keywords || '').trim();

const buildRemotiveSearchTerms = (keywords = '') => {
  const normalized = normalizeKeywords(keywords);
  const tokens = normalized
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

  const candidates = [normalized, ...tokens];

  // Phrase searches like "Software Engineer" can return empty results,
  // while broader single-term searches still return relevant jobs.
  if (normalized.toLowerCase() === 'software engineer') {
    candidates.unshift('software');
    candidates.push('engineer');
  }

  return [...new Set(candidates.filter(Boolean))].slice(0, 4);
};

const mapRemotiveJobs = (jobs = []) => {
  return jobs.map((job) => ({
    id: `remotive-${job.id}`,
    title: job.title,
    company: job.company_name || 'Unknown Company',
    location: job.candidate_required_location || 'Remote',
    category: job.category || 'Engineering',
    description: job.description || 'No description available',
    redirect_url: job.url,
    created: job.publication_date || new Date().toISOString(),
    salary_min: null,
    salary_max: null,
    contract_time: 'remote',
    source: 'Remotive'
  }));
};

const fetchRemotiveJobs = async ({ keywords = 'Software Engineer', results_per_page = 20 }) => {
  const url = 'https://remotive.com/api/remote-jobs';
  const terms = buildRemotiveSearchTerms(keywords);
  const merged = [];
  const seen = new Set();

  for (const term of terms) {
    const response = await axios.get(url, {
      params: {
        search: term,
        limit: results_per_page
      },
      timeout: 15000
    });

    const jobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
    const mapped = mapRemotiveJobs(jobs);
    for (const job of mapped) {
      const id = String(job.id);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(job);
      if (merged.length >= results_per_page) {
        return merged;
      }
    }
  }

  if (merged.length > 0) {
    return merged;
  }

  // Final fallback: no search term, return latest remote jobs.
  const fallbackResponse = await axios.get(url, {
    params: {
      limit: results_per_page
    },
    timeout: 15000
  });

  const fallbackJobs = Array.isArray(fallbackResponse.data?.jobs) ? fallbackResponse.data.jobs : [];
  return mapRemotiveJobs(fallbackJobs).slice(0, results_per_page);
};

const dedupeJobs = (jobs = []) => {
  const seen = new Set();
  const merged = [];
  for (const job of jobs) {
    const key = String(job.id || `${job.title}|${job.company}|${job.location}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(job);
  }
  return merged;
};

const fetchAdzunaPage = async ({ country, page, keywords, location, results_per_page }) => {
  const url = `${ADZUNA_BASE_URL}/${country}/search/${page}`;
  const params = {
    app_id: APP_ID,
    app_key: APP_KEY,
    results_per_page,
    what: keywords,
    where: location,
    content_type: 'application/json'
  };

  const response = await axios.get(url, { params, timeout: 20000 });
  const results = Array.isArray(response.data?.results) ? response.data.results : [];
  return results.map(mapAdzunaJob);
};

const adzunaService = {
  fetchJobs: async (query = {}) => {
    const {
      country = 'in',
      page = 1,
      countries = DEFAULT_COUNTRIES,
      pagesPerCountry = DEFAULT_PAGES_PER_COUNTRY,
      keywords = 'Software Engineer',
      location = '',
      results_per_page = 20
    } = query;

    const canUseAdzuna = Boolean(APP_ID && APP_KEY);
    const targetCountries = Array.isArray(countries) && countries.length > 0
      ? countries
      : [country];
    const safePagesPerCountry = Math.max(1, Math.min(5, Number.isFinite(pagesPerCountry) ? pagesPerCountry : 1));
    const safeResultsPerPage = Math.max(10, Math.min(50, Number.isFinite(results_per_page) ? results_per_page : 20));
    const targetTotal = safeResultsPerPage * targetCountries.length * safePagesPerCountry;

    if (!canUseAdzuna) {
      try {
        return await fetchRemotiveJobs({ keywords, results_per_page: Math.max(20, Math.min(200, targetTotal)) });
      } catch (fallbackError) {
        console.error('Remotive fallback error:', fallbackError.message);
        return [];
      }
    }

    try {
      const merged = [];
      for (const countryCode of targetCountries) {
        for (let pageNumber = 1; pageNumber <= safePagesPerCountry; pageNumber += 1) {
          try {
            const jobs = await fetchAdzunaPage({
              country: countryCode,
              page: pageNumber,
              keywords,
              location,
              results_per_page: safeResultsPerPage
            });
            merged.push(...jobs);
          } catch (pageError) {
            console.error(`Adzuna page fetch error (${countryCode}/page-${pageNumber}):`, pageError.response?.data || pageError.message);
          }
        }
      }

      const dedupedAdzuna = dedupeJobs(merged);
      if (dedupedAdzuna.length >= safeResultsPerPage) return dedupedAdzuna;

      const remotiveJobs = await fetchRemotiveJobs({ keywords, results_per_page: safeResultsPerPage });
      return dedupeJobs([...dedupedAdzuna, ...remotiveJobs]);
    } catch (error) {
      console.error('Adzuna API Error:', error.response?.data || error.message);
      try {
        return await fetchRemotiveJobs({ keywords, results_per_page: safeResultsPerPage });
      } catch (fallbackError) {
        console.error('Remotive fallback error:', fallbackError.message);
        return [];
      }
    }
  }
};

export default adzunaService;
