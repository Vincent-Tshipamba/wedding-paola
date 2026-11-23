import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { guests, tables } from "@/db/schema";
import { wedding } from "@/lib/wedding";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function InvitationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
    return (
        <Suspense fallback={<main className="grid min-h-svh place-items-center px-4 text-cream/60">Loading invitation…</main>}>
            <InvitationContent params={params} />
        </Suspense>
    );
}

async function InvitationContent({ params }: { params: Promise<{ locale: string; token: string }> }) {
    const { locale, token } = await params;
    console.log(token)
    const [guest] = await db.select().from(guests).where(eq(guests.token, token)).limit(1);
    if (!guest) notFound();
    const [table] = guest.tableId ? await db.select().from(tables).where(eq(tables.id, guest.tableId)) : [];

    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const qr = await QRCode.toDataURL(`${origin}/${locale}/invitation/${token}`, { width: 480, margin: 2, errorCorrectionLevel: "M" });

    return (
        <InvitationExperience
            data={{
                token, qr,
                name: guest.name, seats: guest.seats, status: guest.status, drink: guest.drink,
                tableName: table?.name ?? null,
                events: wedding.events.filter((e) => guest.events.includes(e.id)),
            }}
        />
    );
}