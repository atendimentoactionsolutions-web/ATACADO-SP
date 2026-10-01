import prisma from "./prisma";

export async function logAudit({
  userId,
  userName,
  action,
  entity,
  details,
  ip,
}: {
  userId?: string;
  userName?: string;
  action: string;
  entity: string;
  details: any;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        userName: userName || "Sistema",
        action,
        entity,
        details: typeof details === "string" ? details : JSON.stringify(details),
        ip: ip || null,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar AuditLog:", err);
  }
}

export async function recordPriceHistory({
  productId,
  oldPrice,
  newPrice,
  margin,
  finalPrice,
  userResponsible,
  reason,
}: {
  productId: string;
  oldPrice: number;
  newPrice: number;
  margin: number;
  finalPrice: number;
  userResponsible?: string;
  reason?: string;
}) {
  try {
    return await prisma.priceHistory.create({
      data: {
        productId,
        oldPrice,
        newPrice,
        margin,
        finalPrice,
        userResponsible: userResponsible || "Administrador",
        reason: reason || null,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar PriceHistory:", err);
    return null;
  }
}
