import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { demoState, MOODS } from "../src/demo.js";
import { CYCLE, lifeFor, SCRIPTS } from "../src/pet/life.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";

const crab = SPECIES.crab!;
const turtle = SPECIES.turtle!;

describe("a day in the life", () => {
  it("scripts every mood for every species as valid SVG", () => {
    for (const species of Object.keys(SPECIES)) {
      for (const mood of MOODS) {
        const svg = renderPetCard(demoState(mood, "adult", undefined, species));
        expect(XMLValidator.validate(svg), `${species}/${mood}`).toBe(true);
        expect(svg).not.toMatch(/undefined|NaN|Infinity/);
      }
    }
  });

  it("uses percentages within the cycle", () => {
    const { css } = lifeFor("idle", crab, 4, 80, 52, "2026-09-26", "octocat");
    const pcts = [...css.matchAll(/(\d+(?:\.\d+)?)%\{/g)].map((m) => Number(m[1]));
    expect(pcts.length).toBeGreaterThan(20);
    expect(pcts.every((p) => p >= 0 && p <= 100)).toBe(true);
    expect(css).toContain(`${CYCLE}s`);
  });

  it("turns side-view pets to face where they walk", () => {
    expect(lifeFor("idle", turtle, 4, 80, 48, "2026-09-26", "o").faceClass).toMatch(/^pf-f-/);
    expect(lifeFor("idle", crab, 4, 80, 52, "2026-09-26", "o").faceClass).toBe("");
    const { css } = lifeFor("idle", turtle, 4, 80, 48, "2026-09-26", "o");
    expect(css).toMatch(/scaleX\(-1\)/);
  });

  it("gives each species its own move while idle", () => {
    const moves = Object.values(SPECIES).map((s) => lifeFor("idle", s, 4, 80, 52, "2026-09-26", "o").css.match(/pf-b-act-[^{]*\{[^}]*\}/)?.[0]);
    expect(new Set(moves).size).toBe(Object.keys(SPECIES).length);
    expect(lifeFor("idle", SPECIES.gopher!, 4, 64, 68, "2026-09-26", "o").overlay).toContain("pf-life-burst"); // dirt flies
  });

  it("yawns by swapping the open eyes for closed ones", () => {
    const life = lifeFor("idle", crab, 4, 80, 52, "2026-09-26", "o");
    expect(life.eyes?.alts).toEqual([{ cls: expect.any(String), kind: "closed" }]);
    const svg = renderPetCard(demoState("idle"));
    expect(svg).toContain(`class="${life.eyes!.hide}"`);
    expect(svg).toContain(`class="${life.eyes!.alts[0]!.cls}"`);
  });

  it("sits a hungry pet by an empty bowl, and lets a sleeping one dream", () => {
    expect(renderPetCard(demoState("hungry"))).toMatch(/GRR|pf-want-/);
    expect(lifeFor("sleeping", crab, 4, 80, 52, "2026-09-26", "o").overlay).toMatch(/pf-dream-/);
  });

  it("dreams of different things on different nights", () => {
    const dreams = new Set(Array.from({ length: 20 }, (_, i) => lifeFor("sleeping", crab, 4, 80, 52, `2026-09-${String(i + 1).padStart(2, "0")}`, "o").overlay));
    expect(dreams.size).toBeGreaterThan(2);
  });
});

describe("routines", () => {
  const xAt = (path: [number, number][], t: number) => {
    for (let i = 1; i < path.length; i++) {
      const [t0, x0] = path[i - 1]!;
      const [t1, x1] = path[i]!;
      if (t >= t0 && t <= t1) return x0 + ((x1 - x0) * (t - t0)) / (t1 - t0 || 1);
    }
    return path.at(-1)![1];
  };

  it("keeps every playful routine standing still while the trick plays", () => {
    for (const mood of ["idle", "happy"] as const) {
      for (const [i, script] of SCRIPTS[mood].entries()) {
        for (const [a, b] of [[8.4, 10.6], [20.4, 22.6]] as const) {
          const xs = [a, (a + b) / 2, b].map((t) => xAt(script.path, t));
          expect(new Set(xs).size, `${mood} #${i} at ${a}s`).toBe(1);
        }
        expect(script.path[0]![1], `${mood} #${i} loops`).toBe(script.path.at(-1)![1]);
      }
    }
  });

  it("varies the routine from day to day", () => {
    const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"];
    const paths = new Set(days.map((d) => lifeFor("idle", crab, 4, 80, 52, d, "o").css.match(/@keyframes pf-p-[^}]*\}[^@]*/)?.[0]));
    expect(paths.size).toBeGreaterThan(1);
  });

  it("never yawns while cross-eyed", () => {
    for (const d of ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]) {
      const life = lifeFor("idle", crab, 4, 80, 52, d, "o", { crossed: [[11, 17]] });
      expect(life.eyes?.alts.map((a) => a.kind)).toContain("crossed");
    }
  });
});

describe("chatter", () => {
  it("says a different word now and then, and keeps it short", () => {
    const days = Array.from({ length: 20 }, (_, i) => `2026-05-${String(i + 1).padStart(2, "0")}`);
    const bubbles = days.map((d) => lifeFor("idle", crab, 4, 80, 52, d, "octocat").overlay);
    expect(new Set(bubbles).size).toBeGreaterThan(3);
    for (const b of bubbles) for (const w of b.match(/width="(\d+)" height="14"/g) ?? []) expect(Number(w.match(/\d+/)![0])).toBeLessThanOrEqual(46);
  });
});
