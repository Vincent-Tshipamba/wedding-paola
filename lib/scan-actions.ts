"use server";
import { and, eq, ilike, lt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { checkins, guests, tables } from "@/db/schema";
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
  | { kind: "choose"; guest: ScanGuest } // party: staff picks how many enter
  | { kind: "declined"; guest: ScanGuest }; // guest answered "no": needs a manual decision
/** One door action, created on the device (id = idempotency key). delta > 0: entry, delta < 0: undo. */
export type Op = { id: string; token: string; delta: number; at: string };

type Row = typeof guests.$inferSelect;

const view = (g: Row, tableName: string | null): ScanGuest => ({
  token: g.token,
  name: g.name,
  seats: g.seats,
  arrived: g.arrived,
  status: g.status,
  tableName,
  notes: g.notes,
  at: g.checkedInAt?.toISOString() ?? null,
});
async function viewOf(g: Row) {
  let name: string | null = null;
  if (g.tableId)
    name =
      (
        await db
          .select({ n: tables.name })
          .from(tables)
          .where(eq(tables.id, g.tableId))
      )[0]?.n ?? null;
  return view(g, name);
}
const byToken = async (token: string) =>
  (
    await db
      .select()
      .from(guests)
      .where(eq(guests.token, String(token).slice(0, 64)))
      .limit(1)
  )[0];

async function totals(): Promise<Totals> {
  const [r] = await db
    .select({
      arrived: sql<number>`coalesce(sum(${guests.arrived}), 0)::int`,
      expected: sql<number>`coalesce(sum(case when ${guests.status} <> 'declined' then ${guests.seats} else 0 end), 0)::int`,
    })
    .from(guests);
  return r;
}

type Recorded =
  | { status: "applied"; row: Row }
  | { status: "duplicate" }
  | { status: "full" };

/** Apply one entry/undo exactly once (same op id twice = ignored) and never beyond the reserved seats. */
async function record(
  guestId: number,
  delta: number,
  opId: string,
  at: Date,
): Promise<Recorded> {
  return db.transaction(async (tx) => {
    const ins = await tx
      .insert(checkins)
      .values({ id: opId, guestId, delta, at })
      .onConflictDoNothing()
      .returning({ id: checkins.id });
    if (!ins.length) return { status: "duplicate" as const };
    const iso = at.toISOString();
    const next = sql`greatest(0, least(${guests.seats}, ${guests.arrived} + ${delta}))`;
    const rows = await tx
      .update(guests)
      .set({
        arrived: next,
        checkedInAt:
          delta > 0
            ? sql`${iso}::timestamptz`
            : sql`case when ${next} <= 0 then null else ${guests.checkedInAt} end`,
      })
      .where(
        delta > 0
          ? and(eq(guests.id, guestId), lt(guests.arrived, guests.seats))
          : eq(guests.id, guestId),
      )
      .returning();
    if (!rows.length) {
      await tx.delete(checkins).where(eq(checkins.id, opId)); // nothing changed: someone else already filled the seats
      return { status: "full" as const };
    }
    return { status: "applied" as const, row: rows[0] };
  });
}

export async function getTotals(): Promise<Totals> {
  await requireStaff();
  return totals();
}

/** Whole guest list, cached on the scanner device so it keeps working without internet. */
export async function getRoster(): Promise<ScanGuest[]> {
  await requireStaff();
  const [gs, ts] = await Promise.all([
    db.select().from(guests),
    db.select().from(tables),
  ]);
  const names = new Map(ts.map((t) => [t.id, t.name]));
  return gs.map((g) =>
    view(g, g.tableId ? (names.get(g.tableId) ?? null) : null),
  );
}

/** A QR code (or a name search result) was read. Single guests are checked in right away. */
export async function scanToken(
  token: string,
  opId: string,
): Promise<{ result: ScanResult; totals: Totals }> {
  await requireStaff();
  const g = await byToken(token);
  if (!g) return { result: { kind: "unknown" }, totals: await totals() };
  if (g.status === "declined")
    return {
      result: { kind: "declined", guest: await viewOf(g) },
      totals: await totals(),
    };
  if (g.arrived >= g.seats)
    return {
      result: { kind: "already", guest: await viewOf(g) },
      totals: await totals(),
    };
  if (g.seats > 1)
    return {
      result: { kind: "choose", guest: await viewOf(g) },
      totals: await totals(),
    };

  const rec = await record(g.id, 1, opId, new Date());
  revalidatePath("/admin");
  if (rec.status === "full")
    return {
      result: { kind: "already", guest: await viewOf((await byToken(token))!) },
      totals: await totals(),
    };
  const row = rec.status === "applied" ? rec.row : (await byToken(token))!; // duplicate = a retry of an op we already applied
  return {
    result: { kind: "ok", guest: await viewOf(row), entered: 1 },
    totals: await totals(),
  };
}

/** Validate `count` more people for a party (force = also let in a guest who declined). */
export async function confirmEntry(
  token: string,
  count: number,
  force: boolean,
  opId: string,
): Promise<{ result: ScanResult; totals: Totals }> {
  await requireStaff();
  const g = await byToken(token);
  if (!g) return { result: { kind: "unknown" }, totals: await totals() };
  if (g.status === "declined" && !force)
    return {
      result: { kind: "declined", guest: await viewOf(g) },
      totals: await totals(),
    };
  const remaining = g.seats - g.arrived;
  if (remaining <= 0)
    return {
      result: { kind: "already", guest: await viewOf(g) },
      totals: await totals(),
    };

  const n = Math.min(Math.max(Math.trunc(count) || 1, 1), remaining);
  const rec = await record(g.id, n, opId, new Date());
  revalidatePath("/admin");
  const row = rec.status === "applied" ? rec.row : (await byToken(token))!;
  return {
    result: { kind: "ok", guest: await viewOf(row), entered: n },
    totals: await totals(),
  };
}

/** Cancel a mistaken entry. */
export async function undoEntry(
  token: string,
  count: number,
  opId: string,
): Promise<Totals> {
  await requireStaff();
  const g = await byToken(token);
  if (g) {
    await record(g.id, -Math.max(Math.trunc(count) || 1, 1), opId, new Date());
    revalidatePath("/admin");
  }
  return totals();
}

/** Manual lookup when a QR code can't be read. */
export async function searchGuests(query: string): Promise<ScanGuest[]> {
  await requireStaff();
  const clean = String(query)
    .trim()
    .replace(/[%_\\]/g, "")
    .slice(0, 60);
  if (clean.length < 2) return [];
  const term = `%${clean}%`;
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
  return Promise.all(rows.map(viewOf));
}

/** Replay the actions recorded while the device was offline. Safe to call twice with the same ops. */
export async function syncOps(
  ops: Op[],
): Promise<{ done: string[]; conflicts: string[]; totals: Totals }> {
  await requireStaff();
  const done: string[] = [];
  const conflicts: string[] = [];
  const list = (Array.isArray(ops) ? ops : [])
    .slice(0, 300)
    .sort((a, b) => String(a?.at).localeCompare(String(b?.at)));
  for (const op of list) {
    try {
      if (typeof op?.id !== "string" || op.id.length > 64) continue;
      if (
        typeof op.token !== "string" ||
        !Number.isInteger(op.delta) ||
        op.delta === 0 ||
        Math.abs(op.delta) > 20
      ) {
        done.push(op.id);
        continue;
      }
      const g = await byToken(op.token);
      if (!g) {
        done.push(op.id);
        continue;
      }
      const at = new Date(op.at);
      const rec = await record(
        g.id,
        op.delta,
        op.id,
        Number.isNaN(+at) ? new Date() : at,
      );
      if (rec.status === "full") conflicts.push(g.name); // already fully inside (e.g. scanned on another device meanwhile)
      done.push(op.id);
    } catch {
      /* leave it in the queue: it will be retried at the next sync */
    }
  }
  revalidatePath("/admin");
  return { done, conflicts, totals: await totals() };
}
