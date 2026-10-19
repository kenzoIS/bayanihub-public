import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import styles from "./approval-status.module.css";
import { apiFetch } from "@/lib/api";

export default function ApprovalStatus() {
  const router = useRouter();
  const { applicationId } = router.query;
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrType, setQrType] = useState<string>("deployment");

  const applicationData = {
    id: applicationId ? `#APP-${String(applicationId).slice(0, 8).toUpperCase()}` : "#APP-UNKNOWN",
    submittedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    approvedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    processingTime: "Same day",
  };

  const nextSteps = [
    {
      step: 1,
      title: "Generate the Deployment QR Code",
      description: "Click the button below to generate a QR code for this volunteer.",
    },
    {
      step: 2,
      title: "Volunteer receives the QR Code",
      description: "The QR code will be sent to the volunteer for on-site verification.",
    },
    {
      step: 3,
      title: "Site Manager scans QR on arrival",
      description: "The site manager scans the QR to verify volunteer identity and assignment.",
    },
  ];

  const handleGenerateQr = async () => {
    if (!applicationId || qrLoading) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const result = await apiFetch<any>("/qr/generate", {
        method: "POST",
        body: JSON.stringify({
          application_id: applicationId,
          qr_type: qrType,
        }),
      });
      setQrUrl(result.public_url);
    } catch (err: any) {
      setQrError(err?.message ?? "Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head><title>Application Approved | BayaniHub Admin</title></Head>
      <Header />

      <main className={styles.mainContent}>
        {/* Success Icon */}
        <div className={styles.iconContainer}>
          <div className={styles.successCircle}>
            <svg className={styles.successIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Title and Message */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Application Approved!</h1>
          <p className={styles.subtitle}>
            Congratulations! The application has been successfully approved. Generate a QR code for deployment.
          </p>
        </div>

        {/* Application Details */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Application Details</h2>
          <div className={styles.detailsGrid}>
            <div className={`${styles.detailColumn} ${styles.detailColumnBorderRight}`}>
              <div className={styles.detailPadding}>
                <p className={styles.detailLabel}>Application ID</p>
                <p className={styles.detailValue}>{applicationData.id}</p>
              </div>
            </div>
            <div className={styles.detailColumn}>
              <p className={styles.detailLabel}>Submitted Date</p>
              <p className={styles.detailValue}>{applicationData.submittedDate}</p>
            </div>
            <div className={`${styles.detailColumn} ${styles.detailColumnBorderRight}`}>
              <div className={styles.detailPadding}>
                <p className={styles.detailLabel}>Approved Date</p>
                <p className={styles.detailValue}>{applicationData.approvedDate}</p>
              </div>
            </div>
            <div className={styles.detailColumn}>
              <p className={styles.detailLabel}>Processing Time</p>
              <p className={styles.detailValue}>{applicationData.processingTime}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Next Steps</h2>
          <div className={styles.stepsContainer}>
            {nextSteps.map((item) => (
              <div key={item.step} className={styles.stepItem}>
                <div className={styles.stepNumber}>{item.step}</div>
                <div className={styles.stepContent}>
                  <p className={styles.stepTitle}>{item.title}</p>
                  <p className={styles.stepDescription}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Code Generation */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span style={{ marginRight: '0.5rem' }}>📱</span>
            Generate QR Code
          </h2>

          {/* QR Type Selector */}
          <div className={styles.qrTypeSelector}>
            <label className={styles.qrTypeLabel}>QR Code Type</label>
            <div className={styles.qrTypeButtons}>
              <button
                className={`${styles.qrTypeBtn} ${qrType === "deployment" ? styles.qrTypeBtnActive : ""}`}
                onClick={() => setQrType("deployment")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Deployment
              </button>
              <button
                className={`${styles.qrTypeBtn} ${qrType === "deployment_inventory" ? styles.qrTypeBtnActive : ""}`}
                onClick={() => setQrType("deployment_inventory")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                Deployment + Inventory
              </button>
              <button
                className={`${styles.qrTypeBtn} ${qrType === "drop_off" ? styles.qrTypeBtnActive : ""}`}
                onClick={() => setQrType("drop_off")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Drop Off Only
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateQr}
            className={styles.generateQrButton}
            disabled={qrLoading || !applicationId}
          >
            {qrLoading ? (
              <>
                <span className={styles.spinner}></span>
                Generating...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Generate QR Code
              </>
            )}
          </button>

          {qrError && (
            <p className={styles.qrError}>{qrError}</p>
          )}

          {/* QR Code Display */}
          {qrUrl && (
            <div className={styles.qrDisplay}>
              <div className={styles.qrImageWrapper}>
                <img src={qrUrl} alt="Generated QR Code" className={styles.qrImage} />
              </div>
              <p className={styles.qrCaption}>
                QR Code generated successfully. This code contains the volunteer's deployment information.
              </p>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.downloadQrButton}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download QR Code
              </a>
            </div>
          )}
        </div>

        {/* Back Links */}
        <div className={styles.linkContainer}>
          <button
            onClick={() => router.push("/volunteers")}
            className={styles.link}
          >
            Back to Volunteer Applications
          </button>
          <span className={styles.divider}>•</span>
          <button
            onClick={() => router.push("/")}
            className={styles.link}
          >
            Back to Dashboard
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
