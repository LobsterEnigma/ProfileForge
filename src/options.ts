import { SEASONS, type Season } from "./city/seasons.js";
import { MOODS, STAGES } from "./demo.js";
import { isSpecies } from "./pet/species/index.js";
import type { Mood, Stage } from "./types.js";

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
  /** City only: overrides the date-based season (e.g. for the southern hemisphere). */
  season?: Season;
  /** Only honoured for the demo user. */
  mood?: Mood;
  stage?: Stage;
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
    season: oneOf<Season>(q.get("season"), SEASONS),
    mood: oneOf<Mood>(q.get("mood"), MOODS),
    stage: oneOf<Stage>(q.get("stage"), STAGES),
  };
}
