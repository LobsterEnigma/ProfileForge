import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { floorsFor, renderCityCard } from "../src/city/render.js";
import { MAX_FLOORS } from "../src/city/layout.js";
import { computeCityState, groupWeeks, longestStreak } from "../src/city/state.js";
import { demoProfile } from "../src/demo.js";
import { THEME_NAMES } from "../src/themes.js";
import { calendar, profile } from "./helpers.js";

describe("groupWeeks", () => {
  it("starts a new week on Sundays", () => {
    // 2026-09-24 is a Thursday, so the last 11 days span Mon 14th … Thu 24th.
    const weeks = groupWeeks(calendar([1, 0, 2, 0, 0, 3, 1, 4, 0, 0, 5]));
    expect(weeks.map((w) => w.start)).toEqual(["2026-09-14", "2026-09-20"]);
    expect(weeks[0]).toMatchObject({ total: 6, activeDays: 3 }); // Mon–Sat: 1,0,2,0,0,3
    expect(weeks[1]).toMatchObject({ total: 10, activeDays: 3 }); // Sun–Thu: 1,4,0,0,5
  });

  it("handles an empty calendar", () => expect(groupWeeks([])).toEqual([]));
});

describe("city stats", () => {
  it("finds the longest streak anywhere in the year", () => {
    expect(longestStreak(calendar([1, 1, 0, 1, 1, 1, 0, 1]))).toBe(3);
    expect(longestStreak(calendar([0, 0]))).toBe(0);
  });

  it("summarizes a profile", () => {
    const state = computeCityState(profile({ calendar: calendar([0, 5, 0, 0, 0, 0, 0, 0, 1, 1]) }));
    expect(state.total).toBe(7);
    expect(state.bestWeek?.total).toBe(5);
    expect(state.currentStreak).toBe(2);
    expect(state.activeDays14).toBe(3);
  });

  it("has no best week without contributions", () => {
    expect(computeCityState(profile({ calendar: calendar([0, 0, 0]) })).bestWeek).toBeNull();
  });
});

describe("floorsFor", () => {
  const week = (total: number) => ({ start: "2026-01-04", total, activeDays: 1 });

  it("leaves empty weeks as parks", () => expect(floorsFor(week(0), 10)).toBe(0));
  it("gives the best week the full height", () => expect(floorsFor(week(10), 10)).toBe(MAX_FLOORS));
  it("always builds at least one floor for any activity", () => expect(floorsFor(week(1), 10_000)).toBe(1));
  it("grows with activity", () => expect(floorsFor(week(5), 10)).toBeLessThan(floorsFor(week(8), 10)));
});

describe("renderCityCard", () => {
  const demo = computeCityState(demoProfile());

  for (const theme of THEME_NAMES) {
    it(`renders valid SVG with the ${theme} theme`, () => {
      const svg = renderCityCard(demo, { theme });
      expect(XMLValidator.validate(svg)).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN|Infinity/);
    });
  }

  it("is deterministic, so the Action only commits real changes", () => {
    expect(renderCityCard(demo)).toBe(renderCityCard(computeCityState(demoProfile())));
  });

  it("survives a brand-new account with no contributions", () => {
    const svg = renderCityCard(computeCityState(profile({ calendar: calendar(Array(40).fill(0)) })));
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).not.toMatch(/NaN|Infinity/);
    expect(svg).not.toContain('class="pf-drive'); // no activity, no traffic
    expect(svg).toContain('class="pf-beacon"'); // the crane still stands on the empty lot
  });

  it("shows a shooting star only on a 7+ day streak", () => {
    expect(renderCityCard(demo)).toContain('class="pf-shoot"');
    const quiet = computeCityState(profile({ calendar: calendar([...Array(30).fill(1), 0, 0, 1]) }));
    expect(renderCityCard(quiet)).not.toContain('class="pf-shoot"');
  });

  it("escapes the login", () => {
    const svg = renderCityCard({ ...demo, login: `<b>"x"</b>` });
    expect(XMLValidator.validate(svg)).toBe(true);
    expect(svg).not.toContain("<b>");
  });

  it("stays small enough for GitHub's image proxy", () => {
    expect(renderCityCard(demo).length).toBeLessThan(80_000);
  });
});
