import { NextRequest, NextResponse } from "next/server";
import { revokeCredentialOnChain, getCredentialById } from "@/lib/blockchain";
import { parseCredentialId } from "@/lib/formatters";
import { revokeCredentialSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const numericId = parseCredentialId(params.id);

  if (!numericId) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid credential ID format: '${params.id}'. Expected numeric or CRD-XXXXXX format.`,
      },
      { status: 400 }
    );
  }

  try {
    let reason = "Revoked by authorized issuer";
    try {
      const body = await req.json();
      const parsed = revokeCredentialSchema.safeParse(body);
      if (parsed.success && parsed.data.reason) {
        reason = parsed.data.reason;
      }
    } catch {
      // Body is optional
    }

    // Check if credential exists
    const existing = await getCredentialById(numericId);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Credential #${numericId} does not exist on-chain.`,
        },
        { status: 404 }
      );
    }

    if (existing.revoked) {
      return NextResponse.json(
        {
          success: false,
          error: `Credential #${numericId} has already been revoked.`,
        },
        { status: 400 }
      );
    }

    const result = await revokeCredentialOnChain(numericId, reason);

    return NextResponse.json({
      success: true,
      message: `Credential #${numericId} successfully revoked on Ethereum blockchain.`,
      id: numericId,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
    });
  } catch (err: unknown) {
    console.error("Revocation error:", err);
    let message = "Revocation transaction failed";
    if (err instanceof Error) {
      if (err.message.includes("AlreadyRevoked")) {
        message = `Credential #${numericId} is already marked as revoked.`;
      } else if (err.message.includes("UnauthorizedCaller")) {
        message = "Server issuer account is not authorized to revoke credentials.";
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
