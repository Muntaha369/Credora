import { NextRequest, NextResponse } from "next/server";
import { verifyCredential } from "@/lib/blockchain";
import { parseCredentialId } from "@/lib/formatters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const numericId = parseCredentialId(params.id);

  if (!numericId) {
    return NextResponse.json(
      {
        success: false,
        error: `Invalid credential ID format: '${params.id}'. Expected numeric or CRD-XXXXXX format.`,
        verification: {
          status: "NOT_FOUND",
          credential: null,
          verifiedAt: new Date().toISOString(),
          contractAddress: "",
          chainId: 0,
          blockNumber: 0,
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await verifyCredential(numericId);

    return NextResponse.json({
      success: true,
      verification: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error verifying credential";
    return NextResponse.json(
      {
        success: false,
        error: message,
        verification: {
          status: "NOT_FOUND",
          credential: null,
          verifiedAt: new Date().toISOString(),
          contractAddress: "",
          chainId: 0,
          blockNumber: 0,
        },
      },
      { status: 500 }
    );
  }
}
