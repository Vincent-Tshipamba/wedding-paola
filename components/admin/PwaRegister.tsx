"use client";
import { useEffect } from "react";

// Registers the service worker for the whole admin area (production only: in dev it would cache stale code).
export function PwaRegister() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => { /* not supported or blocked */ });
        }
    }, []);
    return null;
}