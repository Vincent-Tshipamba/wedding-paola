import type { Metadata } from "next";
import { ScannerApp } from "@/components/admin/ScannerApp";
import { requireStaff } from "@/lib/auth";
import { getTotals } from "@/lib/scan-actions";

// Its own installable app: "P&A Entrée" (separate icon, opens straight on the scanner).
export const metadata: Metadata = {
    title: "Contrôle d'entrée",
    manifest: "/scan.webmanifest",
    icons: { icon: "/admin/pwa-icon/192?kind=scan", apple: "/admin/pwa-icon/180?kind=scan" },
    appleWebApp: { capable: true, title: "P&A Entrée", statusBarStyle: "black" },
};

export default async function ScanPage() {
    const role = await requireStaff();
    return <ScannerApp initialTotals={await getTotals()} isAdmin={role === "admin"} />;
}