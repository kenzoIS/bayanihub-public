"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./page.module.css";

// ─── Types ───────────────────────────────────────────────────────────────────
type AppStatus = "APPROVED" | "PENDING" | "REJECTED";
type Application = {
  refId: string; applicantId: string; applicantName: string;
  applicationType: string; submittedAt: string; status: AppStatus;
  rejectionReason?: string; updatedAt: string; qrToken?: string;
};
type Tab = "ALL" | AppStatus;

// Removed hardcoded mock data
// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCopy = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
const IconHelp = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const IconBell = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const IconUser = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>);
const IconChevronRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>);
const IconChevronDown = ({ open }: { open: boolean }) => (<svg className={`${styles.chevronIcon} ${open ? styles.chevronOpen : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>);
const IconX = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IconDownload = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>);
const IconRefresh = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>);
const IconCheck = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);

function fmt(iso: string) { return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }); }


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const itemsPerPage = 5;

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      if (token) {
        const res = await fetch("http://localhost:3001/api/v1/forms/my-applications", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const d = await res.json(); if (d?.data) { setApps(d.data); setLoading(false); return; } }
      } else {
        setApps([]);
      }
    } catch { setApps([]); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  useEffect(() => { setCurrentPage(1); }, [tab, search, typeFilter]);

  const handleRowClick = (app: Application) => {
    router.push(`/applications/${app.refId}`);
  };
  const handleCopy = (refId: string, e: React.MouseEvent) => { e.stopPropagation(); navigator.clipboard.writeText(refId).catch(() => {}); setCopied(refId); setTimeout(() => setCopied(null), 1500); };

  const filteredByType = apps.filter(a => {
    if (typeFilter === "ALL") return true;
    if (typeFilter === "VOLUNTEER") return a.applicationType.toLowerCase().includes("volunteer");
    if (typeFilter === "DONATION") return a.applicationType.toLowerCase().includes("donation");
    return true;
  });

  const counts = { ALL: filteredByType.length, APPROVED: filteredByType.filter(a => a.status === "APPROVED").length, PENDING: filteredByType.filter(a => a.status === "PENDING").length, REJECTED: filteredByType.filter(a => a.status === "REJECTED").length };
  const visible = filteredByType.filter(a => {
    const matchTab = tab === "ALL" || a.status === tab;
    const q = search.toLowerCase();
    return matchTab && (!q || a.refId.toLowerCase().includes(q) || a.applicationType.toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(visible.length / itemsPerPage));
  const currentVisible = visible.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const userName = user?.profile?.first_name ? `${user.profile.first_name} ${user.profile.last_name}` : "Applicant";

  const dotClass: Record<AppStatus, string> = { APPROVED: styles.dotApproved, PENDING: styles.dotPending, REJECTED: styles.dotRejected };
  const pillClass: Record<AppStatus, string> = { APPROVED: styles.pillApproved, PENDING: styles.pillPending, REJECTED: styles.pillRejected };

  return (
    <div className={styles.container}>
      {/* Navbar */}
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
            <Link href="/applications" className={`${styles.navLink} ${styles.activeLink}`}>Applications</Link>
            <Link href="/mission" className={styles.navLink}>Mission</Link>
          </div>
        </div>
        <div className={styles.navRight}>
          <button className={styles.iconBtn} aria-label="Help"><IconHelp /></button>
          <button className={styles.iconBtn} aria-label="Notifications"><IconBell /><span className={styles.badge} /></button>
          <button className={styles.iconBtn} aria-label="Account"><IconUser /></button>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Applications</h1>
          <p className={styles.pageSub}>Track the status of your submitted applications.</p>
        </div>

        {/* Search + Tabs */}
        <div className={styles.filterCard}>
          <div className={styles.searchWrap}>
            <div className={styles.searchInputContainer}>
              <span className={styles.searchIcon}><IconSearch /></span>
              <input className={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by reference number or type…" />
            </div>
            <select className={styles.typeSelect} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="ALL">All Types</option>
              <option value="VOLUNTEER">Volunteer</option>
              <option value="DONATION">Donation</option>
            </select>
          </div>
          <div className={styles.tabs}>
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}>
                {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
                <span className={`${styles.tabCount} ${tab === t ? styles.tabCountActive : ""}`}>{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Application List */}
        <div className={styles.listCard}>
          {loading ? (
            <>
              {[1, 2, 3].map(i => (
                <div key={i} className={styles.skeletonRow}>
                  <div className={styles.skBlock} style={{ width: 10, height: 10, borderRadius: "50%" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className={styles.skBlock} style={{ height: 14, width: "60%" }} />
                    <div className={styles.skBlock} style={{ height: 11, width: "35%" }} />
                  </div>
                  <div className={styles.skBlock} style={{ height: 22, width: 72, borderRadius: 999 }} />
                </div>
              ))}
            </>
          ) : currentVisible.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              <p className={styles.emptyTitle}>No applications found</p>
              <p className={styles.emptySub}>You have no submitted applications yet.</p>
              <a href="/volunteer" className={styles.applyBtn}>Apply Now</a>
            </div>
          ) : currentVisible.map((app) => (
            <div key={app.refId} className={styles.appRow} onClick={() => handleRowClick(app)}>
              <span className={`${styles.statusDot} ${dotClass[app.status] || styles.dotPending}`} />
              <div className={styles.rowInfo}>
                <p className={styles.rowTitle}>{app.applicationType}</p>
                <div className={styles.rowMeta}>
                  <span className={styles.rowRef}>{app.refId.substring(0, 18)}{app.refId.length > 18 ? '...' : ''}</span>
                  <button onClick={e => handleCopy(app.refId, e)} className={styles.copyBtn}>
                    {copied === app.refId ? <span className={styles.copiedText}>✓</span> : <IconCopy />}
                  </button>
                  <span className={styles.rowDate}>· {new Date(app.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
              {app.status === "APPROVED" && app.applicationType.toLowerCase().includes("volunteer") ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/mission/${app.refId}`);
                  }}
                  style={{
                    border: "1px solid #dbeafe",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    borderRadius: "999px",
                    padding: "0.4rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    marginRight: "0.5rem",
                  }}
                >
                  View Mission
                </button>
              ) : null}
              <span className={`${styles.statusPill} ${pillClass[app.status] || styles.pillPending}`}>{app.status.charAt(0) + app.status.slice(1).toLowerCase()}</span>
              <span className={styles.chevron}><IconChevronRight /></span>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Prev
            </button>
            <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
            <button 
              className={styles.pageBtn} 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )}
      </main>


      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2024 Application Portal. All rights reserved.</span>
        <div className={styles.footerLinks}>
          <a href="#">Support</a><a href="#">Terms of Service</a><a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
