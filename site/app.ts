/**
 * The configurator: renders previews with the real widget code, right in the browser,
 * and writes the workflow and README snippets for the chosen options.
 */
import { renderCityCard } from "../src/city/render.js";
import { computeCityState, type CityState } from "../src/city/state.js";
import { demoProfile, demoState } from "../src/demo.js";
import { classForLanguage } from "../src/pet/classes.js";
import { renderPetCard } from "../src/pet/render.js";
import { speciesForLanguage } from "../src/pet/species/index.js";
import { renderPetSprite, SPRITE_CSS } from "../src/pet/sprite.js";
import type { Mood, Stage } from "../src/types.js";
import type { Hemisphere, Season } from "../src/world/seasons.js";

const REPO = "LobsterEnigma/ProfileForge";
const FOLDER = "profileforge";

const LANGUAGE_COLORS: Record<string, string> = {
  Rust: "#dea584",
  Go: "#00ADD8",
  Python: "#3572A5",
  PHP: "#4F5D95",
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
};

const form = document.getElementById("form") as HTMLFormElement;
const field = <T extends HTMLElement = HTMLInputElement>(name: string) => form.elements.namedItem(name) as unknown as T;

interface Config {
  pet: boolean;
  city: boolean;
  name: string;
  species: string;
  cityPet: boolean;
  theme: string;
  season: string;
  hemisphere: string;
  hideBorder: boolean;
  login: string;
  language: string;
  stage: Stage;
  activity: Mood;
  holiday: string;
}

function read(): Config {
  const value = (name: string) => field<HTMLInputElement | HTMLSelectElement>(name).value;
  const checked = (name: string) => field(name).checked;
  return {
    pet: checked("pet"),
    city: checked("city"),
    name: value("name").trim(),
    species: value("species"),
    cityPet: checked("cityPet"),
    theme: value("theme"),
    season: value("season"),
    hemisphere: value("hemisphere"),
    hideBorder: checked("hideBorder"),
    login: value("login").trim(),
    language: value("language"),
    stage: value("stage") as Stage,
    activity: value("activity") as Mood,
    holiday: value("holiday"),
  };
}

// ── Previews ─────────────────────────────────────────────────────────────────

const urls = new Map<string, string>();

/** Shows an SVG through <img>, exactly how GitHub displays it (no scripts, isolated styles). */
function show(img: HTMLImageElement, svg: string): void {
  const previous = urls.get(img.id);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  urls.set(img.id, url);
  img.src = url;
}

const ACTIVITY: Record<Mood, Partial<CityState>> = {
  happy: {},
  idle: { currentStreak: 1, daysSinceLastContribution: 1 },
  hungry: { currentStreak: 0, daysSinceLastContribution: 6, activeDays14: 3 },
  sleeping: { currentStreak: 0, daysSinceLastContribution: 20, activeDays14: 0 },
};

function renderPreviews(c: Config): void {
  const species = c.species || speciesForLanguage(c.language);
  const style = {
    theme: c.theme,
    hideBorder: c.hideBorder,
    season: (c.season || undefined) as Season | undefined,
    hemisphere: c.hemisphere as Hemisphere,
  };
  const language = { topLanguage: c.language, className: classForLanguage(c.language) };

  const pet = { ...demoState(c.activity, c.stage, c.name || undefined, species), ...language };
  if (c.holiday) pet.date = c.holiday;
  document.getElementById("pet-figure")!.hidden = !c.pet;
  if (c.pet) show(document.getElementById("pet-img") as HTMLImageElement, renderPetCard(pet, style));

  document.getElementById("city-figure")!.hidden = !c.city;
  if (c.city) {
    const base = computeCityState(demoProfile());
    const city: CityState = {
      ...base,
      ...ACTIVITY[c.activity],
      date: c.holiday || base.date,
      topLanguage: { name: c.language, color: LANGUAGE_COLORS[c.language] ?? null, bytes: 1 },
      pet: c.cityPet ? pet : null,
    };
    show(document.getElementById("city-img") as HTMLImageElement, renderCityCard(city, style));
  }
}

// ── Snippets ─────────────────────────────────────────────────────────────────

function query(params: [string, string | false | undefined][]): string {
  const q = params.filter((p): p is [string, string] => !!p[1]).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return q.length ? `?${q.join("&")}` : "";
}

