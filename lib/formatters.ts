/**
 * Format numeric ID into a standard Credora identifier, e.g. 1 -> CRD-000001
 */
export function formatCredentialId(id: number | bigint | string): string {
  const num = typeof id === "string" ? parseInt(id, 10) : Number(id);
  if (isNaN(num) || num <= 0) {
    return "CRD-000000";
  }
  return `CRD-${num.toString().padStart(6, "0")}`;
}

/**
 * Parse a credential identifier (e.g. "CRD-000042", "crd-42", or "42") into its numeric ID
 */
export function parseCredentialId(input: string | number): number | null {
  if (typeof input === "number") {
    return Number.isInteger(input) && input > 0 ? input : null;
  }

  if (!input || typeof input !== "string") {
    return null;
  }

  const cleaned = input.trim().toUpperCase();
  const match = cleaned.match(/^(?:CRD-?)?0*(\d+)$/i);
  if (!match) {
    return null;
  }

  const num = parseInt(match[1], 10);
  return num > 0 ? num : null;
}

/**
 * Format Unix epoch seconds into a human-readable date/time string
 */
export function formatDate(timestampInSeconds: number | bigint): string {
  const ts = Number(timestampInSeconds);
  if (!ts || ts <= 0) return "—";

  const date = new Date(ts * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Truncate an Ethereum address for UI display
 */
export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Truncate a transaction hash
 */
export function truncateHash(hash: string, start = 8, end = 6): string {
  if (!hash) return "";
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
