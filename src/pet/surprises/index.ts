/**
 * Surprises: at most one special thing per day, picked from the date and the contribution
 * data, so it's deterministic (a card rendered twice on the same day is byte-identical).
 *
 * In order: a holiday, the account's GitHub birthday, a fresh level-up, a return after a long
 * silence, a weekend trip (postcard), then rare treats: a UFO, a visiting friend, a butterfly
 * in spring, shades in summer.
 */
import { pick, seeded } from "../../random.js";
import type { PetState, Surprise } from "../../types.js";
import { holidayFor, HOLIDAYS, type Holiday } from "../../world/calendar.js";
import type { Season } from "../../world/seasons.js";
import { SPECIES } from "../species/index.js";
import { HOLIDAY_ART } from "./holidays.js";
import { banner, KIT_CSS, type Art, type Ctx } from "./kit.js";
import { MOMENT_ART } from "./moments.js";
import { postcard } from "./postcard.js";
import { RARE_ART } from "./rare.js";

export type { Art, Ctx, Scene, Box } from "./kit.js";

const isHoliday = (s: Surprise): s is Holiday => (HOLIDAYS as readonly string[]).includes(s);

/** Today's surprise, or null for an ordinary day. */
export function surpriseFor(state: PetState, season: Season): Surprise | null {
  if (state.surprise !== undefined) return state.surprise;
  const holiday = holidayFor(state.date);
  if (holiday) return holiday;
  const m = state.moments ?? {};
  if (m.birthday) return "birthday";
  if (state.ranAway) return null;
  if (m.levelUp !== undefined) return "level-up";
  if (m.welcomeBack) return "welcome-back";
  if (state.stage === "egg") return null;

  const calm = state.mood === "idle" || state.mood === "happy";
  const r = seeded(`surprise:${state.login}:${state.date}`)();
  const weekday = new Date(`${state.date}T00:00:00Z`).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  // No commits yet today on a weekend: half the time, it's gone travelling.
  if (calm && weekend && state.daysSinceLastContribution >= 1 && r < 0.5) return "postcard";
  if (state.mood !== "sleeping" && r >= 0.95) return "ufo";
  if (calm && r >= 0.87 && r < 0.95) return "friend";
  if (calm && season === "spring" && r >= 0.6 && r < 0.87) return "butterfly";
  if (calm && season === "summer" && r >= 0.6 && r < 0.87) return "sunglasses";
  return null;
}

/** On April Fools' the pet shows up as another species, in a fake-nose disguise. */
export function disguiseFor(state: PetState): string {
  return pick(seeded(`fools:${state.login}:${state.date}`), Object.keys(SPECIES).filter((id) => id !== state.species));
}

export interface Shown {
  art: Art;
  /** Every stylesheet the surprise needs. */
  css: string;
  /** The banner, drawn last so it sits on top of everything. */
  banner: string;
}

/**
 * Draws `surprise` for this card. What the pet can wear depends on where it is: nothing when
 * it's an egg or away, only costumes during a visitor's scene.
 */
export function showSurprise(surprise: Surprise, ctx: Ctx, where: "pet" | "egg" | "away" | "visit"): Shown {
  const draw = isHoliday(surprise)
    ? HOLIDAY_ART[surprise]
    : surprise === "postcard"
      ? postcard
      : surprise in MOMENT_ART
        ? MOMENT_ART[surprise as keyof typeof MOMENT_ART]
        : RARE_ART[surprise as keyof typeof RARE_ART];
  const art = { ...draw(ctx) };
  if (where !== "pet") {
    delete art.held;
    delete art.over;
    delete art.follow;
    delete art.bodyClass;
    delete art.crossed;
    delete art.replace;
    if (where !== "visit") {
      delete art.hat;
      delete art.face;
    }
  }
  return { art, css: `${KIT_CSS}${art.css ?? ""}`, banner: art.banner ? banner(art.banner, ctx.scene) : "" };
}
