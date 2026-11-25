import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { eventSettings, guests, tables } from "@/db/schema";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";
import { wedding } from "@/lib/wedding";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
    const { locale, token } = await params;
    const [guest] = await db.select().from(guests).where(eq(guests.token, token)).limit(1);
    if (!guest) notFound();
    const [table] = guest.tableId ? await db.select().from(tables).where(eq(tables.id, guest.tableId)) : [];
    const settings = await db.select().from(eventSettings);

    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const qr = await QRCode.toDataURL(`${origin}/${locale}/invitation/${token}`, { width: 720, margin: 2, errorCorrectionLevel: "M" });

    // Only the ceremonies this guest is invited to, with the dress code in the guest's language.
    const events = wedding.events
        .filter((e) => guest.events.includes(e.id))
        .map((e) => {
            const s = settings.find((x) => x.id === e.id);
            const dressCode = s ? (locale === "en" ? s.dressCodeEn || s.dressCodeFr : s.dressCodeFr || s.dressCodeEn) : null;
            return { id: e.id, date: e.date, venue: e.venue || null, address: e.address || null, dressCode: dressCode || null };
        });

    return (
        <InvitationExperience
            data={{ token, qr, name: guest.name, seats: guest.seats, companion: guest.companion, status: guest.status, drink: guest.drink, tableName: table?.name ?? null, events }}
        />
    );
}