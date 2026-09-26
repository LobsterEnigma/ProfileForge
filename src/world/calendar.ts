/**
 * The holidays both widgets celebrate. Dates are the calendar's "today" (YYYY-MM-DD); the
 * lunar ones move every year, so they come from tables.
 */
export const HOLIDAYS = [
  "new-year",
  "lunar-new-year",
  "valentines",
  "pi-day",
  "april-fools",
  "programmers-day",
  "mid-autumn",
  "halloween",
  "christmas",
] as const;
export type Holiday = (typeof HOLIDAYS)[number];

/** First day of the Lunar New Year, and the zodiac animal it brings in. */
const LUNAR_NEW_YEAR: Record<number, [date: string, animal: string]> = {
  2026: ["02-17", "horse"],
  2027: ["02-06", "goat"],
  2028: ["01-26", "monkey"],
  2029: ["02-13", "rooster"],
  2030: ["02-03", "dog"],
  2031: ["01-23", "pig"],
  2032: ["02-11", "rat"],
  2033: ["01-31", "ox"],
  2034: ["02-19", "tiger"],
  2035: ["02-08", "rabbit"],
};

/** The Mid-Autumn Festival: the full moon of the eighth lunar month. */
const MID_AUTUMN: Record<number, string> = {
  2026: "09-25",
  2027: "09-15",
  2028: "10-03",
  2029: "09-22",
  2030: "09-12",
  2031: "10-01",
  2032: "09-19",
  2033: "09-08",
  2034: "09-27",
  2035: "09-16",
};

const DAY = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const daysBetween = (a: string, b: string) => Math.round((utc(a) - utc(b)) / DAY);

/** 1 on January 1st. */
export function dayOfYear(date: string): number {
  return daysBetween(date, `${date.slice(0, 4)}-01-01`) + 1;
}

function near(date: string, table: Record<number, string>, before: number, after: number): boolean {
  const md = table[Number(date.slice(0, 4))];
  if (!md) return false;
  const d = daysBetween(date, `${date.slice(0, 4)}-${md}`);
  return d >= -before && d <= after;
}

export function holidayFor(date: string): Holiday | null {
  const md = date.slice(5);
  if (md === "12-31" || md === "01-01") return "new-year";
  if (md >= "10-25" && md <= "10-31") return "halloween";
  if (md >= "12-18" && md <= "12-26") return "christmas";
  if (md === "02-14") return "valentines";
  if (md === "03-14") return "pi-day";
  if (md === "04-01") return "april-fools";
  // The 256th day of the year: September 13th, or the 12th in leap years.
  if (dayOfYear(date) === 256) return "programmers-day";
  const lny = Object.fromEntries(Object.entries(LUNAR_NEW_YEAR).map(([y, [d]]) => [y, d]));
  if (near(date, lny, 3, 3)) return "lunar-new-year";
  if (near(date, MID_AUTUMN, 1, 1)) return "mid-autumn";
  return null;
}

/** The zodiac animal of the Lunar New Year celebrated around `date`. */
export function zodiacFor(date: string): string {
  return LUNAR_NEW_YEAR[Number(date.slice(0, 4))]?.[1] ?? "dragon";
}

/** The year a New Year's party is welcoming in (Dec 31st looks ahead). */
export function newYearFor(date: string): number {
  const year = Number(date.slice(0, 4));
  return date.slice(5) === "12-31" ? year + 1 : year;
}
