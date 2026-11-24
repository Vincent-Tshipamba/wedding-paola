"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Menu } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/src/i18n/navigation";

const LINKS = ["home", "couple", "together", "story", "events", "gallery"] as const;
type SectionId = (typeof LINKS)[number];

/* Scroll spy: the section crossing the middle of the screen is the active one. */
function useActiveSection() {
    const [active, setActive] = useState<SectionId>("home");
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const e of entries) if (e.isIntersecting) setActive(e.target.id as SectionId);
            },
            { rootMargin: "-45% 0px -50% 0px" }, // thin band in the middle of the viewport
        );
        for (const id of LINKS) {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        }
        return () => observer.disconnect();
    }, []);
    return active;
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <a
            href={href}
            aria-current={active ? "location" : undefined}
            className={cn(
                "group relative py-1 text-xs font-medium uppercase tracking-[0.2em] transition-colors hover:text-gold-soft",
                active ? "text-gold-soft" : "text-cream/70",
            )}
        >
            {label}
            {!active && (
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold/70 transition-transform duration-300 group-hover:scale-x-100" />
            )}
            {active && (
                <motion.span
                    layoutId="nav-underline"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-gold"
                />
            )}
        </a>
    );
}

export function Navbar() {
    const t = useTranslations("nav");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const active = useActiveSection();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const other = locale === "fr" ? "en" : "fr";

    return (
        <motion.header
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-50 px-4 pt-4"
        >
            <nav
                className={cn(
                    "mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border px-4 transition-all duration-300 md:px-6",
                    scrolled
                        ? "border-gold/15 bg-night/70 shadow-lg shadow-black/40 backdrop-blur-xl"
                        : "border-transparent bg-transparent",
                )}
            >
                <a href="#home" className="font-script text-4xl leading-none text-gold" aria-label="Azarias & Paola">
                    A &amp; P
                </a>

                {/* Desktop links */}
                <ul className="hidden items-center gap-7 lg:flex">
                    {LINKS.map((id) => (
                        <li key={id}>
                            <NavLink href={`#${id}`} label={t(id)} active={active === id} />
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.replace(pathname, { locale: other })}
                        aria-label={t("switchLanguage")}
                        className="h-9 rounded-lg border border-gold/30 px-3 text-xs font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-night active:scale-95"
                    >
                        {other}
                    </button>

                    <a
                        href="#events"
                        className="hidden h-9 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-night transition hover:bg-gold-soft active:scale-95 sm:flex"
                    >
                        {t("cta")}
                    </a>

                    {/* Mobile menu */}
                    <Sheet>
                        <SheetTrigger
                            aria-label={t("menu")}
                            className="grid size-9 place-items-center rounded-lg border border-gold/30 text-gold transition hover:bg-gold/10 lg:hidden"
                        >
                            <Menu className="size-5" />
                        </SheetTrigger>
                        <SheetContent side="right" className="w-72 border-gold/20 bg-night text-cream">
                            <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
                            <ul className="mt-16 flex flex-col gap-1 px-4">
                                {LINKS.map((id, i) => (
                                    <motion.li
                                        key={id}
                                        initial={{ opacity: 0, x: 24 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.07 }}
                                    >
                                        <SheetClose>
                                            <a
                                                href={`#${id}`}
                                                aria-current={active === id ? "location" : undefined}
                                                className={cn(
                                                    "block rounded-lg px-3 py-3 font-serif text-2xl transition hover:bg-gold/10 hover:text-gold-soft",
                                                    active === id && "bg-gold/10 text-gold-soft",
                                                )}
                                            >
                                                {t(id)}
                                            </a>
                                        </SheetClose>
                                    </motion.li>
                                ))}
                            </ul>
                            <div className="mt-6 px-4">
                                <SheetClose>
                                    <a
                                        href="#events"
                                        className="flex h-11 items-center justify-center rounded-lg bg-gold font-semibold text-night transition hover:bg-gold-soft"
                                    >
                                        {t("cta")}
                                    </a>
                                </SheetClose>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </motion.header>
    );
}