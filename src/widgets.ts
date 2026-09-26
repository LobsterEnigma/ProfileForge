import type { CareRules, CareState } from "./care/state.js";
import { applyCare } from "./care/view.js";
import { computeCityState } from "./city/state.js";
import { renderCityCard } from "./city/render.js";
import { demoProfile, demoState } from "./demo.js";
import type { PetParams } from "./options.js";
import { renderPetCard } from "./pet/render.js";
import { computePetState } from "./pet/state.js";
import type { GitHubProfile } from "./types.js";

const world = (p: PetParams) => ({ theme: p.theme, hideBorder: p.hideBorder, season: p.season, hemisphere: p.hemisphere });
const cityPet = (p: PetParams) => (p.showPet ? { petName: p.petName, species: p.species, runaway: p.runaway } : false as const);

/** Visitors' care, when the owner turned it on (Action only). */
export interface Care {
  state: CareState;
  now: Date;
  rules: CareRules;
}

/** Renders the widget `params.widget` asks for. Used by both the API and the Action. */
export function renderWidget(profile: GitHubProfile, params: PetParams, care?: Care): string {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") {
    const city = computeCityState(profile, cityPet(params));
    if (care && city.pet) city.pet = applyCare(city.pet, care.state, care.now, care.rules);
    return renderCityCard(city, { ...style, season: params.season, hemisphere: params.hemisphere });
  }
  const pet = computePetState(profile, { petName: params.petName, species: params.species, runaway: params.runaway });
  return renderPetCard(care ? applyCare(pet, care.state, care.now, care.rules) : pet, world(params));
}

/** `?user=demo`: made-up data, and the pet honours `mood` / `stage` overrides. */
export function renderDemo(params: PetParams): string {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") {
    return renderCityCard(computeCityState(demoProfile(), cityPet(params)), { ...style, season: params.season, hemisphere: params.hemisphere });
  }
  const extras = { trick: params.trick, away: params.away, visit: params.visit, dirt: params.dirt, surprise: params.surprise };
  return renderPetCard(demoState(params.mood, params.stage, params.petName, params.species, extras), world(params));
}
