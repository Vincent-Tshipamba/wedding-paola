"use client";
import { useMemo, useState, useTransition } from "react";
import { Download, Pencil, Plus, QrCode, Search, Trash2 } from "lucide-react";
import { deleteGuest } from "@/app/admin/actions";
import type { Guest, TableRow } from "@/db/schema";
import { EVENT_LABELS, STATUSES } from "@/lib/config";
import { btnGhost, btnGold, field } from "@/lib/admin-ui";
import { GuestDialog } from "./GuestDialog";
import { QrDialog, inviteUrl } from "./QrDialog";

const BADGE = { pending: "bg-gold/15 text-gold-soft", confirmed: "bg-emerald-500/15 text-emerald-300", declined: "bg-ember/15 text-ember" };

export function GuestsPanel({ guests, tables }: { guests: Guest[]; tables: TableRow[] }) {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [editing, setEditing] = useState<Guest | "new" | null>(null);
    const [qrGuest, setQrGuest] = useState<Guest | null>(null);
    const [, start] = useTransition();
    const tableName = (id: number | null) => tables.find((t) => t.id === id)?.name ?? "—";

    const list = useMemo(() => {
        const s = q.toLowerCase();
        return guests.filter((g) => (status === "all" || g.status === status) && [g.name, g.phone, g.email].some((v) => v?.toLowerCase().includes(s)));
    }, [guests, q, status]);

    function exportCsv() {
        const rows = [["Name", "Phone", "Email", "Seats", "Status", "Drink", "Table", "Events", "Language", "Invitation link"],
        ...guests.map((g) => [g.name, g.phone ?? "", g.email ?? "", g.seats, g.status, g.drink ?? "", tableName(g.tableId), g.events.join(" + "), g.locale, inviteUrl(g)])];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })), download: "guests.csv" });
        a.click();
        URL.revokeObjectURL(a.href);
    }

    return (
        <div>
            <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative min-w-52 flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-cream/40" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email…" className={`${field} pl-9`} />
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} w-auto`}>
                    <option value="all">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={exportCsv} className={btnGhost}><Download className="size-4" />CSV</button>
                <button onClick={() => setEditing("new")} className={btnGold}><Plus className="size-4" />Add guest</button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gold/20">
                <table className="w-full min-w-190 text-left text-sm">
                    <thead className="bg-surface text-[11px] uppercase tracking-[0.2em] text-gold">
                        <tr>{["Guest", "Seats", "Status", "Drink", "Table", "Events", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10">
                        {list.map((g) => (
                            <tr key={g.id} className="hover:bg-white/3">
                                <td className="px-4 py-3">
                                    <p className="font-medium">{g.name}</p>
                                    <p className="text-xs text-cream/50">{g.phone ?? g.email ?? ""}{g.invitedAt && " · invited"}{g.checkedInAt && " · checked in"}</p>
                                </td>
                                <td className="px-4 py-3">{g.seats}</td>
                                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${BADGE[g.status]}`}>{g.status}</span></td>
                                <td className="px-4 py-3">{g.drink ?? "—"}</td>
                                <td className="px-4 py-3">{tableName(g.tableId)}</td>
                                <td className="px-4 py-3 text-xs text-cream/70">{g.events.map((e) => EVENT_LABELS[e] ?? e).join(", ") || "—"}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <button aria-label="QR & invitation" onClick={() => setQrGuest(g)} className={btnGhost}><QrCode className="size-4" /></button>
                                        <button aria-label="Edit" onClick={() => setEditing(g)} className={btnGhost}><Pencil className="size-4" /></button>
                                        <button aria-label="Delete" onClick={() => confirm(`Delete ${g.name}?`) && start(async () => { await deleteGuest(g.id); })} className={btnGhost}><Trash2 className="size-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!list.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-cream/50">No guests yet.</td></tr>}
                    </tbody>
                </table>
            </div>

            <GuestDialog key={editing === "new" ? "new" : editing?.id ?? "none"} guest={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} tables={tables} guests={guests} />
            <QrDialog guest={qrGuest} onClose={() => setQrGuest(null)} />
        </div>
    );
}