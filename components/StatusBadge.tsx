import React from "react";
import { CheckCircle2, Ban, HelpCircle } from "lucide-react";
import { VerificationStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: VerificationStatus | boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  // Normalize boolean to VerificationStatus
  let normalizedStatus: VerificationStatus = "VALID";
  if (typeof status === "boolean") {
    normalizedStatus = status ? "REVOKED" : "VALID";
  } else {
    normalizedStatus = status;
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs font-medium gap-1.5",
    lg: "px-3.5 py-1.5 text-sm font-semibold gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  if (normalizedStatus === "VALID") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium ${sizeClasses[size]}`}
      >
        <CheckCircle2 className={`${iconSizes[size]} text-emerald-600`} />
        Valid & Active
      </span>
    );
  }

  if (normalizedStatus === "REVOKED") {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-medium ${sizeClasses[size]}`}
      >
        <Ban className={`${iconSizes[size]} text-rose-600`} />
        Revoked
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium ${sizeClasses[size]}`}
    >
      <HelpCircle className={`${iconSizes[size]} text-slate-500`} />
      Not Found
    </span>
  );
}
