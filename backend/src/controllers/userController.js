import dbService from '../utils/dbService.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import User from '../models/User.js';
import { syncLiveJobs } from '../utils/jobSyncService.js';
import { refreshMatchScores } from '../workers/matchScoreWorker.js';
import { computeOnboardingState, normalizeSkills } from '../utils/onboarding.js';

const SKILL_TAXONOMY = {
    JavaScript: ['javascript', 'js', 'ecmascript'],
    TypeScript: ['typescript', 'ts'],
    'Node.js': ['node', 'nodejs', 'node.js'],
    React: ['react', 'react.js', 'reactjs'],
    'Next.js': ['next', 'nextjs', 'next.js'],
    Python: ['python', 'py'],
    'Machine Learning': ['machine learning', 'ml'],
    'Deep Learning': ['deep learning', 'dl'],
    'MongoDB': ['mongodb', 'mongo'],
    SQL: ['sql', 'postgres', 'mysql'],
    AWS: ['aws', 'amazon web services'],
    Docker: ['docker'],
    Kubernetes: ['kubernetes', 'k8s'],
    Git: ['git', 'github', 'gitlab'],
    Express: ['express', 'express.js'],
    Fastify: ['fastify']
};

const EXPERIENCE_PATTERNS = [
    /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi,
    /experience\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi,
    /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+in\b/gi
];

const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'that', 'from', 'this', 'your', 'you', 'are', 'have', 'has', 'job', 'role', 'work', 'team', 'using', 'into', 'will', 'our'
]);

const sanitizeText = (value = '') => String(value || '').trim();
const normalizeWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return [...new Set(value.map((item) => sanitizeText(item)).filter(Boolean))];
    }

    if (typeof value === 'string') {
        return [...new Set(value.split(',').map((item) => sanitizeText(item)).filter(Boolean))];
    }

    return [];
};

const canonicalizeSkill = (value = '') => {
    const normalized = sanitizeText(value).toLowerCase();
    if (!normalized) return '';

    for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
        if (aliases.includes(normalized)) return canonical;
    }

    return normalizeWhitespace(value);
};

const normalizeSkillsWithTaxonomy = (skills = []) => {
    return [...new Set(
        normalizeStringArray(skills)
            .map((item) => canonicalizeSkill(item))
            .filter(Boolean)
    )];
};

const extractKeywords = (resumeText = '') => {
    const words = String(resumeText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOPWORDS.has(word));

    const counts = new Map();
    words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([word]) => word);
};

