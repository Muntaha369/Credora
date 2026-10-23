import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { Credential, HealthStatus, RegistryStats, VerificationResult, VerificationStatus } from "./types";
import { formatCredentialId } from "./formatters";

// Default Hardhat Account #0 private key (deterministic standard dev key)
const DEFAULT_HARDHAT_ACCOUNT0_PK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const DEFAULT_RPC_URL = "http://127.0.0.1:8545";

// Standard ABI for CredentialRegistry
const REGISTRY_ABI = [
  "function owner() view returns (address)",
  "function isAuthorizedIssuer(address) view returns (bool)",
  "function totalCredentials() view returns (uint256)",
  "function revokedCount() view returns (uint256)",
  "function getStats() view returns (uint256 total, uint256 valid, uint256 revoked)",
  "function issueCredential(string recipientName, string achievementTitle, string issuingOrganization, string description) returns (uint256)",
  "function revokeCredential(uint256 id, string reason)",
  "function getCredential(uint256 id) view returns (tuple(uint256 id, string recipientName, string achievementTitle, string issuingOrganization, string description, address issuer, uint256 issuedAt, bool revoked, uint256 revokedAt, string revocationReason))",
  "function verifyCredential(uint256 id) view returns (uint8 status, tuple(uint256 id, string recipientName, string achievementTitle, string issuingOrganization, string description, address issuer, uint256 issuedAt, bool revoked, uint256 revokedAt, string revocationReason))",
  "function getCredentialBatch(uint256 startId, uint256 count) view returns (tuple(uint256 id, string recipientName, string achievementTitle, string issuingOrganization, string description, address issuer, uint256 issuedAt, bool revoked, uint256 revokedAt, string revocationReason)[])",
  "function getAllCredentials() view returns (tuple(uint256 id, string recipientName, string achievementTitle, string issuingOrganization, string description, address issuer, uint256 issuedAt, bool revoked, uint256 revokedAt, string revocationReason)[])",
  "event CredentialIssued(uint256 indexed id, string recipientName, string achievementTitle, string issuingOrganization, address indexed issuer, uint256 issuedAt)",
  "event CredentialRevoked(uint256 indexed id, address indexed revoker, uint256 revokedAt, string reason)",
  "error UnauthorizedCaller(address caller)",
  "error CredentialNotFound(uint256 id)",
  "error AlreadyRevoked(uint256 id)",
  "error EmptyRequiredField(string fieldName)"
];

interface DeploymentMetadata {
  address: string;
  deployer: string;
  chainId: number;
  deployedAt: string;
  abi?: unknown[];
}

/**
 * Resolve deployment info from disk or environment variables
 */
