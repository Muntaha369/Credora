"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  PlusCircle,
  Search,
  RefreshCw,
  Cpu,
  Layers,
  Lock,
} from "lucide-react";
import { StatsCards } from "@/components/StatsCards";
import { CredentialTable } from "@/components/CredentialTable";
import { Credential, RegistryStats } from "@/lib/types";

export default function DashboardPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<RegistryStats>({
    total: 0,
    valid: 0,
    revoked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load credentials from contract");
      }
      setCredentials(data.credentials || []);
      setStats(data.stats || { total: 0, valid: 0, revoked: 0 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error connecting to blockchain";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            Decentralized Credential Platform
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Credential Registry Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            All records, statuses, and revocations are anchored directly on the local Ethereum smart contract.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-500" />
            Verify ID
          </Link>

          <Link
            href="/issue"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-sky-400" />
            Issue Credential
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs sm:text-sm text-rose-800 shadow-sm">
          <div className="font-semibold text-rose-950 mb-0.5">
            Could not retrieve data from smart contract
          </div>
          <p className="text-rose-700">{error}</p>
          <div className="mt-2 text-xs font-mono text-rose-900 bg-rose-100/70 p-2 rounded">
            Ensure the local Hardhat node is running (`npm run chain`) and the contract is deployed (`npm run deploy:local`).
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Credential Management Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recorded Credentials
            </h2>
            <p className="text-xs text-slate-500">
              Showing credentials directly verified from the Ethereum blockchain state.
            </p>
          </div>
        </div>

        <CredentialTable
          credentials={credentials}
          loading={loading}
          onRefresh={fetchData}
        />
      </div>

      {/* Architectural Guarantee Notice */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Cpu className="w-4 h-4 text-sky-600" />
          Architecture & Decentralization Guarantees
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-sky-50 p-1.5 text-sky-600 mt-0.5">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">
                Solidity Contract Source of Truth
              </span>
              Every credential is keyed by a sequential numeric identifier on <code className="text-slate-800 font-mono">CredentialRegistry.sol</code> with issuance timestamps and cryptographic issuer records.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">
                Zero Browser Wallet Friction
              </span>
              Transactions are signed automatically server-side using the local Hardhat development issuer account, requiring no MetaMask, external gas, or mainnet funds.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="rounded-lg bg-purple-50 p-1.5 text-purple-600 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">
                Deterministic Verification
              </span>
              Verification queries inspect the exact contract bytecode state, distinguishing valid credentials from revoked ones and rejecting nonexistent IDs.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
