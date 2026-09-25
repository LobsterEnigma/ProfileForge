// src/action/main.ts
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative as relative2 } from "node:path";

// src/pet/classes.ts
var CLASS_BY_LANGUAGE = {
  Rust: "Berserker",
  Go: "Ranger",
  Python: "Summoner",
  JavaScript: "Trickster",
  TypeScript: "Knight",
  Java: "Guardian",
  Kotlin: "Duelist",
  C: "Monk",
  "C++": "Warlord",
  "C#": "Templar",
  Haskell: "Archmage",
  OCaml: "Sage",
  Scala: "Sorcerer",
  Elixir: "Alchemist",
  Erlang: "Oracle",
  Clojure: "Mystic",
  Ruby: "Enchanter",
  PHP: "Veteran",
  Swift: "Assassin",
  "Objective-C": "Old Guard",
  Dart: "Dancer",
  Lua: "Druid",
  Zig: "Artificer",
  Nim: "Wanderer",
  Julia: "Astrologer",
  R: "Seer",
  "Jupyter Notebook": "Scholar",
  Shell: "Necromancer",
  PowerShell: "Warlock",
  Nix: "Hermit",
  Vue: "Illusionist",
  Svelte: "Illusionist",
  HTML: "Bard",
  CSS: "Bard",
  SCSS: "Bard",
  Solidity: "Merchant",
  Assembly: "Titan",
  "Vim Script": "Ascetic",
  "Emacs Lisp": "Ascetic"
};
function classForLanguage(language) {
  if (!language) return "Adventurer";
  return CLASS_BY_LANGUAGE[language] ?? "Adventurer";
}

// src/pet/state.ts
var MAX_LEVEL = 99;
function xpForLevel(level) {
  return 5 * (level - 1) ** 2;
}
function levelForXp(xp) {
  return Math.min(MAX_LEVEL, Math.floor(1 + Math.sqrt(Math.max(0, xp) / 5)));
}
function stageForLevel(level) {
  if (level < 3) return "egg";
  if (level < 15) return "baby";
  if (level < 50) return "adult";
  return "legendary";
}
function currentStreak(calendar) {
  let i = calendar.length - 1;
  if (i >= 0 && calendar[i].count === 0) i--;
  let streak = 0;
  for (; i >= 0 && calendar[i].count > 0; i--) streak++;
  return streak;
}
function daysSinceLastContribution(calendar) {
  for (let i = calendar.length - 1; i >= 0; i--) {
    if (calendar[i].count > 0) return calendar.length - 1 - i;
  }
  return calendar.length;
}
function lastDays(calendar, n) {
  return calendar.slice(Math.max(0, calendar.length - n));
}
function moodFor(calendar) {
  const idle = daysSinceLastContribution(calendar);
  if (idle >= 14) return "sleeping";
  if (idle >= 4) return "hungry";
  const week = lastDays(calendar, 7).reduce((sum, d) => sum + d.count, 0);
  if (currentStreak(calendar) >= 3 || week >= 15) return "happy";
  return "idle";
}
function statFor(value) {
  return Math.max(1, Math.min(99, Math.round(25 * Math.log10(Math.max(0, value) + 1))));
}
var DEFAULT_SPECIES = "crab";
function computePetState(profile, options = {}) {
  const xp = profile.lifetimeContributions + profile.totalStars * 2 + profile.followers * 3;
  const level = levelForXp(xp);
  const topLanguage = profile.languages[0]?.name ?? null;
  const stats = {
    str: statFor(profile.commits),
    int: statFor(profile.pullRequests + profile.reviews),
    cha: statFor(profile.totalStars + profile.followers),
    dex: statFor(profile.issues)
  };
  return {
    login: profile.login,
    petName: options.petName ?? "Pinchy",
    species: options.species ?? DEFAULT_SPECIES,
    level,
    stage: stageForLevel(level),
    className: classForLanguage(topLanguage),
    topLanguage,
    mood: moodFor(profile.calendar),
    xp,
    xpLevelStart: xpForLevel(level),
    xpNextLevel: xpForLevel(Math.min(level + 1, MAX_LEVEL)),
    activeDays14: lastDays(profile.calendar, 14).filter((d) => d.count > 0).length,
    streak: currentStreak(profile.calendar),
    daysSinceLastContribution: daysSinceLastContribution(profile.calendar),
    stats
  };
}

