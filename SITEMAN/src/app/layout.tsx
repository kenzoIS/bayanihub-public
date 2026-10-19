import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Site Manager Dashboard",
  description: "Manage your site operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}