import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tables = pgTable("tables", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull().default(10),
});

export const guests = pgTable("guests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  token: text("token").notNull().unique(), // random, goes in the invitation URL / QR code
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  seats: integer("seats").notNull().default(1), // guest + companions
  locale: text("locale", { enum: ["fr", "en"] })
    .notNull()
    .default("fr"),
  status: text("status", { enum: ["pending", "confirmed", "declined"] })
    .notNull()
    .default("pending"),
  companion: text("companion", { enum: ["none", "wife", "husband"] })
    .notNull()
    .default("none"), // couple invitation: who comes with the guest
  drink: text("drink"),
  events: jsonb("events")
    .$type<string[]>()
    .notNull()
    .$defaultFn(() => []),
  tableId: integer("table_id").references(() => tables.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  invitedAt: timestamp("invited_at", { withTimezone: true }), // when the invitation was sent
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }), // last entry time (door scanner)
  arrived: integer("arrived").notNull().default(0), // how many of the reserved seats have entered
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Per-ceremony settings edited in the admin "Événements" tab.
export const eventSettings = pgTable("event_settings", {
  id: text("id").primaryKey(), // "customary" | "civil" | "talk" | "party"
  capacity: integer("capacity"), // max seats for this event (null = no limit)
  dressCodeFr: text("dress_code_fr"),
  dressCodeEn: text("dress_code_en"),
});

// One row per door entry/undo. The id comes from the scanner, so a replayed offline sync can't count twice.
export const checkins = pgTable("checkins", {
  id: text("id").primaryKey(),
  guestId: integer("guest_id")
    .notNull()
    .references(() => guests.id, { onDelete: "cascade" }),
  delta: integer("delta").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export type Guest = typeof guests.$inferSelect;
export type TableRow = typeof tables.$inferSelect;
export type EventSetting = typeof eventSettings.$inferSelect;
