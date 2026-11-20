const sparkles = [
    ["8%", "18%", "0s"], ["22%", "72%", "1s"], ["35%", "10%", "2s"], ["48%", "86%", "0.5s"],
    ["62%", "22%", "1.5s"], ["74%", "64%", "2.5s"], ["88%", "14%", "0.8s"], ["92%", "80%", "1.8s"],
];

export function HeroBackground() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(179,18,31,.45),transparent_60%)]" />
            <div className="absolute inset-0 grid place-items-center">
                <div className="col-start-1 row-start-1 size-104 animate-spin-slow rounded-full border border-gold/40 sm:size-160" />
                <div className="col-start-1 row-start-1 size-136 animate-spin-rev rounded-full border border-dashed border-ember/40 sm:size-208" />
                <div className="col-start-1 row-start-1 size-80 rotate-45 animate-spin-slow rounded-[3rem] border border-gold/25 sm:size-120" />
                <div className="col-start-1 row-start-1 size-176 animate-spin-rev rounded-full border border-gold/10 sm:size-280" />
            </div>
            <div className="absolute -left-24 top-1/4 size-72 animate-float rounded-full bg-crimson/40 blur-3xl" />
            <div className="absolute -right-24 bottom-1/4 size-80 animate-float rounded-full bg-gold/20 blur-3xl [animation-delay:3s]" />
            {sparkles.map(([left, top, delay], i) => (
                <span key={i} style={{ left, top, animationDelay: delay }} className="absolute animate-twinkle text-xl text-gold-soft">✦</span>
            ))}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-night to-transparent" />
        </div>
    );
  }