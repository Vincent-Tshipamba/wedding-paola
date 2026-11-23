"use client";
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Guest, TableRow } from "@/db/schema";
import { saveGuest, type GuestInput } from "@/lib/admin-actions";
import { btnGhost, btnGold, field } from "@/lib/admin-ui";
import { DRINKS, EVENT_LABELS, STATUSES, STATUS_LABELS, drinkLabel } from "@/lib/config";
import { wedding } from "@/lib/wedding";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">{label}{children}</label>
);

export function GuestDialog({ guest, open, onClose, tables, guests }: { guest: Guest | null; open: boolean; onClose: () => void; tables: TableRow[]; guests: Guest[] }) {
    const [f, setF] = useState<GuestInput>({
        id: guest?.id, name: guest?.name ?? "", phone: guest?.phone ?? "", email: guest?.email ?? "", seats: guest?.seats ?? 1,
        locale: guest?.locale ?? "fr", status: guest?.status ?? "pending", drink: guest?.drink ?? "", tableId: guest?.tableId ?? null,
        events: guest?.events ?? wedding.events.map((e) => e.id), notes: guest?.notes ?? "",
    });
    const [error, setError] = useState("");
    const [pending, start] = useTransition();
    const set = <K extends keyof GuestInput>(k: K, v: GuestInput[K]) => setF((p) => ({ ...p, [k]: v }));
    const free = (t: TableRow) => t.capacity - guests.filter((g) => g.tableId === t.id && g.id !== guest?.id && g.status !== "declined").reduce((a, g) => a + g.seats, 0);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        start(async () => {
            const r = await saveGuest(f);
            if (r.ok) onClose(); else setError(r.error);
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto border-gold/30 bg-night text-cream sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-serif text-3xl text-gold-soft">{guest ? "Modifier l'invité" : "Ajouter un invité"}</DialogTitle>
                    <DialogDescription className="text-cream/50">Un QR code personnel est généré automatiquement.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Nom *"><input required value={f.name} onChange={(e) => set("name", e.target.value)} className={field} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Téléphone (WhatsApp)"><input value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+243…" className={field} /></Field>
                        <Field label="E-mail"><input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} /></Field>
                        <Field label="Places (accompagnants inclus)"><input type="number" min={1} max={20} value={f.seats} onChange={(e) => set("seats", Number(e.target.value))} className={field} /></Field>
                        <Field label="Langue de l'invitation"><select value={f.locale} onChange={(e) => set("locale", e.target.value as "fr" | "en")} className={field}><option value="fr">Français</option><option value="en">English</option></select></Field>
                        <Field label="Statut"><select value={f.status} onChange={(e) => set("status", e.target.value as GuestInput["status"])} className={field}>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
                        <Field label="Boisson"><select value={f.drink} onChange={(e) => set("drink", e.target.value)} className={field}><option value="">—</option>{DRINKS.map((d) => <option key={d} value={d}>{drinkLabel(d, "fr")}</option>)}</select></Field>
                    </div>
                    <Field label="Table">
                        <select value={f.tableId ?? ""} onChange={(e) => set("tableId", e.target.value ? Number(e.target.value) : null)} className={field}>
                            <option value="">Non assignée</option>
                            {tables.map((t) => <option key={t.id} value={t.id}>{t.name} — {free(t)} libres</option>)}
                        </select>
                    </Field>
                    <fieldset className="space-y-2">
                        <legend className="text-xs uppercase tracking-[0.15em] text-gold">Invité à</legend>
                        <div className="flex flex-wrap gap-4">
                            {wedding.events.map((e) => (
                                <label key={e.id} className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={f.events.includes(e.id)} onChange={(ev) => set("events", ev.target.checked ? [...f.events, e.id] : f.events.filter((x) => x !== e.id))} className="accent-gold" />
                                    {EVENT_LABELS[e.id]}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <Field label="Notes"><textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={field} /></Field>
                    {error && <p role="alert" className="text-sm text-ember">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={btnGhost}>Annuler</button>
                        <button disabled={pending} className={btnGold}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}