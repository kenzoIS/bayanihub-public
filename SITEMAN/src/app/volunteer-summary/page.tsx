"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { 
  Users, 
  Activity, 
  MapPin, 
  Radio, 
  Clock, 
  ChevronDown,
  Search,
  Filter,
  Eye,
  TrendingUp,
  Truck,
  HeartPulse,
  UserCheck,
  UserCog,
  Circle,
  PieChart,
  X,
  Check
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MissionsAPI, CampaignsAPI } from '@/lib/api';

export default function VolunteerSummaryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<{
    summary: { total: number; active: number; completed: number };
    by_role: Record<string, number>;
    deployments: any[];
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedTeamModal, setSelectedTeamModal] = useState<string | null>(null);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [assignMissionId, setAssignMissionId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Task state
  const [roleTasks, setRoleTasks] = useState<{ title: string; description?: string }[]>([]);
  const [selectedTaskTitles, setSelectedTaskTitles] = useState<string[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [showMissionDropdown, setShowMissionDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedVolunteerDetail, setSelectedVolunteerDetail] = useState<any | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // Reset selection when modal changes
  useEffect(() => {
    setSelectedVolunteerIds([]);
    setAssignMissionId(selectedCampaignId || '');
    setAssignError(null);
    setSuccessMessage(null);
    setSelectedTaskTitles([]);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setShowAddTask(false);

    // Fetch tasks for the role when modal opens
    if (selectedTeamModal) {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      // Derive roleId directly from summaryData (available in scope) rather than
      // the 'volunteers' useMemo which is defined later in the file.
      const deployments = summaryData?.deployments ?? [];
      const match = deployments.find((d: any) => {
        const role = (d.volunteer_applications as any)?.volunteer_roles;
        const title = role?.title ?? '';
        return title.replace(/\w\S*/g, (t: string) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase()) === selectedTeamModal;
      });
      const roleId = (match?.volunteer_applications as any)?.volunteer_roles?.id;
      if (roleId) {
        setLoadingTasks(true);
        fetch(`${baseUrl}/api/tasks/role/${roleId}`)
          .then(res => res.ok ? res.json() : Promise.resolve({ tasks: [] }))
          .then(data => setRoleTasks(data.tasks ?? []))
          .catch(() => setRoleTasks([]))
          .finally(() => setLoadingTasks(false));
      }
    } else {
      setRoleTasks([]);
    }
  }, [selectedTeamModal, selectedCampaignId, summaryData]);

  // Refs for dropdown click outside handling
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const missionDropdownRef = useRef<HTMLDivElement>(null);
  
  const ROLE_COLORS: Record<string, string> = {
    'Medic': '#5C6ED5',
    'Logistics': '#F59E0B',
    'Field': '#10B981',
  };
  const FALLBACK_COLORS = ['#5C6ED5', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#6B7280'];

  // Team distribution derived from API data
  const teamDistribution = useMemo(() => {
    if (!summaryData?.by_role) return [];
    
    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    };

    const total = summaryData.summary.total || 1;
    const canonicalRoles = ['Medic', 'Logistics', 'Field'];

    return canonicalRoles
      .map((name, i) => {
        const value = Number(summaryData.by_role?.[name] ?? 0);
        const titleName = toTitleCase(name);
        return {
          name: titleName,
          value,
          percentage: Number(((value / total) * 100).toFixed(1)),
          color: ROLE_COLORS[titleName] ?? ROLE_COLORS[name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        };
      })
      .filter((team) => team.value > 0);
  }, [summaryData]);

  // Active (deployed) count per role — derived after volunteers is computed below
  // This is computed inline where needed using the volunteers array.

  const totalVolunteers = summaryData?.summary.total ?? 0;

  // Calculate pie chart segments
  let cumulativeAngle = 0;
  const pieSegments = totalVolunteers > 0
    ? teamDistribution.map(team => {
        const angle = (team.value / totalVolunteers) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;
        cumulativeAngle += angle;
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;
        const x1 = 50 + 40 * Math.cos(startRad);
        const y1 = 50 + 40 * Math.sin(startRad);
        const x2 = 50 + 40 * Math.cos(endRad);
        const y2 = 50 + 40 * Math.sin(endRad);
        const largeArcFlag = angle > 180 ? 1 : 0;
        return {
          ...team,
          path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
        };
      })
    : [];

  // Volunteers derived from API deployments
  const volunteers = useMemo(() => {
    if (!summaryData?.deployments) return [];
    return summaryData.deployments.map((d) => {
      const app = (d.volunteer_applications as any) ?? {};
      const profile = app.user_profiles ?? {};
      const role = app.volunteer_roles ?? {};
      
      const toTitleCase = (str: string) => {
        if (!str) return '';
        return str.replace(
          /\w\S*/g,
          (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
      };

      const firstName = (profile.first_name ?? '') as string;
      const lastName = (profile.last_name ?? '') as string;
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
      const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?';
      const deploymentStatus =
        d.status === 'active' ? 'Active' :
        d.status === 'completed' ? 'Completed' : 'Standby';
      
      const roleTitle = toTitleCase((role.title ?? 'Unassigned') as string);

      return {
        id: (d.id as string),
        displayId: (d.id as string).slice(0, 8).toUpperCase(),
        deploymentId: (d.deployment_id ?? d.id) as string,   // actual volunteer_deployments.id
        applicationId: d.application_id as string,
        roleId: role.id as string,
        campaignId: (d.damayan_operation_id ?? role.campaign_id ?? '') as string,
        name: fullName,
        initials,
        team: roleTitle,
        teamCategory: roleTitle,
        location: (() => {
          const motivation = String(app.motivation ?? '');
          const siteMatch = motivation.match(/- Site\/Campaign:\s*(.+?)(?:\s+\(|$)/i);
          return siteMatch?.[1]?.trim() || role.location || profile.municipality || '—';
        })(),
        description: role.description ?? app.motivation ?? 'No volunteer description available.',
        capabilities: roleTitle !== 'Unassigned' ? [roleTitle] : [],
        currentTasks: (d.current_tasks || []).map((t: any) => t.task_title),
        status: deploymentStatus,
        avatar: null,
      };
    });
  }, [summaryData]);

  // Get unique teams and statuses for filters
  const uniqueTeams = [...new Set(volunteers.map(v => v.teamCategory))];
  const uniqueStatuses = [...new Set(volunteers.map(v => v.status))];

  // Filter volunteers based on search term and filters
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(volunteer => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        volunteer.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Team filter
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(volunteer.teamCategory);
      
      // Status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(volunteer.status);
      
      return matchesSearch && matchesTeam && matchesStatus;
    });
  }, [volunteers, searchTerm, selectedTeams, selectedStatuses]);

  // Toggle team selection
  const toggleTeam = (team: string) => {
    setSelectedTeams(prev => 
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  // Toggle status selection
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTeams([]);
    setSelectedStatuses([]);
    setSearchTerm('');
  };

  // Fetch volunteer summary on mount and when campaign changes
  useEffect(() => {
    setLoading(true);
    MissionsAPI.volunteerSummary(selectedCampaignId || undefined)
      .then((data) => {
        const byRole = data?.by_role ?? {};
        setSummaryData({
          ...data,
          by_role: {
            ...byRole,
            Medic: byRole.Medic ?? byRole['Medic Team'] ?? 0,
            Logistics: byRole.Logistics ?? 0,
            Field: byRole.Field ?? byRole['Field Ops'] ?? 0,
            'Medic Team': byRole.Medic ?? byRole['Medic Team'] ?? 0,
            'Field Ops': byRole.Field ?? byRole['Field Ops'] ?? 0,
          },
        });
        setLastUpdated(new Date());
      })
      .catch((err: any) => setApiError(err.message ?? 'Failed to load volunteer summary'))
      .finally(() => setLoading(false));
  }, [selectedCampaignId]);

  // Fetch campaigns
  useEffect(() => {
    CampaignsAPI.list()
      .then(setCampaigns)
      .catch(() => {});
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
        setShowTeamDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
      if (missionDropdownRef.current && !missionDropdownRef.current.contains(event.target as Node)) {
        setShowMissionDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Active': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#0B7B4A', border: '#10B981' };
      case 'Break': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309', border: '#F59E0B' };
      case 'Standby': return { bg: 'rgba(107, 114, 128, 0.15)', text: '#4B5563', border: '#6B7280' };
      default: return { bg: 'rgba(92, 110, 213, 0.15)', text: '#3E5A99', border: '#5C6ED5' };
    }
  };

  const getTeamColor = (team: string) => {
    const t = (team || '').toLowerCase();
    if (t.includes('medic') || t.includes('health')) return '#5C6ED5';
    if (t.includes('logistic') || t.includes('supply')) return '#F59E0B';
    if (t.includes('field') || t.includes('ops') || t.includes('rescue')) return '#10B981';
    return '#6B7280';
  };

  const getTeamIcon = (team: string) => {
    const t = (team || '').toLowerCase();
    const color = getTeamColor(team);
    if (t.includes('medic') || t.includes('health')) return <HeartPulse size={24} color={color} />;
    if (t.includes('logistic') || t.includes('supply')) return <Truck size={24} color={color} />;
    if (t.includes('field') || t.includes('ops') || t.includes('rescue')) return <UserCog size={24} color={color} />;
    return <Users size={24} color={color} />;
  };

  const totalFilters = selectedTeams.length + selectedStatuses.length;

  return (
    <DashboardLayout>
      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        width: '100%',
        maxWidth: '1800px',
        margin: '0 auto'
      }}>
        
        {/* Header Section - No Breadcrumb */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '8px',
          marginBottom: '4px'
        }}>
          <div>
            <h1 style={{
              fontSize: '35px',
              fontWeight: 600,
              color: '#111827',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Activity size={32} color="#5C6ED5" />
              Volunteer Command
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <p style={{
                fontSize: '14px',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: 0
              }}>
                <Clock size={14} color="#9CA3AF" />
                Live Updates · Last updated: <span style={{ fontWeight: 500, color: '#374151' }}>{lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}</span>
              </p>
              
              {/* Mission Custom Dropdown */}
              <div ref={missionDropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Mission:</span>
                <button
                  onClick={() => setShowMissionDropdown(!showMissionDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 12px',
                    backgroundColor: selectedCampaignId ? 'rgba(92, 110, 213, 0.08)' : 'white',
                    border: selectedCampaignId ? '1px solid #5C6ED5' : '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: selectedCampaignId ? '#5C6ED5' : '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    minWidth: '160px',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId)?.title ?? 'All Missions' : 'All Missions'}
                  </span>
                  <ChevronDown size={14} style={{ flexShrink: 0, transform: showMissionDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {showMissionDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    minWidth: '280px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(92, 110, 213, 0.12), 0 8px 10px -6px rgba(92, 110, 213, 0.08)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #E5E5E5', fontSize: '0.75rem', fontWeight: 600, color: '#171717', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Select Mission
                    </div>
                    {[{ id: '', title: 'All Missions' }, ...campaigns].map(c => (
                      <div
                        key={c.id || 'all'}
                        onClick={() => { setSelectedCampaignId(c.id); setShowMissionDropdown(false); }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          backgroundColor: selectedCampaignId === c.id ? 'rgba(92, 110, 213, 0.08)' : 'white',
                          color: selectedCampaignId === c.id ? '#5C6ED5' : '#374151',
                          fontSize: '13px',
                          fontWeight: selectedCampaignId === c.id ? 600 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #FAFAFA',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => { if (selectedCampaignId !== c.id) e.currentTarget.style.backgroundColor = '#FAFAFA'; }}
                        onMouseLeave={(e) => { if (selectedCampaignId !== c.id) e.currentTarget.style.backgroundColor = 'white'; }}
                      >
                        {c.title}
                        {selectedCampaignId === c.id && <Check size={14} color="#5C6ED5" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(92, 110, 213, 0.1)',
            padding: '8px 16px',
            borderRadius: '40px',
            border: '1px solid rgba(92, 110, 213, 0.2)'
          }}>
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#5C6ED5',
              animation: 'pulse 2s infinite'
            }}></span>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#5C6ED5'
            }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Stats Cards - Smaller and More Subtle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          width: '100%'
        }}>
          {/* Total Active Card - Smaller */}
          <div className="card" style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(92, 110, 213, 0.1) 0%, rgba(62, 90, 153, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={20} color="#5C6ED5" />
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 500,
                marginBottom: '2px',
                letterSpacing: '0.02em'
              }}>
                TOTAL ACTIVE
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
                marginBottom: '2px'
              }}>
                {loading ? '—' : (summaryData?.summary.total ?? 0)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: 500
              }}>
                {summaryData ? `${summaryData.summary.active} active · ${summaryData.summary.completed} completed` : 'No data available'}
              </div>
            </div>
          </div>

          {/* Medic Card - Smaller */}
          <div className="card" style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(92, 110, 213, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartPulse size={20} color="#5C6ED5" />
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 500,
                marginBottom: '2px',
                letterSpacing: '0.02em'
              }}>
                MEDIC
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
                marginBottom: '2px'
              }}>
                {loading ? '—' : (summaryData?.by_role?.['Medic Team'] ?? 0)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#4B5563',
                fontWeight: 500
              }}>
                deployed volunteers
              </div>
            </div>
          </div>

          {/* Logistics Card - Smaller */}
          <div className="card" style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={20} color="#F59E0B" />
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 500,
                marginBottom: '2px',
                letterSpacing: '0.02em'
              }}>
                LOGISTICS
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
                marginBottom: '2px'
              }}>
                {loading ? '—' : (summaryData?.by_role?.['Logistics'] ?? 0)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#4B5563',
                fontWeight: 500
              }}>
                deployed volunteers
              </div>
            </div>
          </div>

          {/* Field Card - Smaller */}
          <div className="card" style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} color="#10B981" />
            </div>
            <div>
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                fontWeight: 500,
                marginBottom: '2px',
                letterSpacing: '0.02em'
              }}>
                FIELD
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#111827',
                lineHeight: 1,
                marginBottom: '2px'
              }}>
                {loading ? '—' : (summaryData?.by_role?.['Field Ops'] ?? 0)}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#4B5563',
                fontWeight: 500
              }}>
                deployed volunteers
              </div>
            </div>
          </div>
        </div>

        {/* Active Teams and Team Distribution Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          width: '100%'
        }}>
          {/* Active Teams Section */}
          <div className="card" style={{
            padding: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: '16px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #F3F4F6',
              paddingBottom: '12px'
            }}>
              <UserCheck size={20} color="#5C6ED5" />
              Active Teams
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading ? (
                <LoadingSpinner text="Loading teams…" />
              ) : teamDistribution.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#9CA3AF', fontSize: '14px' }}>
                  No active teams to display.
                </div>
              ) : (
                teamDistribution.map((team) => (
                  <div key={team.name} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transform: 'translateY(0)',
                  }}
                  onClick={() => {
                    setSelectedTeamModal(team.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = team.color;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `${team.color}26`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getTeamIcon(team.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827', marginBottom: '6px' }}>{team.name}</div>
                        <div style={{ fontSize: '13px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={12} color="#9CA3AF" />
                          {(() => {
                            const activeCount = volunteers.filter(v => v.teamCategory === team.name && v.status === 'Active').length;
                            const totalCount = team.value;
                            return `${activeCount}/${totalCount} Volunteer${totalCount !== 1 ? 's' : ''} Deployed`;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '6px 14px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '30px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#0B7B4A',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        {(() => {
                            const activeCount = volunteers.filter(v => v.teamCategory === team.name && v.status === 'Active').length;
                            return `${activeCount}/${team.value}`;
                          })()}
                      </div>
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: team.color,
                        display: 'inline-block',
                        boxShadow: `0 0 0 3px ${team.color}4D`
                      }}></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Distribution Section with Pie Chart */}
          <div className="card" style={{
            padding: '24px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: '16px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid #F3F4F6',
              paddingBottom: '12px'
            }}>
              <PieChart size={20} color="#5C6ED5" />
              Team Distribution
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '22px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '220px',
                height: '220px',
                position: 'relative',
                flexShrink: 0
              }}>
                <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                  {pieSegments.map((segment, index) => (
                    <path
                      key={index}
                      d={segment.path}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  ))}
                  <circle cx="50" cy="50" r="28" fill="white" stroke="#E5E7EB" strokeWidth="1" />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', lineHeight: 1 }}>{totalVolunteers}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Total Volunteers</div>
                </div>
              </div>

              {teamDistribution.length > 0 ? (
                <div style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px'
                }}>
                  {teamDistribution.map((team, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      backgroundColor: '#FAFAFA'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: team.color
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{team.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{team.value}</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>({team.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', padding: '8px 0' }}>
                  {loading ? <LoadingSpinner size={16} text="Loading…" /> : 'No data available'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Volunteer Details Table */}
        <div className="card" style={{
          padding: '24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: '16px'
        }}>
          {/* Table Header with Title and Filters */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #F3F4F6',
            paddingBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={20} color="#5C6ED5" />
              Volunteer Details
              {filteredVolunteers.length > 0 && (
                <span style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginLeft: '8px'
                }}>
                  ({filteredVolunteers.length} {filteredVolunteers.length === 1 ? 'volunteer' : 'volunteers'})
                </span>
              )}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Search */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E5E7EB'
              }}>
                <Search size={16} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Search volunteers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    width: '200px',
                    color: '#111827'
                  }}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={14} color="#9CA3AF" />
                  </button>
                )}
              </div>

              {/* Team Filter Dropdown */}
              <div ref={teamDropdownRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => {
                    setShowTeamDropdown(!showTeamDropdown);
                    setShowStatusDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedTeams.length > 0 ? 'rgba(92, 110, 213, 0.08)' : 'white',
                    border: selectedTeams.length > 0 ? '1px solid #5C6ED5' : '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: selectedTeams.length > 0 ? '#5C6ED5' : '#525252',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { if (selectedTeams.length === 0) { e.currentTarget.style.backgroundColor = '#FAFAFA'; e.currentTarget.style.color = '#5C6ED5'; e.currentTarget.style.borderColor = '#5C6ED5'; }}}
                  onMouseLeave={(e) => { if (selectedTeams.length === 0) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#525252'; e.currentTarget.style.borderColor = '#E5E5E5'; }}}
                >
                  <Filter size={14} />
                  Team
                  {selectedTeams.length > 0 && (
                    <span style={{
                      backgroundColor: '#5C6ED5',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '1px 7px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {selectedTeams.length}
                    </span>
                  )}
                  <ChevronDown size={14} />
                </button>
                
                {showTeamDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '210px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(92, 110, 213, 0.1), 0 8px 10px -6px rgba(92, 110, 213, 0.05)',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E5E5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#171717',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Filter by Team
                    </div>
                    {uniqueTeams.map(team => (
                      <div
                        key={team}
                        onClick={() => toggleTeam(team)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          backgroundColor: selectedTeams.includes(team) ? 'rgba(92, 110, 213, 0.05)' : 'white',
                          borderBottom: '1px solid #FAFAFA',
                          transition: 'background-color 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedTeams.includes(team) ? 'rgba(92, 110, 213, 0.05)' : 'white'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: getTeamColor(team), flexShrink: 0 }} />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>{team}</span>
                        </div>
                        {selectedTeams.includes(team) && <Check size={14} color="#5C6ED5" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div ref={statusDropdownRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => {
                    setShowStatusDropdown(!showStatusDropdown);
                    setShowTeamDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.5rem 1rem',
                    backgroundColor: selectedStatuses.length > 0 ? 'rgba(92, 110, 213, 0.08)' : 'white',
                    border: selectedStatuses.length > 0 ? '1px solid #5C6ED5' : '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: selectedStatuses.length > 0 ? '#5C6ED5' : '#525252',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => { if (selectedStatuses.length === 0) { e.currentTarget.style.backgroundColor = '#FAFAFA'; e.currentTarget.style.color = '#5C6ED5'; e.currentTarget.style.borderColor = '#5C6ED5'; }}}
                  onMouseLeave={(e) => { if (selectedStatuses.length === 0) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#525252'; e.currentTarget.style.borderColor = '#E5E5E5'; }}}
                >
                  <Filter size={14} />
                  Status
                  {selectedStatuses.length > 0 && (
                    <span style={{
                      backgroundColor: '#5C6ED5',
                      color: 'white',
                      borderRadius: '20px',
                      padding: '1px 7px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown size={14} />
                </button>
                
                {showStatusDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '200px',
                    backgroundColor: 'white',
                    border: '1px solid #E5E5E5',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 25px -5px rgba(92, 110, 213, 0.1), 0 8px 10px -6px rgba(92, 110, 213, 0.05)',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #E5E5E5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#171717',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Filter by Status
                    </div>
                    {uniqueStatuses.map(status => {
                      const statusColor = getStatusColor(status);
                      return (
                        <div
                          key={status}
                          onClick={() => toggleStatus(status)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            backgroundColor: selectedStatuses.includes(status) ? 'rgba(92, 110, 213, 0.05)' : 'white',
                            borderBottom: '1px solid #FAFAFA',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedStatuses.includes(status) ? 'rgba(92, 110, 213, 0.05)' : 'white'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: statusColor.border,
                              flexShrink: 0
                            }} />
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>{status}</span>
                          </div>
                          {selectedStatuses.includes(status) && <Check size={14} color="#5C6ED5" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clear Filters - shown only when filters are active */}
              {totalFilters > 0 && (
                <button 
                  onClick={clearFilters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '13px',
                    color: '#6B7280',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedTeams.length > 0 || selectedStatuses.length > 0) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>Active filters:</span>
              {selectedTeams.map(team => (
                <span key={team} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  backgroundColor: 'rgba(92, 110, 213, 0.1)',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#5C6ED5',
                  border: '1px solid rgba(92, 110, 213, 0.2)'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    backgroundColor: getTeamColor(team)
                  }} />
                  {team}
                  <button onClick={() => toggleTeam(team)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px', display: 'flex' }}>
                    <X size={10} color="#5C6ED5" />
                  </button>
                </span>
              ))}
              {selectedStatuses.map(status => (
                <span key={status} style={{
                  padding: '4px 10px',
                  backgroundColor: 'rgba(92, 110, 213, 0.1)',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#5C6ED5',
                  border: '1px solid rgba(92, 110, 213, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(status).border,
                    display: 'inline-block'
                  }} />
                  {status}
                  <button onClick={() => toggleStatus(status)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px', display: 'flex' }}>
                    <X size={10} color="#5C6ED5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search result indicator */}
          {searchTerm && (
            <div style={{
              marginBottom: '16px',
              padding: '8px 16px',
              backgroundColor: 'rgba(92, 110, 213, 0.08)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#374151',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                Showing results for: <span style={{ fontWeight: 600, color: '#5C6ED5' }}>"{searchTerm}"</span>
                <span style={{ marginLeft: '8px', color: '#6B7280' }}>({filteredVolunteers.length} found)</span>
              </span>
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={14} color="#9CA3AF" />
              </button>
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid #E5E7EB',
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Volunteer</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Team</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Location</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Capabilities</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.map((volunteer, index) => {
                  const statusColor = getStatusColor(volunteer.status);
                  return (
                    <tr key={index} style={{
                      borderBottom: index < filteredVolunteers.length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #5C6ED5 0%, #3E5A99 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            boxShadow: '0 4px 8px rgba(92, 110, 213, 0.3)'
                          }}>
                            {volunteer.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>{volunteer.name}</div>
                            <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Circle size={6} color="#9CA3AF" fill="#9CA3AF" />
                              ID: {volunteer.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          backgroundColor: `${getTeamColor(volunteer.teamCategory)}14`,
                          padding: '6px 12px',
                          borderRadius: '30px',
                          width: 'fit-content',
                          border: `1px solid ${getTeamColor(volunteer.teamCategory)}30`
                        }}>
                          {getTeamIcon(volunteer.teamCategory) && (
                            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {getTeamIcon(volunteer.teamCategory)}
                            </span>
                          )}
                          <span style={{ fontSize: '14px', fontWeight: 500, color: getTeamColor(volunteer.teamCategory) }}>{volunteer.team}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', color: '#374151', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#9CA3AF" />
                          {volunteer.location}
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {volunteer.capabilities.map((cap, i) => (
                            <span key={i} style={{
                              padding: '4px 10px',
                              backgroundColor: 'rgba(92, 110, 213, 0.1)',
                              borderRadius: '30px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#3E5A99',
                              border: '1px solid rgba(92, 110, 213, 0.2)'
                            }}>
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{
                          padding: '6px 14px',
                          backgroundColor: statusColor.bg,
                          color: statusColor.text,
                          borderRadius: '30px',
                          fontSize: '13px',
                          fontWeight: 600,
                          border: `1px solid ${statusColor.border}`,
                          display: 'inline-block'
                        }}>
                          {volunteer.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedVolunteerDetail(volunteer)}
                            aria-label={`View ${volunteer.name} details`}
                            title="View volunteer details"
                            style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6B7280',
                            padding: '6px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* No results message */}
          {filteredVolunteers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6B7280',
              fontSize: '14px'
            }}>
              {loading
                ? <LoadingSpinner text="Loading volunteers…" />
                : apiError
                ? apiError
                : (searchTerm || selectedTeams.length > 0 || selectedStatuses.length > 0)
                ? 'No volunteers found matching your criteria'
                : volunteers.length === 0
                ? 'No approved volunteers yet.'
                : 'No volunteers to display.'}
            </div>
          )}
        </div>

        {/* Modal — rendered via Portal directly on document.body for true full-page blur */}
        {isMounted && selectedTeamModal && createPortal(
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(17, 24, 39, 0.55)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            WebkitBackdropFilter: 'blur(3px)',
            backdropFilter: 'blur(3px)',
          }} onClick={() => setSelectedTeamModal(null)}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '580px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              animation: 'smSlideUp 0.18s ease-out',
              border: '1px solid rgba(229, 229, 229, 0.6)',
              willChange: 'transform, opacity',
            }} onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(229, 229, 229, 0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C6ED5', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getTeamIcon(selectedTeamModal)}
                    {selectedTeamModal} Volunteers
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>Select tasks and volunteers to assign.</p>
                </div>
                <button onClick={() => setSelectedTeamModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', padding: '0.5rem', borderRadius: '0.375rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F5F5F5'; e.currentTarget.style.color = '#171717'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#737373'; }}>
                  <X size={18} />
                </button>
              </div>
              {/* Task Checklist */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid #F3F4F6', backgroundColor: '#FAFAFA', flexShrink: 0, maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Role Tasks <span style={{ color: '#DC2626' }}>*</span>
                  </span>
                  <button
                    onClick={() => setShowAddTask(v => !v)}
                    style={{ fontSize: '12px', fontWeight: 600, color: '#5C6ED5', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(92,110,213,0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    + New Task
                  </button>
                </div>

                {/* Add New Task inline form */}
                {showAddTask && (
                  <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '12px', marginBottom: '10px' }}>
                    <input
                      placeholder="Task title (e.g. Pack Medicine)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '6px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <input
                      placeholder="Description (optional)"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '8px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={savingTask || !newTaskTitle.trim()}
                        onClick={async () => {
                          if (!newTaskTitle.trim()) return;
                          const roleId = volunteers.find(v => v.teamCategory === selectedTeamModal)?.roleId;
                          if (!roleId) return;
                          setSavingTask(true);
                          try {
                            const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
                            const res = await fetch(`${baseUrl}/api/tasks/role/${roleId}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: newTaskTitle.trim(), description: newTaskDesc.trim() }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.message);
                            setRoleTasks(data.tasks ?? []);
                            setNewTaskTitle('');
                            setNewTaskDesc('');
                            setShowAddTask(false);
                          } catch (err: any) {
                            setAssignError(err.message || 'Failed to save task.');
                          } finally {
                            setSavingTask(false);
                          }
                        }}
                        style={{ flex: 1, padding: '6px 12px', backgroundColor: savingTask || !newTaskTitle.trim() ? '#D1D5DB' : '#5C6ED5', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: savingTask || !newTaskTitle.trim() ? 'not-allowed' : 'pointer' }}
                      >
                        {savingTask ? 'Saving...' : 'Save Task'}
                      </button>
                      <button onClick={() => { setShowAddTask(false); setNewTaskTitle(''); setNewTaskDesc(''); }}
                        style={{ padding: '6px 12px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {loadingTasks ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '16px 0', fontSize: '13px' }}>Loading tasks…</div>
                ) : roleTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '12px 0', fontSize: '13px' }}>No tasks yet. Click "+ New Task" to add one.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {roleTasks.map((task) => {
                      const isChecked = selectedTaskTitles.includes(task.title);
                      return (
                        <label key={task.title} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px',
                          borderRadius: '8px', cursor: 'pointer', transition: 'background 0.12s',
                          backgroundColor: isChecked ? 'rgba(92,110,213,0.07)' : 'white',
                          border: isChecked ? '1px solid rgba(92,110,213,0.3)' : '1px solid #E5E7EB',
                        }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTaskTitles(p => [...p, task.title]);
                              else setSelectedTaskTitles(p => p.filter(t => t !== task.title));
                            }}
                            style={{ marginTop: '2px', accentColor: '#5C6ED5', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{task.title}</div>
                            {task.description && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{task.description}</div>}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Volunteer List */}
              <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
                {volunteers.filter(v => v.teamCategory === selectedTeamModal).length > 0 && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', marginBottom: '8px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      style={{ width: '16px', height: '16px', accentColor: '#5C6ED5' }}
                      checked={volunteers.filter(v => v.teamCategory === selectedTeamModal).length > 0 && selectedVolunteerIds.length === volunteers.filter(v => v.teamCategory === selectedTeamModal).length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVolunteerIds(volunteers.filter(v => v.teamCategory === selectedTeamModal).map(v => v.applicationId).filter(Boolean));
                        } else {
                          setSelectedVolunteerIds([]);
                        }
                      }}
                    />
                    Select All ({volunteers.filter(v => v.teamCategory === selectedTeamModal).length})
                  </label>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {volunteers.filter(v => v.teamCategory === selectedTeamModal).map(v => {
                    const isSelected = selectedVolunteerIds.includes(v.applicationId);
                    const volunteerKey = v.deploymentId || v.applicationId || v.id;
                    return (
                      <label key={volunteerKey} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px',
                        border: isSelected ? `1px solid ${getTeamColor(selectedTeamModal)}` : '1px solid #E5E7EB',
                        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
                        backgroundColor: isSelected ? `${getTeamColor(selectedTeamModal)}08` : 'white',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px', accentColor: '#5C6ED5', flexShrink: 0 }}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedVolunteerIds(prev => [...prev, v.applicationId]);
                              } else {
                                setSelectedVolunteerIds(prev => prev.filter(id => id !== v.applicationId));
                              }
                            }}
                          />
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${getTeamColor(selectedTeamModal)}20`, color: getTeamColor(selectedTeamModal), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                            {v.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>{v.name}</div>
                            <div style={{ color: '#9CA3AF', fontSize: '12px' }}>ID: {v.displayId}</div>
                            {(v.currentTasks as string[])?.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                                {(v.currentTasks as string[]).map((t, i) => (
                                  <span key={`${volunteerKey}-${t}-${i}`} style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 500 }}>
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', backgroundColor: getStatusColor(v.status).bg, color: getStatusColor(v.status).text, borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: `1px solid ${getStatusColor(v.status).border}`, flexShrink: 0 }}>
                          {v.status}
                        </span>
                      </label>
                    );
                  })}
                  {volunteers.filter(v => v.teamCategory === selectedTeamModal).length === 0 && (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '32px 0', fontSize: '14px' }}>No volunteers found for this role.</div>
                  )}
                </div>
              </div>
              {assignError && (
                <div style={{ margin: '0 24px 12px', padding: '10px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '8px', fontSize: '13px', flexShrink: 0 }}>
                  {assignError}
                </div>
              )}
              {/* Modal Footer */}
              <div style={{ padding: '14px 24px', display: 'flex', gap: '10px', borderTop: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', flexShrink: 0, alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#6B7280', flex: 1 }}>
                  {selectedVolunteerIds.length > 0
                    ? <span style={{ color: '#5C6ED5', fontWeight: 600 }}>{selectedVolunteerIds.length} selected</span>
                    : <span>No volunteers selected</span>}
                </div>
                <button onClick={() => setSelectedTeamModal(null)}
                  style={{ padding: '0.55rem 1.1rem', backgroundColor: '#F3F4F6', color: '#000000', borderRadius: '0.5rem', border: 'none', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}>
                  Cancel
                </button>
                <button
                  disabled={assigning || selectedVolunteerIds.length === 0 || selectedTaskTitles.length === 0}
                  onClick={async () => {
                    if (selectedVolunteerIds.length === 0) { setAssignError('Please select at least one volunteer.'); return; }
                    if (selectedTaskTitles.length === 0) { setAssignError('Please select at least one task.'); return; }
                    setAssigning(true); setAssignError(null);
                    try {
                      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
                      // Assign tasks to each selected volunteer's deployment
                      const teamVols = volunteers.filter(v => v.teamCategory === selectedTeamModal);
                      const selectedVols = teamVols.filter(v => selectedVolunteerIds.includes(v.applicationId));
                      
                      // Check for already assigned tasks
                      const alreadyAssignedInfo: string[] = [];
                      selectedVols.forEach(v => {
                        const tasksAlreadyAssigned = selectedTaskTitles.filter(t => 
                          v.currentTasks.includes(t)
                        );
                        if (tasksAlreadyAssigned.length > 0) {
                          alreadyAssignedInfo.push(`${v.name}: already assigned to ${tasksAlreadyAssigned.join(', ')}`);
                        }
                      });

                      const results = await Promise.all(
                        selectedVols.map(v =>
                          fetch(`${baseUrl}/api/tasks/assign`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              application_id: v.applicationId,
                              role_id: v.roleId,
                              campaign_id: selectedCampaignId || v.campaignId,
                              task_titles: selectedTaskTitles,
                            }),
                          }).then(async r => {
                            const data = await r.json();
                            if (!r.ok) throw new Error(data.message || 'Failed to assign tasks');
                            return data;
                          })
                        )
      );
                      const totalAssigned = results.reduce((sum, r) => sum + (r.assigned ?? 0), 0);
                      let successMsg = `${totalAssigned} task assignment(s) created across ${selectedVols.length} volunteer(s).`;
                      if (alreadyAssignedInfo.length > 0) {
                        successMsg += `\n\nNote: ${alreadyAssignedInfo.join(' ')}`;
                      }
                      setSuccessMessage(successMsg);
                      
                      // Refresh volunteer data to show updated current tasks
                      setLoading(true);
                      MissionsAPI.volunteerSummary(selectedCampaignId || undefined)
                        .then((data) => { setSummaryData(data); setLastUpdated(new Date()); })
                        .catch((err: any) => setApiError(err.message ?? 'Failed to reload volunteer summary'))
                        .finally(() => setLoading(false));
                    } catch (err: any) {
                      setAssignError(err.message || 'Assignment failed. Please try again.');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    backgroundColor: (assigning || selectedVolunteerIds.length === 0 || selectedTaskTitles.length === 0) ? '#D1D5DB' : '#5C6ED5',
                    border: 'none', color: 'white', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
                    cursor: (assigning || selectedVolunteerIds.length === 0 || selectedTaskTitles.length === 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
            <style>{`
              @keyframes smSlideUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
              }
              @keyframes smFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            {/* In-portal success overlay */}
            {successMessage && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17,24,39,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)' }}
                onClick={() => { setSuccessMessage(null); setSelectedTeamModal(null); }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px 36px', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'smFadeIn 0.2s ease-out' }}
                  onClick={(e) => e.stopPropagation()}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Check size={32} color="#10B981" strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', margin: '0 0 8px 0' }}>Assignment Successful</h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 28px 0', lineHeight: 1.6, whiteSpace: 'pre-line', textAlign: 'left' }}>{successMessage}</p>
                  <button
                    onClick={() => { setSuccessMessage(null); setSelectedTeamModal(null); }}
                    style={{ padding: '0.65rem 2rem', backgroundColor: '#5C6ED5', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3E5A99'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#5C6ED5'; }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

        {isMounted && selectedVolunteerDetail && createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(17,24,39,0.55)',
              zIndex: 100001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              WebkitBackdropFilter: 'blur(3px)',
              backdropFilter: 'blur(3px)',
            }}
            onClick={() => setSelectedVolunteerDetail(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '560px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                border: '1px solid rgba(229,229,229,0.8)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#5C6ED5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Volunteer Details
                  </div>
                  <h3 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#111827' }}>{selectedVolunteerDetail.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedVolunteerDetail(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#737373', padding: '6px', borderRadius: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Applied Role</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{selectedVolunteerDetail.team}</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>Applied From</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{selectedVolunteerDetail.location}</div>
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Volunteer Description</div>
                  <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-line' }}>
                    {selectedVolunteerDetail.description}
                  </div>
                </div>

                {(selectedVolunteerDetail.currentTasks as string[])?.length > 0 && (
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>Current Tasks</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(selectedVolunteerDetail.currentTasks as string[]).map((task: string) => (
                        <span key={task} style={{ padding: '6px 10px', borderRadius: '999px', backgroundColor: 'rgba(92,110,213,0.1)', color: '#3E5A99', fontSize: '12px', fontWeight: 600 }}>
                          {task}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Add animation keyframes */}
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
}
