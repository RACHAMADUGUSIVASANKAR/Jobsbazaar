import { useState, useEffect } from 'react';
import { FiCheckCircle, FiClock, FiChevronRight } from 'react-icons/fi';
import './AppliedJobsPage.css';

const AppliedJobsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (application, nextStatus) => {
    if (!application?.jobId || !nextStatus) return;

    try {
      setUpdatingId(String(application.id));
      const response = await fetch(`/api/jobs/${application.jobId}/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      setApplications((prev) => prev.map((item) => {
        if (item.id !== application.id) return item;
        const nextTimeline = Array.isArray(item.timeline) ? [...item.timeline] : [];
        nextTimeline.push({ status: nextStatus, date: new Date().toISOString() });
        return { ...item, status: nextStatus, timeline: nextTimeline };
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="applied-jobs-page">
      <div className="page-header">
        <h2>Applied Jobs</h2>
        <p>Track the status of your active applications</p>
      </div>

      {loading ? (
        <div className="loading">Fetching applications...</div>
      ) : (
        <div className="applications-list">
          {applications.length > 0 ? (
            applications.map(app => (
              <div key={app.id} className="app-card">
                <div className="app-card__info">
                  <h3>{app.jobTitle}</h3>
                  <span>{app.company}</span>
                </div>

                <div className="app-card__status">
                  <span className={`status-badge ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                  {app.jobStatus === 'Job Closed' && (
                    <span className="status-badge closed">Job Closed</span>
                  )}
                  <span className="app-date">Applied on {new Date(app.timestamp).toLocaleDateString()}</span>
                </div>

                <div className="app-card__actions">
                  <label htmlFor={`status-${app.id}`} className="status-label">Update Status</label>
                  <select
                    id={`status-${app.id}`}
                    className="status-select"
                    value={app.status}
                    onChange={(e) => handleStatusUpdate(app, e.target.value)}
                    disabled={updatingId === String(app.id)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="app-card__timeline">
                  {app.timeline?.map((step, i) => (
                    <div key={`timeline-${app.id}-${i}`} className="timeline-step">
                      <FiCheckCircle color="#00ADB5" />
                      <span>{step.status}</span>
                    </div>
                  ))}
                </div>

                <button className="view-details-btn">
                  View Details <FiChevronRight />
                </button>
              </div>
            ))
          ) : (
            <div className="no-apps">You haven't applied to any jobs yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppliedJobsPage;
