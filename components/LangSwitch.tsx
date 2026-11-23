"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/src/i18n/navigation";

export function LangSwitch() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname(); // path WITHOUT the locale prefix
    const other = locale === "fr" ? "en" : "fr";

    // Full page load on purpose: no client cache involved, the server renders everything in the new language.
    const go = () => {
        const path = pathname === "/" ? "" : pathname;
        window.location.assign(`/${other}${path}${window.location.search}${window.location.hash}`);
    };

    return (
        <button
            onClick={go}
            aria-label={t("switchLanguage")}
            className="h-9 rounded-lg border border-gold/30 bg-night/60 px-3 text-xs font-semibold uppercase tracking-wider text-gold backdrop-blur transition hover:bg-gold hover:text-night active:scale-95"
        >
            {other}
        </button>
    );
}