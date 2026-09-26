import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { anchors, glance, TRICK_STARTS, TRICKS, trickFor, tricksFor } from "../src/pet/behavior.js";
import { demoState } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { computePetState, RUN_AWAY_DAYS } from "../src/pet/state.js";
import { strollingPet } from "../src/city/pet.js";
import { calendar, profile } from "./helpers.js";

describe("glancing", () => {
  it("slides pupils into the eye white", () => {
    const eyes = glance([{ x: 0, y: 0, grid: ["oooo", "owko", "owwo", "oooo"] }]);
    expect(eyes?.[0]?.grid).toEqual(["oooo", "okwo", "owwo", "oooo"]);
  });

  it("looks the other way when there is no room", () => {
    expect(glance([{ x: 0, y: 0, grid: ["kw", "kk"] }])?.[0]?.grid).toEqual(["wk", "kk"]);
  });

  it("gives up on eyes without whites", () => {
    expect(glance([{ x: 0, y: 0, grid: ["kk"] }])).toBeNull();
  });

  it("works for every species", () => {
    for (const s of Object.values(SPECIES)) expect(glance(s.eyes.open), s.id).not.toBeNull();
  });
});

describe("anchors", () => {
  it("finds eyes and a mouth inside every sprite", () => {
    for (const s of Object.values(SPECIES)) {
      const a = anchors(s);
      expect(a.eyes.length, s.id).toBeGreaterThan(0);
      for (const p of [...a.eyes, a.mouth]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(s.width);
        expect(p.y).toBeLessThanOrEqual(s.height);
      }
    }
  });
});

describe("tricks", () => {
  it("picks the same trick all day", () => {
    expect(trickFor("2026-09-25", "octocat")).toBe(trickFor("2026-09-25", "octocat"));
  });

  it("lines up four different tricks a day, often with the species' own move", () => {
    const days = Array.from({ length: 40 }, (_, i) => tricksFor(`2026-03-${String((i % 28) + 1).padStart(2, "0")}`, `u${i}`));
    for (const day of days) {
      expect(day).toHaveLength(TRICK_STARTS.length);
      expect(new Set(day).size).toBe(day.length);
    }
    expect(days.filter((d) => d.includes("signature")).length).toBeGreaterThan(days.length / 2);
    expect(new Set(days.flat()).size).toBeGreaterThanOrEqual(15);
  });

  it("gives each of today's tricks its own window", () => {
    const svg = renderPetCard(demoState("happy", "adult", undefined, "crab"));
    for (const slot of [0, 1, 2, 3]) expect(svg).toMatch(new RegExp(`class="pf-k${slot}-`));
    // Slot 1 starts at 20.4s of the 48s loop: 42.5%.
    expect(svg).toMatch(/@keyframes pf-k1-[\w-]+\{[^}]*42\.5%/);
  });

  it("varies across days", () => {
    const seen = new Set(Array.from({ length: 60 }, (_, i) => trickFor(`2026-01-${String((i % 28) + 1).padStart(2, "0")}`, `u${i}`)));
    expect(seen.size).toBeGreaterThanOrEqual(5);
  });

  for (const species of Object.keys(SPECIES)) {
    it(`renders every trick for the ${species}`, () => {
      for (const trick of TRICKS) {
        for (const mood of ["happy", "idle"] as const) {
          const svg = renderPetCard(demoState(mood, "adult", undefined, species, { trick }));
          expect(XMLValidator.validate(svg)).toBe(true);
          expect(svg).not.toMatch(/undefined|NaN/);
        }
      }
    });
  }

  it("only performs when the pet is in the mood", () => {
    expect(renderPetCard(demoState("idle", "adult", undefined, "crab", { trick: "dance" }))).toContain('class="pf-k0-dance"');
    expect(renderPetCard(demoState("hungry", "adult", undefined, "crab", { trick: "dance" }))).not.toContain("pf-k0-dance");
    expect(renderPetCard(demoState("sleeping", "adult", undefined, "crab", { trick: "dance" }))).not.toContain('class="pf-emote"');
  });

  it("looks around when idle", () => {
    expect(renderPetCard(demoState("idle"))).toContain('class="pf-eg"');
  });
});

describe("running away", () => {
  const quiet = (days: number) => profile({ calendar: calendar([5, ...Array(days).fill(0)]) });

  it(`leaves after ${RUN_AWAY_DAYS} quiet days`, () => {
    expect(computePetState(quiet(RUN_AWAY_DAYS - 1)).ranAway).toBe(false);
    expect(computePetState(quiet(RUN_AWAY_DAYS)).ranAway).toBe(true);
  });

  it("never leaves as an egg", () => {
    expect(computePetState({ ...quiet(60), lifetimeContributions: 5, totalStars: 0, followers: 0 }).ranAway).toBe(false);
  });

  it("leaves a note on the card and the city sidewalk empty", () => {
    const state = computePetState(quiet(40));
    const svg = renderPetCard(state);
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).toContain("Ran away");
    expect(strollingPet(state)).toBe("");
  });
});
