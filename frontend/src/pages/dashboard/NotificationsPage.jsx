import { useEffect, useState } from 'react';
import './NotificationsPage.css';

const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/jobs/notifications', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = response.ok ? await response.json() : [];
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {loading ? (
        <p>Loading notifications...</p>
      ) : items.length === 0 ? (
        <p>No new notifications right now. Your profile is getting noticed.</p>
      ) : (
        <div className="notifications-list">
          {items.map((item) => (
            <div key={item.id} className="notification-item">
              <h4>{item.title}</h4>
              <p>{item.message}</p>
              <small>{new Date(item.timestamp).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
