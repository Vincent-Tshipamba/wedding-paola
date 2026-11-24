"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, Minus, Plus, Search, Undo2 } from "lucide-react";
import { logout } from "@/lib/admin-actions";
import { btnGhost, btnGold, field } from "@/lib/admin-ui";
import { confirmEntry, scanToken, searchGuests, undoEntry, type ScanGuest, type ScanResult, type Totals } from "@/lib/scan-actions";
import Link from "next/link";

type Tone = "ok" | "warn" | "bad";
type View = ScanResult | { kind: "error" };
type LogItem = { id: number; time: string; text: string; tone: Tone };

const hhmm = (d: Date | string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const TONE: Record<Tone, string> = { ok: "border-emerald-400/50 bg-emerald-500/10", warn: "border-gold/60 bg-gold/10", bad: "border-ember/60 bg-ember/10" };

// ----- sound + vibration (the audio context must be created after a tap) -----
let audio: AudioContext | null = null;
function warmAudio() { try { audio ??= new AudioContext(); void audio.resume(); } catch { /* no audio: ignore */ } }
function feedback(tone: Tone) {
    navigator.vibrate?.(tone === "ok" ? 40 : [90, 60, 90]);
    try {
        if (!audio) return;
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.frequency.value = tone === "ok" ? 880 : 220;
        g.gain.value = 0.08;
        o.connect(g); g.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + (tone === "ok" ? 0.12 : 0.35));
    } catch { /* ignore */ }
}

// The QR contains the invitation link: .../fr/invitation/<token>
function parseToken(raw: string): string | null {
    const s = raw.trim();
    try {
        const parts = new URL(s).pathname.split("/").filter(Boolean);
        const i = parts.indexOf("invitation");
        if (i >= 0 && parts[i + 1]) return parts[i + 1];
    } catch { /* not a URL */ }
    return /^[A-Za-z0-9_-]{8,64}$/.test(s) ? s : null;
}

function describe(v: View): { tone: Tone; title: string; guest?: ScanGuest } {
    switch (v.kind) {
        case "ok": return { tone: "ok", title: "Bienvenue !", guest: v.guest };
        case "already": return { tone: "warn", title: `Déjà validé${v.guest.at ? ` à ${hhmm(v.guest.at)}` : ""}`, guest: v.guest };
        case "choose": return { tone: "warn", title: "Combien de personnes entrent ?", guest: v.guest };
        case "declined": return { tone: "bad", title: "A décliné l'invitation", guest: v.guest };
        case "unknown": return { tone: "bad", title: "QR code invalide" };
        default: return { tone: "bad", title: "Connexion perdue : réessayez" };
    }
}

