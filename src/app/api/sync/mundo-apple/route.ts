import { NextRequest, NextResponse } from "next/server";
import { syncMundoAppleLive } from "@/lib/mundo-apple-sync";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const userResponsible = session?.name || "Administrador iFindz";

    const result = await syncMundoAppleLive(userResponsible);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro na sincronização Mundo Apple:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Falha na sincronização com Mundo Apple Buscador" },
      { status: 500 }
    );
  }
}
