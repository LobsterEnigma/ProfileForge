import type { ContributionDay, GitHubProfile, Mood, PetState, PetStats, Stage } from "../types.js";
import { classForLanguage } from "./classes.js";
import { getSpecies, speciesForLanguage } from "./species/index.js";

export const MAX_LEVEL = 99;

/** Days of silence before the pet packs its bags. */
export const RUN_AWAY_DAYS = 30;

/** Total XP needed to *reach* a level. Quadratic, so early levels come fast. */
export function xpForLevel(level: number): number {
  return 5 * (level - 1) ** 2;
}

export function levelForXp(xp: number): number {
  return Math.min(MAX_LEVEL, Math.floor(1 + Math.sqrt(Math.max(0, xp) / 5)));
}

export function stageForLevel(level: number): Stage {
  if (level < 3) return "egg";
  if (level < 15) return "baby";
  if (level < 50) return "adult";
  return "legendary";
}

/**
 * Consecutive active days ending today. If today has no contributions yet,
 * the streak is still alive as long as yesterday had some.
 */
export function currentStreak(calendar: ContributionDay[]): number {
  let i = calendar.length - 1;
  if (i >= 0 && calendar[i]!.count === 0) i--;
  let streak = 0;
  for (; i >= 0 && calendar[i]!.count > 0; i--) streak++;
  return streak;
}

/** 0 = contributed today. Returns the calendar length when there's no activity at all. */
export function daysSinceLastContribution(calendar: ContributionDay[]): number {
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i]!.count > 0) return calendar.length - 1 - i;
  }
  return calendar.length;
}

function lastDays(calendar: ContributionDay[], n: number): ContributionDay[] {
  return calendar.slice(Math.max(0, calendar.length - n));
}

export function moodFor(calendar: ContributionDay[]): Mood {
  const idle = daysSinceLastContribution(calendar);
  if (idle >= 14) return "sleeping";
  if (idle >= 4) return "hungry";
  const week = lastDays(calendar, 7).reduce((sum, d) => sum + d.count, 0);
  if (currentStreak(calendar) >= 3 || week >= 15) return "happy";
  return "idle";
}

/** Log scale so a 10k-commit machine and a weekend hacker both get a readable number. */
export function statFor(value: number): number {
  return Math.max(1, Math.min(99, Math.round(25 * Math.log10(Math.max(0, value) + 1))));
}

export interface PetOptions {
  petName?: string;
  /** Defaults to the species for your top language. */
  species?: string;
}

export function computePetState(profile: GitHubProfile, options: PetOptions = {}): PetState {
  const xp = profile.lifetimeContributions + profile.totalStars * 2 + profile.followers * 3;
  const level = levelForXp(xp);
  const topLanguage = profile.languages[0]?.name ?? null;
  const species = getSpecies(options.species ?? speciesForLanguage(topLanguage));
  const stats: PetStats = {
    str: statFor(profile.commits),
    int: statFor(profile.pullRequests + profile.reviews),
    cha: statFor(profile.totalStars + profile.followers),
    dex: statFor(profile.issues),
  };

  return {
    login: profile.login,
    date: profile.calendar.at(-1)?.date ?? new Date().toISOString().slice(0, 10),
    petName: options.petName ?? species.defaultName,
    species: species.id,
    level,
    stage: stageForLevel(level),
    className: classForLanguage(topLanguage),
    topLanguage,
    mood: moodFor(profile.calendar),
    xp,
    xpLevelStart: xpForLevel(level),
    xpNextLevel: xpForLevel(Math.min(level + 1, MAX_LEVEL)),
    activeDays14: lastDays(profile.calendar, 14).filter((d) => d.count > 0).length,
    streak: currentStreak(profile.calendar),
    daysSinceLastContribution: daysSinceLastContribution(profile.calendar),
    stats,
    ranAway: level >= 3 && daysSinceLastContribution(profile.calendar) >= RUN_AWAY_DAYS,
  };
}
