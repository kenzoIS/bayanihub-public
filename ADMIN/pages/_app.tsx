import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/auth-context";

const PUBLIC_ROUTES = ["/login"];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Stays false until we confirm either: user is on a public route, or has a valid token.
  // This prevents the server-rendered dashboard HTML from being painted before the check.
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("admin-token");
    const isPublic = PUBLIC_ROUTES.includes(router.pathname);

    if (!token && !isPublic) {
      // Kick off redirect — do NOT set authChecked so nothing renders during navigation
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router.pathname]);

  // Render nothing until auth check resolves — prevents any flash of protected content
  if (!authChecked) return null;

  return (
    <AuthProvider>
      <Head>
        <title>BayaniHub Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div key={router.asPath} className="page-transition-wrapper">
        <Component {...pageProps} />
      </div>
    </AuthProvider>
  );
}

