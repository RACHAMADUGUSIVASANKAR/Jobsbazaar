import './UserFeedbackSection.css';

const testimonials = [
  {
    name: 'Rahul Sharma',
    role: 'Software Engineer',
    text: "Jobsbazaar's AI matching is incredibly accurate. It saved me weeks of manual searching and found a role I'm truly passionate about.",
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul'
  },
  {
    name: 'Anjali Gupta',
    role: 'Product Manager',
    text: 'The resume analysis feature gave me actionable insights that helped me land interviews at top tech companies. Highly recommended!',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali'
  },
  {
    name: 'David Miller',
    role: 'Data Scientist',
    text: 'Tracking my applications has never been easier. The dashboard provides a clear overview of my job search progress and success rates.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
  },
  {
    name: 'Priya Nair',
    role: 'Frontend Developer',
    text: 'The job recommendations were surprisingly relevant. I stopped applying blindly and started getting real callbacks.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'
  },
  {
    name: 'Karan Mehta',
    role: 'Backend Engineer',
    text: 'Application tracking and reminders kept me consistent. I did not miss a single follow-up this month.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan'
  },
  {
    name: 'Sneha Reddy',
    role: 'UI/UX Designer',
    text: 'I love the clean dashboard and insights section. It helped me understand which roles fit my portfolio best.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha'
  },
  {
    name: 'Arjun Verma',
    role: 'DevOps Engineer',
    text: 'Jobsbazaar reduced my search effort by half. The AI matching made my shortlist process much faster.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun'
  },
  {
    name: 'Nisha Patel',
    role: 'QA Analyst',
    text: 'The profile and skill-gap guidance gave me clear next steps. I focused my prep and got interview calls quickly.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nisha'
  },
  {
    name: 'Vikram Joshi',
    role: 'Android Developer',
    text: 'The platform feels practical and lightweight. It keeps all my applications organized in one place.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
  },
  {
    name: 'Meera Singh',
    role: 'Business Analyst',
    text: 'From role discovery to tracking, everything is connected. It made my career switch a lot smoother.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera'
  },
  {
    name: 'Rohit Kulkarni',
    role: 'Cloud Engineer',
    text: 'I got better matches than other job sites because Jobsbazaar actually understands my resume context.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit'
  },
  {
    name: 'Aisha Khan',
    role: 'Data Analyst',
    text: 'The explanation behind match scores is the best part. It tells me what to improve before applying.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha'
  },
  {
    name: 'Sandeep Rao',
    role: 'Full Stack Developer',
    text: 'The UI is fast and easy to use. I can manage all my targets and progress without opening multiple tools.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sandeep'
  },
  {
    name: 'Kavya Iyer',
    role: 'HR Specialist',
    text: 'As a recruiter, I tested this with candidates and the AI guidance helped them apply to better-fit roles.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya'
  },
  {
    name: 'Harish Babu',
    role: 'Machine Learning Engineer',
    text: 'The platform helped me prioritize quality over quantity. My conversion rate improved noticeably.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harish'
  }
];

const UserFeedbackSection = () => {
  const rowOne = [...testimonials, ...testimonials];
  const rowTwo = [...testimonials.slice(6), ...testimonials.slice(0, 6), ...testimonials.slice(6), ...testimonials.slice(0, 6)];

  return (
    <section className="user-feedback" id="feedback">
      <div className="container">
        <h2 className="user-feedback__title">User Feedback</h2>
        <div className="user-feedback__loop-wrap">
          <div className="user-feedback__loop-track">
            {rowOne.map((t, i) => (
              <article className="user-feedback__card" key={`row1-${t.name}-${i}`}>
                <div className="user-feedback__card-header">
                  <img src={t.avatar} alt={t.name} className="user-feedback__avatar" />
                  <div className="user-feedback__info">
                    <h4 className="user-feedback__name">{t.name}</h4>
                    <p className="user-feedback__role">{t.role}</p>
                  </div>
                </div>
                <p className="user-feedback__text">&quot;{t.text}&quot;</p>
              </article>
            ))}
          </div>
          <div className="user-feedback__loop-track user-feedback__loop-track--reverse">
            {rowTwo.map((t, i) => (
              <article className="user-feedback__card" key={`row2-${t.name}-${i}`}>
                <div className="user-feedback__card-header">
                  <img src={t.avatar} alt={t.name} className="user-feedback__avatar" />
                  <div className="user-feedback__info">
                    <h4 className="user-feedback__name">{t.name}</h4>
                    <p className="user-feedback__role">{t.role}</p>
                  </div>
                </div>
                <p className="user-feedback__text">&quot;{t.text}&quot;</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserFeedbackSection;
