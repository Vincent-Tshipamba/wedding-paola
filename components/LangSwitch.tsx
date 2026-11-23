"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";

export function LangSwitch() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const pathname = usePathname(); // path WITHOUT the locale prefix
    const router = useRouter();
    const other = locale === "fr" ? "en" : "fr";

    const go = () => {
        router.replace(pathname, { locale: other });
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