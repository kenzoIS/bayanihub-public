"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useAuth } from "@/lib/auth-context";

// ─── Icons ───────────────────────────────────────────────────────────────

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconX = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconHistory = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 15 15" />
  </svg>
);

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

// ─── Component ──────────────────────────────────────────────────────────

export default function RejectedPage() {
  const { user, token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [appData, setAppData] = useState<any>(null);

  const fetchApplication = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/api/v1/forms/my-application", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch application", err);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [token]);

  const handleCopy = () => {
    if (!appData) return;
    navigator.clipboard.writeText(appData.id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchApplication();
    setTimeout(() => setRefreshing(false), 500);
  };

  const userName = user?.profile?.first_name 
    ? `${user.profile.first_name} ${user.profile.last_name}` 
    : "Maria Santos";
  const refId = appData?.id 
    ? appData.id.split('-')[0].toUpperCase() 
    : "APP - 2026 - 00847";
  const submitDate = appData?.created_at 
    ? new Date(appData.created_at).toLocaleDateString() 
    : "April 24, 2026";
  
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
          <button className={`${styles.iconBtn} ${styles.relative}`} aria-label="Notifications">
            <IconBell />
            <span className={styles.badge} />
          </button>
          <button className={styles.iconBtn} aria-label="Account"><IconUser /></button>
        </div>
      </nav>

      {/* Main Body */}
      <main className={styles.main}>
        
        {/* Left Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.userName}>{userName}</h1>
            <span className={styles.passType}>Institutional ID</span>
          </div>
          
          <div className={styles.refRow}>
            <span className={styles.refLabel}>REF:</span>
            <span className={styles.refValue}>{refId}</span>
            <button onClick={handleCopy} className={styles.copyBtn} title="Copy reference">
              <IconCopy />
            </button>
            {copied && <span className={styles.copiedText}>Copied!</span>}
          </div>

          <div className={styles.divider} />

          <div className={styles.submitRow}>
            <div>
              <p className={styles.submitLabel}>Submitted</p>
              <p className={styles.submitDate}>{submitDate}</p>
            </div>
            <button onClick={handleRefresh} className={styles.refreshBtn}>
              <span className={refreshing ? styles.spin : ""}><IconRefresh /></span>
              Refresh Status
            </button>
          </div>

          <button className={styles.blueButton} onClick={() => setShowDetails(!showDetails)} style={{ marginTop: '1.5rem' }}>
            {showDetails ? "Hide Submission Details" : "View Submission Details"}
          </button>

          {showDetails && (
            <div className={styles.deployDetails}>
              <h3 className={styles.deployTitle}>Submission Summary</h3>
              <p className={styles.deployText}><strong>Role:</strong> {appData?.volunteer_roles?.title || "Food Packing Volunteer"}</p>
              <p className={styles.deployText}><strong>Availability:</strong> {appData?.availability || "Weekends (Morning)"}</p>
              
              <h3 className={styles.deployTitle} style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>Attached Documents</h3>
              {appData?.resume_key || !appData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <span style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {appData?.resume_key ? appData.resume_key.split('/').pop() : 'Santos_Maria_ID_Document.pdf'}
                  </span>
                  <a href={`#`} style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>View</a>
                </div>
              ) : (
                <p className={styles.deployText} style={{ fontStyle: 'italic', color: '#9ca3af' }}>No additional documents provided.</p>
              )}
            </div>
          )}

          <a href="tel:+639123456789" className={styles.whiteButton}>
            Contact Support
          </a>
        </div>

        {/* Right Card */}
        <div className={`${styles.card} ${styles.rightCard}`}>
          <div className={styles.rejectedBadge}>
            <div className={styles.redCircle}>
              <IconX />
            </div>
            <p className={styles.rejectedTitle}>Application Rejected</p>
            <p className={styles.rejectedSub}>
              Unfortunately, your application was not approved at this time. If you believe this was an error, please contact support for more details.
            </p>
          </div>

          <p className={styles.lastUpdated}>
            <IconHistory /> Last updated {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2024 Application Portal. All rights reserved.</span>
        <div className={styles.footerLinks}>
          <a href="#">Support</a>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
