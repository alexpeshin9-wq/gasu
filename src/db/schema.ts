import {
  bigint,
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const pointSourceEnum = pgEnum("point_source", ["pin", "challenge", "adjustment", "purchase"]);

export const announcementTypeEnum = pgEnum("announcement_type", ["text", "video_note", "result_cta"]);

export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 220 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    groupNameIdx: uniqueIndex("groups_name_uidx").on(table.name),
  }),
);

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 220 }).notNull(),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    teamGroupIdx: uniqueIndex("teams_group_uidx").on(table.groupId),
  }),
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "restrict" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    isStarosta: boolean("is_starosta").default(false).notNull(),
    isShopManager: boolean("is_shop_manager").default(false).notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    telegramUidx: uniqueIndex("users_telegram_uidx").on(table.telegramUserId),
  }),
);

export const admins = pgTable(
  "admins",
  {
    id: serial("id").primaryKey(),
    telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull(),
    role: varchar("role", { length: 32 }).default("organizer").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adminsTelegramUidx: uniqueIndex("admins_telegram_uidx").on(table.telegramUserId),
  }),
);

export const challenges = pgTable(
  "challenges",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 120 }).notNull(),
    shortDescription: text("short_description").notNull(),
    taskBody: text("task_body").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const teamPointsHistory = pgTable("team_points_history", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "set null" }),
  source: pointSourceEnum("source").notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  points: integer("points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pinCodes = pgTable(
  "pin_codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 6 }).notNull(),
    locationNumber: integer("location_number").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    codeUidx: uniqueIndex("pin_codes_code_uidx").on(table.code),
  }),
);

export const pinCodeClaims = pgTable(
  "pin_code_claims",
  {
    id: serial("id").primaryKey(),
    pinCodeId: integer("pin_code_id")
      .notNull()
      .references(() => pinCodes.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    awardedPoints: integer("awarded_points").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pinPerUserUidx: uniqueIndex("pin_claim_user_uidx").on(table.pinCodeId, table.userId),
  }),
);

export const storeItems = pgTable("store_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  imageUrl: text("image_url").notNull(),
  stock: integer("stock").notNull(),
  costPoints: integer("cost_points").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const storePurchases = pgTable("store_purchases", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => storeItems.id, { onDelete: "restrict" }),
  teamId: integer("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "restrict" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  totalCostPoints: integer("total_cost_points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  type: announcementTypeEnum("type").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  targetAdminTelegram: varchar("target_admin_telegram", { length: 64 }),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
});
