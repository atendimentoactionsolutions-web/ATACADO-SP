import { NextRequest, NextResponse } from "next/server";
import { syncMundoAppleLive } from "@/lib/mundo-apple-sync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    if (key !== "atacadosp_sync_2026") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncMundoAppleLive("Watchdog Sync Ao Vivo");
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
