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
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }), // used by the door scanner (next step)
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Guest = typeof guests.$inferSelect;
export type TableRow = typeof tables.$inferSelect;
