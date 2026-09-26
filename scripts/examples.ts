/** `npm run examples` → regenerates the SVGs under examples/ that the README shows. */
import { mkdirSync, writeFileSync } from "node:fs";
import { computeCityState } from "../src/city/state.js";
import { renderCityCard } from "../src/city/render.js";
import { SEASONS } from "../src/world/seasons.js";
import { demoProfile, demoState, MOODS, STAGES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { SPECIES } from "../src/pet/species/index.js";
import { THEME_NAMES } from "../src/themes.js";

const out = new URL("../examples/", import.meta.url);
mkdirSync(out, { recursive: true });

const write = (name: string, svg: string) => writeFileSync(new URL(name, out), svg);

for (const mood of MOODS) write(`mood-${mood}.svg`, renderPetCard(demoState(mood, "adult")));
for (const stage of STAGES) write(`stage-${stage}.svg`, renderPetCard(demoState("happy", stage)));
for (const theme of THEME_NAMES) write(`theme-${theme}.svg`, renderPetCard(demoState("idle", "adult"), { theme }));
for (const species of Object.keys(SPECIES)) write(`species-${species}.svg`, renderPetCard(demoState("happy", "adult", undefined, species)));
const surprises = [
  ["christmas", "crab"],
  ["lunar-new-year", "chick"],
  ["halloween", "gopher"],
  ["mid-autumn", "snake"],
  ["postcard", "turtle"],
  ["birthday", "elephant"],
] as const;
for (const [surprise, species] of surprises) write(`surprise-${surprise}.svg`, renderPetCard(demoState("idle", "adult", undefined, species, { surprise })));

const city = computeCityState(demoProfile());
write("city.svg", renderCityCard(city));
for (const theme of ["light", "dark", "sakura", "gameboy"]) write(`city-${theme}.svg`, renderCityCard(city, { theme }));
for (const season of SEASONS) write(`city-${season}.svg`, renderCityCard(city, { season }));

console.log("Wrote examples to examples/");
