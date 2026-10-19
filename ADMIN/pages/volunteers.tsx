import { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./volunteers.module.css";
import { apiFetch } from "@/lib/api";

interface VolunteerApp {
  id: string;
  name: string;
  role: string;
  description: string;
  appliedDate: string;
  email: string;
  phone: string;
  status: string;
  gender: string;
  rejectionDate?: string;
}

const VOLUNTEER_ROLES = ["All Applications"];

function StatCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      {icon && <p className={styles.statIcon}>{icon}</p>}
    </div>
  );
}

function ApplicationItem({
  volunteer,
  onReview,
  onApprove,
  onReject,
}: {
  volunteer: VolunteerApp;
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const getRoleColor = (role: string) => {
    const colors: { [key: string]: { badge: string; icon: string } } = {
      Medic: { badge: styles.roleBadgeMedic, icon: "👨‍⚕️" },
      Logistic: { badge: styles.roleBadgeLogistic, icon: "📦" },
      Field: { badge: styles.roleBadgeField, icon: "🏃" },
    };
    return colors[role] || { badge: styles.roleBadgeMedic, icon: "👤" };
  };

  const getAvatarImage = (gender: string) => {
    const femaleUrl = "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Ff9735712ac9445bfa5fc8e23bf5556e0?format=webp&width=800&height=1200";
    const maleUrl = "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2F5b17614135f047edaec8a0a56e56e95c?format=webp&width=800&height=1200";
    return gender === "female" ? femaleUrl : maleUrl;
  };

  const getRoleBadgeImage = (role: string) => {
    const roleImages: { [key: string]: string } = {
      Medic: "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Fa681e75636584033a859b766b8f2d8fd?format=webp&width=800&height=1200",
      Logistic: "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Ffbdca7a4acbd47888aa70e5c104ee236?format=webp&width=800&height=1200",
      Field: "https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Fa3c8b6daffb84fc9a6ff74946c06221a?format=webp&width=800&height=1200",
    };
    return roleImages[role] || "";
  };

  const roleColor = getRoleColor(volunteer.role);

  return (
    <div className={styles.applicationItem}>
      <div className={styles.applicationContent}>
        <img
          src={getAvatarImage(volunteer.gender || "male")}
          alt={volunteer.name}
          className={styles.applicationAvatar}
          style={{ objectFit: "contain" }}
        />
        <div className={styles.applicationInfo}>
          <h3 className={styles.applicationName}>{volunteer.name}</h3>
          <p className={styles.applicationDescription}>{volunteer.description}</p>
          <div className={styles.applicationMeta}>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {volunteer.appliedDate}
            </span>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              {volunteer.email}
            </span>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {volunteer.phone}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.applicationActions}>
        <img
          src={getRoleBadgeImage(volunteer.role)}
          alt={volunteer.role}
          className={styles.roleBadgeImage}
          style={{ height: "2rem", objectFit: "contain" }}
        />
        <button
          onClick={() => onReview(volunteer.id)}
          className={styles.reviewButton}
        >
          <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Review
        </button>
        <button
          onClick={() => onApprove(volunteer.id)}
          className={`${styles.actionButton} ${styles.approve}`}
        >
          <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Approve
        </button>
        <button
          onClick={() => onReject(volunteer.id)}
          className={`${styles.actionButton} ${styles.reject}`}
        >
          <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Reject
        </button>
      </div>
    </div>
  );
}

