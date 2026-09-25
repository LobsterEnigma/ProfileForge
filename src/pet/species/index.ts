import { chick } from "./chick.js";
import { crab } from "./crab.js";
import { elephant } from "./elephant.js";
import { gopher } from "./gopher.js";
import { snake } from "./snake.js";
import { turtle } from "./turtle.js";
import type { Species } from "./types.js";

export const SPECIES: Record<string, Species> = { crab, gopher, snake, elephant, chick, turtle };

/** Your top language picks your pet, unless you ask for one with `?species=`. */
const BY_LANGUAGE: Record<string, string> = {
  Rust: "crab",
  Go: "gopher",
  Python: "snake",
  "Jupyter Notebook": "snake",
  PHP: "elephant",
  JavaScript: "chick",
  TypeScript: "turtle",
};

export function speciesForLanguage(language: string | null): string {
  return (language && BY_LANGUAGE[language]) || "crab";
}

export function isSpecies(id: string | null | undefined): id is string {
  return !!id && Object.hasOwn(SPECIES, id);
}

export function getSpecies(id: string | undefined): Species {
  return isSpecies(id) ? SPECIES[id]! : crab;
}

export type { Species } from "./types.js";
