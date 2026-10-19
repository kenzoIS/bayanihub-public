"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QrScanAPI } from "@/lib/api";
import jsQR from "jsqr";
import styles from "./page.module.css";

type ScanState = "scanning" | "verifying" | "success" | "error";

interface VerifiedResult {
  verified: boolean;
  qr_type: string;
  issued_at: string;
  volunteer: {
    name: string;
    phone: string;
    address: string;
    role_in_system: string;
  } | null;
  donor: {
    name: string;
    phone: string;
    address: string;
  } | null;
  donation_details: {
    id: string;
    item: string;
    quantity: number;
    unit: string;
    type?: string;
  } | null;
  role: string;
  campaign: { id: string; title: string; status: string } | null;
  deployment: {
    location: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
  application_status: string;
}

export default function ScanQrPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [result, setResult] = useState<VerifiedResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState("");
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState("");
  const [reconciling, setReconciling] = useState(false);

  // Reconcile function
  const handleReconcile = async () => {
    if (!result || !result.donation_details) return;
    try {
      setReconciling(true);
      await QrScanAPI.reconcile({
        donation_id: result.donation_details.id,
        item_name: result.donation_details.item,
        quantity: result.donation_details.quantity,
        unit: result.donation_details.unit,
        donation_type: result.donation_details.type ?? 'goods',
      });
      // Mark local state as reconciled
      setResult({
        ...result,
        application_status: 'completed',
      });
      alert("Donation reconciled successfully!");
    } catch (err: any) {
      alert("Failed to reconcile: " + err.message);
    } finally {
      setReconciling(false);
    }
  };

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 640 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError(true);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  // Scan loop
  useEffect(() => {
    if (scanState !== "scanning" || !cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let active = true;

    const tick = () => {
      if (!active || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code?.data) {
        active = false;
        handleQrDetected(code.data);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scanState, cameraReady]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Handle QR detected
  const handleQrDetected = async (rawData: string) => {
    setScanState("verifying");

    try {
      // Parse the QR JSON payload
      const payload = JSON.parse(rawData);
      const id = payload.application_id || payload.donation_id;

      if (!id) {
        throw new Error("Invalid QR code — no application or donation ID found");
      }

      // Call backend to verify
      const data = await QrScanAPI.verify(id);
      setResult(data);
      setScanState("success");
      stopCamera();
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to verify QR code");
      setScanState("error");
    }
  };

  // Reset to scan again
  const handleScanAgain = () => {
    setResult(null);
    setErrorMsg("");
    setScanState("scanning");
    startCamera();
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatQrType = (t: string) => {
    switch (t) {
      case "deployment": return "Deployment";
      case "deployment_inventory": return "Deployment + Inventory";
      case "drop_off": return "Drop Off";
      default: return t;
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.scanContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>📱 Scan QR Code</h1>
          <p className={styles.pageSubtitle}>
            Point the camera at a volunteer's or donor's QR code
          </p>
        </div>

        {/* Camera / Result */}
        {scanState !== "success" && (
          <>
            {cameraError ? (
              <div className={styles.cameraError}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="#ef4444" strokeWidth="2"/>
                </svg>
                <p>
                  Camera access denied or unavailable. Please allow camera access in your browser settings, or make sure you're using HTTPS.
                </p>
                <button className={styles.scanAgainBtn} onClick={startCamera} style={{ maxWidth: 200 }}>
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className={styles.cameraSection}>
                <video ref={videoRef} className={styles.video} muted playsInline />
                <canvas ref={canvasRef} className={styles.canvas} />
                {scanState === "scanning" && (
                  <div className={styles.scanOverlay}>
                    <div className={styles.scanFrame} />
                    <div className={styles.scanLine} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Status Bar */}
        {scanState === "scanning" && !cameraError && (
          <div className={`${styles.statusBar} ${styles.statusScanning}`}>
            <div className={styles.spinner} />
            Scanning for QR code...
          </div>
        )}

        {scanState === "verifying" && (
          <div className={`${styles.statusBar} ${styles.statusScanning}`}>
            <div className={styles.spinner} />
            Verifying with server...
          </div>
        )}

        {scanState === "error" && (
          <>
            <div className={`${styles.statusBar} ${styles.statusError}`}>
              ⚠️ {errorMsg}
            </div>
            <button className={styles.scanAgainBtn} onClick={handleScanAgain}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Try Again
            </button>
          </>
        )}

        {/* Verified Result Card */}
        {scanState === "success" && result && (
          <>
            <div className={`${styles.statusBar} ${styles.statusSuccess}`}>
              ✅ {result.donor ? "Donor" : "Volunteer"} verified successfully
            </div>

            <div className={styles.resultCard}>
              {/* Green header */}
              <div className={styles.resultHeader}>
                <div className={styles.verifiedBadge}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className={styles.resultHeaderText}>
                  <h3>{result.donor?.name ?? result.volunteer?.name ?? "Unknown User"}</h3>
                  <p>{result.role} • {formatQrType(result.qr_type)}</p>
                </div>
              </div>

              {/* Body */}
              <div className={styles.resultBody}>
                {/* Person Info */}
                <div className={styles.resultSection}>
                  <div className={styles.resultSectionTitle}>{result.donor ? "Donor Info" : "Volunteer Info"}</div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Phone</span>
                    <span className={styles.resultValue}>{(result.donor?.phone || result.volunteer?.phone) || "—"}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Address</span>
                    <span className={styles.resultValue}>{(result.donor?.address || result.volunteer?.address) || "—"}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Status</span>
                    <span className={styles.statusBadgeApproved}>{result.application_status}</span>
                  </div>
                </div>

                <div className={styles.divider} />

                {/* Donation Details */}
                {result.donation_details && (
                  <>
                    <div className={styles.resultSection}>
                      <div className={styles.resultSectionTitle}>Donation Drop-Off</div>
                      
                      {!isEditing ? (
                        <>
                          <div className={styles.resultRow}>
                            <span className={styles.resultLabel}>Item</span>
                            <span className={styles.resultValue}>{result.donation_details.item}</span>
                          </div>
                          <div className={styles.resultRow}>
                            <span className={styles.resultLabel}>Quantity</span>
                            <span className={styles.resultValue}>{result.donation_details.quantity} {result.donation_details.unit}</span>
                          </div>
                          {result.application_status !== 'completed' && (
                            <button
                              onClick={() => {
                                setEditItem(result.donation_details!.item);
                                setEditQuantity(result.donation_details!.quantity);
                                setEditUnit(result.donation_details!.unit);
                                setIsEditing(true);
                              }}
                              className={styles.editBtn}
                              style={{ marginTop: '1rem', width: '100%' }}
                            >
                              Edit Goods (Doesn't Match)
                            </button>
                          )}
                        </>
                      ) : (
                        <div className={styles.editForm} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Item Name</label>
                            <input
                              type="text"
                              value={editItem}
                              onChange={(e) => setEditItem(e.target.value)}
                              className={styles.inputField}
                              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                              <input
                                type="number"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(Number(e.target.value))}
                                className={styles.inputField}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.8rem', color: 'transparent', display: 'block', marginBottom: '0.25rem' }}>Unit</label>
                              <input
                                type="text"
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                className={styles.inputField}
                                placeholder="pcs, kg, etc."
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button
                              onClick={() => setIsEditing(false)}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                // Save local state and close editing
                                setResult({
                                  ...result,
                                  donation_details: {
                                    ...result.donation_details!,
                                    item: editItem,
                                    quantity: editQuantity,
                                    unit: editUnit,
                                  }
                                });
                                setIsEditing(false);
                              }}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {result.application_status !== 'completed' && !isEditing && (
                      <button
                        onClick={handleReconcile}
                        disabled={reconciling}
                        style={{ width: '100%', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: reconciling ? 'not-allowed' : 'pointer', opacity: reconciling ? 0.7 : 1, marginTop: '1rem' }}
                      >
                        {reconciling ? "Reconciling..." : "Reconcile Donation"}
                      </button>
                    )}
                    <div className={styles.divider} />
                  </>
                )}

                {/* Campaign */}
                {result.campaign && (
                  <>
                    <div className={styles.resultSection}>
                      <div className={styles.resultSectionTitle}>Campaign</div>
                      <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Name</span>
                        <span className={styles.resultValue}>{result.campaign.title}</span>
                      </div>
                      <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Status</span>
                        <span className={styles.typeBadge}>{result.campaign.status}</span>
                      </div>
                    </div>
                    <div className={styles.divider} />
                  </>
                )}

                {/* Deployment */}
                {result.deployment && (
                  <div className={styles.resultSection}>
                    <div className={styles.resultSectionTitle}>Deployment Details</div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Location</span>
                      <span className={styles.resultValue}>{result.deployment.location || "—"}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Start</span>
                      <span className={styles.resultValue}>{formatDate(result.deployment.start_date)}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>End</span>
                      <span className={styles.resultValue}>{formatDate(result.deployment.end_date)}</span>
                    </div>
                  </div>
                )}

                <div className={styles.divider} />

                {/* QR Meta */}
                <div className={styles.resultSection}>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>QR Type</span>
                    <span className={styles.typeBadge}>{formatQrType(result.qr_type)}</span>
                  </div>
                  <div className={styles.resultRow}>
                    <span className={styles.resultLabel}>Issued</span>
                    <span className={styles.resultValue}>{formatDate(result.issued_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.buttonRow}>
              <button className={styles.scanAgainBtn} onClick={handleScanAgain}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                </svg>
                Scan Another
              </button>
              <Link href="/dashboard" className={styles.backBtn}>
                ← Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
