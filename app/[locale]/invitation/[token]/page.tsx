import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/db";
import { guests, tables } from "@/db/schema";
import { wedding } from "@/lib/wedding";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function InvitationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
    const { locale, token } = await params;
    setRequestLocale(locale);
    const [guest] = await db.select().from(guests).where(eq(guests.token, token)).limit(1);
    if (!guest) notFound();
    const [table] = guest.tableId ? await db.select().from(tables).where(eq(tables.id, guest.tableId)) : [];

    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const qr = await QRCode.toDataURL(`${origin}/${locale}/invitation/${token}`, { width: 480, margin: 2, errorCorrectionLevel: "M" });

    const t = await getTranslations("invitation");
    const te = await getTranslations("events");
    const f = await getFormatter();
    const events = wedding.events.filter((e) => guest.events.includes(e.id));

    return (
        <main className="grid min-h-svh place-items-center px-4 py-16">
            <article className="w-full max-w-md rounded-[2rem] border border-gold/50 bg-surface/90 p-8 text-center shadow-[0_0_80px_rgba(179,18,31,.35)] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.45em] text-gold">{t("kicker")}</p>
                <p className="mt-4 font-script text-5xl text-gold-soft">{guest.name}</p>
                <p className="mt-4 text-cream/70">{t("text")}</p>
                <p className="mt-5 font-script text-5xl text-gold-soft">{wedding.couple.bride.firstName} &amp; {wedding.couple.groom.firstName}</p>

                <ul className="mt-6 space-y-3 border-y border-gold/20 py-5 text-left">
                    {events.map((e) => (
                        <li key={e.id} className="flex items-baseline justify-between gap-4">
                            <span className="font-serif text-xl text-cream">{te(`${e.id}.title`)}</span>
                            <span className="text-right text-xs text-cream/60">{f.dateTime(new Date(e.date), { day: "numeric", month: "long" })} · {f.dateTime(new Date(e.date), { hour: "2-digit", minute: "2-digit" })}</span>
                        </li>
                    ))}
                </ul>

                <p className="mt-5 text-sm text-cream/70">{t("seats", { count: guest.seats })}</p>
                <p className="text-sm text-gold-soft">{table ? t("table", { name: table.name }) : t("tableSoon")}</p>

                <div className="mx-auto mt-6 w-56 rounded-xl bg-white p-2">
                    <Image src={qr} alt="QR code" width={240} height={240} unoptimized className="size-full" />
                </div>
                <p className="mt-3 text-xs text-cream/50">{t("scan")}</p>
            </article>
        </main>
    );
}