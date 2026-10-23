import React from "react";
import { Award, CheckCircle2, Ban } from "lucide-react";
import { RegistryStats } from "@/lib/types";

interface StatsCardsProps {
  stats: RegistryStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      label: "Total Credentials Issued",
      value: stats.total,
      icon: Award,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      borderColor: "border-sky-100",
      description: "Permanently recorded on local Ethereum",
    },
    {
      label: "Active & Valid",
      value: stats.valid,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      description: "Cryptographically verified in good standing",
    },
    {
      label: "Revoked Credentials",
      value: stats.revoked,
      icon: Ban,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      borderColor: "border-rose-100",
      description: "Revoked by authorized issuer",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-2xl border ${card.borderColor} bg-white p-6 shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">{card.label}</span>
              <div className={`rounded-xl ${card.bgColor} p-2.5`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              {loading ? (
                <div className="h-9 w-20 animate-pulse rounded bg-slate-200" />
              ) : (
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
