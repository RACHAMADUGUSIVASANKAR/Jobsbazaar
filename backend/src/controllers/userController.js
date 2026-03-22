import dbService from '../utils/dbService.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import User from '../models/User.js';
import { syncLiveJobs } from '../utils/jobSyncService.js';

const SKILL_PATTERNS = [
  { skill: 'React', patterns: [/\breact(?:\.js)?\b/i] },
  { skill: 'Node.js', patterns: [/\bnode(?:\.js)?\b/i] },
  { skill: 'Python', patterns: [/\bpython\b/i] },
  { skill: 'Java', patterns: [/\bjava\b/i] },
  { skill: 'JavaScript', patterns: [/\bjavascript\b/i] },
  { skill: 'TypeScript', patterns: [/\btypescript\b/i] },
  { skill: 'MongoDB', patterns: [/\bmongodb\b/i] },
  { skill: 'SQL', patterns: [/\bsql\b/i] },
  { skill: 'AWS', patterns: [/\baws\b|\bamazon web services\b/i] },
  { skill: 'Docker', patterns: [/\bdocker\b/i] },
  { skill: 'Kubernetes', patterns: [/\bkubernetes\b|\bk8s\b/i] },
  { skill: 'Express', patterns: [/\bexpress(?:\.js)?\b/i] },
  { skill: 'Fastify', patterns: [/\bfastify\b/i] }
];

const EXPERIENCE_PATTERNS = [
  /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience/gi,
  /experience\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi,
  /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\s+in\b/gi
];

const normalizeWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const extractSkillEvidence = (resumeText = '') => {
  const evidence = [];
  for (const config of SKILL_PATTERNS) {
    const matched = config.patterns.find((pattern) => pattern.test(resumeText));
    if (matched) {
      evidence.push({ skill: config.skill, pattern: String(matched) });
    }
  }
  return evidence;
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

const extractResumeSignals = (resumeText = '') => {
  const normalizedText = normalizeWhitespace(resumeText);
  const skillEvidence = extractSkillEvidence(normalizedText);
  const experienceEvidence = extractExperienceEvidence(normalizedText);

  return {
    skills: skillEvidence.map((entry) => entry.skill),
    experience: experienceEvidence.experience,
    evidence: {
      skills: skillEvidence,
      years: experienceEvidence.rawYears
    }
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
      } else if (data.mimetype === 'text/plain') {
        text = buffer.toString('utf-8');
      } else {
        return reply.status(400).send({ message: 'Unsupported file format' });
      }

      const normalizedResumeText = normalizeWhitespace(text);
      if (!normalizedResumeText) {
        return reply.status(422).send({
          message: 'Resume text could not be extracted. Upload a readable PDF or TXT file.'
        });
      }

      const extracted = extractResumeSignals(normalizedResumeText);
      const resumeUploadedAt = new Date().toISOString();
      const extractionLog = {
        extractedAt: resumeUploadedAt,
        skillCount: extracted.skills.length,
        explicitYearsDetected: extracted.evidence.years,
        parserVersion: 'strict-v2'
      };

      const user = await dbService.find('users', u => u.id === request.user.id);
      if (user) {
        await dbService.update('users', user.id, {
          resumeText: normalizedResumeText,
          skills: extracted.skills,
          experience: extracted.experience,
          resumeUploadedAt,
          resumeExtraction: extractionLog
        });
      } else {
        // Handle case where user isn't in JSON DB yet (Sync from Mongo if needed)
        await dbService.insert('users', {
          id: request.user.id,
          email: request.user.email,
          resumeText: normalizedResumeText,
          skills: extracted.skills,
          experience: extracted.experience,
          resumeUploadedAt,
          resumeExtraction: extractionLog
        });
      }

      // Immediate activation: trigger a background refresh so matchable jobs are updated after resume upload.
      setImmediate(async () => {
        try {
          await syncLiveJobs({ role: 'Software Engineer', location: '', closeMissing: false, resultsPerPage: 50 });
        } catch (syncError) {
          console.error('Post-resume sync trigger failed:', syncError);
        }
      });

      request.log?.info?.({
        userId: request.user.id,
        extractionLog,
        evidence: extracted.evidence
      }, 'Resume extraction completed');

      return reply.status(200).send({
        message: 'Resume uploaded and analyzed',
        extracted: {
          skills: extracted.skills,
          experience: extracted.experience,
          explicitYearsDetected: extracted.evidence.years
        },
        refreshQueued: true
      });
    } catch (error) {
      console.error('Upload Error:', error);
      return reply.status(500).send({ message: 'Error processing resume' });
    }
  },

  getProfile: async (request, reply) => {
    const user = await dbService.find('users', u => u.id === request.user.id);
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return reply.status(200).send(user);
  },

  updateProfile: async (request, reply) => {
    const user = await dbService.update('users', request.user.id, request.body);
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return reply.status(200).send(user);
  },

  deleteProfile: async (request, reply) => {
    try {
      // Remove authentication user record.
      await User.findByIdAndDelete(request.user.id);

      // Remove related in-memory/JSON data records.
      const userProfile = await dbService.find('users', u => u.id === request.user.id);
      if (userProfile) {
        await dbService.delete('users', userProfile.id);
      }

      const applications = await dbService.filter('applications', a => a.userId === request.user.id);
      for (const app of applications) {
        await dbService.delete('applications', app.id);
      }

      const savedJobs = await dbService.filter('savedJobs', s => s.userId === request.user.id);
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
