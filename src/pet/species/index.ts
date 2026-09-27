import { capybara } from "./capybara.js";
import { chick } from "./chick.js";
import { crab } from "./crab.js";
import { elephant } from "./elephant.js";
import { fox } from "./fox.js";
import { gopher } from "./gopher.js";
import { hedgehog } from "./hedgehog.js";
import { octopus } from "./octopus.js";
import { otter } from "./otter.js";
import { snail } from "./snail.js";
import { snake } from "./snake.js";
import { squid } from "./squid.js";
import { swift } from "./swift.js";
import { turtle } from "./turtle.js";
import type { Species } from "./types.js";

export const SPECIES: Record<string, Species> = { crab, gopher, snake, elephant, chick, turtle, capybara, hedgehog, octopus, snail, fox, swift, squid, otter };

/** Your top language picks your pet, unless you ask for one with `?species=`. */
const BY_LANGUAGE: Record<string, string> = {
  Rust: "crab",
  Go: "gopher",
  Python: "snake",
  "Jupyter Notebook": "snake",
  PHP: "elephant",
  JavaScript: "chick",
  TypeScript: "turtle",
  // The JVM crowd: calm, reliable, a coffee in hand.
  Java: "capybara",
  Scala: "capybara",
  Groovy: "capybara",
  // Java's nimble modern cousin.
  Kotlin: "otter",
  // C sharp: all spikes.
  "C#": "hedgehog",
  "F#": "hedgehog",
  // A hand for every pointer.
  C: "octopus",
  // C, plus two: eight arms and two tentacles.
  "C++": "squid",
  // It carries its own shell.
  Shell: "snail",
  PowerShell: "snail",
  Batchfile: "snail",
  Ruby: "fox",
  Swift: "swift",
  "Objective-C": "swift",
};

export function speciesForLanguage(language: string | null): string {
  return language && Object.hasOwn(BY_LANGUAGE, language) ? BY_LANGUAGE[language]! : "crab";
}

export function isSpecies(id: string | null | undefined): id is string {
  return !!id && Object.hasOwn(SPECIES, id);
}

export function getSpecies(id: string | undefined): Species {
  return isSpecies(id) ? SPECIES[id]! : crab;
}

export type { Species } from "./types.js";
