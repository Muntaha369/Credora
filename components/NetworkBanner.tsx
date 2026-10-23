"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, Terminal, RefreshCw } from "lucide-react";
import { HealthStatus } from "@/lib/types";

export function NetworkBanner() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "error",
        rpcConnected: false,
        contractDeployed: false,
        contractAddress: null,
        chainId: null,
        blockNumber: null,
        issuerAddress: null,
        issuerBalanceEth: null,
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    check();
  }, []);

  if (!health || health.status === "ok") {
    return null;
  }

  return (
    <aside aria-label="Network alert" className="border-b border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-900 transition-all">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-950">
              {!health.rpcConnected
                ? "Local Ethereum Node is Offline"
                : "Contract Not Deployed on Local Node"}
            </span>
            <p className="text-amber-800 text-xs mt-0.5">
              {!health.rpcConnected
                ? "Start the local Hardhat node by executing: `npm run chain` then `npm run deploy:local` or simply `npm run dev:local`."
                : "The local blockchain restarted. Deploy the CredentialRegistry contract with: `npm run deploy:local`."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="hidden lg:flex items-center gap-1.5 bg-amber-100/80 px-2 py-1 rounded font-mono text-[11px] text-amber-900 border border-amber-200">
            <Terminal className="w-3.5 h-3.5 text-amber-700" />
            npm run dev:local
          </div>
          <button
            onClick={check}
            disabled={checking}
            className="flex items-center gap-1.5 rounded-md bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 text-xs font-medium text-amber-950 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Check Connection
          </button>
        </div>
      </div>
    </aside>
  );
}
