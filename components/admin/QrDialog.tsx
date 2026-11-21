"use client";
import { useEffect, useState } from "react";
import { Check, Copy, Download, Mail, MessageCircle } from "lucide-react";
import { markInvited } from "@/app/admin/actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Guest } from "@/db/schema";
import { btnGhost } from "@/lib/admin-ui";
import QRCode from "qrcode";

export const inviteUrl = (g: Guest) => `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/${g.locale}/invitation/${g.token}`;

function message(g: Guest, url: string) {
    return g.locale === "en"
        ? `Hello ${g.name}, Paola & Azarias are delighted to invite you to their wedding. Here is your personal invitation: ${url}`
        : `Bonjour ${g.name}, Paola & Azarias ont la joie de vous inviter à leur mariage. Voici votre invitation personnelle : ${url}`;
}

export function QrDialog({ guest, onClose }: { guest: Guest | null; onClose: () => void }) {
    const [qrResult, setQrResult] = useState({ url: "", value: "" });
    const [copied, setCopied] = useState(false);
    const url = guest ? inviteUrl(guest) : "";
    const qr = qrResult.url === url ? qrResult.value : "";

    useEffect(() => {
        if (!url) return;
        let cancelled = false;
        QRCode.toDataURL(url, { width: 640, margin: 2, errorCorrectionLevel: "M" }).then((value) => {
            if (!cancelled) setQrResult({ url, value });
        });
        return () => {
            cancelled = true;
        };
    }, [url]);

    if (!guest) return <Dialog open={false} />;
    const text = encodeURIComponent(message(guest, url));
    const wa = `https://wa.me/${(guest.phone ?? "").replace(/\D/g, "")}?text=${text}`;
    const mail = `mailto:${guest.email ?? ""}?subject=${encodeURIComponent("Paola & Azarias")}&body=${text}`;
    const sent = () => void markInvited(guest.id);

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="border-gold/30 bg-night text-center text-cream sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="font-script text-4xl font-normal text-gold-soft">{guest.name}</DialogTitle>
                    <DialogDescription className="text-cream/50">Personal QR code · {guest.seats} seat{guest.seats > 1 ? "s" : ""}</DialogDescription>
                </DialogHeader>
                <div className="mx-auto size-56 rounded-xl bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {qr && <img src={qr} alt={`QR code for ${guest.name}`} className="size-full" />}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <a href={wa} target="_blank" rel="noreferrer" onClick={sent} className={btnGhost}><MessageCircle className="size-4" />WhatsApp</a>
                    <a href={mail} onClick={sent} className={btnGhost}><Mail className="size-4" />Email</a>
                    <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className={btnGhost}>
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Copy link"}
                    </button>
                    <a href={qr} download={`qr-${guest.name.replace(/\s+/g, "-").toLowerCase()}.png`} className={btnGhost}><Download className="size-4" />PNG</a>
                </div>
                <a href={url} target="_blank" rel="noreferrer" className="text-xs text-gold underline-offset-4 hover:underline">Preview invitation</a>
            </DialogContent>
        </Dialog>
    );
}