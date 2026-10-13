import { db } from "@/db";
import { admins } from "@/db/schema";
import { resolveTelegramUserId } from "@/lib/telegram";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

function envAdminIds() {
  const raw = process.env.TELEGRAM_ADMIN_IDS ?? "";
  return raw
    .split(",")
    .map((chunk) => Number(chunk.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function isTelegramAdmin(telegramUserId: number) {
  const envIds = envAdminIds();
  if (envIds.includes(telegramUserId)) {
    return true;
  }

  const row = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.telegramUserId, telegramUserId))
    .limit(1);

  return row.length > 0;
}

export async function requireAdmin(request: NextRequest) {
  const telegramUserId = resolveTelegramUserId(request);

  if (!telegramUserId) {
    return {
      ok: false as const,
      status: 400,
      response: Response.json({ ok: false, error: "TELEGRAM_USER_ID_REQUIRED" }, { status: 400 }),
    };
  }

  const allowed = await isTelegramAdmin(telegramUserId);
  if (!allowed) {
    return {
      ok: false as const,
      status: 403,
      response: Response.json({ ok: false, error: "ADMIN_ACCESS_REQUIRED" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    telegramUserId,
  };
}
