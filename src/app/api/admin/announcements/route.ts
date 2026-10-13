import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const allowedTypes = new Set(["text", "video_note", "result_cta"] as const);

type AnnouncementType = "text" | "video_note" | "result_cta";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const type = body?.type as AnnouncementType;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const textBody = typeof body?.body === "string" ? body.body.trim() : null;
  const targetAdminTelegram =
    typeof body?.targetAdminTelegram === "string" ? body.targetAdminTelegram.trim() : null;

  if (!allowedTypes.has(type)) {
    return Response.json({ ok: false, error: "INVALID_TYPE" }, { status: 400 });
  }

  if (!title || title.length < 3) {
    return Response.json({ ok: false, error: "INVALID_TITLE" }, { status: 400 });
  }

  const inserted = await db
    .insert(announcements)
    .values({
      type,
      title,
      body: textBody,
      targetAdminTelegram,
    })
    .returning();

  return Response.json({ ok: true, announcement: inserted[0] });
}
