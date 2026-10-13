import { db } from "@/db";
import { groups, teamPointsHistory, teams, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const leaderboard = await db
    .select({
      teamId: teams.id,
      teamName: teams.displayName,
      groupName: groups.name,
      points: sql<string>`coalesce(sum(${teamPointsHistory.points}), 0)`,
      members: sql<string>`count(distinct ${users.id})`,
    })
    .from(teams)
    .innerJoin(groups, eq(groups.id, teams.groupId))
    .leftJoin(teamPointsHistory, eq(teamPointsHistory.teamId, teams.id))
    .leftJoin(users, eq(users.teamId, teams.id))
    .groupBy(teams.id, teams.displayName, groups.name)
    .orderBy(desc(sql`coalesce(sum(${teamPointsHistory.points}), 0)`));

  return Response.json({ ok: true, leaderboard });
}
