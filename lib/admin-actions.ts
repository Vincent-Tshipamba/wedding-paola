"use server";
import { randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventSettings, guests, tables } from "@/db/schema";
import {
  createSession,
  destroySession,
  requireAdmin,
  roleForPassword,
} from "@/lib/auth";
import { COMPANIONS, DRINKS, EVENT_LABELS, STATUSES } from "@/lib/config";
import { wedding } from "@/lib/wedding";

export type Result = { ok: true } | { ok: false; error: string };
export type GuestInput = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  seats: number;
  companion: (typeof COMPANIONS)[number];
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

// ---------- seats used (declined guests don't count) ----------
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

async function eventSeatsUsed(eventId: string, exceptGuestId?: number) {
  const rows = await db
    .select({ seats: guests.seats })
    .from(guests)
    .where(
      and(
        ne(guests.status, "declined"),
        sql`${guests.events} @> ${JSON.stringify([eventId])}::jsonb`,
        exceptGuestId ? ne(guests.id, exceptGuestId) : undefined,
      ),
    );
  return rows.reduce((a, r) => a + r.seats, 0);
}

// ---------- guests ----------
export async function saveGuest(input: GuestInput): Promise<Result> {
  await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Le nom est obligatoire" };
  const companion = COMPANIONS.includes(input.companion)
    ? input.companion
    : "none";
  let seats = Math.min(Math.max(Math.trunc(input.seats) || 1, 1), 20);
  if (companion !== "none") seats = Math.max(seats, 2); // a couple takes at least 2 seats
  const status = STATUSES.includes(input.status) ? input.status : "pending";
  const events = input.events.filter((e) =>
    wedding.events.some((w) => w.id === e),
  );

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

  // Never go beyond the total set for each ceremony (Événements tab)
  if (status !== "declined") {
    const settings = await db.select().from(eventSettings);
    for (const id of events) {
      const cap = settings.find((s) => s.id === id)?.capacity;
      if (!cap) continue;
      const used = await eventSeatsUsed(id, input.id);
      if (used + seats > cap)
        return {
          ok: false,
          error: `Capacité dépassée pour « ${EVENT_LABELS[id]} » : ${used}/${cap} places déjà réservées, il en faudrait ${used + seats}.`,
        };
    }
  }

  const values = {
    name,
    seats,
    status,
    companion,
    events,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    locale: input.locale === "en" ? ("en" as const) : ("fr" as const),
    drink: (DRINKS as readonly string[]).includes(input.drink)
      ? input.drink
      : null,
    tableId: input.tableId || null,
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

// ---------- tables ----------
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
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(guests)
    .where(eq(guests.tableId, id));
  if (n > 0) {
    return {
      ok: false,
      error: `Impossible de supprimer cette table : ${n} invité${n > 1 ? "s sont assignés" : " est assigné"} à cette table. Réassignez-${n > 1 ? "les" : "le"} d'abord à une autre table.`,
    };
  }
  await db.delete(tables).where(eq(tables.id, id));
  refresh();
  return { ok: true };
}

// ---------- events (capacity + dress code) ----------
export async function saveEventSettings(input: {
  id: string;
  capacity: number | null;
  dressCodeFr: string;
  dressCodeEn: string;
}): Promise<Result> {
  await requireAdmin();
  if (!wedding.events.some((e) => e.id === input.id))
    return { ok: false, error: "Cérémonie inconnue" };
  const capacity =
    input.capacity && Number.isFinite(input.capacity) && input.capacity > 0
      ? Math.min(Math.trunc(input.capacity), 5000)
      : null;
  if (capacity !== null) {
    const used = await eventSeatsUsed(input.id);
    if (capacity < used)
      return {
        ok: false,
        error: `${used} places sont déjà réservées pour cette cérémonie : le total ne peut pas être inférieur.`,
      };
  }
  const values = {
    capacity,
    dressCodeFr: input.dressCodeFr.trim().slice(0, 200) || null,
    dressCodeEn: input.dressCodeEn.trim().slice(0, 200) || null,
  };
  await db
    .insert(eventSettings)
    .values({ id: input.id, ...values })
    .onConflictDoUpdate({ target: eventSettings.id, set: values });
  refresh();
  return { ok: true };
}
