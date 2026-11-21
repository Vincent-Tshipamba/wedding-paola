"use server";
import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { guests, tables } from "@/db/schema";
import {
  createSession,
  destroySession,
  passwordMatches,
  requireAdmin,
} from "@/lib/auth";
import { DRINKS, STATUSES } from "@/lib/config";
import { wedding } from "@/lib/wedding";

export type Result = { ok: true } | { ok: false; error: string };
export type GuestInput = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  seats: number;
  locale: "fr" | "en";
  status: (typeof STATUSES)[number];
  drink: string;
  tableId: number | null;
  events: string[];
  notes: string;
};

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  if (!passwordMatches(String(formData.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Wrong password" };
  }
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

async function seatsUsed(tableId: number, exceptGuestId?: number) {
  const rows = await db
    .select({ seats: guests.seats })
    .from(guests)
    .where(
      and(
        eq(guests.tableId, tableId),
        ne(guests.status, "declined"),
        exceptGuestId ? ne(guests.id, exceptGuestId) : undefined,
      ),
    );
  return rows.reduce((a, r) => a + r.seats, 0);
}

export async function saveGuest(input: GuestInput): Promise<Result> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required" };
  const seats = Math.min(Math.max(Math.trunc(input.seats) || 1, 1), 20);
  const status = STATUSES.includes(input.status) ? input.status : "pending";

  if (input.tableId) {
    const [t] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, input.tableId));
    if (!t) return { ok: false, error: "Table not found" };
    const used = await seatsUsed(t.id, input.id);
    if (status !== "declined" && used + seats > t.capacity)
      return {
        ok: false,
        error: `${t.name} is full (${used}/${t.capacity} seats taken)`,
      };
  }

  const values = {
    name,
    seats,
    status,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    locale: input.locale === "en" ? ("en" as const) : ("fr" as const),
    drink: (DRINKS as readonly string[]).includes(input.drink)
      ? input.drink
      : null,
    tableId: input.tableId || null,
    events: input.events.filter((e) => wedding.events.some((w) => w.id === e)),
    notes: input.notes.trim() || null,
  };
  if (input.id)
    await db.update(guests).set(values).where(eq(guests.id, input.id));
  else
    await db
      .insert(guests)
      .values({ ...values, token: randomBytes(9).toString("base64url") });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteGuest(id: number): Promise<Result> {
  await requireAdmin();
  await db.delete(guests).where(eq(guests.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

export async function markInvited(id: number): Promise<Result> {
  await requireAdmin();
  await db
    .update(guests)
    .set({ invitedAt: new Date() })
    .where(eq(guests.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveTable(input: {
  id?: number;
  name: string;
  capacity: number;
}): Promise<Result> {
  await requireAdmin();
  const name = input.name.trim();
  const capacity = Math.min(Math.max(Math.trunc(input.capacity) || 0, 1), 50);
  if (!name) return { ok: false, error: "Table name is required" };
  if (input.id) {
    const used = await seatsUsed(input.id);
    if (capacity < used)
      return {
        ok: false,
        error: `${used} seats are already assigned to this table`,
      };
    await db
      .update(tables)
      .set({ name, capacity })
      .where(eq(tables.id, input.id));
  } else {
    await db.insert(tables).values({ name, capacity });
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteTable(id: number): Promise<Result> {
  await requireAdmin();
  await db.update(guests).set({ tableId: null }).where(eq(guests.tableId, id));
  await db.delete(tables).where(eq(tables.id, id));
  revalidatePath("/admin");
  return { ok: true };
}
