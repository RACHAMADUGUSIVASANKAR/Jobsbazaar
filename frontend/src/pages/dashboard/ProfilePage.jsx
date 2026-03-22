import { useState, useEffect } from 'react';
import { FiMail, FiCalendar, FiBriefcase, FiZap, FiRefreshCw } from 'react-icons/fi';
import './ProfilePage.css';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const fallback = {
          id: localUser.id,
          name: localUser.name || 'Professional User',
          email: localUser.email || 'user@example.com',
          skills: [],
          experience: null
        };
        setProfile(fallback);
        setForm({ name: fallback.name, email: fallback.email });
        return;
      }

      const data = await response.json();
      setProfile(data);
      setForm({
        name: data.name || 'Professional User',
        email: data.email || JSON.parse(localStorage.getItem('user') || '{}')?.email || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: form.name, email: form.email })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      const updated = await response.json();
      setProfile(updated);

      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...localUser, name: form.name, email: form.email }));
      setEditMode(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceResume = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/users/resume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload resume');
      await fetchProfile();
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Professional" alt="User" />
        </div>
        <div className="profile-basic-info">
          {editMode ? (
            <input
              className="profile-input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
            />
          ) : (
            <h2>{profile?.name || form.name || 'Professional User'}</h2>
          )}
          <p>
            <FiMail />
            {editMode ? (
              <input
                className="profile-input"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
              />
            ) : (
              profile?.email || form.email || 'user@example.com'
            )}
          </p>
          <p><FiCalendar /> Member since March 2026</p>
        </div>
        {editMode ? (
          <button className="edit-btn" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        ) : (
          <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
        )}
      </div>

      <div className="profile-grid">
        <div className="profile-card">
          <h3><FiZap color="#00ADB5" /> Detected Skills</h3>
          <div className="skill-tags">
            {profile?.skills?.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
          </div>
        </div>

        <div className="profile-card">
          <h3><FiBriefcase color="#393E46" /> Extracted Experience</h3>
          <p className="experience-summary">{profile?.experience || 'No explicit years-of-experience statement detected in your resume.'}</p>
        </div>

        <div className="profile-card resume-management">
          <h3>Resume Management</h3>
          <div className="resume-status">
            <p><strong>Current Resume:</strong> {profile?.resumeUploadedAt ? `Uploaded on ${new Date(profile.resumeUploadedAt).toLocaleDateString()}` : 'No resume uploaded'}</p>
            <label className="replace-btn">
              <FiRefreshCw /> {uploading ? 'Uploading...' : 'Replace Resume'}
              <input type="file" accept=".pdf,.txt" onChange={handleReplaceResume} hidden disabled={uploading} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
