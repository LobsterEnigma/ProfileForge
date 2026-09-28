import { describe, expect, it } from "vitest";
import { demoState, HOLIDAY_DATES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { computePetState, momentsFor } from "../src/pet/state.js";
import { disguiseFor, surpriseFor, tripRoll } from "../src/pet/surprises/index.js";
import { PLACE_COUNT, PLACES, placePhoto, placeTitle, postcardPlace, tripFor } from "../src/pet/surprises/postcard.js";
import { textWidth } from "../src/svg/pixelfont.js";
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
    expect(svg).toMatch(/Weekend trip · /);
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

describe("weekend trips", () => {
  const days = Array.from({ length: 400 }, (_, i) => new Date(Date.UTC(2026, 0, 3) + i * 86_400_000).toISOString().slice(0, 10));

  it("travels the whole world, sometimes with a friend, at night or with a golden stamp", () => {
    const days = Array.from({ length: 2000 }, (_, i) => new Date(Date.UTC(2026, 0, 3) + i * 86_400_000).toISOString().slice(0, 10));
    const trips = days.map((d) => tripFor("octocat", d));
    expect(PLACE_COUNT).toBeGreaterThanOrEqual(50);
    expect(new Set(trips.map((t) => t.place.name)).size).toBe(PLACE_COUNT);
    for (const kind of ["golden", "night", "friend"] as const) {
      const n = trips.filter((t) => t[kind]).length;
      expect(n, kind).toBeGreaterThan(0);
      expect(n, kind).toBeLessThan(trips.length / 2);
    }
  });

  it("gives every place a photo, a stamp and a souvenir that fit", () => {
    expect(new Set(PLACES.map((p) => p.name)).size).toBe(PLACES.length);
    for (const place of PLACES) {
      const svg = placePhoto(place, "fox", demoState("happy"));
      expect(svg, place.name).not.toMatch(/NaN|undefined/);
      // The caption fits the card, the status line fits the panel.
      expect(textWidth(place.name) * 2, place.name).toBeLessThanOrEqual(140);
      expect(`Weekend trip · ${placeTitle(place.name)}`.length, place.name).toBeLessThanOrEqual(36);
      expect(`Back home · brought ${place.souvenir.name}`.length, place.souvenir.name).toBeLessThanOrEqual(36);
      // The stamp's picture fits inside its 20 × 24 frame.
      expect(Math.max(...place.stamp.grid.map((r) => r.length)) * 2, place.name).toBeLessThanOrEqual(20);
      expect(place.stamp.grid.length * 2, place.name).toBeLessThanOrEqual(24);
      for (const icon of [place.stamp, place.souvenir]) {
        for (const ch of icon.grid.join("").replace(/\./g, "")) expect(icon.colors, `${place.name} ${ch}`).toHaveProperty(ch);
      }
    }
  });

  it("brings a souvenir home the day after a trip", () => {
    // 2026-09-19 is a Saturday; find a login whose Saturday rolled a trip.
    const login = Array.from({ length: 50 }, (_, i) => `u${i}`).find((l) => tripRoll(l, "2026-09-19"))!;
    const cal = calendar([...Array(300).fill(1), 0, 2]); // quiet Saturday, back on Sunday
    const p = profile({ login, calendar: cal.map((d, i) => ({ ...d, date: new Date(Date.UTC(2026, 8, 20) - (cal.length - 1 - i) * 86_400_000).toISOString().slice(0, 10) })) });
    const pet = computePetState(p);
    expect(pet.moments?.backFrom).toBe("2026-09-19");
    expect(surpriseFor({ ...pet, mood: "idle" }, "autumn")).toBe("souvenir");
    const svg = renderPetCard({ ...pet, mood: "idle", surprise: "souvenir" });
    expect(svg).toContain(`Back home · brought ${postcardPlace(login, "2026-09-19").souvenir.name}`);
  });

  it("only brings a souvenir home when yesterday's card really showed a trip", () => {
    const login = Array.from({ length: 50 }, (_, i) => `u${i}`).find((l) => tripRoll(l, "2026-09-19"))!;
    const dated = (counts: number[]) => {
      const cal = calendar(counts);
      return cal.map((d, i) => ({ ...d, date: new Date(Date.UTC(2026, 8, 20) - (cal.length - 1 - i) * 86_400_000).toISOString().slice(0, 10) }));
    };
    // Quiet since Tuesday: on Saturday it was hungry and stayed home, so Sunday brings nothing back.
    const hungry = computePetState(profile({ login, calendar: dated([...Array(300).fill(1), 0, 0, 0, 0, 0, 3]) }));
    expect(hungry.mood).toBe("idle");
    expect(hungry.moments?.backFrom).toBeUndefined();
    expect(surpriseFor(hungry, "autumn")).not.toBe("souvenir");
  });
});

