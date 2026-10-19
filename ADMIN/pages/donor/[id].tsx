import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./donor-review.module.css";
import { apiFetch } from "@/lib/api";

interface DonorDetail {
  id: string;
  name: string;
  donationDetails: string;
  status: string;
  submittedDate: string;
  location: string;
  phone: string;
  address: string;
  campaignTitle: string;
  itemName: string;
  quantity: number;
  unit: string;
  condition: string;
  message: string;
  isAnonymous: boolean;
}


function getStatusLabel(status: string) {
  if (status === "confirmed" || status === "completed") return "Accepted";
  if (status === "failed" || status === "refunded") return "Rejected";
  return "Pending Review";
}

export default function DonorReviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [donor, setDonor] = useState<DonorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchDonor() {
      setLoading(true);
      try {
        const data = await apiFetch<any>(`/donors/${id}`);
        const profile = data.user_profiles;
        const submittedAt = data.donated_at ? new Date(data.donated_at) : null;
        const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "";

        setDonor({
          id: data.id,
          name: data.anonymous ? "Anonymous Donor" : fullName || "Unknown Donor",
          donationDetails: data.message || "Goods donation (no description provided)",
          status: data.status ?? "pending",
          submittedDate: submittedAt
            ? submittedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : "Date unavailable",
          location: profile
            ? `${profile.municipality ?? ""}, ${profile.province ?? ""}`.replace(/^, |, $/g, "")
            : "",
          phone: profile?.phone ?? "",
          address: profile
            ? [profile.address, profile.barangay, profile.municipality, profile.province].filter(Boolean).join(", ")
            : "",
          campaignTitle: data.bh_campaigns?.title ?? "General Donation",
          itemName: data.item_name ?? "General Item",
          quantity: data.quantity ?? 1,
          unit: data.unit ?? "pcs",
          condition: data.condition ?? "Brand New",
          message: data.message ?? "No donor message was included with this contribution.",
          isAnonymous: Boolean(data.anonymous),
        });
      } catch (err) {
        console.error("Error fetching donor:", err);
        setDonor(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDonor();
  }, [id]);

  const updateStatus = async (nextStatus: "confirmed" | "failed") => {
    if (!donor || actionLoading) return;

    const nextAction = nextStatus === "confirmed" ? "approve" : "reject";
    setActionLoading(nextAction);
    setActionError(null);

    try {
      await apiFetch(`/donors/${donor.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setDonor((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      if (nextStatus === 'failed') {
        router.push("/donors");
      }
    } catch (err: any) {
      setActionError(err?.message ?? "Failed to update donor application");
    } finally {
      setActionLoading(null);
    }
  };

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrGenerated, setIsQrGenerated] = useState(false);

  useEffect(() => {
    if (donor?.id && donor.status === 'confirmed') {
      const checkExistingQr = async () => {
        try {
          const qrs = await apiFetch<any[]>(`/qr/donation/${donor.id}`);
          if (qrs && qrs.length > 0) {
            setQrUrl(qrs[0].public_url);
            setIsQrGenerated(true);
          }
        } catch (err) {
          console.error("Failed to check existing QR codes:", err);
        }
      };
      checkExistingQr();
    }
  }, [donor?.id, donor?.status]);

  const handleGenerateQr = async () => {
    if (!donor || qrLoading) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const result = await apiFetch<any>("/qr/generate", {
        method: "POST",
        body: JSON.stringify({
          donation_id: donor.id,
          qr_type: "drop_off",
        }),
      });
      setQrUrl(result.public_url);
      setIsQrGenerated(true);
    } catch (err: any) {
      setQrError(err?.message ?? "Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.notFound}>
        <Header />
        <main className={styles.notFoundContent}>
          <p className={styles.notFoundText}>Loading donor application...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className={styles.notFound}>
        <Header />
        <main className={styles.notFoundContent}>
          <div>
            <p className={styles.notFoundText}>Donor application not found</p>
            <button onClick={() => router.push("/donors")} className={styles.notFoundButton}>
              Back to Donors
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const statusLabel = getStatusLabel(donor.status);
  const statusClass =
    statusLabel === "Accepted"
      ? styles.statusAccepted
      : statusLabel === "Rejected"
        ? styles.statusRejected
        : styles.statusUnderReview;

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div>
          <Link href="/donors" className={styles.backButton}>
            <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        <div className={styles.applicantHeader}>
          <div className={styles.headerContent}>
            <div className={styles.applicantInfo}>
              <div className={styles.applicantAvatar}>
                <svg className={styles.avatarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h1 className={styles.applicantName}>{donor.name}</h1>
                <p className={styles.applicantTitle}>{donor.campaignTitle}</p>
                <p className={styles.applicantDate}>Submitted on {donor.submittedDate}</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
              {actionError && <span className={styles.errorText}>{actionError}</span>}
              {donor.status !== "confirmed" && (
                <button
                  onClick={() => updateStatus("confirmed")}
                  className={styles.approveButton}
                  disabled={Boolean(actionLoading)}
                >
                  {actionLoading === "approve" ? "Processing..." : "Accept"}
                </button>
              )}
              {donor.status !== "failed" && (
                <button
                  onClick={() => updateStatus("failed")}
                  className={styles.rejectButton}
                  disabled={Boolean(actionLoading)}
                >
                  {actionLoading === "reject" ? "Processing..." : "Reject"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.gridLayout}>
          <div className={styles.mainColumn}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Donor Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Donation Details</label>
                  <p className={styles.infoValue}>{donor.donationDetails}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Condition</label>
                  <p className={styles.infoValue}>{donor.condition}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Phone</label>
                  <p className={styles.infoValue}>{donor.phone || "No contact number"}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Location</label>
                  <p className={styles.infoValue}>{donor.location || "Location unavailable"}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Address</label>
                  <p className={styles.infoValue}>{donor.address || "Address unavailable"}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Anonymous</label>
                  <p className={styles.infoValue}>{donor.isAnonymous ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Item Summary</h2>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Campaign</h3>
                <p className={styles.sectionDescription}>{donor.campaignTitle}</p>
              </div>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Item Name & Quantity</h3>
                <p className={styles.sectionDescription}>{donor.quantity}x {donor.itemName} ({donor.unit})</p>
              </div>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Donor Message</h3>
                <p className={styles.sectionDescription}>{donor.message}</p>
              </div>
            </div>

            {/* QR Code Generation Card - Only visible when accepted */}
            {statusLabel === "Accepted" && (
              <div className={styles.card} style={{ marginTop: '1.5rem' }}>
                <h2 className={styles.cardTitle}>
                  <span style={{ marginRight: '0.5rem' }}>📱</span>
                  Drop-Off QR Code
                </h2>
                {isQrGenerated ? (
                  <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '0.5rem', color: '#047857', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    QR Code has already been generated for this donation.
                  </div>
                ) : (
                  <>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Generate a drop-off QR code for the donor. They can present this code at the site to quickly verify their donation.
                    </p>

                    <button
                      onClick={handleGenerateQr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.85rem 1.5rem',
                        backgroundColor: '#5c6ed5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: qrLoading ? 'not-allowed' : 'pointer',
                        opacity: qrLoading ? 0.6 : 1,
                      }}
                      disabled={qrLoading}
                    >
                      {qrLoading ? "Generating..." : "Generate Drop-Off QR Code"}
                    </button>
                  </>
                )}

                {qrError && (
                  <p style={{ color: '#dc2626', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.75rem' }}>{qrError}</p>
                )}

                {qrUrl && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: isQrGenerated ? 'none' : '1px solid #e5e5e5', paddingTop: isQrGenerated ? '0' : '1.5rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: 'white', border: '2px solid #e5e5e5', borderRadius: '1rem', display: 'inline-block' }}>
                      <img src={qrUrl} alt="Drop-Off QR Code" style={{ width: '200px', height: '200px', imageRendering: 'pixelated' }} />
                    </div>
                    <p style={{ color: '#737373', fontSize: '0.85rem', margin: '1rem 0' }}>
                      Send this to the donor for their drop-off "For Testing lang muna toh kaya naka display pa".
                    </p>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.6rem 1.25rem',
                        backgroundColor: '#5c6ed5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                      }}
                    >
                      Download QR Code
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.sidebar}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Review Timeline</h2>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineLine} />
                  </div>
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineEvent}>Donation submitted</p>
                    <p className={styles.timelineDate}>{donor.submittedDate}</p>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineMarker}>
                    <div className={`${styles.timelineDot} ${statusLabel === "Pending Review" ? styles.timelineDotPending : ""}`} />
                  </div>
                  <div className={styles.timelineContent}>
                    <p className={`${styles.timelineEvent} ${statusLabel === "Pending Review" ? styles.timelineEventPending : ""}`}>
                      {statusLabel}
                    </p>
                    <p className={styles.timelineDate}>
                      {statusLabel === "Pending Review" ? "Awaiting decision" : "Updated in donor queue"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Review Guidance</h2>
              <div className={styles.notesSection}>
                <p className={styles.sectionDescription}>
                  Confirm the transaction reference, donation amount, and campaign target before accepting.
                </p>
                <p className={styles.sectionDescription}>
                  Reject entries that cannot be verified, have invalid payment details, or should not be posted to the donation history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
