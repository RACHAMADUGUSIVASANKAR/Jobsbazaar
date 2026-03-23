import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BorderGlow from '../components/animations/BorderGlow';
import GlareHover from '../components/animations/GlareHover';
import { toApiUrl } from '../services/http';
import './SignupPage.css';

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

const SignupPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = form.password ? getPasswordStrength(form.password) : null;

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    const newErrors = { ...errors };

    if (field === 'email' && value && !validateEmail(value)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (field === 'email') {
      delete newErrors.email;
    }

    if (field === 'password' && value) {
      if (value.length < 8) newErrors.password = 'Minimum 8 characters required';
      else if (!/[A-Z]/.test(value)) newErrors.password = 'Must include an uppercase letter';
      else if (!/[a-z]/.test(value)) newErrors.password = 'Must include a lowercase letter';
      else if (!/[0-9]/.test(value)) newErrors.password = 'Must include a number';
      else if (!/[!@#$%^&*]/.test(value)) newErrors.password = 'Must include a special character (!@#$%^&*)';
      else delete newErrors.password;
    }

    if (field === 'confirmPassword' && value && value !== form.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    } else if (field === 'confirmPassword') {
      delete newErrors.confirmPassword;
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!validateEmail(form.email)) newErrors.email = 'Invalid email';
    if (!form.password) newErrors.password = 'Password is required';
    else if (strength && strength.label === 'Weak') newErrors.password = 'Password must be strong';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(toApiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
      });
      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Signup failed. Please try again.' });
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const frontendOrigin = encodeURIComponent(window.location.origin);
    window.location.href = toApiUrl(`/api/auth/google-login?frontend=${frontendOrigin}`);
  };

  return (
    <div className="signup-page">
      <Navbar />
      <div className="signup-page__wrapper">
        <div className="signup-page__left">
          <div className="signup-page__left-content">
            <h2 className="signup-page__left-title">Start your AI-powered job search.</h2>
            <p className="signup-page__left-desc">
              Create an account to unlock AI matching, career analytics, and smart application tracking.
            </p>
            <div className="signup-page__image-container">
              <img src="/images/cartoon-image.jpg" alt="Career Companion" className="signup-page__character-img" />
            </div>
          </div>
        </div>

        <div className="signup-page__right">
          <BorderGlow
            edgeSensitivity={25}
            glowColor="180 70 45"
            backgroundColor="#ffffff"
            borderRadius={20}
            glowRadius={30}
            glowIntensity={0.8}
            coneSpread={20}
            colors={['#00ADB5', '#00CED6', '#38bdf8']}
            className="signup-page__card-glow"
          >
            <div className="signup-page__card">
              <h2 className="signup-page__title">Create Account</h2>
              <p className="signup-page__subtitle">
                Join thousands of professionals using AI to land their dream job
              </p>

              {success && (
                <div className="signup-page__success">
                  Account created successfully! You can login now.
                </div>
              )}

              {errors.general && (
                <div className="signup-page__error-general">{errors.general}</div>
              )}

              {!success && (
                <form onSubmit={handleSubmit} className="signup-page__form">
                  {/* Name */}
                  <div className="signup-page__field">
                    <label className="signup-page__label" htmlFor="signup-name">Full Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      className={`signup-page__input ${errors.name ? 'signup-page__input--error' : ''}`}
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      autoComplete="name"
                    />
                    {errors.name && <span className="signup-page__field-error">{errors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className="signup-page__field">
                    <label className="signup-page__label" htmlFor="signup-email">Email</label>
                    <input
                      id="signup-email"
                      type="email"
                      className={`signup-page__input ${errors.email ? 'signup-page__input--error' : ''}`}
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      autoComplete="email"
                    />
                    {errors.email && <span className="signup-page__field-error">{errors.email}</span>}
                  </div>

                  {/* Password */}
                  <div className="signup-page__field">
                    <label className="signup-page__label" htmlFor="signup-password">Password</label>
                    <div className="signup-page__password-wrapper">
                      <input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`signup-page__input ${errors.password ? 'signup-page__input--error' : ''}`}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="signup-page__eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {/* Password Strength Meter */}
                    {form.password && strength && (
                      <div className="signup-page__strength">
                        <div className="signup-page__strength-bar">
                          <div
                            className="signup-page__strength-fill"
                            style={{ width: `${strength.percent}%`, background: strength.color }}
                          ></div>
                        </div>
                        <span className="signup-page__strength-label" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                    {errors.password && <span className="signup-page__field-error">{errors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="signup-page__field">
                    <label className="signup-page__label" htmlFor="signup-confirm">Confirm Password</label>
                    <div className="signup-page__password-wrapper">
                      <input
                        id="signup-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        className={`signup-page__input ${errors.confirmPassword ? 'signup-page__input--error' : ''}`}
                        placeholder="Confirm your password"
                        value={form.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="signup-page__eye-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#393E46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="signup-page__field-error">{errors.confirmPassword}</span>}
                  </div>

                  {/* Submit */}
                  <GlareHover
                    width="100%"
                    height="auto"
                    background="#00ADB5"
                    borderRadius="10px"
                    borderColor="#00ADB5"
                    glareColor="#ffffff"
                    glareOpacity={0.3}
                    glareAngle={-30}
                    glareSize={300}
                    transitionDuration={800}
                    className="signup-page__submit-glare"
                  >
                    <button type="submit" className="signup-page__submit-btn" disabled={loading}>
                      {loading ? <span className="signup-page__spinner"></span> : 'Create Account'}
                    </button>
                  </GlareHover>
                </form>
              )}

              {!success && (
                <>
                  <div className="signup-page__divider"><span>or</span></div>
                  <button type="button" className="signup-page__google-btn" onClick={handleGoogleLogin}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>
                  <p className="signup-page__login-link">
                    Already have an account? <Link to="/login">Login</Link>
                  </p>
                </>
              )}
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
