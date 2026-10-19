import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./applicant.module.css";
import { apiFetch } from "@/lib/api";

interface Applicant {
  id: number;
  name: string;
  title: string;
  role: string;
  appliedDate: string;
  status: string;
  avatar: string;
  gender: string;
  personal: {
    email: string;
    phone: string;
    address: string;
    emergencyContact: string;
  };
  experience: {
    title: string;
    description: string;
    skills: string[];
    motivation: string;
  };
  documents: { name: string; size: string; date: string; icon: string }[];
  timeline: { event: string; date: string; pending: boolean }[];
  references: { name: string; title: string; phone: string }[];
  notes: string;
}

export default function ApplicantDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchApplicant() {
      setLoading(true);
      try {
        const data = await apiFetch<any>(`/applications/${id}`);

        const profile = data.user_profiles;
        const role = data.volunteer_roles;
        const name = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "Unknown";
        const createdAt = data.applied_at ? new Date(data.applied_at) : new Date();
        const formattedDate = createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        const rawStatus = data.status || "pending";
        const formattedStatus = rawStatus === "pending" 
          ? "Under Review" 
          : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

        setApplicant({
          id: data.id,
          name,
          title: `${role?.title ?? "Volunteer"} Application`,
          role: role?.title ?? "Volunteer",
          appliedDate: formattedDate,
          status: formattedStatus,
          avatar: "👤",
          gender: profile?.gender ?? "unknown",
          personal: {
            email: profile?.email ?? "",
            phone: profile?.phone ?? "",
            address: profile ? `${profile.municipality ?? ""}, ${profile.province ?? ""}`.replace(/^, |, $/g, "") : "",
            emergencyContact: "",
          },
          experience: {
            title: "Volunteer Application",
            description: data.motivation ?? (Array.isArray(data.skills) ? data.skills.join(", ") : data.skills) ?? "No description provided",
            skills: Array.isArray(data.skills) ? data.skills : data.skills ? String(data.skills).split(",").map((s: string) => s.trim()) : [],
            motivation: data.motivation ?? "",
          },
          documents: [],
          timeline: [
            { event: "Application Submitted", date: formattedDate, pending: false },
            { event: "Under Review", date: data.reviewed_by ? "Reviewed" : "Pending", pending: data.status === "pending" },
          ],
          references: [],
          notes: "",
        });
      } catch (err) {
        console.error("Error fetching applicant:", err);
        setApplicant(null);
      }
      setLoading(false);
    }
    fetchApplicant();
  }, [id]);

  const getAvatarImage = (gender: string) => {
    const femaleUrl = "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Ff9735712ac9445bfa5fc8e23bf5556e0?format=webp&width=800&height=1200";
    const maleUrl = "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2F5b17614135f047edaec8a0a56e56e95c?format=webp&width=800&height=1200";
    return gender === "female" ? femaleUrl : maleUrl;
  };

  if (loading) {
    return (
      <div className={styles.notFound}>
        <Header />
        <main className={styles.notFoundContent}>
          <div><p className={styles.notFoundText}>Loading applicant...</p></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className={styles.notFound}>
        <Header />
        <main className={styles.notFoundContent}>
          <div>
            <p className={styles.notFoundText}>Applicant not found</p>
            <button
              onClick={() => router.push("/volunteers")}
              className={styles.notFoundButton}
            >
              Back to Volunteers
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSaveNotes = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleApprove = async () => {
    if (!applicant || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiFetch(`/applications/${applicant.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      router.push(`/approval-status?applicationId=${applicant.id}`);
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!applicant || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiFetch(`/applications/${applicant.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      router.push('/rejection-status');
    } catch (err: any) {
      setActionError(err?.message ?? 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const statusClass = 
    applicant.status === "Approved" ? styles.statusApproved : 
    applicant.status === "Rejected" ? styles.statusRejected : 
    styles.statusUnderReview;

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* Back Button */}
        <div>
          <Link href="/volunteers" className={styles.backButton}>
            <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>

        {/* Applicant Header */}
        <div className={styles.applicantHeader}>
          <div className={styles.headerContent}>
            <div className={styles.applicantInfo}>
              <img
                src={getAvatarImage(applicant.gender || "female")}
                alt={applicant.name}
                className={styles.applicantAvatar}
                style={{ objectFit: "contain" }}
              />
              <div>
                <h1 className={styles.applicantName}>{applicant.name}</h1>
                <p className={styles.applicantTitle}>{applicant.title}</p>
                <p className={styles.applicantDate}>Submitted on {applicant.appliedDate}</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              <span className={`${styles.statusBadge} ${statusClass}`}>
                {applicant.status}
              </span>
              {actionError && (
                <span style={{ color: 'red', fontSize: '0.85rem' }}>{actionError}</span>
              )}
              <button
                onClick={handleApprove}
                className={styles.approveButton}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={handleReject}
                className={styles.rejectButton}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.gridLayout}>
          {/* Left Column */}
          <div className={styles.mainColumn}>
            {/* Personal Information */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Personal Information</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Email</label>
                  <p className={styles.infoValue}>{applicant.personal.email}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Phone</label>
                  <p className={styles.infoValue}>{applicant.personal.phone}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Address</label>
                  <p className={styles.infoValue}>{applicant.personal.address}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.infoLabel}>Emergency Contact</label>
                  <p className={styles.infoValue}>{applicant.personal.emergencyContact}</p>
                </div>
              </div>
            </div>

            {/* Experience & Skills */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Experience & Skills</h2>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{applicant.experience.title}</h3>
                <p className={styles.sectionDescription}>{applicant.experience.description}</p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Relevant Skills</h3>
                <div className={styles.skillsList}>
                  {applicant.experience.skills.map((skill, idx) => (
                    <span key={idx} className={styles.skillTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Motivation</h3>
                <p className={styles.sectionDescription}>{applicant.experience.motivation}</p>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Uploaded Documents</h2>

              <div className={styles.documentsList}>
                {applicant.documents.map((doc, idx) => (
                  <div key={idx} className={styles.documentItem}>
                    <div className={styles.documentInfo}>
                      <img src={doc.icon} alt={doc.name} className={styles.documentIcon} />
                      <div className={styles.documentMeta}>
                        <p className={styles.documentName}>{doc.name}</p>
                        <p className={styles.documentSize}>{doc.size} • Uploaded {doc.date}</p>
                      </div>
                    </div>
                    <div className={styles.documentActions}>
                      <button className={styles.documentButton} title="View">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button className={styles.documentButton} title="Download">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button className={styles.downloadAllButton}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All Documents
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.sidebar}>
            {/* Application Timeline */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Application Timeline</h2>

              <div className={styles.timeline}>
                {applicant.timeline.map((item, idx) => (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineMarker}>
                      <div className={`${styles.timelineDot} ${item.pending ? styles.timelineDotPending : ""}`} />
                      {idx < applicant.timeline.length - 1 && <div className={styles.timelineLine} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <p className={`${styles.timelineEvent} ${item.pending ? styles.timelineEventPending : ""}`}>
                        {item.event}
                      </p>
                      <p className={styles.timelineDate}>{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* References */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>References</h2>

              <div className={styles.referencesList}>
                {applicant.references.map((ref, idx) => (
                  <div key={idx} className={styles.referenceItem}>
                    <p className={styles.referenceName}>{ref.name}</p>
                    <p className={styles.referenceTitle}>{ref.title}</p>
                    <p className={styles.referencePhone}>{ref.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Notes */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Internal Notes</h2>

              <div className={styles.notesSection}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this applicant..."
                  className={styles.notesTextarea}
                  rows={4}
                />

                <button
                  onClick={handleSaveNotes}
                  className={`${styles.notesButton} ${isSaved ? styles.saved : ""}`}
                >
                  {isSaved ? "✓ Saved" : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}