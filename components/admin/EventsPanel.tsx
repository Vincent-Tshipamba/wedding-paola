"use client";
import { useState, useTransition } from "react";
import type { EventSetting, Guest } from "@/db/schema";
import { saveEventSettings } from "@/lib/admin-actions";
import { btnGold, field } from "@/lib/admin-ui";
import { EVENT_LABELS } from "@/lib/config";
import { wedding } from "@/lib/wedding";

export function EventsPanel({ guests, settings }: { guests: Guest[]; settings: EventSetting[] }) {
    return (
        <div>
            <p className="mb-6 max-w-2xl text-sm text-cream/60">
                Fixez le nombre total d&apos;invités par cérémonie : l&apos;ajout ou la modification d&apos;un invité est refusé s&apos;il fait dépasser ce total. Laissez vide pour ne pas limiter. La tenue vestimentaire s&apos;affiche sur l&apos;invitation des personnes invitées à cette cérémonie.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
                {wedding.events.map((e) => (
                    <EventCard key={e.id} id={e.id} date={e.date} setting={settings.find((s) => s.id === e.id)}
                        invited={guests.filter((g) => g.events.includes(e.id) && g.status !== "declined")} />
                ))}
            </div>
        </div>
    );
}

function EventCard({ id, date, setting, invited }: { id: string; date: string; setting?: EventSetting; invited: Guest[] }) {
    const [capacity, setCapacity] = useState(setting?.capacity ? String(setting.capacity) : "");
    const [fr, setFr] = useState(setting?.dressCodeFr ?? "");
    const [en, setEn] = useState(setting?.dressCodeEn ?? "");
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [pending, start] = useTransition();

    const seats = invited.reduce((a, g) => a + g.seats, 0);
    const cap = Number(capacity) > 0 ? Number(capacity) : null;
    const pct = cap ? Math.min(100, (seats / cap) * 100) : 0;
    const when = new Date(date).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kinshasa" });

    const save = () =>
        start(async () => {
            const r = await saveEventSettings({ id, capacity: cap, dressCodeFr: fr, dressCodeEn: en });
            setMsg(r.ok ? { ok: true, text: "Enregistré ✓" } : { ok: false, text: r.error });
        });

    return (
        <div className="space-y-3 rounded-xl border border-gold/20 bg-surface p-5">
            <div>
                <h3 className="font-serif text-2xl text-gold-soft">{EVENT_LABELS[id]}</h3>
                <p className="text-xs capitalize text-cream/50">{when}</p>
            </div>
            <div>
                <p className="text-sm text-cream/70">{invited.length} invitation{invited.length > 1 ? "s" : ""} · {seats} place{seats > 1 ? "s" : ""}{cap ? ` sur ${cap}` : ""}</p>
                {cap && <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${pct >= 100 ? "bg-ember" : "bg-gold"}`} style={{ width: `${pct}%` }} /></div>}
            </div>
            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">Nombre total d&apos;invités
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Pas de limite" className={field} />
            </label>
            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">Tenue (français)
                <input value={fr} onChange={(e) => setFr(e.target.value)} placeholder="ex. Tenue de ville, tons clairs" className={field} />
            </label>
            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">Tenue (anglais)
                <input value={en} onChange={(e) => setEn(e.target.value)} placeholder="e.g. Smart attire, light tones" className={field} />
            </label>
            <div className="flex items-center gap-3">
                <button onClick={save} disabled={pending} className={btnGold}>{pending ? "Enregistrement…" : "Enregistrer"}</button>
                {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-300" : "text-ember"}`}>{msg.text}</p>}
            </div>
        </div>
    );
}