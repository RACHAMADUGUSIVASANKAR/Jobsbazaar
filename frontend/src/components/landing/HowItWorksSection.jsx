import ScrollVelocity from '../animations/ScrollVelocity';
import './HowItWorksSection.css';

const steps = [
  {
    number: '01',
    title: 'Upload Resume',
    description: 'Upload your resume in PDF or TXT format. Our AI extracts your professional profile automatically.',
  },
  {
    number: '02',
    title: 'AI Matches Jobs',
    description: 'Our advanced AI analyzes your skills against thousands of job listings to find your best matches.',
  },
  {
    number: '03',
    title: 'Track Applications',
    description: 'Organize your job search with a smart system that monitors every application status in real-time.',
  },
  {
    number: '04',
    title: 'Improve with Insights',
    description: 'Receive AI-powered feedback and career analytics to optimize your resume and increase interview rates.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="how-it-works section" id="how-it-works">
      <div className="container">
        <h2 className="section-title">How It Works</h2>

        {/* Scroll Velocity Animation */}
        <div className="how-it-works__velocity">
          <ScrollVelocity
            texts={['Upload Resume', 'AI Analysis', 'Smart Matching', 'Track & Insights']}
            velocity={60}
            className="how-it-works__velocity-text"
          />
        </div>

        <div className="how-it-works__steps">
          {steps.map((step, index) => (
            <div className="how-it-works__step" key={index}>
              <div className="how-it-works__step-number">{step.number}</div>
              <div className="how-it-works__step-content">
                <h3 className="how-it-works__step-title">{step.title}</h3>
                <p className="how-it-works__step-desc">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="how-it-works__step-connector"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
