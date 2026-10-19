import React from 'react';

interface Activity {
  name: string;
  action: string;
  time: string;
}

export const VolunteerSummary = () => {
  const recentActivities: Activity[] = [
    { name: 'Sarah Johnson', action: 'Checked in at Zone A', time: '2 min ago' },
    { name: 'Mike Chen', action: 'Completed task assignment', time: '5 min ago' },
    { name: 'Emma Davis', action: 'Requested assistance', time: '8 min ago' },
  ];

  return (
    <div className="volunteer-summary">
      <div className="summary-header">
        <h2>Volunteer Summary</h2>
        <span className="last-updated">
          Last updated: <span>2 minutes ago</span>
        </span>
      </div>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Total Volunteers</div>
          <div className="stat-value">147</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Active Now</div>
          <div className="stat-value">23</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">On Mission</div>
          <div className="stat-value">8</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Standby</div>
          <div className="stat-value">15</div>
        </div>
      </div>
      
      <div>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Recent Activity</h3>
        <div className="activity-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-info">
                <h4>{activity.name}</h4>
                <p>{activity.action}</p>
              </div>
              <span className="activity-time">{activity.time}</span>
            </div>
          ))}
        </div>
        <a href="#" className="view-all-link">View all activity →</a>
      </div>
    </div>
  );
};