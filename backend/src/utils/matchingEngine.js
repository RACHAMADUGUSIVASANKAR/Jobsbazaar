import crypto from 'crypto';
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Fallback cosine similarity if LangChain export fails
const calculateCosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const embeddings = GEMINI_API_KEY
  ? new GoogleGenerativeAIEmbeddings({
    apiKey: GEMINI_API_KEY,
    modelName: "embedding-001",
  })
  : null;

const CACHE_TTL_MS = 30 * 60 * 1000;
const analysisCache = new Map();
const vectorCache = new Map();

const stableHash = (value = '') => {
  return crypto.createHash('sha1').update(String(value || '').slice(0, 8000)).digest('hex');
};

const getFromCache = (store, key) => {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.value;
};

const setInCache = (store, key, value) => {
  store.set(key, { value, ts: Date.now() });
};

const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'react', 'node.js', 'node', 'express', 'fastify', 'mongodb', 'sql', 'postgresql',
  'mysql', 'python', 'java', 'c++', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'rest', 'graphql',
  'html', 'css', 'redux', 'next.js', 'vite', 'testing', 'jest', 'cypress'
];

const normalizeText = (text = '') => String(text).toLowerCase();

const toWords = (text = '') => {
  return normalizeText(text)
    .replace(/[^a-z0-9\s+#.]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
};

const uniq = (items = []) => [...new Set(items)];

const extractSkills = (text = '') => {
  const source = normalizeText(text);
  return SKILL_KEYWORDS.filter((skill) => source.includes(skill));
};

const extractKeywords = (text = '', minLength = 4) => {
  const stop = new Set(['with', 'from', 'this', 'that', 'have', 'your', 'will', 'role', 'team', 'work', 'ability', 'experience']);
  return uniq(toWords(text).filter((w) => w.length >= minLength && !stop.has(w))).slice(0, 40);
};

const extractExplicitYears = (text = '') => {
  const lower = normalizeText(text);
  const matches = [...lower.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)/g)];
  const values = matches
    .map((match) => Number.parseInt(match[1], 10))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return Math.max(...values);
};

const parseInputs = (resumeText = '', jobDescription = '') => ({
  resumeText: String(resumeText || '').trim(),
  jobDescription: String(jobDescription || '').trim()
});

const extractSignals = ({ resumeText, jobDescription }) => {
  const resumeSkills = extractSkills(resumeText);
  const jobSkills = extractSkills(jobDescription);

  const resumeKeywords = extractKeywords(resumeText);
  const jobKeywords = extractKeywords(jobDescription);
  const matchedKeywords = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword));

  return {
    resumeSkills,
    jobSkills,
    resumeKeywords,
    jobKeywords,
    matchedKeywords
  };
};

const embedTexts = async ({ resumeText, jobDescription }) => {
  const [resumeVector, jobVector] = await Promise.all([
    embeddings.embedQuery(resumeText.substring(0, 4000)),
    embeddings.embedQuery(jobDescription.substring(0, 4000))
  ]);

  return { resumeVector, jobVector };
};

const computeSimilarity = ({ resumeVector, jobVector }) => {
  const similarity = calculateCosineSimilarity(resumeVector, jobVector);
  return Number.isFinite(similarity) ? similarity : 0;
};

const heuristicSimilarity = ({ resumeKeywords, jobKeywords }) => {
  if (!resumeKeywords.length || !jobKeywords.length) return 0.35;
  const overlapCount = jobKeywords.filter((keyword) => resumeKeywords.includes(keyword)).length;
  return Math.min(0.9, Math.max(0.2, overlapCount / Math.max(1, jobKeywords.length)));
};

const getCachedVector = async (text = '') => {
  const key = stableHash(text);
  const cached = getFromCache(vectorCache, key);
  if (cached) return cached;

  const vector = await embeddings.embedQuery(String(text || '').substring(0, 4000));
  setInCache(vectorCache, key, vector);
  return vector;
};

const normalizeScore = ({ similarity, resumeSkills, jobSkills, matchedKeywords }) => {
  const baseScore = Math.round(similarity * 100);
  const skillOverlap = jobSkills.filter((skill) => resumeSkills.includes(skill)).length;
  const keywordBoost = Math.min(matchedKeywords.length, 5) * 2;
  const overlapBoost = Math.min(skillOverlap * 3, 15);
  const finalScore = baseScore + overlapBoost + keywordBoost;
  return Math.min(Math.max(finalScore, 0), 100);
};

const buildAtsBreakdown = ({ score, resumeSkills, jobSkills, matchedKeywords }) => {
  const overlappingSkillsCount = jobSkills.filter((skill) => resumeSkills.includes(skill)).length;
  const overlap = jobSkills.length > 0
    ? Math.round((overlappingSkillsCount / jobSkills.length) * 100)
    : 0;
  const keywordDensity = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, jobSkills.length || 5)) * 100));

  return {
    skillMatch: Math.max(overlap, Math.min(100, score)),
    keywordDensity
  };
};

