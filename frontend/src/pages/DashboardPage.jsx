import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './DashboardPage.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-page__wrapper">
        <div className="dashboard-page__content">
          <h1 className="dashboard-page__title">Dashboard</h1>
          <p className="dashboard-page__desc">
            Welcome to the AI Job Tracker Dashboard. This is a placeholder for the full dashboard
            which will include Job Feed, AI Matching, Career Analytics, and more.
          </p>
          <Link to="/" className="dashboard-page__btn">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
