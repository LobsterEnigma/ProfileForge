export interface Theme {
  bg: string;
  border: string;
  title: string;
  text: string;
  muted: string;
  accent: string;
  barEmpty: string;
  hp: string;
  exp: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
  groundDark: string;
  /** Opacity of the night-sky stars and moon: 0 by day, 1 at night. */
  stars: string;
  // Pixel city
  citySkyTop: string;
  citySkyBottom: string;
  cityText: string;
  cityMuted: string;
  bldg1: string;
  bldg2: string;
  bldg3: string;
  windowOn: string;
  windowAlt: string;
  windowOff: string;
  road: string;
  celestial: string;
}

const light: Theme = {
  bg: "#ffffff",
  border: "#d0d7de",
  title: "#1f2328",
  text: "#1f2328",
  muted: "#656d76",
  accent: "#cf4a1f",
  barEmpty: "#eaeef2",
  hp: "#2da44e",
  exp: "#0969da",
  skyTop: "#bfe3ff",
  skyBottom: "#fdf3dc",
  ground: "#f0d09a",
  groundDark: "#d6ae72",
  stars: "0",
  citySkyTop: "#4b5aa8",
  citySkyBottom: "#ffb38a",
  cityText: "#ffffff",
  cityMuted: "#e8e6ff",
  bldg1: "#2f3354",
  bldg2: "#3b4066",
  bldg3: "#262a45",
  windowOn: "#ffd166",
  windowAlt: "#ffe8a3",
  windowOff: "#4a5078",
  road: "#23263b",
  celestial: "#ff8a5c",
};

const dark: Theme = {
  bg: "#0d1117",
  border: "#30363d",
  title: "#e6edf3",
  text: "#e6edf3",
  muted: "#8d96a0",
  accent: "#ff8a5c",
  barEmpty: "#21262d",
  hp: "#3fb950",
  exp: "#58a6ff",
  skyTop: "#0a1630",
  skyBottom: "#23305a",
  ground: "#3d3526",
  groundDark: "#2b251b",
  stars: "1",
  citySkyTop: "#070f24",
  citySkyBottom: "#1f2c55",
  cityText: "#e6edf3",
  cityMuted: "#9fb0d0",
  bldg1: "#161d33",
  bldg2: "#1d2640",
  bldg3: "#121829",
  windowOn: "#ffd166",
  windowAlt: "#9ad1ff",
  windowOff: "#26304d",
  road: "#0e1322",
  celestial: "#f4f1de",
};

export const THEMES: Record<string, Theme | { light: Theme; dark: Theme }> = {
  auto: { light, dark },
  light,
  dark,
  dracula: {
    bg: "#282a36",
    border: "#44475a",
    title: "#f8f8f2",
    text: "#f8f8f2",
    muted: "#6272a4",
    accent: "#ff79c6",
    barEmpty: "#44475a",
    hp: "#50fa7b",
    exp: "#bd93f9",
    skyTop: "#191a23",
    skyBottom: "#3a3450",
    ground: "#44475a",
    groundDark: "#363848",
    stars: "1",
    citySkyTop: "#15161e",
    citySkyBottom: "#3a3450",
    cityText: "#f8f8f2",
    cityMuted: "#a4acd4",
    bldg1: "#383a4a",
    bldg2: "#44475a",
    bldg3: "#2e3040",
    windowOn: "#f1fa8c",
    windowAlt: "#8be9fd",
    windowOff: "#4d5066",
    road: "#21222c",
    celestial: "#f8f8f2",
  },
  gameboy: {
    bg: "#9bbc0f",
    border: "#306230",
    title: "#0f380f",
    text: "#0f380f",
    muted: "#306230",
    accent: "#0f380f",
    barEmpty: "#8bac0f",
    hp: "#306230",
    exp: "#0f380f",
    skyTop: "#8bac0f",
    skyBottom: "#9bbc0f",
    ground: "#306230",
    groundDark: "#0f380f",
    stars: "0",
    citySkyTop: "#8bac0f",
    citySkyBottom: "#9bbc0f",
    cityText: "#0f380f",
    cityMuted: "#306230",
    bldg1: "#306230",
    bldg2: "#0f380f",
    bldg3: "#306230",
    windowOn: "#9bbc0f",
    windowAlt: "#8bac0f",
    windowOff: "#0f380f",
    road: "#0f380f",
    celestial: "#306230",
  },
  sakura: {
    bg: "#fff6f8",
    border: "#ffd3de",
    title: "#5c2a3a",
    text: "#5c2a3a",
    muted: "#a0707e",
    accent: "#e2577c",
    barEmpty: "#ffe3ea",
    hp: "#e2577c",
    exp: "#a77cc6",
    skyTop: "#ffd9e4",
    skyBottom: "#fff6f8",
    ground: "#f5c3d2",
    groundDark: "#e6a2b7",
    stars: "0",
    citySkyTop: "#e88aab",
    citySkyBottom: "#ffe3ea",
    cityText: "#ffffff",
    cityMuted: "#fff0f4",
    bldg1: "#a85a78",
    bldg2: "#b86d8a",
    bldg3: "#944a67",
    windowOn: "#fff3b0",
    windowAlt: "#ffd6e4",
    windowOff: "#c98aa3",
    road: "#7d3d57",
    celestial: "#fff6f8",
  },
};

export const THEME_NAMES = Object.keys(THEMES);

function vars(t: Theme): string {
  return Object.entries(t)
    .map(([k, v]) => `--pf-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${v}`)
    .join(";");
}

/** CSS custom properties for the chosen theme, scoped to the root `.pf` element. */
export function themeCss(name: string | undefined): string {
  const theme = THEMES[name ?? "auto"] ?? THEMES.auto!;
  if ("light" in theme) {
    return `.pf{${vars(theme.light)}}@media (prefers-color-scheme:dark){.pf{${vars(theme.dark)}}}`;
  }
  return `.pf{${vars(theme)}}`;
}

/**
 * Themes that restyle sprites too. Game Boy maps every color by brightness onto its four
 * greens, so red crabs, yellow cranes and neon signs all fit the palette.
 */
const FILTERS: Record<string, string> = {
  gameboy: `<filter id="pf-theme" color-interpolation-filters="sRGB">
  <feColorMatrix type="matrix" values=".299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0"/>
  <feComponentTransfer>
    <feFuncR type="discrete" tableValues=".059 .188 .545 .608"/>
    <feFuncG type="discrete" tableValues=".22 .384 .675 .737"/>
    <feFuncB type="discrete" tableValues=".059 .188 .059 .059"/>
  </feComponentTransfer>
</filter>`,
};

/** The theme's sprite filter: `defs` goes in the SVG, `attr` on the group to recolor. */
export function themeFilter(name: string | undefined): { defs: string; attr: string } {
  const filter = name ? FILTERS[name] : undefined;
  return filter ? { defs: `<defs>${filter}</defs>`, attr: ` filter="url(#pf-theme)"` } : { defs: "", attr: "" };
}
