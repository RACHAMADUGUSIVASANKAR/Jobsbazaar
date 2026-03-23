import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiUpload, FiSave } from 'react-icons/fi';
import './ProfilePage.css';

const EXPERIENCE_LEVELS = ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'];
const JOB_TYPES = ['Full-time', 'Internship', 'Contract'];
const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const splitCsv = (value = '') => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toCsv = (value = []) => (Array.isArray(value) ? value.join(', ') : '');

const ProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        gender: '',
        primarySkillsInput: '',
        secondarySkillsInput: '',
        preferredRole: '',
        experienceLevel: '',
        preferredJobType: 'Full-time',
        preferredWorkMode: 'Remote',
        preferredLocation: '',
        expectedSalaryMin: '',
        expectedSalaryMax: '',
        expectedSalaryCurrency: 'INR',
        linkedin: '',
        github: '',
        portfolio: '',
        phone: '',
        educationLevel: '',
        degree: '',
        university: '',
        graduationYear: '',
        certificationsInput: '',
        languagesKnownInput: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const hydrateForm = (data = {}) => {
        setForm({
            name: data.name || '',
            email: data.email || '',
            gender: data.gender || '',
            primarySkillsInput: toCsv(data.primarySkills || data.skills || []),
            secondarySkillsInput: toCsv(data.secondarySkills || []),
            preferredRole: data.preferredRole || '',
            experienceLevel: data.experienceLevel || '',
            preferredJobType: data.preferredJobType || 'Full-time',
            preferredWorkMode: data.preferredWorkMode || 'Remote',
            preferredLocation: data.preferredLocation || '',
            expectedSalaryMin: data.expectedSalaryMin ?? '',
            expectedSalaryMax: data.expectedSalaryMax ?? '',
            expectedSalaryCurrency: data.expectedSalaryCurrency || 'INR',
            linkedin: data.linkedin || '',
            github: data.github || '',
            portfolio: data.portfolio || '',
            phone: data.phone || '',
            educationLevel: data.educationLevel || '',
            degree: data.degree || '',
            university: data.university || '',
            graduationYear: data.graduationYear || '',
            certificationsInput: toCsv(data.certifications || []),
            languagesKnownInput: toCsv(data.languagesKnown || [])
        });
    };

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/users/profile', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();
            setProfile(data);
            hydrateForm(data);
        } catch (err) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async () => {
        setError('');
        setMessage('');

        const primarySkills = splitCsv(form.primarySkillsInput);
        if (!form.name.trim() || !form.gender.trim() || primarySkills.length === 0) {
            setError('Full Name, Gender, and Primary Skills are required for AI matching unlock.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                name: form.name.trim(),
                email: form.email.trim(),
                gender: form.gender.trim(),
                primarySkills,
                secondarySkills: splitCsv(form.secondarySkillsInput),
                preferredRole: form.preferredRole.trim(),
                experienceLevel: form.experienceLevel,
                preferredJobType: form.preferredJobType,
                preferredWorkMode: form.preferredWorkMode,
                preferredLocation: form.preferredLocation.trim(),
                expectedSalaryMin: form.expectedSalaryMin === '' ? null : Number(form.expectedSalaryMin),
                expectedSalaryMax: form.expectedSalaryMax === '' ? null : Number(form.expectedSalaryMax),
                expectedSalaryCurrency: form.expectedSalaryCurrency,
                linkedin: form.linkedin.trim(),
                github: form.github.trim(),
                portfolio: form.portfolio.trim(),
                phone: form.phone.trim(),
                educationLevel: form.educationLevel.trim(),
                degree: form.degree.trim(),
                university: form.university.trim(),
                graduationYear: form.graduationYear.trim(),
                certifications: splitCsv(form.certificationsInput),
                languagesKnown: splitCsv(form.languagesKnownInput)
            };

            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to save profile');
            }

            const updated = await response.json();
            setProfile(updated);
            hydrateForm(updated);

            window.dispatchEvent(new CustomEvent('profileUpdated', {
                detail: {
                    onboardingCompleted: Boolean(updated.onboardingCompleted || updated.onboardingComplete)
                }
            }));

            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...localUser,
                name: updated.name,
                email: updated.email,
                onboardingCompleted: Boolean(updated.onboardingCompleted || updated.onboardingComplete)
            }));

            setMessage('Profile saved. AI matching data updated and dashboard unlocked.');
            navigate('/dashboard/job-feed', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleReplaceResume = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            setError('');
            setMessage('');

            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch('/api/users/resume', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: formData
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to upload resume');
            }

            await fetchProfile();
            window.dispatchEvent(new Event('profileUpdated'));
            setMessage('Resume uploaded and parsed. Resume insights refreshed and matching now prioritizes resume data.');
        } catch (err) {
            setError(err.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    if (loading) return <div className="loading">Loading profile...</div>;

    const insights = {
        skills: profile?.resumeSkills || [],
        projects: profile?.resumeProjects || [],
        education: profile?.resumeEducation || profile?.education || '',
        experience: profile?.experience || '',
        certifications: profile?.resumeCertifications || [],
        tools: profile?.resumeTools || [],
        technologies: profile?.resumeTechnologies || []
    };

    return (
        <div className="profile-page">
            {error && <div className="profile-feedback profile-feedback--error">{error}</div>}
            {message && <div className="profile-feedback profile-feedback--success">{message}</div>}

            <section className="profile-card profile-overview-card">
                <h2>Overview</h2>
                <p><strong>Name:</strong> {profile?.name || form.name || 'Not set'}</p>
                <p><strong>Email:</strong> <span className="profile-email"><FiMail /> {profile?.email || form.email || 'Not set'}</span></p>
            </section>

            <section className="profile-card">
                <div className="profile-card-header">
                    <h2>AI Matching Profile Form</h2>
                    <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving}>
                        <FiSave /> {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>

                <div className="profile-form-grid">
                    <label>
                        Full Name *
                        <input className="profile-input" value={form.name} onChange={(e) => handleInput('name', e.target.value)} />
                    </label>
                    <label>
                        Email Address
                        <input className="profile-input" value={form.email} onChange={(e) => handleInput('email', e.target.value)} />
                    </label>
                    <label>
                        Gender *
                        <select className="profile-input" value={form.gender} onChange={(e) => handleInput('gender', e.target.value)}>
                            <option value="">Select gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </label>
                    <label>
                        Primary Skills (comma separated) *
                        <textarea className="profile-input profile-textarea" value={form.primarySkillsInput} onChange={(e) => handleInput('primarySkillsInput', e.target.value)} placeholder="React, Node.js, Python" />
                    </label>
                    <label>
                        Secondary Skills
                        <textarea className="profile-input profile-textarea" value={form.secondarySkillsInput} onChange={(e) => handleInput('secondarySkillsInput', e.target.value)} placeholder="Redis, GraphQL, CI/CD" />
                    </label>
                    <label>
                        Preferred Role
                        <input className="profile-input" value={form.preferredRole} onChange={(e) => handleInput('preferredRole', e.target.value)} placeholder="Backend Developer" />
                    </label>
                    <label>
                        Experience Level
                        <select className="profile-input" value={form.experienceLevel} onChange={(e) => handleInput('experienceLevel', e.target.value)}>
                            <option value="">Select level</option>
                            {EXPERIENCE_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </label>
                    <label>
                        Preferred Job Type
                        <select className="profile-input" value={form.preferredJobType} onChange={(e) => handleInput('preferredJobType', e.target.value)}>
                            {JOB_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </label>
                    <label>
                        Preferred Work Mode
                        <select className="profile-input" value={form.preferredWorkMode} onChange={(e) => handleInput('preferredWorkMode', e.target.value)}>
                            {WORK_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                        </select>
                    </label>
                    <label>
                        Preferred Location
                        <input className="profile-input" value={form.preferredLocation} onChange={(e) => handleInput('preferredLocation', e.target.value)} placeholder="Bangalore / Remote" />
                    </label>

                    <div className="salary-row">
                        <label>
                            Expected Salary Min
                            <input type="number" className="profile-input" value={form.expectedSalaryMin} onChange={(e) => handleInput('expectedSalaryMin', e.target.value)} placeholder="500000" />
                        </label>
                        <label>
                            Expected Salary Max
                            <input type="number" className="profile-input" value={form.expectedSalaryMax} onChange={(e) => handleInput('expectedSalaryMax', e.target.value)} placeholder="1200000" />
                        </label>
                        <label>
                            Currency
                            <select className="profile-input" value={form.expectedSalaryCurrency} onChange={(e) => handleInput('expectedSalaryCurrency', e.target.value)}>
                                {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                            </select>
                        </label>
                    </div>

                    <label>
                        LinkedIn URL
                        <input className="profile-input" value={form.linkedin} onChange={(e) => handleInput('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username" />
                    </label>
                    <label>
                        GitHub URL
                        <input className="profile-input" value={form.github} onChange={(e) => handleInput('github', e.target.value)} placeholder="https://github.com/username" />
                    </label>
                    <label>
                        Portfolio URL
                        <input className="profile-input" value={form.portfolio} onChange={(e) => handleInput('portfolio', e.target.value)} placeholder="https://yourportfolio.com" />
                    </label>
                    <label>
                        Phone Number
                        <input className="profile-input" value={form.phone} onChange={(e) => handleInput('phone', e.target.value)} placeholder="+91 9876543210" />
                    </label>
                    <label>
                        Education Level
                        <input className="profile-input" value={form.educationLevel} onChange={(e) => handleInput('educationLevel', e.target.value)} placeholder="Bachelor's" />
                    </label>
                    <label>
                        Degree
                        <input className="profile-input" value={form.degree} onChange={(e) => handleInput('degree', e.target.value)} placeholder="B.Tech Computer Science" />
                    </label>
                    <label>
                        University
                        <input className="profile-input" value={form.university} onChange={(e) => handleInput('university', e.target.value)} placeholder="ABC University" />
                    </label>
                    <label>
                        Graduation Year
                        <input className="profile-input" value={form.graduationYear} onChange={(e) => handleInput('graduationYear', e.target.value)} placeholder="2026" />
                    </label>
                    <label>
                        Certifications (comma separated)
                        <input className="profile-input" value={form.certificationsInput} onChange={(e) => handleInput('certificationsInput', e.target.value)} placeholder="AWS CCP, AZ-900" />
                    </label>
                    <label>
                        Languages Known (comma separated)
                        <input className="profile-input" value={form.languagesKnownInput} onChange={(e) => handleInput('languagesKnownInput', e.target.value)} placeholder="English, Tamil" />
                    </label>
                </div>
            </section>

            <section className="profile-card resume-management">
                <div className="profile-card-header">
                    <h2>Resume Upload (Optional)</h2>
                    <label className="replace-btn">
                        <FiUpload /> {uploading ? 'Uploading...' : 'Upload Resume'}
                        <input type="file" accept=".pdf,.docx,.txt" onChange={handleReplaceResume} hidden disabled={uploading} />
                    </label>
                </div>

                <p className="profile-note">Supported formats: PDF, DOCX, TXT. Resume data overrides profile form data for match scoring.</p>
                <p className="profile-note"><strong>Current Resume:</strong> {profile?.resumeUploadedAt ? `Uploaded on ${new Date(profile.resumeUploadedAt).toLocaleDateString()}` : 'No resume uploaded'}</p>

                <div className="resume-insights">
                    <h3>Resume Insights</h3>
                    <div className="insight-grid">
                        <div>
                            <h4>Skill Highlights</h4>
                            <p>{insights.skills.length ? insights.skills.join(', ') : 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Extracted Projects</h4>
                            <p>{insights.projects.length ? insights.projects.join(' | ') : 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Extracted Education</h4>
                            <p>{insights.education || 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Experience Summary</h4>
                            <p>{insights.experience || 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Extracted Certifications</h4>
                            <p>{insights.certifications.length ? insights.certifications.join(', ') : 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Extracted Tools</h4>
                            <p>{insights.tools.length ? insights.tools.join(', ') : 'Not detected yet'}</p>
                        </div>
                        <div>
                            <h4>Extracted Technologies</h4>
                            <p>{insights.technologies.length ? insights.technologies.join(', ') : 'Not detected yet'}</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;
