"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "../page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

type MissionState =
  | "NO_APPROVED_APPLICATION"
  | "APPROVED_WAITING_ASSIGNMENT"
  | "ASSIGNED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "TASK_COMPLETED"
  | "CLOCK_OUT_REQUESTED"
  | "CLOCK_OUT_DENIED"
  | "COMPLETED";

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
    taskStatus: "assigned" | "in_progress" | "completed";
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

const stateCopy: Record<MissionState, { title: string; message: string; tone: string }> = {
  NO_APPROVED_APPLICATION: {
    title: "No active mission yet",
    message: "This volunteer application is not yet eligible for mission access.",
    tone: "neutral",
  },
  APPROVED_WAITING_ASSIGNMENT: {
    title: "Approved, waiting for assignment",
    message: "This approved application is ready. A site manager still needs to assign it to a mission.",
    tone: "pending",
  },
  ASSIGNED: {
    title: "Mission assigned",
    message: "Have your QR validated on-site, then start the mission when you are ready to work.",
    tone: "ready",
  },
  CHECKED_IN: {
    title: "Presence validated",
    message: "Your on-site check-in is recorded. Start the mission when your team lead gives the go signal.",
    tone: "ready",
  },
  IN_PROGRESS: {
    title: "Mission in progress",
    message: "Keep your task status updated so the site manager has a live view of your assignment.",
    tone: "active",
  },
  TASK_COMPLETED: {
    title: "Task completed",
    message: "Your task is marked complete. Request clock-out when you are done for this shift.",
    tone: "success",
  },
  CLOCK_OUT_REQUESTED: {
    title: "Awaiting site manager approval",
    message: "Your clock-out request was sent. You are not fully clocked out until the site manager approves it.",
    tone: "pending",
  },
  CLOCK_OUT_DENIED: {
    title: "Clock-out needs review",
    message: "The site manager flagged your request. Please coordinate on-site, then request clock-out again.",
    tone: "warning",
  },
  COMPLETED: {
    title: "Shift approved",
    message: "Your hours were approved and added to your volunteer record.",
    tone: "success",
  },
};

const flowSteps = [
  "Assigned",
  "Checked In",
  "In Progress",
  "Task Completed",
  "Clock-Out Review",
  "Summary",
];

