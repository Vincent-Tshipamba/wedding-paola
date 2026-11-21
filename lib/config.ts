export const DRINKS = [
  "Primus",
  "Skol",
  "Tembo",
  "Turbo King",
  "Mützig",
  "Nkoyi",
  "Wine",
  "Soft drink",
  "Water",
] as const;
export const STATUSES = ["pending", "confirmed", "declined"] as const;
export const EVENT_LABELS: Record<string, string> = {
  customary: "Customary",
  civil: "Civil",
  religious: "Religious",
};
