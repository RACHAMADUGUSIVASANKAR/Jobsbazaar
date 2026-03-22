import BorderGlow from '../animations/BorderGlow';
import BlurText from '../animations/BlurText';
import './FeaturesSection.css';

const features = [
  {
    title: 'Real-time Job Feed',
    description: 'Live job listings from Adzuna API, extensible to other sources. Updated every 30 minutes.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <path d="M12 28V20M17 28V16M22 28V22M27 28V14" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'AI Smart Job Matching',
    description: 'LangChain-powered matching algorithm analyzes your resume against job descriptions for perfect fits.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <circle cx="20" cy="20" r="8" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M20 14V20L24 24" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Match Score with Explanation',
    description: 'Get a 0-100% compatibility score with detailed explanation of why you match or do not match.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <path d="M14 26L18 20L22 24L28 14" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Resume AI Suggestions',
    description: 'AI analyzes your resume and provides actionable suggestions to improve it for each specific job.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <rect x="13" y="10" width="14" height="20" rx="2" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M17 16H23M17 20H21" stroke="#00ADB5" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Smart Application Tracking',
    description: 'Track every application status from Applied to Interview to Offer with timeline views.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <path d="M14 14H26M14 20H22M14 26H18" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="27" cy="26" r="3" stroke="#00ADB5" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    title: 'Career Analytics Dashboard',
    description: 'Visualize your job search with charts showing applications, interviews, and success rates.',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill="rgba(0,173,181,0.1)"/>
        <rect x="12" y="22" width="4" height="8" rx="1" fill="#00ADB5"/>
        <rect x="18" y="16" width="4" height="14" rx="1" fill="#00ADB5"/>
        <rect x="24" y="12" width="4" height="18" rx="1" fill="#00ADB5"/>
      </svg>
    ),
  },
];

const FeaturesSection = () => {
  return (
    <section className="features section" id="features">
      <div className="container">
        <BlurText
          text="Everything you need to track and win your dream job"
          delay={80}
          animateBy="words"
          direction="top"
          className="section-title features__title"
        />
        <div className="features__grid">
          {features.map((feature, index) => (
            <BorderGlow
              key={index}
              edgeSensitivity={25}
              glowColor="180 70 45"
              backgroundColor="#ffffff"
              borderRadius={16}
              glowRadius={30}
              glowIntensity={0.8}
              coneSpread={20}
              colors={['#00ADB5', '#00CED6', '#38bdf8']}
              className="features__card-glow"
            >
              <div className="features__card">
                <div className="features__card-icon">{feature.icon}</div>
                <h3 className="features__card-title">{feature.title}</h3>
                <p className="features__card-desc">{feature.description}</p>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
