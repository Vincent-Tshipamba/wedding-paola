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
  requireAdmin,
  roleForPassword,
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

const refresh = () => revalidatePath("/admin");

export async function login(
  _prev: { error?: string } | undefined,
  formData: FormData,
) {
  const role = roleForPassword(String(formData.get("password") ?? ""));
  if (!role) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return { error: "Mot de passe incorrect" };
  }
  await createSession(role);
  redirect(role === "admin" ? "/admin" : "/admin/scan");
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
  if (!name) return { ok: false, error: "Le nom est obligatoire" };
  const seats = Math.min(Math.max(Math.trunc(input.seats) || 1, 1), 20);
  const status = STATUSES.includes(input.status) ? input.status : "pending";

  if (input.tableId) {
    const [t] = await db
      .select()
      .from(tables)
      .where(eq(tables.id, input.tableId));
    if (!t) return { ok: false, error: "Table introuvable" };
    const used = await seatsUsed(t.id, input.id);
    if (status !== "declined" && used + seats > t.capacity)
      return {
        ok: false,
        error: `${t.name} est complète (${used}/${t.capacity} places occupées)`,
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
  refresh();
  return { ok: true };
}

export async function deleteGuest(id: number): Promise<Result> {
  await requireAdmin();
  await db.delete(guests).where(eq(guests.id, id));
  refresh();
  return { ok: true };
}

export async function markInvited(id: number): Promise<Result> {
  await requireAdmin();
  await db
    .update(guests)
    .set({ invitedAt: new Date() })
    .where(eq(guests.id, id));
  refresh();
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
  if (!name) return { ok: false, error: "Le nom de la table est obligatoire" };
  if (input.id) {
    const used = await seatsUsed(input.id);
    if (capacity < used)
      return {
        ok: false,
        error: `${used} places sont déjà assignées à cette table`,
      };
    await db
      .update(tables)
      .set({ name, capacity })
      .where(eq(tables.id, input.id));
  } else {
    await db.insert(tables).values({ name, capacity });
  }
  refresh();
  return { ok: true };
}

export async function deleteTable(id: number): Promise<Result> {
  await requireAdmin();
  await db.update(guests).set({ tableId: null }).where(eq(guests.tableId, id));
  await db.delete(tables).where(eq(tables.id, id));
  refresh();
  return { ok: true };
}
