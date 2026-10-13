import { db } from "@/db";
import { admins } from "@/db/schema";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-master-token");

  if (!process.env.ADMIN_MASTER_TOKEN || token !== process.env.ADMIN_MASTER_TOKEN) {
    return Response.json({ ok: false, error: "MASTER_TOKEN_REQUIRED" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const telegramUserId = Number(body?.telegramUserId);
  const role = typeof body?.role === "string" && body.role.trim() ? body.role.trim() : "organizer";

  if (!Number.isFinite(telegramUserId) || telegramUserId <= 0) {
    return Response.json({ ok: false, error: "INVALID_TELEGRAM_USER_ID" }, { status: 400 });
  }

  const inserted = await db
    .insert(admins)
    .values({ telegramUserId, role })
    .onConflictDoUpdate({
      target: admins.telegramUserId,
      set: { role },
    })
    .returning();

  return Response.json({ ok: true, admin: inserted[0] });
}
