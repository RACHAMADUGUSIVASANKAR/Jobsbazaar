import { useState, useEffect } from 'react';
import JobCard from '../../components/dashboard/JobCard';
import './JobFeedPage.css';

const SavedJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      };
      const [savedResponse, applicationsResponse] = await Promise.all([
        fetch('/api/jobs/saved', { headers }),
        fetch('/api/jobs/applications', { headers })
      ]);

      const data = await savedResponse.json();
      const applications = applicationsResponse.ok ? await applicationsResponse.json() : [];
      setJobs(data);

      const nextApplied = new Set(
        Array.isArray(applications)
          ? applications.map((item) => String(item.jobId ?? item.id)).filter(Boolean)
          : []
      );
      setAppliedJobIds(nextApplied);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeSaved = async (jobId) => {
    try {
      setBusyId(`remove-${jobId}`);
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to remove saved job');
      setJobs((prev) => prev.filter((job) => String(job.id) !== String(jobId)));
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId('');
    }
  };

  const moveToApplied = async (job) => {
    if (job.jobStatus === 'Job Closed') return;
    try {
      setBusyId(`move-${job.id}`);
      const response = await fetch(`/api/jobs/${job.id}/move-to-applied`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: job.title,
          company: job.company,
          location: job.location,
          redirect_url: job.redirect_url,
          salary: job.salary,
          description: job.description,
          matchScore: job.matchScore,
          matchExplanation: job.matchExplanation
        })
      });

      if (!response.ok) throw new Error('Failed to move saved job to applied');
      setJobs((prev) => prev.filter((item) => String(item.id) !== String(job.id)));
    } catch (error) {
      console.error(error);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="job-feed-page">
      <div className="feed-header">
        <div className="feed-header__title">
          <h2>Saved Jobs</h2>
          <p>Your wishlist of opportunities you're interested in</p>
        </div>
      </div>

      {loading ? (
        <div className="feed-loading">Loading your wishlist...</div>
      ) : (
        <div className="job-grid">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id}>
                <JobCard job={job} isSaved isApplied={appliedJobIds.has(String(job.id))} />
                {job.jobStatus === 'Job Closed' && (
                  <div className="saved-job-closed">Job Closed</div>
                )}
                <div className="saved-job-actions">
                  <button
                    className="saved-job-action saved-job-action--primary"
                    onClick={() => moveToApplied(job)}
                    disabled={busyId === `move-${job.id}` || job.jobStatus === 'Job Closed' || appliedJobIds.has(String(job.id))}
                  >
                    {busyId === `move-${job.id}` ? 'Moving...' : appliedJobIds.has(String(job.id)) ? 'Already Applied' : 'Move to Applied'}
                  </button>
                  <button
                    className="saved-job-action saved-job-action--danger"
                    onClick={() => removeSaved(job.id)}
                    disabled={busyId === `remove-${job.id}`}
                  >
                    {busyId === `remove-${job.id}` ? 'Removing...' : 'Remove from Saved'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-jobs">You haven't saved any jobs yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
