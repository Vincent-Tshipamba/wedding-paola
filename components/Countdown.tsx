"use client";
import { useEffect, useState } from "react";

const parts = (ms: number) => ({
    Days: Math.floor(ms / 864e5),
    Hours: Math.floor(ms / 36e5) % 24,
    Minutes: Math.floor(ms / 6e4) % 60,
    Seconds: Math.floor(ms / 1e3) % 60,
});

export function Countdown({ target }: { target: string }) {
    const [left, setLeft] = useState<number | null>(null); // null until mounted: avoids hydration mismatch
    useEffect(() => {
        const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [target]);

    const p = parts(left ?? 0);
    return (
        <div className="flex justify-center gap-4 sm:gap-8" aria-label="Countdown to the wedding">
            {Object.entries(p).map(([label, v]) => (
                <div key={label} className="min-w-16 text-center">
                    <div className="font-serif text-4xl sm:text-6xl font-light tabular-nums">{left === null ? "--" : String(v).padStart(2, "0")}</div>
                    <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-gold">{label}</div>
                </div>
            ))}
        </div>
    );
}