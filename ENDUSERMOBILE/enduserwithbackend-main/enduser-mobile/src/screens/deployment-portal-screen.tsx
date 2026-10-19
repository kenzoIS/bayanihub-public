import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/src/providers/auth-provider';
import { API_BASE } from '@/src/lib/api';

type MissionState =
  | 'NO_APPROVED_APPLICATION'
  | 'APPROVED_WAITING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'TASK_COMPLETED'
  | 'CLOCK_OUT_REQUESTED'
  | 'CLOCK_OUT_DENIED'
  | 'COMPLETED';

type MissionPayload = {
  state: MissionState;
  mission: {
    deploymentId: string;
    applicationId: string;
    campaignId: string | null;
    campaignTitle: string;
    campaignStatus: string;
    roleTitle: string;
    taskDescription: string;
    taskStatus: 'assigned' | 'in_progress' | 'completed';
    deploymentStatus: string;
    assignedAt: string | null;
    site: string;
    zone: {
      name: string;
      barangay: string;
      municipality: string;
      capacity: number;
      currentOccupancy: number;
      occupancyPercent: number | null;
      status: string;
    } | null;
  } | null;
  shift: {
    id: string;
    status: string;
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number;
    reviewNote: string | null;
  } | null;
  reliability: {
    score: number;
    label: string;
    metrics: {
      completedTasks: number;
      approvedShifts: number;
      approvedHours: number;
      rejectedClockOuts: number;
      noShows: number;
      efficiencyBonus: number;
    };
  };
  postShiftSummary: {
    totalHours: number;
    approvedAt: string | null;
    completedTaskCount: number;
    score: number;
  } | null;
};

const NAVY = '#1E3A8A';
const BLUE = '#2563EB';
const BG = '#F8FAFC';

