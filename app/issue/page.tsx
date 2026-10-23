"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
  Eye,
  Check,
  Search,
  PlusCircle,
  Copy,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Credential } from "@/lib/types";
import { downloadCertificatePdf } from "@/lib/certificate";
import { useToast } from "@/components/Toast";

export default function IssueCredentialPage() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    recipientName: "",
    achievementTitle: "",
    issuingOrganization: "Credora Academy",
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [txStep, setTxStep] = useState<string>("");
  const [issuedCredential, setIssuedCredential] = useState<Credential | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = "Recipient name or public identifier is required.";
    } else if (formData.recipientName.trim().length > 100) {
      newErrors.recipientName = "Recipient name must not exceed 100 characters.";
    }

    if (!formData.achievementTitle.trim()) {
      newErrors.achievementTitle = "Achievement or course title is required.";
    } else if (formData.achievementTitle.trim().length > 150) {
      newErrors.achievementTitle = "Achievement title must not exceed 150 characters.";
    }

    if (!formData.issuingOrganization.trim()) {
      newErrors.issuingOrganization = "Issuing organization is required.";
    } else if (formData.issuingOrganization.trim().length > 100) {
      newErrors.issuingOrganization = "Issuing organization must not exceed 100 characters.";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must not exceed 500 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);
    setTxStep("Connecting to local Ethereum node (127.0.0.1:8545)...");

    try {
      setTxStep("Signing transaction with local authorized issuer...");
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: formData.recipientName.trim(),
          achievementTitle: formData.achievementTitle.trim(),
          issuingOrganization: formData.issuingOrganization.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      setTxStep("Awaiting block confirmation on CredentialRegistry...");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to issue credential on-chain.");
      }

      setIssuedCredential(data.credential);
      setTxHash(data.txHash);
      setBlockNumber(data.blockNumber);
      showToast(`Credential ${data.credential.formattedId} issued successfully!`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error issuing credential";
      setServerError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
      setTxStep("");
    }
  };

  const copyId = () => {
    if (issuedCredential) {
      navigator.clipboard.writeText(issuedCredential.formattedId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const resetForm = () => {
    setFormData({
      recipientName: "",
      achievementTitle: "",
      issuingOrganization: "Credora Academy",
      description: "",
    });
    setIssuedCredential(null);
    setTxHash("");
    setBlockNumber(null);
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8">
      {/* Breadcrumb / Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
          <Award className="w-4 h-4" />
          Blockchain Issuance Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Issue Digital Credential
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Create an immutable, verifiable achievement certificate recorded directly on the local Ethereum blockchain.
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="mb-6 rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4 text-xs text-sky-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-950">
            Public Ledger Privacy Notice:
          </span>{" "}
          All submitted fields are permanently recorded on the blockchain state. Do not include confidential personal identity information such as passwords, SSN, personal phone numbers, or private physical addresses.
        </div>
      </div>

      {/* Success View */}
      {issuedCredential ? (
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Confirmed on Ethereum Ledger
            </span>

            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
              Credential Successfully Issued!
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-md">
              The digital credential has been mined into a block and permanently assigned a unique sequential ID.
            </p>

            {/* Generated ID Box */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full justify-between">
              <div className="text-left">
                <span className="text-xs text-slate-500 font-medium">Assigned Credential ID</span>
                <div className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-tight">
                  {issuedCredential.formattedId}
                </div>
              </div>
              <button
                onClick={copyId}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy ID
                  </>
                )}
              </button>
            </div>

            {/* Credential summary table */}
            <div className="mt-4 w-full rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs text-left space-y-2">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Recipient Name:</span>
                <span className="font-semibold text-slate-900">{issuedCredential.recipientName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Achievement Title:</span>
                <span className="font-semibold text-slate-900">{issuedCredential.achievementTitle}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Issuing Organization:</span>
                <span className="font-semibold text-slate-900">{issuedCredential.issuingOrganization}</span>
              </div>
              {txHash && (
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Transaction Hash:</span>
                  <span className="font-mono text-slate-800 text-[11px] truncate max-w-[200px]">
                    {txHash}
                  </span>
                </div>
              )}
              {blockNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mined in Block:</span>
                  <span className="font-mono text-slate-800">#{blockNumber}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={() => downloadCertificatePdf(issuedCredential)}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
              >
                <FileDown className="w-4 h-4 text-sky-400" />
                Download PDF Certificate
              </button>

              <Link
                href={`/credentials/${issuedCredential.id}`}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Eye className="w-4 h-4" />
                View Details
              </Link>

              <Link
                href={`/verify/${issuedCredential.id}`}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <Search className="w-4 h-4 text-emerald-600" />
                Public Verification
              </Link>
            </div>

            <button
              onClick={resetForm}
              className="mt-6 text-xs text-slate-500 hover:text-slate-800 font-medium underline"
            >
              Issue Another Credential
            </button>
          </div>
        </div>
      ) : (
        /* Issuance Form */
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          {serverError && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Issuance failed:</span>{" "}
                {serverError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Recipient Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Recipient Name or Public Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={submitting}
                value={formData.recipientName}
                onChange={(e) => {
                  setFormData({ ...formData, recipientName: e.target.value });
                  if (errors.recipientName) setErrors({ ...errors, recipientName: "" });
                }}
                placeholder="e.g., Alex Mercer or student@university.edu"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.recipientName
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"
                } disabled:opacity-50`}
              />
              {errors.recipientName && (
                <p className="mt-1 text-xs text-rose-600">{errors.recipientName}</p>
              )}
            </div>

            {/* Achievement Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Achievement or Course Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={submitting}
                value={formData.achievementTitle}
                onChange={(e) => {
                  setFormData({ ...formData, achievementTitle: e.target.value });
                  if (errors.achievementTitle) setErrors({ ...errors, achievementTitle: "" });
                }}
                placeholder="e.g., Advanced Solidity Engineering & Security"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.achievementTitle
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"
                } disabled:opacity-50`}
              />
              {errors.achievementTitle && (
                <p className="mt-1 text-xs text-rose-600">{errors.achievementTitle}</p>
              )}
            </div>

            {/* Issuing Organization */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Issuing Organization <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={submitting}
                value={formData.issuingOrganization}
                onChange={(e) => {
                  setFormData({ ...formData, issuingOrganization: e.target.value });
                  if (errors.issuingOrganization)
                    setErrors({ ...errors, issuingOrganization: "" });
                }}
                placeholder="e.g., Ethereum Developers Institute"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.issuingOrganization
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-500"
                } disabled:opacity-50`}
              />
              {errors.issuingOrganization && (
                <p className="mt-1 text-xs text-rose-600">{errors.issuingOrganization}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Description & Criteria (Optional)
              </label>
              <textarea
                rows={3}
                disabled={submitting}
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors({ ...errors, description: "" });
                }}
                placeholder="e.g., Awarded for successfully completing comprehensive coursework in smart contract optimization, EVM architecture, and cryptographic verification."
                maxLength={500}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors disabled:opacity-50"
              />
              <div className="flex justify-between mt-1 text-[11px] text-slate-400">
                <span>Stored directly in contract storage</span>
                <span>{formData.description.length}/500</span>
              </div>
            </div>

            {/* Transaction Progress Feedback */}
            {submitting && (
              <div className="rounded-xl bg-slate-900 p-4 text-xs text-slate-200 space-y-2 border border-slate-800 animate-in fade-in">
                <div className="flex items-center gap-2 text-sky-400 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Blockchain Transaction</span>
                </div>
                <p className="text-slate-400 text-[11px]">{txStep}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    Issuing Credential on Ethereum...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-sky-400" />
                    Sign & Issue Credential
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
