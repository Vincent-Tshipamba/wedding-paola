"use client";
import { useMemo, useState, useTransition } from "react";
import { Download, Pencil, Plus, QrCode, Search, Trash2 } from "lucide-react";
import type { Guest, TableRow } from "@/db/schema";
import { deleteGuest } from "@/lib/admin-actions";
import { btnGhost, btnGold, field } from "@/lib/admin-ui";
import { EVENT_LABELS, STATUSES, STATUS_LABELS, drinkLabel } from "@/lib/config";
import { GuestDialog } from "./GuestDialog";
import { QrDialog, inviteUrl } from "./QrDialog";

const BADGE = { pending: "bg-gold/15 text-gold-soft", confirmed: "bg-emerald-500/15 text-emerald-300", declined: "bg-ember/15 text-ember" };
const HEADERS = ["Invité", "Places", "Statut", "Boisson", "Table", "Cérémonies", ""];

export function GuestsPanel({ guests, tables }: { guests: Guest[]; tables: TableRow[] }) {
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");
    const [editing, setEditing] = useState<Guest | "new" | null>(null);
    const [qrGuest, setQrGuest] = useState<Guest | null>(null);
    const [, start] = useTransition();
    const tableName = (id: number | null) => tables.find((t) => t.id === id)?.name ?? "—";
    const eventNames = (g: Guest, sep: string) => g.events.map((e) => EVENT_LABELS[e] ?? e).join(sep);

    const list = useMemo(() => {
        const s = q.toLowerCase();
        return guests.filter((g) => (status === "all" || g.status === status) && [g.name, g.phone, g.email].some((v) => v?.toLowerCase().includes(s)));
    }, [guests, q, status]);

    function exportCsv() {
        const rows = [
            ["Invité", "Téléphone", "E-mail", "Places", "Statut", "Boisson", "Table", "Cérémonies", "Langue", "Lien d'invitation"],
            ...guests.map((g) => [g.name, g.phone ?? "", g.email ?? "", g.seats, STATUS_LABELS[g.status], g.drink ? drinkLabel(g.drink, "fr") : "", tableName(g.tableId), eventNames(g, " + "), g.locale, inviteUrl(g)]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
        const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })), download: "invites.csv" });
        a.click();
        URL.revokeObjectURL(a.href);
    }

    return (
        <div>
            <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative min-w-52 flex-1">
                    <Search className="absolute left-3 top-2.5 size-4 text-cream/40" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher nom, téléphone, e-mail…" className={`${field} pl-9`} />
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} w-auto`}>
                    <option value="all">Tous les statuts</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <button onClick={exportCsv} className={btnGhost}><Download className="size-4" />CSV</button>
                <button onClick={() => setEditing("new")} className={btnGold}><Plus className="size-4" />Ajouter un invité</button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gold/20">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-surface text-[11px] uppercase tracking-[0.2em] text-gold">
                        <tr>{HEADERS.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gold/10">
                        {list.map((g) => (
                            <tr key={g.id} className="hover:bg-white/[0.03]">
                                <td className="px-4 py-3">
                                    <p className="font-medium">{g.name}</p>
                                    <p className="text-xs text-cream/50">{g.phone ?? g.email ?? ""}{g.invitedAt && " · invité"}{g.arrived > 0 && ` · ${g.arrived}/${g.seats} présent${g.arrived > 1 ? "s" : ""}`}</p>
                                </td>
                                <td className="px-4 py-3">{g.seats}</td>
                                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${BADGE[g.status]}`}>{STATUS_LABELS[g.status]}</span></td>
                                <td className="px-4 py-3">{g.drink ? drinkLabel(g.drink, "fr") : "—"}</td>
                                <td className="px-4 py-3">{tableName(g.tableId)}</td>
                                <td className="px-4 py-3 text-xs text-cream/70">{eventNames(g, ", ") || "—"}</td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-1">
                                        <button aria-label="QR code et invitation" onClick={() => setQrGuest(g)} className={btnGhost}><QrCode className="size-4" /></button>
                                        <button aria-label="Modifier" onClick={() => setEditing(g)} className={btnGhost}><Pencil className="size-4" /></button>
                                        <button aria-label="Supprimer" onClick={() => confirm(`Supprimer ${g.name} ?`) && start(async () => { await deleteGuest(g.id); })} className={btnGhost}><Trash2 className="size-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!list.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-cream/50">Aucun invité pour le moment.</td></tr>}
                    </tbody>
                </table>
            </div>

            <GuestDialog key={editing === "new" ? "new" : editing?.id ?? "none"} guest={editing === "new" ? null : editing} open={editing !== null} onClose={() => setEditing(null)} tables={tables} guests={guests} />
            <QrDialog guest={qrGuest} onClose={() => setQrGuest(null)} />
        </div>
    );
}