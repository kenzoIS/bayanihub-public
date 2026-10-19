import Link from "next/link";
import styles from "./Header.module.css";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { profile, logout } = useAuth();

  const displayName =
    profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || "Admin"
      : "Admin";

  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "A"
    : "A";
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIconBox}>
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F895651d642164b74988a81b4e99696fb%2Fb3d0b1c5feab4adcb58d0b0014788cce?format=webp&width=800&height=1200"
              alt="BayaniHub Logo"
              className={styles.logoImage}
            />
          </div>
          <span className={styles.logoText}>Admin Portal</span>
        </Link>

        <div className={styles.rightContent}>
          <button className={styles.notificationButton}>
            <svg className={styles.notificationIcon} viewBox="0 0 16 18" fill="none">
              <path d="M7.87519 0C7.25292 0 6.75019 0.502734 6.75019 1.125V1.7543C4.20136 2.15859 2.25019 4.36641 2.25019 7.03125V8.20547C2.25019 9.80156 1.70527 11.352 0.710347 12.5965L0.186519 13.2539C-0.0173877 13.507 -0.0560596 13.8551 0.0845654 14.1469C0.22519 14.4387 0.520503 14.625 0.84394 14.625H14.9064C15.2299 14.625 15.5252 14.4387 15.6658 14.1469C15.8064 13.8551 15.7678 13.507 15.5639 13.2539L15.04 12.6C14.0451 11.352 13.5002 9.80156 13.5002 8.20547V7.03125C13.5002 4.36641 11.549 2.15859 9.00019 1.7543V1.125C9.00019 0.502734 8.49746 0 7.87519 0Z" fill="currentColor" />
            </svg>
          </button>

          <div className={styles.divider} />

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {initials}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userRole}>Administrator</p>
            </div>
          </div>

          <div className={styles.divider} />

          <button
            onClick={logout}
            className={styles.logoutButton}
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
