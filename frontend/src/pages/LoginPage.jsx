import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BorderGlow from '../components/animations/BorderGlow';
import GlareHover from '../components/animations/GlareHover';
import { toApiUrl } from '../services/http';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauthToken = params.get('token');
    const oauthError = params.get('oauthError');

    if (oauthToken) {
      localStorage.setItem('token', oauthToken);
      navigate('/dashboard', { replace: true });
      return;
    }

    if (oauthError) {
      setErrors({ general: 'Google login failed. Please try again.' });
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate]);

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !validateEmail(val)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (val && val.length < 1) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!validateEmail(email)) newErrors.email = 'Please enter a valid email address';

    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(toApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Invalid email or password' });
      } else {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      }
    } catch (err) {
      setErrors({ general: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google OAuth will be handled by backend
    window.location.href = toApiUrl('/api/auth/google-login');
  };

  return (
    <div className="login-page">
      <Navbar />
      <div className="login-page__wrapper">
        {/* Left Side - Illustration Text */}
        <div className="login-page__left">
          <div className="login-page__left-content">
            <h2 className="login-page__left-title">Track jobs smarter using AI</h2>
            <p className="login-page__left-desc">
              Your AI-powered career companion that finds, matches, and tracks the best opportunities for you
            </p>
            <div className="login-page__image-container">
              <img src="/images/cartoon-image.jpg" alt="Career Companion" className="login-page__character-img" />
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-page__right">
          <BorderGlow
            edgeSensitivity={25}
            glowColor="180 70 45"
            backgroundColor="#ffffff"
            borderRadius={20}
            glowRadius={30}
            glowIntensity={0.8}
            coneSpread={20}
            colors={['#00ADB5', '#00CED6', '#38bdf8']}
            className="login-page__card-glow"
          >
            <div className="login-page__card">
              <h2 className="login-page__title">Welcome Back</h2>
              <p className="login-page__subtitle">
                Login to continue tracking your job applications
              </p>

              {/* Success Message */}
              {success && (
                <div className="login-page__success">
                  Login successful! Redirecting to dashboard...
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="login-page__error-general">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-page__form">
                {/* Email */}
                <div className="login-page__field">
                  <label className="login-page__label" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    className={`login-page__input ${errors.email ? 'login-page__input--error' : ''}`}
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    autoComplete="email"
                  />
                  {errors.email && <span className="login-page__field-error">{errors.email}</span>}
                </div>

                {/* Password */}
                <div className="login-page__field">
                  <label className="login-page__label" htmlFor="login-password">Password</label>
                  <div className="login-page__password-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`login-page__input ${errors.password ? 'login-page__input--error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={handlePasswordChange}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="login-page__eye-btn"
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
                  {errors.password && <span className="login-page__field-error">{errors.password}</span>}
                </div>

                {/* Forgot Password */}
                <div className="login-page__forgot">
                  <Link to="/forgot-password" className="login-page__forgot-link">Forgot password?</Link>
                </div>

                {/* Login Button */}
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
                  className="login-page__submit-glare"
                >
                  <button
                    type="submit"
                    className="login-page__submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="login-page__spinner"></span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </GlareHover>
              </form>

              {/* Divider */}
              <div className="login-page__divider">
                <span>or</span>
              </div>

              {/* Google Login */}
              <button
                type="button"
                className="login-page__google-btn"
                onClick={handleGoogleLogin}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              {/* Sign Up Link */}
              <p className="login-page__signup-link">
                Don't have an account?{' '}
                <Link to="/signup">Sign Up</Link>
              </p>
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
