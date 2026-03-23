import Job from '../models/Job.js';
import dbService from '../utils/dbService.js';
import matchingEngine from '../utils/matchingEngine.js';
import { clearFeedCache } from '../utils/feedCache.js';

const CHUNK_SIZE = Number(process.env.MATCH_SCORE_CHUNK_SIZE || 20);

const chunk = (items = [], size = 20) => {
    const output = [];
    for (let i = 0; i < items.length; i += size) {
        output.push(items.slice(i, i + size));
    }
    return output;
};

const buildResumeCorpus = async () => {
    const users = await dbService.get('users');
    const resumes = users
        .map((user) => {
            const resumeText = String(user?.resumeText || '').trim();
            const primarySkillsText = Array.isArray(user?.primarySkills) && user.primarySkills.length
                ? `Primary skills: ${user.primarySkills.join(', ')}`
                : '';
            const secondarySkillsText = Array.isArray(user?.secondarySkills) && user.secondarySkills.length
                ? `Secondary skills: ${user.secondarySkills.join(', ')}`
                : '';
            const profileSkillsText = Array.isArray(user?.skills) && user.skills.length
                ? `Skills: ${user.skills.join(', ')}`
                : '';
            const resumeSkillsText = Array.isArray(user?.resumeSkills) && user.resumeSkills.length
                ? `Skills: ${user.resumeSkills.join(', ')}`
                : '';
            const experienceText = String(user?.experience || '').trim();
            const educationText = String(user?.education || '').trim();
            const keywordText = Array.isArray(user?.resumeKeywords) && user.resumeKeywords.length
                ? `Keywords: ${user.resumeKeywords.join(', ')}`
                : '';
            const preferredRoleText = String(user?.preferredRole || '').trim();
            const experienceLevelText = String(user?.experienceLevel || '').trim();
            const preferredJobTypeText = String(user?.preferredJobType || '').trim();
            const preferredWorkModeText = String(user?.preferredWorkMode || '').trim();
            const preferredLocationText = String(user?.preferredLocation || '').trim();
            const certificationsText = Array.isArray(user?.certifications) && user.certifications.length
                ? `Certifications: ${user.certifications.join(', ')}`
                : '';
            const languagesText = Array.isArray(user?.languagesKnown) && user.languagesKnown.length
                ? `Languages: ${user.languagesKnown.join(', ')}`
                : '';

            if (resumeText) {
                return [resumeText, resumeSkillsText, experienceText, educationText, keywordText]
                    .filter(Boolean)
                    .join('\n');
            }

            return [
                primarySkillsText,
                secondarySkillsText,
                profileSkillsText,
                preferredRoleText ? `Preferred role: ${preferredRoleText}` : '',
                experienceLevelText ? `Experience level: ${experienceLevelText}` : '',
                preferredJobTypeText ? `Preferred job type: ${preferredJobTypeText}` : '',
                preferredWorkModeText ? `Preferred work mode: ${preferredWorkModeText}` : '',
                preferredLocationText ? `Preferred location: ${preferredLocationText}` : '',
                certificationsText,
                languagesText
            ]
                .filter(Boolean)
                .join('\n');
        })
        .filter(Boolean);

    if (!resumes.length) {
        return 'React Node.js Python Java Backend Frontend Fullstack Internship Remote developer';
    }

    return resumes.slice(0, 50).join('\n\n');
};

export const refreshMatchScores = async () => {
    const resumeCorpus = await buildResumeCorpus();
    const jobs = await Job.find({ isActive: true })
        .select('id title description')
        .lean();

    const groups = chunk(jobs, CHUNK_SIZE);
    const scoreOps = [];

    for (const group of groups) {
        const scored = await Promise.all(group.map(async (job) => {
            const text = `${job.title || ''}\n${job.description || ''}`.trim();
            const match = await matchingEngine.analyzeMatch(resumeCorpus, text);
            return {
                id: job.id,
                matchScore: Number(match.score || 0),
                matchExplanation: match.explanation || null
            };
        }));

        for (const item of scored) {
            scoreOps.push({
                updateOne: {
                    filter: { id: item.id },
                    update: {
                        $set: {
                            matchScore: item.matchScore,
                            matchExplanation: item.matchExplanation,
                            scoreRefreshedAt: new Date(),
                            updatedAt: new Date()
                        }
                    }
                }
            });
        }
    }

    if (scoreOps.length) {
        await Job.bulkWrite(scoreOps, { ordered: false });
    }

    clearFeedCache();

    return {
        scoredJobs: jobs.length,
        updatedJobs: scoreOps.length,
        refreshedAt: new Date().toISOString()
    };
};

export default {
    refreshMatchScores
};
