// Twinkling stars fixed behind the whole page (pure CSS, no JS). Positions are deterministic.
const rand = (i: number) => { const x = Math.sin(i * 9301 + 49297) * 233280; return x - Math.floor(x); };
const stars = Array.from({ length: 56 }, (_, i) => ({
    left: `${Math.round(rand(i + 1) * 1000) / 10}%`,
    top: `${Math.round(rand(i + 101) * 1000) / 10}%`,
    size: 8 + Math.round(rand(i + 201) * 14),
    delay: `${Math.round(rand(i + 301) * 60) / 10}s`,
    duration: `${(2.5 + rand(i + 401) * 3.5).toFixed(1)}s`,
    red: i % 7 === 0,
}));

export function StarField() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            {stars.map((s, i) => (
                <span
                    key={i}
                    style={{ left: s.left, top: s.top, fontSize: s.size, animationDelay: s.delay, animationDuration: s.duration }}
                    className={`absolute animate-twinkle ${s.red ? "text-ember" : "text-gold-soft"} ${i % 2 ? "hidden sm:block" : ""}`}
                >
                    ✦
                </span>
            ))}
        </div>
    );
}