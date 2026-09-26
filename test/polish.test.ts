import { describe, expect, it } from "vitest";
import { demoState } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { ambient } from "../src/pet/scenery.js";

const area = { x: 12, y: 12, w: 200, ground: 144 };

describe("ambient life", () => {
  it.each([
    ["crab", "pf-amb-gull"],
    ["gopher", "pf-amb-bee"],
    ["snake", "pf-amb-bob"],
    ["elephant", "pf-amb-hop"],
    ["chick", "pf-amb-worm"],
    ["turtle", "pf-amb-fish"],
  ])("gives the %s's home some company (%s)", (species, cls) => {
    const { svg, css } = ambient(species, area);
    expect(svg).toContain(cls);
    expect(css).toContain(`@keyframes ${cls}`);
    expect(renderPetCard(demoState("idle", "adult", undefined, species))).toContain(cls);
  });

  it("rotates things around themselves, never around the corner of the card", () => {
    for (const species of ["crab", "gopher", "snake", "elephant", "chick", "turtle"]) {
      const { css } = ambient(species, area);
      for (const rule of css.match(/\.[\w-]+\{[^}]*animation[^}]*\}/g) ?? []) {
        const name = rule.match(/animation:([\w-]+)/)![1]!;
        const frames = css.slice(css.indexOf(`@keyframes ${name}`));
        if (/rotate|scale/.test(frames.slice(0, frames.indexOf("}}") + 2))) expect(rule, name).toContain("transform-box:fill-box");
      }
    }
  });
});

describe("panel and sky", () => {
  it("sweeps a shine over the name and a glint along the bars", () => {
    const svg = renderPetCard(demoState("happy"));
    expect(svg).toContain('clipPath id="pf-name-clip"');
    expect(svg.match(/class="pf-glint"/g)).toHaveLength(2);
    expect(svg).toContain('class="pf-charge"');
  });

  it("has nothing left to charge at the level cap, and no glint on an empty bar", () => {
    const maxed = { ...demoState("sleeping"), level: 99 };
    const svg = renderPetCard(maxed);
    expect(svg).not.toContain('class="pf-charge"');
    expect(svg.match(/class="pf-glint"/g)).toHaveLength(1); // HP is empty while asleep
  });

  it("drifts clouds and shooting stars only through clear skies", () => {
    expect(renderPetCard(demoState("idle"))).toContain("pf-cloud");
    expect(renderPetCard(demoState("hungry"))).not.toContain('class="pf-cloud"'); // rain
  });
});
