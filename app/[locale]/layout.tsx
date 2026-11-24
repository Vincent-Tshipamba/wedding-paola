import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";
import { routing } from "@/src/i18n/routing";
import "../globals.css";
import SplashCursor from "@/components/SplashCursor";
import { StarField } from "@/components/StarField";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-cormorant" });
const vibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-vibes" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/${locale}`;

  return {
    metadataBase: new URL(baseUrl),
    title: t("title"),
    description: t("description"),
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale,
      url,
      title: t("title"),
      description: t("description"),
      siteName: "Azarias & Paola",
      images: [
        {
          url: "/couple/together.jpeg",
          width: 1120,
          height: 746,
          alt: locale === "fr" ? "Azarias et Paola ensemble" : "Azarias and Paola together",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/couple/together.jpeg"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = await getMessages({ locale });
  return (
    <html lang={locale} className={`${cormorant.variable} ${vibes.variable} ${inter.variable}`}>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StarField />
          <SplashCursor />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}