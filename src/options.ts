import { HEMISPHERES, SEASONS, type Hemisphere, type Season } from "./world/seasons.js";
import { MOODS, STAGES } from "./demo.js";
import { CARE_ACTIONS, type CareAction } from "./care/commands.js";
import { TRICKS } from "./pet/behavior.js";
import { isSpecies } from "./pet/species/index.js";
import { SURPRISES, type Mood, type Stage, type Surprise, type Trick } from "./types.js";

export const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const MAX_NAME = 16;

export const WIDGETS = ["pet", "city"] as const;
export type Widget = (typeof WIDGETS)[number];

export interface PetParams {
  widget: Widget;
  theme?: string;
  hideBorder: boolean;
  /** Defaults to the species' own name. */
  petName?: string;
  /** Defaults to the species for the user's top language. */
  species?: string;
  /** City only: `?pet=false` keeps your pet off the streets. */
  showPet: boolean;
  /** `?runaway=false` keeps the pet home after a month without contributions. */
  runaway: boolean;
  /** City only: pins a season instead of following the date. */
  season?: Season;
  /** City only: `south` flips the date-based seasons and the moon. */
  hemisphere?: Hemisphere;
  /** Only honoured for the demo user. */
  mood?: Mood;
  stage?: Stage;
  trick?: Trick;
  away?: boolean;
  visit?: CareAction | "all";
  dirt?: 0 | 1 | 2 | 3;
  surprise?: Surprise;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** The card options shared by the API (`/api/pet?...`) and the Action (`pet.svg?...`). */
export function parsePetParams(q: URLSearchParams): PetParams {
  const species = q.get("species");
  return {
    widget: oneOf<Widget>(q.get("widget"), WIDGETS) ?? "pet",
    theme: q.get("theme") ?? undefined,
    hideBorder: q.get("hide_border") === "true",
    petName: q.get("name")?.trim().slice(0, MAX_NAME) || undefined,
    species: isSpecies(species) ? species : undefined,
    showPet: q.get("pet") !== "false",
    runaway: q.get("runaway") !== "false",
    season: oneOf<Season>(q.get("season"), SEASONS),
    hemisphere: oneOf<Hemisphere>(q.get("hemisphere"), HEMISPHERES),
    mood: oneOf<Mood>(q.get("mood"), MOODS),
    stage: oneOf<Stage>(q.get("stage"), STAGES),
    trick: oneOf<Trick>(q.get("trick"), TRICKS),
    away: q.get("away") === "true",
    visit: oneOf<CareAction | "all">(q.get("visit"), [...CARE_ACTIONS, "all"]),
    surprise: oneOf<Surprise>(q.get("surprise"), SURPRISES),
    dirt: oneOf(q.get("dirt"), ["0", "1", "2", "3"] as const) ? (Number(q.get("dirt")) as 0 | 1 | 2 | 3) : undefined,
  };
}
