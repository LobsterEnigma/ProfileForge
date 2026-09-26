import type { ContributionDay, GitHubProfile, Mood, PetState, Stage, Surprise, Trick } from "./types.js";
import type { CareAction } from "./care/commands.js";
import type { CareView, Visitor } from "./care/view.js";
import { seeded } from "./random.js";
import type { Holiday } from "./world/calendar.js";
import { classForLanguage } from "./pet/classes.js";
import { getSpecies } from "./pet/species/index.js";
import { xpForLevel } from "./pet/state.js";

export const MOODS: Mood[] = ["happy", "idle", "hungry", "sleeping"];
export const STAGES: Stage[] = ["egg", "baby", "adult", "legendary"];

const LEVEL: Record<Stage, number> = { egg: 2, baby: 9, adult: 27, legendary: 64 };

const ACTIVITY: Record<Mood, Pick<PetState, "streak" | "daysSinceLastContribution" | "activeDays14">> = {
  happy: { streak: 12, daysSinceLastContribution: 0, activeDays14: 13 },
  idle: { streak: 1, daysSinceLastContribution: 1, activeDays14: 6 },
  hungry: { streak: 0, daysSinceLastContribution: 6, activeDays14: 4 },
  sleeping: { streak: 0, daysSinceLastContribution: 23, activeDays14: 0 },
};

/** The language each species' demo pretends to write. */
const DEMO_LANGUAGE: Record<string, string> = {
  crab: "Rust",
  gopher: "Go",
  snake: "Python",
  elephant: "PHP",
  chick: "JavaScript",
  turtle: "TypeScript",
};

/** A made-up pet for docs, the gallery and `?user=demo`. */
export interface DemoExtras {
  trick?: Trick;
  /** Pretend the pet has run away (a month without contributions). */
  away?: boolean;
  /** Pretend a visitor just did this, or `all` for three visitors taking turns (care previews). */
  visit?: CareAction | "all";
  /** Pretend it's gone this long without a bath: 0 clean … 3 flies. */
  dirt?: 0 | 1 | 2 | 3;
  /** Pretend today brings this surprise (a holiday, a milestone, a rare treat). */
  surprise?: Surprise;
}

/** A day in each holiday, for previews. */
export const HOLIDAY_DATES: Record<Holiday, string> = {
  "new-year": "2027-01-01",
  "lunar-new-year": "2027-02-06",
  valentines: "2027-02-14",
  "pi-day": "2027-03-14",
  "april-fools": "2027-04-01",
  "programmers-day": "2026-09-13",
  "mid-autumn": "2026-09-25",
  halloween: "2026-10-31",
  christmas: "2026-12-24",
};

/** Made-up visitors for previews: one, or three taking turns. */
function demoCare(visit: DemoExtras["visit"], dirt: DemoExtras["dirt"]): CareView {
  const visitors: Visitor[] =
    visit === "all"
      ? [
          { login: "octocat", action: "feed" },
          { login: "hubot", action: "bath" },
          { login: "monalisa", action: "play" },
        ]
      : visit
        ? [{ login: "octocat", action: visit }]
        : [];
  const did = (a: CareAction) => visitors.some((v) => v.action === a);
  return {
    fed: did("feed"),
    bathed: did("bath"),
    played: did("play"),
    dirt: did("bath") ? 0 : (dirt ?? 0),
    visitor: visitors.at(-1) ?? null,
    visitors,
  };
}

/** The numbers a previewed milestone shows. */
const DEMO_MOMENTS = { birthday: 6, welcomeBack: 12 };

export function demoState(
  mood: Mood = "happy",
  stage: Stage = "adult",
  petName?: string,
  speciesId = "crab",
  { trick, away = false, visit, dirt, surprise }: DemoExtras = {},
): PetState {
  const species = getSpecies(speciesId);
  const language = DEMO_LANGUAGE[species.id] ?? "Rust";
  const level = LEVEL[stage];
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const power = level / 99;
  return {
    login: "demo",
    date: surprise && Object.hasOwn(HOLIDAY_DATES, surprise) ? HOLIDAY_DATES[surprise as Holiday] : "2026-09-24",
    petName: petName ?? species.defaultName,
    species: species.id,
    level,
    stage,
    className: classForLanguage(language),
    topLanguage: language,
    mood,
    xp: Math.round(start + (next - start) * 0.62),
    xpLevelStart: start,
    xpNextLevel: next,
    ...ACTIVITY[mood],
    ...(away ? { daysSinceLastContribution: 41, activeDays14: 0, streak: 0 } : {}),
    ranAway: away && stage !== "egg",
    trick,
    // Previews show an ordinary day unless they ask for a surprise.
    surprise: surprise ?? null,
    ...(surprise ? { moments: { ...DEMO_MOMENTS, levelUp: level - 1 } } : {}),
    ...(visit || dirt !== undefined
      ? {
          care: demoCare(visit, dirt),
        }
      : {}),
    stats: {
      str: Math.round(20 + 75 * power),
      int: Math.round(15 + 60 * power),
      cha: Math.round(8 + 70 * power),
      dex: Math.round(12 + 50 * power),
    },
  };
}

/**
 * A made-up year of contributions for the city demo: steady weekdays, lazy weekends,
 * two vacations (parks), one crunch week (the landmark) and a hot streak right now.
 */
export function demoProfile(): GitHubProfile {
  const rng = seeded("demo-city");
  const end = Date.UTC(2026, 8, 24);
  const days = 371;
  const calendar: ContributionDay[] = [];
  for (let i = 0; i < days; i++) {
    const t = end - (days - 1 - i) * 86_400_000;
    const date = new Date(t);
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const trend = 0.5 + i / days;
    let count = rng() < (weekend ? 0.35 : 0.85) ? Math.round(rng() * 9 * trend) : 0;
    if ((i >= 70 && i < 84) || (i >= 230 && i < 237)) count = 0; // vacations
    if (i >= 120 && i < 141) count = Math.max(count, 1 + Math.round(rng() * 4)); // a 3-week streak
    if (i >= 180 && i < 187) count = 18 + Math.round(rng() * 14); // crunch week
    if (i >= days - 12) count = Math.max(count, 1 + Math.round(rng() * 6)); // current streak
    calendar.push({ date: date.toISOString().slice(0, 10), count });
  }
  return {
    login: "demo",
    name: "Demo",
    followers: 42,
    totalStars: 128,
    lifetimeContributions: 5200,
    commits: 900,
    pullRequests: 80,
    reviews: 40,
    issues: 30,
    calendar,
    languages: [{ name: "Rust", color: "#dea584", bytes: 1 }],
  };
}
