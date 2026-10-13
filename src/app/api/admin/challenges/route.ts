import { db } from "@/db";
import { challenges } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const shortDescription = typeof body?.shortDescription === "string" ? body.shortDescription.trim() : "";
  const taskBody = typeof body?.taskBody === "string" ? body.taskBody.trim() : "";
  const startsAt = body?.startsAt ? new Date(body.startsAt) : null;
  const endsAt = body?.endsAt ? new Date(body.endsAt) : null;

  if (!title || title.length < 3) {
    return Response.json({ ok: false, error: "INVALID_TITLE" }, { status: 400 });
  }

  if (!shortDescription || shortDescription.length < 3) {
    return Response.json({ ok: false, error: "INVALID_SHORT_DESCRIPTION" }, { status: 400 });
  }

  if (!taskBody || taskBody.length < 3) {
    return Response.json({ ok: false, error: "INVALID_TASK_BODY" }, { status: 400 });
  }

  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return Response.json({ ok: false, error: "INVALID_STARTS_AT" }, { status: 400 });
  }

  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return Response.json({ ok: false, error: "INVALID_ENDS_AT" }, { status: 400 });
  }

  const inserted = await db
    .insert(challenges)
    .values({
      title,
      shortDescription,
      taskBody,
      startsAt,
      endsAt,
    })
    .returning();

  return Response.json({ ok: true, challenge: inserted[0] });
}
