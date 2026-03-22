import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BorderGlow from '../components/animations/BorderGlow';
import GlareHover from '../components/animations/GlareHover';
import './ResetPasswordPage.css';

const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak', color: '#e74c3c', percent: 33 };
  if (score <= 3) return { label: 'Medium', color: '#f39c12', percent: 66 };
  return { label: 'Strong', color: '#27ae60', percent: 100 };
};

const ResetPasswordPage = () => {
  const { token: tokenFromParams } = useParams();
  const location = useLocation();
  const tokenFromQuery = new URLSearchParams(location.search).get('token');
  const token = tokenFromParams || tokenFromQuery;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = password ? getPasswordStrength(password) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!token) newErrors.general = 'Reset token is missing or invalid.';
    if (!password) newErrors.password = 'Password is required';
    else if (strength.label === 'Weak') newErrors.password = 'Password must be strong';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await response.json();
      if (!response.ok) setErrors({ general: data.message || 'Reset failed' });
      else setSuccess(true);
    } catch {
      setErrors({ general: 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <Navbar />
      <div className="reset-page__wrapper">
        <BorderGlow
          edgeSensitivity={25} glowColor="180 70 45" backgroundColor="#ffffff"
          borderRadius={20} glowRadius={30} glowIntensity={0.8} coneSpread={20}
          colors={['#00ADB5', '#00CED6', '#38bdf8']} className="reset-page__card-glow"
        >
          <div className="reset-page__card">
            <h2 className="reset-page__title">Reset Password</h2>
            <p className="reset-page__subtitle">Create a new strong password for your account.</p>

            {success ? (
              <div className="reset-page__success">
                Password reset successful! <Link to="/login">Login now</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="reset-page__form">
                {errors.general && <div className="reset-page__error">{errors.general}</div>}
                <div className="reset-page__field">
                  <label className="reset-page__label">New Password</label>
                  <div className="reset-page__pw-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`reset-page__input ${errors.password ? 'reset-page__input--error' : ''}`}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="reset-page__eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                  {password && strength && (
                    <div className="reset-page__strength">
                      <div className="reset-page__strength-bar">
                        <div className="reset-page__strength-fill" style={{ width: `${strength.percent}%`, background: strength.color }}></div>
                      </div>
                      <span style={{ color: strength.color, fontSize: '0.75rem', fontWeight: 600 }}>{strength.label}</span>
                    </div>
                  )}
                  {errors.password && <span className="reset-page__field-error">{errors.password}</span>}
                </div>
                <div className="reset-page__field">
                  <label className="reset-page__label">Confirm Password</label>
                  <input
                    type="password"
                    className={`reset-page__input ${errors.confirmPassword ? 'reset-page__input--error' : ''}`}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && <span className="reset-page__field-error">{errors.confirmPassword}</span>}
                </div>
                <GlareHover width="100%" height="auto" background="#00ADB5" borderRadius="10px" borderColor="#00ADB5" glareColor="#ffffff" glareOpacity={0.3} className="reset-page__submit-glare">
                  <button type="submit" className="reset-page__submit-btn" disabled={loading}>
                    {loading ? <span className="reset-page__spinner"></span> : 'Reset Password'}
                  </button>
                </GlareHover>
              </form>
            )}
          </div>
        </BorderGlow>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
