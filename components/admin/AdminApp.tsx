"use client";
import { useState } from "react";
import { logout } from "@/app/admin/actions";
import type { Guest, TableRow } from "@/db/schema";
import { DRINKS } from "@/lib/config";
import { btnGhost, btnGold } from "@/lib/admin-ui";
import { GuestsPanel } from "./GuestsPanel";
import { TablesPanel } from "./TablesPanel";

const TABS = [["guests", "Guests"], ["tables", "Tables"], ["drinks", "Drinks"]] as const;

export function AdminApp({ guests, tables }: { guests: Guest[]; tables: TableRow[] }) {
    const [tab, setTab] = useState<(typeof TABS)[number][0]>("guests");
    const active = guests.filter((g) => g.status !== "declined");
    const sum = (list: Guest[]) => list.reduce((a, g) => a + g.seats, 0);
    const stats = [
        ["Invitations", guests.length],
        ["Expected seats", sum(active)],
        ["Confirmed seats", sum(guests.filter((g) => g.status === "confirmed"))],
        ["Pending", guests.filter((g) => g.status === "pending").length],
        ["Seated", `${sum(active.filter((g) => g.tableId))}/${sum(active)}`],
    ];

    return (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="font-script text-5xl leading-none text-gold-soft">Paola &amp; Azarias</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.4em] text-gold">Guest management</p>
                </div>
                <div className="flex gap-2">
                    <a href="/" className={btnGhost}>View site</a>
                    <form action={logout}><button className={btnGold}>Sign out</button></form>
                </div>
            </header>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
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

            {tab === "guests" && <GuestsPanel guests={guests} tables={tables} />}
            {tab === "tables" && <TablesPanel guests={guests} tables={tables} />}
            {tab === "drinks" && <DrinksPanel guests={active} />}
        </div>
    );
}

function DrinksPanel({ guests }: { guests: Guest[] }) {
    const count = (d: string | null) => guests.filter((g) => g.drink === d).reduce((a, g) => a + g.seats, 0);
    const rows = [...DRINKS.map((d) => [d as string, count(d)] as const), ["Not chosen yet", count(null)] as const];
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
        <div className="max-w-xl space-y-3">
            <p className="text-sm text-cream/60">Seats per drink choice (declined guests excluded). A guest&apos;s choice applies to all seats of their invitation.</p>
            {rows.map(([name, n]) => (
                <div key={name}>
                    <div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="text-gold-soft">{n}</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-crimson to-gold" style={{ width: `${(n / max) * 100}%` }} /></div>
                </div>
            ))}
        </div>
    );
}