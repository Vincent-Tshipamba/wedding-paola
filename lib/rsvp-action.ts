"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { guests } from "@/db/schema";
import { DRINKS } from "@/lib/config";

// Public action: the unguessable invitation token is the credential.
export async function submitRsvp(token: string, attending: boolean, drink: string): Promise<{ ok: boolean }> {
  if (typeof token !== "string" || token.length < 8 || token.length > 64) return { ok: false };
  const changes = attending
    ? { status: "confirmed" as const, drink: (DRINKS as readonly string[]).includes(drink) ? drink : null }
    : { status: "declined" as const };
  const rows = await db.update(guests).set(changes).where(eq(guests.token, token)).returning({ id: guests.id });
  return { ok: rows.length > 0 };
}