import { crab } from "./crab.js";
import type { Species } from "./types.js";

export const SPECIES: Record<string, Species> = { crab };

export function getSpecies(id: string | undefined): Species {
  return (id && SPECIES[id]) || crab;
}

export type { Species } from "./types.js";