function shared(c: Config): [string, string | false | undefined][] {
  return [
    ["theme", c.theme !== "auto" && c.theme],
    ["hide_border", c.hideBorder && "true"],
    ["season", c.season],
    ["hemisphere", c.hemisphere === "south" && "south"],
  ];
}

const petQuery = (c: Config) => query([["name", c.name], ["species", c.species], ...shared(c)]);
const cityQuery = (c: Config, widget: boolean) =>
  query([
    ["widget", widget && "city"],
    ["species", c.cityPet && c.species],
    ["pet", !c.cityPet && "false"],
    ...shared(c),
  ]);

function workflow(c: Config): string {
  const outputs = [
    c.pet && `            ${FOLDER}/pet.svg${petQuery(c)}`,
    c.city && `            ${FOLDER}/city.svg${cityQuery(c, true)}`,
  ].filter(Boolean);
  return `name: ProfileForge

on:
  schedule:
    - cron: "0 */6 * * *" # every 6 hours
  workflow_dispatch:

permissions:
  contents: write

jobs:
  forge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ${REPO}@v1
        with:
          outputs: |
${outputs.join("\n")}`;
}

function readme(c: Config): string {
  return [
    c.pet && `![My ProfileForge pet](./${FOLDER}/pet.svg)`,
    c.city && `![My ProfileForge city](./${FOLDER}/city.svg)`,
  ]
    .filter(Boolean)
    .join("\n");
}

function api(c: Config): string {
  const user = `user=${encodeURIComponent(c.login || "your-login")}`;
  const withUser = (q: string) => (q ? `?${user}&${q.slice(1)}` : `?${user}`);
  return [
    c.pet && `![My ProfileForge pet](https://your-app.vercel.app/api/pet${withUser(petQuery(c))})`,
    c.city && `![My ProfileForge city](https://your-app.vercel.app/api/city${withUser(cityQuery(c, false))})`,
  ]
    .filter(Boolean)
    .join("\n");
}

const TABS = {
  action: {
    hint: "Save this as .github/workflows/profileforge.yml in your profile repo (the one named after you), then run it once from the Actions tab.",
    code: workflow,
  },
  readme: { hint: "Then add this to the README.md of the same repo.", code: readme },
  api: {
    hint: "Prefer a hosted API? Deploy your own with the Deploy with Vercel button in the project README, then use:",
    code: api,
  },
} as const;
type Tab = keyof typeof TABS;
let tab: Tab = "action";

function renderCode(c: Config): void {
  const none = !c.pet && !c.city;
  document.getElementById("code-hint")!.textContent = none ? "Pick at least one widget." : TABS[tab].hint;
  document.getElementById("code")!.textContent = none ? "" : TABS[tab].code(c);
}

// ── Wiring ───────────────────────────────────────────────────────────────────

/** The config lives in the URL hash, so a setup can be shared as a link. */
function save(c: Config): void {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(c)) params.set(k, String(v));
  history.replaceState(null, "", `#${params}`);
}

function restore(): void {
  const params = new URLSearchParams(location.hash.slice(1));
  for (const [k, v] of params) {
    const el = form.elements.namedItem(k);
    if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = v === "true";
    else if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.value = v;
  }
}

function update(): void {
  const c = read();
  field<HTMLInputElement>("cityPet").disabled = !c.city;
  renderPreviews(c);
  renderCode(c);
  save(c);
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-tab]")) {
  button.addEventListener("click", () => {
    tab = button.dataset.tab as Tab;
    for (const b of document.querySelectorAll("[data-tab]")) b.setAttribute("aria-selected", String(b === button));
    renderCode(read());
  });
}

const copy = document.getElementById("copy") as HTMLButtonElement;
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById("code")!.textContent ?? "");
    copy.textContent = "Copied!";
  } catch {
    copy.textContent = "Select and copy manually";
  }
  setTimeout(() => (copy.textContent = "Copy"), 1600);
});

form.addEventListener("input", update);
form.addEventListener("submit", (e) => e.preventDefault());

// A happy little crab for the logo.
const logo = renderPetSprite(demoState("happy", "adult"), 3);
show(
  document.getElementById("logo") as HTMLImageElement,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${logo.width}" height="${logo.height}" viewBox="0 0 ${logo.width} ${logo.height}"><style>${SPRITE_CSS}</style>${logo.svg}</svg>`,
);

restore();
update();
