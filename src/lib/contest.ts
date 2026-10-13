import { db } from "@/db";
import {
  challenges,
  groups,
  pinCodeClaims,
  pinCodes,
  storeItems,
  teamPointsHistory,
  teams,
  users,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

const MSK_REG_OPEN_MONTH = 9;
const MSK_REG_OPEN_DAY = 19;

const CONTEST_DIRECTIONS = [
  "Прикладная математика и информатика",
  "Строительство · Водоснабжение и водоотведение",
  "Строительство · Теплогазоснабжение и вентиляция",
  "Информационные системы и технологии",
  "Прикладная информатика",
  "Теплоэнергетика и теплотехника",
  "Электроэнергетика и электротехника",
  "Природообустройство и водопользование",
  "Землеустройство и кадастры",
  "Прикладная геодезия (специалитет)",
  "Техносферная безопасность",
] as const;

export function registrationOpensAt(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), MSK_REG_OPEN_MONTH, MSK_REG_OPEN_DAY, 0, 0, 0));
}

export function registrationAllowed(date = new Date()) {
  return date >= registrationOpensAt(date);
}

export async function ensureSeedData() {
  const existingGroups = await db.select().from(groups);

  if (existingGroups.length === 0) {
    const insertedGroups = await db
      .insert(groups)
      .values(CONTEST_DIRECTIONS.map((name) => ({ name })))
      .returning();

    await db.insert(teams).values(
      insertedGroups.map((group) => ({
        groupId: group.id,
        displayName: group.name,
        logoUrl:
          "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop",
      })),
    );
  } else {
    const existingNames = new Set(existingGroups.map((group) => group.name));
    const missingDirections = CONTEST_DIRECTIONS.filter((name) => !existingNames.has(name));

    if (missingDirections.length > 0) {
      const insertedGroups = await db
        .insert(groups)
        .values(missingDirections.map((name) => ({ name })))
        .returning();

      await db.insert(teams).values(
        insertedGroups.map((group) => ({
          groupId: group.id,
          displayName: group.name,
          logoUrl:
            "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop",
        })),
      );
    }

    const teamRows = await db.select({ groupId: teams.groupId }).from(teams);
    const groupsWithoutTeam = existingGroups
      .filter((group) => !teamRows.some((team) => team.groupId === group.id))
      .map((group) => group.id);

    if (groupsWithoutTeam.length > 0) {
      const groupRows = await db.select().from(groups).where(inArray(groups.id, groupsWithoutTeam));

      await db.insert(teams).values(
        groupRows.map((group) => ({
          groupId: group.id,
          displayName: group.name,
          logoUrl:
            "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop",
        })),
      );
    }
  }

  const existingChallenges = await db.select().from(challenges).limit(1);
  if (existingChallenges.length === 0) {
    const now = Date.now();
    await db.insert(challenges).values([
      {
        title: "Открытие квеста",
        shortDescription: "Вводное испытание и знакомство с правилами.",
        taskBody: "Соберите команду у главного входа и сделайте общее фото с табличкой группы.",
        startsAt: new Date(now - 1000 * 60 * 60),
        endsAt: new Date(now + 1000 * 60 * 60 * 5),
      },
      {
        title: "Лабораторный блиц",
        shortDescription: "Быстрые инженерные задачи на логику.",
        taskBody:
          "Задание станет доступно в момент старта. Подготовьте смартфон и ноутбук команды.",
        startsAt: new Date(now + 1000 * 60 * 60 * 8),
        endsAt: new Date(now + 1000 * 60 * 60 * 11),
      },
      {
        title: "Финальный маршрут",
        shortDescription: "Серия точек по кампусу с кодами.",
        taskBody: "Задание станет доступно в момент старта испытания.",
        startsAt: new Date(now + 1000 * 60 * 60 * 24),
        endsAt: new Date(now + 1000 * 60 * 60 * 30),
      },
    ]);
  }

  const existingPins = await db.select().from(pinCodes).limit(1);
  if (existingPins.length === 0) {
    await db.insert(pinCodes).values([
      { code: "123456", locationNumber: 1 },
      { code: "654321", locationNumber: 2 },
      { code: "112233", locationNumber: 3 },
    ]);
  }

  const existingStore = await db.select().from(storeItems).limit(1);
  if (existingStore.length === 0) {
    await db.insert(storeItems).values([
      {
        title: "Термокружка ФИЭиГХ",
        imageUrl:
          "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?q=80&w=600&auto=format&fit=crop",
        stock: 12,
        costPoints: 18,
      },
      {
        title: "Стикерпак команды",
        imageUrl:
          "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?q=80&w=600&auto=format&fit=crop",
        stock: 30,
        costPoints: 5,
      },
      {
        title: "Powerbank",
        imageUrl:
          "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=600&auto=format&fit=crop",
        stock: 7,
        costPoints: 35,
      },
    ]);
  }
}

export async function registerUser(params: {
  telegramUserId: number;
  fullName: string;
  groupId: number;
  isStarosta: boolean;
}) {
  const group = await db.select().from(groups).where(eq(groups.id, params.groupId)).limit(1);
  if (group.length === 0) {
    throw new Error("GROUP_NOT_FOUND");
  }

  const team = await db.select().from(teams).where(eq(teams.groupId, params.groupId)).limit(1);
  if (team.length === 0) {
    throw new Error("TEAM_NOT_FOUND");
  }

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramUserId, params.telegramUserId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const inserted = await db
    .insert(users)
    .values({
      telegramUserId: params.telegramUserId,
      fullName: params.fullName,
      groupId: params.groupId,
      teamId: team[0].id,
      isStarosta: params.isStarosta,
      isShopManager: false,
    })
    .returning();

  return inserted[0];
}

