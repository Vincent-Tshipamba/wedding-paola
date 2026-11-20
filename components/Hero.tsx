import { useFormatter, useTranslations } from "next-intl";
import { wedding, mainDate, lastDate } from "@/lib/wedding";
import { Countdown } from "./Countdown";
import { HeroBackground } from "./HeroBackground";
import BlurText from "./BlurText";
import FadeContent from "./FadeContent";
import StarBorder from "./StarBorder";
import { ConfettiBurst } from "./ConfettiBurst";

export function Hero() {
    const t = useTranslations("hero");
    const f = useFormatter();
    const dates = t("dates", {
        first: f.dateTime(new Date(mainDate), { day: "numeric" }),
        second: f.dateTime(new Date(lastDate), { day: "numeric", month: "long", year: "numeric" }),
    });
    return (
        <section id="top" className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
            <HeroBackground />
            <ConfettiBurst />
            <div className="relative z-10 flex flex-col items-center">
                <FadeContent blur duration={900}>
                    <p className="mb-6 text-xs uppercase tracking-[0.45em] text-gold sm:text-sm">{t("kicker")}</p>
                </FadeContent>
                <BlurText
                    text={`${wedding.couple.bride.firstName} & ${wedding.couple.groom.firstName}`}
                    delay={150}
                    animateBy="words"
                    direction="top"
                    className="justify-center font-serif text-6xl font-light text-gold-soft sm:text-8xl md:text-9xl"
                />
                <FadeContent blur delay={700} duration={900}>
                    <p className="mt-6 font-serif text-xl italic text-cream sm:text-3xl">{dates} · {wedding.city}</p>
                </FadeContent>
                <FadeContent blur delay={1000} duration={900}>
                    <div className="mt-12"><Countdown target={mainDate} /></div>
                </FadeContent>
                <FadeContent blur delay={1300} duration={900}>
                    <div className="mt-12">
                        <StarBorder as="a" href="#events" color="#d4af37">{t("cta")}</StarBorder>
                    </div>
                </FadeContent>
            </div>
        </section>
    );
}