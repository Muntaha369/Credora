"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldCheck,
  Ban,
  HelpCircle,
  Loader2,
  FileDown,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Calendar,
  Lock,
  ExternalLink,
  QrCode as QrIcon,
} from "lucide-react";
import { VerificationResult } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, truncateAddress } from "@/lib/formatters";
import { downloadCertificatePdf } from "@/lib/certificate";
import { QrModal } from "@/components/QrModal";
import { useToast } from "@/components/Toast";

export default function VerifyPage() {
  const { showToast } = useToast();
  const [queryId, setQueryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [searchedId, setSearchedId] = useState<string>("");
  const [qrOpen, setQrOpen] = useState(false);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryId.trim()) return;

    setLoading(true);
    setResult(null);
    setSearchedId(queryId.trim());

    try {
      const res = await fetch(`/api/credentials/${encodeURIComponent(queryId.trim())}/verify`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.verification) {
        setResult(data.verification);
      } else {
        setResult({
          status: "NOT_FOUND",
          credential: null,
          verifiedAt: new Date().toISOString(),
          contractAddress: "",
          chainId: 0,
          blockNumber: 0,
        });
      }
    } catch {
      setResult({
        status: "NOT_FOUND",
        credential: null,
        verifiedAt: new Date().toISOString(),
        contractAddress: "",
        chainId: 0,
        blockNumber: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result?.credential) return;
    try {
      showToast(`Generating PDF certificate for ${result.credential.formattedId}...`, "info");
      await downloadCertificatePdf(result.credential);
      showToast("Certificate downloaded successfully!", "success");
    } catch {
      showToast("Failed to generate PDF.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200 mb-3">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          Public Credential Verification
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Verify Any Credora Credential
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-500">
          Enter a credential identifier (e.g. <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">CRD-000001</code> or <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">1</code>) to query the Ethereum smart contract for real-time authenticity and revocation status.
        </p>
      </div>

      {/* Search Bar Form */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleVerify} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="Enter Credential ID, e.g. CRD-000001 or 1"
              disabled={loading}
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !queryId.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-sky-400" />
                Verify
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result */}
      {result && (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {result.status === "VALID" && result.credential ? (
            /* VALID STATE */
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 ring-8 ring-emerald-50">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <StatusBadge status="VALID" size="md" />
                      <span className="font-mono text-xs text-slate-500">
                        {result.credential.formattedId}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      Authentic Credential Verified
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-sky-400" />
                    PDF
                  </button>
                  <button
                    onClick={() => setQrOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    <QrIcon className="w-4 h-4" />
                    QR
                  </button>
                  <Link
                    href={`/credentials/${result.credential.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </Link>
                </div>
              </div>

              {/* Credential Data */}
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-5 space-y-3 border border-slate-100 text-xs sm:text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">Achievement</span>
                    <span className="font-bold text-slate-900 text-right">
                      {result.credential.achievementTitle}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">Recipient</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {result.credential.recipientName}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-xs">Issuing Organization</span>
                    <span className="font-medium text-slate-700 text-right">
                      {result.credential.issuingOrganization}
                    </span>
                  </div>
                  {result.credential.description && (
                    <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                      <span className="font-semibold block mb-0.5">Remarks:</span>
                      {result.credential.description}
                    </div>
                  )}
                </div>

                {/* Blockchain Proof Summary */}
                <div className="rounded-xl border border-slate-100 p-4 text-xs text-slate-500 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span>Issuance Date:</span>
                    <span className="text-slate-800">{formatDate(result.credential.issuedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Issuer Address:</span>
                    <span className="text-slate-800">{truncateAddress(result.credential.issuer, 8, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract Address:</span>
                    <span className="text-slate-800">{truncateAddress(result.contractAddress, 8, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verified At Block:</span>
                    <span className="text-slate-800">#{result.blockNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : result.status === "REVOKED" && result.credential ? (
            /* REVOKED STATE */
            <div className="rounded-3xl border border-rose-300 bg-white p-6 sm:p-8 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-rose-100 p-3 text-rose-600 ring-8 ring-rose-50">
                    <Ban className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <StatusBadge status="REVOKED" size="md" />
                      <span className="font-mono text-xs text-slate-500">
                        {result.credential.formattedId}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                      Credential Has Been Revoked
                    </h3>
                  </div>
                </div>

                <Link
                  href={`/credentials/${result.credential.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  View History
                </Link>
              </div>

              <div className="mt-6 rounded-2xl bg-rose-50/70 border border-rose-200 p-5 space-y-2 text-xs sm:text-sm text-rose-950">
                <p className="font-bold">
                  This credential was previously issued but has been formally revoked by the authorized issuer on-chain.
                </p>
                <div className="text-xs text-rose-800 pt-1">
                  <strong>Reason:</strong> {result.credential.revocationReason || "Revoked by issuer"}
                </div>
                <div className="text-[11px] text-rose-700 font-mono">
                  Revoked on: {formatDate(result.credential.revokedAt)}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 space-y-1">
                <div>
                  <strong>Recipient:</strong> {result.credential.recipientName}
                </div>
                <div>
                  <strong>Achievement:</strong> {result.credential.achievementTitle}
                </div>
                <div>
                  <strong>Issuer Org:</strong> {result.credential.issuingOrganization}
                </div>
              </div>
            </div>
          ) : (
            /* NOT FOUND STATE */
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <HelpCircle className="w-8 h-8" />
              </div>
              <div>
                <StatusBadge status="NOT_FOUND" size="md" />
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  No Record Found on Blockchain
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  The identifier <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">&apos;{searchedId}&apos;</code> has never been issued or recorded on the CredentialRegistry smart contract.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 max-w-md mx-auto">
                <strong>Verification Guarantee:</strong> In Credora, non-existent credentials are strictly distinguished from revoked or valid credentials. If a certificate displays this ID, it is unverified or fraudulent.
              </div>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {result?.credential && (
        <QrModal
          credential={result.credential}
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
        />
      )}
    </div>
  );
}
