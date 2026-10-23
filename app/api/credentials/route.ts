import { NextRequest, NextResponse } from "next/server";
import {
  getAllCredentials,
  getRegistryStats,
  issueCredentialOnChain,
} from "@/lib/blockchain";
import { issueCredentialSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [credentials, stats] = await Promise.all([
      getAllCredentials(),
      getRegistryStats(),
    ]);

    return NextResponse.json({
      success: true,
      credentials,
      stats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch credentials";
    return NextResponse.json(
      {
        success: false,
        error: message,
        credentials: [],
        stats: { total: 0, valid: 0, revoked: 0 },
      },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = issueCredentialSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { recipientName, achievementTitle, issuingOrganization, description } =
      parseResult.data;

    const result = await issueCredentialOnChain(
      recipientName,
      achievementTitle,
      issuingOrganization,
      description
    );

    return NextResponse.json(
      {
        success: true,
        message: "Credential issued successfully on Ethereum blockchain",
        id: result.id,
        formattedId: result.credential.formattedId,
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        credential: result.credential,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Issuance error:", err);
    let message = "Blockchain transaction failed";
    if (err instanceof Error) {
      if (err.message.includes("UnauthorizedCaller")) {
        message = "The configured issuer account is not authorized by the smart contract.";
      } else if (err.message.includes("ECONNREFUSED")) {
        message = "Cannot connect to local Ethereum node (127.0.0.1:8545). Make sure Hardhat is running.";
      } else {
        message = err.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
