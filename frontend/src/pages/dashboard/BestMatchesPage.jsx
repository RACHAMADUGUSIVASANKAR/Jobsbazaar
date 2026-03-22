import { useState, useEffect } from 'react';
import JobCard from '../../components/dashboard/JobCard';
import './BestMatchesPage.css';

const POLL_MS = 60000;

const BestMatchesPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [expandedJobId, setExpandedJobId] = useState('');
  const [expandedSection, setExpandedSection] = useState('match');

  const fetchBestMatches = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [matchesRes, appsRes, savedRes] = await Promise.all([
        fetch('/api/jobs/best-matches', { headers }),
        fetch('/api/jobs/applications', { headers }),
        fetch('/api/jobs/saved', { headers })
      ]);

      const [matchesData, appsData, savedData] = await Promise.all([
        matchesRes.json(),
        appsRes.json(),
        savedRes.json()
      ]);

      setJobs(Array.isArray(matchesData) ? matchesData : []);

      const nextApplied = new Set(
        Array.isArray(appsData)
          ? appsData.map((item) => String(item.jobId ?? item.id)).filter(Boolean)
          : []
      );
      const nextSaved = new Set(
        Array.isArray(savedData)
          ? savedData.map((item) => String(item.id)).filter(Boolean)
          : []
      );

      setAppliedJobIds(nextApplied);
      setSavedJobIds(nextSaved);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestMatches();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchBestMatches, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleAssistantRefresh = () => {
      fetchBestMatches();
    };

    window.addEventListener('assistantRefreshLiveJobs', handleAssistantRefresh);
    return () => window.removeEventListener('assistantRefreshLiveJobs', handleAssistantRefresh);
  }, []);

  const handleSaveJob = async (job) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Could not save job');
      setSavedJobIds((prev) => new Set([...prev, String(job.id)]));
    } catch (error) {
      console.error('Save job failed:', error);
    }
  };

  const handleToggleExpand = (job, section) => {
    const jobId = String(job?.id || '');
    if (!jobId) return;

    if (expandedJobId === jobId && expandedSection === section) {
      setExpandedJobId('');
      return;
    }

    setExpandedJobId(jobId);
    setExpandedSection(section);
  };

  const excellentMatches = jobs.filter((job) => Number(job.matchScore || 0) >= 75);
  const strongMatches = jobs.filter((job) => {
    const score = Number(job.matchScore || 0);
    return score >= 40 && score < 75;
  });

  return (
    <div className="best-matches-page">
      <div className="best-matches-header">
        <div className="best-matches-header__title">
          <h2>Best Matches</h2>
          <p>{jobs.length} roles ranked by your AI fit score</p>
        </div>
        <div className="best-matches-header__stats">
          <span>{excellentMatches.length} excellent</span>
          <span>{strongMatches.length} strong</span>
        </div>
      </div>

      {loading ? (
        <div className="best-matches-loading">Finding your perfect match...</div>
      ) : (
        <>
          <section className="best-section">
            <div className="best-section__header">
              <h3>Excellent Matches</h3>
              <p>High-confidence opportunities where your profile is strongly aligned</p>
            </div>
            <div className="best-section__grid">
              {excellentMatches.length > 0 ? excellentMatches.map((job) => (
                <div key={`excellent-${job.id}`}>
                  <JobCard
                    job={job}
                    onSave={handleSaveJob}
                    onToggleExpand={handleToggleExpand}
                    isExpanded={expandedJobId === String(job.id)}
                    expandedSection={expandedSection}
                    isSaved={savedJobIds.has(String(job.id))}
                    isApplied={appliedJobIds.has(String(job.id))}
                  />
                </div>
              )) : <div className="best-section__empty">No excellent matches yet. Keep your profile updated.</div>}
            </div>
          </section>

          <section className="best-section">
            <div className="best-section__header">
              <h3>Strong Matches</h3>
              <p>Good-fit roles where targeted resume improvements can boost results</p>
            </div>
            <div className="best-section__grid">
              {strongMatches.length > 0 ? strongMatches.map((job) => (
                <div key={`strong-${job.id}`}>
                  <JobCard
                    job={job}
                    onSave={handleSaveJob}
                    onToggleExpand={handleToggleExpand}
                    isExpanded={expandedJobId === String(job.id)}
                    expandedSection={expandedSection}
                    isSaved={savedJobIds.has(String(job.id))}
                    isApplied={appliedJobIds.has(String(job.id))}
                  />
                </div>
              )) : <div className="best-section__empty">No strong matches found right now.</div>}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default BestMatchesPage;
