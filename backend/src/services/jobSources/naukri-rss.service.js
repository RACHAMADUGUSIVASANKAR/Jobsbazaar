import axios from 'axios';
import Parser from 'rss-parser';

const parser = new Parser();
const NAUKRI_RSS_URL = 'https://www.naukri.com/rss/jobs.xml';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (item = {}) => ({
    id: `naukri-${item.guid || item.link || Date.now()}`,
    externalId: String(item.guid || item.link || ''),
    externalJobId: String(item.guid || item.link || ''),
    title: item.title || '',
    company: item.creator || 'Unknown Company',
    location: item.location || 'India',
    category: 'Engineering',
    description: item.content || item.summary || item.description || '',
    applyUrl: item.link || '',
    redirect_url: item.link || '',
    postedDate: item.pubDate ? new Date(item.pubDate) : new Date(),
    created: item.pubDate || new Date().toISOString(),
    skills: extractSkills(`${item.title || ''} ${item.description || ''}`),
    salary_min: null,
    salary_max: null,
    contract_time: 'full_time',
    source: 'Naukri'
});

export const fetchNaukriJobs = async ({ keyword = 'Software Engineer', country = '', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        const feed = await parser.parseURL(NAUKRI_RSS_URL);
        const items = feed.items ? feed.items.slice(0, resultsPerPage) : [];
        const filtered = items.filter((item) => {
            const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
            return text.includes(keyword.toLowerCase());
        });
        return filtered.map(normalizeJob);
    } catch (error) {
        console.error(`Naukri RSS fetch failed for '${keyword}':`, error?.message || error);
        return [];
    }
};
