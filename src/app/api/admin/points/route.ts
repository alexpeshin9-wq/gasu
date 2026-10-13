import { db } from "@/db";
import { teamPointsHistory, teams } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const teamId = Number(body?.teamId);
  const points = Number(body?.points);
  const title = typeof body?.title === "string" ? body.title.trim() : "";

  if (!Number.isFinite(teamId) || teamId <= 0) {
    return Response.json({ ok: false, error: "INVALID_TEAM_ID" }, { status: 400 });
  }

  if (!Number.isFinite(points) || points === 0) {
    return Response.json({ ok: false, error: "INVALID_POINTS" }, { status: 400 });
  }

  if (!title || title.length < 3) {
    return Response.json({ ok: false, error: "INVALID_TITLE" }, { status: 400 });
  }

  const team = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
  if (team.length === 0) {
    return Response.json({ ok: false, error: "TEAM_NOT_FOUND" }, { status: 404 });
  }

  const inserted = await db
    .insert(teamPointsHistory)
    .values({
      teamId,
      challengeId: null,
      source: "adjustment",
      title,
      points,
    })
    .returning();

  return Response.json({ ok: true, entry: inserted[0] });
}
