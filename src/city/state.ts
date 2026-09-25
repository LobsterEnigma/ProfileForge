import type { ContributionDay, GitHubProfile, LanguageShare, PetState } from "../types.js";
import { computePetState, currentStreak, daysSinceLastContribution, type PetOptions } from "../pet/state.js";

export interface Week {
  /** Date of the week's first day (Sunday, like GitHub's graph). */
  start: string;
  total: number;
  activeDays: number;
}

export interface CityState {
  login: string;
  /** "Today": the last day of the calendar. Drives the moon phase and the season. */
  date: string;
  topLanguage: LanguageShare | null;
  /** Oldest first; the last week is the current, still-in-progress one. */
  weeks: Week[];
  total: number;
  bestWeek: Week | null;
  currentStreak: number;
  longestStreak: number;
  /** Active days in the last 14, drives street traffic. */
  activeDays14: number;
  daysSinceLastContribution: number;
  /** Your pet, out for a walk. `null` when hidden with `?pet=false`. */
  pet: PetState | null;
}

/** Groups days into Sunday-started weeks, matching GitHub's contribution graph. */
export function groupWeeks(calendar: ContributionDay[]): Week[] {
  const weeks: Week[] = [];
  for (const day of calendar) {
    const isSunday = new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0;
    let week = weeks[weeks.length - 1];
    if (!week || isSunday) {
      week = { start: day.date, total: 0, activeDays: 0 };
      weeks.push(week);
    }
    week.total += day.count;
    if (day.count > 0) week.activeDays++;
  }
  return weeks;
}

export function longestStreak(calendar: ContributionDay[]): number {
  let best = 0;
  let run = 0;
  for (const day of calendar) {
    run = day.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function computeCityState(profile: GitHubProfile, pet: PetOptions | false = {}): CityState {
  const weeks = groupWeeks(profile.calendar);
  const bestWeek = weeks.reduce<Week | null>((best, w) => (w.total > (best?.total ?? 0) ? w : best), null);
  return {
    login: profile.login,
    date: profile.calendar.at(-1)?.date ?? new Date().toISOString().slice(0, 10),
    topLanguage: profile.languages[0] ?? null,
    weeks,
    total: profile.calendar.reduce((sum, d) => sum + d.count, 0),
    bestWeek,
    currentStreak: currentStreak(profile.calendar),
    longestStreak: longestStreak(profile.calendar),
    activeDays14: profile.calendar.slice(-14).filter((d) => d.count > 0).length,
    daysSinceLastContribution: daysSinceLastContribution(profile.calendar),
    pet: pet === false ? null : computePetState(profile, pet),
  };
}
