"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { LangSwitch } from "@/components/LangSwitch";
import { Link } from "@/src/i18n/navigation";
import { lastDate, mainDate, wedding } from "@/lib/wedding";
import { cn } from "@/lib/utils";
import { RsvpDialog, type Rsvp } from "./RsvpDialog";

export type InvitationData = {
  token: string; qr: string; name: string; seats: number; status: Rsvp["status"]; drink: string | null; tableName: string | null;
  events: { id: string; date: string; venue: string; address: string }[];
};

type Phase = "sealed" | "opening" | "letter" | "leaflet" | "open";

const EASE = [0.22, 1, 0.36, 1] as const; // smooth deceleration
const SOFT = [0.65, 0, 0.35, 1] as const; // slow in-out (the unfolding)
const paper = "bg-[#0e0a0b] bg-[radial-gradient(ellipse_at_50%_0%,rgba(179,18,31,.28),transparent_60%)]";
const hidden = "[backface-visibility:hidden] [-webkit-backface-visibility:hidden]";

// Phones: the leaflet unfolds vertically (top page = photo). Larger screens: horizontally.
function useVertical() {
  return useSyncExternalStore(
    (cb) => { const mq = matchMedia("(max-width: 767px)"); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); },
    () => matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

export function InvitationExperience({ data }: { data: InvitationData }) {
  const reduce = useReducedMotion();
  const vertical = useVertical();
  const [phase, setPhase] = useState<Phase>("sealed");
  const [rsvp, setRsvp] = useState<Rsvp>({ status: data.status, drink: data.drink });
  const [dialog, setDialog] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const shown: Phase = reduce ? "open" : phase; // reduced motion: skip straight to the invitation
  const showEnvelope = shown === "sealed" || shown === "opening" || shown === "letter";

  // Timeline (ms): seal breaks + flap opens → letter rises → envelope leaves, leaflet arrives → leaflet unfolds
  const start = () => {
    if (phase !== "sealed") return;
    setPhase("opening");
    timers.current = [
      setTimeout(() => setPhase("letter"), 1800),
      setTimeout(() => setPhase("leaflet"), 3500),
      setTimeout(() => setPhase("open"), 5600),
    ];
  };

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-12 overflow-x-clip px-4 py-20">
      <div className="fixed right-4 top-4 z-40"><LangSwitch /></div>
      <AnimatePresence mode="wait">
        {showEnvelope ? (
          <Envelope key="envelope" phase={shown} name={data.name} onOpen={start} />
        ) : (
          <Leaflet key="leaflet" data={data} rsvp={rsvp} open={shown === "open"} vertical={vertical} reduce={!!reduce} onRsvp={() => setDialog(true)} />
        )}
      </AnimatePresence>
      {shown === "open" && <Pass data={data} />}
      <RsvpDialog open={dialog} onOpenChange={setDialog} token={data.token} current={rsvp} onSaved={setRsvp} />
    </main>
  );
}

/* ───────────────────────────── Envelope ───────────────────────────── */

