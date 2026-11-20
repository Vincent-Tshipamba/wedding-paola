import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { wedding } from "@/lib/wedding";
import FadeContent from "./FadeContent";
import SpotlightCard from "./SpotlightCard";
import DomeGallery from "./DomeGallery";

const Title = ({ kicker, children }: { kicker: string; children: React.ReactNode }) => (
    <FadeContent blur duration={900}>
        <div className="mb-16 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.45em] text-gold">{kicker}</p>
            <h2 className="font-serif text-4xl font-light text-cream sm:text-6xl">{children}</h2>
        </div>
    </FadeContent>
);

export function Marquee() {
    const item = `${wedding.couple.bride.firstName} & ${wedding.couple.groom.firstName}  ✦  24 · 01 · 2027  ✦  ${wedding.hashtag}  ✦  `;
    return (
        <div className="overflow-hidden border-y border-gold/20 bg-crimson/20 py-4" aria-hidden>
            <div className="flex w-max animate-marquee whitespace-pre font-serif text-2xl text-gold-soft">
                {[0, 1].map((i) => <span key={i}>{item.repeat(4)}</span>)}
            </div>
        </div>
    );
}

function Portrait({ src, initial }: { src: string; initial: string }) {
    return (
        <div className="mx-auto w-56 rounded-t-full border border-gold/60 p-2 shadow-[0_0_60px_rgba(179,18,31,.35)] sm:w-64">
            {src ? (
                <Image src={src} alt={initial} width={400} height={500} className="aspect-4/5 w-full rounded-t-full object-cover" />
            ) : (
                <div className="grid aspect-4/5 w-full place-items-center rounded-t-full bg-linear-to-b from-crimson to-night font-serif text-7xl text-gold-soft">{initial}</div>
            )}
        </div>
    );
}

export function Couple() {
    const t = useTranslations("couple");
    const people = [
        { ...wedding.couple.bride, role: t("bride"), bio: t("bio.paola") },
        { ...wedding.couple.groom, role: t("groom"), bio: t("bio.azarias") },
    ];
    return (
        <section id="couple" className="mx-auto max-w-6xl px-6 py-32">
            <Title kicker={t("kicker")}>{t("title")}</Title>
            <div className="grid gap-10 md:grid-cols-2">
                {people.map((p, i) => (
                    <FadeContent key={p.firstName} blur delay={i * 200} duration={1000}>
                        <SpotlightCard className="relative overflow-hidden border-gold/20! bg-surface! text-center" spotlightColor="rgba(212,175,55,0.22)">
                            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-6 select-none font-serif text-[7rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(212,175,55,.18)] sm:text-[9rem]">
                                {p.firstName}
                            </span>
                            <div className="relative pt-16">
                                <Portrait src={p.photo} initial={p.firstName[0]} />
                                <p className="mt-8 text-xs uppercase tracking-[0.4em] text-ember">{p.role}</p>
                                <h3 className="mt-2 font-script text-5xl text-gold-soft">{p.firstName} {p.lastName}</h3>
                                <p className="mx-auto mt-4 max-w-xs text-cream/70">{p.bio}</p>
                            </div>
                        </SpotlightCard>
                    </FadeContent>
                ))}
            </div>
        </section>
    );
}

export function Together() {
    const t = useTranslations("together");
    const { bride, groom } = wedding.couple;
    return (
        <section id="together" className="mx-auto max-w-6xl px-6 py-32">
            <Title kicker={t("kicker")}>{t("title")}</Title>
            <FadeContent blur duration={1100}>
                <div className="relative mx-auto max-w-4xl">
                    <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-crimson/30 blur-3xl" />
                    <div aria-hidden className="absolute inset-0 translate-x-4 translate-y-4 rounded-[2rem] border border-gold/40 sm:translate-x-6 sm:translate-y-6" />
                    <div className="relative aspect-4/5 overflow-hidden rounded-[2rem] border border-gold/50 bg-night sm:aspect-16/10">
                        {wedding.couplePhoto ? (
                            <Image src={wedding.couplePhoto} alt={`${bride.firstName} & ${groom.firstName}`} fill sizes="(min-width: 1024px) 896px, 100vw" className="animate-kenburns object-cover" />
                        ) : (
                            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(179,18,31,.7),var(--color-night)_75%)]">
                                <svg aria-hidden viewBox="0 0 200 120" className="-translate-y-10 w-48 text-gold-soft sm:w-72" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="78" cy="60" r="42" /><circle cx="122" cy="60" r="42" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-night/90 via-night/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-10">
                            <p className="font-script text-4xl text-gold-soft sm:text-6xl">{bride.firstName} &amp; {groom.firstName}</p>
                            <p className="mx-auto mt-2 max-w-xl font-serif text-lg italic text-cream/90 sm:text-2xl">“{t("quote")}”</p>
                        </div>
                    </div>
                </div>
            </FadeContent>
        </section>
    );
}


