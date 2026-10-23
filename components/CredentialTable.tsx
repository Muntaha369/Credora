"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  FileDown,
  QrCode,
  Ban,
  Inbox,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import { Credential } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/formatters";
import { downloadCertificatePdf } from "@/lib/certificate";
import { QrModal } from "./QrModal";
import { RevokeModal } from "./RevokeModal";
import { useToast } from "./Toast";

interface CredentialTableProps {
  credentials: Credential[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function CredentialTable({
  credentials,
  loading,
  onRefresh,
}: CredentialTableProps) {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALID" | "REVOKED">("ALL");

  const [selectedForQr, setSelectedForQr] = useState<Credential | null>(null);
  const [selectedForRevoke, setSelectedForRevoke] = useState<Credential | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const filteredCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      // Filter by status
      if (statusFilter === "VALID" && cred.revoked) return false;
      if (statusFilter === "REVOKED" && !cred.revoked) return false;

      // Filter by search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        cred.formattedId.toLowerCase().includes(q) ||
        cred.id.toString().includes(q) ||
        cred.recipientName.toLowerCase().includes(q) ||
        cred.achievementTitle.toLowerCase().includes(q) ||
        cred.issuingOrganization.toLowerCase().includes(q)
      );
    });
  }, [credentials, search, statusFilter]);

  const handleDownloadPdf = async (cred: Credential) => {
    try {
      setDownloadingId(cred.id);
      showToast(`Generating PDF certificate for ${cred.formattedId}...`, "info");
      await downloadCertificatePdf(cred);
      showToast(`Certificate for ${cred.formattedId} downloaded!`, "success");
    } catch {
      showToast("Failed to generate PDF certificate.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, recipient, course, or organization..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | "VALID" | "REVOKED")
              }
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses ({credentials.length})</option>
              <option value="VALID">Valid & Active</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Credential ID
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Recipient
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Achievement / Course
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Issuing Organization
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Date Issued
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="h-4 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-28 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-5 w-16 rounded-full bg-slate-200" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="h-6 w-20 ml-auto rounded bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : filteredCredentials.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto flex flex-col items-center justify-center max-w-sm">
                      <div className="rounded-2xl bg-slate-100 p-3.5 text-slate-400 mb-3">
                        <Inbox className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {credentials.length === 0
                          ? "No Credentials Issued Yet"
                          : "No Matching Credentials"}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        {credentials.length === 0
                          ? "The local smart contract currently has no credentials recorded. Start by issuing your first credential."
                          : "Try adjusting your search terms or filter settings to find the credential."}
                      </p>
                      {credentials.length === 0 && (
                        <Link
                          href="/issue"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-sky-400" />
                          Issue First Credential
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCredentials.map((cred) => (
                  <tr
                    key={cred.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* ID */}
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                      <Link
                        href={`/credentials/${cred.id}`}
                        className="text-sky-700 hover:text-sky-900 hover:underline"
                      >
                        {cred.formattedId}
                      </Link>
                    </td>

                    {/* Recipient */}
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {cred.recipientName}
                    </td>

                    {/* Achievement */}
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {cred.achievementTitle}
                    </td>

                    {/* Organization */}
                    <td className="px-5 py-3.5 text-slate-600">
                      {cred.issuingOrganization}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {formatDate(cred.issuedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={!cred.revoked} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Details */}
                        <Link
                          href={`/credentials/${cred.id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Direct Verify */}
                        <Link
                          href={`/verify/${cred.id}`}
                          className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Direct Verification"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Link>

                        {/* QR Code */}
                        <button
                          onClick={() => setSelectedForQr(cred)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => handleDownloadPdf(cred)}
                          disabled={downloadingId === cred.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50"
                          title="Download Certificate PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {/* Revoke (if valid) */}
                        {!cred.revoked && (
                          <button
                            onClick={() => setSelectedForRevoke(cred)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Revoke Credential"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      <QrModal
        credential={selectedForQr}
        isOpen={Boolean(selectedForQr)}
        onClose={() => setSelectedForQr(null)}
      />

      {/* Revoke Modal */}
      <RevokeModal
        credential={selectedForRevoke}
        isOpen={Boolean(selectedForRevoke)}
        onClose={() => setSelectedForRevoke(null)}
        onSuccess={() => {
          showToast(
            `Credential #${selectedForRevoke?.id} was successfully revoked on-chain!`,
            "success"
          );
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