function Envelope({ phase, name, onOpen }: { phase: Phase; name: string; onOpen: () => void }) {
  const t = useTranslations("invitation");
  const opened = phase !== "sealed";
  const gold = "#d4af37";
  return (
    <motion.div exit={{ y: 180, opacity: 0, scale: 0.9, transition: { duration: 1, ease: EASE } }} className="flex flex-col items-center gap-10">
      {/* <motion.p initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE }} className="font-script text-4xl text-gold-soft sm:text-5xl">
        {t("for", { name })}
      </motion.p> */}

      <div
        role="button" tabIndex={0} aria-label={t("open")} aria-disabled={opened}
        onClick={onOpen}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
        className={cn("relative mt-16 aspect-3/2 w-[min(88vw,28rem)] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-gold", !opened && "cursor-pointer")}
      >
        {/* inside of the envelope */}
        <div className="absolute inset-0 rounded-md border border-gold/40 bg-[linear-gradient(160deg,#4a0c15,#12090b)] shadow-[0_30px_80px_rgba(0,0,0,.75)]" />

        {/* the letter, hidden behind the front pocket until it rises */}
        <motion.div className="absolute inset-x-[10%] bottom-[8%] top-[8%] z-10" animate={{ y: phase === "letter" ? "-62%" : 0 }} transition={{ duration: 1.5, ease: EASE }}>
          <CoverArt compact />
        </motion.div>

        {/* front pocket */}
        <svg className="absolute inset-0 z-20 size-full" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="pocket" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#201317" /><stop offset="1" stopColor="#0b0708" /></linearGradient>
          </defs>
          {["0,0 150,120 0,200", "300,0 150,120 300,200", "0,200 150,100 300,200"].map((p) => (
            <polygon key={p} points={p} fill="url(#pocket)" stroke={gold} strokeOpacity=".45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>

        {/* flap: dark outside, crimson lining inside */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[58%]"
          style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d", transformPerspective: 1400 }}
          animate={{ rotateX: opened ? 180 : 0, zIndex: opened ? 5 : 30 }}
          transition={{ rotateX: { duration: 1.5, delay: 0.35, ease: SOFT }, zIndex: { delay: 1, duration: 0.001 } }}
        >
          <svg className={cn("absolute inset-0 size-full", hidden)} viewBox="0 0 300 116" preserveAspectRatio="none" aria-hidden>
            <polygon points="0,0 300,0 150,116" fill="url(#pocket)" stroke={gold} strokeOpacity=".6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg className={cn("absolute inset-0 size-full", hidden)} style={{ transform: "rotateX(180deg)" }} viewBox="0 0 300 116" preserveAspectRatio="none" aria-hidden>
            <polygon points="0,0 300,0 150,116" fill="#7a0f1a" stroke={gold} strokeOpacity=".6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
        </motion.div>

        {/* wax seal */}
        <motion.div
          className="absolute left-1/2 top-[58%] z-40 -ml-10 -mt-10 grid size-20 place-items-center rounded-full"
          style={{ background: "radial-gradient(circle at 35% 30%, #e63946, #8f0f19 60%, #5e0911)", boxShadow: "0 6px 18px rgba(0,0,0,.6), inset 0 0 0 3px rgba(212,175,55,.5), inset 0 -4px 8px rgba(0,0,0,.35)" }}
          animate={opened ? { opacity: 0, scale: 1.5 } : { opacity: 1, scale: [1, 1.07, 1] }}
          transition={opened ? { duration: 0.6 } : { repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
        >
          <span className="font-script text-3xl leading-none text-gold-soft">P&amp;A</span>
        </motion.div>
      </div>

      <motion.p animate={{ opacity: opened ? 0 : [0.35, 1, 0.35] }} transition={opened ? { duration: 0.4 } : { repeat: Infinity, duration: 2.4 }} className="text-xs uppercase tracking-[0.4em] text-gold">
        {t("tapToOpen")}
      </motion.p>
    </motion.div>
  );
}

/* Cover of the leaflet; the same artwork is the letter inside the envelope (sizes in cqw scale with the card). */
function CoverArt({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("invitation");
  const d = new Date(mainDate);
  const date = `${String(d.getUTCDate()).padStart(2, "0")} · ${String(d.getUTCMonth() + 1).padStart(2, "0")} · ${d.getUTCFullYear()}`;
  const { bride, groom } = wedding.couple;
  return (
    <div style={{ containerType: "inline-size" }} className={cn("relative size-full overflow-hidden rounded-sm border border-gold/60", paper)}>
      <div className="absolute inset-[4%] border border-gold/30" aria-hidden />
      <div className="relative grid size-full place-content-center justify-items-center text-center" style={{ gap: compact ? "2cqw" : "4cqw" }}>
        <p className="font-serif uppercase text-gold" style={{ fontSize: compact ? "3.6cqw" : "3.4cqw", letterSpacing: ".4em" }}>{t("coverKicker")}</p>
        {compact ? (
          <p className="font-script text-gold-soft" style={{ fontSize: "13cqw", lineHeight: 1.1 }}>{bride.firstName} &amp; {groom.firstName}</p>
        ) : (
          <p className="font-script text-gold-soft" style={{ fontSize: "19cqw", lineHeight: 0.95 }}>{bride.firstName}<br /><span className="text-gold" style={{ fontSize: "12cqw" }}>&amp;</span><br />{groom.firstName}</p>
        )}
        <p className="font-serif text-cream/80" style={{ fontSize: compact ? "4cqw" : "4.2cqw", letterSpacing: ".3em" }}>{date}</p>
      </div>
    </div>
  );
}

/* ───────────────────────────── Leaflet ───────────────────────────── */

function Leaflet({ data, rsvp, open, vertical, reduce, onRsvp }: {
  data: InvitationData; rsvp: Rsvp; open: boolean; vertical: boolean; reduce: boolean; onRsvp: () => void;
}) {
  const dur = reduce ? 0 : 1.9;
  const folded = vertical ? { y: "-25%" } : { x: "-25%" }; // while closed, only one page is visible: keep it centred
  return (
    <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 1, ease: EASE }} className="w-full">
      <motion.div
        initial={folded} animate={open ? { x: 0, y: 0 } : folded} transition={{ duration: dur, ease: SOFT }}
        className={cn("mx-auto grid", vertical ? "w-[min(88vw,26rem)] grid-rows-[1fr_1fr]" : "w-[min(94vw,60rem)] grid-cols-2")}
      >
        {/* page 1 (left / top): hinged on the fold. Inner face = photo, outer face = cover */}
        <div className="relative z-10">
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: vertical ? "50% 100%" : "100% 50%", transformStyle: "preserve-3d", transformPerspective: 2600 }}
            initial={vertical ? { rotateX: 180 } : { rotateY: 180 }}
            animate={vertical ? { rotateX: open ? 0 : 180 } : { rotateY: open ? 0 : 180 }}
            transition={{ duration: dur, ease: SOFT }}
          >
            <div className={cn("absolute inset-0 shadow-[0_30px_80px_rgba(0,0,0,.6)]", hidden)}><PhotoPage vertical={vertical} /></div>
            <div className={cn("absolute inset-0 shadow-[0_30px_80px_rgba(0,0,0,.6)]", hidden)} style={{ transform: vertical ? "rotateX(180deg)" : "rotateY(180deg)" }}><CoverArt /></div>
          </motion.div>
        </div>
        {/* page 2 (right / bottom) */}
        <div className="relative shadow-[0_30px_80px_rgba(0,0,0,.6)]"><InvitationPage data={data} rsvp={rsvp} vertical={vertical} onRsvp={onRsvp} /></div>
      </motion.div>
    </motion.div>
  );
}

const Hinge = ({ vertical, side }: { vertical: boolean; side: "first" | "second" }) => (
  <div aria-hidden className={cn("pointer-events-none absolute from-black/45 to-transparent",
    vertical ? "inset-x-0 h-8" : "inset-y-0 w-8",
    side === "first" ? (vertical ? "bottom-0 bg-linear-to-t" : "right-0 bg-linear-to-l") : (vertical ? "top-0 bg-linear-to-b" : "left-0 bg-linear-to-r"))} />
);

function PhotoPage({ vertical }: { vertical: boolean }) {
  const t = useTranslations("invitation");
  const { bride, groom } = wedding.couple;
  return (
    <div className={cn("relative grid size-full grid-rows-[1fr_auto] gap-4 overflow-hidden border border-gold/50 p-5 md:p-7", paper, vertical ? "rounded-t-sm" : "rounded-l-sm")}>
      <div className="relative min-h-60 overflow-hidden rounded-t-full border border-gold/60 p-1.5">
        <div className="relative size-full overflow-hidden rounded-t-full">
          {wedding.couplePhoto ? (
            <Image src={wedding.couplePhoto} alt={`${bride.firstName} & ${groom.firstName}`} fill sizes="(min-width: 768px) 480px, 90vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(179,18,31,.7),#0a0809_75%)]">
              <svg aria-hidden viewBox="0 0 200 120" className="w-40 text-gold-soft" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="78" cy="60" r="42" /><circle cx="122" cy="60" r="42" /></svg>
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-night/60 via-transparent to-transparent" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-script text-4xl text-gold-soft md:text-5xl">{bride.firstName} &amp; {groom.firstName}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-gold">{t("photoCaption")}</p>
      </div>
      <Hinge vertical={vertical} side="first" />
    </div>
  );
}

function InvitationPage({ data, rsvp, vertical, onRsvp }: { data: InvitationData; rsvp: Rsvp; vertical: boolean; onRsvp: () => void }) {
  const t = useTranslations("invitation");
  const te = useTranslations("events");
  const th = useTranslations("hero");
  const f = useFormatter();
  const dates = th("dates", { first: f.dateTime(new Date(mainDate), { day: "numeric" }), second: f.dateTime(new Date(lastDate), { day: "numeric", month: "long", year: "numeric" }) });
  return (
    <div className={cn("relative flex size-full flex-col items-center justify-center gap-3 overflow-hidden border border-gold/50 px-6 py-8 text-center md:px-10", paper, vertical ? "rounded-b-sm" : "rounded-r-sm")}>
      <div aria-hidden className="pointer-events-none absolute inset-2 border border-gold/20" />
      <p className="text-[10px] uppercase tracking-[0.4em] text-gold">{t("kicker")}</p>
      <p className="font-script text-4xl leading-tight text-gold-soft sm:text-5xl">{data.name}</p>
      <p className="max-w-xs font-serif text-lg italic leading-snug text-cream/80">{t("text")}</p>
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{dates}</p>
      <div aria-hidden className="flex items-center gap-3 text-gold"><span className="h-px w-10 bg-gold/50" />✦<span className="h-px w-10 bg-gold/50" /></div>

      <ul className="w-full space-y-2.5">
        {data.events.map((e) => {
          const d = new Date(e.date);
          return (
            <li key={e.id}>
              <p className="font-serif text-xl leading-tight text-gold-soft">{te(`${e.id}.title`)}</p>
              <p className="text-xs text-cream/70">{f.dateTime(d, { weekday: "long", day: "numeric", month: "long" })} · {f.dateTime(d, { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="text-xs text-cream/50">{e.venue}</p>
            </li>
          );
        })}
      </ul>

      {rsvp.status !== "pending" && (
        <p className={cn("rounded-full px-3 py-1 text-xs", rsvp.status === "confirmed" ? "bg-emerald-500/15 text-emerald-300" : "bg-ember/15 text-ember")}>
          {rsvp.status === "confirmed" ? `✓ ${t("confirmed")}` : t("declined")}
        </p>
      )}

      <div className="mt-1 flex w-full flex-col items-center gap-2">
        <button onClick={onRsvp} className="w-full max-w-xs rounded-full bg-gold px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-night transition hover:bg-gold-soft active:scale-95">
          {rsvp.status === "pending" ? t("confirm") : t("change")}
        </button>
        <Link href="/" className="w-full max-w-xs rounded-full border border-gold/40 px-6 py-3 text-xs uppercase tracking-[0.25em] text-gold transition hover:bg-gold/10">
          {t("visit")}
        </Link>
      </div>
      <Hinge vertical={vertical} side="second" />
    </div>
  );
}

/* ───────────────────────── Entrance pass (QR) ───────────────────────── */

function Pass({ data }: { data: InvitationData }) {
  const t = useTranslations("invitation");
  return (
    <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6, duration: 1, ease: EASE }}
      className="w-full max-w-sm rounded-[2rem] border border-gold/50 bg-surface/90 p-8 text-center shadow-[0_0_80px_rgba(179,18,31,.3)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.4em] text-gold">{t("passTitle")}</p>
      <p className="mt-2 font-script text-4xl text-gold-soft">{data.name}</p>
      <p className="mt-2 text-sm text-cream/70">{t("seats", { count: data.seats })}</p>
      <p className="text-sm text-gold-soft">{data.tableName ? t("table", { name: data.tableName }) : t("tableSoon")}</p>
      <div className="mx-auto mt-5 w-52 rounded-xl bg-white p-2">
        <Image src={data.qr} alt="QR code" width={240} height={240} unoptimized className="size-full" />
      </div>
      <p className="mt-3 text-xs text-cream/50">{t("scan")}</p>
    </motion.section>
  );
}