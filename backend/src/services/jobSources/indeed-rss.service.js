import axios from 'axios';
import Parser from 'rss-parser';

const parser = new Parser();
const INDEED_RSS_URL = 'https://feeds.indeed.com/jobs';

const extractSkills = (text = '') => {
    const source = String(text || '').toLowerCase();
    const skillHints = ['react', 'node', 'python', 'java', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c#'];
    return skillHints.filter((skill) => source.includes(skill));
};

const normalizeJob = (item = {}) => ({
    id: `indeed-${item.guid || item.link || Date.now()}`,
    externalId: String(item.guid || item.link || ''),
    externalJobId: String(item.guid || item.link || ''),
    title: item.title || '',
    company: item.creator || 'Unknown Company',
    location: item.location || 'Remote',
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
    source: 'Indeed'
});

export const fetchIndeedJobs = async ({ keyword = 'Software Engineer', country = 'us', page = 1, resultsPerPage = 50 }) => {
    if (page > 1) return [];

    try {
        const url = `${INDEED_RSS_URL}?q=${encodeURIComponent(keyword)}&l=${encodeURIComponent(country)}&action=save`;
        const feed = await parser.parseURL(url);
        const items = feed.items ? feed.items.slice(0, resultsPerPage) : [];
        return items.map(normalizeJob);
    } catch (error) {
        console.error(`Indeed RSS fetch failed for '${keyword}' in ${country}:`, error?.message || error);
        return [];
    }
};
