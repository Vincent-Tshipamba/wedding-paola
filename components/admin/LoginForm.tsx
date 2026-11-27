"use client";
import { useActionState } from "react";
import { login } from "@/lib/admin-actions";
import { btnGold, field } from "@/lib/admin-ui";

export function LoginForm({ next }: { next: string }) {
    const [state, action, pending] = useActionState(login, undefined);
    return (
        <main className="grid min-h-svh place-items-center px-6">
            <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border border-gold/30 bg-surface p-8 text-center">
                <p className="font-script text-5xl text-gold-soft">Azaria &amp; Paola</p>
                <p className="text-xs uppercase tracking-[0.4em] text-gold">Administration</p>
                <input type="hidden" name="next" value={next} />
                <input name="password" type="password" required autoFocus autoComplete="current-password" placeholder="Mot de passe" className={field} />
                {state?.error && <p role="alert" className="text-sm text-ember">{state.error}</p>}
                <button disabled={pending} className={`${btnGold} w-full`}>{pending ? "…" : "Se connecter"}</button>
            </form>
        </main>
    );
}