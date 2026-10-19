"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Play, 
  Activity, 
  Radio, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  UserCheck, 
  UserPlus, 
  UserMinus 
} from 'lucide-react';
import Link from 'next/link';
import { MissionsAPI } from '@/lib/api';

export default function Home() {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    MissionsAPI.volunteerSummary()
      .then((data: any) => { setSummaryData(data); setLastUpdated(new Date()); })
      .catch(() => {});
  }, []);

  const standby = summaryData
    ? Math.max(0, summaryData.summary.total - summaryData.summary.active - summaryData.summary.on_mission - summaryData.summary.completed)
    : null;

  const recentActivity: { name: string; action: string; time: string }[] =
    (summaryData?.deployments ?? []).slice(0, 3).map((d: any) => {
      const app = d.volunteer_applications ?? {};
      const profile = app.user_profiles ?? {};
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown';
      const rawDate = d.date_assigned;
      const timeStr = rawDate
        ? (() => {
            const ms = Date.now() - new Date(rawDate).getTime();
            const mins = Math.floor(ms / 60000);
            return mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)}h ago`;
          })()
        : 'recently';
      return { name, action: d.task_description ?? 'Deployed to mission', time: timeStr };
    });

  return (
    <DashboardLayout>
      {/* Main Content - Full Width */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '28px',
        width: '100%'
      }}>
        
        {/* Mission Control Section */}
        <div>
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: 600, 
            color: 'var(--color-gray-800)',
            marginBottom: '16px',
            letterSpacing: '-0.01em'
          }}>
            Mission Control
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            width: '100%'
          }}>
            {/* Scan QR Code Card */}
            <div className="card" style={{ 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '200px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: 'var(--color-gray-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '-0.01em'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                  Scan QR Code
                </h3>
              </div>
              <p style={{ 
                color: 'var(--color-gray-500)', 
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '16px',
                flex: 1
              }}>
                Scan volunteer deployment QR codes for on-site verification and check-ins.
              </p>
              <Link href="/scan-qr" style={{ width: '100%', textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: 'auto',
                  transition: 'opacity 0.2s',
                  letterSpacing: '0.01em',
                  boxShadow: '0 2px 4px rgba(92, 110, 213, 0.2)'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Open Scanner
                </button>
              </Link>
            </div>

            {/* Start New Mission Card */}
            <div className="card" style={{ 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '200px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Title Row with Ready Indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: 'var(--color-gray-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '-0.01em'
                }}>
                  <Radio size={16} color="var(--color-primary)" />
                  Start New Mission
                </h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(92, 110, 213, 0.08)',
                  padding: '4px 8px',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                  }}></span>
                  <span style={{ 
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    Ready
                  </span>
                </div>
              </div>

              <p style={{ 
                color: 'var(--color-gray-500)', 
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '16px',
                flex: 1
              }}>
                Activate a new volunteer mission session and begin coordinating field operations.
              </p>
              
              {/* Full-width Activate Mission Session Button - Linked to Activate Mission Page */}
              <Link href="/activate-mission" style={{ width: '100%', textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: 'auto',
                  transition: 'opacity 0.2s',
                  letterSpacing: '0.01em',
                  boxShadow: '0 2px 4px rgba(92, 110, 213, 0.2)'
                }}>
                  <Play size={14} />
                  Activate Mission Session
                </button>
              </Link>
            </div>

            {/* Real-time Monitoring Card */}
            <div className="card" style={{ 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: '200px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Title Row with Live Indicator */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: 600, 
                  color: 'var(--color-gray-800)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '-0.01em'
                }}>
                  <Activity size={16} color="var(--color-primary)" />
                  Real-time Monitoring
                </h3>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(92, 110, 213, 0.08)',
                  padding: '4px 8px',
                  borderRadius: '20px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  <span style={{ 
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.01em'
                  }}>
                    Live
                  </span>
                </div>
              </div>

              <p style={{ 
                color: 'var(--color-gray-500)', 
                fontSize: '13px',
                lineHeight: '1.5',
                marginBottom: '16px',
                flex: 1
              }}>
                Monitor active volunteers, track mission progress, and view live status updates.
              </p>
              
              {/* Full-width View Live Dashboard Button - Linked to Volunteer Summary */}
              <Link href="/volunteer-summary" style={{ width: '100%', textDecoration: 'none' }}>
                <button style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  marginTop: 'auto',
                  transition: 'all 0.2s',
                  letterSpacing: '0.01em'
                }}>
                  <Activity size={14} />
                  View Live Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Volunteer Summary Stats - Horizontal Row of 4 Separate Cards */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            marginBottom: '14px',
            color: 'var(--color-gray-800)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            letterSpacing: '-0.01em'
          }}>
            <Users size={18} color="var(--color-primary)" />
            Volunteer Summary
          </h2>
          
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            width: '100%',
            marginBottom: '8px'
          }}>
            {/* Total Volunteers Card */}
            <div className="card" style={{ 
              padding: '14px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(92, 110, 213, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserPlus size={18} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-gray-500)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  Total
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {summaryData?.summary.total ?? '—'}
                </div>
              </div>
            </div>

            {/* Active Now Card */}
            <div className="card" style={{ 
              padding: '14px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(92, 110, 213, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={18} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-gray-500)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  Active
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {summaryData?.summary.active ?? '—'}
                </div>
              </div>
            </div>

            {/* On Mission Card */}
            <div className="card" style={{ 
              padding: '14px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(92, 110, 213, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={18} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-gray-500)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  On Mission
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {summaryData?.summary.on_mission ?? '—'}
                </div>
              </div>
            </div>

            {/* Standby Card */}
            <div className="card" style={{ 
              padding: '14px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(92, 110, 213, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserMinus size={18} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--color-gray-500)',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  marginBottom: '2px'
                }}>
                  Standby
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em'
                }}>
                  {standby ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--color-gray-400)',
            textAlign: 'right',
            paddingRight: '4px',
            letterSpacing: '0.02em'
          }}>
            Last updated <span style={{ fontWeight: 500, color: 'var(--color-gray-500)' }}>{lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</span>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="card" style={{ 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: 600,
            marginBottom: '14px',
            color: 'var(--color-gray-800)',
            letterSpacing: '-0.01em'
          }}>
            Recent Activity
          </h3>
          
          {/* Activity Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentActivity.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-gray-400)', textAlign: 'center', padding: '16px 0' }}>
                No recent activity.
              </div>
            ) : (
              recentActivity.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--color-gray-100)' : 'none',
                    paddingBottom: idx < recentActivity.length - 1 ? '10px' : 0
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-gray-800)', marginBottom: '2px' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-500)' }}>{item.action}</div>
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--color-gray-400)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Clock size={11} color="var(--color-gray-300)" />
                    {item.time}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View All Link */}
          <div style={{ marginTop: '16px' }}>
            <a 
              href="#" 
              style={{ 
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 500,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.8
              }}
            >
              View all activity →
            </a>
          </div>
        </div>

        {/* Mission Status and System Status - Side by Side at Bottom */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%'
        }}>
          {/* Mission Status Card */}
          <div className="card" style={{ 
            padding: '18px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              marginBottom: '14px',
              color: 'var(--color-gray-800)',
              letterSpacing: '-0.01em'
            }}>
              Mission Status
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '4px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Active
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1
                }}>
                  {summaryData?.summary.active ?? '—'}
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '4px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Completed
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1
                }}>
                  {summaryData?.summary.completed ?? '—'}
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '4px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Pending
                </div>
                <div style={{ 
                  fontSize: '22px', 
                  fontWeight: 600,
                  color: 'var(--color-gray-800)',
                  lineHeight: 1
                }}>
                  {standby ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="card" style={{ 
            padding: '18px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
          }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              marginBottom: '14px',
              color: 'var(--color-gray-800)',
              letterSpacing: '-0.01em'
            }}>
              System Status
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  GPS
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-success)'
                }}>
                  <CheckCircle size={12} color="var(--color-success)" />
                  Online
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Comm
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-primary)'
                }}>
                  <Radio size={12} color="var(--color-primary)" />
                  Active
                </div>
              </div>
              
              <div>
                <div style={{ 
                  fontSize: '10px', 
                  color: 'var(--color-gray-500)',
                  marginBottom: '6px',
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  Alert
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-success)'
                }}>
                  <AlertCircle size={12} color="var(--color-success)" />
                  Ready
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add animation keyframes */}
        <style jsx>{`
          @keyframes pulse {
            0% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
            100% {
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}