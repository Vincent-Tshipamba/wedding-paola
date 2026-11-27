"use client";
import Link from "next/link";
import { useState } from "react";
import type { EventSetting, Guest, TableRow } from "@/db/schema";
import { logout } from "@/lib/admin-actions";
import { btnGhost, btnGold } from "@/lib/admin-ui";
import { DRINKS, drinkLabel } from "@/lib/config";
import { EventsPanel } from "./EventsPanel";
import { InstallButton } from "./InstallButton";
import { GuestsPanel } from "./GuestsPanel";
import { TablesPanel } from "./TablesPanel";

const TABS = [["guests", "Invités"], ["events", "Événements"], ["tables", "Tables"], ["drinks", "Boissons"]] as const;

export function AdminApp({ guests, tables, settings }: { guests: Guest[]; tables: TableRow[]; settings: EventSetting[] }) {
    const [tab, setTab] = useState<(typeof TABS)[number][0]>("guests");
    const active = guests.filter((g) => g.status !== "declined");
    const sum = (list: Guest[]) => list.reduce((a, g) => a + g.seats, 0);
    const stats: [string, string | number][] = [
        ["Invitations", guests.length],
        ["Places attendues", sum(active)],
        ["Places confirmées", sum(guests.filter((g) => g.status === "confirmed"))],
        ["En attente", guests.filter((g) => g.status === "pending").length],
        ["Placés", `${sum(active.filter((g) => g.tableId))}/${sum(active)}`],
        ["Entrés", `${guests.reduce((a, g) => a + g.arrived, 0)}/${sum(active)}`],
    ];

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="font-script text-5xl leading-none text-gold-soft">Azaria &amp; Paola</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.4em] text-gold">Gestion des invités</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <InstallButton />
                    <Link href="/admin/scan" className={btnGhost}>Contrôle d&apos;entrée</Link>
                    <Link href="/" className={btnGhost}>Voir le site</Link>
                    <form action={logout}><button className={btnGold}>Se déconnecter</button></form>
                </div>
            </header>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {stats.map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-gold/20 bg-surface p-4">
                        <p className="font-serif text-4xl text-gold-soft">{value}</p>
                        <p className="text-[11px] uppercase tracking-[0.2em] text-cream/60">{label}</p>
                    </div>
                ))}
            </div>

            <div className="mb-6 flex gap-2 border-b border-gold/20">
                {TABS.map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)} className={`-mb-px border-b-2 px-4 py-2 text-sm transition ${tab === id ? "border-gold text-gold-soft" : "border-transparent text-cream/60 hover:text-cream"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === "guests" && <GuestsPanel guests={guests} tables={tables} settings={settings} />}
            {tab === "events" && <EventsPanel guests={guests} settings={settings} />}
            {tab === "tables" && <TablesPanel guests={guests} tables={tables} />}
            {tab === "drinks" && <DrinksPanel guests={active} />}
        </div>
    );
}

function DrinksPanel({ guests }: { guests: Guest[] }) {
    const count = (d: string | null) => guests.filter((g) => g.drink === d).reduce((a, g) => a + g.seats, 0);
    const rows: [string, number][] = [...DRINKS.map((d): [string, number] => [drinkLabel(d, "fr"), count(d)]), ["Pas encore choisi", count(null)]];
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
        <div className="max-w-xl space-y-3">
            <p className="text-sm text-cream/60">Places par boisson (invités déclinés exclus). Le choix d&apos;un invité s&apos;applique à toutes les places de son invitation.</p>
            {rows.map(([name, n]) => (
                <div key={name}>
                    <div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-gold-soft">{n}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-crimson to-gold" style={{ width: `${(n / max) * 100}%` }} /></div>
                </div>
            ))}
        </div>
    );
}