function stateStep(state: MissionState) {
  if (state === "COMPLETED") return 5;
  if (state === "CLOCK_OUT_REQUESTED" || state === "CLOCK_OUT_DENIED") return 4;
  if (state === "TASK_COMPLETED") return 3;
  if (state === "IN_PROGRESS") return 2;
  if (state === "CHECKED_IN") return 1;
  if (state === "ASSIGNED") return 0;
  return -1;
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTaskStatus(status?: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  return "Assigned";
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function MissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params?.id as string;
  const { token, isReady, user } = useAuth();
  const [missionData, setMissionData] = useState<MissionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
  }, [isReady, router, token]);

  const requestMission = useCallback(
    async (path: string, options?: RequestInit) => {
      if (!token) throw new Error("You need to log in again.");
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Mission request failed.");
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load mission.");
    } finally {
      setLoading(false);
    }
  }, [applicationId, requestMission, token]);

  useEffect(() => {
    if (isReady && token && applicationId) fetchMission();
  }, [applicationId, fetchMission, isReady, token]);

  const runAction = async (label: string, callback: () => Promise<MissionPayload>) => {
    setAction(label);
    setError(null);
    try {
      const data = await callback();
      setMissionData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setAction(null);
    }
  };

  const meta = missionData ? stateCopy[missionData.state] : stateCopy.NO_APPROVED_APPLICATION;
  const activeStep = missionData ? stateStep(missionData.state) : -1;
  const mission = missionData?.mission;
  const shift = missionData?.shift;
  const reliability = missionData?.reliability;

  const canStart = missionData
    ? ["ASSIGNED", "CHECKED_IN", "CLOCK_OUT_DENIED"].includes(missionData.state)
    : false;
  const canMarkInProgress = missionData
    ? ["ASSIGNED", "CHECKED_IN", "IN_PROGRESS"].includes(missionData.state)
    : false;
  const canCompleteTask = missionData
    ? ["IN_PROGRESS", "CHECKED_IN"].includes(missionData.state)
    : false;
  const canRequestClockOut = missionData
    ? ["TASK_COMPLETED", "CLOCK_OUT_DENIED"].includes(missionData.state)
    : false;

  const capacityLabel = useMemo(() => {
    if (!mission?.zone) return "Not available";
    if (mission.zone.occupancyPercent === null) return "Capacity not set";
    return `${mission.zone.currentOccupancy}/${mission.zone.capacity} occupied`;
  }, [mission?.zone]);

  if (!isReady || !token) return null;

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <Link href="/dashboard" className={styles.logoContainer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_b.png" alt="BayaniHub logo" className={styles.logo} />
            <span className={styles.brand}>BayaniHub</span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>Home</Link>
            <Link href="/about" className={styles.navLink}>About Us</Link>
            <Link href="/applications" className={styles.navLink}>Applications</Link>
            <Link href="/mission" className={`${styles.navLink} ${styles.activeLink}`}>Mission</Link>
          </div>
        </div>
        <div className={styles.navRight}>
          <button className={styles.iconBtn} aria-label="Help"><IconHelp /></button>
          <button className={styles.iconBtn} aria-label="Notifications"><IconBell /><span className={styles.badge} /></button>
          <button className={styles.iconBtn} aria-label="Account"><IconUser /></button>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.pageHeader}>
          <div>
            <p className={styles.kicker}>Volunteer Operations</p>
            <h1 className={styles.pageTitle}>Mission Workspace</h1>
            <p className={styles.pageSub}>
              This view is scoped to one approved volunteer application so each mission can be tracked independently.
            </p>
          </div>
          <div className={styles.profileChip}>
            <span>{user?.profile?.first_name ?? "Volunteer"}</span>
            <small>{reliability ? `${reliability.score}/100 reliability` : "Mission ready"}</small>
          </div>
        </section>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <Link href="/mission" className={styles.secondaryBtn}>Back to Mission List</Link>
          <Link href={`/applications/${applicationId}`} className={styles.secondaryBtn}>View Application</Link>
        </div>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        {loading ? (
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <span>Loading mission details...</span>
          </div>
        ) : (
          <>
            <section className={`${styles.statusHero} ${styles[meta.tone]}`}>
              <div>
                <span className={styles.statusLabel}>{meta.title}</span>
                <h2>{mission?.campaignTitle ?? "Mission status"}</h2>
                <p>{meta.message}</p>
              </div>
              <button className={styles.secondaryBtn} onClick={fetchMission} disabled={!!action}>
                Refresh
              </button>
            </section>

            <section className={styles.stepper}>
              {flowSteps.map((step, index) => (
                <div
                  key={step}
                  className={`${styles.stepItem} ${index <= activeStep ? styles.stepDone : ""} ${index === activeStep ? styles.stepActive : ""}`}
                >
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </section>

            <section className={styles.metricGrid}>
              <div className={styles.metricCard}>
                <span>Task Status</span>
                <strong>{formatTaskStatus(mission?.taskStatus)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Check-In Time</span>
                <strong>{formatDateTime(shift?.clockIn)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Clock-Out</span>
                <strong>{formatDateTime(shift?.clockOut)}</strong>
              </div>
              <div className={styles.metricCard}>
                <span>Reliability</span>
                <strong>{reliability ? `${reliability.score}/100` : "50/100"}</strong>
              </div>
            </section>

            {mission ? (
              <section className={styles.contentGrid}>
                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <span>Assignment</span>
                    <strong>{mission.roleTitle}</strong>
                  </div>
                  <div className={styles.taskBox}>
                    <span>Assigned Task</span>
                    <p>{mission.taskDescription}</p>
                  </div>

                  <div className={styles.detailList}>
                    <div>
                      <span>Site or Zone</span>
                      <p>{mission.site || "Site details will appear once provided by SITEMAN."}</p>
                    </div>
                    <div>
                      <span>Assigned At</span>
                      <p>{formatDateTime(mission.assignedAt)}</p>
                    </div>
                    <div>
                      <span>Deployment Status</span>
                      <p>{mission.deploymentStatus}</p>
                    </div>
                  </div>

                  <div className={styles.capacityCard}>
                    <div>
                      <span>Zone Capacity</span>
                      <strong>{capacityLabel}</strong>
                    </div>
                    <div className={styles.capacityTrack}>
                      <div style={{ width: `${mission.zone?.occupancyPercent ?? 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className={styles.panel}>
                  <div className={styles.panelHeader}>
                    <span>Actions</span>
                    <strong>{stateCopy[missionData!.state].title}</strong>
                  </div>

                  <div className={styles.actionStack}>
                    <button
                      className={styles.primaryBtn}
                      disabled={!canStart || !!action}
                      onClick={() => runAction("start", () => requestMission(`/forms/my-missions/${applicationId}/start`, { method: "POST" }))}
                    >
                      {action === "start" ? "Starting..." : "Start Mission"}
                    </button>

                    <button
                      className={styles.secondaryBtn}
                      disabled={!canMarkInProgress || !!action}
                      onClick={() => runAction("progress", () => requestMission(`/forms/my-missions/${applicationId}/task-status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "in_progress" }),
                      }))}
                    >
                      Mark In Progress
                    </button>

                    <button
                      className={styles.successBtn}
                      disabled={!canCompleteTask || !!action}
                      onClick={() => runAction("complete", () => requestMission(`/forms/my-missions/${applicationId}/task-status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "completed" }),
                      }))}
                    >
                      {action === "complete" ? "Updating..." : "Mark Task Completed"}
                    </button>

                    <button
                      className={styles.warningBtn}
                      disabled={!canRequestClockOut || !!action}
                      onClick={() => runAction("clockout", () => requestMission(`/forms/my-missions/${applicationId}/clock-out`, { method: "POST" }))}
                    >
                      {action === "clockout" ? "Sending..." : "Request Clock-Out"}
                    </button>
                  </div>

                  <div className={styles.helpBox}>
                    <strong>Clock-out review</strong>
                    <p>
                      Requesting clock-out sends your hours to SITEMAN for review. If it is flagged, your shift stays open and you can request again after coordination.
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <section className={styles.emptyState}>
                <h2>{meta.title}</h2>
                <p>{meta.message}</p>
                <Link href="/applications" className={styles.primaryLink}>View Applications</Link>
              </section>
            )}

            <section className={styles.summaryGrid}>
              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span>Reliability Metrics</span>
                  <strong>{reliability?.label ?? "Developing"}</strong>
                </div>
                <div className={styles.reliabilityScore}>
                  <div>
                    <strong>{reliability?.score ?? 50}</strong>
                    <span>/100</span>
                  </div>
                  <p>Based on completed tasks, approved hours, flagged clock-outs, and no-show indicators.</p>
                </div>
                <div className={styles.metricRows}>
                  <span>Completed tasks <strong>{reliability?.metrics.completedTasks ?? 0}</strong></span>
                  <span>Approved shifts <strong>{reliability?.metrics.approvedShifts ?? 0}</strong></span>
                  <span>Approved hours <strong>{reliability?.metrics.approvedHours ?? 0}</strong></span>
                  <span>Flagged requests <strong>{reliability?.metrics.rejectedClockOuts ?? 0}</strong></span>
                  <span>No-show indicators <strong>{reliability?.metrics.noShows ?? 0}</strong></span>
                </div>
              </div>

              <div className={styles.panel}>
                <div className={styles.panelHeader}>
                  <span>Post-Shift Summary</span>
                  <strong>{missionData?.postShiftSummary ? "Available" : "Pending"}</strong>
                </div>
                {missionData?.postShiftSummary ? (
                  <div className={styles.postSummary}>
                    <p>Your shift has been approved by SITEMAN.</p>
                    <div>
                      <span>Total Hours</span>
                      <strong>{missionData.postShiftSummary.totalHours}</strong>
                    </div>
                    <div>
                      <span>Approved At</span>
                      <strong>{formatDateTime(missionData.postShiftSummary.approvedAt)}</strong>
                    </div>
                    <div>
                      <span>Reliability Score</span>
                      <strong>{missionData.postShiftSummary.score}/100</strong>
                    </div>
                  </div>
                ) : (
                  <p className={styles.mutedText}>
                    Your post-shift summary appears after your clock-out request is approved.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
