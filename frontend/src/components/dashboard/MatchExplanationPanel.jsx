import { useState } from 'react';
import { FiX, FiCheck, FiAlertTriangle, FiPlus, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { sanitizeJobHtml } from '../../services/htmlSanitizer';
import './MatchExplanationPanel.css';

const emptyPack = {
  coverLetter: '',
  recruiterEmail: '',
  linkedInMessage: ''
};

const splitDescriptionIntoBullets = (description = '') => {
  const clean = sanitizeJobHtml(description)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const rawParts = clean
    .split(/\.|\n|\u2022|\-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 30);

  return rawParts.slice(0, 12);
};

const prettyDate = (value) => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString();
};

const MatchExplanationPanel = ({ isOpen, onClose, job, activeTab: initialTab = 'match' }) => {
  const [coverLetterPack, setCoverLetterPack] = useState(emptyPack);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!job) return null;

  const explanation = job.matchExplanation || {};
  const matchingSkills = Array.isArray(explanation.matchingSkills) ? explanation.matchingSkills : [];
  const missingSkills = Array.isArray(explanation.missingSkills) ? explanation.missingSkills : [];
  const matchedKeywords = Array.isArray(explanation.matchedKeywords) ? explanation.matchedKeywords : [];
  const safeDescriptionHtml = sanitizeJobHtml(job.description);
  const detailBullets = splitDescriptionIntoBullets(job.description);
  const salaryText = job.salary_min
    ? `$${Number(job.salary_min).toLocaleString()}${job.salary_max ? ` - $${Number(job.salary_max).toLocaleString()}` : '+'}`
    : 'Not specified';

  const atsScore = Math.max(0, Math.min(100, Number(job.matchScore || 0)));
  const atsBreakdown = explanation.atsBreakdown || {
    skillMatch: Math.min(100, atsScore + 5),
    keywordDensity: Math.min(100, Math.round((matchedKeywords.length || 2) * 12))
  };

  const generateCoverLetterPack = async () => {
    try {
      setIsGenerating(true);
      setGenerationError('');

      const response = await fetch(`/api/jobs/${job.id}/cover-letter-pack`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unable to generate cover letter pack right now.');
      }

      const data = await response.json();
      setCoverLetterPack({
        coverLetter: data.coverLetter || '',
        recruiterEmail: data.recruiterEmail || '',
        linkedInMessage: data.linkedInMessage || ''
      });
    } catch (error) {
      setGenerationError(error.message || 'Failed to generate cover letter pack.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`explanation-panel ${isOpen ? 'open' : ''}`}>
      <div className="explanation-panel__header">
        <button className="close-btn" onClick={onClose}><FiX size={24} /></button>
        <h2>{job.title}</h2>
      </div>

      <div className="explanation-panel__tabs">
        <button
          className={`tab-button ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveTab('match')}
        >
          AI Match Analysis
        </button>
        <button
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Full Details
        </button>
      </div>

      <div className="explanation-panel__content">
        {activeTab === 'match' && (
          <>
            <div className="match-summary">
              <div className="radial-score">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="circle" strokeDasharray={`${job.matchScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="20.35" className="percentage">{job.matchScore}%</text>
                </svg>
              </div>
              <div className="summary-text">
                <h3>Match Evidence</h3>
                <p>{explanation.skillEvidence || 'Skill overlap is calculated from explicit resume and job text matches.'}</p>
              </div>
            </div>

            <section className="explanation-section">
              <h4><FiCheck color="#00ADB5" /> Matching Skills</h4>
              <div className="tags">
                {matchingSkills.map((s) => (
                  <span key={`match-${s}`} className="tag match">{s}</span>
                ))}
                {matchingSkills.length === 0 && <span className="tag neutral">No direct skill overlap detected yet</span>}
              </div>
            </section>

            <section className="explanation-section">
              <h4>Experience & Tech Stack Similarity</h4>
              <p className="suggestion-text">
                <strong>Experience overlap:</strong> {explanation.experienceRelevance || 'No explicit experience statement detected.'}
              </p>
              <p className="suggestion-text">
                <strong>Tech stack similarity:</strong> {matchingSkills.slice(0, 4).join(', ') || 'Limited stack overlap found'}
              </p>
              <p className="suggestion-text">
                <strong>Resume keywords found:</strong> {matchedKeywords.slice(0, 6).join(', ') || 'No explicit keyword extraction yet'}
              </p>
            </section>

            <section className="explanation-section">
              <h4><FiAlertTriangle color="#FFCC00" /> Why Not Fully Matched</h4>
              <div className="tags">
                {missingSkills.map((s) => (
                  <span key={`missing-${s}`} className="tag missing">{s}</span>
                ))}
                {missingSkills.length === 0 && <span className="tag neutral">No major skill gaps identified</span>}
              </div>
              <ul className="gap-list">
                <li>Missing tools: {missingSkills[0] || 'Not specified'}</li>
                <li>Missing skills: {missingSkills.slice(1, 3).join(', ') || 'Minor'}</li>
                <li>Experience mismatch: {explanation.experienceGap || 'Low'}</li>
                <li>Domain mismatch: {explanation.domainGap || 'Not significant'}</li>
              </ul>
            </section>

            <section className="explanation-section">
              <h4>Improve your chances</h4>
              <p className="suggestion-text">{explanation.suggestions || 'Add role-specific projects and quantify your impact with metrics.'}</p>
            </section>

            <section className="explanation-section">
              <h4>Resume AI Suggestions</h4>
              <p className="suggestion-text">Your resume may be missing these skills for this role:</p>
              <div className="tags">
                {(missingSkills.length ? missingSkills : ['No explicit skill gaps detected']).map((item) => (
                  <span key={`skill-gap-${item}`} className="tag missing">{item}</span>
                ))}
              </div>
              <div className="resume-actions">
                <button className="improve-btn">
                  <FiPlus /> Improve Resume
                </button>
                <button className="improve-btn secondary">
                  <FiRefreshCw /> Regenerate Resume for this Job
                </button>
                <button className="improve-btn secondary">
                  <FiDownload /> Download Improved Resume
                </button>
              </div>
            </section>

            <section className="explanation-section ats-block">
              <h4>ATS Compatibility Score: {atsScore}%</h4>
              <p className="suggestion-text">Skill match: {atsBreakdown.skillMatch}%</p>
              <p className="suggestion-text">Keyword density: {atsBreakdown.keywordDensity}%</p>
            </section>

            <section className="explanation-section">
              <h4>AI Cover Letter Generator</h4>
              <p className="suggestion-text">Generate a personalized cover letter, recruiter email, and LinkedIn pitch for this role.</p>
              <button className="improve-btn" onClick={generateCoverLetterPack} disabled={isGenerating}>
                <FiPlus /> {isGenerating ? 'Generating...' : 'Generate Cover Letter Pack'}
              </button>
              {generationError && <p className="cover-letter-error">{generationError}</p>}
              {coverLetterPack.coverLetter && (
                <div className="cover-letter-pack">
                  <div className="cover-letter-item">
                    <h5>Cover Letter</h5>
                    <pre>{coverLetterPack.coverLetter}</pre>
                  </div>
                  <div className="cover-letter-item">
                    <h5>Recruiter Email</h5>
                    <pre>{coverLetterPack.recruiterEmail}</pre>
                  </div>
                  <div className="cover-letter-item">
                    <h5>LinkedIn Message</h5>
                    <pre>{coverLetterPack.linkedInMessage}</pre>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'details' && (
          <>
            <div className="job-details-mini">
              <h4>Job Information</h4>
              <p><strong>Company:</strong> {job.company}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Role:</strong> {job.title || 'Not specified'}</p>
              <p><strong>Category:</strong> {job.category || 'Not specified'}</p>
              <p><strong>Work mode:</strong> {job.contract_time || 'Not specified'}</p>
              <p><strong>Salary Range:</strong> {salaryText}</p>
              <p><strong>Source:</strong> {job.source || 'Unknown'}</p>
              <p><strong>Posted:</strong> {prettyDate(job.created || job.createdAt)}</p>
              <p><strong>Last updated:</strong> {prettyDate(job.updatedAt || job.lastSeenAt || job.created)}</p>
              {job.redirect_url && (
                <a className="job-apply-link" href={job.redirect_url} target="_blank" rel="noreferrer">
                  Open original job posting →
                </a>
              )}
            </div>

            <section className="explanation-section">
              <h4>Full Job Description</h4>
              {safeDescriptionHtml ? (
                <div className="suggestion-text prose max-w-none" dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
              ) : detailBullets.length > 0 ? (
                <ul className="job-description-list">
                  {detailBullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="suggestion-text">No detailed description available from source.</p>
              )}
            </section>

            <section className="explanation-section">
              <h4>Required Skills & Experience</h4>
              {job.requirements ? (
                <p className="suggestion-text">{job.requirements}</p>
              ) : (
                <p className="suggestion-text">View full job description above. Skills commonly required for this role match your profile alignment details.</p>
              )}
            </section>

            <section className="explanation-section">
              <h4>Quick Overview</h4>
              <div className="tags">
                {matchingSkills.map((s) => (
                  <span key={`overview-${s}`} className="tag match">{s}</span>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchExplanationPanel;
