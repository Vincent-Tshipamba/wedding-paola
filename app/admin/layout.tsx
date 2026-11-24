import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";
import "../globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-cormorant" });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-vibes" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = { 
    title: "Admin — Azarias & Paola", 
    robots: { index: false, follow: false }, 
    openGraph: {
        type: "website",
        title: "Admin — Azarias & Paola",
        description: "Admin panel for Azarias & Paola wedding website",
        siteName: "Azarias & Paola",
        images: [
            {
                url: "/couple/together.jpeg",
                alt: "Azarias and Paola together",
            },
        ],
    }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr" className={`${cormorant.variable} ${vibes.variable} ${inter.variable}`}>
            <body className="min-h-svh antialiased">{children}</body>
        </html>
    );
}