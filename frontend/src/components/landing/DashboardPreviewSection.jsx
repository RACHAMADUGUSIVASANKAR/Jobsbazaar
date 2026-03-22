import BlurText from '../animations/BlurText';
import './DashboardPreviewSection.css';

const DashboardPreviewSection = () => {
  return (
    <section className="dashboard-preview section" id="dashboard-preview">
      <div className="container">
        <BlurText
          text="Production-level AI Dashboard built with React + Fastify"
          delay={80}
          animateBy="words"
          direction="top"
          className="section-title dashboard-preview__title"
        />

        {/* Dashboard Preview Image */}
        <div className="dashboard-preview__image-wrapper">
          <div className="dashboard-preview__mockup">
            <div className="dashboard-preview__browser-bar">
              <div className="dashboard-preview__browser-dots">
                <span></span><span></span><span></span>
              </div>
              <div className="dashboard-preview__browser-url">localhost:5173/dashboard</div>
            </div>
            <div className="dashboard-preview__screen">
              {/* Simulated Dashboard UI */}
              <div className="dashboard-preview__sidebar">
                <div className="dashboard-preview__sidebar-item active"></div>
                <div className="dashboard-preview__sidebar-item"></div>
                <div className="dashboard-preview__sidebar-item"></div>
                <div className="dashboard-preview__sidebar-item"></div>
                <div className="dashboard-preview__sidebar-item"></div>
              </div>
              <div className="dashboard-preview__content">
                <div className="dashboard-preview__header-bar"></div>
                <div className="dashboard-preview__cards-row">
                  <div className="dashboard-preview__stat-card"></div>
                  <div className="dashboard-preview__stat-card"></div>
                  <div className="dashboard-preview__stat-card"></div>
                </div>
                <div className="dashboard-preview__chart-area"></div>
                <div className="dashboard-preview__list-area">
                  <div className="dashboard-preview__list-item"></div>
                  <div className="dashboard-preview__list-item"></div>
                  <div className="dashboard-preview__list-item"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bullet Highlights */}
        <div className="dashboard-preview__highlights">
          <div className="dashboard-preview__highlight">
            <div className="dashboard-preview__highlight-dot"></div>
            <span>Real-time job updates</span>
          </div>
          <div className="dashboard-preview__highlight">
            <div className="dashboard-preview__highlight-dot"></div>
            <span>AI match explanation</span>
          </div>
          <div className="dashboard-preview__highlight">
            <div className="dashboard-preview__highlight-dot"></div>
            <span>Personal career analytics</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;
