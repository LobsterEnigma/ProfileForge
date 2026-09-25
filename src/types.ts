import type { CareView } from "./care/view.js";

/** One day of the contribution calendar, oldest first. */
export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface LanguageShare {
  name: string;
  color: string | null;
  bytes: number;
}

/** Everything ProfileForge needs to know about a GitHub user, already normalized. */
export interface GitHubProfile {
  login: string;
  name: string | null;
  followers: number;
  totalStars: number;
  /** Contributions over the account's whole life — drives XP, so levels never go down. */
  lifetimeContributions: number;
  /** Last-year counters — drive the attribute stats ("current form"). */
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  /** The last ~365 days, oldest first; the final entry is "today". */
  calendar: ContributionDay[];
  /** Sorted by bytes, largest first. */
  languages: LanguageShare[];
}

export type Mood = "happy" | "idle" | "hungry" | "sleeping";
export type Stage = "egg" | "baby" | "adult" | "legendary";

export interface PetStats {
  str: number;
  int: number;
  cha: number;
  dex: number;
}

/** Everything the renderer needs. Pure data — no GitHub knowledge past this point. */
export interface PetState {
  login: string;
  /** "Today": the last day of the calendar. Drives the season around the pet. */
  date: string;
  petName: string;
  species: string;
  level: number;
  stage: Stage;
  className: string;
  topLanguage: string | null;
  mood: Mood;
  xp: number;
  xpLevelStart: number;
  xpNextLevel: number;
  /** Active days in the last 14. */
  activeDays14: number;
  streak: number;
  daysSinceLastContribution: number;
  stats: PetStats;
  /** Gone after a month of silence: nothing to eat, nobody around. */
  ranAway: boolean;
  /** Forces a trick instead of today's (previews only). */
  trick?: Trick;
  /** Visitors' care, when the owner turned it on. */
  care?: CareView;
}

export type Trick = "dance" | "twirl" | "heart-eyes" | "sneeze" | "tongue" | "signature";
