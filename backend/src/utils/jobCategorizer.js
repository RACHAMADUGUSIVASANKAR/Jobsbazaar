/**
 * Categorizes jobs into IT domains based on title, description, and skills
 */

const DOMAIN_KEYWORDS = {
    frontend: [
        'react', 'vue', 'angular', 'svelte', 'typescript', 'html', 'css',
        'next.js', 'remix', 'gatsby', 'tailwindcss', 'bootstrap',
        'frontend', 'ui', 'ux', 'web developer', 'web development',
        'javascript', 'css3', 'html5', 'progressive web app', 'pwa'
    ],
    backend: [
        'node.js', 'node', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'c#',
        'django', 'fastapi', 'flask', 'spring', '.net', 'asp.net',
        'backend developer', 'server-side', 'api developer',
        'database', 'sql', 'postgresql', 'mongodb', 'mysql', 'redis',
        'microservices', 'rest api', 'graphql'
    ],
    aiml: [
        'machine learning', 'deep learning', 'ai', 'artificial intelligence',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'hugging face',
        'nlp', 'natural language processing', 'computer vision',
        'ml engineer', 'data scientist', 'ai engineer',
        'neural network', 'model', 'training', 'inference',
        'mlops', 'llm', 'large language model', 'gpt', 'bert'
    ],
    cloud: [
        'aws', 'azure', 'gcp', 'google cloud', 'cloud',
        'kubernetes', 'docker', 'terraform', 'cloudformation',
        'cloud architect', 'infrastructure', 'devops',
        'serverless', 'lambda', 'containerization',
        'elastic', 'cdn', 'load balancing'
    ],
    data: [
        'data scientist', 'data analyst', 'data engineer',
        'tableau', 'power bi', 'looker', 'analytics',
        'sql', 'spark', 'hadoop', 'etl', 'dbt',
        'big data', 'data pipeline', 'data warehouse',
        'business intelligence', 'bi', 'data visualization'
    ],
    cybersecurity: [
        'cybersecurity', 'security', 'infosec', 'penetration tester', 'pentest',
        'siem', 'firewall', 'encryption', 'ssl', 'tls',
        'security engineer', 'security analyst', 'ethical hacker',
        'compliance', 'audit', 'vulnerability', 'threat'
    ],
    mobile: [
        'react native', 'flutter', 'swift', 'kotlin', 'ios', 'android',
        'mobile developer', 'mobile development', 'app developer',
        'android developer', 'ios developer', 'xamarin',
        'mobile app', 'cross-platform', 'native app'
    ],
    devops: [
        'devops', 'sre', 'site reliability engineer',
        'ci/cd', 'jenkins', 'gitlab', 'github actions', 'circleci',
        'infrastructure engineer', 'infrastructure automation',
        'monitoring', 'logging', 'prometheus', 'elasticsearch',
        'automation engineer'
    ],
    testing: [
        'qa', 'quality assurance', 'testing', 'test automation',
        'selenium', 'cypress', 'playwright', 'jest', 'mocha',
        'automation tester', 'test engineer', 'qa engineer',
        'manual testing', 'automated testing', 'e2e',
        'unit testing', 'integration testing'
    ],
    internship: [
        'internship', 'intern', 'graduate program', 'fresher',
        'entry-level', 'junior', 'trainee', 'apprentice',
        'campus', 'recent graduate', 'new graduate'
    ]
};

const DOMAIN_WEIGHTS = {
    title: 3,        // Title matches weighted higher
    description: 1,  // Description matches weighted normal
    skills: 2        // Skills field matches weighted slightly higher
};

/**
 * Score a piece of text for each domain
 */
const scoreText = (text = '', weight = 1) => {
    const normalizedText = String(text || '').toLowerCase();
    const scores = {};

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        let matches = 0;
        for (const keyword of keywords) {
            if (normalizedText.includes(keyword)) {
                matches += 1;
            }
        }
        scores[domain] = matches * weight;
    }

    return scores;
};

/**
 * Categorize a job into a single domain
 */
export const categorizeJob = (job = {}) => {
    const titleScores = scoreText(job.title || '', DOMAIN_WEIGHTS.title);
    const descriptionScores = scoreText(job.description || '', DOMAIN_WEIGHTS.description);

    const skillsText = Array.isArray(job.skills)
        ? job.skills.join(' ')
        : (typeof job.skills === 'string' ? job.skills : '');
    const skillsScores = scoreText(skillsText, DOMAIN_WEIGHTS.skills);

    // Merge scores
    const totalScores = {};
    for (const domain of Object.keys(DOMAIN_KEYWORDS)) {
        totalScores[domain] = (titleScores[domain] || 0)
            + (descriptionScores[domain] || 0)
            + (skillsScores[domain] || 0);
    }

    // Find domain with highest score
    let bestDomain = 'internship'; // Default fallback
    let bestScore = -1;

    for (const [domain, score] of Object.entries(totalScores)) {
        if (score > bestScore) {
            bestScore = score;
            bestDomain = domain;
        }
    }

    // If no matches at all, default to generic "Software Engineer"
    if (bestScore === 0) {
        bestDomain = 'backend'; // Default to backend for unclassified
    }

    return bestDomain;
};

export default {
    categorizeJob,
    DOMAIN_KEYWORDS
};
