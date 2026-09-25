import { MOODS, STAGES } from "./demo.js";
import { getSpecies } from "./pet/species/index.js";
import type { Mood, Stage } from "./types.js";

export const LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
const MAX_NAME = 16;

export interface PetParams {
  theme?: string;
  hideBorder: boolean;
  petName: string;
  species: string;
  /** Only honoured for the demo user. */
  mood?: Mood;
  stage?: Stage;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/** The card options shared by the API (`/api/pet?...`) and the Action (`pet.svg?...`). */
export function parsePetParams(q: URLSearchParams): PetParams {
  const species = getSpecies(q.get("species") ?? undefined);
  return {
    theme: q.get("theme") ?? undefined,
    hideBorder: q.get("hide_border") === "true",
    petName: q.get("name")?.trim().slice(0, MAX_NAME) || species.defaultName,
    species: species.id,
    mood: oneOf<Mood>(q.get("mood"), MOODS),
    stage: oneOf<Stage>(q.get("stage"), STAGES),
  };
}
