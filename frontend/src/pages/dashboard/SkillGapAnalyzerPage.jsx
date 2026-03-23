import { useEffect, useMemo, useState } from 'react';
import { FiTarget, FiBook, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import './SkillGapAnalyzerPage.css';

const normalize = (value = '') => value.trim().toLowerCase();

const buildResource = (skill) => {
  return {
    title: `Master ${skill}`,
    source: 'Guided Path',
    time: '6-10h'
  };
};

const SkillGapAnalyzerPage = () => {
  const [loading, setLoading] = useState(true);
  const [trendWindow, setTrendWindow] = useState(7);
  const [topSkills, setTopSkills] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [demand, setDemand] = useState([]);
  const [resources, setResources] = useState([]);
  const [gapMomentum, setGapMomentum] = useState([]);

  useEffect(() => {
    const fetchSkillAnalysis = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        const [profileRes, feedRes] = await Promise.all([
          fetch('/api/users/profile', { headers }),
          fetch('/api/jobs?page=1&pageSize=50', { headers })
        ]);

        const [profileData, feedPayload] = await Promise.all([
          profileRes.ok ? profileRes.json() : {},
          feedRes.ok ? feedRes.json() : []
        ]);

        const userSkills = Array.isArray(profileData?.skills) ? profileData.skills : [];
        const uniqueTop = Array.from(new Set(userSkills.filter(Boolean))).slice(0, 8);
        setTopSkills(uniqueTop);

        const marketCounter = {};
        const gapCounter = {};
        const now = Date.now();
        const lookbackMs = (trendWindow === 30 ? 30 : 7) * 24 * 60 * 60 * 1000;
        const jobs = Array.isArray(feedPayload)
          ? feedPayload
          : (Array.isArray(feedPayload?.items) ? feedPayload.items : []);
        jobs.forEach((job) => {
          const explanation = job.matchExplanation || {};
          const relevant = [
            ...(Array.isArray(explanation.matchingSkills) ? explanation.matchingSkills : []),
            ...(Array.isArray(explanation.matchedKeywords) ? explanation.matchedKeywords : [])
          ];

          relevant.forEach((skill) => {
            if (!skill) return;
            const key = skill.trim();
            if (!key) return;
            marketCounter[key] = (marketCounter[key] || 0) + 1;
          });

          const seenAt = new Date(job.lastSeenAt || job.updatedAt || job.createdAt || Date.now()).getTime();
          const isInWindow = Number.isFinite(seenAt) ? (now - seenAt) <= lookbackMs : true;
          if (isInWindow) {
            const missing = Array.isArray(explanation.missingSkills) ? explanation.missingSkills : [];
            missing.forEach((skill) => {
              if (!skill) return;
              const key = skill.trim();
              if (!key) return;
              gapCounter[key] = (gapCounter[key] || 0) + 1;
            });
          }
        });

        const rankedDemand = Object.entries(marketCounter)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([skill, count]) => {
            const level = count >= 8 ? 'Critical' : count >= 4 ? 'High' : 'Rising';
            return { skill, demand: level, count };
          });

        setDemand(rankedDemand.slice(0, 6));

        const topSet = new Set(uniqueTop.map(normalize));
        const gapSkills = rankedDemand
          .filter((item) => !topSet.has(normalize(item.skill)))
          .slice(0, 6)
          .map((item) => item.skill);

        setGaps(gapSkills);
        setResources(gapSkills.slice(0, 4).map(buildResource));

        const momentum = Object.entries(gapCounter)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([skill, count]) => ({ skill, count }));

        setGapMomentum(momentum);
      } catch (error) {
        console.error('Skill gap fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillAnalysis();
  }, [trendWindow]);

  const recommendation = useMemo(() => {
    if (!gaps.length) {
      return 'You are currently aligned with the most demanded visible skills. Keep applying and refreshing your resume context.';
    }

    return `Focus first on ${gaps[0]}, then build momentum with ${gaps.slice(1, 3).join(' and ')} over the next ${trendWindow} days.`;
  }, [gaps, trendWindow]);

  return (
    <div className="skill-gap-page">
      <div className="page-header">
        <h2>Skill Gap Analyzer</h2>
        <p>AI-driven career coaching to bridge the gap between your skills and market demand</p>
      </div>

      <div className="analyzer-grid">
        <div className="analyzer-card top-skills">
          <h3><FiCheckCircle color="#00ADB5" /> Your Top Skills</h3>
          <div className="skill-tags">
            {(loading ? [] : topSkills).map((s, i) => <span key={i} className="skill-tag match">{s}</span>)}
            {!loading && topSkills.length === 0 && <span className="inline-empty">Upload resume to detect top skills.</span>}
          </div>
        </div>

        <div className="analyzer-card gap-analysis">
          <h3><FiTarget color="#ff4d4d" /> Skill Gaps Identified</h3>
          <p>Based on your current feed and match explanations, these skills can increase interview conversion:</p>
          <div className="skill-tags">
            {(loading ? [] : gaps).map((s, i) => <span key={i} className="skill-tag gap">{s}</span>)}
            {!loading && gaps.length === 0 && <span className="inline-empty">No major gaps detected.</span>}
          </div>
        </div>
      </div>

      <div className="recommendation-strip">{loading ? 'Analyzing your skill graph...' : recommendation}</div>

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

      <div className="analysis-details">
        <div className="market-trends">
          <h3><FiTrendingUp color="#00ADB5" /> Market Trend Analysis</h3>
          <table className="trends-table">
            <thead>
              <tr>
                <th>Skill</th>
                <th>Demand Level</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : demand).map((d, i) => (
                <tr key={i}>
                  <td>{d.skill}</td>
                  <td><span className={`demand-pill ${d.demand.toLowerCase()}`}>{d.demand}</span></td>
                  <td>{topSkills.map(normalize).includes(normalize(d.skill)) ? 'Maintain' : 'High Priority'}</td>
                </tr>
              ))}
              {!loading && demand.length === 0 && (
                <tr>
                  <td colSpan="3" className="table-empty">Market demand data will appear after feed updates.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="recommended-learning">
          <h3><FiBook color="#393E46" /> Recommended Learning</h3>
          <div className="resources-list">
            {(loading ? [] : resources).map((r, i) => (
              <div key={i} className="resource-item">
                <div className="resource-meta">
                  <span className="resource-title">{r.title}</span>
                  <span className="resource-source">{r.source} • {r.time}</span>
                </div>
                <button className="learn-btn">Start Learning</button>
              </div>
            ))}
            {!loading && resources.length === 0 && <div className="inline-empty">No recommendations yet.</div>}
          </div>

          <div className="gap-momentum">
            <h4>Top Gap Momentum ({trendWindow} days)</h4>
            {(loading ? [] : gapMomentum).map((item) => (
              <div key={item.skill} className="gap-momentum-item">
                <span>{item.skill}</span>
                <strong>{item.count} mentions</strong>
              </div>
            ))}
            {!loading && gapMomentum.length === 0 && <div className="inline-empty">No rising gaps detected yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillGapAnalyzerPage;