export default function Volunteers() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("All Applications");
  const [currentPage, setCurrentPage] = useState(1);
  const [volunteers, setVolunteers] = useState<VolunteerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const itemsPerPage = 4;

  useEffect(() => {
    async function fetchVolunteers() {
      setLoading(true);
      try {
        const data = await apiFetch<any[]>("/applications");

        const mapped: VolunteerApp[] = (data ?? []).map((row: any) => {
          const profile = row.user_profiles;
          const role = row.volunteer_roles;
          return {
            id: row.id,
            name: profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "Unknown",
            role: role?.title ?? "General",
            description: row.motivation ?? (Array.isArray(row.skills) ? row.skills.join(", ") : row.skills) ?? "",
            appliedDate: row.applied_at ? new Date(row.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            email: "",
            phone: profile?.phone ?? "",
            status: row.status ?? "pending",
            gender: "male",
          };
        });

        setVolunteers(mapped);
      } catch (err) {
        console.error("Error fetching volunteers:", err);
      }
      setLoading(false);
    }
    fetchVolunteers();
  }, []);

  const handleApprove = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      await apiFetch(`/applications/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error approving application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      await apiFetch(`/applications/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error rejecting application:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVolunteers = useMemo(() => {
    if (selectedRole === "All Applications") {
      return volunteers;
    }
    return volunteers.filter((v) => v.role === selectedRole);
  }, [selectedRole, volunteers]);

  // Collect unique roles from real data for filter buttons
  const uniqueRoles = useMemo(() => {
    const roles = new Set(volunteers.map((v) => v.role));
    return ["All Applications", ...Array.from(roles)];
  }, [volunteers]);

  const totalPages = Math.ceil(filteredVolunteers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVolunteers = filteredVolunteers.slice(startIndex, startIndex + itemsPerPage);

  // Count applications by role
  const counts = {
    total: volunteers.length,
    ...Object.fromEntries(
      uniqueRoles.filter(r => r !== "All Applications").map(r => [
        r.toLowerCase(),
        volunteers.filter(v => v.role === r).length,
      ])
    ),
  };

  return (
    <div className={styles.container}>
      <Head><title>Volunteers | BayaniHub Admin</title></Head>
      <Header />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <Link
            href="/"
            className={styles.backButton}
          >
            <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerIcon}>
              <svg className={styles.svg20} viewBox="0 0 24 24" fill="none" stroke="#5C6ED5" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h1 className={styles.headerTitle}>Volunteer Applications</h1>
            </div>
          </div>
          <Link
            href="/volunteer-verification"
            className={styles.backButton}
          >
            <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21H3V3h9V1H3a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-9h-2v9z" />
              <path d="M23 1H13v2h8.293L5 19.293a1 1 0 0 0 1.414 1.414L22.707 4.414V13h2V1z" />
            </svg>
            Verify Volunteers
          </Link>
        </div>

        {/* Application Queue section */}
        {loading ? (
          <div className={styles.noApplications}>
            <p className={styles.noApplicationsText}>Loading applications from Supabase...</p>
          </div>
        ) : (
        <>
        <div className={styles.queueSection}>
          <div className={styles.queueHeader}>
            <h2 className={styles.queueTitle}>Application Queue</h2>
            <p className={styles.queueSubtitle}>Filter applications by volunteer role</p>
          </div>

          {/* Statistics */}
          <div className={styles.statsGrid}>
            <StatCard label="Total" value={counts.total.toString()} />
            {uniqueRoles.filter(r => r !== "All Applications").map(r => (
              <StatCard key={r} label={r} value={(counts[r.toLowerCase()] ?? 0).toString()} />
            ))}
          </div>
        </div>

        {/* Filter buttons */}
        <div className={styles.filterButtonsContainer}>
          {uniqueRoles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setCurrentPage(1);
              }}
              className={`${styles.filterButton} ${selectedRole === role ? styles.filterButtonActive : ""}`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Applications list */}
        <div className={styles.applicationsList}>
          {paginatedVolunteers.length > 0 ? (
            <>
              {paginatedVolunteers.map((volunteer) => (
                <ApplicationItem
                  key={volunteer.id}
                  volunteer={volunteer}
                  onReview={(id) => {
                    const vol = volunteers.find(v => v.id === id);
                    if (vol?.status === "rejected") {
                      router.push(`/rejected-applicant/${id}`);
                    } else {
                      router.push(`/applicant/${id}`);
                    }
                  }}
                  onApprove={(id) => handleApprove(id)}
                  onReject={(id) => handleReject(id)}
                />
              ))}
            </>
          ) : (
            <div className={styles.noApplications}>
              <p className={styles.noApplicationsText}>No volunteer applications found.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <p className={styles.paginationInfo}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredVolunteers.length)} of{" "}
              {filteredVolunteers.length} applications
            </p>
            <div className={styles.paginationControls}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className={styles.paginationPages}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`${styles.pageNumber} ${currentPage === page ? styles.pageNumberActive : ""}`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
