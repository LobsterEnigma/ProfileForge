import { describe, expect, it } from "vitest";
import { computeCityState } from "../src/city/state.js";
import { renderCityCard, widthFor } from "../src/city/render.js";
import { demoProfile } from "../src/demo.js";

const demo = computeCityState(demoProfile());

describe("the city on the waterfront", () => {
  it("mirrors the skyline in the bay, rippled and fading", () => {
    const svg = renderCityCard(demo);
    expect(svg).toContain('<g id="pf-city">');
    expect(svg).toContain('<use href="#pf-city" transform="matrix(1 0 0 -1 0 395)"/>');
    expect(svg).toContain('mask="url(#pf-reflect)"');
    expect(svg).toContain('class="pf-ripple"');
  });

  it("builds wider for weeks you showed up on more days", () => {
    const week = (activeDays: number) => ({ start: "2026-09-20", total: 10, activeDays });
    expect([1, 3, 5, 7].map((d) => widthFor(week(d)))).toEqual([10, 12, 14, 16]);
  });

  it("lights the TV tower's deck and sweeps searchlights at night", () => {
    const svg = renderCityCard(demo, { theme: "dark" });
    expect(svg).toContain('fill="#ffe6a8"');
    expect(svg).not.toContain('stroke="#ffe6a8"'); // no string of lights hanging in the sky
    expect(svg).toContain('class="pf-search"');
    expect(svg).toContain('class="pf-bloom"');
  });

  it("keeps the balloon and the sailboat home in bad weather", () => {
    expect(renderCityCard(demo)).toContain("pf-balloon");
    const wet = renderCityCard({ ...demo, daysSinceLastContribution: 6 });
    expect(wet).not.toContain('class="pf-balloon"');
    expect(wet).toContain('class="pf-drop"');
  });

  it("puts the stats in pills", () => {
    const svg = renderCityCard(demo);
    for (const label of [`BEST WEEK ${demo.bestWeek!.total}`, `STREAK ${demo.currentStreak}D`, `LONGEST ${demo.longestStreak}D`]) expect(svg).toContain(`>${label}</text>`);
  });
});
