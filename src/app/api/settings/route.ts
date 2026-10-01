import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const body = await req.json();

    const allowedKeys = [
      "iphone_margin",
      "rounding_mode",
      "store_name",
      "whatsapp_number",
      "catalog_notice",
      "store_address",
      "payment_terms",
    ];

    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) },
        });
      }
    }

    await logAudit({
      userId: session?.id,
      userName: session?.name,
      action: "UPDATE",
      entity: "SETTING",
      details: body,
    });

    return NextResponse.json({ success: true, message: "Configurações atualizadas." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
