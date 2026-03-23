import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './CareerAnalyticsPage.css';

const COLORS = ['#00ADB5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const toDateKey = (value) => {
  const date = new Date(value || Date.now());
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const formatWeekday = (date) => date.toLocaleDateString(undefined, { weekday: 'short' });

const formatMonthDay = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const getRoleBucket = (title = '') => {
  const value = String(title || '').toLowerCase();
  if (value.includes('frontend')) return 'Frontend';
  if (value.includes('backend')) return 'Backend';
  if (value.includes('full stack') || value.includes('fullstack')) return 'Full Stack';
  if (value.includes('data')) return 'Data';
  if (value.includes('devops')) return 'DevOps';
  if (value.includes('mobile')) return 'Mobile';
  return 'Other';
};

const CareerAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplied: 0,
    interviewRate: 0,
    avgMatchScore: 0,
    activeApps: 0
  });
  const [trendWindow, setTrendWindow] = useState(7);
  const [appTrendData, setAppTrendData] = useState([]);
  const [skillDemandData, setSkillDemandData] = useState([]);
  const [scoreBandData, setScoreBandData] = useState([]);
  const [roleConcentrationData, setRoleConcentrationData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        const [applicationsRes, feedRes, savedRes] = await Promise.all([
          fetch('/api/jobs/applications', { headers }),
          fetch('/api/jobs?page=1&pageSize=50', { headers }),
          fetch('/api/jobs/saved', { headers })
        ]);

        const [applications, feedPayload, savedJobs] = await Promise.all([
          applicationsRes.json(),
          feedRes.json(),
          savedRes.json()
        ]);

        const safeApplications = Array.isArray(applications) ? applications : [];
        const safeFeed = Array.isArray(feedPayload)
          ? feedPayload
          : (Array.isArray(feedPayload?.items) ? feedPayload.items : []);
        const safeSaved = Array.isArray(savedJobs) ? savedJobs : [];

        const interviewCount = safeApplications.filter((app) => {
          const status = `${app.status || ''}`.toLowerCase();
          return status.includes('interview');
        }).length;

        const activeApps = safeApplications.filter((app) => {
          const status = `${app.status || ''}`.toLowerCase();
          return !status.includes('rejected') && !status.includes('offer accepted') && !status.includes('withdrawn');
        }).length;

        const avgMatchScore = safeFeed.length
          ? Math.round(safeFeed.reduce((sum, job) => sum + Number(job.matchScore || 0), 0) / safeFeed.length)
          : 0;

        setStats({
          totalApplied: safeApplications.length,
          interviewRate: safeApplications.length
            ? Math.round((interviewCount / safeApplications.length) * 100)
            : 0,
          avgMatchScore,
          activeApps
        });

        const today = new Date();
        const windowDays = trendWindow === 30 ? 30 : 7;
        const trendDays = Array.from({ length: windowDays }).map((_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() - (windowDays - 1 - i));
          return d;
        });

        const appCountByDay = safeApplications.reduce((map, app) => {
          const key = toDateKey(app.timestamp || app.updatedAt || app.createdAt);
          map[key] = (map[key] || 0) + 1;
          return map;
        }, {});

        const savedCountByDay = safeSaved.reduce((map, job) => {
          const key = toDateKey(job.timestamp || job.updatedAt || job.createdAt);
          map[key] = (map[key] || 0) + 1;
          return map;
        }, {});

        setAppTrendData(
          trendDays.map((day) => {
            const key = toDateKey(day);
            return {
              name: trendWindow === 30 ? formatMonthDay(day) : formatWeekday(day),
              applications: appCountByDay[key] || 0,
              saved: savedCountByDay[key] || 0
            };
          })
        );

        const skillCount = {};
        safeFeed.forEach((job) => {
          const explanation = job.matchExplanation || {};
          const fromSkills = Array.isArray(explanation.matchingSkills) ? explanation.matchingSkills : [];
          const fromKeywords = Array.isArray(explanation.matchedKeywords) ? explanation.matchedKeywords : [];
          [...fromSkills, ...fromKeywords].forEach((skill) => {
            if (!skill) return;
            const normalized = skill.trim();
            if (!normalized) return;
            skillCount[normalized] = (skillCount[normalized] || 0) + 1;
          });
        });

        const topSkills = Object.entries(skillCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }));

        setSkillDemandData(topSkills.length ? topSkills : [{ name: 'No Data Yet', value: 1 }]);

        const high = safeFeed.filter((job) => Number(job.matchScore || 0) >= 70).length;
        const medium = safeFeed.filter((job) => {
          const score = Number(job.matchScore || 0);
          return score >= 40 && score < 70;
        }).length;
        const low = safeFeed.filter((job) => Number(job.matchScore || 0) < 40).length;

        setScoreBandData([
          { name: 'High (>=70)', jobs: high },
          { name: 'Medium (40-69)', jobs: medium },
          { name: 'Low (<40)', jobs: low }
        ]);

        const roleCounts = safeFeed.reduce((map, job) => {
          const role = getRoleBucket(job.title);
          map[role] = (map[role] || 0) + 1;
          return map;
        }, {});

        const topRoleConcentration = Object.entries(roleCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, jobs]) => ({ name, jobs }));

        setRoleConcentrationData(topRoleConcentration);
      } catch (error) {
        console.error('Career analytics fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [trendWindow]);

  const insights = useMemo(() => {
    if (stats.totalApplied === 0) {
      return ['Start applying to jobs to unlock weekly trend and interview insights.'];
    }

    const notes = [];
    if (stats.interviewRate >= 30) {
      notes.push('Your interview conversion is strong. Keep prioritizing high-match jobs.');
    } else {
      notes.push('Interview conversion is low. Focus on jobs with stronger match explanations.');
    }

    if (stats.avgMatchScore >= 70) {
      notes.push('Your profile aligns well with current opportunities.');
    } else {
      notes.push('Average match score is moderate. Resume tailoring can improve conversion.');
    }

    if (roleConcentrationData.length > 0) {
      notes.push(`Most opportunities in your feed are concentrated in ${roleConcentrationData[0].name} roles.`);
    }

    return notes;
  }, [stats, roleConcentrationData]);

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2>Career Analytics</h2>
        <p>Insights into your job search performance and market demand</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Applied</span>
          <span className="stat-value">{loading ? '...' : stats.totalApplied}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Interview Rate</span>
          <span className="stat-value">{loading ? '...' : `${stats.interviewRate}%`}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Avg. Match Score</span>
          <span className="stat-value">{loading ? '...' : `${stats.avgMatchScore}%`}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Apps</span>
          <span className="stat-value">{loading ? '...' : stats.activeApps}</span>
        </div>
      </div>

      <div className="analytics-insights">
        {insights.map((note) => (
          <div key={note} className="insight-chip">{note}</div>
        ))}
      </div>

      <div className="trend-window-controls">
        <button
          className={`trend-window-btn ${trendWindow === 7 ? 'active' : ''}`}
          onClick={() => setTrendWindow(7)}
        >
          7 Days
        </button>
        <button
          className={`trend-window-btn ${trendWindow === 30 ? 'active' : ''}`}
          onClick={() => setTrendWindow(30)}
        >
          30 Days
        </button>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Application & Saved Trends (Last {trendWindow} Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={appTrendData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={trendWindow === 30 ? 4 : 0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#00ADB5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saved" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3>Skill Demand in Matches</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={skillDemandData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {skillDemandData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-container score-band-chart">
        <h3>Job Distribution by Match Score</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={scoreBandData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="jobs" fill="#10B981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container score-band-chart">
        <h3>Role Concentration In Current Feed</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={roleConcentrationData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="jobs" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CareerAnalyticsPage;
