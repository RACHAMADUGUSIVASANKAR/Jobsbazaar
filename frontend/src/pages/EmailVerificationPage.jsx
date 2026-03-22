import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { toApiUrl } from '../services/http';
import './EmailVerificationPage.css';

const EmailVerificationPage = () => {
  const { token: tokenFromParams } = useParams();
  const location = useLocation();
  const tokenFromQuery = new URLSearchParams(location.search).get('token');
  const token = tokenFromParams || tokenFromQuery;
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing or invalid.');
        return;
      }

      try {
        const response = await fetch(toApiUrl('/api/auth/verify-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div className="verify-page">
      <Navbar />
      <div className="verify-page__wrapper">
        <div className="verify-page__card">
          {status === 'loading' && (
            <>
              <div className="verify-page__spinner"></div>
              <h2 className="verify-page__title">Verifying your email...</h2>
              <p className="verify-page__text">Please wait while we verify your email address.</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="verify-page__icon verify-page__icon--success">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="rgba(39,174,96,0.1)" stroke="#27ae60" strokeWidth="2" />
                  <path d="M14 24L21 31L34 17" stroke="#27ae60" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="verify-page__title">{message}</h2>
              <Link to="/login" className="verify-page__btn">Go to Login</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="verify-page__icon verify-page__icon--error">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="rgba(231,76,60,0.1)" stroke="#e74c3c" strokeWidth="2" />
                  <path d="M16 16L32 32M32 16L16 32" stroke="#e74c3c" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="verify-page__title">{message}</h2>
              <Link to="/signup" className="verify-page__btn">Try Again</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
