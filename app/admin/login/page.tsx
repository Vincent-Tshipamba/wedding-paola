"use client";
import { useActionState } from "react";
import { login } from "../actions";
import { btnGold, field } from "@/lib/admin-ui";

export default function LoginPage() {
    const [state, action, pending] = useActionState(login, undefined);
    return (
        <main className="grid min-h-svh place-items-center px-6">
            <form action={action} className="w-full max-w-sm space-y-5 rounded-2xl border border-gold/30 bg-surface p-8 text-center">
                <p className="font-script text-5xl text-gold-soft">Paola &amp; Azarias</p>
                <p className="text-xs uppercase tracking-[0.4em] text-gold">Admin</p>
                <input name="password" type="password" required autoFocus autoComplete="current-password" placeholder="Password" className={field} />
                {state?.error && <p role="alert" className="text-sm text-ember">{state.error}</p>}
                <button disabled={pending} className={`${btnGold} w-full`}>{pending ? "…" : "Sign in"}</button>
            </form>
        </main>
    );
}