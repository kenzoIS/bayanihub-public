"use client";

import React from "react";

export const COLORS = {
  primary: "#3E5A99",
  primaryLight: "#5E70DC",
  orange: "#E84B1A",
  white: "#FFFFFF",
  gray50: "#F8F9FA",
  gray100: "#F1F3F5",
  gray300: "#CED4DA",
  gray400: "#ADB5BD",
  gray500: "#6C757D",
  gray700: "#343A40",
  blue600: "#1D4ED8",
  blue700: "#1E40AF",
} as const;

interface LeftPanelProps {
  tagline: React.ReactNode;
  body: string;
  extraContent?: React.ReactNode;
  /** Pass the URL/path of your logo image, e.g. "/logo.png" or "/logo.svg" */
  logoSrc?: string;
}

const DRRMBadge: React.FC = () => (
  <div style={styles.badge}>
    <span style={styles.badgeDot} />
    <span style={styles.badgeText}>DRRM ACTIVE</span>
  </div>
);

const LeftPanel: React.FC<LeftPanelProps> = ({ tagline, body, extraContent, logoSrc }) => (
  <aside style={styles.leftPanel}>
    <div style={styles.blobTop} />
    <div style={styles.blobBottom} />
    <div style={styles.leftContent}>
      <div style={styles.brandBlock}>
        {/* Brand name row — logo + text side by side */}
        <div style={styles.brandRow}>
          {logoSrc && (
            <img
              src={logoSrc}
              alt="BayaniHub logo"
              style={styles.logoImg}
            />
          )}
          <h1 style={styles.brandName}>BayaniHub</h1>
        </div>
        <p style={styles.brandSub}>VOLUNTEER &amp; RELIEF OPERATIONS</p>
        <DRRMBadge />
      </div>
      <div style={styles.taglineBlock}>
        <h2 style={styles.tagline}>{tagline}</h2>
        <p style={styles.taglineBody}>{body}</p>
        {extraContent}
      </div>
    </div>
  </aside>
);

const styles: Record<string, React.CSSProperties> = {
  leftPanel: {
    position: "relative",
    width: "34%",
    minWidth: 300,
    backgroundColor: "#3E5A99",
    overflow: "hidden",
    display: "flex",
    alignItems: "stretch",
  },
  blobTop: {
    position: "absolute",
    top: -80,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: "50%",
    backgroundColor: "#5E70DC80",
    zIndex: 0,
  },
  blobBottom: {
    position: "absolute",
    bottom: -100,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: "50%",
    backgroundColor: "#5E70DC80",
    zIndex: 0,
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "2.5rem 2.25rem",
    width: "100%",
  },
  brandBlock: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  brandRow: { display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.1rem" },
  logoImg: { width: 50, height: 50, objectFit: "contain", flexShrink: 0 },
  brandName: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 700,
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
  },
  brandSub: {
    margin: 0,
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.18em",
    color: "#FFFFFFCC",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    marginTop: "0.6rem",
    backgroundColor: "#E84B1A",
    borderRadius: "999px",
    padding: "0.28rem 0.85rem",
    width: "fit-content",
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#FFFFFF",
    flexShrink: 0,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  taglineBlock: { display: "flex", flexDirection: "column", gap: "1rem" },
  tagline: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#FFFFFF",
    lineHeight: 1.3,
  },
  taglineBody: {
    margin: 0,
    fontSize: "0.88rem",
    color: "#FFFFFFCC",
    lineHeight: 1.65,
  },
};

export default LeftPanel;