const buildExplanation = ({ resumeText, jobDescription, resumeSkills, jobSkills, matchedKeywords, score }) => {
  const matchingSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));
  const resumeYears = extractExplicitYears(resumeText);
  const jobYears = extractExplicitYears(jobDescription);

  const skillEvidence = `${matchingSkills.length} of ${jobSkills.length || 0} detected job skills are present in your resume.`;

  let experienceRelevance = 'No explicit years-of-experience statement was detected in the resume text.';
  let experienceGap = 'Unknown';
  if (resumeYears !== null && jobYears !== null) {
    if (resumeYears >= jobYears) {
      experienceRelevance = `Resume explicitly mentions ${resumeYears} years, and the job description mentions ${jobYears} years.`;
      experienceGap = 'Low';
    } else {
      experienceRelevance = `Resume explicitly mentions ${resumeYears} years, while the job description mentions ${jobYears} years.`;
      experienceGap = 'Moderate';
    }
  } else if (resumeYears !== null) {
    experienceRelevance = `Resume explicitly mentions ${resumeYears} years of experience.`;
  }

  const domainGap = missingSkills.length > 2 ? 'Moderate' : 'Low';

  const topMissing = missingSkills.slice(0, 3);
  const suggestion = topMissing.length > 0
    ? `Consider adding evidence for: ${topMissing.join(', ')}.`
    : 'Your core skills align well. Highlight measurable outcomes in projects.';
  const atsBreakdown = buildAtsBreakdown({
    score,
    resumeSkills,
    jobSkills,
    matchedKeywords
  });

  return {
    matchingSkills: matchingSkills.slice(0, 6),
    matchedKeywords: matchedKeywords.slice(0, 10),
    skillEvidence,
    experienceRelevance,
    experienceGap,
    domainGap,
    missingSkills: missingSkills.slice(0, 6),
    atsBreakdown,
    suggestions: suggestion
  };
};

const matchingEngine = {
  analyzeMatch: async (resumeText, jobDescription) => {
    const parsed = parseInputs(resumeText, jobDescription);
    const analysisKey = `${stableHash(parsed.resumeText)}:${stableHash(parsed.jobDescription)}`;
    const cachedAnalysis = getFromCache(analysisCache, analysisKey);
    if (cachedAnalysis) return cachedAnalysis;

    if (!parsed.resumeText || !parsed.jobDescription) {
      const response = {
        score: 0,
        explanation: {
          matchingSkills: [],
          matchedKeywords: [],
          experienceRelevance: 'Insufficient data for analysis.',
          experienceGap: 'Unknown',
          domainGap: 'Unknown',
          missingSkills: [],
          atsBreakdown: {
            skillMatch: 0,
            keywordDensity: 0
          },
          suggestions: 'Upload a detailed resume and open a complete job description.'
        },
        pipeline: {
          extracted: false,
          parsed: true,
          embeddings: false,
          similarity: 0,
          normalized: 0
        }
      };
      setInCache(analysisCache, analysisKey, response);
      return response;
    }

    try {
      const signals = extractSignals(parsed);
      let similarity = 0;

      if (embeddings) {
        const [resumeVector, jobVector] = await Promise.all([
          getCachedVector(parsed.resumeText),
          getCachedVector(parsed.jobDescription)
        ]);
        similarity = computeSimilarity({ resumeVector, jobVector });
      } else {
        similarity = heuristicSimilarity(signals);
      }

      const score = normalizeScore({ similarity, ...signals });
      const explanation = buildExplanation({ resumeText: parsed.resumeText, jobDescription: parsed.jobDescription, score, ...signals });

      const response = {
        score,
        explanation,
        pipeline: {
          extracted: true,
          parsed: true,
          embeddings: Boolean(embeddings),
          similarity,
          normalized: score
        }
      };
      setInCache(analysisCache, analysisKey, response);
      return response;
    } catch (error) {
      console.error('Matching Error:', error);
      const signals = extractSignals(parsed);
      const similarity = heuristicSimilarity(signals);
      const score = normalizeScore({ similarity, ...signals });
      const response = {
        score,
        explanation: buildExplanation({ resumeText: parsed.resumeText, jobDescription: parsed.jobDescription, score, ...signals }),
        pipeline: {
          extracted: true,
          parsed: true,
          embeddings: false,
          similarity,
          normalized: score
        }
      };
      setInCache(analysisCache, analysisKey, response);
      return response;
    }
  },

  calculateScore: async (resumeText, jobDescription) => {
    const result = await matchingEngine.analyzeMatch(resumeText, jobDescription);
    return result.score;
  },

  getExplanation: async (resumeText, jobDescription) => {
    const result = await matchingEngine.analyzeMatch(resumeText, jobDescription);
    return result.explanation;
  }
};

export default matchingEngine;
