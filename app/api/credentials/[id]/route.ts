import { NextRequest, NextResponse } from "next/server";
import { getCredentialById } from "@/lib/blockchain";
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
      },
      { status: 400 }
    );
  }

  try {
    const credential = await getCredentialById(numericId);

    if (!credential) {
      return NextResponse.json(
        {
          success: false,
          error: `Credential with ID #${numericId} not found on the blockchain.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      credential,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error querying credential";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
