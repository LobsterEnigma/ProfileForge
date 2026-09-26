import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { CARE_ACTIONS } from "../src/care/commands.js";
import { demoState, MOODS } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { activeVisit } from "../src/pet/visits.js";
import { newCareState } from "../src/care/state.js";
import { careView } from "../src/care/view.js";

const NOW = new Date("2026-09-26T12:00:00Z");
import { pixelText, textWidth } from "../src/svg/pixelfont.js";

const visited = (action: (typeof CARE_ACTIONS)[number], mood: (typeof MOODS)[number] = "happy", species = "crab") =>
  demoState(mood, "adult", undefined, species, { visit: action });

describe("pixelText", () => {
  it("lays glyphs out on five rows with a gap between them", () => {
    const grid = pixelText("Hi!");
    expect(grid).toHaveLength(5);
    expect(new Set(grid.map((r) => r.length)).size).toBe(1);
    expect(textWidth("HI")).toBe(3 + 1 + 3);
  });

  it("skips characters it can't draw", () => {
    expect(pixelText("A✨B")).toEqual(pixelText("AB"));
  });
});

describe("visits", () => {
  it("each has its own scene", () => {
    expect(renderPetCard(visited("feed"))).toContain('class="pf-chomp"');
    expect(renderPetCard(visited("bath"))).toContain('class="pf-duck"');
    expect(renderPetCard(visited("play"))).toContain('class="pf-fetch-ball"');
  });

  it("lets a sleeping pet be bathed, but leaves food and toys for later", () => {
    expect(activeVisit(visited("bath", "sleeping"))).toBe("bath");
    expect(activeVisit(visited("feed", "sleeping"))).toBeNull();
    const card = renderPetCard(visited("feed", "sleeping"));
    expect(card).not.toContain('class="pf-chomp"');
    expect(card).toContain("#e03131"); // the bowl waits next to it
  });

  it("doesn't happen for eggs or runaways", () => {
    expect(activeVisit({ ...visited("feed"), stage: "egg" })).toBeNull();
    expect(activeVisit({ ...visited("feed"), ranAway: true })).toBeNull();
  });

  for (const species of Object.keys(SPECIES)) {
    it(`renders every visit for the ${species} in every mood`, () => {
      for (const action of CARE_ACTIONS) {
        for (const mood of MOODS) {
          const svg = renderPetCard(visited(action, mood, species));
          expect(XMLValidator.validate(svg)).toBe(true);
          expect(svg).not.toMatch(/undefined|NaN/);
        }
      }
    });
  }
});

describe("several visits", () => {
  it("lets every kind of visit from the last 12 hours take a turn, oldest first", () => {
    const at = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString();
    const state = {
      ...newCareState(new Date(NOW.getTime() - 30 * 86_400_000)),
      recent: [
        { action: "play" as const, by: "carol", at: at(1) },
        { action: "feed" as const, by: "bob", at: at(2) },
        { action: "feed" as const, by: "alice", at: at(3) },
        { action: "bath" as const, by: "dave", at: at(14) },
      ],
    };
    expect(careView(state, NOW).visitors).toEqual([
      { login: "bob", action: "feed" },
      { login: "carol", action: "play" },
    ]);
  });

  it("plays each visit's scene in turn, with its visitor's name", () => {
    const svg = renderPetCard(demoState("idle", "adult", undefined, "crab", { visit: "all" }));
    expect(XMLValidator.validate(svg)).toBe(true);
    for (const [k, line] of ["Fed by octocat", "Bathed by hubot", "Played with monalisa"].entries()) {
      expect(svg).toMatch(new RegExp(`class="pf-mood pf-turn${k}">${line}`));
    }
    expect(svg).toContain("pf-meal-walk");
    expect(svg).toContain("pf-duck");
    expect(svg).toContain("pf-fetch-ball");
    expect(svg).toContain("@keyframes pf-turn2{0%{opacity:0}66.667%{opacity:1}100%{opacity:0}");
  });

  it("names every visitor even while the pet sleeps through them", () => {
    const svg = renderPetCard(demoState("sleeping", "adult", undefined, "crab", { visit: "all" }));
    expect(svg).toContain("pf-duck"); // the bath still happens
    expect(svg).not.toContain("pf-meal-walk");
    expect(svg).toContain("Fed by octocat");
    expect(svg).toContain("Played with monalisa");
  });
});
