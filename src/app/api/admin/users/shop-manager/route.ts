import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const targetTelegramUserId = Number(body?.targetTelegramUserId);
  const isShopManager = Boolean(body?.isShopManager);

  if (!Number.isFinite(targetTelegramUserId) || targetTelegramUserId <= 0) {
    return Response.json({ ok: false, error: "INVALID_TARGET_TELEGRAM_USER_ID" }, { status: 400 });
  }

  const updated = await db
    .update(users)
    .set({ isShopManager })
    .where(eq(users.telegramUserId, targetTelegramUserId))
    .returning({
      id: users.id,
      telegramUserId: users.telegramUserId,
      fullName: users.fullName,
      isShopManager: users.isShopManager,
    });

  if (updated.length === 0) {
    return Response.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return Response.json({ ok: true, user: updated[0] });
}
