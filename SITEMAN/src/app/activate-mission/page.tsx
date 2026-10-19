"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  Database,
  HeartHandshake,
  MapPin,
  PackageOpen,
  Play,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { CampaignsAPI, MissionsAPI } from '@/lib/api';

type SourceType = 'evacuation_center' | 'relief_operation';

type DamayanSource = {
  id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  capacity?: number | null;
  current_occupancy?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  created_at?: string | null;
  source_type: SourceType;
  mission_type: 'volunteer' | 'donation';
  activated_campaign_id?: string | null;
  activated_status?: string | null;
};

const cardStyle: CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
};

function formatDate(value?: string | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function sourceLocation(source: DamayanSource) {
  return [source.address, source.barangay, source.municipality].filter(Boolean).join(', ') || 'Location not set';
}

export default function ActivateMissionPage() {
  const [sources, setSources] = useState<{ relief_operations: DamayanSource[]; evacuation_centers: DamayanSource[] }>({
    relief_operations: [],
    evacuation_centers: [],
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<SourceType>('evacuation_center');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(12);
  const [missionNotes, setMissionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [sourceData, campaignData, summary] = await Promise.all([
        CampaignsAPI.damayanSources(),
        CampaignsAPI.list({ status: 'active' }),
        MissionsAPI.volunteerSummary().catch(() => null),
      ]);
      setSources({
        relief_operations: sourceData.relief_operations ?? [],
        evacuation_centers: sourceData.evacuation_centers ?? [],
      });
      setCampaigns(campaignData ?? []);
      setSummaryData(summary);
      setMessage(null);
    } catch (err: any) {
      setMessage({ success: false, text: err.message ?? 'Unable to load DAMAYAN sources.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sourceList = selectedType === 'evacuation_center' ? sources.evacuation_centers : sources.relief_operations;
  const selectedSource = useMemo(
    () => sourceList.find((source) => source.id === selectedSourceId) ?? sourceList[0] ?? null,
    [sourceList, selectedSourceId],
  );

  useEffect(() => {
    setSelectedSourceId(sourceList[0]?.id ?? '');
  }, [selectedType, sources]);

  const activeVolunteerMissions = campaigns.filter((campaign) => campaign.type === 'volunteer').length;
  const activeDonationMissions = campaigns.filter((campaign) => campaign.type === 'donation').length;
  const occupied = Number(selectedSource?.current_occupancy ?? 0);
  const capacity = Number(selectedSource?.capacity ?? 0);
  const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

  const handleActivate = async () => {
    if (!selectedSource) {
      setMessage({ success: false, text: 'Select a DAMAYAN source before activating a mission.' });
      return;
    }

    setActivating(true);
    setMessage(null);
    try {
      const result = await CampaignsAPI.activateDamayan({
        source_type: selectedSource.source_type,
        source_id: selectedSource.id,
        mission_type: selectedSource.mission_type,
        notes: missionNotes.trim() || undefined,
        volunteers_needed: volunteersNeeded,
      });
      setMessage({ success: true, text: result.message ?? 'Mission activated.' });
      await loadData();
    } catch (err: any) {
      setMessage({ success: false, text: err.message ?? 'Failed to activate mission.' });
    } finally {
      setActivating(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        <section style={{
          position: 'relative',
          width: '100%',
          height: '360px',
          borderRadius: '20px',
          overflow: 'hidden',
          marginTop: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}>
          <Image
            src="/images/mission_pic.jpg"
            alt="Mission Background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.58) 50%, rgba(0,0,0,0.32) 100%)',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white',
            padding: '0 24px',
          }}>
            <h1 style={{
              fontSize: '56px',
              fontWeight: 700,
              margin: '0 0 16px',
              lineHeight: 1.2,
              textShadow: '0 4px 8px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em',
            }}>
              Activate Your Mission Now
            </h1>

            <p style={{
              fontSize: '18px',
              lineHeight: 1.6,
              margin: '0 0 32px',
              opacity: 0.95,
              maxWidth: '840px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              Turn verified field intelligence into coordinated missions for volunteers, donors, and on-site responders.
            </p>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={loadData}
                disabled={refreshing}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '50px',
                  padding: '14px 40px',
                  fontSize: '18px',
                  fontWeight: 500,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s',
                  opacity: refreshing ? 0.75 : 1,
                }}
              >
                {refreshing ? 'Refreshing' : 'Refresh Sources'}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
          {[
            { label: 'DAMAYAN Evacuation Centers', value: sources.evacuation_centers.length, icon: Building2 },
            { label: 'DAMAYAN Relief Operations', value: sources.relief_operations.length, icon: PackageOpen },
            { label: 'Volunteer Missions Active', value: activeVolunteerMissions, icon: Users },
            { label: 'Donation Missions Active', value: activeDonationMissions, icon: HeartHandshake },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{ ...cardStyle, padding: '18px' }}>
                <Icon size={20} color="#5C6ED5" />
                <div style={{ marginTop: '10px', fontSize: '28px', fontWeight: 700, color: '#111827' }}>{loading ? '-' : item.value}</div>
                <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>{item.label}</div>
              </div>
            );
          })}
        </section>

        {message && (
          <div style={{
            padding: '14px 16px',
            borderRadius: '10px',
            border: `1px solid ${message.success ? '#10B981' : '#EF4444'}`,
            backgroundColor: message.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: message.success ? '#0B7B4A' : '#B91C1C',
            fontWeight: 600,
          }}>
            {message.text}
          </div>
        )}

        <section style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: '22px' }}>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #E5E7EB' }}>
              {[
                { type: 'evacuation_center' as const, label: 'Volunteer Missions', icon: Building2 },
                { type: 'relief_operation' as const, label: 'Donation Missions', icon: PackageOpen },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = selectedType === tab.type;
                return (
                  <button
                    key={tab.type}
                    onClick={() => setSelectedType(tab.type)}
                    style={{
                      border: 'none',
                      backgroundColor: active ? 'rgba(92,110,213,0.08)' : 'white',
                      color: active ? '#5C6ED5' : '#374151',
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '650px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ color: '#6B7280', padding: '28px', textAlign: 'center' }}>Loading DAMAYAN records...</div>
              ) : sourceList.length === 0 ? (
                <div style={{ color: '#6B7280', padding: '28px', textAlign: 'center' }}>No DAMAYAN records available for this source.</div>
              ) : sourceList.map((source) => {
                const selected = selectedSource?.id === source.id;
                const activated = Boolean(source.activated_campaign_id);
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    style={{
                      textAlign: 'left',
                      border: selected ? '2px solid #5C6ED5' : '1px solid #E5E7EB',
                      backgroundColor: selected ? 'rgba(92,110,213,0.05)' : '#F9FAFB',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ color: '#111827', fontSize: '15px', fontWeight: 700 }}>{source.name}</div>
                        <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px' }}>
                          {source.source_type === 'evacuation_center' ? sourceLocation(source) : source.description || 'No description'}
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: activated ? '#0B7B4A' : '#92400E',
                        backgroundColor: activated ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.14)',
                        whiteSpace: 'nowrap',
                      }}>
                        {activated ? <Check size={12} /> : <Clock size={12} />}
                        {activated ? 'Activated' : 'Ready'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ ...cardStyle, padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#5C6ED5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {selectedSource?.source_type === 'evacuation_center' ? 'Evacuation Center' : 'Relief Operation'}
                  </div>
                  <h2 style={{ margin: '8px 0 6px', color: '#111827', fontSize: '24px' }}>{selectedSource?.name ?? 'Select a DAMAYAN record'}</h2>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '14px', lineHeight: 1.6 }}>
                    {selectedSource?.source_type === 'evacuation_center'
                      ? sourceLocation(selectedSource)
                      : selectedSource?.description ?? 'No description provided by DAMAYAN.'}
                  </p>
                </div>
                <span style={{
                  padding: '6px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(92,110,213,0.08)',
                  color: '#5C6ED5',
                  fontWeight: 700,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}>
                  {selectedSource?.status ?? 'unknown'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <CalendarDays size={16} color="#6B7280" />
                  <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '6px' }}>Start</div>
                  <strong style={{ color: '#111827', fontSize: '13px' }}>{formatDate(selectedSource?.start_date ?? selectedSource?.created_at)}</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <CalendarDays size={16} color="#6B7280" />
                  <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '6px' }}>End</div>
                  <strong style={{ color: '#111827', fontSize: '13px' }}>{formatDate(selectedSource?.end_date)}</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <MapPin size={16} color="#6B7280" />
                  <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '6px' }}>Barangay</div>
                  <strong style={{ color: '#111827', fontSize: '13px' }}>{selectedSource?.barangay ?? 'Not applicable'}</strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                  <Users size={16} color="#6B7280" />
                  <div style={{ color: '#6B7280', fontSize: '12px', marginTop: '6px' }}>Capacity</div>
                  <strong style={{ color: '#111827', fontSize: '13px' }}>
                    {selectedSource?.source_type === 'evacuation_center'
                      ? `${selectedSource.current_occupancy ?? 0}/${selectedSource.capacity ?? 0}`
                      : 'Donation operation'}
                  </strong>
                </div>
              </div>

              {selectedSource?.source_type === 'evacuation_center' && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B7280', fontSize: '12px', marginBottom: '6px' }}>
                    <span>Occupancy</span>
                    <span>{occupancyPercent}%</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${occupancyPercent}%`, backgroundColor: '#5C6ED5' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, padding: '22px' }}>
              <h3 style={{ margin: '0 0 14px', color: '#111827', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={18} color="#5C6ED5" />
                Activate for ENDUSER
              </h3>
              <p style={{ margin: '0 0 18px', color: '#6B7280', fontSize: '14px', lineHeight: 1.6 }}>
                {selectedSource?.mission_type === 'volunteer'
                  ? 'Creates an active volunteer mission and opens Medic, Logistics, and Field roles for applications.'
                  : 'Creates an active donation mission that donors can choose on the pledge form.'}
              </p>

              {selectedSource?.mission_type === 'volunteer' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', color: '#374151', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                    Volunteers Needed
                    <span>{volunteersNeeded}</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="60"
                    value={volunteersNeeded}
                    onChange={(event) => setVolunteersNeeded(Number(event.target.value))}
                    style={{ width: '100%', accentColor: '#5C6ED5' }}
                  />
                </div>
              )}

              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
                SITEMAN Notes
              </label>
              <textarea
                value={missionNotes}
                onChange={(event) => setMissionNotes(event.target.value)}
                rows={4}
                placeholder="Add operational instructions, drop-off reminders, or volunteer briefing notes..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                  color: '#111827',
                  resize: 'vertical',
                  outline: 'none',
                  backgroundColor: '#F9FAFB',
                  fontFamily: 'inherit',
                  marginBottom: '16px',
                }}
              />

              <button
                onClick={handleActivate}
                disabled={activating || !selectedSource}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: activating ? '#9CA3AF' : '#5C6ED5',
                  color: 'white',
                  fontWeight: 700,
                  cursor: activating ? 'not-allowed' : 'pointer',
                }}
              >
                <Play size={18} />
                {activating ? 'Activating...' : selectedSource?.activated_campaign_id ? 'Sync Activated Mission' : 'Activate Mission'}
              </button>
            </div>

          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