// src/demo.ts
var MOODS = ["happy", "idle", "hungry", "sleeping"];
var STAGES = ["egg", "baby", "adult", "legendary"];

// src/svg/pixel.ts
var layer = (x, y, grid) => ({ x, y, grid });
function mirror(grid) {
  return grid.map((row) => [...row].reverse().join(""));
}
function fillAttr(color) {
  return color.startsWith("var(") ? `style="fill:${color}"` : `fill="${color}"`;
}
function renderPixels(layers, palette, { x = 0, y = 0, scale }) {
  const paths = /* @__PURE__ */ new Map();
  for (const l of layers) {
    l.grid.forEach((row, ry) => {
      let cx = 0;
      while (cx < row.length) {
        const ch = row[cx];
        let run = 1;
        while (row[cx + run] === ch) run++;
        if (ch !== "." && ch !== " ") {
          const color = palette[ch];
          if (color === void 0) throw new Error(`Pixel "${ch}" has no palette entry`);
          const px = x + (l.x + cx) * scale;
          const py = y + (l.y + ry) * scale;
          const segs = paths.get(color) ?? [];
          segs.push(`M${px} ${py}h${run * scale}v${scale}h${-run * scale}z`);
          paths.set(color, segs);
        }
        cx += run;
      }
    });
  }
  return [...paths].map(([color, segs]) => `<path ${fillAttr(color)} d="${segs.join("")}"/>`).join("");
}

// src/pet/species/crab.ts
var BODY = [
  "..oooooooo..",
  ".orhhrrrrro.",
  "orhrrrrrrrro",
  "orrrrrrrrrro",
  ".oddrrrrddo.",
  "..oooooooo.."
];
var EYE_OPEN = ["oooo", "owko", "owwo", "oooo"];
var EYE_HAPPY = ["oooo", "okwo", "okko", "oooo"];
var EYE_SAD = ["....", "oooo", "owko", "oooo"];
var EYE_TUCKED = [".oo.", "orro", "oooo"];
var CLAW_OPEN = ["oo.oo", "oh.ro", "ohrro", "orrro", ".ooo."];
var CLAW_SHUT = [".ooo.", "ohrro", "orrro", "orrro", ".ooo."];
var LEGS_A = [
  "..o.o..........o.o..",
  ".o..o..........o..o."
];
var LEGS_B = [
  "...oo..........oo...",
  "..o..o........o..o.."
];
var STALKS = [layer(7, 4, ["o", "o"]), layer(12, 4, ["o", "o"])];
var eyes = (grid) => [layer(5, 0, grid), layer(11, 0, grid), ...STALKS];
var claws = (grid, y) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var ARMS = [layer(4, 6, ["o"]), layer(15, 6, ["o"])];
var legs = (grid) => [layer(0, 11, grid)];
var clawsUp = (grid) => [...claws(grid, 1), ...ARMS];
var clawsDown = (grid) => claws(grid, 4);
var crab = {
  id: "crab",
  defaultName: "Pinchy",
  width: 20,
  height: 13,
  palette: {
    o: "#4a1c14",
    r: "#e8553a",
    h: "#ff9a76",
    d: "#b53a24",
    w: "#ffffff",
    k: "#1a1a1a",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a"
  },
  body: [layer(4, 6, BODY)],
  eyes: {
    open: eyes(EYE_OPEN),
    closed: [layer(5, 3, EYE_TUCKED), layer(11, 3, EYE_TUCKED)],
    happy: eyes(EYE_HAPPY),
    sad: eyes(EYE_SAD)
  },
  mouths: {
    smile: [layer(8, 8, ["o..o", ".oo."])],
    neutral: [layer(8, 8, ["....", ".oo."])],
    frown: [layer(8, 8, [".oo.", "o..o"])]
  },
  blush: [layer(5, 9, ["pp"]), layer(13, 9, ["pp"])],
  limbs: {
    // Snapping claws while bouncing around.
    happy: [
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsUp(CLAW_SHUT), ...legs(LEGS_A)]
    ],
    // Scuttling sideways, like a proper crab.
    idle: [
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsUp(CLAW_OPEN), ...legs(LEGS_B)]
    ],
    hungry: [
      [...clawsDown(CLAW_OPEN), ...legs(LEGS_A)],
      [...clawsDown(CLAW_OPEN), ...legs(LEGS_A)]
    ],
    sleeping: [
      [...clawsDown(CLAW_SHUT), ...legs(LEGS_A)],
      [...clawsDown(CLAW_SHUT), ...legs(LEGS_A)]
    ]
  },
  crownAnchor: { x: 10, y: 0 }
};

