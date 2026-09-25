/** `npm run examples` → regenerates the SVGs under examples/ that the README shows. */
import { mkdirSync, writeFileSync } from "node:fs";
import { demoState, MOODS, STAGES } from "../src/demo.js";
import { renderPetCard } from "../src/pet/render.js";
import { THEME_NAMES } from "../src/themes.js";

const out = new URL("../examples/", import.meta.url);
mkdirSync(out, { recursive: true });

const write = (name: string, svg: string) => writeFileSync(new URL(name, out), svg);

for (const mood of MOODS) write(`mood-${mood}.svg`, renderPetCard(demoState(mood, "adult")));
for (const stage of STAGES) write(`stage-${stage}.svg`, renderPetCard(demoState("happy", stage)));
for (const theme of THEME_NAMES) write(`theme-${theme}.svg`, renderPetCard(demoState("idle", "adult"), { theme }));

console.log(`Wrote ${MOODS.length + STAGES.length + THEME_NAMES.length} examples to examples/`);
