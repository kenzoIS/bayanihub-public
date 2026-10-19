import React from 'react';
import { MapPin, Radio, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export const StatusCards = () => {
  return (
    <div className="status-cards">
      {/* Mission Status */}
      <div className="status-card">
        <h2>Mission Status</h2>
        <div className="status-list">
          <div className="status-item">
            <span className="status-label">Active Missions</span>
            <span className="status-value">3</span>
          </div>
          <div className="status-item">
            <span className="status-label">Completed Tasks</span>
            <span className="status-value">12</span>
          </div>
          <div className="status-item">
            <span className="status-label">Pending Tasks</span>
            <span className="status-value">7</span>
          </div>
        </div>
      </div>
      
      {/* System Status */}
      <div className="status-card">
        <h2>System Status</h2>
        <div className="status-list">
          <div className="status-item">
            <MapPin size={16} color="var(--color-success)" />
            <span className="status-label">GPS Tracking:</span>
            <StatusBadge status="online">Online</StatusBadge>
          </div>
          <div className="status-item">
            <Radio size={16} color="var(--color-success)" />
            <span className="status-label">Communication:</span>
            <StatusBadge status="active">Active</StatusBadge>
          </div>
          <div className="status-item">
            <AlertTriangle size={16} color="var(--color-success)" />
            <span className="status-label">Emergency Alert:</span>
            <StatusBadge status="online">Ready</StatusBadge>
          </div>
        </div>
      </div>
    </div>
  );
};