// src/pet/species/index.ts
var SPECIES = { crab };
function getSpecies(id) {
  return id && SPECIES[id] || crab;
}

// src/options.ts
var LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
var MAX_NAME = 16;
function oneOf(value, allowed) {
  return allowed.includes(value) ? value : void 0;
}
function parsePetParams(q) {
  const species = getSpecies(q.get("species") ?? void 0);
  return {
    theme: q.get("theme") ?? void 0,
    hideBorder: q.get("hide_border") === "true",
    petName: q.get("name")?.trim().slice(0, MAX_NAME) || species.defaultName,
    species: species.id,
    mood: oneOf(q.get("mood"), MOODS),
    stage: oneOf(q.get("stage"), STAGES)
  };
}

// src/action/generate.ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

// src/github/fetch.ts
var ENDPOINT = "https://api.github.com/graphql";
var GitHubError = class extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind;
  }
  kind;
};
var PROFILE_QUERY = (
  /* GraphQL */
  `
  query Profile($login: String!) {
    user(login: $login) {
      login
      name
      followers { totalCount }
      contributionsCollection {
        contributionYears
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`
);
async function graphql(token, query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "ProfileForge"
    },
    body: JSON.stringify({ query, variables })
  });
  if (res.status === 401) throw new GitHubError("GitHub token is invalid", "auth");
  if (res.status === 403 || res.status === 429) throw new GitHubError("GitHub API rate limit hit", "rate_limited");
  if (!res.ok) throw new GitHubError(`GitHub API responded ${res.status}`, "upstream");
  const body = await res.json();
  if (body.errors?.length) {
    const first = body.errors[0];
    if (first.type === "NOT_FOUND") throw new GitHubError("User not found", "not_found");
    if (first.type === "RATE_LIMITED") throw new GitHubError("GitHub API rate limit hit", "rate_limited");
    throw new GitHubError(first.message, "upstream");
  }
  if (!body.data) throw new GitHubError("Empty response from GitHub", "upstream");
  return body.data;
}
async function fetchLifetimeContributions(token, login, years) {
  if (years.length === 0) return 0;
  const fields = years.map(
    (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`
  ).join("\n");
  const query = `query Lifetime($login: String!) { user(login: $login) { ${fields} } }`;
  const data = await graphql(
    token,
    query,
    { login }
  );
  return Object.values(data.user).reduce((sum, c) => sum + c.contributionCalendar.totalContributions, 0);
}
function aggregateLanguages(repos) {
  const byName = /* @__PURE__ */ new Map();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const entry = byName.get(node.name) ?? { name: node.name, color: node.color, bytes: 0 };
      entry.bytes += size;
      byName.set(node.name, entry);
    }
  }
  return [...byName.values()].sort((a, b) => b.bytes - a.bytes);
}
async function fetchProfile(login, token) {
  const { user } = await graphql(token, PROFILE_QUERY, { login });
  if (!user) throw new GitHubError("User not found", "not_found");
  const cc = user.contributionsCollection;
  const calendar = cc.contributionCalendar.weeks.flatMap(
    (w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  );
  const repos = user.repositories.nodes;
  return {
    login: user.login,
    name: user.name,
    followers: user.followers.totalCount,
    totalStars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    lifetimeContributions: await fetchLifetimeContributions(token, user.login, cc.contributionYears),
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    reviews: cc.totalPullRequestReviewContributions,
    issues: cc.totalIssueContributions,
    calendar,
    languages: aggregateLanguages(repos)
  };
}

// src/svg/escape.ts
var ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function escapeXml(text) {
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// src/themes.ts
var light = {
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
  stars: "0"
};
var dark = {
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
  stars: "1"
};
var THEMES = {
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
    stars: "1"
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
    stars: "0"
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
    stars: "0"
  }
};
var THEME_NAMES = Object.keys(THEMES);
function vars(t) {
  return Object.entries(t).map(([k, v]) => `--pf-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${v}`).join(";");
}
function themeCss(name) {
  const theme = THEMES[name ?? "auto"] ?? THEMES.auto;
  if ("light" in theme) {
    return `.pf{${vars(theme.light)}}@media (prefers-color-scheme:dark){.pf{${vars(theme.dark)}}}`;
  }
  return `.pf{${vars(theme)}}`;
}

// src/pet/sprites.ts
var EGG = [
  "...oooo...",
  "..occcco..",
  ".occsscco.",
  ".occcccco.",
  "occcccccso",
  "occcccccco",
  "ocssccccco",
  "ocsscccceo",
  "oeccccccco",
  ".oeccccco.",
  "..oeeeeo..",
  "...oooo..."
];
var EGG_CRACK = [
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..x.x.....",
  "...x.x.x..",
  ".........."
];
var EGG_PALETTE = {
  o: "#5b4636",
  c: "#fbf3e4",
  e: "#e0cfb1",
  s: "#7fc8a9",
  x: "#5b4636"
};
var CROWN = [
  "y..y..y",
  "yy.y.yy",
  "yyyyyyy",
  "ygyyygy",
  "YYYYYYY"
];
var HEART = ["pp.pp", "ppppp", ".ppp.", "..p.."];
var ZED = ["zzz", "..z", ".z.", "z..", "zzz"];
var SPARKLE = ["..s..", "..s..", "sssss", "..s..", "..s.."];
var COMMIT = ["gggg", "gGGg", "gGGg", "gggg"];
var FX_PALETTE = {
  y: "#ffd54a",
  Y: "#c99a1a",
  g: "#216e39",
  G: "#40c463",
  p: "#ff5c7a",
  s: "#fff3a0",
  z: "var(--pf-muted)"
};

// src/pet/render.ts
var W = 480;
var H = 190;
var SCENE = { x: 12, y: 12, w: 200, h: 166 };
var GROUND_Y = SCENE.y + SCENE.h - 34;
var PANEL_X = 230;
var PANEL_RIGHT = W - 16;
var SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
var FACE = {
  happy: { eyes: "happy", mouth: "smile", blush: true },
  idle: { eyes: "open", mouth: "smile", blush: false },
  hungry: { eyes: "sad", mouth: "frown", blush: false },
  sleeping: { eyes: "closed", mouth: "neutral", blush: false }
};
var FRAME_SPEED = { happy: 0.3, idle: 0.24, hungry: 1, sleeping: 1 };
var CSS = `
.pf-fa{animation:pf-a 1s steps(1) infinite}
.pf-fb{opacity:0;animation:pf-b 1s steps(1) infinite}
@keyframes pf-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.pf-blink-open{animation:pf-blink-open 4.2s steps(1) infinite}
.pf-blink-shut{opacity:0;animation:pf-blink-shut 4.2s steps(1) infinite}
@keyframes pf-blink-open{0%{opacity:1}94%{opacity:0}98%{opacity:1}100%{opacity:1}}
@keyframes pf-blink-shut{0%{opacity:0}94%{opacity:1}98%{opacity:0}100%{opacity:0}}
.pf-walk{animation:pf-walk 9s ease-in-out infinite}
@keyframes pf-walk{0%,100%{transform:translateX(-34px)}40%,50%{transform:translateX(34px)}90%{transform:translateX(-34px)}}
.pf-jump{animation:pf-jump .9s ease-in-out infinite}
@keyframes pf-jump{0%,70%,100%{transform:translateY(0)}10%{transform:translateY(2px)}40%{transform:translateY(-16px)}}
.pf-shadow{transform-box:fill-box;transform-origin:center}
.pf-jump-shadow{animation:pf-jump-shadow .9s ease-in-out infinite}
@keyframes pf-jump-shadow{0%,70%,100%{transform:scaleX(1);opacity:.35}40%{transform:scaleX(.55);opacity:.15}}
.pf-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:pf-breathe 3.2s ease-in-out infinite}
@keyframes pf-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.93)}}
.pf-shiver{animation:pf-shiver 2.6s linear infinite}
@keyframes pf-shiver{0%,60%,80%,100%{transform:translateX(0)}64%,72%{transform:translateX(-2px)}68%,76%{transform:translateX(2px)}}
.pf-wobble{transform-box:fill-box;transform-origin:50% 100%;animation:pf-wobble 2.4s ease-in-out infinite}
@keyframes pf-wobble{0%,55%,100%{transform:rotate(0)}65%{transform:rotate(-9deg)}75%{transform:rotate(8deg)}85%{transform:rotate(-4deg)}92%{transform:rotate(2deg)}}
.pf-rise{animation:pf-rise 2.7s ease-out infinite}
@keyframes pf-rise{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(8px,-38px);opacity:0}}
.pf-bob{animation:pf-bob 2s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 1.8s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.15;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
.pf-star{opacity:var(--pf-stars)}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;
var round = (n) => Math.round(n * 100) / 100;
function compact(n) {
  if (n < 1e3) return String(n);
  if (n < 1e4) return `${round(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1e6) return `${Math.round(n / 1e3)}k`;
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
}
function frames(a, b, seconds) {
  if (a === b) return a;
  const style = `style="animation-duration:${seconds * 2}s"`;
  return `<g class="pf-fa" ${style}>${a}</g><g class="pf-fb" ${style}>${b}</g>`;
}
var STARS = [
  [28, 26, 0],
  [62, 44, 0.7],
  [96, 22, 1.3],
  [138, 38, 0.4],
  [178, 24, 1.1],
  [196, 56, 0.2],
  [44, 70, 1.5]
];
function scene() {
  const { x, y, w, h } = SCENE;
  const stars = STARS.map(
    ([sx, sy, delay]) => `<rect class="pf-twinkle" style="animation-delay:-${delay}s" x="${sx}" y="${sy}" width="3" height="3" fill="#fff"/>`
  ).join("");
  let bumps = "";
  for (let bx = x; bx < x + w; bx += 16) bumps += `M${bx} ${GROUND_Y}h8v-3h-8z`;
  const pebbles = [
    [x + 22, GROUND_Y + 14],
    [x + 150, GROUND_Y + 20],
    [x + 96, GROUND_Y + 24],
    [x + 176, GROUND_Y + 10]
  ].map(([px, py]) => `<rect x="${px}" y="${py}" width="6" height="4" style="fill:var(--pf-ground-dark)"/>`).join("");
  return `
<defs>
  <clipPath id="pf-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-sky-bottom)"/>
  </linearGradient>
</defs>
<g clip-path="url(#pf-clip)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pf-sky)"/>
  <g class="pf-star">${stars}</g>
  <rect x="${x}" y="${GROUND_Y}" width="${w}" height="${y + h - GROUND_Y}" style="fill:var(--pf-ground)"/>
  <path d="${bumps}" style="fill:var(--pf-ground)"/>
  ${pebbles}`;
}
function positionFor(widthPx, heightPx, scale) {
  return {
    x: SCENE.x + SCENE.w / 2 - widthPx / 2,
    y: GROUND_Y - heightPx + scale,
    w: widthPx,
    h: heightPx
  };
}
function shadow(box, mood) {
  const cls = mood === "happy" ? "pf-shadow pf-jump-shadow" : "pf-shadow";
  const sw = box.w * 0.8;
  return `<rect class="${cls}" x="${box.x + (box.w - sw) / 2}" y="${box.y + box.h - 2}" width="${sw}" height="6" rx="3" opacity=".35" style="fill:var(--pf-ground-dark)"/>`;
}
function motionClass(mood) {
  switch (mood) {
    case "happy":
      return { outer: "", inner: "pf-jump" };
    case "idle":
      return { outer: "pf-walk", inner: "" };
    case "hungry":
      return { outer: "", inner: "pf-shiver" };
    case "sleeping":
      return { outer: "", inner: "pf-breathe" };
  }
}
function creature(state) {
  const species = getSpecies(state.species);
  const scale = state.stage === "baby" ? 3 : 4;
  const box = positionFor(species.width * scale, species.height * scale, scale);
  const legendary = state.stage === "legendary";
  const palette = legendary ? { ...species.palette, ...species.legendaryPalette } : species.palette;
  const px = (layers) => renderPixels(layers, palette, { scale });
  const face = FACE[state.mood];
  const [limbA, limbB] = species.limbs[state.mood];
  const eyes2 = state.mood === "idle" ? `<g class="pf-blink-open">${px(species.eyes.open)}</g><g class="pf-blink-shut">${px(species.eyes.closed)}</g>` : px(species.eyes[face.eyes]);
  let crown = "";
  if (legendary) {
    const cs = 3;
    const cx = species.crownAnchor.x * scale - CROWN[0].length * cs / 2;
    const cy = species.crownAnchor.y * scale - CROWN.length * cs - 6;
    crown = `<g class="pf-bob">${renderPixels([{ x: 0, y: 0, grid: CROWN }], FX_PALETTE, { x: cx, y: cy, scale: cs })}</g>`;
  }
  const body = [
    frames(px(limbA), px(limbB), FRAME_SPEED[state.mood]),
    px(species.body),
    px(species.mouths[face.mouth]),
    face.blush ? px(species.blush) : "",
    eyes2,
    crown
  ].join("");
  return { svg: animated(box, state.mood, body), box };
}
function egg(state) {
  const scale = 4;
  const w = EGG[0].length * scale;
  const h = EGG.length * scale;
  const box = positionFor(w, h, scale);
  const progress = state.xp / xpForLevel(3);
  const layers = [{ x: 0, y: 0, grid: EGG }];
  if (progress >= 0.5) layers.push({ x: 0, y: 0, grid: EGG_CRACK });
  const pixels = renderPixels(layers, EGG_PALETTE, { scale });
  const wobble = state.mood === "happy" || state.mood === "idle" ? "pf-wobble" : "";
  const svg = `${shadow(box, "idle")}<g transform="translate(${box.x} ${box.y})"><g class="${wobble}">${pixels}</g></g>`;
  return { svg, box };
}
function animated(box, mood, body) {
  const { outer, inner } = motionClass(mood);
  return `<g class="${outer}">${shadow(box, mood)}<g transform="translate(${box.x} ${box.y})"><g class="${inner}">${body}</g></g></g>`;
}
function fx(grid, x, y, scale, cls, delay) {
  return `<g class="${cls}" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid }], FX_PALETTE, { x: round(x), y: round(y), scale })}</g>`;
}
function effects(state, box) {
  const out = [];
  switch (state.mood) {
    case "happy":
      out.push(
        fx(HEART, box.x + box.w * 0.1, box.y, 2, "pf-rise", 0.3),
        fx(HEART, box.x + box.w * 0.5, box.y - 6, 2, "pf-rise", 1.2),
        fx(HEART, box.x + box.w * 0.85, box.y + 4, 2, "pf-rise", 2.1)
      );
      break;
    case "sleeping":
      out.push(
        fx(ZED, box.x + box.w * 0.7, box.y - 2, 2, "pf-rise", 0),
        fx(ZED, box.x + box.w * 0.7 + 6, box.y - 8, 2.5, "pf-rise", 0.9),
        fx(ZED, box.x + box.w * 0.7 + 12, box.y - 14, 3, "pf-rise", 1.8)
      );
      break;
    case "hungry": {
      const bx = box.x + box.w - 6;
      const by = box.y - 34;
      out.push(
        `<g class="pf-bob">`,
        `<rect x="${bx - 6}" y="${box.y - 8}" width="4" height="4" rx="1" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1"/>`,
        `<rect x="${bx}" y="${box.y - 16}" width="6" height="6" rx="2" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1"/>`,
        `<rect x="${bx + 2}" y="${by}" width="28" height="24" rx="8" style="fill:var(--pf-bg);stroke:var(--pf-muted)" stroke-width="1.2"/>`,
        renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: bx + 9, y: by + 5, scale: 3.5 }),
        `</g>`
      );
      break;
    }
    case "idle":
      break;
  }
  if (state.stage === "legendary") {
    const spots = [
      [-14, 6, 0],
      [box.w + 4, 0, 0.6],
      [-8, box.h - 18, 1.1],
      [box.w + 2, box.h - 26, 1.5]
    ];
    for (const [dx, dy, delay] of spots) out.push(fx(SPARKLE, box.x + dx, box.y + dy, 2, "pf-twinkle", delay));
  }
  return out.join("");
}
function bar(label, ratio, value, y, color) {
  const segments = 10;
  const filled = ratio <= 0 ? 0 : Math.max(1, Math.min(segments, Math.round(ratio * segments)));
  const x0 = PANEL_X + 30;
  let segs = "";
  for (let i = 0; i < segments; i++) {
    const fill = i < filled ? color : "var(--pf-bar-empty)";
    segs += `<rect x="${x0 + i * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${fill}"/>`;
  }
  return `
  <text x="${PANEL_X}" y="${y}" class="pf-label">${label}</text>${segs}
  <text x="${PANEL_RIGHT}" y="${y}" class="pf-value" text-anchor="end">${escapeXml(value)}</text>`;
}
function moodLine(state) {
  if (state.stage === "egg") return "Egg \xB7 hatches at Lv.3";
  const d = state.daysSinceLastContribution;
  switch (state.mood) {
    case "happy":
      return state.streak >= 2 ? `\u2665 Happy \xB7 ${state.streak}-day streak!` : "\u2665 Happy \xB7 on a roll!";
    case "idle":
      return "Idle \xB7 just vibing";
    case "hungry":
      return `Hungry \xB7 ${d} days without commits`;
    case "sleeping":
      return d >= 365 ? "Zzz \xB7 deep hibernation" : `Zzz \xB7 asleep for ${d} days`;
  }
}
function panel(state) {
  const levelSpan = Math.max(1, state.xpNextLevel - state.xpLevelStart);
  const xpRatio = state.level >= 99 ? 1 : (state.xp - state.xpLevelStart) / levelSpan;
  const star = state.stage === "legendary" ? "\u2605 " : "";
  const lang = state.topLanguage ? ` \xB7 ${state.topLanguage}` : "";
  const stats = [
    ["STR", state.stats.str],
    ["INT", state.stats.int],
    ["CHA", state.stats.cha],
    ["DEX", state.stats.dex]
  ].map(
    ([label, value], i) => `<text x="${PANEL_X + i * 60}" y="128" class="pf-label">${label}</text><text x="${PANEL_X + i * 60}" y="147" class="pf-stat">${value}</text>`
  ).join("");
  return `
<g>
  <text x="${PANEL_X}" y="40" class="pf-name">${escapeXml(state.petName)}</text>
  <text x="${PANEL_X}" y="61" class="pf-class"><tspan class="pf-accent">Lv.${state.level} ${star}${escapeXml(state.className)}</tspan><tspan class="pf-muted">${escapeXml(lang)}</tspan></text>
  ${bar("HP", state.activeDays14 / 14, `${state.activeDays14}/14d`, 88, "var(--pf-hp)")}
  ${bar("EXP", xpRatio, `${compact(state.xp)}/${compact(state.xpNextLevel)}`, 108, "var(--pf-exp)")}
  ${stats}
  <text x="${PANEL_X}" y="174" class="pf-mood">${escapeXml(moodLine(state))}</text>
</g>`;
}
function renderPetCard(state, options = {}) {
  const pet = state.stage === "egg" ? egg(state) : creature(state);
  const title = `${state.petName}, ${state.login}'s ProfileForge pet`;
  const desc = `Level ${state.level} ${state.className} ${state.species}, feeling ${state.mood}. ${state.streak}-day streak.`;
  const border = options.hideBorder ? "" : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${escapeXml(title)}</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}
