import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  country: text("country").notNull().default("IT"),
  language: text("language").notNull().default("it"),
  ageGroup: text("age_group").notNull().default("adult"), // minor | adult
  points: integer("points").notNull().default(0),
  walletCents: integer("wallet_cents").notNull().default(0),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  bio: text("bio").notNull().default(""),
  hue: integer("hue").notNull().default(174),
  interests: text("interests").array().notNull().default([]),
  verified: boolean("verified").notNull().default(false),
  verifyCode: text("verify_code").notNull().default(""),
  verifyExp: timestamp("verify_exp", { withTimezone: true }),
  plus: boolean("plus").notNull().default(false),
  plusRenewsAt: timestamp("plus_renews_at", { withTimezone: true }),
  matchOptIn: boolean("match_opt_in").notNull().default(false),
  adultRoomOk: boolean("adult_room_ok").notNull().default(false),
  showVideo: boolean("show_video").notNull().default(true),
  publicProfile: boolean("public_profile").notNull().default(true),
  isBot: boolean("is_bot").notNull().default(false),
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  kind: text("kind").notNull().default("general"), // general | live | gaming | vent
  language: text("language"), // null = global
  group: text("group").notNull().default("adult"), // minor | adult
  isAdult: boolean("is_adult").notNull().default(false),
  premium: boolean("premium").notNull().default(false),
  hue: integer("hue").notNull().default(174),
});

export const topSlots = pgTable("top_slots", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  boughtAt: timestamp("bought_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull(), // plus | top | tip | premium | purchase
    amountCents: integer("amount_cents").notNull(),
    targetId: text("target_id"),
    status: text("status").notNull().default("paid"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("transactions_user_idx").on(t.userId, t.createdAt)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id").notNull(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull().default("text"), // text | voice | system
    content: text("content").notNull().default(""),
    alias: text("alias"), // anonymous label in live rooms
    flagged: boolean("flagged").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_room_idx").on(t.roomId, t.createdAt)],
);

export const dms = pgTable(
  "dms",
  {
    id: text("id").primaryKey(),
    a: text("a").notNull(),
    b: text("b").notNull(),
    lastReadA: timestamp("last_read_a", { withTimezone: true }),
    lastReadB: timestamp("last_read_b", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("dms_pair_idx").on(t.a, t.b)],
);

export const dmMessages = pgTable(
  "dm_messages",
  {
    id: text("id").primaryKey(),
    dmId: text("dm_id").notNull(),
    senderId: text("sender_id").notNull(),
    kind: text("kind").notNull().default("text"), // text | voice
    content: text("content").notNull().default(""),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("dm_messages_idx").on(t.dmId, t.createdAt)],
);

export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    peerId: text("peer_id").notNull(),
    score: integer("score").notNull().default(50),
    reason: text("reason").notNull().default(""),
    status: text("status").notNull().default("new"), // new | chatted
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("matches_user_idx").on(t.userId, t.createdAt)],
);

export const matchReactions = pgTable(
  "match_reactions",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull(),
    userId: text("user_id").notNull(),
    kind: text("kind").notNull().default("wave"), // wave | like
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("match_reactions_idx").on(t.matchId)],
);

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    sellerId: text("seller_id").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("product"), // product | service | digital
    priceCents: integer("price_cents").notNull(),
    promoted: boolean("promoted").notNull().default(false),
    sold: integer("sold").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_seller_idx").on(t.sellerId)],
);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  buyerId: text("buyer_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  feeCents: integer("fee_cents").notNull().default(0),
  status: text("status").notNull().default("paid"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull(),
    buyerId: text("buyer_id").notNull(),
    rating: integer("rating").notNull().default(5),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id").notNull(),
    targetType: text("target_type").notNull().default("message"), // message | user | product
    targetId: text("target_id").notNull(),
    reason: text("reason").notNull().default("other"),
    status: text("status").notNull().default("open"), // open | resolved
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_idx").on(t.reporterId)],
);

export const blocks = pgTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    blockedId: text("blocked_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("blocks_pair_idx").on(t.userId, t.blockedId)],
);
