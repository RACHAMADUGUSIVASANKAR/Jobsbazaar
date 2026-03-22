import BorderGlow from '../animations/BorderGlow';
import BlurText from '../animations/BlurText';
import './WhyUniqueSection.css';

const highlights = [
  {
    title: 'Uses real jobs only (no fake data)',
    description: 'Every job listing comes from the Adzuna API — real companies, real positions, real opportunities.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <path d="M16 24L22 30L32 18" stroke="#00ADB5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Auto-updates every 30 minutes',
    description: 'Job feed refreshes automatically so you never miss a new opportunity that matches your profile.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <circle cx="24" cy="24" r="10" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M24 18V24L28 28" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'AI explains why you match or don\'t match',
    description: 'Transparent AI matching with detailed explanations so you understand every score and recommendation.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <path d="M18 16H30L34 20V34H14V20L18 16Z" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M20 24H28M20 28H26" stroke="#00ADB5" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Helps improve your resume automatically',
    description: 'AI-powered suggestions to optimize your resume for ATS systems and specific job requirements.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <path d="M20 14L28 14L32 18V34H16V14H20Z" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M24 22V30M20 26H28" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const WhyUniqueSection = () => {
  return (
    <section className="why-unique section" id="why-unique">
      <div className="container">
        <BlurText
          text="Why This Project is Unique"
          delay={100}
          animateBy="words"
          direction="top"
          className="section-title why-unique__title"
        />
        <div className="why-unique__grid">
          {highlights.map((item, index) => (
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
              className="why-unique__card-glow"
            >
              <div className="why-unique__card">
                <div className="why-unique__card-icon">{item.icon}</div>
                <h3 className="why-unique__card-title">{item.title}</h3>
                <p className="why-unique__card-desc">{item.description}</p>
              </div>
            </BorderGlow>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUniqueSection;
