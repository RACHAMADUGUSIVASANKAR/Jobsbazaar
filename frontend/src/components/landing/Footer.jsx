import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Project Info */}
          <div className="footer__col">
            <div className="footer__logo">
              <img src="/images/logo.jpg" alt="Jobsbazaar" width="28" height="28" />
              <span className="footer__logo-text">Jobsbazaar</span>
            </div>
            <p className="footer__desc">
              Jobsbazaar — AI-Powered Job Tracker with Smart Matching.
              Track, match, and land your dream job with AI.
            </p>
          </div>

          {/* Tech Stack */}
          <div className="footer__col">
            <h4 className="footer__heading">Tech Stack</h4>
            <ul className="footer__list">
              <li>Frontend: React</li>
              <li>Backend: Node.js + Fastify</li>
              <li>AI Matching: LangChain</li>
              <li>AI Assistant: LangGraph</li>
              <li>LLM: OpenAI / Gemini / Anthropic</li>
              <li>Storage: JSON / In-memory</li>
            </ul>
          </div>

          {/* Links */}
          <div className="footer__col">
            <h4 className="footer__heading">Links</h4>
            <ul className="footer__list">
              <li>
                <a href="https://github.com/sivasankar-rachamadugu/" target="_blank" rel="noreferrer" className="footer__link">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="mailto:sivasankar99122@gmail.com" className="footer__link">
                  sivasankar99122@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__heading">Contact</h4>
            <p className="footer__contact-text">
              Phone: +91 9912276561
            </p>
            <p className="footer__contact-text">
              LinkedIn: <a href="https://www.linkedin.com/in/sivasankar-rachamadugu/" target="_blank" rel="noreferrer" className="footer__link">sivasankar-rachamadugu</a>
            </p>
            <p className="footer__contact-text">
              Email: <a href="mailto:sivasankar99122@gmail.com" className="footer__link">sivasankar99122@gmail.com</a>
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>Copyright 2024 Jobsbazaar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
