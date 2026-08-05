import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const blessings = sqliteTable(
  "blessings",
  {
    id: text("id").primaryKey(),
    authorName: text("author_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("blessings_created_at_idx").on(table.createdAt)],
);

export const blessingReplies = sqliteTable(
  "blessing_replies",
  {
    id: text("id").primaryKey(),
    blessingId: text("blessing_id")
      .notNull()
      .references(() => blessings.id, { onDelete: "cascade" }),
    authorName: text("author_name").notNull().default(""),
    displayName: text("display_name").notNull(),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
    content: text("content").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("blessing_replies_blessing_id_idx").on(table.blessingId)],
);

export const seatingGuests = sqliteTable(
  "seating_guests",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    invitationCode: text("invitation_code").notNull(),
    tableName: text("table_name").notNull(),
    seatNote: text("seat_note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("seating_guests_normalized_name_idx").on(table.normalizedName),
    index("seating_guests_invitation_code_idx").on(table.invitationCode),
  ],
);
