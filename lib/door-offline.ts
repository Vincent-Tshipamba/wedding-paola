// Client-only helpers: a local copy of the guest list + a queue of door actions to send later.
import type { Op, ScanGuest, ScanResult, Totals } from "@/lib/scan-actions";

const ROSTER = "door:roster:v1";
const QUEUE = "door:queue:v1";

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export const loadRoster = () => read<ScanGuest[]>(ROSTER, []);
export const saveRoster = (r: ScanGuest[]) => write(ROSTER, r);
export const loadQueue = () => read<Op[]>(QUEUE, []);
export const saveQueue = (q: Op[]) => write(QUEUE, q);
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const totalsLocal = (r: ScanGuest[]): Totals => ({
  arrived: r.reduce((a, g) => a + g.arrived, 0),
  expected: r.reduce((a, g) => a + (g.status === "declined" ? 0 : g.seats), 0),
});

type Out = { result: ScanResult; roster: ScanGuest[]; op?: Op };
const replace = (roster: ScanGuest[], g: ScanGuest) =>
  roster.map((x) => (x.token === g.token ? g : x));

function enter(
  roster: ScanGuest[],
  g: ScanGuest,
  n: number,
  opId: string,
): Out {
  const at = new Date().toISOString();
  const guest = { ...g, arrived: Math.min(g.seats, g.arrived + n), at };
  return {
    result: { kind: "ok", guest, entered: n },
    roster: replace(roster, guest),
    op: { id: opId, token: g.token, delta: n, at },
  };
}

// Same rules as scanToken() on the server, but on the local copy.
export function decideLocal(
  roster: ScanGuest[],
  token: string,
  opId: string,
): Out {
  const g = roster.find((x) => x.token === token);
  if (!g) return { result: { kind: "unknown" }, roster };
  if (g.status === "declined")
    return { result: { kind: "declined", guest: g }, roster };
  if (g.arrived >= g.seats)
    return { result: { kind: "already", guest: g }, roster };
  if (g.seats === 1) return enter(roster, g, 1, opId);
  return { result: { kind: "choose", guest: g }, roster };
}

export function confirmLocal(
  roster: ScanGuest[],
  token: string,
  count: number,
  force: boolean,
  opId: string,
): Out {
  const g = roster.find((x) => x.token === token);
  if (!g) return { result: { kind: "unknown" }, roster };
  if (g.status === "declined" && !force)
    return { result: { kind: "declined", guest: g }, roster };
  const remaining = g.seats - g.arrived;
  if (remaining <= 0) return { result: { kind: "already", guest: g }, roster };
  return enter(
    roster,
    g,
    Math.min(Math.max(Math.trunc(count) || 1, 1), remaining),
    opId,
  );
}

export function undoLocal(
  roster: ScanGuest[],
  token: string,
  count: number,
  opId: string,
): Out {
  const g = roster.find((x) => x.token === token);
  if (!g) return { result: { kind: "unknown" }, roster };
  const n = Math.max(Math.trunc(count) || 1, 1);
  const guest = {
    ...g,
    arrived: Math.max(0, g.arrived - n),
    at: g.arrived - n <= 0 ? null : g.at,
  };
  return {
    result: { kind: "already", guest },
    roster: replace(roster, guest),
    op: { id: opId, token, delta: -n, at: new Date().toISOString() },
  };
}

export function searchLocal(roster: ScanGuest[], query: string): ScanGuest[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return roster.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 8);
}
