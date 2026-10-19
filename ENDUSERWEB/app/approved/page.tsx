"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import QRCode from "react-qr-code";
import { useAuth } from "@/lib/auth-context";

// ─── Icons (inline SVG to avoid external deps) ──────────────────────────────

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);



// ─── Main Component ──────────────────────────────────────────────────────────

export default function BayaniHubEventPass() {
  const { user, token } = useAuth();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [appData, setAppData] = useState<any>(null);

  const fetchApplication = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:3001/api/v1/forms/my-application", {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `BayaniHub-Event-Pass-${appData?.id?.substring(0,6) || 'QR'}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const userName = user?.profile?.first_name 
    ? `${user.profile.first_name} ${user.profile.last_name}` 
    : "Maria Santos";
    
  const refId = appData?.id 
    ? appData.id.split('-')[0].toUpperCase() 
    : "APP-2026-00847";
    
  const submitDate = appData?.created_at 
    ? new Date(appData.created_at).toLocaleDateString() 
    : "April 24, 2026";
    
  const qrValue = appData?.id || "APP-2026-00847-MOCK";
  
  const venue = appData?.volunteer_roles?.campaign_id || "Camp Aguinaldo Grandstand";
  
  const statusTitle = appData?.status === 'submitted' ? "Application Submitted" 
    : appData?.status === 'rejected' ? "Application Rejected"
    : "Application Approved!";
    
  const statusSub = appData?.status === 'submitted' ? "Please wait for administrator approval."
    : appData?.status === 'rejected' ? "Unfortunately, your pass was not approved."
    : "Your event pass is ready for use.";

  return (
    <div className={styles.container}>

      {/* ── Navbar ── */}
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

      {/* ── Page body ── */}
      <main className={styles.main}>

        {/* ── Left card: Application info ── */}
        <div className={styles.card}>

          {/* Header row */}
          <div className={styles.cardHeader}>
            <div>
              <h1 className={styles.userName}>{userName}</h1>
              <div className={styles.refRow}>
                <span className={styles.refLabel}>Ref:</span>
                <span className={styles.refValue}>{refId}</span>
                <button
                  onClick={handleCopy}
                  className={styles.copyBtn}
                  title="Copy reference"
                >
                  <IconCopy />
                </button>
                {copied && (
                  <span className={styles.copiedText}>Copied!</span>
                )}
              </div>
            </div>
            <span className={styles.passType}>
              Event Pass
            </span>
          </div>

          <div className={styles.divider} />

          {/* Submitted row */}
          <div className={styles.submitRow}>
            <div>
              <p className={styles.submitLabel}>Submitted</p>
              <p className={styles.submitDate}>{submitDate}</p>
            </div>
            <button
              onClick={handleRefresh}
              className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ""}`}
            >
              <span className={refreshing ? styles.spin : ""}><IconRefresh /></span>
              Refresh Status
            </button>
          </div>

          {/* Info banner */}
          <div className={styles.infoBanner}>
            <span className={styles.infoIcon}><IconInfo /></span>
            <p className={styles.infoText}>
              Please present this digital pass along with a valid photo ID at the event venue for verification.
            </p>
          </div>

          {/* Deployment Details (Always Visible) */}
          <div className={styles.deployDetails}>
            <h3 className={styles.deployTitle}>Deployment Location</h3>
            <p className={styles.deployText}><strong>Venue ID:</strong> {venue}</p>
            <p className={styles.deployText}><strong>Status:</strong> {appData?.status?.toUpperCase() || 'UNKNOWN'}</p>
            <p className={styles.deployText}><strong>Instructions:</strong> Please proceed to the designated entrance for this location and present this Event Pass to the coordinators.</p>
          </div>
        </div>

        {/* ── Right card: QR / Approval ── */}
        <div className={`${styles.card} ${styles.rightCard}`}>

          {/* Approval badge */}
          <div className={styles.approvalBadge}>
            <div className={styles.checkCircle}>
              <IconCheck />
            </div>
            <div>
              <p className={styles.approvalTitle}>{statusTitle}</p>
              <p className={styles.approvalSub}>{statusSub}</p>
            </div>
          </div>

          {/* QR card */}
          <div className={styles.qrContainer}>
            <div className={styles.qrDarkBox}>
              <div className={styles.qrWhiteBox}>
                <QRCode id="qr-svg" value={qrValue} size={160} style={{ width: "100%", height: "100%" }} />
              </div>
              <div className={styles.qrLabels}>
                <p className={styles.qrLabelTop}>Application</p>
                <div className={styles.qrLabelRow}>
                  <div className={styles.qrLineLeft} />
                  <span className={styles.qrLabelMid}>Safe for work</span>
                  <div className={styles.qrLineRight} />
                </div>
              </div>
            </div>
          </div>

          <p className={styles.scanText}>Scan at the entrance kiosk</p>

          {/* Save button */}
          <button className={styles.saveBtn} onClick={handleDownloadQR}>
            <IconDownload />
            Save QR Code
          </button>

          {/* Last updated */}
          <p className={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </main>

      {/* ── Footer ── */}
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
