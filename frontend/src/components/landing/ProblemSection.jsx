import BlurText from '../animations/BlurText';
import './ProblemSection.css';

const problems = [
  {
    title: 'Applying to hundreds of jobs manually',
    description: 'Spending countless hours copy-pasting your resume and filling out repetitive application forms with no clear strategy.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <path d="M16 24H32M16 18H28M16 30H24" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Not knowing why you are rejected',
    description: 'Getting ghosted by companies without any feedback on what went wrong or how to improve your chances.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <circle cx="24" cy="20" r="6" stroke="#00ADB5" strokeWidth="2"/>
        <path d="M24 30V34M20 38H28" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'No smart career insights',
    description: 'Making career decisions blindly without data-driven analytics about market trends, skill demands, or your competitive position.',
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="rgba(0,173,181,0.1)"/>
        <path d="M14 34L20 26L26 30L34 18" stroke="#00ADB5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="34" cy="18" r="2" fill="#00ADB5"/>
      </svg>
    ),
  },
];

const ProblemSection = () => {
  return (
    <section className="problem section" id="problem">
      <div className="container">
        <BlurText
          text="Finding the right job is harder than it should be"
          delay={100}
          animateBy="words"
          direction="top"
          className="section-title problem__title"
        />
        <div className="problem__grid">
          {problems.map((problem, index) => (
            <div className="problem__card" key={index}>
              <div className="problem__icon">{problem.icon}</div>
              <h3 className="problem__card-title">{problem.title}</h3>
              <p className="problem__card-desc">{problem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
