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
        </div>
    );
  }