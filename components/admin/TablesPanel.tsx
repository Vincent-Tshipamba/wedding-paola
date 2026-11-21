"use client";
import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteTable, saveTable } from "@/app/admin/actions";
import type { Guest, TableRow } from "@/db/schema";
import { btnGhost, btnGold, field } from "@/lib/admin-ui";

export function TablesPanel({ guests, tables }: { guests: Guest[]; tables: TableRow[] }) {
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState(10);
    const [error, setError] = useState("");
    const [, start] = useTransition();

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        start(async () => {
            const r = await saveTable({ name, capacity });
            if (r.ok) { setName(""); setError(""); } else setError(r.error);
        });
    };

    return (
        <div>
            <form onSubmit={add} className="mb-6 flex flex-wrap items-end gap-3">
                <label className="space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">Table name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Table 1 or Family" className={`${field} w-56`} /></label>
                <label className="space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">Seats<input type="number" min={1} max={50} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={`${field} w-24`} /></label>
                <button className={btnGold}><Plus className="size-4" />Add table</button>
                {error && <p role="alert" className="w-full text-sm text-ember">{error}</p>}
            </form>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tables.map((t) => <TableCard key={t.id} table={t} guests={guests.filter((g) => g.tableId === t.id)} />)}
                {!tables.length && <p className="text-cream/50">No tables yet. Create the first one above, then assign guests from their edit form.</p>}
            </div>
        </div>
    );
}

function TableCard({ table, guests }: { table: TableRow; guests: Guest[] }) {
    const [edit, setEdit] = useState(false);
    const [name, setName] = useState(table.name);
    const [capacity, setCapacity] = useState(table.capacity);
    const [error, setError] = useState("");
    const [, start] = useTransition();
    const used = guests.filter((g) => g.status !== "declined").reduce((a, g) => a + g.seats, 0);
    const pct = Math.min(100, (used / table.capacity) * 100);

    return (
        <div className="rounded-xl border border-gold/20 bg-surface p-5">
            {edit ? (
                <div className="space-y-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
                    <input type="number" min={1} max={50} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={field} />
                    {error && <p className="text-xs text-ember">{error}</p>}
                    <div className="flex gap-2">
                        <button aria-label="Save" onClick={() => start(async () => { const r = await saveTable({ id: table.id, name, capacity }); if (r.ok) setEdit(false); else setError(r.error); })} className={btnGold}><Check className="size-4" /></button>
                        <button aria-label="Cancel" onClick={() => setEdit(false)} className={btnGhost}><X className="size-4" /></button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-start justify-between">
                        <h3 className="font-serif text-2xl text-gold-soft">{table.name}</h3>
                        <div className="flex gap-1">
                            <button aria-label="Edit table" onClick={() => setEdit(true)} className={btnGhost}><Pencil className="size-4" /></button>
                            <button aria-label="Delete table" onClick={() => confirm(`Delete ${table.name}? Its guests become unassigned.`) && start(async () => { await deleteTable(table.id); })} className={btnGhost}><Trash2 className="size-4" /></button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-cream/60">{used} / {table.capacity} seats</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${pct >= 100 ? "bg-ember" : "bg-gold"}`} style={{ width: `${pct}%` }} /></div>
                    <ul className="mt-4 space-y-1 text-sm text-cream/80">
                        {guests.map((g) => <li key={g.id} className={g.status === "declined" ? "line-through opacity-40" : ""}>{g.name}{g.seats > 1 && <span className="text-cream/40"> +{g.seats - 1}</span>}</li>)}
                    </ul>
                </>
            )}
        </div>
    );
}