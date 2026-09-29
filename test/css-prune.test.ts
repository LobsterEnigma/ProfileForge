import { describe, expect, it } from "vitest";
import { computeCityState } from "../src/city/state.js";
import { renderCityCard } from "../src/city/render.js";
import { demoProfile, demoState, MOODS } from "../src/demo.js";
import { TRICKS } from "../src/pet/behavior.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { pruneCss } from "../src/svg/css.js";
import { SURPRISES } from "../src/types.js";

/** Every animation a kept rule names still has its keyframes. */
function selfContained(svg: string): void {
  const css = svg.slice(svg.indexOf("<style>") + 7, svg.indexOf("</style>"));
  const defined = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  for (const m of css.matchAll(/animation:\s*([\w-]+)/g)) if (m[1] !== "none") expect(defined, m[1]).toContain(m[1]);
}

describe("pruning unused CSS", () => {
  it("keeps rules for classes in use, their keyframes, the theme and media queries", () => {
    const css = `.pf{--a:1}.pf-a{animation:pf-a 1s}@keyframes pf-a{0%{opacity:0}}.pf-b{animation:pf-b 1s}@keyframes pf-b{0%{opacity:0}}.pf-a .pf-c{fill:red}@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}`;
    const out = pruneCss(css, `<svg class="pf"><g class="pf-a other"/></svg>`);
    expect(out).toContain(".pf{--a:1}");
    expect(out).toContain(".pf-a{animation:pf-a 1s}");
    expect(out).toContain("@keyframes pf-a");
    expect(out).not.toContain("pf-b");
    expect(out).not.toContain(".pf-c");
    expect(out).toContain("@media (prefers-reduced-motion:reduce)");
  });

  it("keeps keyframes named in inline styles", () => {
    const out = pruneCss(`@keyframes pf-x{0%{opacity:0}}`, `<rect style="animation:pf-x 2s"/>`);
    expect(out).toContain("@keyframes pf-x");
  });

  it("leaves every pet card self-contained", () => {
    for (const species of Object.keys(SPECIES)) {
      for (const mood of MOODS) selfContained(renderPetCard(demoState(mood, "adult", undefined, species)));
      for (const trick of TRICKS) selfContained(renderPetCard(demoState("idle", "adult", undefined, species, { trick })));
      selfContained(renderPetCard(demoState("idle", "adult", undefined, species, { visit: "all" })));
    }
    for (const surprise of SURPRISES) selfContained(renderPetCard(demoState("idle", "adult", undefined, "crab", { surprise })));
  });

  it("leaves the city self-contained", () => {
    const city = computeCityState(demoProfile());
    for (const theme of ["auto", "light", "dark", "gameboy"]) selfContained(renderCityCard(city, { theme }));
    selfContained(renderCityCard({ ...city, date: "2026-10-31", currentStreak: 40, daysSinceLastContribution: 5 }));
  });
});
