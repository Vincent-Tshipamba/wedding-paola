import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";
import { PwaRegister } from "@/components/admin/PwaRegister";
import "../globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-cormorant" });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-vibes" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
    title: "Admin — Azarias & Paola",
    robots: { index: false, follow: false },
    manifest: "/admin.webmanifest", // installable app: "P&A Admin"
    icons: { icon: "/admin/pwa-icon/192?kind=admin", apple: "/admin/pwa-icon/180?kind=admin" },
    appleWebApp: { capable: true, title: "P&A Admin", statusBarStyle: "black" },
};
export const viewport: Viewport = { themeColor: "#0a0809" };

// The admin is French only and lives outside [locale] (and outside next-intl): it has its own root layout.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${cormorant.variable} ${vibes.variable} ${inter.variable}`}>
            <body className="min-h-svh antialiased">
                <PwaRegister />
                {children}
            </body>
        </html>
    );
}