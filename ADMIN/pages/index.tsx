import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./index.module.css";
import { apiFetch } from "@/lib/api";

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <div className={styles.statIconBox}>{icon}</div>

      </div>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function QuickAccessCard({ icon, title, description, buttonLabel, href, lastUpdated }: { icon: React.ReactNode; title: string; description: string; buttonLabel: string; href: string; lastUpdated: string }) {
  return (
    <div className={styles.quickCard}>
      <div className={styles.quickCardContent}>
        <div className={styles.quickCardIconBox}>{icon}</div>
        <h4 className={styles.quickCardTitle}>{title}</h4>
        <p className={styles.quickCardDescription}>{description}</p>
        <Link href={href} className={styles.quickCardButton}>
          {buttonLabel}&nbsp;
          <svg width="13" height="14" viewBox="0 0 13 14" fill="none">
            <g clipPath="url(#arrow-clip)">
              <path d="M11.993 7.61794C12.3348 7.27615 12.3348 6.72107 11.993 6.37927L7.61797 2.00427C7.27617 1.66248 6.72109 1.66248 6.3793 2.00427C6.0375 2.34607 6.0375 2.90115 6.3793 3.24294L9.26406 6.12498H0.875C0.391016 6.12498 0 6.51599 0 6.99998C0 7.48396 0.391016 7.87498 0.875 7.87498H9.26133L6.38203 10.757C6.04023 11.0988 6.04023 11.6539 6.38203 11.9957C6.72383 12.3375 7.27891 12.3375 7.6207 11.9957L11.9957 7.62068L11.993 7.61794Z" fill="white" />
            </g>
            <defs><clipPath id="arrow-clip"><path d="M0 0H12.25V14H0V0Z" fill="white" /></clipPath></defs>
          </svg>
        </Link>
      </div>
      <div className={styles.quickCardFooter}>
        <span className={styles.quickCardFooterLabel}>Last updated</span>
        <span className={styles.quickCardFooterValue}>{lastUpdated}</span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, subtitle, time }: { icon: React.ReactNode; title: string; subtitle: string; time: string }) {
  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIconBox}>{icon}</div>
      <div className={styles.activityContent}>
        <p className={styles.activityTitle}>{title}</p>
        <p className={styles.activitySubtitle}>{subtitle}</p>
      </div>
      <span className={styles.activityTime}>{time}</span>
    </div>
  );
}

