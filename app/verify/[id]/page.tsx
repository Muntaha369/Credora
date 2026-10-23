"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Ban,
  HelpCircle,
  FileDown,
  Eye,
  Search,
  ArrowLeft,
  Calendar,
  Building,
  User,
  Hash,
  ExternalLink,
  QrCode as QrIcon,
} from "lucide-react";
import { VerificationResult } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, truncateAddress } from "@/lib/formatters";
import { downloadCertificatePdf } from "@/lib/certificate";
import { QrModal } from "@/components/QrModal";
import { useToast } from "@/components/Toast";

export default function DirectVerifyPage() {
  const params = useParams();
  const id = params?.id as string;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const runVerification = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/credentials/${encodeURIComponent(id)}/verify`, {
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
  }, [id]);

  useEffect(() => {
    runVerification();
  }, [runVerification]);

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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Verify Another ID
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Registry Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 animate-pulse space-y-4 shadow-sm">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-8 w-2/3 bg-slate-200 rounded" />
          <div className="h-32 w-full bg-slate-100 rounded" />
        </div>
      ) : result?.status === "VALID" && result.credential ? (
        /* VALID */
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3.5 text-emerald-600 ring-8 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <StatusBadge status="VALID" size="lg" />
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    {result.credential.formattedId}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  Cryptographically Verified Valid
                </h1>
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

          {/* Certificate Payload Details */}
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-6 space-y-3.5 border border-slate-100 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <span className="text-slate-400 text-xs">Achievement</span>
                <span className="font-bold text-slate-900 sm:text-right text-base">
                  {result.credential.achievementTitle}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <span className="text-slate-400 text-xs">Conferred To</span>
                <span className="font-semibold text-slate-800 sm:text-right">
                  {result.credential.recipientName}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <span className="text-slate-400 text-xs">Awarding Authority</span>
                <span className="font-medium text-slate-700 sm:text-right">
                  {result.credential.issuingOrganization}
                </span>
              </div>
              {result.credential.description && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                  <span className="font-semibold block mb-0.5">Remarks / Criteria:</span>
                  {result.credential.description}
                </div>
              )}
            </div>

            {/* Smart contract proof */}
            <div className="rounded-xl border border-slate-100 bg-white p-4 text-xs text-slate-500 space-y-1.5 font-mono shadow-sm">
              <div className="flex justify-between">
                <span>Issuance Timestamp:</span>
                <span className="text-slate-800">{formatDate(result.credential.issuedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Issuer Ethereum Address:</span>
                <span className="text-slate-800">{truncateAddress(result.credential.issuer, 8, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Contract Address:</span>
                <span className="text-slate-800">{truncateAddress(result.contractAddress, 8, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chain / Mined Block:</span>
                <span className="text-slate-800">
                  Chain ID {result.chainId} • Block #{result.blockNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : result?.status === "REVOKED" && result.credential ? (
        /* REVOKED */
        <div className="rounded-3xl border border-rose-300 bg-white p-6 sm:p-8 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-100 p-3.5 text-rose-600 ring-8 ring-rose-50">
                <Ban className="w-9 h-9" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <StatusBadge status="REVOKED" size="lg" />
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    {result.credential.formattedId}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  Credential Formally Revoked
                </h1>
              </div>
            </div>

            <Link
              href={`/credentials/${result.credential.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Eye className="w-4 h-4" />
              View Ledger History
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-rose-50/80 border border-rose-200 p-5 space-y-2 text-xs sm:text-sm text-rose-950">
            <p className="font-bold">
              Warning: This credential was revoked by the issuing authority and is no longer in valid standing.
            </p>
            <div className="text-xs text-rose-800 pt-1">
              <strong>Revocation Reason:</strong>{" "}
              {result.credential.revocationReason || "Revoked by issuer"}
            </div>
            <div className="text-[11px] text-rose-700 font-mono">
              Revocation Date: {formatDate(result.credential.revokedAt)}
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-600 space-y-1">
            <div>
              <strong>Original Recipient:</strong> {result.credential.recipientName}
            </div>
            <div>
              <strong>Achievement:</strong> {result.credential.achievementTitle}
            </div>
            <div>
              <strong>Issuing Organization:</strong> {result.credential.issuingOrganization}
            </div>
          </div>
        </div>
      ) : (
        /* NOT FOUND */
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <HelpCircle className="w-9 h-9" />
          </div>
          <div>
            <StatusBadge status="NOT_FOUND" size="lg" />
            <h2 className="text-2xl font-extrabold text-slate-900 mt-3">
              Credential Not Found on Ledger
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              No blockchain record exists for ID <code className="font-mono text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-bold">&apos;{id}&apos;</code>.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
            >
              <Search className="w-4 h-4 text-sky-400" />
              Search Another Identifier
            </Link>
          </div>
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
