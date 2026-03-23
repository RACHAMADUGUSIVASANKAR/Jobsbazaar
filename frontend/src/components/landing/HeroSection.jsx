import RotatingText from '../animations/RotatingText';
import LogoLoop from '../animations/LogoLoop';
import GlareHover from '../animations/GlareHover';
import {
  FaGoogle,
  FaMicrosoft,
  FaAmazon,
  FaApple,
  FaMeta,
  FaUber,
  FaAirbnb,
  FaSpotify,
  FaSalesforce,
  FaLinkedin,
  FaSlack,
  FaStripe,
  FaGithub
} from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import './HeroSection.css';

const iconNode = (Icon, color) => (
  <span className="hero__company-badge" style={{ color }}>
    <Icon />
  </span>
);

const textNode = (text, color) => (
  <span className="hero__company-badge hero__company-badge--text" style={{ color }}>
    {text}
  </span>
);

const companyLogos = [
  { node: iconNode(FaGoogle, '#4285F4'), title: 'Google' },
  { node: iconNode(FaMicrosoft, '#737373'), title: 'Microsoft' },
  { node: iconNode(FaAmazon, '#FF9900'), title: 'Amazon' },
  { node: iconNode(FaApple, '#1A1A1A'), title: 'Apple' },
  { node: iconNode(FaMeta, '#1A77F2'), title: 'Meta' },
  { node: textNode('NFLX', '#E50914'), title: 'Netflix' },
  { node: iconNode(FaUber, '#111111'), title: 'Uber' },
  { node: iconNode(FaAirbnb, '#FF385C'), title: 'Airbnb' },
  { node: iconNode(FaSpotify, '#1DB954'), title: 'Spotify' },
  { node: iconNode(FaSalesforce, '#00A1E0'), title: 'Salesforce' },
  { node: iconNode(FaLinkedin, '#0A66C2'), title: 'LinkedIn' },
  { node: iconNode(FaSlack, '#4A154B'), title: 'Slack' },
  { node: iconNode(FaStripe, '#635BFF'), title: 'Stripe' },
  { node: iconNode(FaGithub, '#222222'), title: 'GitHub' },
  { node: textNode('TCS', '#EF4A23'), title: 'TCS' },
  { node: textNode('INFY', '#007CC3'), title: 'Infosys' },
  { node: textNode('WIPRO', '#6A2C91'), title: 'Wipro' },
  { node: textNode('CTS', '#0054A6'), title: 'Cognizant' },
  { node: textNode('CG', '#00A3E0'), title: 'Capgemini' },
  { node: textNode('DTT', '#86BC25'), title: 'Deloitte' },
  { node: textNode('IBM', '#1261FE'), title: 'IBM' },
  { node: textNode('ORCL', '#F80000'), title: 'Oracle' },
];

const HeroSection = () => {
  return (
    <section className="hero" id="hero">
      <div className="hero__container container">
        <div className="hero__logo-loop">
          <LogoLoop
            logos={companyLogos}
            speed={80}
            direction="left"
            logoHeight={48}
            gap={60}
            hoverSpeed={0}
            scaleOnHover
            fadeOut
            fadeOutColor="#EEEEEE"
            ariaLabel="Top hiring companies"
          />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">
            <span className="hero__title-static">Jobsbazaar that </span>
            <span className="hero__title-rotating">
              <RotatingText
                texts={['Smart Matching', 'AI Resume Analysis', 'Real-Time Job Feed', 'Career Insights']}
                mainClassName="hero__rotating-main"
                staggerFrom="last"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '-120%' }}
                staggerDuration={0.025}
                splitLevelClassName="hero__rotating-split"
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </span>
          </h1>

          <p className="hero__subtitle">
            Stop wasting time on manual job applications. Let AI find, match, and track
            the best opportunities for your career automatically.
          </p>

          <div className="hero__buttons">
            <GlareHover
              width="auto"
              height="auto"
              background="#00ADB5"
              borderRadius="12px"
              borderColor="#00ADB5"
              glareColor="#ffffff"
              glareOpacity={0.3}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="hero__btn-glare"
            >
              <Link to="/signup" className="hero__btn hero__btn--primary">Get Started</Link>
            </GlareHover>

            <GlareHover
              width="auto"
              height="auto"
              background="transparent"
              borderRadius="12px"
              borderColor="#393E46"
              glareColor="#00ADB5"
              glareOpacity={0.2}
              glareAngle={-30}
              glareSize={300}
              transitionDuration={800}
              className="hero__btn-glare"
            >
              <Link to="/dashboard" className="hero__btn hero__btn--secondary">Try Demo Dashboard</Link>
            </GlareHover>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
