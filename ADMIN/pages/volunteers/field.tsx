import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, ChevronLeft } from "lucide-react";
import styles from "../volunteers-role.module.css";
import { apiFetch } from "@/lib/api";

interface VolunteerApp {
  id: number;
  name: string;
  role: string;
  description: string;
  appliedDate: string;
  email: string;
  phone: string;
  status: string;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {icon && <p className={styles.statIcon}>{icon}</p>}
    </div>
  );
}

function ApplicationItem({
  volunteer,
}: {
  volunteer: VolunteerApp;
}) {
  const roleColor: {
    [key: string]: { badge: string };
  } = {
    Medic: { badge: styles.roleBadgeMedic },
    Logistic: { badge: styles.roleBadgeLogistic },
    Field: { badge: styles.roleBadgeField },
  };

  const statusColor = {
    pending: { badge: styles.statusPending, dotColor: "#f59e0b" },
    approved: { badge: styles.statusApproved, dotColor: "#22c55e" },
    rejected: { badge: styles.statusRejected, dotColor: "#ef4444" },
  };

  const currentStatus = statusColor[volunteer.status as keyof typeof statusColor];

  return (
    <div className={styles.applicationItem}>
      <div className={styles.applicationInfo}>
        <div className={styles.applicationHeader}>
          <span className={styles.applicationName}>{volunteer.name}</span>
          <span className={`${styles.roleBadge} ${roleColor[volunteer.role].badge}`}>
            {volunteer.role}
          </span>
        </div>
        <p className={styles.applicationDescription}>{volunteer.description}</p>
        <div className={styles.applicationMeta}>
          <span className={styles.metaItem}>
            <svg
              className={styles.metaIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Applied {volunteer.appliedDate}
          </span>
          <span className={styles.metaItem}>
            <svg
              className={styles.metaIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {volunteer.email}
          </span>
          <span className={styles.metaItem}>
            <svg
              className={styles.metaIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {volunteer.phone}
          </span>
        </div>
      </div>
      <div className={styles.actionButtons}>
        <div className={`${styles.statusBadge} ${currentStatus.badge}`}>
          <div className={styles.statusDot} style={{ backgroundColor: currentStatus.dotColor }}></div>
          {volunteer.status}
        </div>
        <button className={`${styles.actionButton} ${styles.actionButtonApprove}`}>
          Approve
        </button>
        <button className={`${styles.actionButton} ${styles.actionButtonReject}`}>
          Reject
        </button>
      </div>
    </div>
  );
}

export default function FieldVolunteers() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [volunteers, setVolunteers] = useState<VolunteerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 5;

  useEffect(() => {
    async function fetchFieldVolunteers() {
      setLoading(true);
      try {
        const data = await apiFetch<any[]>("/applications");

        const mapped: VolunteerApp[] = (data ?? [])
          .filter((row: any) => (row.volunteer_roles?.title ?? "").toLowerCase() === "field")
          .map((row: any) => {
            const profile = row.user_profiles;
            return {
              id: row.id,
              name: profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "Unknown",
              role: row.volunteer_roles?.title ?? "Field",
              description: row.motivation ?? (Array.isArray(row.skills) ? row.skills.join(", ") : row.skills) ?? "",
              appliedDate: row.applied_at ? new Date(row.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
              email: profile?.email ?? "",
              phone: profile?.phone ?? "",
              status: row.status ?? "pending",
            };
          });

        setVolunteers(mapped);
      } catch (err) {
        console.error("Error fetching field volunteers:", err);
      }
      setLoading(false);
    }
    fetchFieldVolunteers();
  }, []);

  const filteredVolunteers = volunteers.filter(
    (volunteer) =>
      volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVolunteers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVolunteers = filteredVolunteers.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: volunteers.length,
    pending: volunteers.filter((v) => v.status === "pending").length,
    approved: volunteers.filter((v) => v.status === "approved").length,
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.mainContent}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.headerTitle}>Field Applications</h1>
            <p className={styles.headerSubtitle}>
              {filteredVolunteers.length} field volunteer application{filteredVolunteers.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/volunteers" className={styles.backButton}>
            <ChevronLeft className="w-4 h-4" />
            Back to All Roles
          </Link>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard label="Total Field Applications" value={stats.total.toString()} icon="🏃" />
          <StatCard label="Pending Review" value={stats.pending.toString()} icon="⏳" />
          <StatCard label="Approved" value={stats.approved.toString()} icon="✅" />
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Applications List */}
        <div className={styles.applicationsSection}>
          <h2 className={styles.sectionTitle}>Field Volunteer Applications</h2>
          {paginatedVolunteers.length > 0 ? (
            <>
              <div className={styles.applicationsList}>
                {paginatedVolunteers.map((volunteer) => (
                  <ApplicationItem key={volunteer.id} volunteer={volunteer} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.paginationContainer}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`${styles.paginationButton} ${
                      currentPage === 1 ? styles.paginationButtonDisabled : ""
                    }`}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`${styles.paginationButton} ${
                        currentPage === page ? styles.paginationButtonActive : ""
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`${styles.paginationButton} ${
                      currentPage === totalPages ? styles.paginationButtonDisabled : ""
                    }`}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>No field applications found</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
