import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BorderGlow from './animations/BorderGlow';
import GlareHover from './animations/GlareHover';
import './Navbar.css';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Career Analytics', href: '#why-unique' },
  { label: 'Contact', href: '#footer' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
      setMobileOpen(false);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${mobileOpen ? 'navbar--mobile-open' : ''}`}>
      <div className="navbar__container">
        {/* Left Side - Logo */}
        <div className="navbar__left">
          <Link to="/" className="navbar__logo">
            <div className="navbar__logo-icon">
              <img src="/images/logo.jpg" alt="Jobsbazaar Logo" className="navbar__logo-image" />
            </div>
            <span className="navbar__logo-text">Jobsbazaar</span>
          </Link>
        </div>

        {/* Center Menu Links */}
        {isLanding && (
          <div className={`navbar__center ${mobileOpen ? 'navbar__center--open' : ''}`}>
            <ul className="navbar__links">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="navbar__link"
                    onClick={(e) => handleNavClick(e, link.href)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Right Side Buttons */}
        <div className="navbar__right">
          <Link to="/login" className="navbar__login-btn">Login</Link>
          <BorderGlow
            edgeSensitivity={30}
            glowColor="180 80 50"
            backgroundColor="#00ADB5"
            borderRadius={10}
            glowRadius={20}
            glowIntensity={1.2}
            coneSpread={25}
            colors={['#00ADB5', '#00CED6', '#009DA5']}
            className="navbar__signup-glow"
          >
            <GlareHover
              width="auto"
              height="auto"
              background="transparent"
              borderRadius="10px"
              borderColor="transparent"
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="navbar__signup-glare"
            >
              <Link to="/signup" className="navbar__signup-btn">Sign Up</Link>
            </GlareHover>
          </BorderGlow>
        </div>

        {/* Mobile Hamburger */}
        <button
          className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--active' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="navbar__mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="navbar__mobile-menu" onClick={(e) => e.stopPropagation()}>
            <ul className="navbar__mobile-links">
              {isLanding && navLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="navbar__mobile-link"
                    onClick={(e) => handleNavClick(e, link.href)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Login</Link>
              </li>
              <li>
                <Link to="/signup" className="navbar__mobile-link navbar__mobile-link--primary" onClick={() => setMobileOpen(false)}>Sign Up</Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
