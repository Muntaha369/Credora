"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Copy, Check, Download, ExternalLink, QrCode as QrIcon } from "lucide-react";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { Credential } from "@/lib/types";

interface QrModalProps {
  credential: Credential | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QrModal({ credential, isOpen, onClose }: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState<string>("");

  useEffect(() => {
    if (credential && isOpen) {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const url = `${origin}/verify/${credential.id}`;
      setVerificationUrl(url);

      generateQrCodeDataUrl(url)
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch(console.error);
    }
  }, [credential, isOpen]);

  if (!isOpen || !credential) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `Credora-QR-${credential.formattedId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="rounded-xl bg-sky-50 p-2 text-sky-600">
            <QrIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Verification QR Code
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {credential.formattedId} • {credential.recipientName}
            </p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 p-6 my-2">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt={`QR Code for ${credential.formattedId}`}
              width={208}
              height={208}
              unoptimized
              className="h-52 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
            />
          ) : (
            <div className="h-52 w-52 animate-pulse rounded-xl bg-slate-200" />
          )}

          <p className="mt-3 text-xs text-center text-slate-500 max-w-xs">
            Points to the local smart contract verification route:
          </p>
          <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 max-w-full overflow-hidden text-ellipsis">
            <span className="truncate">{verificationUrl}</span>
          </div>
        </div>

        {/* Localhost note */}
        <div className="rounded-lg bg-amber-50 p-3 my-3 text-[11px] text-amber-800 border border-amber-200/70 leading-relaxed">
          <strong>Localhost Note:</strong> Because this app runs on a local Hardhat node, this QR code will resolve on devices able to reach{" "}
          <code className="font-mono text-amber-900 bg-amber-100/80 px-1 py-0.5 rounded">
            {verificationUrl.split("/verify")[0]}
          </code>
          .
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                Copied Link!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy URL
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
