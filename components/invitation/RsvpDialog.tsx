"use client";
import { useState } from "react";
import confetti from "canvas-confetti";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { btnGold, field } from "@/lib/admin-ui";
import { DRINKS, drinkLabel } from "@/lib/config";
import { submitRsvp } from "@/lib/rsvp-action";
import { cn } from "@/lib/utils";

export type Rsvp = { status: "pending" | "confirmed" | "declined"; drink: string | null };

export function RsvpDialog({ open, onOpenChange, token, current, onSaved }: {
    open: boolean; onOpenChange: (o: boolean) => void; token: string; current: Rsvp; onSaved: (r: Rsvp) => void;
}) {
    const t = useTranslations("invitation");
    const locale = useLocale();
    const [attending, setAttending] = useState<boolean | null>(current.status === "pending" ? null : current.status === "confirmed");
    const [drink, setDrink] = useState(current.drink ?? "");
    const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

    const submit = async () => {
        if (attending === null) return;
        setState("saving");
        try {
            const r = await submitRsvp(token, attending, drink);
            if (!r.ok) return setState("error");
        } catch {
            return setState("error");
        }
        onSaved(attending ? { status: "confirmed", drink: drink || null } : { status: "declined", drink: current.drink });
        setState("done");
        if (attending) confetti({ particleCount: 160, spread: 85, origin: { y: 0.7 }, colors: ["#d4af37", "#f1d48a", "#e63946", "#ffffff"] });
    };

    const choice = (value: boolean, label: string) => (
        <button type="button" aria-pressed={attending === value} onClick={() => setAttending(value)}
            className={cn("rounded-xl border px-4 py-3 text-left font-serif text-lg transition", attending === value ? "border-gold bg-gold/15 text-gold-soft" : "border-gold/25 text-cream/80 hover:border-gold/60")}>
            {label}
        </button>
    );

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) setState("idle"); onOpenChange(o); }}>
            <DialogContent className="border-gold/40 bg-night text-cream sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-script text-4xl font-normal text-gold-soft">{t("rsvp.title")}</DialogTitle>
                    <DialogDescription className="text-cream/60">{t("rsvp.desc")}</DialogDescription>
                </DialogHeader>

                {state === "done" ? (
                    <div className="space-y-5 text-center">
                        <p className="font-serif text-2xl text-cream">{attending ? t("rsvp.thanksYes") : t("rsvp.thanksNo")}</p>
                        <button onClick={() => onOpenChange(false)} className={btnGold}>{t("rsvp.close")}</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid gap-2">{choice(true, t("rsvp.yes"))}{choice(false, t("rsvp.no"))}</div>
                        {attending && (
                            <label className="block space-y-1.5 text-xs uppercase tracking-[0.15em] text-gold">
                                {t("rsvp.drink")}
                                <select value={drink} onChange={(e) => setDrink(e.target.value)} className={field}>
                                    <option value="">{t("rsvp.drinkNone")}</option>
                                    {DRINKS.map((d) => <option key={d} value={d}>{drinkLabel(d, locale)}</option>)}
                                </select>
                            </label>
                        )}
                        {state === "error" && <p role="alert" className="text-sm text-ember">{t("rsvp.error")}</p>}
                        <button onClick={submit} disabled={attending === null || state === "saving"} className={`${btnGold} w-full`}>
                            {state === "saving" ? t("rsvp.saving") : t("rsvp.submit")}
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}