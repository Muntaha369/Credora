"use client";

import React, { useState } from "react";
import { AlertTriangle, Ban, X, Loader2 } from "lucide-react";
import { Credential } from "@/lib/types";

interface RevokeModalProps {
  credential: Credential | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RevokeModal({ credential, isOpen, onClose, onSuccess }: RevokeModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !credential) return null;

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/credentials/${credential.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to revoke credential on-chain.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error revoking credential";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Revoke Credential
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {credential.formattedId} • {credential.recipientName}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-rose-50/70 border border-rose-200/80 p-3.5 my-3 text-xs text-rose-900 leading-relaxed">
          <strong>Caution: Blockchain Immutability</strong>
          <p className="mt-1 text-rose-800">
            Revoking this credential will execute an on-chain smart contract transaction signed by the local issuer. The status will be permanently changed to <strong>REVOKED</strong> on the Ethereum ledger.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 my-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleRevoke} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Revocation Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Audit failure, administrative reissue, course incomplete"
              maxLength={200}
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Broadcasting Tx...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Confirm Revocation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
