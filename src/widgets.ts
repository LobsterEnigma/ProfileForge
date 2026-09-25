import { computeCityState } from "./city/state.js";
import { renderCityCard } from "./city/render.js";
import { demoProfile, demoState } from "./demo.js";
import type { PetParams } from "./options.js";
import { renderPetCard } from "./pet/render.js";
import { computePetState } from "./pet/state.js";
import type { GitHubProfile } from "./types.js";

const cityPet = (p: PetParams) => (p.showPet ? { petName: p.petName, species: p.species } : false as const);

/** Renders the widget `params.widget` asks for. Used by both the API and the Action. */
export function renderWidget(profile: GitHubProfile, params: PetParams): string {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") return renderCityCard(computeCityState(profile, cityPet(params)), { ...style, season: params.season });
  return renderPetCard(computePetState(profile, { petName: params.petName, species: params.species }), style);
}

/** `?user=demo`: made-up data, and the pet honours `mood` / `stage` overrides. */
export function renderDemo(params: PetParams): string {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") {
    return renderCityCard(computeCityState(demoProfile(), cityPet(params)), { ...style, season: params.season });
  }
  return renderPetCard(demoState(params.mood, params.stage, params.petName, params.species), style);
}
