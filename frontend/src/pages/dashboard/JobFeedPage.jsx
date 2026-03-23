import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../../components/dashboard/JobCard';
import './JobFeedPage.css';

const POLL_MS = 60000;
const DEFAULT_PAGE_SIZE = 25;
const VIRTUAL_ROW_HEIGHT = 360;
const VIRTUAL_OVERSCAN = 5;
const VIRTUALIZATION_THRESHOLD = 80;

const SKILL_OPTIONS = [
  'React',
  'Node.js',
  'Python',
  'TypeScript',
  'Java',
  'AWS',
  'Docker',
  'Kubernetes',
  'MongoDB',
  'SQL'
];

const DEFAULT_FILTERS = {
  role: '',
  location: '',
  skills: [],
  category: 'All',
  jobType: 'All',
  workMode: 'All',
  matchScore: 'All',
  datePosted: 'Any time'
};

const normalizeWorkMode = (value = '') => value.toLowerCase().replace(/[\s-]+/g, '_');

const normalizeDate = (job) => {
  return new Date(job.created || job.created_at || job.posted || Date.now()).getTime();
};

const filterByDatePosted = (job, datePostedFilter) => {
  if (datePostedFilter === 'Any time') return true;

  const days = {
    'Last 24 hours': 1,
    'Last week': 7,
    'Last month': 30
  }[datePostedFilter];

  if (!days) return true;
  const ageMs = Date.now() - normalizeDate(job);
  return ageMs <= days * 24 * 60 * 60 * 1000;
};

const JobFeedPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState('');
  const [expandedSection, setExpandedSection] = useState('match');
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [highlightedFilter, setHighlightedFilter] = useState('');
  const [feedError, setFeedError] = useState('');
  const [resumeRequired, setResumeRequired] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState('');
  const [refreshSummary, setRefreshSummary] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [backgroundSyncInfo, setBackgroundSyncInfo] = useState('');
  const [virtualScrollTop, setVirtualScrollTop] = useState(0);
  const [virtualViewportHeight, setVirtualViewportHeight] = useState(720);
  const virtualListRef = useRef(null);
  const skillsMenuRef = useRef(null);
  const [skillsMenuOpen, setSkillsMenuOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    fetchDashboardData({ page: 1, append: false });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData({ silent: true, page: 1, append: false });
    }, POLL_MS);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchDashboardData({ page: 1, append: false });
  }, [
    filters.role,
    filters.location,
    filters.skills,
    filters.category,
    filters.jobType,
    filters.workMode,
    filters.matchScore,
    filters.datePosted
  ]);

  useEffect(() => {
    window.__jobFeedFilters = filters;
    return () => {
      delete window.__jobFeedFilters;
    };
  }, [filters]);

  useEffect(() => {
    const handleAiFilters = (event) => {
      const incoming = event.detail || {};

      const incomingSkills = Array.isArray(incoming.skills)
        ? incoming.skills
        : (typeof incoming.skills === 'string'
          ? incoming.skills.split(',').map((item) => item.trim()).filter(Boolean)
          : filters.skills);

      const nextFilters = {
        role: incoming.role ?? filters.role,
        location: incoming.location ?? filters.location,
        skills: incomingSkills,
        jobType: incoming.jobType ?? filters.jobType,
        workMode: incoming.workMode ?? filters.workMode,
        matchScore: incoming.matchScore ?? filters.matchScore,
        datePosted: incoming.datePosted ?? incoming.postedWithin ?? filters.datePosted
      };

      setFilters(nextFilters);

      const keys = Object.keys(incoming).filter((key) => incoming[key]);
      if (keys.length) {
        setHighlightedFilter(keys[0]);
        setTimeout(() => setHighlightedFilter(''), 1200);
      }
    };

    window.addEventListener('updateFilters', handleAiFilters);
    return () => window.removeEventListener('updateFilters', handleAiFilters);
  }, [filters]);

  useEffect(() => {
    const handleAssistantRefresh = () => {
      handleRefreshLiveJobs();
    };

    window.addEventListener('assistantRefreshLiveJobs', handleAssistantRefresh);
    return () => window.removeEventListener('assistantRefreshLiveJobs', handleAssistantRefresh);
  }, [filters]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!skillsMenuRef.current) return;
      if (!skillsMenuRef.current.contains(event.target)) {
        setSkillsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    const maxBackgroundLoad = Math.min(Number(totalJobs || 0) || 1000, 1000);
    if (loading || loadingMore) return;
    if (!hasNextPage) return;
    if (jobs.length >= maxBackgroundLoad) return;

    const timer = setTimeout(() => {
      handleLoadMore();
    }, 120);

    return () => clearTimeout(timer);
  }, [loading, loadingMore, hasNextPage, jobs.length, totalJobs]);

  const safeParseJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const fetchDashboardData = async ({ silent = false, page = 1, append = false } = {}) => {
    if (!silent) {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setFeedError('');
      setResumeRequired(false);
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setFeedError('Session expired. Please log in again.');
        setJobs([]);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const shouldFetchUserLists = page === 1 && !append;
      const queryParams = new URLSearchParams({
        role: filters.role || 'software',
        location: filters.location || '',
        skills: (filters.skills || []).join(', '),
        category: filters.category || 'All',
        jobType: filters.jobType || 'All',
        workMode: filters.workMode || 'All',
        matchScore: filters.matchScore || 'All',
        datePosted: filters.datePosted || 'Any time',
        page: String(page),
        pageSize: String(DEFAULT_PAGE_SIZE)
      });

      const requests = [
        fetch(`/api/jobs?${queryParams.toString()}`, { headers }),
        shouldFetchUserLists ? fetch('/api/jobs/applications', { headers }) : Promise.resolve(null),
        shouldFetchUserLists ? fetch('/api/jobs/saved', { headers }) : Promise.resolve(null)
      ];

      const [jobsResponse, applicationsResponse, savedResponse] = await Promise.all(requests);

      if (!jobsResponse.ok) {
        const jobsError = await safeParseJson(jobsResponse);
        const onboardingRequired =
          jobsResponse.status === 403 &&
          (jobsError?.code === 'ONBOARDING_REQUIRED'
            || jobsError?.code === 'RESUME_REQUIRED'
            || `${jobsError?.message || ''}`.toLowerCase().includes('complete profile')
            || `${jobsError?.message || ''}`.toLowerCase().includes('onboarding')
            || `${jobsError?.message || ''}`.toLowerCase().includes('upload your resume'));

        if (onboardingRequired) {
          setResumeRequired(true);
          setJobs([]);
          return;
        }

        setFeedError(jobsError?.message || 'Unable to load jobs right now.');
        setJobs([]);
        return;
      }

      const jobsData = await safeParseJson(jobsResponse);
      const applicationsDataRaw = applicationsResponse?.ok ? await safeParseJson(applicationsResponse) : [];
      const savedDataRaw = savedResponse?.ok ? await safeParseJson(savedResponse) : [];

      if (shouldFetchUserLists) {
        const applicationsData = Array.isArray(applicationsDataRaw) ? applicationsDataRaw : [];
        const savedData = Array.isArray(savedDataRaw) ? savedDataRaw : [];

        const nextApplied = new Set(
          applicationsData.map((item) => String(item.jobId ?? item.id)).filter(Boolean)
        );
        const nextSaved = new Set(
          savedData.map((item) => String(item.id))
        );

        setAppliedJobIds(nextApplied);
        setSavedJobIds(nextSaved);
      }

      const feedItems = Array.isArray(jobsData) ? jobsData : (Array.isArray(jobsData?.items) ? jobsData.items : []);
      const feedMeta = Array.isArray(jobsData) ? null : jobsData?.meta;

      if (feedMeta) {
        setHasNextPage(Boolean(feedMeta.hasNext));
        setCurrentPage(Number(feedMeta.page || 1));
        setTotalJobs(Number(feedMeta.total || feedItems.length));
        if (feedMeta.lastSyncAt) {
          setLastSyncAt(new Date(feedMeta.lastSyncAt).toLocaleString());
        }
        if (feedMeta.stale && feedMeta.refreshQueued) {
          setBackgroundSyncInfo('Showing cached jobs while fresh jobs sync in background.');
        } else if (feedMeta.stale) {
          setBackgroundSyncInfo('Showing cached jobs; background sync is in progress.');
        } else {
          setBackgroundSyncInfo('');
        }
      } else {
        setHasNextPage(false);
        setCurrentPage(1);
        setTotalJobs(feedItems.length);
      }

      const normalizedJobs = feedItems
        .map((job) => {
          const score = Number(job.matchScore || 0);
          return {
            ...job,
            matchScore: score,
            matchGroup: score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Low',
            createdAtUnix: normalizeDate(job)
          };
        })
        ;

      if (feedItems.length > 0 && !feedMeta?.lastSyncAt) {
        const latestSeen = feedItems
          .map((job) => new Date(job.lastSeenAt || job.updatedAt || job.createdAt || Date.now()).getTime())
          .filter((value) => Number.isFinite(value))
          .sort((a, b) => b - a)[0];

        if (latestSeen) {
          setLastSyncAt(new Date(latestSeen).toLocaleString());
        }
      }

      if (!Array.isArray(feedItems)) {
        setFeedError('Unexpected response while loading jobs. Please try again.');
      }

      const filtered = normalizedJobs.sort((a, b) => b.matchScore - a.matchScore || b.createdAtUnix - a.createdAtUnix);

      if (append) {
        setJobs((prev) => {
          const map = new Map(prev.map((item) => [String(item.id), item]));
          for (const job of filtered) {
            map.set(String(job.id), job);
          }
          return Array.from(map.values()).sort((a, b) => b.matchScore - a.matchScore || b.createdAtUnix - a.createdAtUnix);
        });
      } else {
        setJobs(filtered);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      if (!silent) {
        setFeedError('Could not connect to job services. Please try again.');
        setJobs([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const bestMatches = jobs.filter((job) => job.matchScore > 40).slice(0, 8);

  const activeFilters = [
    filters.role ? `Role: ${filters.role}` : '',
    filters.location ? `Location: ${filters.location}` : '',
    filters.skills.length ? `Skills: ${filters.skills.join(', ')}` : '',
    filters.jobType !== 'All' ? `Type: ${filters.jobType}` : '',
    filters.workMode !== 'All' ? `Mode: ${filters.workMode}` : '',
    filters.matchScore !== 'All' ? `Score: ${filters.matchScore}` : '',
    filters.datePosted !== 'Any time' ? `Date: ${filters.datePosted}` : ''
  ].filter(Boolean);

  const handleSkillToggle = (skill) => {
    const hasSkill = filters.skills.includes(skill);
    const nextSkills = hasSkill
      ? filters.skills.filter((item) => item !== skill)
      : [...filters.skills, skill];
    setFilters({ ...filters, skills: nextSkills });
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSkillsMenuOpen(false);
  };

  const handleRefreshLiveJobs = async () => {
    try {
      setRefreshingLive(true);
      const response = await fetch('/api/jobs/refresh-live', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: filters.role || 'software',
          location: filters.location || ''
        })
      });

      if (!response.ok) {
        const refreshError = await safeParseJson(response);
        throw new Error(refreshError?.message || 'Unable to refresh live jobs');
      }
      const refreshData = await safeParseJson(response);
      if (refreshData) {
        const result = refreshData.lastResult || null;
        setRefreshSummary({
          inserted: result?.inserted || 0,
          closed: result?.closed || 0,
          reactivated: result?.reactivated || 0
        });
        setBackgroundSyncInfo(refreshData.running ? 'Live refresh running in background.' : '');
        if (refreshData.lastRunAt) {
          setLastSyncAt(new Date(refreshData.lastRunAt).toLocaleString());
        }
      }
      setFeedError('');
      await fetchDashboardData({ silent: true, page: 1, append: false });
    } catch (error) {
      console.error('Live refresh failed:', error);
      setFeedError(error.message || 'Live refresh failed. Please try again.');
    } finally {
      setRefreshingLive(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore) return;
    await fetchDashboardData({ page: currentPage + 1, append: true });
  };

  const handleSaveJob = async (job) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}/save`, {
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

  const virtualizedEnabled = jobs.length >= VIRTUALIZATION_THRESHOLD && !expandedJobId;

  const onVirtualScroll = useCallback((event) => {
    setVirtualScrollTop(event.currentTarget.scrollTop || 0);
    setVirtualViewportHeight(event.currentTarget.clientHeight || 720);
  }, []);

  useEffect(() => {
    if (!virtualizedEnabled) return;
    const element = virtualListRef.current;
    if (!element) return;
    setVirtualViewportHeight(element.clientHeight || 720);
  }, [virtualizedEnabled, jobs.length]);

  const virtualWindow = useMemo(() => {
    if (!virtualizedEnabled) {
      return {
        startIndex: 0,
        endIndex: jobs.length,
        topOffset: 0,
        totalHeight: 0,
        visibleJobs: jobs
      };
    }

    const estimatedStart = Math.floor(virtualScrollTop / VIRTUAL_ROW_HEIGHT);
    const visibleCount = Math.ceil(virtualViewportHeight / VIRTUAL_ROW_HEIGHT);
    const startIndex = Math.max(0, estimatedStart - VIRTUAL_OVERSCAN);
    const endIndex = Math.min(jobs.length, estimatedStart + visibleCount + VIRTUAL_OVERSCAN);
    const topOffset = startIndex * VIRTUAL_ROW_HEIGHT;
    const totalHeight = jobs.length * VIRTUAL_ROW_HEIGHT;

    return {
      startIndex,
      endIndex,
      topOffset,
      totalHeight,
      visibleJobs: jobs.slice(startIndex, endIndex)
    };
  }, [virtualizedEnabled, jobs, virtualScrollTop, virtualViewportHeight]);

  return (
    <div className="job-feed-page">
      <div className="feed-header">
        <div className="feed-header__title">
          <h2>Job Feed</h2>
          <p>Ranked by your profile strength and live market relevance</p>
        </div>

        <div className="feed-header__actions">
          <button className="live-refresh-btn" onClick={handleRefreshLiveJobs} disabled={refreshingLive}>
            {refreshingLive ? 'Refreshing...' : 'Fetch Latest Jobs'}
          </button>
          {(lastSyncAt || refreshSummary) && (
            <div className="feed-sync-meta">
              {lastSyncAt && <span>Last synced: {lastSyncAt}</span>}
              {refreshSummary && (
                <span>
                  Added {refreshSummary.inserted} | Closed {refreshSummary.closed} | Re-activated {refreshSummary.reactivated}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="feed-filters">
          <input
            className={`filter-control filter-control--role ${highlightedFilter === 'role' ? 'filter-highlight' : ''}`}
            value={filters.role}
            placeholder="Role or company"
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          />
          <input
            className={`filter-control ${highlightedFilter === 'location' ? 'filter-highlight' : ''}`}
            value={filters.location}
            placeholder="Location"
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          />

          <div className="skills-filter" ref={skillsMenuRef}>
            <button
              type="button"
              className={`skills-filter__trigger filter-control ${highlightedFilter === 'skills' ? 'filter-highlight' : ''}`}
              onClick={() => setSkillsMenuOpen((prev) => !prev)}
            >
              {filters.skills.length ? `${filters.skills.length} skills selected` : 'Select skills'}
            </button>

            {skillsMenuOpen && (
              <div className="skills-filter__menu">
                {SKILL_OPTIONS.map((skill) => {
                  const checked = filters.skills.includes(skill);
                  return (
                    <label key={skill} className="skills-filter__option">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleSkillToggle(skill)}
                      />
                      <span>{skill}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <select
            className={`filter-control ${highlightedFilter === 'category' ? 'filter-highlight' : ''}`}
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="All">All Categories</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="aiml">AI/ML</option>
            <option value="cloud">Cloud</option>
            <option value="data">Data</option>
            <option value="cybersecurity">Security</option>
            <option value="mobile">Mobile</option>
            <option value="devops">DevOps</option>
            <option value="testing">QA & Testing</option>
            <option value="internship">Internship</option>
          </select>
          <select
            className={`filter-control ${highlightedFilter === 'jobType' ? 'filter-highlight' : ''}`}
            value={filters.jobType}
            onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
          >
            <option value="All">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <select
            className={`filter-control ${highlightedFilter === 'workMode' ? 'filter-highlight' : ''}`}
            value={filters.workMode}
            onChange={(e) => setFilters({ ...filters, workMode: e.target.value })}
          >
            <option value="All">All Work Modes</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          <select
            className={`filter-control ${highlightedFilter === 'matchScore' ? 'filter-highlight' : ''}`}
            value={filters.matchScore}
            onChange={(e) => setFilters({ ...filters, matchScore: e.target.value })}
          >
            <option value="All">All Match Scores</option>
            <option value="High">High (&gt;70%)</option>
            <option value="Medium">Medium (40-70%)</option>
            <option value="Low">Low (&lt;40%)</option>
          </select>

          <select
            className={`filter-control ${highlightedFilter === 'datePosted' ? 'filter-highlight' : ''}`}
            value={filters.datePosted}
            onChange={(e) => setFilters({ ...filters, datePosted: e.target.value })}
          >
            <option value="Any time">Any time</option>
            <option value="Last 24 hours">Last 24 hours</option>
            <option value="Last week">Last week</option>
            <option value="Last month">Last month</option>
          </select>

          <button
            type="button"
            className="clear-filters-btn"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="active-filters-row">
          {activeFilters.map((item) => (
            <span key={item} className="active-filter-chip">{item}</span>
          ))}
          {totalJobs > 0 && <span className="active-filter-chip active-filter-chip--count">Loaded {jobs.length} of {totalJobs}</span>}
        </div>
      )}

      {backgroundSyncInfo && <div className="feed-info-banner">{backgroundSyncInfo}</div>}

      {!loading && bestMatches.length > 0 && (
        <section className="best-matches-strip">
          <div className="best-matches-strip__header">
            <h3>Top AI Best Matches</h3>
            <span>{bestMatches.length} high-confidence opportunities</span>
          </div>
          <div className="best-matches-strip__grid">
            {bestMatches.map((job) => (
              <div key={`best-${job.id}`}>
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
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="feed-loading">Scanning real-time jobs...</div>
      ) : resumeRequired ? (
        <div className="no-jobs no-jobs--error">
          <h4>Complete Profile To Unlock Job Matches</h4>
          <p>Add required profile details and upload your resume to unlock AI-matched job feeds.</p>
          <div className="no-jobs__actions">
            <button className="live-refresh-btn" onClick={() => navigate('/dashboard/profile')}>
              Go To Profile
            </button>
            <button className="live-refresh-btn" onClick={() => navigate('/upload-resume')}>
              Upload Resume
            </button>
          </div>
        </div>
      ) : feedError ? (
        <div className="no-jobs no-jobs--error">
          <h4>Unable to load jobs</h4>
          <p>{feedError}</p>
          <div className="no-jobs__actions">
            <button className="live-refresh-btn" onClick={fetchDashboardData}>
              Retry
            </button>
            <button className="live-refresh-btn" onClick={handleRefreshLiveJobs} disabled={refreshingLive}>
              {refreshingLive ? 'Refreshing...' : 'Fetch Latest Jobs'}
            </button>
          </div>
        </div>
      ) : (
        <div className="job-grid">
          {jobs.length > 0 ? (
            <>
              {virtualizedEnabled ? (
                <div
                  className="job-grid-virtual"
                  ref={virtualListRef}
                  onScroll={onVirtualScroll}
                >
                  <div className="job-grid-virtual-spacer" style={{ height: `${virtualWindow.totalHeight}px` }}>
                    <div
                      className="job-grid-virtual-inner"
                      style={{ transform: `translateY(${virtualWindow.topOffset}px)` }}
                    >
                      {virtualWindow.visibleJobs.map((job) => (
                        <div key={job.id} className="job-grid-virtual-row" style={{ minHeight: `${VIRTUAL_ROW_HEIGHT}px` }}>
                          <JobCard
                            job={job}
                            onSave={handleSaveJob}
                            onToggleExpand={handleToggleExpand}
                            isExpanded={false}
                            expandedSection={expandedSection}
                            isSaved={savedJobIds.has(String(job.id))}
                            isApplied={appliedJobIds.has(String(job.id))}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                jobs.map(job => (
                  <div key={job.id}>
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
                ))
              )}
              {hasNextPage && (
                <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? 'Loading more jobs...' : 'Load More Jobs'}
                </button>
              )}
            </>
          ) : (
            <div className="no-jobs">
              <h4>No matching jobs found</h4>
              <p>Try widening role/location filters or fetch latest jobs from live providers.</p>
              <button className="live-refresh-btn" onClick={handleRefreshLiveJobs} disabled={refreshingLive}>
                {refreshingLive ? 'Refreshing...' : 'Fetch Latest Jobs'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobFeedPage;