.pf-name{font:700 20px ${SANS};fill:var(--pf-title)}
.pf-class{font:700 13px ${SANS}}
.pf-accent{fill:var(--pf-accent)}
.pf-muted{fill:var(--pf-muted);font-weight:400}
.pf-label{font:700 11px ${MONO};fill:var(--pf-muted)}
.pf-value{font:400 11px ${MONO};fill:var(--pf-text)}
.pf-stat{font:700 16px ${MONO};fill:var(--pf-text)}
.pf-mood{font:400 12px ${SANS};fill:var(--pf-muted)}
${CSS}</style>
<rect width="${W}" height="${H}" rx="10" style="fill:var(--pf-bg)"/>
${border}
${scene()}
  ${pet.svg}
  ${effects(state, pet.box)}
</g>
${panel(state)}
</svg>`;
}

// src/action/generate.ts
function parseOutputs(text) {
  const specs = text.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
    const q = line.indexOf("?");
    const path = q === -1 ? line : line.slice(0, q);
    const query = q === -1 ? "" : line.slice(q + 1);
    if (!path.endsWith(".svg")) throw new Error(`Output "${path}" must end with .svg`);
    return { path, params: parsePetParams(new URLSearchParams(query)) };
  });
  if (specs.length === 0) throw new Error("No outputs given");
  return specs;
}
function resolveInside(workspace, path) {
  const full = resolve(workspace, path);
  const rel = relative(workspace, full);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Output "${path}" must stay inside the repository`);
  }
  return full;
}
async function generate({ user, token, outputs, workspace, fetch: fetch2 = fetchProfile }) {
  const targets = outputs.map((o) => ({ ...o, full: resolveInside(workspace, o.path) }));
  const profile = await fetch2(user, token);
  let first;
  for (const { full, params } of targets) {
    const state = computePetState(profile, { petName: params.petName, species: params.species });
    first ??= state;
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, renderPetCard(state, { theme: params.theme, hideBorder: params.hideBorder }));
  }
  return { files: targets.map((t) => t.full), state: first };
}