const extractEducation = (resumeText = '') => {
    const patterns = [
        /\b(b\.tech|btech|bachelor(?:'s)?\s+degree|b\.e\.?|bsc|bca)\b/i,
        /\b(m\.tech|mtech|master(?:'s)?\s+degree|msc|mca|mba)\b/i,
        /\b(phd|doctorate)\b/i
    ];

    for (const pattern of patterns) {
        const match = String(resumeText || '').match(pattern);
        if (match) return match[0];
    }

    return null;
};

const extractExperienceEvidence = (resumeText = '') => {
    const foundYears = [];
    for (const pattern of EXPERIENCE_PATTERNS) {
        let match = pattern.exec(resumeText);
        while (match) {
            const years = Number.parseInt(match[1], 10);
            if (Number.isFinite(years)) foundYears.push(years);
            match = pattern.exec(resumeText);
        }
        pattern.lastIndex = 0;
    }

    const uniqueYears = [...new Set(foundYears)].sort((a, b) => b - a);
    if (!uniqueYears.length) {
        return { rawYears: [], experience: null };
    }

    const topYears = uniqueYears[0];
    return {
        rawYears: uniqueYears,
        experience: `${topYears} years (explicitly detected in resume text)`
    };
};

const extractProjects = (resumeText = '') => {
    const lines = String(resumeText || '').split(/\r?\n/).map((line) => sanitizeText(line));
    const projectLines = lines
        .filter((line) => /project|built|developed|implemented|designed/i.test(line) && line.length > 12)
        .slice(0, 5);

    return [...new Set(projectLines)];
};

const extractCertifications = (resumeText = '') => {
    const certMatches = String(resumeText || '').match(/(certified|certification|aws certified|azure certified|google cloud certified|oracle certified)[^\n,.;]*/gi) || [];
    return [...new Set(certMatches.map((item) => normalizeWhitespace(item)).filter(Boolean))].slice(0, 8);
};

const extractSkillsFromText = (resumeText = '') => {
    const lowerText = String(resumeText || '').toLowerCase();
    const matched = [];

    for (const [canonical, aliases] of Object.entries(SKILL_TAXONOMY)) {
        if (aliases.some((alias) => new RegExp(`\\b${alias.replace('.', '\\.')}\\b`, 'i').test(lowerText))) {
            matched.push(canonical);
        }
    }

    return [...new Set(matched)];
};

const splitToolsAndTechnologies = (skills = []) => {
    const normalized = normalizeSkillsWithTaxonomy(skills);
    const toolSet = new Set(['Docker', 'Kubernetes', 'Git', 'AWS', 'MongoDB']);

    return {
        tools: normalized.filter((item) => toolSet.has(item)),
        technologies: normalized.filter((item) => !toolSet.has(item))
    };
};

const extractResumeSignals = (resumeText = '') => {
    const normalizedText = normalizeWhitespace(resumeText);
    const experienceEvidence = extractExperienceEvidence(normalizedText);
    const extractedSkills = extractSkillsFromText(normalizedText);
    const toolSplit = splitToolsAndTechnologies(extractedSkills);

    return {
        skills: extractedSkills,
        projects: extractProjects(normalizedText),
        education: extractEducation(normalizedText),
        experience: experienceEvidence.experience,
        certifications: extractCertifications(normalizedText),
        tools: toolSplit.tools,
        technologies: toolSplit.technologies,
        keywords: extractKeywords(normalizedText),
        explicitYearsDetected: experienceEvidence.rawYears
    };
};

const ensureJsonProfile = async (requestUser) => {
    const existing = await dbService.find('users', (u) => u.id === requestUser.id);
    if (existing) return existing;

    const isMongoObjectId = /^[a-f\d]{24}$/i.test(String(requestUser?.id || ''));
    const authUser = isMongoObjectId
        ? await User.findById(requestUser.id).lean()
        : null;

    return dbService.insert('users', {
        id: requestUser.id,
        email: requestUser.email || authUser?.email || '',
        name: authUser?.name || requestUser.email?.split('@')[0] || 'User',
        gender: '',
        skills: [],
        primarySkills: [],
        secondarySkills: [],
        preferredRole: '',
        experienceLevel: '',
        preferredJobType: '',
        preferredWorkMode: '',
        preferredLocation: '',
        expectedSalaryMin: null,
        expectedSalaryMax: null,
        expectedSalaryCurrency: 'INR',
        linkedin: '',
        github: '',
        portfolio: '',
        phone: '',
        educationLevel: '',
        degree: '',
        university: '',
        graduationYear: '',
        certifications: [],
        languagesKnown: [],
        onboardingCompleted: false,
        resumeText: '',
        resumeSkills: [],
        resumeProjects: [],
        resumeEducation: '',
        experience: null,
        resumeCertifications: [],
        resumeTools: [],
        resumeTechnologies: [],
        education: null,
        resumeKeywords: [],
        resumeUploadedAt: null,
        updatedAt: new Date().toISOString()
    });
};

const buildProfileResponse = (user = {}) => {
    const onboarding = computeOnboardingState(user);
    return {
        ...user,
        skills: onboarding.normalizedSkills,
        primarySkills: normalizeSkillsWithTaxonomy(user?.primarySkills || user?.skills || []),
        secondarySkills: normalizeSkillsWithTaxonomy(user?.secondarySkills || []),
        certifications: normalizeStringArray(user?.certifications || []),
        languagesKnown: normalizeStringArray(user?.languagesKnown || []),
        resumeSkills: normalizeSkillsWithTaxonomy(user?.resumeSkills || []),
        resumeProjects: normalizeStringArray(user?.resumeProjects || []),
        resumeCertifications: normalizeStringArray(user?.resumeCertifications || []),
        resumeTools: normalizeStringArray(user?.resumeTools || []),
        resumeTechnologies: normalizeStringArray(user?.resumeTechnologies || []),
        hasName: onboarding.hasName,
        hasGender: onboarding.hasGender,
        onboardingPendingFields: onboarding.onboardingPendingFields,
        canUseResumeData: onboarding.canUseResumeData,
        onboardingCompleted: onboarding.onboardingCompleted,
        hasResume: onboarding.hasResume,
        hasProfileSkills: onboarding.hasProfileSkills,
        hasRequiredProfileDetails: onboarding.hasRequiredProfileDetails,
        onboardingComplete: onboarding.onboardingCompleted,
        onboardingSource: onboarding.onboardingSource
    };
};

const userController = {
    uploadResume: async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) {
                return reply.status(400).send({ message: 'No file uploaded' });
            }

            const buffer = await data.toBuffer();
            let text = '';

            if (data.mimetype === 'application/pdf') {
                const pdfData = await pdf(buffer);
                text = pdfData.text;
            } else if (data.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const docx = await mammoth.extractRawText({ buffer });
                text = docx.value;
            } else if (data.mimetype === 'text/plain') {
                text = buffer.toString('utf-8');
            } else {
                return reply.status(400).send({ message: 'Unsupported file format. Upload PDF, DOCX, or TXT.' });
            }

            const normalizedResumeText = normalizeWhitespace(text);
            if (!normalizedResumeText) {
                return reply.status(422).send({ message: 'Resume text could not be extracted. Upload a readable PDF, DOCX, or TXT file.' });
            }

            const extracted = extractResumeSignals(normalizedResumeText);
            const resumeUploadedAt = new Date().toISOString();

            const user = await ensureJsonProfile(request.user);
            const updates = {
                resumeText: normalizedResumeText,
                resumeSkills: extracted.skills,
                resumeProjects: extracted.projects,
                experience: extracted.experience,
                education: extracted.education,
                resumeEducation: extracted.education,
                resumeCertifications: extracted.certifications,
                resumeTools: extracted.tools,
                resumeTechnologies: extracted.technologies,
                resumeKeywords: extracted.keywords,
                resumeUploadedAt,
                resumeExtraction: {
                    extractedAt: resumeUploadedAt,
                    parserVersion: 'strict-v3',
                    explicitYearsDetected: extracted.explicitYearsDetected,
                    sections: {
                        skills: extracted.skills.length,
                        projects: extracted.projects.length,
                        certifications: extracted.certifications.length,
                        tools: extracted.tools.length,
                        technologies: extracted.technologies.length
                    }
                }
            };

            if (user) {
                await dbService.update('users', user.id, updates);
            } else {
                await dbService.insert('users', {
                    id: request.user.id,
                    email: request.user.email,
                    name: request.user.name || request.user.email,
                    gender: '',
                    skills: [],
                    primarySkills: [],
                    secondarySkills: [],
                    onboardingCompleted: false,
                    ...updates
                });
            }

            setImmediate(async () => {
                try {
                    await syncLiveJobs({ role: 'Software Engineer', location: '', closeMissing: false, resultsPerPage: 50 });
                    await refreshMatchScores();
                } catch (syncError) {
                    console.error('Post-resume sync trigger failed:', syncError);
                }
            });

            return reply.status(200).send({
                message: 'Resume uploaded and analyzed',
                extracted: {
                    skills: extracted.skills,
                    projects: extracted.projects,
                    education: extracted.education,
                    experience: extracted.experience,
                    certifications: extracted.certifications,
                    tools: extracted.tools,
                    technologies: extracted.technologies,
                    keywords: extracted.keywords,
                    explicitYearsDetected: extracted.explicitYearsDetected
                },
                refreshQueued: true
            });
        } catch (error) {
            console.error('Upload Error:', error);
            return reply.status(500).send({ message: 'Error processing resume' });
        }
    },

    getProfile: async (request, reply) => {
        const user = await ensureJsonProfile(request.user);
        return reply.status(200).send(buildProfileResponse(user));
    },

    updateProfile: async (request, reply) => {
        const current = await ensureJsonProfile(request.user);

        const fallbackSkills = normalizeSkills(request.body?.skills);
        const incomingPrimarySkills = normalizeSkillsWithTaxonomy(request.body?.primarySkills || fallbackSkills);
        const existingPrimarySkills = normalizeSkillsWithTaxonomy(current?.primarySkills || current?.skills || []);
        const hasPrimarySkillPayload = Object.prototype.hasOwnProperty.call(request.body || {}, 'primarySkills')
            || Object.prototype.hasOwnProperty.call(request.body || {}, 'skills');

        const nextPrimarySkills = hasPrimarySkillPayload ? incomingPrimarySkills : existingPrimarySkills;
        const nextSecondarySkills = normalizeSkillsWithTaxonomy(request.body?.secondarySkills || current?.secondarySkills || []);
        const mergedSkills = [...new Set([...nextPrimarySkills, ...nextSecondarySkills])];

        const nextName = normalizeWhitespace(request.body?.name || current.name);
        const nextGender = normalizeWhitespace(request.body?.gender || current.gender || '');
        const requiredProfileComplete = Boolean(nextName) && Boolean(nextGender) && nextPrimarySkills.length > 0;

        if (!requiredProfileComplete) {
            return reply.status(422).send({
                message: 'Name, gender, and at least one primary skill are required to complete onboarding.'
            });
        }

        const updates = {
            name: nextName,
            email: normalizeWhitespace(request.body?.email || current.email),
            gender: nextGender,
            primarySkills: nextPrimarySkills,
            secondarySkills: nextSecondarySkills,
            skills: mergedSkills,
            preferredRole: normalizeWhitespace(request.body?.preferredRole || current.preferredRole || ''),
            experienceLevel: normalizeWhitespace(request.body?.experienceLevel || current.experienceLevel || ''),
            preferredJobType: normalizeWhitespace(request.body?.preferredJobType || current.preferredJobType || ''),
            preferredWorkMode: normalizeWhitespace(request.body?.preferredWorkMode || current.preferredWorkMode || ''),
            preferredLocation: normalizeWhitespace(request.body?.preferredLocation || current.preferredLocation || ''),
            expectedSalaryMin: request.body?.expectedSalaryMin ?? current.expectedSalaryMin ?? null,
            expectedSalaryMax: request.body?.expectedSalaryMax ?? current.expectedSalaryMax ?? null,
            expectedSalaryCurrency: normalizeWhitespace(request.body?.expectedSalaryCurrency || current.expectedSalaryCurrency || 'INR'),
            linkedin: normalizeWhitespace(request.body?.linkedin || current.linkedin || ''),
            github: normalizeWhitespace(request.body?.github || current.github || ''),
            portfolio: normalizeWhitespace(request.body?.portfolio || current.portfolio || ''),
            phone: normalizeWhitespace(request.body?.phone || current.phone || ''),
            educationLevel: normalizeWhitespace(request.body?.educationLevel || current.educationLevel || ''),
            degree: normalizeWhitespace(request.body?.degree || current.degree || ''),
            university: normalizeWhitespace(request.body?.university || current.university || ''),
            graduationYear: normalizeWhitespace(request.body?.graduationYear || current.graduationYear || ''),
            certifications: normalizeStringArray(request.body?.certifications || current.certifications || []),
            languagesKnown: normalizeStringArray(request.body?.languagesKnown || current.languagesKnown || []),
            onboardingCompleted: Boolean(current?.onboardingCompleted) || requiredProfileComplete,
            updatedAt: new Date().toISOString()
        };

        const user = await dbService.update('users', request.user.id, updates);
        if (!user) return reply.status(404).send({ message: 'User not found' });

        await User.findByIdAndUpdate(request.user.id, {
            name: updates.name,
            email: updates.email
        }).catch(() => null);

        setImmediate(async () => {
            try {
                await refreshMatchScores();
            } catch (recalcError) {
                console.error('Profile update score refresh failed:', recalcError);
            }
        });

        return reply.status(200).send(buildProfileResponse(user));
    },

    deleteProfile: async (request, reply) => {
        try {
            await User.findByIdAndDelete(request.user.id);

            const userProfile = await dbService.find('users', (u) => u.id === request.user.id);
            if (userProfile) {
                await dbService.delete('users', userProfile.id);
            }

            const applications = await dbService.filter('applications', (a) => a.userId === request.user.id);
            for (const app of applications) {
                await dbService.delete('applications', app.id);
            }

            const savedJobs = await dbService.filter('savedJobs', (s) => s.userId === request.user.id);
            for (const saved of savedJobs) {
                await dbService.delete('savedJobs', saved.id);
            }

            return reply.status(200).send({ message: 'Account deleted successfully' });
        } catch (error) {
            console.error('Delete profile error:', error);
            return reply.status(500).send({ message: 'Failed to delete account' });
        }
    }
};

export default userController;
