import { FiMapPin, FiClock, FiBriefcase, FiExternalLink, FiStar, FiZap, FiInfo, FiChevronUp } from 'react-icons/fi';
import { sanitizeJobHtml, descriptionPreviewText, hasRichDescription } from '../../services/htmlSanitizer';
import './JobCard.css';

const JobCard = ({
  job,
  onSave,
  onToggleExpand,
  isExpanded = false,
  expandedSection = 'match',
  isSaved = false,
  isApplied = false
}) => {
  const explanation = job.matchExplanation || {};
  const matchingSkills = Array.isArray(explanation.matchingSkills) ? explanation.matchingSkills : [];
  const missingSkills = Array.isArray(explanation.missingSkills) ? explanation.missingSkills : [];
  const postedDate = job.created || job.created_at || job.posted || Date.now();
  const safeDescriptionHtml = sanitizeJobHtml(job.description);
  const showHtmlDescription = hasRichDescription(job.description);

  const getScoreColor = (score) => {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'gray';
  };

  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 });
    if (min && max) return `${currency} ${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `${currency} ${formatter.format(min)}+`;
    if (max) return `${currency} up to ${formatter.format(max)}`;
    return null;
  };

  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.currency || 'USD');
  const sourceDisplay = job.source || 'Job Board';
  const educationDisplay = job.education || job.educationLevel || explanation.education || 'Not specified';

  const handleApply = (e, selectedJob) => {
    e.stopPropagation();
    if (!selectedJob?.redirect_url) return;

    window.open(selectedJob.redirect_url, '_blank');
    window.dispatchEvent(new CustomEvent('jobApplied', { detail: selectedJob }));
  };

  const handleSave = async (e, selectedJob) => {
    e.stopPropagation();
    if (!onSave) return;
    await onSave(selectedJob);
  };

  const handleViewMatch = (e) => {
    e.stopPropagation();
    if (onToggleExpand) onToggleExpand(job, 'match');
  };

  const handleViewMore = (e) => {
    e.stopPropagation();
    if (onToggleExpand) onToggleExpand(job, 'details');
  };

  const scoreLabel = Number(job.matchScore || 0) >= 70
    ? 'Strong profile alignment for this role.'
    : Number(job.matchScore || 0) >= 40
      ? 'Moderate fit with room for optimization.'
      : 'Low fit currently, but still worth reviewing.';

  const matchInsight = explanation.skillEvidence
    || explanation.experienceRelevance
    || 'Profile alignment is calculated from explicit overlaps between resume and job text.';

  const categoryColors = {
    frontend: '#FF6B92',
    backend: '#4D96FF',
    aiml: '#FFD93D',
    cloud: '#6BCB77',
    data: '#FF6B9D',
    cybersecurity: '#D63031',
    mobile: '#A29BFE',
    devops: '#FF7675',
    testing: '#74B9FF',
    internship: '#81ECEC'
  };

  const getCategoryLabel = (category) => {
    const labels = {
      frontend: 'Frontend',
      backend: 'Backend',
      aiml: 'AI/ML',
      cloud: 'Cloud',
      data: 'Data',
      cybersecurity: 'Security',
      mobile: 'Mobile',
      devops: 'DevOps',
      testing: 'QA & Testing',
      internship: 'Internship'
    };
    return labels[category] || category || 'Engineering';
  };

  const jobCategory = job.domainCategory || job.category || 'internship';

  return (
    <div className={`job-card ${isExpanded ? 'job-card--expanded' : ''}`}>
      <div className="job-card__content">
        <div className="job-card__header">
          <div className="job-card__main-info">
            <h3 className="job-title">{job.title}</h3>
            <span className="company-name">{job.company}</span>
          </div>
          <div className={`match-badge ${getScoreColor(job.matchScore)}`}>
            {job.matchScore}% Match
          </div>
        </div>

        <div className="job-card__meta">
          <div className="meta-item"><FiMapPin size={14} /> {job.location}</div>
          <div className="meta-item"><FiBriefcase size={14} /> {job.contract_time || job.jobType || 'Full Time'}</div>
          <div className="meta-item"><FiClock size={14} /> {new Date(postedDate).toLocaleDateString()}</div>
          {salaryDisplay && <div className="meta-item salary-item">💰 {salaryDisplay}</div>}
        </div>

        <div className="job-card__source">
          <span
            className="source-badge"
            style={{
              backgroundColor: categoryColors[jobCategory] || categoryColors.internship,
              color: '#fff'
            }}
          >
            {getCategoryLabel(jobCategory)}
          </span>
          <span className="source-badge">{sourceDisplay}</span>
        </div>

        <div className="job-card__status-row">
          {isApplied && <span className="job-status-badge job-status-badge--applied">Already Applied</span>}
          {isSaved && <span className="job-status-badge job-status-badge--saved">Already Saved</span>}
        </div>

        <p className="job-description">{descriptionPreviewText(job.description, 120)}</p>

        <div className="job-chip-row">
          {(matchingSkills.length ? matchingSkills : ['General Engineering'])
            .slice(0, 4)
            .map((skill) => (
              <span className="job-chip" key={`chip-${job.id}-${skill}`}>{skill}</span>
            ))}
        </div>

        <div className="job-card__insight">
          {matchInsight}
        </div>

        <div className={`job-card__accordion ${isExpanded ? 'is-open' : ''}`} aria-hidden={!isExpanded}>
          <div className="job-card__accordion-inner">
            <section className="accordion-section">
              <h4>AI Match Analysis</h4>
              <p className="accordion-text"><strong>{Number(job.matchScore || 0)}% match.</strong> {scoreLabel}</p>
              <p className="accordion-text">{explanation.suggestions || 'Add role-relevant impact bullets and project metrics to increase ATS confidence.'}</p>
            </section>

            <section className="accordion-section">
              <h4>Matching Skills</h4>
              <div className="job-chip-row">
                {(matchingSkills.length ? matchingSkills : ['No matching skills detected yet']).map((skill) => (
                  <span className="job-chip" key={`match-skill-${job.id}-${skill}`}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="accordion-section">
              <h4>Missing Skills</h4>
              <div className="job-chip-row">
                {(missingSkills.length ? missingSkills : ['No major skill gaps identified']).map((skill) => (
                  <span className="job-chip job-chip--missing" key={`missing-skill-${job.id}-${skill}`}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="accordion-section">
              <h4>Full Job Description</h4>
              {showHtmlDescription ? (
                <div className="accordion-description prose max-w-none" dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
              ) : (
                <p className="accordion-text">No detailed description available from source.</p>
              )}
            </section>

            <section className="accordion-section accordion-section--meta">
              <h4>Extra Details</h4>
              <p className="accordion-text"><strong>Education:</strong> {educationDisplay}</p>
              <p className="accordion-text"><strong>Source:</strong> {sourceDisplay}</p>
              <p className="accordion-text"><strong>Posted:</strong> {new Date(postedDate).toLocaleString()}</p>
            </section>
          </div>
        </div>
      </div>

      <div className="job-card__actions">
        <button
          className={`action-btn save-btn ${isSaved ? 'save-btn--active' : ''}`}
          onClick={(e) => handleSave(e, job)}
          disabled={isSaved}
          aria-label={isSaved ? 'Job already saved' : 'Save job'}
          title="Add job to saved list"
        >
          <FiStar size={16} />
          <span>{isSaved ? 'Added' : 'Add'}</span>
        </button>

        <button
          className="action-btn match-btn"
          onClick={handleViewMatch}
          title="View AI match analysis"
        >
          {isExpanded && expandedSection === 'match' ? <FiChevronUp size={16} /> : <FiZap size={16} />}
          <span>{isExpanded && expandedSection === 'match' ? 'Hide' : 'Match'}</span>
        </button>

        <button
          className="action-btn more-btn"
          onClick={handleViewMore}
          title="View full job details"
        >
          {isExpanded && expandedSection === 'details' ? <FiChevronUp size={16} /> : <FiInfo size={16} />}
          <span>{isExpanded && expandedSection === 'details' ? 'Hide' : 'More'}</span>
        </button>

        <button
          className="action-btn apply-btn"
          onClick={(e) => handleApply(e, job)}
          disabled={isApplied}
          title={isApplied ? 'Already applied to this job' : 'Apply to this job'}
        >
          <FiExternalLink size={16} />
          <span>{isApplied ? 'Applied' : 'Apply'}</span>
        </button>
      </div>
    </div>
  );
};

export default JobCard;