// src/action/main.ts
function input(name) {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? "").trim();
}
function appendTo(envFile, text) {
  const path = process.env[envFile];
  if (path) appendFileSync(path, text + "\n");
}
function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function commitAndPush(workspace, files, message) {
  const paths = files.map((f) => relative2(workspace, f));
  git(workspace, "add", "--", ...paths);
  if (!git(workspace, "status", "--porcelain", "--", ...paths)) {
    console.log("Pet unchanged since last run, nothing to commit.");
    return;
  }
  git(
    workspace,
    "-c",
    "user.name=github-actions[bot]",
    "-c",
    "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit",
    "-m",
    message,
    "--",
    ...paths
  );
  try {
    git(workspace, "push");
  } catch {
    git(workspace, "pull", "--rebase");
    git(workspace, "push");
  }
  console.log(`Committed ${paths.join(", ")}`);
}
async function main() {
  const user = input("github_user_name");
  const token = input("github_token");
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  if (!LOGIN_RE.test(user)) throw new Error(`"${user}" is not a valid GitHub login`);
  if (!token) throw new Error("github_token is empty");
  const outputs = parseOutputs(input("outputs"));
  const { files, state } = await generate({ user, token, outputs, workspace });
  const mood = `${state.petName} is ${state.mood} \xB7 Lv.${state.level} ${state.className} (${state.stage})`;
  console.log(`\u{1F980} ${mood}`);
  for (const f of files) console.log(`  wrote ${relative2(workspace, f)}`);
  appendTo("GITHUB_STEP_SUMMARY", `### \u{1F980} ${mood}

Streak: ${state.streak} days \xB7 XP: ${state.xp}`);
  appendTo("GITHUB_OUTPUT", `mood=${state.mood}
level=${state.level}
stage=${state.stage}`);
  if (input("commit") !== "false") {
    commitAndPush(workspace, files, input("commit_message") || "chore: feed the ProfileForge pet");
  }
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.log(`::error title=ProfileForge::${message}`);
  process.exitCode = 1;
});
