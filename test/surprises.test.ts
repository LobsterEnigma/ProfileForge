import { describe, expect, it } from "vitest";
import { demoState, HOLIDAY_DATES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { computePetState, momentsFor } from "../src/pet/state.js";
import { disguiseFor, surpriseFor } from "../src/pet/surprises/index.js";
import { postcardPlace } from "../src/pet/surprises/postcard.js";
import { SURPRISES, type PetState } from "../src/types.js";
import { dayOfYear, holidayFor, HOLIDAYS, newYearFor, zodiacFor } from "../src/world/calendar.js";
import { calendar, profile } from "./helpers.js";

describe("the holiday calendar", () => {
  it.each([
    ["2026-02-14", "valentines"],
    ["2027-03-14", "pi-day"],
    ["2027-04-01", "april-fools"],
    ["2026-09-13", "programmers-day"], // day 256
    ["2028-09-12", "programmers-day"], // day 256 in a leap year
    ["2028-09-13", null],
    ["2026-09-24", "mid-autumn"], // the eve
    ["2026-09-25", "mid-autumn"],
    ["2026-09-27", null],
    ["2028-10-03", "mid-autumn"],
    ["2026-12-31", "new-year"],
    ["2027-02-06", "lunar-new-year"],
    ["2026-10-31", "halloween"],
    ["2026-12-25", "christmas"],
    ["2026-07-15", null],
  ])("%s → %s", (date, holiday) => expect(holidayFor(date)).toBe(holiday));

  it("knows the day of the year, the zodiac and which new year is coming", () => {
    expect(dayOfYear("2026-01-01")).toBe(1);
    expect(dayOfYear("2026-12-31")).toBe(365);
    expect(zodiacFor("2027-02-06")).toBe("goat");
    expect(newYearFor("2026-12-31")).toBe(2027);
    expect(newYearFor("2027-01-01")).toBe(2027);
  });

  it("has a preview date for every holiday that really is that holiday", () => {
    for (const h of HOLIDAYS) expect(holidayFor(HOLIDAY_DATES[h])).toBe(h);
  });
});

describe("milestones", () => {
  const quiet = (days: number) => [...Array(300 - days).fill(1), ...Array(days).fill(0)];

  it("celebrates the account's birthday, and leap-day accounts on the 28th", () => {
    expect(momentsFor(profile({ createdAt: "2019-09-24T10:00:00Z" }), 3000, 20, "2026-09-24").birthday).toBe(7);
    expect(momentsFor(profile({ createdAt: "2025-09-24T10:00:00Z" }), 3000, 20, "2025-09-24").birthday).toBeUndefined();
    expect(momentsFor(profile({ createdAt: "2020-02-29T00:00:00Z" }), 3000, 20, "2027-02-28").birthday).toBe(7);
    expect(momentsFor(profile({ createdAt: "2020-02-29T00:00:00Z" }), 3000, 20, "2028-02-28").birthday).toBeUndefined();
  });

  it("spots a level-up from today's or yesterday's contributions", () => {
    // Level 5 starts at 80 XP.
    const p = profile({ calendar: calendar([...Array(100).fill(0), 0, 3]) });
    expect(momentsFor(p, 81, 5, "2026-09-24").levelUp).toBe(4);
    expect(momentsFor(p, 90, 5, "2026-09-24").levelUp).toBeUndefined();
  });

  it("welcomes you back after a week or more of silence", () => {
    expect(momentsFor(profile({ calendar: calendar([...quiet(10), 2]) }), 0, 1, "x").welcomeBack).toBe(10);
    expect(momentsFor(profile({ calendar: calendar([...quiet(10), 2, 0]) }), 0, 1, "x").welcomeBack).toBe(10);
    expect(momentsFor(profile({ calendar: calendar([...quiet(10), 2, 0, 0]) }), 0, 1, "x").welcomeBack).toBeUndefined();
    expect(momentsFor(profile({ calendar: calendar([...quiet(3), 2]) }), 0, 1, "x").welcomeBack).toBeUndefined();
    // Silent since the calendar began: we can't tell how long it was.
    expect(momentsFor(profile({ calendar: calendar([...Array(20).fill(0), 1]) }), 0, 1, "x").welcomeBack).toBeUndefined();
  });

  it("are computed with the pet", () => {
    const pet = computePetState(profile({ createdAt: "2016-09-24T00:00:00Z" }));
    expect(pet.moments?.birthday).toBe(10);
  });
});

describe("picking today's surprise", () => {
  const base = (over: Partial<PetState> = {}): PetState => ({ ...demoState("idle"), surprise: undefined, date: "2026-07-15", ...over });

  it("puts holidays first, then birthdays, level-ups and returns", () => {
    const moments = { birthday: 3, levelUp: 4, welcomeBack: 9 };
    expect(surpriseFor(base({ date: "2026-12-25", moments }), "winter")).toBe("christmas");
    expect(surpriseFor(base({ moments }), "summer")).toBe("birthday");
    expect(surpriseFor(base({ moments: { levelUp: 4, welcomeBack: 9 } }), "summer")).toBe("level-up");
    expect(surpriseFor(base({ moments: { welcomeBack: 9 } }), "summer")).toBe("welcome-back");
  });

  it("honours a forced surprise, or none at all", () => {
    expect(surpriseFor(base({ surprise: "ufo" }), "summer")).toBe("ufo");
    expect(surpriseFor(base({ date: "2026-12-25", surprise: null }), "winter")).toBeNull();
    // Previews show an ordinary day unless asked.
    expect(surpriseFor(demoState("idle"), "autumn")).toBeNull();
  });

  it("only sends postcards from quiet weekends", () => {
    const logins = Array.from({ length: 60 }, (_, i) => `user${i}`);
    const saturday = logins.map((login) => surpriseFor(base({ login, date: "2026-07-18", daysSinceLastContribution: 1 }), "summer"));
    expect(saturday).toContain("postcard");
    const busy = logins.map((login) => surpriseFor(base({ login, date: "2026-07-18", daysSinceLastContribution: 0 }), "summer"));
    expect(busy).not.toContain("postcard");
    const weekday = logins.map((login) => surpriseFor(base({ login, date: "2026-07-15", daysSinceLastContribution: 1 }), "summer"));
    expect(weekday).not.toContain("postcard");
  });

  it("keeps rare treats rare, and seasonal ones in season", () => {
    const days = Array.from({ length: 200 }, (_, i) => new Date(Date.UTC(2026, 3, 1) + i * 86_400_000).toISOString().slice(0, 10));
    const picks = days.filter((d) => !holidayFor(d)).map((date) => surpriseFor(base({ date, daysSinceLastContribution: 0 }), "spring"));
    const count = (s: string) => picks.filter((p) => p === s).length;
    expect(count("ufo")).toBeGreaterThan(0);
    expect(count("ufo")).toBeLessThan(picks.length * 0.12);
    expect(count("butterfly")).toBeGreaterThan(0);
    expect(count("sunglasses")).toBe(0);
    expect(picks.filter((p) => p === null).length).toBeGreaterThan(picks.length / 2);
  });

  it("leaves eggs, runaways and sleepy pets out of the rare treats", () => {
    const days = Array.from({ length: 60 }, (_, i) => `2026-07-${String((i % 28) + 1).padStart(2, "0")}`);
    for (const date of days) {
      expect(surpriseFor(base({ date, stage: "egg", daysSinceLastContribution: 0 }), "summer")).toBeNull();
      expect(surpriseFor(base({ date, ranAway: true }), "summer")).toBeNull();
      expect(["ufo", "friend", "postcard", "butterfly", "sunglasses"]).not.toContain(surpriseFor(base({ date, mood: "sleeping" }), "summer"));
    }
  });
});

describe("drawing surprises", () => {
  const card = (surprise: NonNullable<PetState["surprise"]>, [mood, stage, name, species]: Parameters<typeof demoState> = ["idle"]) =>
    renderPetCard(demoState(mood, stage, name, species, { surprise }));

  it("draws every surprise for every species without broken numbers", () => {
    for (const surprise of SURPRISES) {
      for (const species of Object.keys(SPECIES)) {
        const svg = card(surprise, ["idle", "adult", undefined, species]);
        expect(svg, `${surprise} ${species}`).not.toMatch(/NaN|undefined|Infinity/);
        expect(svg.length, `${surprise} ${species}`).toBeLessThan(60_000);
      }
    }
  });

  it("hangs a banner and changes the status line", () => {
    const svg = card("christmas");
    expect(svg).toContain("pf-s-banner");
    expect(svg).toContain("Merry Christmas!");
    expect(card("lunar-new-year")).toContain("year of the goat");
    expect(card("new-year")).toContain("hello 2027");
  });

  it("keeps a hungry or sleeping pet's status line", () => {
    expect(card("christmas", ["hungry"])).toContain("days without commits");
  });

  it("dresses up visitors' scenes for holidays only", () => {
    const bath = (surprise: NonNullable<PetState["surprise"]>) => renderPetCard(demoState("idle", "adult", undefined, "crab", { visit: "bath", surprise }));
    expect(bath("christmas")).toContain("#e03131"); // the Santa hat
    expect(bath("ufo")).not.toContain("pf-s-ufo");
  });

  it("decorates a runaway's empty scene, but dresses nobody up", () => {
    const svg = renderPetCard(demoState("idle", "adult", undefined, "crab", { away: true, surprise: "christmas" }));
    expect(svg).toContain("pf-s-banner"); // the banner
    expect(svg).toContain("pf-s-blink"); // the tree's lights
    expect(svg).not.toContain("#dfe6ee"); // the hat's brim shading
  });

  it("disguises the pet as another species on April Fools', at home", () => {
    const state = demoState("idle", "adult", undefined, "crab", { surprise: "april-fools" });
    expect(disguiseFor(state)).not.toBe("crab");
    const svg = renderPetCard(state);
    expect(svg).toContain("Nice disguise, Pinchy!");
    expect(svg).toContain("feeling idle"); // the description is still about the real pet
    expect(svg).toMatch(/Level 27 Berserker crab/);
  });

  it("swaps the pet for a postcard from somewhere a programmer would go", () => {
    const svg = card("postcard");
    expect(svg).toContain("pf-s-photo");
    expect(svg).toContain("postcard from");
    expect(postcardPlace("demo", "2026-09-24")).toEqual(postcardPlace("demo", "2026-09-24"));
  });

  it("makes the pet cross-eyed while the butterfly sits on its nose", () => {
    const svg = card("butterfly");
    expect(svg).toMatch(/class="pf-x-idle-crab"/);
    expect(svg).toContain("pf-s-fly");
  });

  it("renders the same card twice", () => {
    for (const surprise of SURPRISES) expect(card(surprise)).toBe(card(surprise));
  });
});
