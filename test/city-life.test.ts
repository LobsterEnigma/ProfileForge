import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { holidayFor } from "../src/city/events.js";
import { renderCityCard } from "../src/city/render.js";
import { computeCityState, type CityState } from "../src/city/state.js";
import { weatherFor } from "../src/world/weather.js";
import { demoProfile } from "../src/demo.js";
import { handleWidget } from "../src/handler.js";
import { calendar, profile } from "./helpers.js";

const demo = computeCityState(demoProfile());
const count = (svg: string, needle: string) => svg.split(needle).length - 1;
const valid = (state: CityState, theme?: string) => {
  const svg = renderCityCard(state, { theme });
  expect(XMLValidator.validate(svg)).toBe(true);
  expect(svg).not.toMatch(/undefined|NaN/);
  return svg;
};

describe("weather", () => {
  it("matches the pet's mood thresholds", () => {
    expect(weatherFor(0)).toBe("clear");
    expect(weatherFor(3)).toBe("clear");
    expect(weatherFor(4)).toBe("rain");
    expect(weatherFor(13)).toBe("rain");
    expect(weatherFor(14)).toBe("fog");
  });

  it("rains instead of dropping leaves, and hides the moon", () => {
    const svg = valid({ ...demo, daysSinceLastContribution: 6 });
    expect(svg).toContain('class="pf-rain"');
    expect(svg).not.toContain('class="pf-fall');
    expect(svg).toContain("in the rain");
    expect(svg).not.toContain('class="pf-twinkle"');
  });

  it("rolls in fog after two quiet weeks", () => {
    const svg = valid({ ...demo, daysSinceLastContribution: 20 });
    expect(svg).toContain('class="pf-fog"');
    expect(svg).toContain("lost in fog");
  });

  it("drifts fair-weather clouds on clear days", () => {
    expect(valid(demo)).toContain('class="pf-drift"');
  });
});

describe("holidays", () => {
  it.each([
    ["2026-10-24", null],
    ["2026-10-25", "halloween"],
    ["2026-10-31", "halloween"],
    ["2026-12-24", "christmas"],
    ["2026-12-31", "new-year"],
    ["2027-01-01", "new-year"],
    ["2027-02-03", "lunar-new-year"], // 3 days before
    ["2027-02-06", "lunar-new-year"],
    ["2027-02-10", null], // 4 days after
    ["2026-07-04", null],
  ])("%s → %s", (date, holiday) => expect(holidayFor(date)).toBe(holiday));

  it("decorates the city", () => {
    expect(valid({ ...demo, date: "2026-10-30" })).toContain('class="pf-bats"');
    expect(valid({ ...demo, date: "2026-12-24" })).toContain('class="pf-xmas-a"');
    expect(valid({ ...demo, date: "2027-02-06" })).toContain('class="pf-swing"');
    expect(valid(demo)).not.toMatch(/class="pf-(bats|xmas-a|swing)"/);
  });
});

describe("fireworks", () => {
  it("celebrate a 30-day streak", () => {
    expect(valid({ ...demo, currentStreak: 30 })).toContain('class="pf-spark"');
    expect(valid(demo)).not.toContain('class="pf-spark"');
  });

  it("celebrate a new best week", () => {
    const days = calendar(Array(60).fill(1));
    days[days.length - 1]!.count = 50;
    expect(valid(computeCityState(profile({ calendar: days })))).toContain('class="pf-spark"');
  });

  it("celebrate New Year's Day", () => {
    expect(valid({ ...demo, date: "2027-01-01" })).toContain('class="pf-spark"');
  });
});

describe("street", () => {
  it("paints a dashed center line between the lanes", () => {
    expect(valid(demo)).toContain('fill="#f2e3a8"');
  });

  it("drops leaf-shaped leaves in autumn and litters the sidewalk", () => {
    const svg = valid(demo); // demo ends in September
    expect(svg).toMatch(/<path class="pf-fall pf-spin"/);
    expect(svg).toContain('<g opacity=".85"><rect');
  });

  it("keeps snow square and the sidewalk clean in winter", () => {
    const svg = renderCityCard(demo, { season: "winter" });
    expect(svg).not.toMatch(/<path class="pf-fall/);
    expect(svg).toMatch(/<rect class="pf-fall"/);
  });
});

describe("suburbs", () => {
  it("turns weeks with 1–3 contributions into houses", () => {
    const quiet = computeCityState(profile({ calendar: calendar([...Array(60).fill(0).map((_, i) => (i % 7 === 3 ? 1 : 0)), 9]) }));
    const svg = valid(quiet);
    // Each house has a stepped roof; its 2-unit peak is unique to houses.
    expect(count(svg, "v2h-2z")).toBeGreaterThan(0);
    expect(svg).toMatch(/#7a3b2e|#4f3f63|#35536b/);
  });
});

describe("pet in the city", () => {
  it("strolls when happy", () => {
    expect(valid(demo)).toContain('class="pf-stroll"');
  });

  it("rests and dreams when asleep", () => {
    const svg = valid({ ...demo, pet: { ...demo.pet!, mood: "sleeping" } });
    expect(svg).not.toContain('class="pf-stroll"');
    expect(svg).toContain('class="pf-zz"');
  });

  it("can stay home with ?pet=false", async () => {
    const res = await handleWidget("city", new URL("http://localhost/api/city?user=demo&pet=false"));
    expect(await res.text()).not.toContain('class="pf-stroll"');
  });

  it("follows the species param", () => {
    expect(computeCityState(demoProfile(), { species: "gopher" }).pet?.species).toBe("gopher");
  });
});

describe("gameboy", () => {
  it("recolors the whole city through the theme filter", () => {
    expect(valid(demo, "gameboy")).toContain('filter="url(#pf-theme)"');
    expect(valid(demo, "dark")).not.toContain("pf-theme");
  });
});
