"use server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { guests, tables } from "@/db/schema";
import { requireStaff } from "@/lib/auth";

export type ScanGuest = {
  token: string;
  name: string;
  seats: number;
  arrived: number;
  status: "pending" | "confirmed" | "declined";
  tableName: string | null;
  notes: string | null;
  at: string | null;
};
export type Totals = { arrived: number; expected: number };
export type ScanResult =
  | { kind: "unknown" }
  | { kind: "ok"; guest: ScanGuest; entered: number } // entry validated just now
  | { kind: "already"; guest: ScanGuest } // every reserved seat is already inside
  | { kind: "choose"; guest: ScanGuest } // party with companions: staff picks how many enter
  | { kind: "declined"; guest: ScanGuest }; // guest answered "no": needs a manual decision

type Row = typeof guests.$inferSelect;

async function toGuest(g: Row): Promise<ScanGuest> {
  let tableName: string | null = null;
  if (g.tableId) {
    const [t] = await db
      .select({ name: tables.name })
      .from(tables)
      .where(eq(tables.id, g.tableId));
    tableName = t?.name ?? null;
  }
  return {
    token: g.token,
    name: g.name,
    seats: g.seats,
    arrived: g.arrived,
    status: g.status,
    tableName,
    notes: g.notes,
    at: g.checkedInAt?.toISOString() ?? null,
  };
}

export async function getTotals(): Promise<Totals> {
  await requireStaff();
  return totals();
}

async function totals(): Promise<Totals> {
  const [r] = await db
    .select({
      arrived: sql<number>`coalesce(sum(${guests.arrived}), 0)::int`,
      expected: sql<number>`coalesce(sum(case when ${guests.status} <> 'declined' then ${guests.seats} else 0 end), 0)::int`,
    })
    .from(guests);
  return r;
}

const byToken = async (token: string) =>
  (
    await db
      .select()
      .from(guests)
      .where(eq(guests.token, String(token).slice(0, 64)))
      .limit(1)
  )[0];

/** A QR code (or a name search result) was read. Single guests are checked in right away. */
export async function scanToken(
  token: string,
): Promise<{ result: ScanResult; totals: Totals }> {
  await requireStaff();
  const g = await byToken(token);
  if (!g) return { result: { kind: "unknown" }, totals: await totals() };
  if (g.status === "declined")
    return {
      result: { kind: "declined", guest: await toGuest(g) },
      totals: await totals(),
    };
  if (g.arrived >= g.seats)
    return {
      result: { kind: "already", guest: await toGuest(g) },
      totals: await totals(),
    };

  if (g.seats === 1) {
    // Atomic: if two scanners read the same QR at once, only one of them wins.
    const rows = await db
      .update(guests)
      .set({ arrived: 1, checkedInAt: new Date() })
      .where(and(eq(guests.id, g.id), eq(guests.arrived, 0)))
      .returning();
    revalidatePath("/admin");
    if (rows.length)
      return {
        result: { kind: "ok", guest: await toGuest(rows[0]), entered: 1 },
        totals: await totals(),
      };
    const again = await byToken(token);
    return {
      result: { kind: "already", guest: await toGuest(again) },
      totals: await totals(),
    };
  }
  return {
    result: { kind: "choose", guest: await toGuest(g) },
    totals: await totals(),
  };
}

/** Validate `count` more people for a party (force = also let in a guest who declined). */
export async function confirmEntry(
  token: string,
  count: number,
  force = false,
): Promise<{ result: ScanResult; totals: Totals }> {
  await requireStaff();
  const g = await byToken(token);
  if (!g) return { result: { kind: "unknown" }, totals: await totals() };
  if (g.status === "declined" && !force)
    return {
      result: { kind: "declined", guest: await toGuest(g) },
      totals: await totals(),
    };
  const remaining = g.seats - g.arrived;
  if (remaining <= 0)
    return {
      result: { kind: "already", guest: await toGuest(g) },
      totals: await totals(),
    };

  const n = Math.min(Math.max(Math.trunc(count) || 1, 1), remaining);
  const [row] = await db
    .update(guests)
    .set({
      arrived: sql`least(${guests.seats}, ${guests.arrived} + ${n})`,
      checkedInAt: new Date(),
    })
    .where(eq(guests.id, g.id))
    .returning();
  revalidatePath("/admin");
  return {
    result: { kind: "ok", guest: await toGuest(row), entered: n },
    totals: await totals(),
  };
}

/** Cancel a mistaken entry. */
export async function undoEntry(token: string, count: number): Promise<Totals> {
  await requireStaff();
  const g = await byToken(token);
  if (g) {
    const n = Math.max(Math.trunc(count) || 1, 1);
    await db
      .update(guests)
      .set({
        arrived: sql`greatest(0, ${guests.arrived} - ${n})`,
        checkedInAt: sql`case when ${guests.arrived} - ${n} <= 0 then null else ${guests.checkedInAt} end`,
      })
      .where(eq(guests.id, g.id));
    revalidatePath("/admin");
  }
  return totals();
}

/** Manual lookup when a QR code can't be read. */
export async function searchGuests(query: string): Promise<ScanGuest[]> {
  await requireStaff();
  const term = `%${String(query)
    .trim()
    .replace(/[%_\\]/g, "")
    .slice(0, 60)}%`;
  if (term.length < 4) return [];
  const rows = await db
    .select()
    .from(guests)
    .where(
      or(
        ilike(guests.name, term),
        ilike(guests.phone, term),
        ilike(guests.email, term),
      ),
    )
    .limit(8);
  return Promise.all(rows.map(toGuest));
}
