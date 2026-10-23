"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  PlusCircle,
  Search,
  LayoutDashboard,
  Server,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { HealthStatus } from "@/lib/types";
import { truncateAddress } from "@/lib/formatters";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "error",
        rpcConnected: false,
        contractDeployed: false,
        contractAddress: null,
        chainId: null,
        blockNumber: null,
        issuerAddress: null,
        issuerBalanceEth: null,
        error: "Cannot connect to local RPC endpoint",
      });
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const copyContractAddress = () => {
    if (health?.contractAddress) {
      navigator.clipboard.writeText(health.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/issue", label: "Issue Credential", icon: PlusCircle },
    { href: "/verify", label: "Verify Credential", icon: Search },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-sky-950 text-white shadow-sm ring-1 ring-slate-800/10 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Credora
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Decentralized Trust
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status & action */}
        <div className="hidden md:flex items-center gap-3">
          {/* Node Health Pill */}
          <div className="relative">
            <button
              onClick={() => setShowNetworkDetails(!showNetworkDetails)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                health?.status === "ok"
                  ? "bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80"
                  : health?.status === "degraded"
                  ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    health?.status === "ok"
                      ? "bg-emerald-400"
                      : health?.status === "degraded"
                      ? "bg-amber-400"
                      : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    health?.status === "ok"
                      ? "bg-emerald-500"
                      : health?.status === "degraded"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                />
              </span>
              <span>
                {health?.status === "ok"
                  ? "Hardhat Node: Ready"
                  : health?.status === "degraded"
                  ? "Node Online (Pending Deploy)"
                  : "Local Node Offline"}
              </span>
            </button>

            {/* Network details popup */}
            {showNetworkDetails && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white p-4 shadow-xl border border-slate-200 z-50 text-xs text-slate-600">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 font-semibold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-slate-500" />
                    Local Blockchain Info
                  </span>
                  <button
                    onClick={() => setShowNetworkDetails(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">RPC Endpoint:</span>
                    <span className="font-mono text-slate-800">127.0.0.1:8545</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chain ID:</span>
                    <span className="font-mono text-slate-800">
                      {health?.chainId || 31337} (Localhost)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Current Block:</span>
                    <span className="font-mono text-slate-800">
                      {health?.blockNumber !== null ? `#${health?.blockNumber}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Issuer Address:</span>
                    <span className="font-mono text-slate-800">
                      {health?.issuerAddress ? truncateAddress(health.issuerAddress) : "—"}
                    </span>
                  </div>
                  {health?.contractAddress && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-500 block mb-1">Contract Address:</span>
                      <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded font-mono text-[11px] text-slate-800">
                        <span>{truncateAddress(health.contractAddress, 10, 8)}</span>
                        <button
                          onClick={copyContractAddress}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  {health?.error && (
                    <div className="p-2 bg-rose-50 text-rose-700 rounded text-[11px] leading-tight">
                      {health.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/issue"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-sky-400" />
            Issue Credential
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/issue"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white"
            >
              <PlusCircle className="w-4 h-4 text-sky-400" />
              Issue Credential
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
