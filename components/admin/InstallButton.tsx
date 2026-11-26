"use client";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { btnGhost } from "@/lib/admin-ui";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// "Installer l'app": uses the browser's install prompt (Android / desktop Chrome and Edge);
// on iPhone/iPad it shows the manual steps. Hidden once the app is installed.
export function InstallButton() {
    const [evt, setEvt] = useState<InstallEvent | null>(null);
    const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");
    const [hint, setHint] = useState(false);

    useEffect(() => {
        const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
        if (standalone) return;
        if (/iphone|ipad|ipod/i.test(navigator.userAgent)) queueMicrotask(() => setMode("ios"));
        const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as InstallEvent); setMode("prompt"); };
        const onInstalled = () => { setMode("hidden"); setEvt(null); };
        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);
        return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
    }, []);

    if (mode === "hidden") return null;
    const click = async () => {
        if (!evt) { setHint((h) => !h); return; }
        await evt.prompt();
        await evt.userChoice;
        setEvt(null);
        setMode("hidden");
    };

    return (
        <span className="relative">
            <button onClick={click} className={btnGhost}><Download className="size-4" />Installer l&apos;app</button>
            {hint && (
                <p role="status" className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-gold/40 bg-night p-3 text-left text-xs text-cream/80 shadow-xl">
                    Sur iPhone / iPad : touchez le bouton Partager de Safari, puis « Sur l&apos;écran d&apos;accueil ».
                </p>
            )}
        </span>
    );
}