const DonorIcon = () => (
  <svg width="25" height="20" viewBox="0 0 25 20" fill="none">
    <g clipPath="url(#donor-clip)">
      <path d="M5.625 0C6.4538 0 7.24866 0.32924 7.83471 0.915291C8.42076 1.50134 8.75 2.2962 8.75 3.125C8.75 3.9538 8.42076 4.74866 7.83471 5.33471C7.24866 5.92076 6.4538 6.25 5.625 6.25C4.7962 6.25 4.00134 5.92076 3.41529 5.33471C2.82924 4.74866 2.5 3.9538 2.5 3.125C2.5 2.2962 2.82924 1.50134 3.41529 0.915291C4.00134 0.32924 4.7962 0 5.625 0ZM20 0C20.8288 0 21.6237 0.32924 22.2097 0.915291C22.7958 1.50134 23.125 2.2962 23.125 3.125C23.125 3.9538 22.7958 4.74866 22.2097 5.33471C21.6237 5.92076 20.8288 6.25 20 6.25C19.1712 6.25 18.3763 5.92076 17.7903 5.33471C17.2042 4.74866 16.875 3.9538 16.875 3.125C16.875 2.2962 17.2042 1.50134 17.7903 0.915291C18.3763 0.32924 19.1712 0 20 0ZM0 11.668C0 9.36719 1.86719 7.5 4.16797 7.5H5.83594C6.45703 7.5 7.04688 7.63672 7.57812 7.87891C7.52734 8.16016 7.50391 8.45312 7.50391 8.75C7.50391 10.2422 8.16016 11.582 9.19531 12.5C9.1875 12.5 9.17969 12.5 9.16797 12.5H0.832031C0.375 12.5 0 12.125 0 11.668ZM15.832 12.5C15.8242 12.5 15.8164 12.5 15.8047 12.5C16.8438 11.582 17.4961 10.2422 17.4961 8.75C17.4961 8.45312 17.4688 8.16406 17.4219 7.87891C17.9531 7.63281 18.543 7.5 19.1641 7.5H20.832C23.1328 7.5 25 9.36719 25 11.668C25 12.1289 24.625 12.5 24.168 12.5H15.832ZM8.75 8.75C8.75 7.75544 9.14509 6.80161 9.84835 6.09835C10.5516 5.39509 11.5054 5 12.5 5C13.4946 5 14.4484 5.39509 15.1517 6.09835C15.8549 6.80161 16.25 7.75544 16.25 8.75C16.25 9.74456 15.8549 10.6984 15.1517 11.4017C14.4484 12.1049 13.4946 12.5 12.5 12.5C11.5054 12.5 10.5516 12.1049 9.84835 11.4017C9.14509 10.6984 8.75 9.74456 8.75 8.75ZM5 18.957C5 16.082 7.33203 13.75 10.207 13.75H14.793C17.668 13.75 20 16.082 20 18.957C20 19.5312 19.5352 20 18.957 20H6.04297C5.46875 20 5 19.5352 5 18.957Z" fill="white" />
    </g>
    <defs><clipPath id="donor-clip"><path d="M0 0H25V20H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const VolunteerIcon = () => (
  <svg width="25" height="20" viewBox="0 0 25 20" fill="none">
    <g clipPath="url(#vol-clip)">
      <path d="M21.25 9.6875V9.81641L23.9727 7.09375C24.8281 6.23828 24.8281 4.85547 23.9727 4L20.9219 0.953125C20.0664 0.0976562 18.6836 0.0976562 17.8281 0.953125L16.2617 2.51953C16.1562 2.50781 16.0469 2.5 15.9375 2.5H11.5625C10.1133 2.5 8.92188 3.59375 8.76562 5H8.75V9.6875C8.75 10.5508 9.44922 11.25 10.3125 11.25C11.1758 11.25 11.875 10.5508 11.875 9.6875V6.875V6.87109V6.25H12.5H17.8125C17.8125 6.25 17.8125 6.25 17.8164 6.25H18.125C19.8516 6.25 21.25 7.64844 21.25 9.375V9.6875ZM13.125 7.5V9.6875C13.125 11.2422 11.8672 12.5 10.3125 12.5C8.75781 12.5 7.5 11.2422 7.5 9.6875V5.05469C6.09766 5.29687 4.92969 6.31641 4.53125 7.71875L3.88672 9.96875L1.02734 12.8281C0.171875 13.6836 0.171875 15.0664 1.02734 15.9219L4.07812 18.9727C4.93359 19.8281 6.31641 19.8281 7.17188 18.9727L8.64453 17.5C8.67969 17.5 8.71484 17.5039 8.75 17.5039H15C16.0352 17.5039 16.875 16.6641 16.875 15.6289C16.875 15.4102 16.8359 15.1992 16.7695 15.0039H16.875C17.9102 15.0039 18.75 14.1641 18.75 13.1289C18.75 12.6289 18.5547 12.1758 18.2344 11.8398C19.2383 11.6445 19.9961 10.7617 20 9.69922V9.68359C19.9961 8.48047 19.0195 7.50391 17.8125 7.50391H13.125V7.5Z" fill="white" />
    </g>
    <defs><clipPath id="vol-clip"><path d="M0 0H25V20H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const InventoryStatIcon = () => (
  <svg width="23" height="20" viewBox="0 0 23 20" fill="none">
    <g clipPath="url(#inv-stat-clip)">
      <path d="M9.6875 0H8.125C7.08984 0 6.25 0.839844 6.25 1.875V6.25C6.25 7.62891 7.37109 8.75 8.75 8.75H13.75C15.1289 8.75 16.25 7.62891 16.25 6.25V1.875C16.25 0.839844 15.4102 0 14.375 0H12.8125V3.125C12.8125 3.46875 12.5312 3.75 12.1875 3.75H10.3125C9.96875 3.75 9.6875 3.46875 9.6875 3.125V0ZM2.5 10C1.12109 10 0 11.1211 0 12.5V17.5C0 18.8789 1.12109 20 2.5 20H8.75C10.1289 20 11.25 18.8789 11.25 17.5V12.5C11.25 11.1211 10.1289 10 8.75 10H7.1875V13.125C7.1875 13.4688 6.90625 13.75 6.5625 13.75H4.6875C4.34375 13.75 4.0625 13.4688 4.0625 13.125V10H2.5ZM13.75 20H20C21.3789 20 22.5 18.8789 22.5 17.5V12.5C22.5 11.1211 21.3789 10 20 10H18.4375V13.125C18.4375 13.4688 18.1562 13.75 17.8125 13.75H15.9375C15.5938 13.75 15.3125 13.4688 15.3125 13.125V10H13.75C13.1641 10 12.625 10.1992 12.1992 10.5391C12.3906 10.9453 12.5 11.3984 12.5 11.875V18.125C12.5 18.6016 12.3906 19.0547 12.1992 19.4609C12.625 19.8008 13.1641 20 13.75 20Z" fill="white" />
    </g>
    <defs><clipPath id="inv-stat-clip"><path d="M0 0H22.5V20H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const DonorMgmtIcon = () => (
  <svg width="27" height="24" viewBox="0 0 27 24" fill="none">
    <g clipPath="url(#donor-mgmt-clip)">
      <path d="M6.9375 3.59062C6.9375 1.60781 8.54531 0 10.5281 0C11.4797 0 12.3938 0.379687 13.0641 1.05L13.5 1.48594L13.9359 1.05C14.6062 0.379687 15.5203 0 16.4719 0C18.4547 0 20.0625 1.60781 20.0625 3.59062C20.0625 4.54219 19.6828 5.45625 19.0125 6.12656L14.1609 10.9734C13.7953 11.3391 13.2 11.3391 12.8344 10.9734L7.9875 6.12656C7.31719 5.45625 6.9375 4.54219 6.9375 3.59062ZM26.6344 15.7641C27.2484 16.5984 27.0703 17.7703 26.2359 18.3844L20.3016 22.7578C19.2047 23.5641 17.8828 24 16.5187 24H9H1.5C0.670312 24 0 23.3297 0 22.5V19.5C0 18.6703 0.670312 18 1.5 18H3.225L5.32969 16.3125C6.39375 15.4594 7.71562 15 9.07969 15H12.75H13.5H16.5C17.3297 15 18 15.6703 18 16.5C18 17.3297 17.3297 18 16.5 18H13.5H12.75C12.3375 18 12 18.3375 12 18.75C12 19.1625 12.3375 19.5 12.75 19.5H18.4031L24.0141 15.3656C24.8484 14.7516 26.0203 14.9297 26.6344 15.7641ZM9.075 18H9.03281C9.04688 18 9.06094 18 9.075 18Z" fill="white" />
    </g>
    <defs><clipPath id="donor-mgmt-clip"><path d="M0 0H27V24H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const VolMgmtIcon = () => (
  <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
    <g clipPath="url(#vol-mgmt-clip)">
      <path d="M4.5 6C4.5 4.4087 5.13214 2.88258 6.25736 1.75736C7.38258 0.632141 8.9087 0 10.5 0C12.0913 0 13.6174 0.632141 14.7426 1.75736C15.8679 2.88258 16.5 4.4087 16.5 6C16.5 7.5913 15.8679 9.11742 14.7426 10.2426C13.6174 11.3679 12.0913 12 10.5 12C8.9087 12 7.38258 11.3679 6.25736 10.2426C5.13214 9.11742 4.5 7.5913 4.5 6ZM0 22.6078C0 17.9906 3.74063 14.25 8.35781 14.25H12.6422C17.2594 14.25 21 17.9906 21 22.6078C21 23.3766 20.3766 24 19.6078 24H1.39219C0.623438 24 0 23.3766 0 22.6078ZM28.5609 24H22.0969C22.35 23.5594 22.5 23.0484 22.5 22.5V22.125C22.5 19.2797 21.2297 16.725 19.2281 15.0094C19.3406 15.0047 19.4484 15 19.5609 15H22.4391C26.6156 15 30 18.3844 30 22.5609C30 23.3578 29.3531 24 28.5609 24ZM20.25 12C18.7969 12 17.4844 11.4094 16.5328 10.4578C17.4563 9.21094 18 7.66875 18 6C18 4.74375 17.6906 3.55781 17.1422 2.51719C18.0141 1.87969 19.0875 1.5 20.25 1.5C23.1516 1.5 25.5 3.84844 25.5 6.75C25.5 9.65156 23.1516 12 20.25 12Z" fill="white" />
    </g>
    <defs><clipPath id="vol-mgmt-clip"><path d="M0 0H30V24H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const InvMgmtIcon = () => (
  <svg width="30" height="24" viewBox="0 0 30 24" fill="none">
    <g clipPath="url(#inv-mgmt-clip)">
      <path d="M0 22.875V8.02964C0 6.80151 0.745313 5.69995 1.88438 5.24526L14.4422 0.224951C14.7984 0.0796387 15.1969 0.0796387 15.5578 0.224951L28.1156 5.24526C29.2547 5.69995 30 6.8062 30 8.02964V22.875C30 23.4984 29.4984 24 28.875 24H26.625C26.0016 24 25.5 23.4984 25.5 22.875V10.5C25.5 9.67026 24.8297 8.99995 24 8.99995H6C5.17031 8.99995 4.5 9.67026 4.5 10.5V22.875C4.5 23.4984 3.99844 24 3.375 24H1.125C0.501562 24 0 23.4984 0 22.875ZM22.875 24H7.125C6.50156 24 6 23.4984 6 22.875V20.25H24V22.875C24 23.4984 23.4984 24 22.875 24ZM6 18.75V15.75H24V18.75H6ZM6 14.25V10.5H24V14.25H6Z" fill="white" />
    </g>
    <defs><clipPath id="inv-mgmt-clip"><path d="M0 0H30V24H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const ActivityDonorIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <g clipPath="url(#act-donor-clip)">
      <path d="M3 4C3 2.93913 3.42143 1.92172 4.17157 1.17157C4.92172 0.421427 5.93913 0 7 0C8.06087 0 9.07828 0.421427 9.82843 1.17157C10.5786 1.92172 11 2.93913 11 4C11 5.06087 10.5786 6.07828 9.82843 6.82843C9.07828 7.57857 8.06087 8 7 8C5.93913 8 4.92172 7.57857 4.17157 6.82843C3.42143 6.07828 3 5.06087 3 4ZM0 15.0719C0 11.9937 2.49375 9.5 5.57188 9.5H8.42813C11.5063 9.5 14 11.9937 14 15.0719C14 15.5844 13.5844 16 13.0719 16H0.928125C0.415625 16 0 15.5844 0 15.0719ZM15.75 9.75V7.75H13.75C13.3344 7.75 13 7.41563 13 7C13 6.58437 13.3344 6.25 13.75 6.25H15.75V4.25C15.75 3.83437 16.0844 3.5 16.5 3.5C16.9156 3.5 17.25 3.83437 17.25 4.25V6.25H19.25C19.6656 6.25 20 6.58437 20 7C20 7.41563 19.6656 7.75 19.25 7.75H17.25V9.75C17.25 10.1656 16.9156 10.5 16.5 10.5C16.0844 10.5 15.75 10.1656 15.75 9.75Z" fill="#404040" />
    </g>
    <defs><clipPath id="act-donor-clip"><path d="M0 0H20V16H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

const ActivityInventoryIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <path d="M14 16H0V0H14V16Z" stroke="#E5E7EB" />
    <path d="M1.58438 1.82812L0 5H6.5V1H2.92812C2.35938 1 1.84063 1.32187 1.58438 1.82812ZM7.5 5H14L12.4156 1.82812C12.1594 1.32187 11.6406 1 11.0719 1H7.5V5ZM14 6H0V13C0 14.1031 0.896875 15 2 15H12C13.1031 15 14 14.1031 14 13V6Z" fill="#404040" />
  </svg>
);

const ActivityCalendarIcon = () => (
  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
    <g clipPath="url(#act-cal-clip)">
      <path d="M4 0C4.55312 0 5 0.446875 5 1V2H9V1C9 0.446875 9.44687 0 10 0C10.5531 0 11 0.446875 11 1V2H12.5C13.3281 2 14 2.67188 14 3.5V5H0V3.5C0 2.67188 0.671875 2 1.5 2H3V1C3 0.446875 3.44688 0 4 0ZM0 6H14V14.5C14 15.3281 13.3281 16 12.5 16H1.5C0.671875 16 0 15.3281 0 14.5V6ZM10.2812 9.53125C10.575 9.2375 10.575 8.7625 10.2812 8.47188C9.9875 8.18125 9.5125 8.17813 9.22188 8.47188L6.25313 11.4406L4.78438 9.97188C4.49063 9.67813 4.01562 9.67813 3.725 9.97188C3.43437 10.2656 3.43125 10.7406 3.725 11.0312L5.725 13.0312C6.01875 13.325 6.49375 13.325 6.78438 13.0312L10.2812 9.53125Z" fill="#404040" />
    </g>
    <defs><clipPath id="act-cal-clip"><path d="M0 0H14V16H0V0Z" fill="white" /></clipPath></defs>
  </svg>
);

function getTimeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function Index() {
  const [donorCount, setDonorCount] = useState("...");
  const [volunteerCount, setVolunteerCount] = useState("...");
  const [inventoryCount, setInventoryCount] = useState("...");
  const [recentActivity, setRecentActivity] = useState<{ type: string; title: string; subtitle: string; time: string }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<{ donors: string | null; volunteers: string | null; inventory: string | null }>({ donors: null, volunteers: null, inventory: null });

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await apiFetch<{
          stats: {
            activeDonors: number;
            volunteers: number;
            inventoryItems: number;
            lastUpdated: { donors: string | null; volunteers: string | null; inventory: string | null };
          };
          recentActivity: { type: string; title: string; subtitle: string; time: string }[];
        }>("/dashboard");
        setDonorCount(data.stats.activeDonors.toLocaleString());
        setVolunteerCount(data.stats.volunteers.toLocaleString());
        setInventoryCount(data.stats.inventoryItems.toLocaleString());
        setRecentActivity(data.recentActivity);
        setLastUpdated(data.stats.lastUpdated || { donors: null, volunteers: null, inventory: null });
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <div className={styles.container}>
      <Head><title>Dashboard | BayaniHub Admin</title></Head>
      <Header />
      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeHeader}>
            <svg className={styles.welcomeIcon} viewBox="0 0 30 30" fill="none">
              <path d="M16.875 1.875C16.875 0.837891 16.0372 0 15 0C13.9629 0 13.125 0.837891 13.125 1.875V14.0625C13.125 14.5781 12.7032 15 12.1875 15C11.6719 15 11.25 14.5781 11.25 14.0625V3.75C11.25 2.71289 10.4122 1.875 9.37504 1.875C8.33793 1.875 7.50004 2.71289 7.50004 3.75V19.6875C7.50004 19.7754 7.50004 19.8691 7.5059 19.957L3.96098 16.582C3.02348 15.6914 1.54106 15.7266 0.644573 16.6641C-0.251912 17.6016 -0.210896 19.084 0.726604 19.9805L7.31254 26.25C9.83793 28.6582 13.1954 30 16.6875 30H17.8125C23.5079 30 28.125 25.3828 28.125 19.6875V7.5C28.125 6.46289 27.2872 5.625 26.25 5.625C25.2129 5.625 24.375 6.46289 24.375 7.5V14.0625C24.375 14.5781 23.9532 15 23.4375 15C22.9219 15 22.5 14.5781 22.5 14.0625V3.75C22.5 2.71289 21.6622 1.875 20.625 1.875C19.5879 1.875 18.75 2.71289 18.75 3.75V14.0625C18.75 14.5781 18.3282 15 17.8125 15C17.2969 15 16.875 14.5781 16.875 14.0625V1.875Z" fill="#5C6ED5" />
            </svg>
            <h1 className={styles.welcomeTitle}>Welcome Admin!</h1>
          </div>
          <p className={styles.welcomeSubtitle}>Manage your system efficiently from this dashboard</p>
        </section>

        <section className={styles.statsSection}>
          <StatCard value={donorCount} label="Active Donors" icon={<DonorIcon />} />
          <StatCard value={volunteerCount} label="Volunteers" icon={<VolunteerIcon />} />
          <StatCard value={inventoryCount} label="Inventory Items" icon={<InventoryStatIcon />} />
        </section>

        <section className={styles.quickAccessSection}>
          <h3 className={styles.sectionTitle}>Quick Access</h3>
          <div className={styles.quickAccessGrid}>
            <QuickAccessCard
              href="/donors"
              title="Donor Management"
              description="View and manage all donor profiles, donations, and contribution history"
              buttonLabel="Go to Donors"
              lastUpdated={getTimeAgo(lastUpdated.donors)}
              icon={<img src="https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2F8190f17c28a14ae286e49066e6180c07?format=webp&width=800&height=1200" alt="Donor Management" style={{width:"100%",height:"100%",objectFit:"contain"}} />}
            />
            <QuickAccessCard
              href="/volunteers"
              title="Volunteer Management"
              description="Coordinate volunteers, track activities, and manage schedules efficiently"
              buttonLabel="Go to Volunteers"
              lastUpdated={getTimeAgo(lastUpdated.volunteers)}
              icon={<img src="https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2F5964804a127d4962a95e64f331076dde?format=webp&width=800&height=1200" alt="Volunteer Management" style={{width:"100%",height:"100%",objectFit:"cover"}} />}
            />
            <QuickAccessCard
              href="/inventory"
              title="Inventory Management"
              description="Monitor stock levels, track items, and manage inventory distribution"
              buttonLabel="Go to Inventory"
              lastUpdated={getTimeAgo(lastUpdated.inventory)}
              icon={<img src="https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Fbea1e19526874c8fbec15087d7d78d91?format=webp&width=800&height=1200" alt="Inventory Management" style={{width:"100%",height:"100%",objectFit:"cover"}} />}
            />
          </div>
        </section>

        <section className={styles.quickAccessSection}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <div className={styles.activitySection}>
            {recentActivity.length === 0 ? (
              <p style={{ color: "#888", padding: "1rem" }}>No recent activity</p>
            ) : (
              recentActivity.map((activity, idx) => {
                const icon =
                  activity.type === "donation" ? <ActivityDonorIcon /> :
                  activity.type === "campaign" ? <ActivityInventoryIcon /> :
                  <ActivityCalendarIcon />;
                const timeAgo = getTimeAgo(activity.time);
                return (
                  <ActivityItem
                    key={idx}
                    title={activity.title}
                    subtitle={activity.subtitle}
                    time={timeAgo}
                    icon={icon}
                  />
                );
              })
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
