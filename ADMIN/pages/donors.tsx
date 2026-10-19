import { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./donors.module.css";
import { apiFetch } from "@/lib/api";

interface DonorApplication {
  id: string;
  name: string;
  donationDetails: string;
  status: string;
  location: string;
  phone: string;
  condition: string;
  unit: string;
  campaignTitle: string;
  message: string;
  referenceNumber: string;
  submittedDateLabel: string;
}

type DonorFilter = "All Applications" | "Pending Review" | "Accepted" | "Rejected";

const DONOR_FILTERS: DonorFilter[] = ["All Applications", "Pending Review", "Accepted", "Rejected"];



function getStatusLabel(status: string) {
  if (status === "confirmed" || status === "completed") return "Accepted";
  if (status === "failed" || status === "refunded") return "Rejected";
  return "Pending Review";
}

function matchesFilter(status: string, filter: DonorFilter) {
  if (filter === "All Applications") return true;
  if (filter === "Pending Review") return status === "pending";
  if (filter === "Accepted") return status === "confirmed" || status === "completed";
  return status === "failed" || status === "refunded";
}

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
      {helper && <p className={styles.statHelper}>{helper}</p>}
    </div>
  );
}

function DonorApplicationItem({
  donor,
  busyAction,
  onReview,
  onApprove,
  onReject,
}: {
  donor: DonorApplication;
  busyAction: string | null;
  onReview: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const statusLabel = getStatusLabel(donor.status);
  const statusClass =
    statusLabel === "Accepted"
      ? styles.statusAccepted
      : statusLabel === "Rejected"
        ? styles.statusRejected
        : styles.statusPending;
  const isBusy = busyAction?.startsWith(`${donor.id}:`);

  return (
    <div className={styles.applicationItem}>
      <div className={styles.applicationContent}>
        <div className={styles.applicationAvatar}>
          <svg className={styles.avatarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div className={styles.applicationInfo}>
          <div className={styles.applicationHeader}>
            <h3 className={styles.applicationName}>{donor.name}</h3>
            <span className={styles.amountBadge}>{donor.donationDetails}</span>
          </div>

          <p className={styles.applicationDescription}>
            {donor.message || "No donor message was included with this contribution."}
          </p>

          <div className={styles.applicationMeta}>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {donor.submittedDateLabel}
            </span>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {donor.phone || "No contact number"}
            </span>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {donor.location || "Location unavailable"}
            </span>
            <span className={styles.metaItem}>
              <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              {donor.condition}
            </span>
          </div>

          <div className={styles.tagsRow}>
            {donor.campaignTitle && <span className={styles.infoTag}>{donor.campaignTitle}</span>}
            {donor.unit && <span className={styles.infoTag}>Unit: {donor.unit}</span>}
            <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
          </div>
        </div>
      </div>

      <div className={styles.applicationActions}>
        <button onClick={() => onReview(donor.id)} className={styles.reviewButton}>
          <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Review
        </button>
        {donor.status === "pending" && (
          <>
            <button
              onClick={() => onApprove(donor.id)}
              className={`${styles.actionButton} ${styles.actionButtonApprove}`}
              disabled={isBusy}
            >
              <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {busyAction === `${donor.id}:approve` ? "Saving..." : "Accept"}
            </button>
            <button
              onClick={() => onReject(donor.id)}
              className={`${styles.actionButton} ${styles.actionButtonReject}`}
              disabled={isBusy}
            >
              <svg className={styles.svg14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              {busyAction === `${donor.id}:reject` ? "Saving..." : "Reject"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Donors() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<DonorFilter>("All Applications");
  const [currentPage, setCurrentPage] = useState(1);
  const [donors, setDonors] = useState<DonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const itemsPerPage = 4;

  useEffect(() => {
    async function fetchDonors() {
      setLoading(true);
      try {
        const data = await apiFetch<any[]>("/donors");

        const mapped: DonorApplication[] = (data ?? []).map((row: any) => {
          const profile = row.user_profiles;
          const fullName = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "";
          const donatedAt = row.donated_at ? new Date(row.donated_at) : null;

          return {
            id: row.id,
            name: row.anonymous ? "Anonymous Donor" : fullName || "Unknown Donor",
            donationDetails: row.item_name ? `${row.quantity ?? 1}x ${row.item_name}` : "General Goods Donation",
            status: row.status ?? "pending",
            location: profile
              ? `${profile.municipality ?? ""}, ${profile.province ?? ""}`.replace(/^, |, $/g, "")
              : "",
            phone: profile?.phone ?? "",
            condition: row.condition ?? "Brand New",
            unit: row.unit ?? "pcs",
            campaignTitle: row.bh_campaigns?.title ?? "",
            message: row.message ?? "",
            referenceNumber: row.transaction_ref ?? row.id,
            submittedDateLabel: donatedAt
              ? donatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Date unavailable",
          };
        });

        setDonors(mapped);
      } catch (err) {
        console.error("Error fetching donors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDonors();
  }, []);

  const handleStatusUpdate = async (id: string, nextStatus: "confirmed" | "failed") => {
    if (busyAction) return;

    const action = nextStatus === "confirmed" ? "approve" : "reject";
    setBusyAction(`${id}:${action}`);

    try {
      await apiFetch(`/donors/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });

      setDonors((prev) => prev.map((donor) => (donor.id === id ? { ...donor, status: nextStatus } : donor)));
    } catch (err) {
      console.error(`Error updating donor ${id}:`, err);
    } finally {
      setBusyAction(null);
    }
  };

  const filteredDonors = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return donors.filter((donor) => {
      const matchesFilterTab = matchesFilter(donor.status, selectedFilter);
      const matchesSearch =
        !needle ||
        donor.name.toLowerCase().includes(needle) ||
        donor.location.toLowerCase().includes(needle) ||
        donor.campaignTitle.toLowerCase().includes(needle) ||
        donor.referenceNumber.toLowerCase().includes(needle);

      return matchesFilterTab && matchesSearch;
    });
  }, [donors, searchTerm, selectedFilter]);

  const totalPages = Math.ceil(filteredDonors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDonors = filteredDonors.slice(startIndex, startIndex + itemsPerPage);

  const stats = useMemo(() => {
    return {
      total: donors.length,
      pending: donors.filter((donor) => donor.status === "pending").length,
      accepted: donors.filter((donor) => donor.status === "confirmed" || donor.status === "completed").length,
      rejected: donors.filter((donor) => donor.status === "failed" || donor.status === "refunded").length,
    };
  }, [donors]);

  return (
    <div className={styles.container}>
      <Head><title>Donors | BayaniHub Admin</title></Head>
      <Header />

      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <Link href="/" className={styles.backButton}>
            <svg className={styles.svg16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <div className={styles.headerCenter}>
            <div className={styles.headerIcon}>
              <svg className={styles.svg20} viewBox="0 0 24 24" fill="none" stroke="#5C6ED5" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <h1 className={styles.headerTitle}>Donor Applications</h1>
            </div>
          </div>
          <div className={styles.headerSpacer} />
        </div>

        {loading ? (
          <div className={styles.noApplications}>
            <p className={styles.noApplicationsText}>Loading donor applications from Supabase...</p>
          </div>
        ) : (
          <>
            <div className={styles.queueSection}>
              <div className={styles.queueHeader}>
                <h2 className={styles.queueTitle}>Donation Review Queue</h2>
                <p className={styles.queueSubtitle}>
                  Review incoming donor applications, verify payment details, and accept or reject submissions.
                </p>
              </div>

              <div className={styles.statsGrid}>
                <StatCard label="Total Applications" value={stats.total.toString()} />
                <StatCard label="Pending Review" value={stats.pending.toString()} />
                <StatCard label="Accepted" value={stats.accepted.toString()} />
                <StatCard label="Rejected" value={stats.rejected.toString()} />
              </div>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.searchContainer}>
                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search donor, location, campaign, or reference..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.searchInput}
                />
              </div>

              <div className={styles.filterButtonsContainer}>
                {DONOR_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setSelectedFilter(filter);
                      setCurrentPage(1);
                    }}
                    className={`${styles.filterButton} ${selectedFilter === filter ? styles.filterButtonActive : ""}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.applicationsList}>
              {paginatedDonors.length > 0 ? (
                paginatedDonors.map((donor) => (
                  <DonorApplicationItem
                    key={donor.id}
                    donor={donor}
                    busyAction={busyAction}
                    onReview={(nextId) => router.push(`/donor/${nextId}`)}
                    onApprove={(nextId) => handleStatusUpdate(nextId, "confirmed")}
                    onReject={(nextId) => handleStatusUpdate(nextId, "failed")}
                  />
                ))
              ) : (
                <div className={styles.noApplications}>
                  <p className={styles.noApplicationsText}>No donor applications found for this filter.</p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationContainer}>
                <p className={styles.paginationInfo}>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredDonors.length)} of{" "}
                  {filteredDonors.length} donor applications
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
