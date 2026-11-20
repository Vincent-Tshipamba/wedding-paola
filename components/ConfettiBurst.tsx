"use client";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export function ConfettiBurst() {
    useEffect(() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const colors = ["#d4af37", "#f1d48a", "#e63946", "#ffffff"];
        const end = Date.now() + 2400;
        let raf = 0;
        const frame = () => {
            confetti({ particleCount: 3, angle: 60, spread: 65, origin: { x: 0, y: 0.75 }, colors });
            confetti({ particleCount: 3, angle: 120, spread: 65, origin: { x: 1, y: 0.75 }, colors });
            if (Date.now() < end) raf = requestAnimationFrame(frame);
        };
        const t = setTimeout(frame, 900);
        return () => { clearTimeout(t); cancelAnimationFrame(raf); };
    }, []);
    return null;
}