export function Story() {
    const t = useTranslations("story");
    return (
        <section id="story" className="relative overflow-hidden bg-surface px-6 py-32">
            <div aria-hidden className="absolute -right-40 top-20 size-96 rounded-full bg-crimson/20 blur-3xl" />
            <Title kicker={t("kicker")}>{t("title")}</Title>
            <ol className="relative mx-auto max-w-5xl">
                <div aria-hidden className="absolute bottom-0 left-4 top-0 w-px bg-linear-to-b from-transparent via-gold/60 to-transparent md:left-1/2" />
                {wedding.storyIds.map((id, i) => {
                    const left = i % 2 === 0;
                    return (
                        <li key={id} className={`relative mb-16 pl-12 last:mb-0 md:w-1/2 md:pl-0 ${left ? "md:pr-14" : "md:ml-auto md:pl-14"}`}>
                            <span aria-hidden className={`absolute left-2.5 top-8 size-3 animate-twinkle rounded-full bg-gold shadow-[0_0_18px_var(--color-gold)] ${left ? "md:-right-1.5 md:left-auto" : "md:-left-1.5"}`} />
                            <FadeContent blur delay={i * 120} duration={900}>
                                <div className="rounded-2xl border border-gold/20 bg-night/70 p-8 backdrop-blur">
                                    <span className="font-serif text-6xl leading-none text-crimson/70">{String(i + 1).padStart(2, "0")}</span>
                                    <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gold">{t(`items.${id}.year`)}</p>
                                    <h3 className="mt-1 font-serif text-3xl text-cream">{t(`items.${id}.title`)}</h3>
                                    <p className="mt-3 text-cream/70">{t(`items.${id}.text`)}</p>
                                </div>
                            </FadeContent>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

export function Events() {
    const t = useTranslations("events");
    const f = useFormatter();
    return (
        <section id="events" className="mx-auto max-w-6xl px-6 py-32">
            <Title kicker={t("kicker")}>{t("title")}</Title>
            <div className="grid gap-8 md:grid-cols-3">
                {wedding.events.map((e, i) => {
                    const d = new Date(e.date);
                    return (
                        <FadeContent key={e.id} blur delay={i * 150} duration={900}>
                            <SpotlightCard className="h-full border-gold/20! bg-surface! text-center" spotlightColor="rgba(230,57,70,0.25)">
                                <p className="text-xs tracking-[0.35em] text-ember">{f.dateTime(d, { weekday: "long" })}</p>
                                <p className="mt-2 font-serif text-8xl leading-none text-gold-soft">{f.dateTime(d, { day: "numeric" })}</p>
                                <p className="font-serif text-2xl tracking-widest text-cream">{f.dateTime(d, { month: "long", year: "numeric" })}</p>
                                <h3 className="mt-6 font-serif text-3xl text-gold">{t(`${e.id}.title`)}</h3>
                                <p className="mt-1 text-sm text-cream/60">{t("at", { time: f.dateTime(d, { hour: "2-digit", minute: "2-digit" }) })}</p>
                                <p className="mt-4 text-cream/80">{e.venue}</p>
                                <p className="text-sm text-cream/50">{e.address}</p>
                                <p className="mt-4 text-sm text-cream/70">{t(`${e.id}.text`)}</p>
                            </SpotlightCard>
                        </FadeContent>
                    );
                })}
            </div>
        </section>
    );
}

export function Gallery() {
    const t = useTranslations("gallery");
    return (
        <section id="gallery" className="bg-night">
            <div className="py-4 px-6 text-center">
                <p className="mb-3 text-xs uppercase tracking-[0.45em] text-gold">{t("kicker")}</p>
                <h2 className="font-serif text-4xl font-light text-cream sm:text-6xl">{t("title")}</h2>
                <p className="mt-3 text-sm text-cream/50">{t("hint")}</p>
            </div>
            <div className="h-svh">
                <DomeGallery fit={0.8} minRadius={600} maxVerticalRotationDeg={0} segments={34} dragDampening={2} grayscale={false} overlayBlurColor="#0a0809" />
            </div>
        </section>
    );
}

export function Footer() {
    const t = useTranslations("footer");
    return (
        <footer className="border-t border-gold/20 py-16 text-center">
            <p className="font-serif text-4xl text-gold-soft">Paola &amp; Azarias</p>
            <p className="mt-3 tracking-widest text-gold">{wedding.hashtag}</p>
            <p className="mt-2 text-sm text-cream/50">{t("thanks")}</p>
        </footer>
    );
}