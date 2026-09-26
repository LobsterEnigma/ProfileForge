import type { PetState } from "../types.js";
import type { CareAction } from "./commands.js";
import { DEFAULT_RULES, type CareRules, type CareState } from "./state.js";

/** What care looks like on the card right now. Pure data, derived from the care log and a clock. */
export interface CareView {
  fed: boolean;
  bathed: boolean;
  played: boolean;
  /** 0 clean · 1 a few smudges · 2 smelly · 3 flies. */
  dirt: 0 | 1 | 2 | 3;
  /** The latest visit, if it's recent. Logins are validated when the log is parsed. */
  visitor: Visitor | null;
  /** Every kind of visit in the last 12 hours, oldest first, each with its latest visitor. */
  visitors: Visitor[];
}

export interface Visitor {
  login: string;
  action: CareAction;
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** A visit shows on the card for this long. */
export const FRESH = 12 * HOUR;
/** Being fed this recently keeps a pet from running away. */
export const FED_KEEPS_HOME = 30 * DAY;
/** Days without a bath before each level of dirt. */
export const DIRT_DAYS = [3, 6, 10] as const;

const age = (iso: string | null, now: Date) => (iso ? now.getTime() - Date.parse(iso) : Infinity);

export function careView(state: CareState, now: Date, rules: CareRules = DEFAULT_RULES): CareView {
  const sinceBath = age(state.last.bath ?? state.since, now) / DAY;
  const dirt = rules.dirt ? (DIRT_DAYS.filter((d) => sinceBath >= d).length as CareView["dirt"]) : 0;
  const latest = state.recent[0];
  // recent is newest first: keep each action's newest visit, then show them in the order they happened.
  const visitors: Visitor[] = [];
  for (const e of state.recent) {
    if (age(e.at, now) >= FRESH) break;
    if (!visitors.some((v) => v.action === e.action)) visitors.push({ login: e.by, action: e.action });
  }
  visitors.reverse();
  return {
    fed: age(state.last.feed, now) < FRESH,
    bathed: age(state.last.bath, now) < FRESH,
    played: age(state.last.play, now) < FRESH,
    dirt,
    visitor: latest && age(latest.at, now) < FRESH ? { login: latest.by, action: latest.action } : null,
    visitors,
  };
}

/**
 * Visitors' care nudges the pet: a fresh meal chases hunger away, a game cheers it up, and any
 * meal in the last month keeps it from running away. Commits still drive everything else.
 */
export function applyCare(pet: PetState, state: CareState, now: Date, rules: CareRules = DEFAULT_RULES): PetState {
  const view = careView(state, now, rules);
  let mood = pet.mood;
  if (view.fed && mood === "hungry") mood = "idle";
  if (view.played && mood === "idle") mood = "happy";
  const ranAway = pet.ranAway && age(state.last.feed, now) >= FED_KEEPS_HOME;
  return { ...pet, mood, ranAway, care: view };
}
