import { useState, useEffect } from 'react';
import { FiCheckCircle, FiExternalLink, FiX } from 'react-icons/fi';
import './ApplicationPopup.css';

const ApplicationPopup = ({ job, onConfirm, onCancel, onAppliedEarlier }) => {
  if (!job) return null;

  return (
    <div className="popup-overlay">
      <div className="app-popup">
        <div className="popup-header">
          <FiCheckCircle color="#00ADB5" size={48} />
          <h2>Did you apply?</h2>
          <p>We noticed you opened the application for <strong>{job.title}</strong> at <strong>{job.company}</strong>.</p>
        </div>

        <div className="popup-actions">
          <button className="confirm-btn" onClick={onConfirm}>
            Yes Applied
          </button>
          <button className="secondary-btn" onClick={onAppliedEarlier}>
            Applied Earlier
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            No just browsing
          </button>
        </div>

        <button className="close-x" onClick={onCancel}><FiX /></button>
      </div>
    </div>
  );
};

export default ApplicationPopup;
