import { useState, useMemo, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Search, X, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import styles from "./volunteer-verification.module.css";
import { apiFetch } from "@/lib/api";

interface Volunteer {
  id: number;
  name: string;
  email: string;
  status: string;
  joinDate: string;
  rating: number;
  hoursLogged: string;
  backgroundVerified: boolean;
  avatar: string;
}

function VolunteerCard({ volunteer }: { volunteer: Volunteer }) {
  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { badgeClass: string; dotClass: string; label: string } } = {
      verified: { badgeClass: styles.statusVerified, dotClass: styles.statusVerifiedDot, label: "Verified Volunteer" },
      pending: { badgeClass: styles.statusPending, dotClass: styles.statusPendingDot, label: "Pending Verification" },
      not_volunteer: { badgeClass: styles.statusNotVolunteer, dotClass: styles.statusNotVolunteerDot, label: "Not a Volunteer" },
      inactive: { badgeClass: styles.statusInactive, dotClass: styles.statusInactiveDot, label: "Inactive" },
    };
    return statusMap[status] || statusMap.inactive;
  };

  const statusInfo = getStatusInfo(volunteer.status);

  return (
    <div className={styles.volunteerCard}>
      <div className={styles.cardHeader}>
        <div className={styles.volunteerInfo}>
          <div className={styles.volunteerAvatar}>
            {volunteer.avatar}
          </div>
          <div className={styles.volunteerDetails}>
            <div className={styles.volunteerHeader}>
              <h3 className={styles.volunteerName}>{volunteer.name}</h3>
              <div className={`${styles.statusBadge} ${statusInfo.badgeClass}`}>
                <div className={statusInfo.dotClass}></div>
                {statusInfo.label}
              </div>
            </div>
            <p className={styles.volunteerEmail}>{volunteer.email}</p>
            <div className={styles.volunteerMeta}>
              <span className={styles.metaItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.metaIcon}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Joined {volunteer.joinDate}
              </span>
              {volunteer.rating > 0 && (
                <span className={styles.metaItem}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={styles.metaIcon}>
                    <polygon points="12 2 15.09 10.26 24 10.26 17.55 16.53 19.64 24.74 12 18.46 4.36 24.74 6.45 16.53 0 10.26 8.91 10.26" />
                  </svg>
                  {volunteer.rating} rating
                </span>
              )}
              <span className={styles.metaItem}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.metaIcon}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {volunteer.hoursLogged}
              </span>
              {volunteer.backgroundVerified && (
                <span className={styles.metaItem}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.metaIcon}>
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7l2.5-2.5 4-4" />
                  </svg>
                  Background verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VolunteerVerification() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Volunteer[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [allVolunteers, setAllVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVolunteers() {
      setLoading(true);
      try {
        const data = await apiFetch<any[]>("/applications?status=approved");

        const mapped: Volunteer[] = (data ?? []).map((row: any) => {
          const profile = row.user_profiles;
          const name = profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "Unknown";
          return {
            id: row.id,
            name,
            email: profile?.email ?? "",
            status: "verified",
            joinDate: row.applied_at ? new Date(row.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            rating: 4.5,
            hoursLogged: "Active volunteer",
            backgroundVerified: true,
            avatar: "👤",
          };
        });

        setAllVolunteers(mapped);
      } catch (err) {
        console.error("Error fetching volunteers:", err);
      }
      setLoading(false);
    }
    fetchVolunteers();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    try {
      const profiles = await apiFetch<any[]>(`/volunteers/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const results: Volunteer[] = (profiles ?? []).map((p: any) => {
        const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown";
        const isVolunteer = p.role === "volunteer";
        return {
          id: p.auth_user_id ?? p.id,
          name,
          email: p.email ?? "",
          status: isVolunteer ? "verified" : "not_verified",
          joinDate: "",
          rating: isVolunteer ? 4.5 : 0,
          hoursLogged: isVolunteer ? "Active volunteer" : "Not registered as volunteer",
          backgroundVerified: isVolunteer,
          avatar: "\uD83D\uDC64",
        };
      });
      setSearchResults(results);
    } catch (err) {
      console.error("Error searching volunteers:", err);
      setSearchResults([]);
    }
    setHasSearched(true);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const stats = {
    total: allVolunteers.length,
    activeThisMonth: allVolunteers.filter((v) => v.status === "verified").length,
    verified: allVolunteers.filter((v) => v.status === "verified").length,
    pending: allVolunteers.filter((v) => v.status === "pending").length,
  };

  return (
    <div className={styles.container}>
      <Head><title>Volunteer Verification | BayaniHub Admin</title></Head>
      <Header />

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div className={styles.headerRow}>
            <Link href="/volunteers" className={styles.backButton}>
              <svg className={styles.svgIcon16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className={styles.headerContent}>
              <h1 className={styles.pageTitle}>Volunteer Verification</h1>
              <p className={styles.pageSubtitle}>Check if users are registered volunteers in our system</p>
            </div>
            <div className={styles.headerSpacer} />
          </div>
        </div>

        <div className={styles.gridLayout}>
          {/* Left Column - Volunteer Lookup */}
          <div className={styles.mainColumn}>
            {/* Search Section */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Volunteer Lookup</h2>
              <p className={styles.searchDescription}>Search by Email or Name</p>

              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Enter email address or full name"
                  className={styles.searchInput}
                />
                <Search className={styles.searchIcon} />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={handleSearch}
                  className={styles.buttonPrimary}
                >
                  <Search className="w-4 h-4" />
                  Search Volunteer
                </button>
                <button
                  onClick={handleClearSearch}
                  className={styles.buttonSecondary}
                >
                  <X className="w-4 h-4" />
                  Clear Search
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Search Results</h2>

              {!hasSearched ? (
                <p className={styles.noResults}>Search for a volunteer to get started</p>
              ) : searchResults.length > 0 ? (
                <div className={styles.resultsContainer}>
                  {searchResults.map((volunteer) => (
                    <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                  ))}
                </div>
              ) : (
                <p className={styles.noResults}>No volunteers found matching "{searchQuery}"</p>
              )}
            </div>
          </div>

          {/* Right Column - Stats and Activity */}
          <div className={styles.sidebarColumn}>
            {/* Quick Stats */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Quick Stats</h2>
              <div>
                <div className={styles.statItem}>
                  <p className={styles.statLabel}>Total Volunteers</p>
                  <p className={styles.statValue}>{stats.total.toLocaleString()}</p>
                </div>
                <div className={styles.statItem}>
                  <p className={styles.statLabel}>Active This Month</p>
                  <p className={styles.statValue}>{stats.activeThisMonth.toLocaleString()}</p>
                </div>
                <div className={styles.statItem}>
                  <p className={styles.statLabel}>Verified Volunteers</p>
                  <p className={styles.statValue}>{stats.verified}</p>
                </div>
                <div className={styles.statItem}>
                  <p className={styles.statLabel}>Pending Verification</p>
                  <p className={styles.statValue}>{stats.pending}</p>
                </div>
              </div>
            </div>

            {/* Verification Status Legend */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Verification Status</h2>
              <div className={styles.statusLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></div>
                  <span className={styles.legendLabel}>Verified Volunteer</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: '#eab308' }}></div>
                  <span className={styles.legendLabel}>Pending Verification</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: '#ef4444' }}></div>
                  <span className={styles.legendLabel}>Not a Volunteer</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: '#9ca3af' }}></div>
                  <span className={styles.legendLabel}>Inactive</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Recent Activity</h2>
              <div className={styles.activityList}>
                {allVolunteers.slice(0, 5).map((v, idx) => {
                  const icon = v.status === "verified" ? "✓" : v.status === "pending" ? "⏳" : "➕";
                  const message = v.status === "verified"
                    ? `${v.name} verified as volunteer`
                    : v.status === "pending"
                    ? `${v.name} pending verification`
                    : `${v.name} registered`;
                  return (
                    <div key={idx} className={styles.activityItem}>
                      <span className={styles.activityIcon}>{icon}</span>
                      <div className={styles.activityContent}>
                        <p className={styles.activityMessage}>{message}</p>
                        <p className={styles.activityTime}>{v.joinDate}</p>
                      </div>
                    </div>
                  );
                })}
                {allVolunteers.length === 0 && (
                  <p style={{ color: "#888", fontSize: "0.875rem" }}>No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>


      </main>

      <Footer />
    </div>
  );
}
