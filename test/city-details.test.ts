import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { signLabel } from "../src/city/buildings.js";
import { moonPhase, moonPhaseName, pixelMoon } from "../src/city/celestial.js";
import { renderCityCard } from "../src/city/render.js";
import { SEASONS, seasonFor, SNOW } from "../src/world/seasons.js";
import { computeCityState } from "../src/city/state.js";
import { lightness, neonize } from "../src/color.js";
import { demoProfile } from "../src/demo.js";
import { handleWidget } from "../src/handler.js";
import { profile } from "./helpers.js";

describe("moon phase", () => {
  // Real events, so the sky on your profile matches the one outside.
  it.each([
    ["2024-01-11", 0], // new moon
    ["2024-01-25", 0.5], // full moon
    ["2025-03-14", 0.5], // full moon (total lunar eclipse)
    ["2025-09-07", 0.5], // full moon (total lunar eclipse)
    ["2024-01-18", 0.25], // first quarter
    ["2024-02-02", 0.75], // last quarter
  ])("%s is %s", (date, expected) => {
    const phase = moonPhase(date);
    const distance = Math.min(Math.abs(phase - expected), 1 - Math.abs(phase - expected));
    expect(distance).toBeLessThan(0.04);
  });

  it("names phases", () => {
    expect(moonPhaseName(0)).toBe("new moon");
    expect(moonPhaseName(0.5)).toBe("full moon");
    expect(moonPhaseName(0.99)).toBe("new moon");
  });

  it("mirrors the moon in the southern hemisphere", () => {
    // Lit pixels at first quarter: right half up north, left half down south.
    const litRects = (svg: string) => [...svg.split("</g>")[1]!.matchAll(/M(-?\d+) (-?\d+)h(\d+)/g)].map((m) => [+m[1]!, +m[2]!, +m[3]!]);
    const north = litRects(pixelMoon(0, 0, 13, 2, 0.25));
    const south = litRects(pixelMoon(0, 0, 13, 2, 0.25, true));
    expect(north.every(([x]) => x! >= 0)).toBe(true);
    expect(south.every(([x, , w]) => x! + w! <= 0)).toBe(true);
    expect(south.length).toBe(north.length);
  });

  it("lights the whole disc at full moon and none at new moon", () => {
    expect(pixelMoon(0, 0, 13, 2, 0.5)).toMatch(/^<g opacity="\.13"><\/g><path/);
    expect(pixelMoon(0, 0, 13, 2, 0)).toMatch(/<\/g>$/);
  });
});

describe("seasons", () => {
  it.each([
    ["2026-03-01", "spring"],
    ["2026-07-15", "summer"],
    ["2026-09-24", "autumn"],
    ["2026-12-31", "winter"],
    ["2026-02-28", "winter"],
  ])("%s is %s", (date, season) => expect(seasonFor(date)).toBe(season));

  const demo = computeCityState(demoProfile());

  for (const season of SEASONS) {
    it(`renders valid SVG in ${season}`, () => {
      const svg = renderCityCard(demo, { season });
      expect(XMLValidator.validate(svg)).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN/);
      expect(svg).toContain(`in ${season}`);
    });
  }

  it("only snows in winter", () => {
    expect(renderCityCard(demo, { season: "winter" })).toContain(SNOW);
    expect(renderCityCard(demo, { season: "summer" })).not.toContain(SNOW);
  });

  it.each([
    ["2026-12-15", "summer"],
    ["2026-07-15", "winter"],
    ["2026-04-10", "autumn"],
    ["2026-10-10", "spring"],
  ])("flips %s to %s south of the equator", (date, season) => expect(seasonFor(date, "south")).toBe(season));

  it("follows the calendar date by default", () => {
    expect(renderCityCard(demo)).toContain("in autumn"); // demo ends 2026-09-24
  });

  it("turns autumn into spring with ?hemisphere=south", async () => {
    const res = await handleWidget("city", new URL("http://localhost/api/city?user=demo&hemisphere=south"));
    expect(await res.text()).toContain("in spring"); // demo ends 2026-09-24
  });

  it("lets a pinned season win over the hemisphere", async () => {
    const res = await handleWidget("city", new URL("http://localhost/api/city?user=demo&hemisphere=south&season=winter"));
    expect(await res.text()).toContain("in winter");
  });

  it("can be overridden with ?season=", async () => {
    const res = await handleWidget("city", new URL("http://localhost/api/city?user=demo&season=spring"));
    expect(await res.text()).toContain("in spring");
  });
});

describe("neon sign", () => {
  it("brightens dark and grey language colors", () => {
    expect(lightness(neonize("#555555"))).toBeGreaterThan(0.6); // C
    expect(lightness(neonize("#178600"))).toBeGreaterThan(0.6); // C#
    expect(neonize(null)).toBe("#ff79c6");
    expect(neonize("not a color")).toBe("#ff79c6");
  });

  it("shortens long language names", () => {
    expect(signLabel("Jupyter Notebook")).toBe("JUPYTER");
    expect(signLabel("TypeScript")).toBe("TS");
    expect(signLabel("Rust")).toBe("RUST");
    expect(signLabel("Some Very Long Language")).toHaveLength(10);
  });

  it("hangs your top language on the landmark", () => {
    const svg = renderCityCard(computeCityState(demoProfile()));
    expect(svg).toContain(">RUST</text>");
  });

  it("lets the crane carry the sign when this week is the best one yet", () => {
    const days = profile().calendar.map((d) => ({ ...d, count: 1 }));
    days[days.length - 1]!.count = 99; // today makes this week the best ever
    const svg = renderCityCard(computeCityState(profile({ calendar: days })));
    expect(svg.match(/class="pf-sign"/g)).toHaveLength(1);
    expect(svg).toContain(">RUST</text>");
  });

  it("skips the sign without languages", () => {
    const svg = renderCityCard(computeCityState(profile({ languages: [] })));
    expect(svg).not.toContain('class="pf-sign"');
    expect(svg).toContain('class="pf-beacon"');
  });

  it("escapes language names", () => {
    const svg = renderCityCard(computeCityState(profile({ languages: [{ name: "<x>&", color: "#fff", bytes: 1 }] })));
    expect(XMLValidator.validate(svg)).toBe(true);
  });
});
