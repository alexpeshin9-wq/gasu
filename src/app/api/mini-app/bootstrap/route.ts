import { db } from "@/db";
import { groups } from "@/db/schema";
import { ensureSeedData, getTeamDashboard } from "@/lib/contest";
import { resolveTelegramUserId } from "@/lib/telegram";
import { asc } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const telegramUserId = resolveTelegramUserId(request);

    if (!telegramUserId) {
      return Response.json({ ok: false, error: "TELEGRAM_USER_ID_REQUIRED" }, { status: 400 });
    }

    await ensureSeedData();

    const dashboard = await getTeamDashboard(telegramUserId);
    const allGroups = await db.select({ id: groups.id, name: groups.name }).from(groups).orderBy(asc(groups.name));

    return Response.json({
      ok: true,
      telegramUserId,
      groups: allGroups,
      ...dashboard,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "BOOTSTRAP_FAILED";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
