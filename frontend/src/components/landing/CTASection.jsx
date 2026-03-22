import { Link } from 'react-router-dom';
import GlareHover from '../animations/GlareHover';
import RotatingText from '../animations/RotatingText';
import './CTASection.css';

const CTASection = () => {
  return (
    <section className="cta section" id="cta">
      <div className="container">
        <h2 className="cta__title">
          <span>Start tracking jobs smarter with </span>
          <span className="cta__rotating-wrapper">
            <RotatingText
              texts={['AI', 'Smart Matching', 'Automation', 'Intelligence']}
              mainClassName="cta__rotating-main"
              staggerFrom="last"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-120%' }}
              staggerDuration={0.03}
              splitLevelClassName="cta__rotating-split"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </span>
        </h2>

        <div className="cta__buttons">
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
            className="cta__btn-glare"
          >
            <Link to="/signup" className="cta__btn cta__btn--primary">Create Free Account</Link>
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
            className="cta__btn-glare"
          >
            <Link to="/dashboard" className="cta__btn cta__btn--secondary">View Dashboard</Link>
          </GlareHover>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