const stateCopy: Record<MissionState, { title: string; message: string; accent: string }> = {
  NO_APPROVED_APPLICATION: {
    title: 'No active mission yet',
    message: 'This application is not yet eligible for mission access.',
    accent: '#64748B',
  },
  APPROVED_WAITING_ASSIGNMENT: {
    title: 'Approved, waiting for assignment',
    message: 'A site manager still needs to assign this application to a mission.',
    accent: '#D97706',
  },
  ASSIGNED: {
    title: 'Mission assigned',
    message: 'Start the mission when you are ready to begin your assigned work.',
    accent: NAVY,
  },
  CHECKED_IN: {
    title: 'Presence validated',
    message: 'Your check-in is recorded. Start the mission when the team lead gives the go signal.',
    accent: NAVY,
  },
  IN_PROGRESS: {
    title: 'Mission in progress',
    message: 'Keep your mission status updated so SITEMAN can track your progress live.',
    accent: '#4F46E5',
  },
  TASK_COMPLETED: {
    title: 'Task completed',
    message: 'Request clock-out when you are done for this shift.',
    accent: '#16A34A',
  },
  CLOCK_OUT_REQUESTED: {
    title: 'Awaiting site manager approval',
    message: 'Your clock-out request is pending approval from SITEMAN.',
    accent: '#D97706',
  },
  CLOCK_OUT_DENIED: {
    title: 'Clock-out needs review',
    message: 'Your clock-out request was flagged. Coordinate with SITEMAN and try again.',
    accent: '#DC2626',
  },
  COMPLETED: {
    title: 'Shift approved',
    message: 'Your mission hours were approved and added to your volunteer record.',
    accent: '#16A34A',
  },
};

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded';
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTaskStatus(status?: string) {
  if (status === 'in_progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return 'Assigned';
}

export function DeploymentPortalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ applicationId?: string }>();
  const { token, isReady } = useAuth();
  const applicationId = Array.isArray(params.applicationId) ? params.applicationId[0] : params.applicationId;

  const [missionData, setMissionData] = useState<MissionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestMission = useCallback(
    async (path: string, options?: RequestInit) => {
      if (!token) throw new Error('You need to log in again.');

      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Mission request failed.');
      }

      return payload?.data as MissionPayload;
    },
    [token],
  );

  const fetchMission = useCallback(async () => {
    if (!token || !applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await requestMission(`/forms/my-missions/${applicationId}`);
      setMissionData(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load mission.');
    } finally {
      setLoading(false);
    }
  }, [applicationId, requestMission, token]);

  useEffect(() => {
    if (isReady && token && applicationId) {
      fetchMission();
    }
  }, [applicationId, fetchMission, isReady, token]);

  const runAction = async (label: string, callback: () => Promise<MissionPayload>) => {
    setAction(label);
    setError(null);
    try {
      const data = await callback();
      setMissionData(data);
    } catch (err: any) {
      setError(err?.message || 'Action failed.');
    } finally {
      setAction(null);
    }
  };

  const mission = missionData?.mission;
  const shift = missionData?.shift;
  const reliability = missionData?.reliability;
  const meta = missionData ? stateCopy[missionData.state] : stateCopy.NO_APPROVED_APPLICATION;

  const canStart = missionData
    ? ['ASSIGNED', 'CHECKED_IN', 'CLOCK_OUT_DENIED'].includes(missionData.state)
    : false;
  const canMarkInProgress = missionData
    ? ['ASSIGNED', 'CHECKED_IN', 'IN_PROGRESS'].includes(missionData.state)
    : false;
  const canCompleteTask = missionData
    ? ['IN_PROGRESS', 'CHECKED_IN'].includes(missionData.state)
    : false;
  const canRequestClockOut = missionData
    ? ['TASK_COMPLETED', 'CLOCK_OUT_DENIED'].includes(missionData.state)
    : false;

  const capacityLabel = useMemo(() => {
    if (!mission?.zone) return 'Not available';
    if (mission.zone.occupancyPercent === null) return 'Capacity not set';
    return `${mission.zone.currentOccupancy}/${mission.zone.capacity} occupied`;
  }, [mission?.zone]);

  if (!isReady || !token) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mission</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!applicationId ? (
        <View style={styles.centeredContent}>
          <Text style={styles.heroTitle}>Mission unavailable</Text>
          <Text style={styles.heroSub}>This route needs a valid application id.</Text>
        </View>
      ) : loading ? (
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color={NAVY} />
          <Text style={styles.heroSub}>Loading mission details...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { borderLeftColor: meta.accent }]}>
            <Text style={[styles.heroEyebrow, { color: meta.accent }]}>{meta.title}</Text>
            <Text style={styles.heroTitle}>{mission?.campaignTitle || 'Mission status'}</Text>
            <Text style={styles.heroSub}>{meta.message}</Text>
            <Pressable style={styles.refreshBtn} onPress={fetchMission} disabled={!!action}>
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Task Status</Text>
              <Text style={styles.metricValue}>{formatTaskStatus(mission?.taskStatus)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Check-In</Text>
              <Text style={styles.metricValue}>{formatDateTime(shift?.clockIn)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Clock-Out</Text>
              <Text style={styles.metricValue}>{formatDateTime(shift?.clockOut)}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Reliability</Text>
              <Text style={styles.metricValue}>{reliability ? `${reliability.score}/100` : '50/100'}</Text>
            </View>
          </View>

          {mission ? (
            <>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Assignment</Text>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Role</Text>
                  <Text style={styles.detailValue}>{mission.roleTitle}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Assigned Task</Text>
                  <Text style={styles.detailValue}>{mission.taskDescription}</Text>
                </View>
                <View style={styles.detailBlock}>
                  <Text style={styles.detailLabel}>Site or Zone</Text>
                  <Text style={styles.detailValue}>{mission.site || 'Site details will appear once provided by SITEMAN.'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailMiniCard}>
                    <Text style={styles.detailLabel}>Assigned At</Text>
                    <Text style={styles.detailValue}>{formatDateTime(mission.assignedAt)}</Text>
                  </View>
                  <View style={styles.detailMiniCard}>
                    <Text style={styles.detailLabel}>Deployment</Text>
                    <Text style={styles.detailValue}>{mission.deploymentStatus}</Text>
                  </View>
                </View>
                <View style={styles.capacityCard}>
                  <Text style={styles.detailLabel}>Zone Capacity</Text>
                  <Text style={styles.capacityValue}>{capacityLabel}</Text>
                  <View style={styles.capacityTrack}>
                    <View style={[styles.capacityFill, { width: `${mission.zone?.occupancyPercent ?? 0}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Mission Actions</Text>
                <Pressable
                  style={[styles.primaryBtn, (!canStart || !!action) && styles.disabledBtn]}
                  disabled={!canStart || !!action}
                  onPress={() => runAction('start', () => requestMission(`/forms/my-missions/${applicationId}/start`, { method: 'POST' }))}
                >
                  <Text style={styles.primaryBtnText}>{action === 'start' ? 'Starting...' : 'Start Mission'}</Text>
                </Pressable>

                <Pressable
                  style={[styles.secondaryBtn, (!canMarkInProgress || !!action) && styles.disabledBtn]}
                  disabled={!canMarkInProgress || !!action}
                  onPress={() => runAction('progress', () => requestMission(`/forms/my-missions/${applicationId}/task-status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'in_progress' }),
                  }))}
                >
                  <Text style={styles.secondaryBtnText}>Mark In Progress</Text>
                </Pressable>

                <Pressable
                  style={[styles.successBtn, (!canCompleteTask || !!action) && styles.disabledBtn]}
                  disabled={!canCompleteTask || !!action}
                  onPress={() => runAction('complete', () => requestMission(`/forms/my-missions/${applicationId}/task-status`, {
                    method: 'PATCH',
                    body: JSON.stringify({ status: 'completed' }),
                  }))}
                >
                  <Text style={styles.primaryBtnText}>{action === 'complete' ? 'Updating...' : 'Mark Task Completed'}</Text>
                </Pressable>

                <Pressable
                  style={[styles.warningBtn, (!canRequestClockOut || !!action) && styles.disabledBtn]}
                  disabled={!canRequestClockOut || !!action}
                  onPress={() => runAction('clockout', () => requestMission(`/forms/my-missions/${applicationId}/clock-out`, { method: 'POST' }))}
                >
                  <Text style={styles.warningBtnText}>{action === 'clockout' ? 'Sending...' : 'Request Clock-Out'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{meta.title}</Text>
              <Text style={styles.heroSub}>{meta.message}</Text>
            </View>
          )}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Reliability Metrics</Text>
            <View style={styles.reliabilityRow}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreNumber}>{reliability?.score ?? 50}</Text>
                <Text style={styles.scoreDenom}>/100</Text>
              </View>
              <Text style={styles.heroSub}>
                Based on completed tasks, approved hours, flagged clock-outs, and no-show indicators.
              </Text>
            </View>
            <View style={styles.metricList}>
              <Text style={styles.metricLine}>Completed tasks: {reliability?.metrics.completedTasks ?? 0}</Text>
              <Text style={styles.metricLine}>Approved shifts: {reliability?.metrics.approvedShifts ?? 0}</Text>
              <Text style={styles.metricLine}>Approved hours: {reliability?.metrics.approvedHours ?? 0}</Text>
              <Text style={styles.metricLine}>Flagged requests: {reliability?.metrics.rejectedClockOuts ?? 0}</Text>
              <Text style={styles.metricLine}>No-show indicators: {reliability?.metrics.noShows ?? 0}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Post-Shift Summary</Text>
            {missionData?.postShiftSummary ? (
              <View style={styles.metricList}>
                <Text style={styles.metricLine}>Total Hours: {missionData.postShiftSummary.totalHours}</Text>
                <Text style={styles.metricLine}>Approved At: {formatDateTime(missionData.postShiftSummary.approvedAt)}</Text>
                <Text style={styles.metricLine}>Reliability Score: {missionData.postShiftSummary.score}/100</Text>
              </View>
            ) : (
              <Text style={styles.heroSub}>Your post-shift summary appears after your clock-out request is approved.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 24, color: '#0F172A', fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: NAVY },
  headerSpacer: { width: 36 },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  scrollContent: { flex: 1 },
  scrollBody: { padding: 20, gap: 16 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 6,
    padding: 18,
    gap: 6,
  },
  heroEyebrow: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', textAlign: 'left' },
  heroSub: { fontSize: 14, lineHeight: 21, color: '#64748B' },
  refreshBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshBtnText: { color: BLUE, fontWeight: '700', fontSize: 13 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
  },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    minWidth: '47%',
    flexGrow: 1,
  },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 6 },
  metricValue: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  detailBlock: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 6 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 },
  detailRow: { flexDirection: 'row', gap: 10 },
  detailMiniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  capacityCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 14,
  },
  capacityValue: { color: '#166534', fontSize: 14, fontWeight: '700' },
  capacityTrack: {
    height: 10,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  capacityFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 999 },
  primaryBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  secondaryBtnText: { color: NAVY, fontSize: 15, fontWeight: '700' },
  successBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  warningBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningBtnText: { color: '#C2410C', fontSize: 15, fontWeight: '700' },
  disabledBtn: { opacity: 0.45 },
  reliabilityRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  scoreCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#EFF6FF',
    borderWidth: 8,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: { color: BLUE, fontSize: 24, fontWeight: '800' },
  scoreDenom: { color: BLUE, fontSize: 11, fontWeight: '700' },
  metricList: { gap: 8 },
  metricLine: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
