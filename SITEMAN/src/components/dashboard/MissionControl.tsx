import React from 'react';
import { Play, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const MissionControl = () => {
  return (
    <div className="mission-control">
      <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-lg)' }}>
        Mission Control
      </h2>
      
      <div className="mission-section">
        <div className="mission-content">
          <h3>Start New Mission</h3>
          <p>Activate a new volunteer mission session and begin coordinating field operations.</p>
        </div>
        <Button variant="primary" icon={<Play size={16} />}>
          Ready
        </Button>
      </div>
      
      <div className="mission-section">
        <div className="mission-content">
          <h3>Real-time Monitoring</h3>
          <p>Monitor active volunteers, track mission progress, and view live status updates.</p>
        </div>
        <Button variant="outline">
          View Live Dashboard
        </Button>
      </div>
    </div>
  );
};