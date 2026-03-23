import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import './ResumeUploadPage.css';

const ResumeUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only PDF, DOCX, and TXT files are allowed.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await fetch('/api/users/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/profile');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-upload-page">
      <div className="resume-upload__container">
        <div className="resume-upload__header">
          <h1>Upload Your Resume</h1>
          <p>We need your resume to provide personalized AI job matching.</p>
        </div>

        <div className={`resume-upload__dropzone ${file ? 'active' : ''}`}>
          <input
            type="file"
            id="resume-file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            hidden
          />
          <label htmlFor="resume-file">
            {file ? (
              <div className="file-info">
                <FiFileText size={48} color="#00ADB5" />
                <span>{file.name}</span>
              </div>
            ) : (
              <div className="upload-prompt">
                <FiUpload size={48} color="#393E46" />
                <span>Drag & Drop or Click to Upload</span>
                <span className="file-types">Supported: PDF, DOCX, TXT</span>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="resume-upload__error">
            <FiAlertCircle /> {error}
          </div>
        )}

        {success && (
          <div className="resume-upload__success">
            <FiCheckCircle /> Resume uploaded successfully! Redirecting to your profile...
          </div>
        )}

        <button
          className="resume-upload__btn"
          disabled={!file || uploading || success}
          onClick={handleUpload}
        >
          {uploading ? 'Processing...' : 'Analyze Resume'}
        </button>
      </div>
    </div>
  );
};

export default ResumeUploadPage;
