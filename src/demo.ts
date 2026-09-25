import type { Mood, PetState, Stage } from "./types.js";
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

/** A made-up pet for docs, the gallery and `?user=demo`. */
export function demoState(mood: Mood = "happy", stage: Stage = "adult", petName = "Pinchy"): PetState {
  const level = LEVEL[stage];
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const power = level / 99;
  return {
    login: "demo",
    petName,
    species: "crab",
    level,
    stage,
    className: "Berserker",
    topLanguage: "Rust",
    mood,
    xp: Math.round(start + (next - start) * 0.62),
    xpLevelStart: start,
    xpNextLevel: next,
    ...ACTIVITY[mood],
    stats: {
      str: Math.round(20 + 75 * power),
      int: Math.round(15 + 60 * power),
      cha: Math.round(8 + 70 * power),
      dex: Math.round(12 + 50 * power),
    },
  };
}
