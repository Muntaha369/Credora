import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { NetworkBanner } from "@/components/NetworkBanner";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Credora — Decentralized Digital Credential Verification",
  description:
    "Local Ethereum-based platform for issuing, managing, and verifying tamper-proof digital credentials and certificates.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col bg-slate-50/60 text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
        <ToastProvider>
          <NetworkBanner />
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Credora</span>
                <span>•</span>
                <span>Decentralized Credential & Achievement Registry</span>
              </div>
              <div className="text-slate-500">
                Ethereum Localhost Network (Chain ID: 31337) • Zero External Keys
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
