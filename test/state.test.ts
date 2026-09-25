import { describe, expect, it } from "vitest";
import {
  computePetState,
  currentStreak,
  daysSinceLastContribution,
  levelForXp,
  moodFor,
  stageForLevel,
  statFor,
  xpForLevel,
} from "../src/pet/state.js";
import { calendar, profile } from "./helpers.js";

describe("streaks", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(calendar([0, 1, 1, 1]))).toBe(3);
  });

  it("keeps the streak alive when today has no contributions yet", () => {
    expect(currentStreak(calendar([0, 1, 1, 0]))).toBe(2);
  });

  it("is broken by a gap before yesterday", () => {
    expect(currentStreak(calendar([1, 1, 0, 0]))).toBe(0);
  });

  it("measures days since the last contribution", () => {
    expect(daysSinceLastContribution(calendar([1, 0, 0, 0]))).toBe(3);
    expect(daysSinceLastContribution(calendar([0, 0, 1]))).toBe(0);
    expect(daysSinceLastContribution(calendar([0, 0, 0]))).toBe(3);
  });
});

describe("mood", () => {
  const quiet = (days: number) => calendar([1, ...Array(days).fill(0)]);

  it("is happy on a 3-day streak", () => expect(moodFor(calendar([0, 1, 1, 1]))).toBe("happy"));
  it("is happy after a busy week even without a streak", () =>
    expect(moodFor(calendar([9, 0, 9, 0, 0, 0, 1]))).toBe("happy"));
  it("idles after light recent activity", () => expect(moodFor(calendar([0, 0, 1, 0]))).toBe("idle"));
  it("gets hungry after 4 quiet days", () => {
    expect(moodFor(quiet(3))).toBe("idle");
    expect(moodFor(quiet(4))).toBe("hungry");
  });
  it("falls asleep after 14 quiet days", () => {
    expect(moodFor(quiet(13))).toBe("hungry");
    expect(moodFor(quiet(14))).toBe("sleeping");
  });
});

describe("levels", () => {
  it("round-trips level thresholds", () => {
    for (let level = 1; level < 99; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
      expect(levelForXp(xpForLevel(level + 1) - 1)).toBe(level);
    }
  });

  it("caps at 99", () => expect(levelForXp(10_000_000)).toBe(99));

  it("hatches at level 3 and turns legendary at 50", () => {
    expect(stageForLevel(2)).toBe("egg");
    expect(stageForLevel(3)).toBe("baby");
    expect(stageForLevel(15)).toBe("adult");
    expect(stageForLevel(50)).toBe("legendary");
  });

  it("keeps stats within 1..99", () => {
    expect(statFor(0)).toBe(1);
    expect(statFor(100)).toBe(50);
    expect(statFor(1e9)).toBe(99);
  });
});

describe("computePetState", () => {
  it("derives a complete pet from a profile", () => {
    const state = computePetState(profile(), { petName: "Ferris" });
    expect(state).toMatchObject({
      login: "octocat",
      petName: "Ferris",
      species: "crab",
      className: "Berserker",
      topLanguage: "Rust",
      mood: "happy",
      streak: 2,
      xp: 3000 + 250 * 2 + 100 * 3,
    });
    expect(state.level).toBe(levelForXp(state.xp));
    expect(state.xp).toBeGreaterThanOrEqual(state.xpLevelStart);
    expect(state.xp).toBeLessThan(state.xpNextLevel);
  });

  it("is an Adventurer without languages", () => {
    expect(computePetState(profile({ languages: [] })).className).toBe("Adventurer");
  });
});