export function getDeploymentInfo(): DeploymentMetadata | null {
  // 1. Check direct env variable first
  const envAddress = process.env.CREDENTIAL_REGISTRY_ADDRESS?.trim();

  // 2. Read lib/contracts/deployment.json
  const deploymentFile = path.join(process.cwd(), "lib/contracts/deployment.json");
  if (fs.existsSync(deploymentFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(deploymentFile, "utf-8")) as DeploymentMetadata;
      if (envAddress && ethers.isAddress(envAddress)) {
        data.address = envAddress;
      }
      return data;
    } catch {
      // ignore json parse error, fall through
    }
  }

  if (envAddress && ethers.isAddress(envAddress)) {
    return {
      address: envAddress,
      deployer: "",
      chainId: 31337,
      deployedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Get configured JSON-RPC provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.LOCAL_RPC_URL || DEFAULT_RPC_URL;
  return new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
}

/**
 * Get server-side authorized issuer signer
 */
export function getIssuerSigner(provider: ethers.JsonRpcProvider): ethers.Wallet {
  const privateKey = process.env.ISSUER_PRIVATE_KEY || DEFAULT_HARDHAT_ACCOUNT0_PK;
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Transform contract struct to typed Credential interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawCredential(raw: any, txHash?: string): Credential {
  const id = Number(raw.id || raw[0]);
  return {
    id,
    formattedId: formatCredentialId(id),
    recipientName: raw.recipientName || raw[1] || "",
    achievementTitle: raw.achievementTitle || raw[2] || "",
    issuingOrganization: raw.issuingOrganization || raw[3] || "",
    description: raw.description || raw[4] || "",
    issuer: raw.issuer || raw[5] || "",
    issuedAt: Number(raw.issuedAt || raw[6] || 0),
    revoked: Boolean(raw.revoked !== undefined ? raw.revoked : raw[7]),
    revokedAt: Number(raw.revokedAt || raw[8] || 0),
    revocationReason: raw.revocationReason || raw[9] || "",
    transactionHash: txHash,
  };
}

/**
 * Check blockchain and contract health
 */
export async function checkBlockchainHealth(): Promise<HealthStatus> {
  const provider = getProvider();
  const deployment = getDeploymentInfo();

  try {
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    const issuer = getIssuerSigner(provider);
    const balance = await provider.getBalance(issuer.address);

    if (!deployment || !deployment.address) {
      return {
        status: "degraded",
        rpcConnected: true,
        contractDeployed: false,
        contractAddress: null,
        chainId: Number(network.chainId),
        blockNumber,
        issuerAddress: issuer.address,
        issuerBalanceEth: ethers.formatEther(balance),
        error: "Contract not yet deployed. Run `npm run deploy:local`.",
      };
    }

    // Check code at contract address
    const code = await provider.getCode(deployment.address);
    if (!code || code === "0x") {
      return {
        status: "degraded",
        rpcConnected: true,
        contractDeployed: false,
        contractAddress: deployment.address,
        chainId: Number(network.chainId),
        blockNumber,
        issuerAddress: issuer.address,
        issuerBalanceEth: ethers.formatEther(balance),
        error: "No bytecode at configured contract address. Hardhat may have restarted.",
      };
    }

    return {
      status: "ok",
      rpcConnected: true,
      contractDeployed: true,
      contractAddress: deployment.address,
      chainId: Number(network.chainId),
      blockNumber,
      issuerAddress: issuer.address,
      issuerBalanceEth: ethers.formatEther(balance),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      status: "error",
      rpcConnected: false,
      contractDeployed: false,
      contractAddress: deployment?.address || null,
      chainId: null,
      blockNumber: null,
      issuerAddress: null,
      issuerBalanceEth: null,
      error: `Cannot connect to local RPC at ${process.env.LOCAL_RPC_URL || DEFAULT_RPC_URL}: ${msg}`,
    };
  }
}

/**
 * Get read-only contract instance
 */
export function getReadOnlyContract(): ethers.Contract {
  const deployment = getDeploymentInfo();
  if (!deployment || !deployment.address) {
    throw new Error("CredentialRegistry contract is not deployed. Please run `npm run deploy:local`.");
  }

  const provider = getProvider();
  return new ethers.Contract(deployment.address, REGISTRY_ABI, provider);
}

/**
 * Get writable contract instance signed by server issuer
 */
export function getWritableContract(): { contract: ethers.Contract; signer: ethers.Wallet } {
  const deployment = getDeploymentInfo();
  if (!deployment || !deployment.address) {
    throw new Error("CredentialRegistry contract is not deployed. Please run `npm run deploy:local`.");
  }

  const provider = getProvider();
  const signer = getIssuerSigner(provider);
  const contract = new ethers.Contract(deployment.address, REGISTRY_ABI, signer);

  return { contract, signer };
}

/**
 * Fetch all credentials from smart contract
 */
export async function getAllCredentials(): Promise<Credential[]> {
  const contract = getReadOnlyContract();
  try {
    const rawList = await contract.getAllCredentials();
    return rawList.map((item: unknown) => mapRawCredential(item)).reverse(); // latest first
  } catch (err: unknown) {
    console.error("Error fetching credentials from contract:", err);
    throw err;
  }
}

/**
 * Get registry statistics
 */
export async function getRegistryStats(): Promise<RegistryStats> {
  const contract = getReadOnlyContract();
  const [total, valid, revoked] = await contract.getStats();
  return {
    total: Number(total),
    valid: Number(valid),
    revoked: Number(revoked),
  };
}

/**
 * Fetch single credential by numeric ID
 */
export async function getCredentialById(id: number): Promise<Credential | null> {
  const contract = getReadOnlyContract();
  try {
    const raw = await contract.getCredential(id);
    return mapRawCredential(raw);
  } catch {
    return null;
  }
}

/**
 * Verify credential on-chain
 */
export async function verifyCredential(id: number): Promise<VerificationResult> {
  const contract = getReadOnlyContract();
  const deployment = getDeploymentInfo();
  const provider = getProvider();

  const [network, blockNumber] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
  ]);

  try {
    const [statusInt, raw] = await contract.verifyCredential(id);
    const statusNum = Number(statusInt);

    let status: VerificationStatus = "NOT_FOUND";
    let credential: Credential | null = null;

    if (statusNum === 1) {
      status = "VALID";
      credential = mapRawCredential(raw);
    } else if (statusNum === 2) {
      status = "REVOKED";
      credential = mapRawCredential(raw);
    }

    return {
      status,
      credential,
      verifiedAt: new Date().toISOString(),
      contractAddress: deployment?.address || "",
      chainId: Number(network.chainId),
      blockNumber,
    };
  } catch (err: unknown) {
    console.error("Error verifying credential:", err);
    return {
      status: "NOT_FOUND",
      credential: null,
      verifiedAt: new Date().toISOString(),
      contractAddress: deployment?.address || "",
      chainId: Number(network.chainId),
      blockNumber,
    };
  }
}

/**
 * Issue a new credential on-chain via server-side issuer wallet
 */
export async function issueCredentialOnChain(
  recipientName: string,
  achievementTitle: string,
  issuingOrganization: string,
  description: string = ""
): Promise<{ id: number; txHash: string; blockNumber: number; credential: Credential }> {
  const { contract } = getWritableContract();

  const tx = await contract.issueCredential(
    recipientName,
    achievementTitle,
    issuingOrganization,
    description
  );

  const receipt = await tx.wait(1);

  // Parse CredentialIssued event
  let newId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === "CredentialIssued") {
        newId = Number(parsed.args.id);
        break;
      }
    } catch {
      // log was not from this interface
    }
  }

  if (newId === 0) {
    // Fallback: query totalCredentials
    const total = await contract.totalCredentials();
    newId = Number(total);
  }

  const raw = await contract.getCredential(newId);
  const credential = mapRawCredential(raw, receipt.hash);

  return {
    id: newId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    credential,
  };
}

/**
 * Revoke an existing credential on-chain
 */
export async function revokeCredentialOnChain(
  id: number,
  reason: string = "Revoked by authorized issuer"
): Promise<{ id: number; txHash: string; blockNumber: number }> {
  const { contract } = getWritableContract();

  const tx = await contract.revokeCredential(id, reason);
  const receipt = await tx.wait(1);

  return {
    id,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
  };
}
