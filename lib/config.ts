export const DRINKS = [
  "Primus",
  "Likofi",
  "Tembo",
  "Turbo King",
  "Mützig",
  "Nkoyi",
  "Wine",
  "Soft drink",
  "Coca",
  "Fanta",
  "Vitalo",
  "Top",
  "Maltina",
  "Energy Malt",
  "Water",
] as const;
export const STATUSES = ["pending", "confirmed", "declined"] as const;

// Admin labels (French only)
export const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  declined: "Décliné",
};

export const EVENT_LABELS: Record<string, string> = {
  customary: "Mariage coutumier",
  civil: "Mariage civil",
  talk: "Discours de mariage",
  party: "Soirée dansante",
};

export const COMPANIONS = ["none", "wife", "husband"] as const;

// Used by the public RSVP form (bilingual) and by the admin (always "fr").
// Brand names stay as they are; generic drinks are translated.
const DRINK_LABELS: Record<string, { fr: string; en: string }> = {
  Wine: { fr: "Vin", en: "Wine" },
  "Soft drink": { fr: "Boisson gazeuse", en: "Soft drink" },
  Water: { fr: "Eau", en: "Water" },
};
export const drinkLabel = (d: string, locale: string) =>
  DRINK_LABELS[d]?.[locale === "en" ? "en" : "fr"] ?? d;
