"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "../applications/page.module.css";

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

type MissionListItem = {
  applicationId: string;
  submittedAt: string | null;
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
  } | null;
  shift: {
    id: string;
    status: string;
    clockIn: string | null;
    clockOut: string | null;
    totalHours: number;
    reviewNote: string | null;
  } | null;
};

type Tab = "ALL" | "READY" | "ACTIVE" | "COMPLETED";

const stateLabel: Record<MissionState, string> = {
  NO_APPROVED_APPLICATION: "No Approved Application",
  APPROVED_WAITING_ASSIGNMENT: "Waiting Assignment",
  ASSIGNED: "Assigned",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  TASK_COMPLETED: "Task Completed",
  CLOCK_OUT_REQUESTED: "Clock-Out Review",
  CLOCK_OUT_DENIED: "Clock-Out Flagged",
  COMPLETED: "Completed",
};

function groupFromState(state: MissionState): Tab {
  if (state === "COMPLETED") return "COMPLETED";
  if (["ASSIGNED", "CHECKED_IN", "APPROVED_WAITING_ASSIGNMENT"].includes(state)) return "READY";
  if (["IN_PROGRESS", "TASK_COMPLETED", "CLOCK_OUT_REQUESTED", "CLOCK_OUT_DENIED"].includes(state)) return "ACTIVE";
  return "ALL";
}

function fmtDate(iso?: string | null) {
  if (!iso) return "No schedule yet";
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const IconHelp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function MissionPage() {
  const router = useRouter();
  const { token, isReady } = useAuth();
  const [missions, setMissions] = useState<MissionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
  }, [isReady, router, token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/forms/my-missions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.message ?? "Unable to load missions.");
        if (!cancelled) {
          setMissions(Array.isArray(payload?.data) ? payload.data : []);
        }
      } catch {
        if (!cancelled) setMissions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const counts = useMemo(() => ({
    ALL: missions.length,
    READY: missions.filter((mission) => groupFromState(mission.state) === "READY").length,
    ACTIVE: missions.filter((mission) => groupFromState(mission.state) === "ACTIVE").length,
    COMPLETED: missions.filter((mission) => groupFromState(mission.state) === "COMPLETED").length,
  }), [missions]);

  const visible = useMemo(() => {
    return missions.filter((mission) => {
      const group = groupFromState(mission.state);
      const matchesTab = tab === "ALL" || group === tab;
      const needle = search.trim().toLowerCase();
      const haystack = [
        mission.mission?.campaignTitle,
        mission.mission?.roleTitle,
        mission.mission?.site,
        mission.applicationId,
        stateLabel[mission.state],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesTab && (!needle || haystack.includes(needle));
    });
  }, [missions, search, tab]);

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
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Missions</h1>
          <p className={styles.pageSub}>Open each approved volunteer assignment in its own mission workspace.</p>
        </div>

        <div className={styles.filterCard}>
          <div className={styles.searchWrap}>
            <div className={styles.searchInputContainer}>
              <span className={styles.searchIcon}><IconSearch /></span>
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by mission, role, site, or application id..."
              />
            </div>
          </div>

          <div className={styles.tabs}>
            {(["ALL", "READY", "ACTIVE", "COMPLETED"] as Tab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`${styles.tab} ${tab === item ? styles.tabActive : ""}`}>
                {item === "ALL" ? "All" : item.charAt(0) + item.slice(1).toLowerCase()}
                <span className={`${styles.tabCount} ${tab === item ? styles.tabCountActive : ""}`}>{counts[item]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.listCard}>
          {loading ? (
            <>
              {[1, 2, 3].map((index) => (
                <div key={index} className={styles.skeletonRow}>
                  <div className={styles.skBlock} style={{ width: 10, height: 10, borderRadius: "50%" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.skBlock} style={{ height: 14, width: "60%" }} />
                    <div className={styles.skBlock} style={{ height: 11, width: "35%" }} />
                  </div>
                  <div className={styles.skBlock} style={{ height: 22, width: 72, borderRadius: 999 }} />
                </div>
              ))}
            </>
          ) : visible.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <p className={styles.emptyTitle}>No mission entries found</p>
              <p className={styles.emptySub}>Approved volunteer applications will appear here once they are available for mission tracking.</p>
              <Link href="/applications" className={styles.applyBtn}>View Applications</Link>
            </div>
          ) : visible.map((missionEntry) => {
            const status = stateLabel[missionEntry.state];
            const title = missionEntry.mission?.campaignTitle ?? "Awaiting SITEMAN assignment";
            const subtitle = missionEntry.mission
              ? `${missionEntry.mission.roleTitle} • ${missionEntry.mission.site || "Mission site pending"}`
              : `Application ${missionEntry.applicationId.slice(0, 8).toUpperCase()}`;

            return (
              <div
                key={missionEntry.applicationId}
                className={styles.appRow}
                onClick={() => router.push(`/mission/${missionEntry.applicationId}`)}
              >
                <span className={styles.statusDot} style={{ backgroundColor: missionEntry.state === "COMPLETED" ? "#16a34a" : missionEntry.state === "APPROVED_WAITING_ASSIGNMENT" ? "#f59e0b" : "#2563eb" }} />
                <div className={styles.rowInfo}>
                  <p className={styles.rowTitle}>{title}</p>
                  <div className={styles.rowMeta}>
                    <span className={styles.rowRef}>{subtitle}</span>
                    <span className={styles.rowDate}>· {fmtDate(missionEntry.mission?.assignedAt ?? missionEntry.submittedAt)}</span>
                  </div>
                </div>
                <span className={styles.statusPill} style={{
                  backgroundColor: missionEntry.state === "COMPLETED" ? "rgba(22,163,74,0.12)" : missionEntry.state === "APPROVED_WAITING_ASSIGNMENT" ? "rgba(245,158,11,0.14)" : "rgba(37,99,235,0.12)",
                  color: missionEntry.state === "COMPLETED" ? "#15803d" : missionEntry.state === "APPROVED_WAITING_ASSIGNMENT" ? "#b45309" : "#1d4ed8",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  {status}
                </span>
                <span className={styles.chevron}><IconChevronRight /></span>
              </div>
            );
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© 2024 Application Portal. All rights reserved.</span>
        <div className={styles.footerLinks}>
          <a href="#">Support</a><a href="#">Terms of Service</a><a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
