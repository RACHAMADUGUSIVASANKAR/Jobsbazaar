import Navbar from '../components/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import WhyUniqueSection from '../components/landing/WhyUniqueSection';
import UserFeedbackSection from '../components/landing/UserFeedbackSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyUniqueSection />
      <UserFeedbackSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default LandingPage;
