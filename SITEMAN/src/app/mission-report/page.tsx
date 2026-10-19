"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import styles from "../scan-qr/page.module.css";

export default function MissionReportPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
        const res = await fetch(`${baseUrl}/api/missions/report`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to load report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.scanContainer}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>📊 Final Mission Report</h1>
          <p className={styles.pageSubtitle}>Aggregate data from archived session data.</p>
        </div>

        {loading ? (
          <div className={styles.statusBar} style={{ justifyContent: 'center' }}>
            <div className={styles.spinner} /> Loading Mission Data...
          </div>
        ) : report ? (
          <div className={styles.resultCard}>
            <div className={styles.resultHeader} style={{ backgroundColor: '#10b981' }}>
              <div className={styles.resultHeaderText}>
                <h3>Mission Success Metrics</h3>
                <p>Overall Volunteer & Donation Output</p>
              </div>
            </div>
            <div className={styles.resultBody}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Total Reconciled Donations</span>
                <span className={styles.resultValue} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>
                  {report.mission_summary.total_donations_reconciled} items
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Total Volunteer Man-Hours</span>
                <span className={styles.resultValue} style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
                  {report.mission_summary.total_volunteer_man_hours} hrs
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Mission Success Rate</span>
                <span className={styles.resultValue} style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {report.mission_summary.mission_success_rate_percent}%
                </span>
              </div>
              <div className={styles.divider} />
              <div className={styles.resultSectionTitle}>Archived Data Points</div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Completed Shifts</span>
                <span className={styles.resultValue}>{report.archived_data_points.completed_shifts}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Reconciled Drop-offs</span>
                <span className={styles.resultValue}>{report.archived_data_points.reconciled_dropoffs}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.statusBar} style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            ⚠️ Failed to load report data.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
