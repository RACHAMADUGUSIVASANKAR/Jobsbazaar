import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiBriefcase, FiZap, FiCheckCircle, FiStar, FiBarChart2,
  FiTarget, FiBell, FiSettings, FiUser, FiLogOut, FiMenu, FiX, FiLock
} from 'react-icons/fi';
import AIAssistantPanel from '../components/dashboard/AIAssistantPanel';
import ApplicationPopup from '../components/dashboard/ApplicationPopup';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJob, setPendingJob] = useState(null);
  const [user, setUser] = useState({ name: 'Loading...', role: 'User' });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches;

  useEffect(() => {
    fetchProfile();
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileViewport()) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen && isMobileViewport()) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    fetchProfile();

    const handleApplyEvent = (e) => {
      setPendingJob(e.detail);
    };
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('jobApplied', handleApplyEvent);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('jobApplied', handleApplyEvent);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.status === 403) {
        setOnboardingComplete(false);
        navigate('/dashboard/profile');
        return;
      }
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setUser({
        name: data.name || data.email?.split('@')[0] || 'Professional User',
        role: data.skills?.[0] || 'Professional'
      });
      setOnboardingComplete(Boolean(data.onboardingCompleted || data.onboardingComplete));

      if (!Boolean(data.onboardingCompleted || data.onboardingComplete) && !location.pathname.startsWith('/dashboard/profile')) {
        navigate('/dashboard/profile', { replace: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmApply = async () => {
    try {
      await fetch(`/api/jobs/${pendingJob.id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision: 'yes', source: 'application-popup' })
      });
      localStorage.setItem(`applied-state-${pendingJob.id}`, 'applied');
      setPendingJob(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppliedEarlier = async () => {
    if (!pendingJob) return;
    try {
      await fetch(`/api/jobs/${pendingJob.id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision: 'applied-earlier', source: 'application-popup' })
      });
      localStorage.setItem(`applied-state-${pendingJob.id}`, 'applied-earlier');
      setPendingJob(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrowsingSkip = () => {
    if (pendingJob?.id) {
      fetch(`/api/jobs/${pendingJob.id}/decision`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ decision: 'skip', source: 'application-popup' })
      }).catch((err) => console.error(err));
      localStorage.setItem(`applied-state-${pendingJob.id}`, 'browsed');
    }
    setPendingJob(null);
  };

  const navItems = [
    { label: 'Job Feed', icon: <FiBriefcase />, path: '/dashboard/job-feed' },
    { label: 'Best Matches', icon: <FiZap />, path: '/dashboard/best-matches' },
    { label: 'Applied Jobs', icon: <FiCheckCircle />, path: '/dashboard/applied-jobs' },
    { label: 'Saved Jobs', icon: <FiStar />, path: '/dashboard/saved-jobs' },
    { label: 'Career Analytics', icon: <FiBarChart2 />, path: '/dashboard/career-analytics' },
    { label: 'Skill Gap Analyzer', icon: <FiTarget />, path: '/dashboard/skill-gap' },
    { label: 'Notifications', icon: <FiBell />, path: '/dashboard/notifications' },
    { label: 'Settings', icon: <FiSettings />, path: '/dashboard/settings' },
    { label: 'Profile', icon: <FiUser />, path: '/dashboard/profile' },
  ];

  const isLockedItem = (path) => !onboardingComplete && path !== '/dashboard/profile';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'dashboard-sidebar--open' : ''}`}>
        <button
          className="sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <FiX />
        </button>

        <div className="sidebar__logo">
          <img src="/images/logo.jpg" alt="Jobsbazaar" />
          <span>Jobsbazaar</span>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item, index) => {
            if (isLockedItem(item.path)) {
              return (
                <div
                  key={index}
                  className="sidebar__nav-item sidebar__nav-item--locked"
                  title="Complete your profile details to unlock dashboard features"
                >
                  <span className="nav-item__icon">{item.icon}</span>
                  <span className="nav-item__label">{item.label}</span>
                  <FiLock className="nav-item__lock" />
                </div>
              );
            }

            return (
              <NavLink
                key={index}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`
                }
              >
                <span className="nav-item__icon">{item.icon}</span>
                <span className="nav-item__label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__footer">
          <button onClick={handleLogout} className="sidebar__logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {!onboardingComplete && (
          <div className="dashboard-onboarding-lock-banner">
            Complete mandatory profile details (name, gender, skills) to unlock all dashboard features.
          </div>
        )}
        <header className="dashboard-header">
          <div className="header__search">
            <input type="text" placeholder="Search jobs, skills, or companies..." />
          </div>
          <div className="header__user">
            <div className="header__user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="User Avatar" />
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
        {onboardingComplete && <AIAssistantPanel />}
        {onboardingComplete && (
          <ApplicationPopup
            job={pendingJob}
            onConfirm={handleConfirmApply}
            onCancel={handleBrowsingSkip}
            onAppliedEarlier={handleAppliedEarlier}
          />
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
