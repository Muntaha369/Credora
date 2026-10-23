import { NextResponse } from "next/server";
import { checkBlockchainHealth } from "@/lib/blockchain";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await checkBlockchainHealth();
    const httpStatus = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;

    return NextResponse.json(
      {
        success: health.status === "ok",
        ...health,
      },
      { status: httpStatus }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal health check error";
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: message,
      },
      { status: 500 }
    );
  }
}
