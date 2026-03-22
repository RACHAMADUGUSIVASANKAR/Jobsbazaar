import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BorderGlow from '../components/animations/BorderGlow';
import GlareHover from '../components/animations/GlareHover';
import { toApiUrl } from '../services/http';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return; }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(toApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Something went wrong');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <Navbar />
      <div className="forgot-page__wrapper">
        <BorderGlow
          edgeSensitivity={25}
          glowColor="180 70 45"
          backgroundColor="#ffffff"
          borderRadius={20}
          glowRadius={30}
          glowIntensity={0.8}
          coneSpread={20}
          colors={['#00ADB5', '#00CED6', '#38bdf8']}
          className="forgot-page__card-glow"
        >
          <div className="forgot-page__card">
            <h2 className="forgot-page__title">Forgot Password</h2>
            <p className="forgot-page__subtitle">
              Enter your email address and we will send you a password reset link.
            </p>

            {success ? (
              <div className="forgot-page__success">
                Password reset link has been sent to your email. Please check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="forgot-page__form">
                {error && <div className="forgot-page__error">{error}</div>}
                <div className="forgot-page__field">
                  <label className="forgot-page__label" htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="forgot-page__input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  />
                </div>
                <GlareHover
                  width="100%"
                  height="auto"
                  background="#00ADB5"
                  borderRadius="10px"
                  borderColor="#00ADB5"
                  glareColor="#ffffff"
                  glareOpacity={0.3}
                  className="forgot-page__submit-glare"
                >
                  <button type="submit" className="forgot-page__submit-btn" disabled={loading}>
                    {loading ? <span className="forgot-page__spinner"></span> : 'Send Reset Link'}
                  </button>
                </GlareHover>
              </form>
            )}

            <p className="forgot-page__back-link">
              Remember your password? <Link to="/login">Login</Link>
            </p>
          </div>
        </BorderGlow>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
