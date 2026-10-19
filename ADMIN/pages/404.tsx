import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Head><title>404 Not Found | BayaniHub Admin</title></Head>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <h1 className="text-[#171717] text-5xl font-bold mb-4">404</h1>
          <h2 className="text-[#171717] text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-[#737373] text-base mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#5C6ED5] text-white rounded-lg font-medium hover:bg-[#3E5A99] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
