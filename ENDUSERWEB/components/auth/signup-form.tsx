"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./signup-form.module.css";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
};

export function SignupForm() {
  const router = useRouter();
  const { signup, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "file", string>>>({});

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setErrors((current) => ({ ...current, file: undefined }));
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!form.birthDate.trim()) {
      nextErrors.birthDate = "Date of birth is required.";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) {
      nextErrors.birthDate = "Use YYYY-MM-DD format.";
    }
    if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    
    if (!selectedFile) nextErrors.file = "Verification file is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build multipart FormData to send to Nest.js backend
      const fd = new FormData();
      fd.append("email", form.email.trim());
      fd.append("password", form.password);

      fd.append("first_name", form.firstName.trim());
      fd.append("last_name", form.lastName.trim());
      fd.append("phone", form.phone.trim());

      // Send DOB as-is (frontend now matches backend format YYYY-MM-DD)
      fd.append("dob", form.birthDate.trim());

      if (selectedFile) {
        fd.append("id_document", selectedFile);
      }

      await signup(fd);
      
      setIsSuccess(true);
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.background} aria-hidden="true" />

      <section className={styles.shell}>
        <div className={styles.logoRing} aria-hidden="true" />
        <div className={styles.logoInner} aria-hidden="true">
          <Image
            src="/logos/logo.png"
            alt="BayaniHub logo"
            width={64}
            height={64}
            className={styles.logoImage}
            priority
          />
        </div>

        <div className={styles.card}>
          {isSuccess && (
            <div className={styles.successOverlay}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successTitle}>Account created successfully!</h2>
              <p className={styles.successMessage}>Redirecting you to login module...</p>
            </div>
          )}
          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
          <h1 className={styles.title}>Sign Up &amp; Verify</h1>

          <form onSubmit={handleSubmit}>
            <div className={styles.grid}>
              <div className={styles.formColumn}>
                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    type="email"
                    placeholder="Email Address*"
                  />
                  {errors.email ? <span className={styles.error}>{errors.email}</span> : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, firstName: event.target.value }))
                    }
                    type="text"
                    placeholder="First Name*"
                  />
                  {errors.firstName ? <span className={styles.error}>{errors.firstName}</span> : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, lastName: event.target.value }))
                    }
                    type="text"
                    placeholder="Last Name*"
                  />
                  {errors.lastName ? <span className={styles.error}>{errors.lastName}</span> : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    type="tel"
                    placeholder="Phone Number* (e.g. 09171234567)"
                  />
                  {errors.phone ? <span className={styles.error}>{errors.phone}</span> : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.birthDate ? styles.inputError : ""}`}
                    value={form.birthDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, birthDate: event.target.value }))
                    }
                    placeholder="Date of Birth* (YYYY-MM-DD)"
                    type="text"
                  />
                  {errors.birthDate ? (
                    <span className={styles.error}>{errors.birthDate}</span>
                  ) : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    type="password"
                    placeholder="Password*"
                  />
                  {errors.password ? <span className={styles.error}>{errors.password}</span> : null}
                </label>

                <label className={styles.field}>
                  <input
                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    type="password"
                    placeholder="Confirm Password*"
                  />
                  {errors.confirmPassword ? (
                    <span className={styles.error}>{errors.confirmPassword}</span>
                  ) : null}
                </label>
              </div>

              <div className={styles.verifyColumn}>
                <div className={styles.verifyLabel}>
                  Upload Files for Verification<span className={styles.required}>*</span>
                </div>

                <div className={styles.uploadCard}>
                  <div className={styles.uploadIconWrap} aria-hidden="true">
                    <svg
                      className={styles.uploadIconSvg}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <p className={styles.uploadTitle}>Drop your ID here or click to browse</p>
                  <p className={styles.uploadSub}>Supported formats: JPG, PNG, PDF (Max 10MB)</p>

                  <button
                    className={styles.browseButton}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </button>

                  <input
                    ref={fileInputRef}
                    className={styles.fileInput}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />

                  {selectedFile ? <div className={styles.fileName}>{selectedFile.name}</div> : null}
                </div>

                {errors.file ? <div className={styles.banner + " " + styles.errorBanner}>{errors.file}</div> : null}
                {serverError ? (
                  <div className={styles.banner + " " + styles.errorBanner}>{serverError}</div>
                ) : null}
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.submit} type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create an Account"}
              </button>

              <p className={styles.footer}>
                Already have an account? <Link href="/login">Log In</Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>

  );
}
