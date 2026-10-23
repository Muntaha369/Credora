"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Ban,
  FileDown,
  QrCode,
  Copy,
  Check,
  Search,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Building,
  User,
  Hash,
  Clock,
  Key,
} from "lucide-react";
import { Credential } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, truncateAddress } from "@/lib/formatters";
import { downloadCertificatePdf } from "@/lib/certificate";
import { QrModal } from "@/components/QrModal";
import { RevokeModal } from "@/components/RevokeModal";
import { useToast } from "@/components/Toast";

export default function CredentialDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { showToast } = useToast();

  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedIssuer, setCopiedIssuer] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const fetchCredential = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/credentials/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Credential not found on smart contract.");
      }
      setCredential(data.credential);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error querying credential";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCredential();
  }, [fetchCredential]);

  const handleCopyId = () => {
    if (credential) {
      navigator.clipboard.writeText(credential.formattedId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      showToast("Copied Credential ID to clipboard", "info");
    }
  };

  const handleCopyIssuer = () => {
    if (credential?.issuer) {
      navigator.clipboard.writeText(credential.issuer);
      setCopiedIssuer(true);
      setTimeout(() => setCopiedIssuer(false), 2000);
      showToast("Copied issuer address to clipboard", "info");
    }
  };

  const handleDownloadPdf = async () => {
    if (!credential) return;
    try {
      showToast(`Generating PDF certificate for ${credential.formattedId}...`, "info");
      await downloadCertificatePdf(credential);
      showToast("PDF Certificate downloaded successfully!", "success");
    } catch {
      showToast("Failed to generate PDF.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 animate-pulse space-y-4">
          <div className="h-6 w-36 bg-slate-200 rounded" />
          <div className="h-10 w-3/4 bg-slate-200 rounded" />
          <div className="h-24 w-full bg-slate-100 rounded" />
        </div>
      ) : error || !credential ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Credential Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {error || `No credential record exists on the blockchain for identifier '${id}'.`}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Return to Registry
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                    {credential.formattedId}
                  </span>
                  <StatusBadge status={!credential.revoked} size="md" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {credential.achievementTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                  <span>Conferred to</span>
                  <span className="font-semibold text-slate-800">
                    {credential.recipientName}
                  </span>
                  <span>by</span>
                  <span className="font-medium text-slate-700">
                    {credential.issuingOrganization}
                  </span>
                </p>
              </div>

              {/* Action buttons bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  title="Download Certificate PDF"
                >
                  <FileDown className="w-4 h-4 text-sky-400" />
                  Download PDF
                </button>

                <button
                  onClick={() => setQrOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                  title="View Verification QR Code"
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </button>

                <Link
                  href={`/verify/${credential.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <Search className="w-4 h-4 text-emerald-600" />
                  Verify On-Chain
                </Link>

                {!credential.revoked && (
                  <button
                    onClick={() => setRevokeOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
                    title="Revoke Credential"
                  >
                    <Ban className="w-4 h-4 text-rose-600" />
                    Revoke
                  </button>
                )}
              </div>
            </div>

            {/* Revoked Notice Banner */}
            {credential.revoked && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-950">
                  <Ban className="w-4 h-4 text-rose-600" />
                  This Credential Has Been Revoked
                </div>
                <p className="text-rose-800">
                  Revocation Reason:{" "}
                  <strong>
                    {credential.revocationReason || "Revoked by authorized issuer"}
                  </strong>
                </p>
                <p className="text-rose-700 text-[11px]">
                  Revoked on: {formatDate(credential.revokedAt)}
                </p>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achievement & Description */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Credential Information
              </h2>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Recipient</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {credential.recipientName}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">Achievement Title</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-2">
                    <Award className="w-4 h-4 text-sky-600" />
                    {credential.achievementTitle}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">Issuing Organization</span>
                  <div className="font-semibold text-slate-900 mt-0.5 flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400" />
                    {credential.issuingOrganization}
                  </div>
                </div>

                {credential.description && (
                  <div>
                    <span className="text-slate-400 block text-xs">Description & Remarks</span>
                    <p className="text-slate-700 text-xs sm:text-sm mt-1 p-3 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed">
                      {credential.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain Attestation Box */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ethereum Blockchain Attestation
              </h2>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-xs">Numeric ID / Token ID</span>
                  <div className="flex items-center justify-between font-mono font-semibold text-slate-900 mt-0.5">
                    <span className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-400" />
                      #{credential.id} ({credential.formattedId})
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-sans"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">Blockchain Timestamp</span>
                  <div className="font-mono text-slate-900 mt-0.5 flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {formatDate(credential.issuedAt)}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs">Authorized Issuer Address</span>
                  <div className="flex items-center justify-between font-mono text-slate-900 mt-0.5 text-xs">
                    <span className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-slate-400" />
                      {truncateAddress(credential.issuer, 8, 8)}
                    </span>
                    <button
                      onClick={handleCopyIssuer}
                      className="text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1 font-sans"
                    >
                      {copiedIssuer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                </div>

                {credential.transactionHash && (
                  <div>
                    <span className="text-slate-400 block text-xs">Issuance Transaction Hash</span>
                    <div className="font-mono text-[11px] text-slate-700 mt-0.5 break-all bg-slate-50 p-2 rounded border border-slate-100">
                      {credential.transactionHash}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  Smart contract state is queried on every page load to guarantee real-time verification validity.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <QrModal
        credential={credential}
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
      />

      {/* Revoke Modal */}
      <RevokeModal
        credential={credential}
        isOpen={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onSuccess={() => {
          showToast(`Credential #${credential?.id} has been revoked on-chain!`, "success");
          fetchCredential();
        }}
      />
    </div>
  );
}