export function ScannerApp({ initialTotals, isAdmin }: { initialTotals: Totals; isAdmin: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const busy = useRef(false); // true while a result is on screen / being handled
    const last = useRef({ token: "", at: 0 });
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [active, setActive] = useState(false);
    const [camError, setCamError] = useState("");
    const [view, setView] = useState<View | null>(null);
    const [totals, setTotals] = useState(initialTotals);
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [hits, setHits] = useState<ScanGuest[]>([]);
    const [log, setLog] = useState<LogItem[]>([]);

    const addLog = (text: string, tone: Tone) =>
        setLog((l) => [{ id: Date.now() + Math.random(), time: hhmm(new Date()), text, tone }, ...l].slice(0, 8));

    const show = useCallback((r: View, t?: Totals) => {
        const d = describe(r);
        setView(r);
        if (t) setTotals(t);
        if (r.kind === "choose") setCount(r.guest.seats - r.guest.arrived);
        if (r.kind !== "choose") feedback(d.tone);
        if (r.kind === "ok") addLog(`${r.guest.name}: ${r.entered} entrée${r.entered > 1 ? "s" : ""}`, "ok");
        else if (r.kind === "already") addLog(`${r.guest.name}: déjà validé`, "warn");
        else if (r.kind === "declined") addLog(`${r.guest.name}: avait décliné`, "bad");
        else if (r.kind === "unknown") addLog("QR code invalide", "bad");
        // keep scanning paused for choose/declined until the staff member acts
        if (r.kind !== "choose" && r.kind !== "declined") setTimeout(() => { busy.current = false; }, 1800);
    }, []);

    const handleToken = useCallback(async (token: string) => {
        busy.current = true;
        setLoading(true);
        try {
            const { result, totals: t } = await scanToken(token);
            show(result, t);
        } catch {
            show({ kind: "error" });
        } finally {
            setLoading(false);
        }
    }, [show]);

    // ---- camera ----
    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setActive(false);
    }, []);

    const startCamera = async () => {
        setCamError("");
        warmAudio();
        if (!navigator.mediaDevices?.getUserMedia) {
            setCamError("Caméra indisponible : ouvrez cette page en HTTPS.");
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
            streamRef.current = stream;
            const v = videoRef.current!;
            v.srcObject = stream;
            await v.play();
            setActive(true);
        } catch {
            setCamError("Impossible d'accéder à la caméra. Autorisez-la dans le navigateur, ou utilisez la recherche par nom.");
        }
    };

    useEffect(() => stopCamera, [stopCamera]);

    // read frames ~8 times per second
    useEffect(() => {
        if (!active) return;
        let raf = 0;
        let lastRun = 0;
        const tick = (time: number) => {
            raf = requestAnimationFrame(tick);
            if (time - lastRun < 120 || busy.current) return;
            lastRun = time;
            const v = videoRef.current;
            const c = canvasRef.current;
            if (!v || !c || v.readyState < 2 || !v.videoWidth) return;
            const w = 640;
            const h = Math.round((w * v.videoHeight) / v.videoWidth);
            c.width = w; c.height = h;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(v, 0, 0, w, h);
            const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
            if (!code) return;
            const token = parseToken(code.data);
            if (!token) return;
            if (token === last.current.token && Date.now() - last.current.at < 4000) return; // same QR still in view
            last.current = { token, at: Date.now() };
            void handleToken(token);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [active, handleToken]);

    // ---- actions on the result card ----
    const confirm = async (force = false) => {
        if (!view || !("guest" in view)) return;
        setLoading(true);
        try {
            const n = force ? view.guest.seats - view.guest.arrived : count;
            const { result, totals: t } = await confirmEntry(view.guest.token, n, force);
            show(result, t);
        } catch {
            show({ kind: "error" });
        } finally {
            setLoading(false);
        }
    };
    const undo = async () => {
        if (view?.kind !== "ok") return;
        setLoading(true);
        try {
            setTotals(await undoEntry(view.guest.token, view.entered));
            addLog(`${view.guest.name}: entrée annulée`, "warn");
            setView(null);
            busy.current = false;
        } finally {
            setLoading(false);
        }
    };
    const dismiss = () => { setView(null); busy.current = false; };

    const onSearch = (value: string) => {
        setQ(value);
        clearTimeout(searchTimer.current);
        if (value.trim().length < 2) { setHits([]); return; }
        searchTimer.current = setTimeout(async () => {
            try { setHits(await searchGuests(value)); } catch { setHits([]); }
        }, 300);
    };
    const pick = (g: ScanGuest) => { setHits([]); setQ(""); warmAudio(); void handleToken(g.token); };

    const d = view ? describe(view) : null;
    const remaining = view && "guest" in view ? view.guest.seats - view.guest.arrived : 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-script text-4xl leading-none text-gold-soft">Contrôle d&apos;entrée</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.4em] text-gold">Azarias &amp; Paola</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-gold/30 bg-surface px-4 py-2 text-center">
                        <p className="font-serif text-3xl leading-none text-gold-soft">{totals.arrived}<span className="text-cream/40"> / {totals.expected}</span></p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-cream/60">Entrés</p>
                    </div>
                    {isAdmin && <Link href="/admin" className={btnGhost}>Admin</Link>}
                    <form action={logout}>
                        <button className={btnGhost}>
                            Quitter
                        </button>
                    </form>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
                {/* camera */}
                <section>
                    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-gold/30 bg-black">
                        <video ref={videoRef} playsInline muted className="size-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        {!active && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-cream/60">{camError || "La caméra est éteinte."}</div>}
                        {active && <div className="pointer-events-none absolute inset-[14%] rounded-xl border-2 border-gold/70 shadow-[0_0_0_999px_rgba(0,0,0,.35)]" />}
                    </div>
                    <div className="mt-3 flex justify-center">
                        {active
                            ? <button onClick={stopCamera} className={btnGhost}><CameraOff className="size-4" />Éteindre la caméra</button>
                            : <button onClick={startCamera} className={btnGold}><Camera className="size-4" />Activer la caméra</button>}
                    </div>
                </section>

                {/* result */}
                <section className="space-y-4">
                    {d ? (
                        <div className={`rounded-2xl border p-5 text-center ${TONE[d.tone]}`} role="status" aria-live="polite">
                            <p className="text-xs uppercase tracking-[0.3em] text-cream/70">{d.title}</p>
                            {d.guest && (
                                <>
                                    <p className="mt-2 font-script text-5xl leading-tight text-gold-soft">{d.guest.name}</p>
                                    <p className="mt-1 text-lg text-cream">
                                        {d.guest.tableName ? `Table ${d.guest.tableName}` : "Table non assignée"} · {d.guest.arrived}/{d.guest.seats} présent{d.guest.arrived > 1 ? "s" : ""}
                                    </p>
                                    {d.guest.status === "pending" && <p className="mt-1 text-sm text-gold-soft">Présence non confirmée</p>}
                                    {d.guest.notes && <p className="mt-2 rounded-lg bg-black/30 px-3 py-2 text-sm text-cream/80">{d.guest.notes}</p>}
                                </>
                            )}

                            {view?.kind === "choose" && (
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-center gap-4">
                                        <button aria-label="Moins" onClick={() => setCount((c) => Math.max(1, c - 1))} className={btnGhost}><Minus className="size-4" /></button>
                                        <span className="w-16 font-serif text-5xl text-gold-soft">{count}</span>
                                        <button aria-label="Plus" onClick={() => setCount((c) => Math.min(remaining, c + 1))} className={btnGhost}><Plus className="size-4" /></button>
                                    </div>
                                    <p className="text-xs text-cream/60">{remaining} place{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""}</p>
                                    <button disabled={loading} onClick={() => confirm()} className={`${btnGold} w-full`}>Valider l&apos;entrée de {count}</button>
                                </div>
                            )}
                            {view?.kind === "declined" && <button disabled={loading} onClick={() => confirm(true)} className={`${btnGold} mt-4 w-full`}>Faire entrer quand même</button>}
                            {view?.kind === "ok" && <button disabled={loading} onClick={undo} className={`${btnGhost} mt-4`}><Undo2 className="size-4" />Annuler cette entrée</button>}
                            {(view?.kind === "choose" || view?.kind === "declined") && <button onClick={dismiss} className="mt-3 block w-full text-xs text-cream/60 underline-offset-4 hover:underline">Fermer</button>}
                        </div>
                    ) : (
                        <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-gold/20 p-5 text-center text-sm text-cream/50">
                            {loading ? "Vérification…" : "Présentez un QR code devant la caméra."}
                        </div>
                    )}

                    {/* manual lookup */}
                    <div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 size-4 text-cream/40" />
                            <input value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Chercher un invité (QR illisible)…" className={`${field} pl-9`} />
                        </div>
                        {hits.length > 0 && (
                            <ul className="mt-2 divide-y divide-gold/10 overflow-hidden rounded-xl border border-gold/20 bg-surface">
                                {hits.map((g) => (
                                    <li key={g.token}>
                                        <button onClick={() => pick(g)} className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/5">
                                            <span>{g.name}</span>
                                            <span className="text-xs text-cream/50">{g.arrived}/{g.seats} · {g.tableName ?? "sans table"}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {log.length > 0 && (
                        <ul className="space-y-1 text-sm">
                            {log.map((l) => (
                                <li key={l.id} className="flex gap-3 text-cream/70">
                                    <span className="text-cream/40">{l.time}</span>
                                    <span className={l.tone === "ok" ? "text-emerald-300" : l.tone === "warn" ? "text-gold-soft" : "text-ember"}>{l.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}