export async function getUserByTelegramId(telegramUserId: number) {
  const row = await db
    .select({
      id: users.id,
      telegramUserId: users.telegramUserId,
      fullName: users.fullName,
      isStarosta: users.isStarosta,
      isShopManager: users.isShopManager,
      groupId: groups.id,
      groupName: groups.name,
      teamId: teams.id,
      teamName: teams.displayName,
      teamLogo: teams.logoUrl,
    })
    .from(users)
    .innerJoin(groups, eq(groups.id, users.groupId))
    .innerJoin(teams, eq(teams.id, users.teamId))
    .where(eq(users.telegramUserId, telegramUserId))
    .limit(1);

  return row[0] ?? null;
}

export async function getTeamDashboard(telegramUserId: number) {
  const user = await getUserByTelegramId(telegramUserId);
  if (!user) {
    return {
      registered: false as const,
      registrationOpen: registrationAllowed(),
      registrationOpensAt: registrationOpensAt().toISOString(),
    };
  }

  const members = await db
    .select({
      fullName: users.fullName,
      isStarosta: users.isStarosta,
      isShopManager: users.isShopManager,
    })
    .from(users)
    .where(eq(users.teamId, user.teamId))
    .orderBy(asc(users.fullName));

  const totalPointsRows = await db
    .select({ total: sql<string>`coalesce(sum(${teamPointsHistory.points}), 0)` })
    .from(teamPointsHistory)
    .where(eq(teamPointsHistory.teamId, user.teamId));

  const totalPoints = Number(totalPointsRows[0]?.total ?? 0);

  const statsRows = await db
    .select({
      id: teamPointsHistory.id,
      title: teamPointsHistory.title,
      points: teamPointsHistory.points,
      source: teamPointsHistory.source,
      createdAt: teamPointsHistory.createdAt,
    })
    .from(teamPointsHistory)
    .where(eq(teamPointsHistory.teamId, user.teamId))
    .orderBy(desc(teamPointsHistory.createdAt));

  const challengeRows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      shortDescription: challenges.shortDescription,
      taskBody: challenges.taskBody,
      startsAt: challenges.startsAt,
      endsAt: challenges.endsAt,
    })
    .from(challenges)
    .orderBy(asc(challenges.startsAt));

  const now = new Date();

  const schedule = challengeRows.map((item) => ({
    id: item.id,
    title: item.title,
    shortDescription: item.shortDescription,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    taskBody: item.startsAt <= now ? item.taskBody : "Задание откроется в момент старта испытания.",
    isVisible: item.startsAt <= now,
  }));

  const shopRows = await db
    .select({
      id: storeItems.id,
      title: storeItems.title,
      imageUrl: storeItems.imageUrl,
      stock: storeItems.stock,
      costPoints: storeItems.costPoints,
    })
    .from(storeItems)
    .where(eq(storeItems.isActive, true))
    .orderBy(asc(storeItems.costPoints));

  return {
    registered: true as const,
    registrationOpen: registrationAllowed(),
    profile: user,
    team: {
      points: totalPoints,
      members,
    },
    stats: statsRows,
    schedule,
    shop: shopRows,
  };
}

export async function redeemPinCode(params: { telegramUserId: number; code: string }) {
  const user = await getUserByTelegramId(params.telegramUserId);
  if (!user) {
    throw new Error("USER_NOT_REGISTERED");
  }

  const normalized = params.code.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("INVALID_CODE_FORMAT");
  }

  const pin = await db
    .select()
    .from(pinCodes)
    .where(and(eq(pinCodes.code, normalized), eq(pinCodes.isActive, true)))
    .limit(1);

  if (pin.length === 0) {
    throw new Error("PIN_NOT_FOUND");
  }

  const sameClaim = await db
    .select()
    .from(pinCodeClaims)
    .where(and(eq(pinCodeClaims.pinCodeId, pin[0].id), eq(pinCodeClaims.userId, user.id)))
    .limit(1);

  if (sameClaim.length > 0) {
    throw new Error("PIN_ALREADY_CLAIMED_BY_USER");
  }

  const totalClaimsRows = await db
    .select({ count: sql<string>`count(*)` })
    .from(pinCodeClaims)
    .where(eq(pinCodeClaims.pinCodeId, pin[0].id));

  const previousClaims = Number(totalClaimsRows[0]?.count ?? 0);
  const points = Math.max(1, 4 - previousClaims);

  await db.transaction(async (tx) => {
    await tx.insert(pinCodeClaims).values({
      pinCodeId: pin[0].id,
      userId: user.id,
      teamId: user.teamId,
      awardedPoints: points,
    });

    await tx.insert(teamPointsHistory).values({
      teamId: user.teamId,
      challengeId: null,
      source: "pin",
      title: `Пин-код локации №${pin[0].locationNumber}`,
      points,
    });
  });

  return {
    points,
    locationNumber: pin[0].locationNumber,
    foundCount: previousClaims + 1,
    broadcastText: `Пин-код локации №${pin[0].locationNumber} найден ${previousClaims + 1} раз(а).`,
  };
}
