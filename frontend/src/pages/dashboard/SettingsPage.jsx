import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMoon, FiTrash2, FiBell } from 'react-icons/fi';
import './SettingsPage.css';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(localStorage.getItem('dashboardDarkMode') === 'true');
  const [deletePhrase, setDeletePhrase] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-theme', darkMode);
    localStorage.setItem('dashboardDarkMode', String(darkMode));
  }, [darkMode]);

  const handleToggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETINGACCOUNT') return;

    try {
      setIsDeleting(true);
      const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/signup');
    } catch (error) {
      alert(error.message || 'Unable to delete account right now.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account preferences and global settings</p>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-control">
            <div className="setting-info">
              <span className="setting-title"><FiMoon /> Dark Theme</span>
              <span className="setting-desc">Toggle between light and dark visual modes</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={darkMode} onChange={handleToggleTheme} />
              <span className="slider round"></span>
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h3>Notifications</h3>
          <div className="setting-control">
            <div className="setting-info">
              <span className="setting-title"><FiBell /> Job Matching Alerts</span>
              <span className="setting-desc">Receive emails when high-match jobs are found</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
              <span className="slider round"></span>
            </label>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <h3 className="danger-text"><FiTrash2 /> Danger Zone</h3>
          <div className="danger-box">
            <h4>Delete Account</h4>
            <p>Once you delete your account, all your data including resume and tracking history will be permanently removed.</p>
            <div className="delete-confirm">
              <p>Type <strong>DELETINGACCOUNT</strong> to confirm:</p>
              <input
                type="text"
                placeholder="Type the phrase here..."
                value={deletePhrase}
                onChange={(e) => setDeletePhrase(e.target.value)}
              />
              <button
                className="delete-btn"
                disabled={deletePhrase !== 'DELETINGACCOUNT' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
