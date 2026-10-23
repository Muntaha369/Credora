export type VerificationStatus = "VALID" | "REVOKED" | "NOT_FOUND";

export interface Credential {
  id: number;
  formattedId: string;
  recipientName: string;
  achievementTitle: string;
  issuingOrganization: string;
  description: string;
  issuer: string;
  issuedAt: number; // Unix timestamp in seconds
  revoked: boolean;
  revokedAt: number;
  revocationReason: string;
  transactionHash?: string;
}

export interface VerificationResult {
  status: VerificationStatus;
  credential: Credential | null;
  verifiedAt: string;
  contractAddress: string;
  chainId: number;
  blockNumber: number;
}

export interface RegistryStats {
  total: number;
  valid: number;
  revoked: number;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  rpcConnected: boolean;
  contractDeployed: boolean;
  contractAddress: string | null;
  chainId: number | null;
  blockNumber: number | null;
  issuerAddress: string | null;
  issuerBalanceEth: string | null;
  error?: string;
}

export interface IssueCredentialInput {
  recipientName: string;
  achievementTitle: string;
  issuingOrganization: string;
  description?: string;
}

export interface RevokeCredentialInput {
  reason?: string;
}
