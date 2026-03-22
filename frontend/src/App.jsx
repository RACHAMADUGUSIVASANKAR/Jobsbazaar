import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import EmailVerificationPage from './pages/EmailVerificationPage'
import DashboardLayout from './layouts/DashboardLayout'
import ResumeUploadPage from './pages/ResumeUploadPage'
import JobFeedPage from './pages/dashboard/JobFeedPage'
import BestMatchesPage from './pages/dashboard/BestMatchesPage'
import AppliedJobsPage from './pages/dashboard/AppliedJobsPage'
import SavedJobsPage from './pages/dashboard/SavedJobsPage'
import CareerAnalyticsPage from './pages/dashboard/CareerAnalyticsPage'
import SkillGapAnalyzerPage from './pages/dashboard/SkillGapAnalyzerPage'
import NotificationsPage from './pages/dashboard/NotificationsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import ProfilePage from './pages/dashboard/ProfilePage'

import { useEffect } from 'react'
import { useState } from 'react'

const AuthenticatedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ResumeGuard = ({ mode, children }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkResumeState = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAllowed(false);
        setChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          setAllowed(false);
          setChecking(false);
          return;
        }

        let hasResume = false;
        if (response.ok) {
          const data = await response.json();
          hasResume = Boolean(data?.resumeText);
        }

        if (mode === 'require-resume') {
          if (hasResume) {
            setAllowed(true);
          } else {
            navigate('/upload-resume', { replace: true });
            setAllowed(false);
          }
        }

        if (mode === 'upload-only') {
          if (hasResume) {
            navigate('/dashboard/job-feed', { replace: true });
            setAllowed(false);
          } else {
            setAllowed(true);
          }
        }
      } catch (error) {
        if (mode === 'require-resume') {
          navigate('/upload-resume', { replace: true });
          setAllowed(false);
        } else {
          setAllowed(true);
        }
      } finally {
        setChecking(false);
      }
    };

    checkResumeState();
  }, [mode, navigate]);

  if (checking) {
    return <div className="app-route-loader">Checking profile setup...</div>;
  }

  return allowed ? children : null;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedPath = location.pathname.replace(/\/+/g, '/');
    if (normalizedPath !== location.pathname) {
      navigate(`${normalizedPath}${location.search}${location.hash}`, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/verify-email/:token" element={<EmailVerificationPage />} />
      <Route
        path="/dashboard"
        element={
          <AuthenticatedRoute>
            <ResumeGuard mode="require-resume">
              <DashboardLayout />
            </ResumeGuard>
          </AuthenticatedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/job-feed" replace />} />
        <Route path="job-feed" element={<JobFeedPage />} />
        <Route path="best-matches" element={<BestMatchesPage />} />
        <Route path="applied-jobs" element={<AppliedJobsPage />} />
        <Route path="saved-jobs" element={<SavedJobsPage />} />
        <Route path="career-analytics" element={<CareerAnalyticsPage />} />
        <Route path="skill-gap" element={<SkillGapAnalyzerPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/upload-resume"
        element={
          <AuthenticatedRoute>
            <ResumeGuard mode="upload-only">
              <ResumeUploadPage />
            </ResumeGuard>
          </AuthenticatedRoute>
        }
      />
    </Routes>
  )
}

export default App
