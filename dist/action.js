// src/action/main.ts
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative as relative2 } from "node:path";

// src/city/layout.ts
var W = 800;
var H = 260;
var U = 2;
var BASE_Y = 182;
var ROAD_Y = 185;
var QUAY_Y = 199;
var WATER_Y = 209;
var MIRROR_Y = WATER_Y + 4;
var BUILDING_W = 7 * U;
var FLOOR_H = 3 * U;
var MAX_FLOORS = 17;
var RIGHT_EDGE = W - 24;

// src/world/seasons.ts
var CITY_AREA = { x: 0, y: 0, w: W, ground: BASE_Y };
var SEASONS = ["spring", "summer", "autumn", "winter"];
var HEMISPHERES = ["north", "south"];
var OPPOSITE = { spring: "autumn", summer: "winter", autumn: "spring", winter: "summer" };
function seasonFor(date, hemisphere = "north") {
  const month = Number(date.slice(5, 7));
  const north = month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 8 ? "summer" : month >= 9 && month <= 11 ? "autumn" : "winter";
  return hemisphere === "south" ? OPPOSITE[north] : north;
}
var SNOW = "#f2f6ff";
var LOOKS = {
  spring: {
    canopy: ["#ffb7c5", "#ffc8d6", "#f7a1b8"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#4caf6a",
    bush: ["#5fbf7a", "#ffb7c5"],
    snow: false,
    fireflies: false,
    falling: { colors: ["#ffc8d6", "#ffb7c5"], count: 18, size: 3, minSeconds: 9, spin: true, shape: "leaf" },
    litter: ["#ffc8d6", "#ffb7c5"]
  },
  summer: {
    canopy: ["#2f7d4a", "#3a8f57"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#3f9b5a",
    bush: ["#2f7d4a", "#3a8f57"],
    snow: false,
    fireflies: true,
    falling: null,
    litter: []
  },
  autumn: {
    canopy: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"],
    pine: "#24603a",
    pineTip: "#24603a",
    grass: "#8a9a4a",
    bush: ["#c9723a", "#b5543a"],
    snow: false,
    fireflies: false,
    falling: { colors: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"], count: 24, size: 3, minSeconds: 8, spin: true, shape: "leaf" },
    litter: ["#e76f51", "#f4a261", "#d62828", "#e9c46a"]
  },
  winter: {
    canopy: ["#dde7f0"],
    pine: "#2c5e46",
    pineTip: SNOW,
    grass: "#e3ebf5",
    bush: ["#d5e0ea"],
    snow: true,
    fireflies: false,
    falling: { colors: [SNOW], count: 38, size: 2, minSeconds: 10, spin: false, shape: "square" },
    litter: []
  }
};
var SEASON_CSS = `
.pf-fall{animation:pf-fall 10s linear infinite}
.pf-spin{transform-box:fill-box;transform-origin:center}
@keyframes pf-fall{0%{transform:translate(0,-12px) rotate(0)}100%{transform:translate(var(--dx),${H + 12}px) rotate(var(--spin,0deg))}}
.pf-firefly{animation:pf-firefly 3s ease-in-out infinite}
@keyframes pf-firefly{0%,100%{opacity:0;transform:translate(0,0)}50%{opacity:1;transform:translate(var(--dx),-6px)}}
`;
function fallingParticles(look, rng, area = CITY_AREA) {
  const f = look.falling;
  if (!f) return "";
  const out = [];
  const count2 = Math.round(f.count * area.w / W) + 4;
  for (let i = 0; i < count2; i++) {
    const x = area.x + Math.round(rng() * area.w);
    const seconds = f.minSeconds + rng() * 7;
    const delay = rng() * seconds;
    const dx = Math.round((rng() - 0.5) * 80);
    const color = f.colors[Math.floor(rng() * f.colors.length)];
    const size = f.size + (rng() < 0.3 ? 1 : 0);
    const spin = f.spin ? `;--spin:${rng() < 0.5 ? "-" : ""}540deg` : "";
    const attrs = `class="pf-fall${f.spin ? " pf-spin" : ""}" style="--dx:${dx}px${spin};animation-duration:${seconds.toFixed(1)}s;animation-delay:-${delay.toFixed(1)}s" fill="${color}"`;
    out.push(
      f.shape === "leaf" ? `<path ${attrs} d="${leaf(x, area.y, size)}"/>` : `<rect ${attrs} x="${x}" y="${area.y}" width="${size}" height="${size}"/>`
    );
  }
  return `<g>${out.join("")}</g>`;
}
function leaf(x, y, size) {
  return size >= 4 ? `M${x} ${y}h2v1h2v2h-2v-1h-1v-1h-1z` : `M${x} ${y}h2v1h1v1h-2v-1h-1z`;
}
function litter(look, rng) {
  if (look.litter.length === 0) return "";
  const out = [];
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rng() * W);
    const y = BASE_Y + Math.round(rng() * (ROAD_Y - BASE_Y + 2));
    const color = look.litter[Math.floor(rng() * look.litter.length)];
    out.push(`<rect x="${x}" y="${y}" width="${rng() < 0.5 ? 2 : 3}" height="1" fill="${color}"/>`);
  }
  return `<g opacity=".85">${out.join("")}</g>`;
}
function fireflies(look, rng, area = CITY_AREA) {
  if (!look.fireflies) return "";
  const out = [];
  const count2 = Math.max(4, Math.round(12 * area.w / W));
  for (let i = 0; i < count2; i++) {
    const x = Math.round(area.x + 12 + rng() * (area.w - 24));
    const y = Math.round(area.ground - 30 + rng() * 26);
    const dx = Math.round((rng() - 0.5) * 16);
    out.push(
      `<rect class="pf-firefly" style="--dx:${dx}px;animation-delay:-${(rng() * 3).toFixed(1)}s;animation-duration:${(2.4 + rng() * 2).toFixed(1)}s" x="${x}" y="${y}" width="2" height="2" fill="#dfff6b"/>`
    );
  }
  return `<g class="pf-night">${out.join("")}</g>`;
}

// src/random.ts
function hash(text2) {
  let h = 2166136261;
  for (let i = 0; i < text2.length; i++) {
    h ^= text2.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seeded(seed) {
  let a = hash(seed);
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var pick = (rng, items) => items[Math.floor(rng() * items.length)];

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
  return Object.hasOwn(CLASS_BY_LANGUAGE, language) ? CLASS_BY_LANGUAGE[language] : "Adventurer";
}

// src/svg/pixel.ts
var layer = (x, y, grid) => ({ x, y, grid });
function mirror(grid) {
  return grid.map((row2) => [...row2].reverse().join(""));
}
function fillAttr(color) {
  return color.startsWith("var(") ? `style="fill:${color}"` : `fill="${color}"`;
}
function renderPixels(layers, palette, { x = 0, y = 0, scale }) {
  const rows = /* @__PURE__ */ new Map();
  for (const l of layers) {
    l.grid.forEach((row2, ry) => {
      const cy = l.y + ry;
      [...row2].forEach((ch, rx) => {
        if (ch === "." || ch === " ") return;
        if (palette[ch] === void 0) throw new Error(`Pixel "${ch}" has no palette entry`);
        let cells = rows.get(cy);
        if (!cells) rows.set(cy, cells = /* @__PURE__ */ new Map());
        cells.set(l.x + rx, ch);
      });
    });
  }
  const paths = /* @__PURE__ */ new Map();
  for (const cy of [...rows.keys()].sort((a, b) => a - b)) {
    const cells = rows.get(cy);
    const xs = [...cells.keys()].sort((a, b) => a - b);
    for (let i = 0; i < xs.length; ) {
      const ch = cells.get(xs[i]);
      let run = 1;
      while (i + run < xs.length && xs[i + run] === xs[i] + run && cells.get(xs[i + run]) === ch) run++;
      const color = palette[ch];
      const segs = paths.get(color) ?? [];
      segs.push(`M${x + xs[i] * scale} ${y + cy * scale}h${run * scale}v${scale}h${-run * scale}z`);
      paths.set(color, segs);
      i += run;
    }
  }
  return [...paths].map(([color, segs]) => `<path ${fillAttr(color)} d="${segs.join("")}"/>`).join("");
}
function outlined(grid, ink2 = "o") {
  const w = Math.max(...grid.map((r2) => r2.length)) + 2;
  const padded = ["", ...grid, ""].map((row2) => `.${row2}`.padEnd(w, "."));
  const solid = (x, y) => {
    const c = padded[y]?.[x];
    return c !== void 0 && c !== "." && c !== " ";
  };
  return padded.map(
    (row2, y) => [...row2].map((c, x) => c === "." && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ? ink2 : c).join("")
  );
}

// src/pet/species/capybara.ts
var BODY = [
  ".......ooooooooo..",
  ".....oobbhhhhbbboo",
  "...oobbhhbbbbbbbbb",
  "..obbbbbbbbbbbbbbb",
  ".obbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  ".obbbbbbbbbbbbbbbo",
  "..oddddddddddddddo",
  "...oooooooooooooo."
];
var HEAD = [
  ".ooooo..",
  "obbbbboo",
  "bbbbbbbo",
  "bbbbbddo",
  "bbbbbdno",
  "bbbbbddo",
  "bbbbbbbo",
  "bbbbbbbo",
  "bbbbbboo"
];
var EAR = ["oo", "od"];
var LEG = ["obo", "odo", "ooo"];
var legs = (back = 3, front = 12, lift = 0) => [layer(back, 10 - lift, LEG), layer(front, 10, LEG)];
var capybara = {
  id: "capybara",
  defaultName: "Mocha",
  width: 20,
  height: 13,
  facing: "right",
  palette: {
    o: "#3b2616",
    b: "#a9764d",
    h: "#c99a6e",
    d: "#86573a",
    n: "#2a1a10",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a"
  },
  body: [layer(0, 1, BODY), layer(12, 0, HEAD), layer(13, 0, EAR)],
  eyes: {
    open: [layer(15, 2, ["kw", "kk"])],
    happy: [layer(15, 2, [".k", "k."])],
    closed: [layer(15, 3, ["kk"])],
    sad: [layer(15, 2, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(17, 7, ["kk"]), layer(16, 6, ["k"])],
    neutral: [layer(17, 7, ["kk"])],
    frown: [layer(16, 7, ["kk"])]
  },
  blush: [layer(14, 5, ["pp"])],
  limbs: {
    // An unhurried trot.
    happy: [legs(), legs(4, 11, 1)],
    idle: [legs(), legs(4, 11)],
    hungry: [legs(), legs()],
    // Lying down: legs tucked away.
    sleeping: [[], []]
  },
  crownAnchor: { x: 15, y: 0 }
};

// src/pet/species/chick.ts
var BODY2 = [
  "....oooooo....",
  "..oohhyyyyoo..",
  ".ohyyyyyyyydo.",
  ".oyyyyyyyyydo.",
  "oyyyyyyyyyyydo",
  "oyyyyyyyyyyydo",
  "oyyyyllllyyydo",
  "oyyyllllllyydo",
  "oyyyllllllyddo",
  ".oyyllllllddo.",
  "..oddddddddo..",
  "...oooooooo..."
];
var TUFT = ["o.o", ".o."];
var WING = ["oo.", "oyo", "odo", ".oo"];
var WING_UP = [".oo", "oyo", "oo."];
var FOOT = ["b.b", "bbb"];
var wings = (grid, y) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var feet = (leftY = 13) => [layer(5, leftY, FOOT), layer(10, 13, FOOT)];
var eyes = (grid, x = 5) => [layer(x, 6, grid), layer(x + 6, 6, grid)];
var chick = {
  id: "chick",
  defaultName: "Chirpy",
  width: 18,
  height: 15,
  palette: {
    o: "#6b4a00",
    y: "#f7df1e",
    h: "#fff9b0",
    l: "#fff09a",
    d: "#dcb800",
    b: "#f28c28",
    B: "#c8641a",
    r: "#c0392b",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#7a5200",
    y: "#ffd54a",
    h: "#ffffff",
    l: "#fff4c4",
    d: "#e0a800"
  },
  body: [layer(8, 0, TUFT), layer(2, 2, BODY2)],
  eyes: {
    open: eyes(["kw", "kk"]),
    happy: eyes([".kk.", "k..k"], 4),
    closed: eyes(["k..k", ".kk."], 4),
    sad: eyes(["oo", "kk"])
  },
  mouths: {
    // Beak open mid-chirp.
    smile: [layer(7, 8, ["bbbb", ".rr.", ".BB."])],
    neutral: [layer(7, 8, ["bbbb", ".BB."])],
    frown: [layer(7, 9, [".BB.", "bbbb"])]
  },
  blush: [layer(3, 9, ["pp"]), layer(13, 9, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING_UP, 5), ...feet()]
    ],
    // Hopping along.
    idle: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet(12)]
    ],
    hungry: [
      [...wings(WING, 8), ...feet()],
      [...wings(WING, 8), ...feet()]
    ],
    sleeping: [
      [...wings(WING, 8), ...feet()],
      [...wings(WING, 8), ...feet()]
    ]
  },
  crownAnchor: { x: 9, y: 1 }
};

// src/pet/species/crab.ts
var BODY3 = [
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
var eyes2 = (grid) => [layer(5, 0, grid), layer(11, 0, grid), ...STALKS];
var claws = (grid, y) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var ARMS = [layer(4, 6, ["o"]), layer(15, 6, ["o"])];
var legs2 = (grid) => [layer(0, 11, grid)];
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
  body: [layer(4, 6, BODY3)],
  eyes: {
    open: eyes2(EYE_OPEN),
    closed: [layer(5, 3, EYE_TUCKED), layer(11, 3, EYE_TUCKED)],
    happy: eyes2(EYE_HAPPY),
    sad: eyes2(EYE_SAD)
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
      [...clawsUp(CLAW_OPEN), ...legs2(LEGS_A)],
      [...clawsUp(CLAW_SHUT), ...legs2(LEGS_A)]
    ],
    // Scuttling sideways, like a proper crab.
    idle: [
      [...clawsUp(CLAW_OPEN), ...legs2(LEGS_A)],
      [...clawsUp(CLAW_OPEN), ...legs2(LEGS_B)]
    ],
    hungry: [
      [...clawsDown(CLAW_OPEN), ...legs2(LEGS_A)],
      [...clawsDown(CLAW_OPEN), ...legs2(LEGS_A)]
    ],
    sleeping: [
      [...clawsDown(CLAW_SHUT), ...legs2(LEGS_A)],
      [...clawsDown(CLAW_SHUT), ...legs2(LEGS_A)]
    ]
  },
  crownAnchor: { x: 10, y: 0 }
};

// src/pet/species/elephant.ts
var TORSO = [
  ".oooooooooooo.",
  "obbbbbbbbbbbdo",
  "obbbbbbbbbbbdo",
  "obbbbbbbbbbbdo",
  ".oddddddddddo."
];
var HEAD2 = [
  "..oooooooo..",
  ".ohhbbbbbbo.",
  "ohhbbbbbbbdo",
  "ohbbbbbbbbdo",
  "obbbbbbbbbdo",
  "obbbbbbbbbdo",
  "obbbbbbbbbdo",
  ".obbbbbbbdo.",
  "..obbbbbdo..",
  "...oobboo..."
];
var TRUNK = ["obdo", "obdo", "olbo", ".oo."];
var EAR2 = [
  ".ooo.",
  "ohhbo",
  "obeeo",
  "obeeo",
  "obeeo",
  "obeeo",
  "obbeo",
  ".obdo",
  "..oo."
];
var EAR_FLAP = [
  "..oo.",
  ".ohbo",
  ".obeo",
  ".obeo",
  ".obeo",
  ".obeo",
  "..obo",
  "...o.",
  "....."
];
var FOOT2 = ["obdo", "otto", "oooo"];
var ears = (grid, y = 1) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var feet2 = (leftY = 11, rightY = 11) => [layer(4, leftY, FOOT2), layer(12, rightY, FOOT2)];
var pair = (x, y, grid, gap) => [layer(x, y, grid), layer(x + gap, y, grid)];
var elephant = {
  id: "elephant",
  defaultName: "Ellie",
  width: 20,
  height: 14,
  palette: {
    o: "#2d2a4a",
    b: "#8892bf",
    h: "#b9c1ea",
    d: "#6770a3",
    l: "#a9b1dc",
    e: "#e6a9c6",
    t: "#fffaf0",
    w: "#ffffff",
    k: "#151515",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    l: "#fde7a0",
    e: "#ffd98a"
  },
  body: [layer(3, 8, TORSO), layer(4, 0, HEAD2), layer(8, 10, TRUNK), layer(7, 9, ["t"]), layer(12, 9, ["t"])],
  eyes: {
    open: pair(6, 4, ["kw", "kk"], 6),
    happy: pair(5, 4, [".kk.", "k..k"], 6),
    closed: pair(5, 4, ["k..k", ".kk."], 6),
    sad: pair(6, 4, ["dd", "kk"], 6)
  },
  mouths: {
    smile: [layer(7, 8, ["k"]), layer(12, 8, ["k"])],
    neutral: [],
    frown: []
  },
  blush: [layer(5, 6, ["pp"]), layer(13, 6, ["pp"])],
  limbs: {
    // Flapping ears.
    happy: [
      [...ears(EAR2), ...feet2()],
      [...ears(EAR_FLAP), ...feet2()]
    ],
    // Plodding along.
    idle: [
      [...ears(EAR2), ...feet2()],
      [...ears(EAR2), ...feet2(10, 11)]
    ],
    hungry: [
      [...ears(EAR2, 2), ...feet2()],
      [...ears(EAR2, 2), ...feet2()]
    ],
    sleeping: [
      [...ears(EAR2, 2), ...feet2()],
      [...ears(EAR2, 2), ...feet2()]
    ]
  },
  crownAnchor: { x: 10, y: 0 }
};

// src/pet/species/fox.ts
var HEAD3 = [
  ".o..........o.",
  "oko........oko",
  "oiro......orio",
  "oirroooooorrio",
  "orrrrrrrrrrrro",
  "orrrrrrrrrrrro",
  "orrrrrrrrrrrro",
  "owwrrrrrrrrwwo",
  ".owwwwnnwwwwo.",
  "..oowwwwwwoo..",
  "....oooooo...."
];
var BODY4 = [
  "..orrrrrro..",
  ".orrwwwwrro.",
  "orrrwwwwrrro",
  "orrrrwwrrrro",
  "orrrrrrrrrro",
  ".oooooooooo."
];
var TAIL = ["...oo.", "..owwo", ".owwro", ".orrro", "orrrro", "orrrro", ".orrro", "..ooo."];
var TAIL_WAG = ["....oo", "...owo", "..owwo", ".orrro", "orrrro", "orrrro", ".orrro", "..ooo."];
var DROOP = ["......", "......", "......", "......", "..ooo.", ".orrro", "orrrwo", ".oooo."];
var PAW = ["okko", "oooo"];
var paws = (lift = 0) => [layer(5, 14 - lift, PAW), layer(9, 14, PAW)];
var tail = (grid) => [layer(12, 7, grid)];
var fox = {
  id: "fox",
  defaultName: "Ember",
  width: 18,
  height: 16,
  palette: {
    o: "#4a1a0c",
    r: "#e8622c",
    i: "#ffb3a0",
    w: "#fff4e6",
    n: "#1a1a1a",
    k: "#1a1a1a",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    i: "#fff1a8"
  },
  body: [layer(3, 9, BODY4), layer(2, 0, HEAD3)],
  eyes: {
    open: [layer(5, 5, ["kw", "kk"]), layer(11, 5, ["kw", "kk"])],
    happy: [layer(5, 5, [".k.", "k.k"]), layer(10, 5, [".k.", "k.k"])],
    closed: [layer(5, 6, ["kk"]), layer(11, 6, ["kk"])],
    sad: [layer(5, 5, ["oo", "kk"]), layer(11, 5, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(7, 9, ["k..k"])],
    neutral: [layer(8, 9, ["kk"])],
    frown: [layer(7, 9, [".kk."])]
  },
  blush: [layer(3, 7, ["p"]), layer(14, 7, ["p"])],
  limbs: {
    // The tail wags.
    happy: [[...tail(TAIL), ...paws()], [...tail(TAIL_WAG), ...paws(1)]],
    idle: [[...tail(TAIL), ...paws()], [...tail(TAIL_WAG), ...paws()]],
    // Tail drooping.
    hungry: [[...tail(DROOP), ...paws()], [...tail(DROOP), ...paws()]],
    // Curled up, the tail as a blanket.
    sleeping: [[...tail(TAIL), ...paws()], [...tail(TAIL), ...paws()]]
  },
  crownAnchor: { x: 9, y: 3 }
};

// src/pet/species/gopher.ts
var BODY5 = [
  "....oooooo....",
  "..oohhhgggoo..",
  ".ohhgggggggdo.",
  "ohhgggggggggdo",
  "ohgggggggggggo",
  "ogggggggggggdo",
  "ogggggggggggdo",
  "ogggggggggggdo",
  "oggglllllgggdo",
  "ogglllllllggdo",
  "ogglllllllgddo",
  ".ogglllllgddo.",
  "..oddddddddo..",
  "....oooooo...."
];
var EAR3 = [".oo", "ohd"];
var SNOUT = ["..kk..", ".ssss.", "ssssss", ".SSSS."];
var TEETH = layer(7, 12, ["ww"]);
var ARM = [".o", "os", "oS", ".o"];
var FOOT3 = ["ossso", ".ooo."];
var eyes3 = (grid) => [layer(3, 4, grid), layer(9, 4, grid)];
var arms = (y = 9) => [layer(0, y, ARM), layer(14, y, mirror(ARM))];
var feet3 = (leftY = 15) => [layer(3, leftY, FOOT3), layer(8, 15, FOOT3)];
var gopher = {
  id: "gopher",
  defaultName: "Gogo",
  width: 16,
  height: 17,
  palette: {
    o: "#1f4e5f",
    g: "#7fd5ea",
    h: "#c9f3fb",
    d: "#57b3cc",
    l: "#d9f7fc",
    s: "#f3d6b2",
    S: "#d9b48a",
    k: "#151515",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    g: "#f6c343",
    h: "#fff1a8",
    d: "#d9a21c",
    l: "#fde7a0"
  },
  body: [layer(3, 1, EAR3), layer(10, 1, mirror(EAR3)), layer(1, 2, BODY5), layer(5, 8, SNOUT)],
  eyes: {
    open: eyes3([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes3(["....", ".oo.", "o..o", "...."]),
    closed: eyes3(["....", "....", "o..o", ".oo."]),
    sad: eyes3(["....", "oooo", "owko", ".oo."])
  },
  mouths: {
    smile: [layer(6, 11, ["o..o"]), TEETH],
    neutral: [TEETH],
    frown: [layer(6, 12, ["o..o"]), TEETH]
  },
  blush: [layer(2, 9, ["pp"]), layer(12, 9, ["pp"])],
  limbs: {
    // Waving both paws.
    happy: [
      [...arms(), ...feet3()],
      [...arms(6), ...feet3()]
    ],
    // Waddling.
    idle: [
      [...arms(), ...feet3()],
      [...arms(), ...feet3(14)]
    ],
    hungry: [
      [...arms(10), ...feet3()],
      [...arms(10), ...feet3()]
    ],
    sleeping: [
      [...arms(10), ...feet3()],
      [...arms(10), ...feet3()]
    ]
  },
  crownAnchor: { x: 8, y: 1 }
};

// src/pet/species/hedgehog.ts
var DOME = [
  "....o.o.o.o.....",
  "..o.oxoxoxo.o...",
  ".oxoxxxxxxxoxo..",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  "oxxxxxxxxxxxxxo.",
  ".oxxxxxxxxxxxo..",
  "..offffffffffo..",
  "...oooooooooo..."
];
var SPIKES = DOME.map((row2, y) => [...row2].map((c, x) => c === "x" ? ((x - y) % 3 + 3) % 3 === 0 ? "S" : "s" : c).join(""));
var FACE = [
  "oo......",
  "ffo.....",
  "fffoo...",
  "ffffffoo",
  "fffffffn",
  "ffffffoo",
  "fffoo...",
  "ooo....."
];
var EAR4 = ["oo", "oi"];
var FOOT4 = ["off", "ooo"];
var feet4 = (back = 3, front = 10, lift = 0) => [layer(back, 11 - lift, FOOT4), layer(front, 11, FOOT4)];
var hedgehog = {
  id: "hedgehog",
  defaultName: "Spike",
  width: 20,
  height: 13,
  facing: "right",
  palette: {
    o: "#2e1d12",
    s: "#6b4a33",
    S: "#a67b55",
    f: "#f3d9b1",
    i: "#e8a0a0",
    n: "#141414",
    k: "#141414",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    s: "#c99a1a",
    S: "#fff1a8"
  },
  body: [layer(0, 0, SPIKES), layer(11, 3, FACE), layer(12, 2, EAR4)],
  eyes: {
    open: [layer(13, 5, ["kw", "kk"])],
    happy: [layer(13, 5, [".k", "k."])],
    closed: [layer(13, 6, ["kk"])],
    sad: [layer(13, 5, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(15, 8, ["kk"])],
    neutral: [layer(15, 8, ["k"])],
    frown: [layer(14, 8, ["k"]), layer(15, 7, ["k"])]
  },
  blush: [layer(12, 7, ["pp"])],
  limbs: {
    // Pitter-patter.
    happy: [feet4(), feet4(4, 9, 1)],
    idle: [feet4(), feet4(4, 9)],
    hungry: [feet4(), feet4()],
    // Curled up.
    sleeping: [[], []]
  },
  crownAnchor: { x: 7, y: 0 }
};

// src/pet/species/octopus.ts
var HEAD4 = [
  "....oooooooo....",
  "..oohhhhhmmmoo..",
  ".ohhhmmmmmmsmmo.",
  ".ohmmmmmmmmmmmo.",
  "ohmmsmmmmmmmmmmo",
  "ommmmmmmmmmmmsmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  "ommmmmmmmmmmmmmo",
  ".ommmmmmmmmmmmo."
];
var SKIRT = ["ommmmmmmmmmmmmmmmo"];
var WAVE_A = [
  "omo.omo..omo.omo..",
  "omo..omo.omo..omo.",
  ".omo.omo..omo.omo.",
  "..oo..oo...oo..oo."
];
var WAVE_B = [
  "..omo.omo..omo.omo",
  ".omo.omo..omo.omo.",
  ".omo..omo.omo..omo",
  ".oo...oo..oo...oo."
];
var REST = [
  "omo.omo..omo.omo..",
  "ommoommooommoommo.",
  ".oo..oo...oo..oo..",
  ".................."
];
var eyes4 = (grid) => [layer(4, 4, grid), layer(10, 4, grid)];
var tentacles = (grid) => [layer(0, 11, SKIRT), layer(0, 12, grid)];
var octopus = {
  id: "octopus",
  defaultName: "Inky",
  width: 18,
  height: 16,
  palette: {
    o: "#5c1d3a",
    m: "#ee6a8f",
    h: "#ffa8bf",
    s: "#c9446c",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ffd1dc"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    m: "#f6c343",
    h: "#fff1a8",
    s: "#c99a1a"
  },
  body: [layer(1, 0, HEAD4)],
  eyes: {
    open: eyes4([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes4(["....", ".oo.", "o..o", "...."]),
    closed: eyes4(["....", "....", "o..o", ".oo."]),
    sad: eyes4(["....", "oooo", "owko", ".oo."])
  },
  mouths: {
    smile: [layer(7, 8, ["o..o", ".oo."])],
    neutral: [layer(8, 9, ["oo"])],
    frown: [layer(7, 8, [".oo.", "o..o"])]
  },
  blush: [layer(3, 8, ["pp"]), layer(13, 8, ["pp"])],
  limbs: {
    happy: [tentacles(WAVE_A), tentacles(WAVE_B)],
    idle: [tentacles(WAVE_A), tentacles(WAVE_B)],
    hungry: [tentacles(REST), tentacles(REST)],
    sleeping: [tentacles(REST), tentacles(REST)]
  },
  crownAnchor: { x: 9, y: 0 }
};

// src/pet/species/otter.ts
var BODY6 = [
  "........oooooooo..",
  "......oobbhhhhbbbo",
  "....oobbbbbbbbbbbb",
  "ooooobbbbbbbbbbbbb",
  "obbbbbbbbbbbbbbbbb",
  ".oooobbbbbbbbbbbbb",
  ".....obccccccccbbo",
  "......oooooooooo.."
];
var HEAD5 = [
  ".oo.....",
  "oboooo..",
  "obbbbboo",
  "bbbbbbbo",
  "bbbbbccn",
  "bbbbcccc",
  "obbbcccc",
  ".ooooooo"
];
var BANDANA = ["vv", "vv", "vV", "vv", ".v"];
var LEG2 = ["obo", "ooo"];
var legs3 = (back = 5, front = 13, lift = 0) => [layer(back, 10 - lift, LEG2), layer(front, 10, LEG2)];
var otter = {
  id: "otter",
  defaultName: "Kody",
  width: 22,
  height: 12,
  facing: "right",
  palette: {
    o: "#2e1b10",
    b: "#8a5a3a",
    h: "#b07d56",
    c: "#f1dcc0",
    n: "#1a1a1a",
    v: "#7f52ff",
    V: "#e44857",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8"
  },
  body: [layer(0, 2, BODY6), layer(14, 1, HEAD5), layer(13, 3, BANDANA)],
  eyes: {
    open: [layer(17, 3, ["kw", "kk"])],
    happy: [layer(17, 3, [".k", "k."])],
    closed: [layer(17, 4, ["kk"])],
    sad: [layer(17, 3, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(19, 7, ["k"]), layer(20, 6, ["k"])],
    neutral: [layer(19, 7, ["kk"])],
    frown: [layer(19, 6, ["k"]), layer(20, 7, ["k"])]
  },
  blush: [layer(16, 6, ["pp"])],
  limbs: {
    // Scampering.
    happy: [legs3(), legs3(6, 12, 1)],
    idle: [legs3(), legs3(6, 12)],
    hungry: [legs3(), legs3()],
    // Curled up on its side.
    sleeping: [[], []]
  },
  crownAnchor: { x: 17, y: 1 }
};

// src/pet/species/snail.ts
var SHELL = [
  "...ooooo...",
  ".ooyyyyyoo.",
  "oyyhrrrryyo",
  "oyhryyyyryo",
  "oyryyrryryo",
  "oyryryyryyo",
  "oyryyrryyyo",
  "oyyryyyyryo",
  ".oyyrrrryo.",
  "..ooooooo.."
];
var FOOT5 = [
  "..............bbbbo.",
  ".oobbbbbbbbbbbbbbo..",
  "obbbbbbbbbbbbbbbbbo.",
  ".oooooooooooooooooo."
];
var HEAD6 = [".oooo.", "obbbbo", "obbbbo", "obbbbo", "obbbbo"];
var STALK = ["g", "g", "g"];
var stalks = (tilt = 0) => [layer(14 + tilt, 3, STALK), layer(17 + tilt, 3, STALK)];
var snail = {
  id: "snail",
  defaultName: "Bash",
  width: 20,
  height: 14,
  facing: "right",
  palette: {
    o: "#3d2b1f",
    y: "#e9b04f",
    h: "#f7dc93",
    r: "#9a5d27",
    b: "#b9dcc3",
    g: "#7fb592",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    y: "#f6c343",
    h: "#fff1a8",
    r: "#c99a1a"
  },
  body: [layer(0, 10, FOOT5), layer(13, 6, HEAD6), layer(2, 1, SHELL)],
  eyes: {
    open: [layer(13, 1, ["wk", "kk"]), layer(16, 1, ["wk", "kk"])],
    happy: [layer(13, 1, ["k.", ".k"]), layer(16, 1, ["k.", ".k"])],
    closed: [layer(13, 2, ["kk"]), layer(16, 2, ["kk"])],
    sad: [layer(13, 1, ["oo", "kk"]), layer(16, 1, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(16, 9, ["k"]), layer(17, 8, ["k"])],
    neutral: [layer(16, 9, ["kk"])],
    frown: [layer(16, 8, ["k"]), layer(17, 9, ["k"])]
  },
  blush: [layer(14, 8, ["pp"])],
  limbs: {
    // The stalks bob as it glides.
    happy: [stalks(), stalks(1)],
    idle: [stalks(), stalks()],
    hungry: [stalks(), stalks()],
    sleeping: [stalks(), stalks()]
  },
  crownAnchor: { x: 7, y: 1 }
};

// src/pet/species/snake.ts
var HEAD7 = [
  "..oooooo..",
  ".ohhbbbbo.",
  "ohhbbbbbdo",
  "ohbbbbbbdo",
  "obbbbbbbdo",
  ".obyyyydo.",
  "..oooooo.."
];
var NECK = ["obdo", "obdo", "obdo"];
var TOP_COIL = [
  "..oooooooooo..",
  ".obhhbbbbbbdo.",
  "obbbbbbbbbbbdo",
  "oyyYyyYyyYyydo",
  ".oooooooooooo."
];
var BOTTOM_COIL = [
  "..oooooooooooooo..",
  ".obhhbbbbbbbbbbdo.",
  "obbbbbbbbbbbbbbbdo",
  "oyyYyyYyyYyyYyyydo",
  ".oooooooooooooooo."
];
var TAIL_UP = layer(18, 7, [".o", "ob", "od", "o."]);
var TAIL_DOWN = layer(18, 9, ["o.", "ob", ".o"]);
var snake = {
  id: "snake",
  defaultName: "Monty",
  width: 20,
  height: 15,
  palette: {
    o: "#1b2f4a",
    b: "#3776ab",
    h: "#7fb2e0",
    d: "#25507a",
    y: "#ffd43b",
    Y: "#e0a800",
    w: "#ffffff",
    k: "#111111",
    p: "#ff8fa3",
    r: "#e63946"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    y: "#fff8d6",
    Y: "#f1d27a"
  },
  body: [layer(1, 10, BOTTOM_COIL), layer(3, 7, TOP_COIL), layer(5, 0, HEAD7), layer(8, 5, NECK)],
  eyes: {
    open: [layer(7, 2, ["kw", "kk"]), layer(11, 2, ["kw", "kk"])],
    happy: [layer(6, 2, [".k.", "k.k"]), layer(11, 2, [".k.", "k.k"])],
    closed: [layer(6, 3, ["kkk"]), layer(11, 3, ["kkk"])],
    sad: [layer(7, 2, ["oo", "kk"]), layer(11, 2, ["oo", "kk"])]
  },
  mouths: {
    // Tongue out!
    smile: [layer(8, 4, ["o..o"]), layer(9, 5, ["rr"])],
    neutral: [layer(9, 4, ["oo"])],
    frown: [layer(8, 4, [".oo."]), layer(8, 5, ["o..o"])]
  },
  blush: [layer(6, 4, ["p"]), layer(13, 4, ["p"])],
  limbs: {
    happy: [[TAIL_UP], [TAIL_DOWN]],
    idle: [[TAIL_UP], [TAIL_DOWN]],
    hungry: [[TAIL_DOWN], [TAIL_DOWN]],
    sleeping: [[TAIL_DOWN], [TAIL_DOWN]]
  },
  crownAnchor: { x: 10, y: 0 }
};

// src/pet/species/squid.ts
var MANTLE = [
  "....oo....",
  "...ohbo...",
  "..ohbbbo..",
  ".ohbbbbbo.",
  "ohbbbbbbbo",
  "ohbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  "obbbbbbbbo",
  ".obbbbbbo."
];
var FIN = ["...o", "..ob", ".obb", "obbb", ".oob", "...o"];
var ARMS_A = [
  "..obbbbbbbbbbo..",
  ".obobobobobobo..",
  "ob.ob.ob.ob.ob.o",
  "o..o..o..o..o..o"
];
var ARMS_B = [
  "..obbbbbbbbbbo..",
  "..obobobobobobo.",
  ".o.bo.bo.bo.bo.o",
  "...o..o..o..o..."
];
var TENTACLE_A = ["o..", "bo.", "bo.", "bo.", "bbo", "obb"];
var TENTACLE_B = [".o.", "ob.", "ob.", "ob.", "obb", "bbo"];
var REST2 = [
  "..obbbbbbbbbbo..",
  ".obbbbbbbbbbbbo.",
  "obobobobobobobo.",
  "................"
];
var eyes5 = (grid) => [layer(6, 7, grid), layer(10, 7, grid)];
var arms2 = (skirt, left, right) => [layer(1, 12, skirt), layer(0, 11, left), layer(15, 11, right)];
var squid = {
  id: "squid",
  defaultName: "Plus",
  width: 18,
  height: 17,
  palette: {
    o: "#0b2a4a",
    b: "#4f8fd8",
    h: "#9cc4f0",
    k: "#111111",
    w: "#ffffff",
    p: "#ffb3c6"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8"
  },
  body: [layer(1, 2, FIN), layer(13, 2, mirror(FIN)), layer(4, 0, MANTLE)],
  eyes: {
    open: eyes5(["wk", "kk"]),
    happy: eyes5([".o.", "o.o"]),
    closed: eyes5(["...", "ooo"]),
    sad: eyes5(["oo", "kk"])
  },
  mouths: {
    smile: [layer(8, 10, ["o..o"]), layer(9, 11, ["oo"])],
    neutral: [layer(9, 10, ["oo"])],
    frown: [layer(9, 10, ["oo"]), layer(8, 11, ["o..o"])]
  },
  blush: [layer(4, 10, ["pp"]), layer(12, 10, ["pp"])],
  limbs: {
    happy: [arms2(ARMS_A, TENTACLE_A, mirror(TENTACLE_A)), arms2(ARMS_B, TENTACLE_B, mirror(TENTACLE_B))],
    idle: [arms2(ARMS_A, TENTACLE_A, mirror(TENTACLE_A)), arms2(ARMS_B, TENTACLE_B, mirror(TENTACLE_B))],
    hungry: [arms2(REST2, TENTACLE_B, mirror(TENTACLE_B)), arms2(REST2, TENTACLE_B, mirror(TENTACLE_B))],
    sleeping: [arms2(REST2, TENTACLE_B, mirror(TENTACLE_B)), arms2(REST2, TENTACLE_B, mirror(TENTACLE_B))]
  },
  crownAnchor: { x: 9, y: 0 }
};

// src/pet/species/swift.ts
var BODY7 = [
  "..........oooo....",
  ".........orrrro...",
  "o.......orrrrrro..",
  "oro.....orrrrrrro.",
  ".oro...orrrrrrrro.",
  "..orr.orrrrrrrwwo.",
  "oorrrorrrrrrwwwwo.",
  "orrrrrrrrrrwwwwo..",
  ".ooorrrrrrwwwwo...",
  "....ooooooooo....."
];
var BEAK = ["yy", "y."];
var WING_DOWN = ["...ooooo", "..ohhhho", ".oddddo.", "odddoo..", "ooo....."];
var WING_UP2 = ["....oo..", "..oddo..", ".odddo..", "odddddo.", ".ooooo.."];
var FEET = ["y..y", "yy.yy"];
var flap = (up) => up ? [layer(6, 1, WING_UP2)] : [];
var feet5 = [layer(7, 12, FEET)];
var swift = {
  id: "swift",
  defaultName: "Zippy",
  width: 18,
  height: 14,
  facing: "right",
  palette: {
    o: "#4a1a0f",
    r: "#f05138",
    d: "#c63a24",
    h: "#ff8a6e",
    w: "#fff4ec",
    y: "#f4b73f",
    k: "#1a1a1a",
    p: "#ff9fb0"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    r: "#f6c343",
    d: "#c99a1a",
    h: "#fff1a8"
  },
  body: [layer(0, 2, BODY7), layer(16, 6, BEAK), layer(4, 7, WING_DOWN)],
  eyes: {
    open: [layer(13, 5, ["kw", "kk"])],
    happy: [layer(13, 5, [".k", "k."])],
    closed: [layer(13, 6, ["kk"])],
    sad: [layer(13, 5, ["oo", "kk"])]
  },
  // The beak does the talking: its tip marks the mouth (for treats, kisses and the ball).
  mouths: {
    smile: [layer(16, 7, ["y"])],
    neutral: [layer(16, 7, ["y"])],
    frown: [layer(16, 7, ["y"])]
  },
  blush: [layer(12, 7, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [[...flap(false), ...feet5], [...flap(true), ...feet5]],
    // Hopping from foot to foot.
    idle: [feet5, [layer(7, 12, ["y..y", "yy.y."]), layer(10, 13, ["y"])]],
    hungry: [feet5, feet5],
    sleeping: [feet5, feet5]
  },
  crownAnchor: { x: 12, y: 2 }
};

// src/pet/species/turtle.ts
var SHELL2 = [
  "....ooooo....",
  "..oohhsssoo..",
  ".ohssddddsso.",
  "ohssdssssdsso",
  "ossdssssssdso",
  "osssddddddsso",
  "oeeeeeeeeeeeo",
  ".ooooooooooo."
];
var HEAD8 = [".ooooo.", "ohhgggo", "ogggggo", "ogggggo", "olllllo", ".ooooo."];
var TAIL2 = ["..o", "ogo", "oo."];
var LEG3 = ["oggo", "oGGo", ".oo."];
var legs4 = (back = 4, front = 10) => [layer(back, 9, LEG3), layer(front, 9, LEG3)];
var turtle = {
  id: "turtle",
  defaultName: "Shelly",
  width: 20,
  height: 12,
  facing: "right",
  palette: {
    o: "#13304f",
    s: "#3178c6",
    h: "#86b8ee",
    d: "#1f5596",
    e: "#a8cbf2",
    g: "#9ad3a8",
    G: "#6fb482",
    l: "#c9ecd2",
    k: "#111111",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    s: "#f6c343",
    h: "#fff1a8",
    d: "#c99a1a",
    e: "#fff1a8"
  },
  body: [layer(0, 6, TAIL2), layer(2, 1, SHELL2), layer(13, 2, HEAD8)],
  eyes: {
    open: [layer(16, 3, ["kw", "kk"])],
    happy: [layer(15, 3, [".k.", "k.k"])],
    closed: [layer(16, 4, ["kk"])],
    sad: [layer(16, 3, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(15, 5, ["k..k"]), layer(16, 6, ["kk"])],
    neutral: [layer(16, 6, ["kk"])],
    frown: [layer(16, 5, ["kk"]), layer(15, 6, ["k..k"])]
  },
  blush: [layer(14, 5, ["p"])],
  limbs: {
    // A happy little shuffle.
    happy: [legs4(), legs4(5, 9)],
    // Slow and steady.
    idle: [legs4(), legs4(5, 9)],
    hungry: [legs4(), legs4()],
    // Tucked into its shell.
    sleeping: [[], []]
  },
  crownAnchor: { x: 8, y: 1 }
};

// src/pet/species/index.ts
var SPECIES = { crab, gopher, snake, elephant, chick, turtle, capybara, hedgehog, octopus, snail, fox, swift, squid, otter };
var BY_LANGUAGE = {
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
  "Objective-C": "swift"
};
function speciesForLanguage(language) {
  return language && Object.hasOwn(BY_LANGUAGE, language) ? BY_LANGUAGE[language] : "crab";
}
function isSpecies(id) {
  return !!id && Object.hasOwn(SPECIES, id);
}
function getSpecies(id) {
  return isSpecies(id) ? SPECIES[id] : crab;
}

// src/world/calendar.ts
var HOLIDAYS = [
  "new-year",
  "lunar-new-year",
  "valentines",
  "pi-day",
  "april-fools",
  "programmers-day",
  "mid-autumn",
  "halloween",
  "christmas"
];
var LUNAR_NEW_YEAR = {
  2026: ["02-17", "horse"],
  2027: ["02-06", "goat"],
  2028: ["01-26", "monkey"],
  2029: ["02-13", "rooster"],
  2030: ["02-03", "dog"],
  2031: ["01-23", "pig"],
  2032: ["02-11", "rat"],
  2033: ["01-31", "ox"],
  2034: ["02-19", "tiger"],
  2035: ["02-08", "rabbit"]
};
var MID_AUTUMN = {
  2026: "09-25",
  2027: "09-15",
  2028: "10-03",
  2029: "09-22",
  2030: "09-12",
  2031: "10-01",
  2032: "09-19",
  2033: "09-08",
  2034: "09-27",
  2035: "09-16"
};
var DAY = 864e5;
var utc = (date) => Date.parse(`${date}T00:00:00Z`);
var daysBetween = (a, b) => Math.round((utc(a) - utc(b)) / DAY);
function dayOfYear(date) {
  return daysBetween(date, `${date.slice(0, 4)}-01-01`) + 1;
}
function near(date, table, before, after) {
  const md = table[Number(date.slice(0, 4))];
  if (!md) return false;
  const d = daysBetween(date, `${date.slice(0, 4)}-${md}`);
  return d >= -before && d <= after;
}
function holidayFor(date) {
  const md = date.slice(5);
  if (md === "12-31" || md === "01-01") return "new-year";
  if (md >= "10-25" && md <= "10-31") return "halloween";
  if (md >= "12-18" && md <= "12-26") return "christmas";
  if (md === "02-14") return "valentines";
  if (md === "03-14") return "pi-day";
  if (md === "04-01") return "april-fools";
  if (dayOfYear(date) === 256) return "programmers-day";
  const lny = Object.fromEntries(Object.entries(LUNAR_NEW_YEAR).map(([y, [d]]) => [y, d]));
  if (near(date, lny, 3, 3)) return "lunar-new-year";
  if (near(date, MID_AUTUMN, 1, 1)) return "mid-autumn";
  return null;
}
function zodiacFor(date) {
  return LUNAR_NEW_YEAR[Number(date.slice(0, 4))]?.[1] ?? "dragon";
}
function newYearFor(date) {
  const year = Number(date.slice(0, 4));
  return date.slice(5) === "12-31" ? year + 1 : year;
}

// src/svg/batch.ts
var RectBatch = class {
  rects = /* @__PURE__ */ new Map();
  add(fill, x, y, w, h) {
    const list = this.rects.get(fill) ?? [];
    list.push([x, y, w, h]);
    this.rects.set(fill, list);
    return this;
  }
  toString() {
    return [...this.rects].map(([fill, list]) => {
      const attr = fill.startsWith("var(") ? `style="fill:${fill}"` : `fill="${fill}"`;
      return `<path ${attr} d="${pathData(list)}"/>`;
    }).join("");
  }
};
var num = (n) => String(Math.round(n * 1e3) / 1e3);
function pathData(list) {
  let d = "";
  let px9 = 0;
  let py = 0;
  list.forEach(([x, y, w, h], i) => {
    const abs = `M${num(x)} ${num(y)}`;
    const rel = `m${num(x - px9)} ${num(y - py)}`;
    const move = i === 0 || abs.length <= rel.length ? abs : rel;
    d += `${move}h${num(w)}v${num(h)}h${num(-w)}z`;
    px9 = x;
    py = y;
  });
  return d;
}
var LineBatch = class {
  lines = /* @__PURE__ */ new Map();
  add(color, x, y, w, h) {
    const key = `${color}|${w}`;
    const list = this.lines.get(key) ?? [];
    list.push([x + w / 2, y, h]);
    this.lines.set(key, list);
    return this;
  }
  toString() {
    return [...this.lines].map(([key, list]) => {
      const [color, w] = key.split("|");
      const stroke = color.startsWith("var(") ? `style="stroke:${color}"` : `stroke="${color}"`;
      let d = "";
      let px9 = 0;
      let py = 0;
      list.forEach(([x, y, h], i) => {
        const abs = `M${num(x)} ${num(y)}`;
        const rel = `m${num(x - px9)} ${num(y - py)}`;
        d += `${i === 0 || abs.length <= rel.length ? abs : rel}v${num(h)}`;
        px9 = x;
        py = y + h;
      });
      return `<path ${stroke} stroke-width="${w}" d="${d}"/>`;
    }).join("");
  }
};

// src/svg/pixelfont.ts
var GLYPHS = {
  A: [".x.", "x.x", "xxx", "x.x", "x.x"],
  B: ["xx.", "x.x", "xx.", "x.x", "xx."],
  C: [".xx", "x..", "x..", "x..", ".xx"],
  D: ["xx.", "x.x", "x.x", "x.x", "xx."],
  E: ["xxx", "x..", "xx.", "x..", "xxx"],
  F: ["xxx", "x..", "xx.", "x..", "x.."],
  G: [".xx", "x..", "x.x", "x.x", ".xx"],
  H: ["x.x", "x.x", "xxx", "x.x", "x.x"],
  I: ["xxx", ".x.", ".x.", ".x.", "xxx"],
  J: ["..x", "..x", "..x", "x.x", ".x."],
  K: ["x.x", "x.x", "xx.", "x.x", "x.x"],
  L: ["x..", "x..", "x..", "x..", "xxx"],
  M: ["x...x", "xx.xx", "x.x.x", "x...x", "x...x"],
  N: ["x..x", "xx.x", "x.xx", "x..x", "x..x"],
  O: [".x.", "x.x", "x.x", "x.x", ".x."],
  P: ["xx.", "x.x", "xx.", "x..", "x.."],
  Q: [".x.", "x.x", "x.x", "xx.", ".xx"],
  R: ["xx.", "x.x", "xx.", "x.x", "x.x"],
  S: [".xx", "x..", ".x.", "..x", "xx."],
  T: ["xxx", ".x.", ".x.", ".x.", ".x."],
  U: ["x.x", "x.x", "x.x", "x.x", "xxx"],
  V: ["x.x", "x.x", "x.x", "x.x", ".x."],
  W: ["x...x", "x...x", "x.x.x", "xx.xx", "x...x"],
  X: ["x.x", "x.x", ".x.", "x.x", "x.x"],
  Y: ["x.x", "x.x", ".x.", ".x.", ".x."],
  Z: ["xxx", "..x", ".x.", "x..", "xxx"],
  "0": ["xxx", "x.x", "x.x", "x.x", "xxx"],
  "1": [".x.", "xx.", ".x.", ".x.", "xxx"],
  "2": ["xx.", "..x", ".x.", "x..", "xxx"],
  "3": ["xx.", "..x", ".x.", "..x", "xx."],
  "4": ["x.x", "x.x", "xxx", "..x", "..x"],
  "5": ["xxx", "x..", "xx.", "..x", "xx."],
  "6": [".xx", "x..", "xxx", "x.x", "xxx"],
  "7": ["xxx", "..x", ".x.", ".x.", ".x."],
  "8": ["xxx", "x.x", "xxx", "x.x", "xxx"],
  "9": ["xxx", "x.x", "xxx", "..x", "xx."],
  "!": ["x", "x", "x", ".", "x"],
  "?": ["xx.", "..x", ".x.", "...", ".x."],
  ".": [".", ".", ".", ".", "x"],
  ":": [".", "x", ".", "x", "."],
  "-": ["...", "...", "xxx", "...", "..."],
  "+": ["...", ".x.", "xxx", ".x.", "..."],
  "'": ["x", "x", ".", ".", "."],
  "/": ["..x", "..x", ".x.", "x..", "x.."],
  "<": ["..x", ".x.", "x..", ".x.", "..x"],
  ">": ["x..", ".x.", "..x", ".x.", "x.."],
  ",": [".", ".", ".", "x", "x"],
  "=": ["...", "xxx", "...", "xxx", "..."],
  // Text is upper-cased first, so π arrives as Π.
  "\u03A0": ["xxxxx", ".x.x.", ".x.x.", ".x.x.", "x..x."],
  "\u2665": [".x.x.", "xxxxx", "xxxxx", ".xxx.", "..x.."],
  " ": ["..", "..", "..", "..", ".."]
};
function pixelText(text2) {
  const glyphs = [...text2.toUpperCase()].filter((c) => Object.hasOwn(GLYPHS, c)).map((c) => GLYPHS[c]);
  return Array.from({ length: 5 }, (_, row2) => glyphs.map((g) => g[row2]).join("."));
}
var textWidth = (text2) => pixelText(text2)[0].length;

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

// src/pet/surprises/kit.ts
var round = (n) => Math.round(n * 100) / 100;
function px(grid, palette, x, y, scale) {
  return renderPixels([{ x: 0, y: 0, grid }], palette, { x: round(x), y: round(y), scale });
}
function text(value, x, y, scale, color, shadow3) {
  const grid = pixelText(value);
  return (shadow3 ? px(grid, { x: shadow3 }, x + scale / 2, y + scale / 2, scale) : "") + px(grid, { x: color }, x, y, scale);
}
var textSize = (value, scale) => ({ w: textWidth(value) * scale, h: 5 * scale });
function banner({ text: value, color, shade, ink: ink2 = "#ffffff" }, scene2) {
  const s = 2;
  const t = textSize(value, s);
  const w = t.w + 16;
  const h = 16;
  const x = round(scene2.x + (scene2.w - w) / 2);
  const y = scene2.y + 7;
  const tail2 = (tx, dir) => {
    const outer = tx - dir * 10;
    return `<path d="M${tx} ${y + 4}H${outer}L${outer + dir * 4} ${y + 12}L${outer} ${y + 20}H${tx}Z" fill="${shade}"/>`;
  };
  return `<g class="pf-s-banner">` + tail2(x + 6, 1) + tail2(x + w - 6, -1) + `<path d="M${x} ${y + h}l6 4v-4zM${x + w} ${y + h}l-6 4v-4z" fill="#000" opacity=".35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/><rect x="${x}" y="${y}" width="${w}" height="2" fill="#fff" opacity=".35"/><clipPath id="pf-s-ribbon"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#pf-s-ribbon)"><rect class="pf-s-sheen" style="--w:${w + 30}px" x="${x - 20}" y="${y}" width="8" height="${h}" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>` + text(value, x + 8, y + 3, s, ink2, shade) + `</g>`;
}
function drift(rng, scene2, count2, draw, { fall = scene2.h + 20, sway = 10, seconds = [5, 9], from = scene2.y - 10 } = {}) {
  let out = "";
  for (let i = 0; i < count2; i++) {
    const x = round(scene2.x + 4 + rng() * (scene2.w - 12));
    const t = round(seconds[0] + rng() * (seconds[1] - seconds[0]));
    const delay = round(rng() * t);
    const sx = Math.round((rng() - 0.5) * 2 * sway);
    out += `<g class="pf-s-fall" style="--t:${t}s;--fy:${fall}px;--sx:${sx}px;animation-delay:-${delay}s"><g transform="translate(${x} ${from})">${draw(i)}</g></g>`;
  }
  return out;
}
var KIT_CSS = `
.pf-s-banner{animation:pf-s-banner 3.2s ease-in-out infinite}
@keyframes pf-s-banner{0%,100%{transform:none}50%{transform:translateY(1.5px)}}
.pf-s-sheen{animation:pf-s-sheen 6s ease-in-out infinite}
@keyframes pf-s-sheen{0%,55%{transform:translateX(0) skewX(-20deg)}100%{transform:translateX(var(--w)) skewX(-20deg)}}
.pf-s-fall{animation:pf-s-fall var(--t) linear infinite}
@keyframes pf-s-fall{0%{transform:translate(0,0)}50%{transform:translate(var(--sx),calc(var(--fy)/2))}100%{transform:translate(0,var(--fy))}}
.pf-s-flip{transform-box:fill-box;transform-origin:center;animation:pf-s-flip .9s ease-in-out infinite}
@keyframes pf-s-flip{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.15)}}
.pf-s-blink{animation:pf-s-blink 1.2s steps(1) infinite}
.pf-s-blink2{animation:pf-s-blink 1.2s steps(1) infinite;animation-delay:-.6s}
@keyframes pf-s-blink{0%{opacity:1}50%{opacity:.2}}
.pf-s-swing{transform-box:fill-box;transform-origin:50% 0;animation:pf-s-swing 2.8s ease-in-out infinite alternate}
@keyframes pf-s-swing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
.pf-s-float{animation:pf-s-float 2.6s ease-in-out infinite alternate}
@keyframes pf-s-float{to{transform:translateY(-5px)}}
.pf-s-flicker{animation:pf-s-flicker 1.6s steps(1) infinite}
@keyframes pf-s-flicker{0%{opacity:1}20%{opacity:.6}24%{opacity:1}61%{opacity:.75}66%{opacity:1}}
.pf-s-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-s-twinkle 1.8s ease-in-out infinite}
@keyframes pf-s-twinkle{0%,100%{opacity:.2;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
.pf-s-spark{opacity:0;animation:pf-s-spark 3.6s ease-out infinite}
@keyframes pf-s-spark{0%,8%{transform:translate(0,0);opacity:0}10%{opacity:1}60%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
.pf-s-steam{animation:pf-s-steam 2.4s ease-out infinite}
@keyframes pf-s-steam{0%{transform:translate(0,0);opacity:0}20%{opacity:.8}100%{transform:translate(3px,-14px);opacity:0}}
`;
function fireworks(rng, scene2, colors, count2 = 3) {
  let out = "";
  for (let b = 0; b < count2; b++) {
    const cx = Math.round(scene2.x + 30 + (scene2.w - 60) * (b + rng() * 0.6) / count2);
    const cy = Math.round(scene2.y + 34 + rng() * 26);
    const color = colors[b % colors.length];
    const delay = `animation-delay:-${round(b * 1.2 + rng() * 0.4)}s`;
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2;
      const r2 = 14 + rng() * 8;
      const dx = Math.round(Math.cos(angle) * r2);
      const dy = Math.round(Math.sin(angle) * r2 + 6);
      out += `<rect class="pf-s-spark" style="${delay};--dx:${dx}px;--dy:${dy}px" x="${cx}" y="${cy}" width="2" height="2" fill="${i % 3 ? color : "#fff"}"/>`;
    }
  }
  return out;
}
var CONFETTI = ["#ff5c7a", "#ffd166", "#4cc9f0", "#7dff9b", "#c3a6ff", "#ff9f43"];
function confetti(rng, scene2, count2, colors = CONFETTI) {
  return drift(rng, scene2, count2, (i) => `<rect class="pf-s-flip" style="animation-delay:-${round(rng())}s" width="3" height="4" fill="${colors[i % colors.length]}"/>`, {
    seconds: [4, 7],
    sway: 14
  });
}

// src/pet/behavior.ts
function shiftPupils(grid, dir) {
  return grid.map((row2) => {
    const px9 = [...row2];
    const order = dir === -1 ? px9.keys() : [...px9.keys()].reverse();
    for (const i of order) {
      if (px9[i] === "k" && px9[i + dir] === "w") [px9[i], px9[i + dir]] = [px9[i + dir], px9[i]];
    }
    return px9.join("");
  });
}
function glance(eyes6) {
  for (const dir of [-1, 1]) {
    const moved = eyes6.map((l) => ({ ...l, grid: shiftPupils(l.grid, dir) }));
    if (moved.some((l, i) => l.grid.join() !== eyes6[i].grid.join())) return moved;
  }
  return null;
}
function crossEyes(eyes6, spriteWidth) {
  return eyes6.map((l) => {
    if (!/k/.test(l.grid.join("")) || !/w/.test(l.grid.join(""))) return l;
    const centre = l.x + width(l) / 2;
    return { ...l, grid: shiftPupils(l.grid, centre < spriteWidth / 2 || eyes6.length === 1 ? 1 : -1) };
  });
}
var width = (l) => Math.max(...l.grid.map((r2) => r2.length));
function eyeBoxes(species) {
  const boxes = [];
  for (const l of species.eyes.open) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    l.grid.forEach(
      (row2, y) => [...row2].forEach((c, x) => {
        if (c !== "k" && c !== "w") return;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      })
    );
    if (x1 >= 0) boxes.push({ x: l.x + x0, y: l.y + y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }
  return boxes.sort((a, b) => a.x - b.x);
}
function anchors(species) {
  const eyes6 = species.eyes.open.filter((l) => /[kw]/.test(l.grid.join(""))).map((l) => ({ x: l.x + width(l) / 2, y: l.y + l.grid.length / 2 }));
  const mouthLayers = [species.mouths.smile, species.mouths.neutral, species.mouths.frown].find((m) => m.length) ?? [];
  const mouth = mouthLayers.length ? {
    x: (Math.min(...mouthLayers.map((l) => l.x)) + Math.max(...mouthLayers.map((l) => l.x + width(l)))) / 2,
    y: Math.max(...mouthLayers.map((l) => l.y + l.grid.length))
  } : { x: species.width / 2, y: species.height * 0.7 };
  const top = Math.min(...species.eyes.open.map((l) => l.y));
  return { eyes: eyes6, mouth, top };
}
var GLYPHS2 = {
  question: ["xxx", "..x", ".xx", "...", ".x."],
  note: ["..xx", "..x.", "..x.", "xxx.", "xx.."],
  bang: [".x.", ".x.", ".x.", "...", ".x."]
};
function emoteBubble(emote, x, y, cls, style = "") {
  return bubble(GLYPHS2[emote], x, y, cls, style);
}
function bubble(glyph, x, y, cls, style = "") {
  const w = glyph[0].length * 2 + 8;
  const h = 18;
  return `<g class="${cls}"${style ? ` style="${style}"` : ""}><rect x="${x}" y="${y - h}" width="${w}" height="${h - 4}" rx="4" fill="#ffffff" stroke="#1f2328" stroke-width="1"/><rect x="${x + 3}" y="${y - 5}" width="3" height="3" fill="#ffffff" stroke="#1f2328" stroke-width="1"/>${renderPixels([{ x: 0, y: 0, grid: glyph }], { x: "#1f2328" }, { x: x + 4, y: y - h + 2, scale: 2 })}</g>`;
}
var TRICKS = [
  "dance",
  "twirl",
  "heart-eyes",
  "sneeze",
  "tongue",
  "backflip",
  "moonwalk",
  "dizzy",
  "kiss",
  "juggle",
  "hiccup",
  "magic",
  "jump-rope",
  "selfie",
  "bug-hunt",
  "item-get",
  "bubblegum",
  "sing",
  "laptop",
  "coffee",
  "signature"
];
var SIGNATURE = {
  crab: "bubbles",
  gopher: "dig",
  snake: "hiss",
  elephant: "spray",
  chick: "peck",
  turtle: "zoomies",
  capybara: "yuzu",
  hedgehog: "roll",
  octopus: "ink",
  snail: "slime",
  fox: "pounce",
  swift: "loop",
  squid: "jetup",
  otter: "float"
};
var TRICK_PERIOD = 48;
var TRICK_STARTS = [8.4, 20.4, 32.4, 44.4];
var TRICK_WINDOW = 2.16;
function tricksFor(date, login) {
  const rng = seeded(`trick:${login}:${date}`);
  const pool = TRICKS.filter((t) => t !== "signature");
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks = pool.slice(0, 4);
  if (rng() < 0.7) picks[Math.floor(rng() * 4)] = "signature";
  return picks;
}
var BEHAVIOR_CSS = `
.pf-eo{animation:pf-eo 7s steps(1) infinite}
.pf-eg{opacity:0;animation:pf-eg 7s steps(1) infinite}
.pf-es{opacity:0;animation:pf-es 7s steps(1) infinite}
@keyframes pf-eo{0%{opacity:1}38%{opacity:0}52%{opacity:1}90%{opacity:0}95%{opacity:1}100%{opacity:1}}
@keyframes pf-eg{0%{opacity:0}38%{opacity:1}52%{opacity:0}100%{opacity:0}}
@keyframes pf-es{0%{opacity:0}90%{opacity:1}95%{opacity:0}100%{opacity:0}}
.pf-emote{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-emote 9s ease-out infinite}
@keyframes pf-emote{0%,40%{opacity:0;transform:scale(.3)}43%,51%{opacity:1;transform:scale(1)}54%,100%{opacity:0;transform:scale(1)}}
.pf-emote-fast{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-emote-fast 3.6s ease-out infinite}
@keyframes pf-emote-fast{0%{opacity:0;transform:scale(.3)}8%,40%{opacity:1;transform:scale(1)}50%,100%{opacity:0}}
.pf-stars{transform-box:fill-box;transform-origin:center;animation:pf-orbit-stars 1.2s linear infinite}
@keyframes pf-orbit-stars{from{transform:rotate(0)}to{transform:rotate(360deg)}}
`;
var ANIMS = {
  show: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  late: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}76%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  early: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}77%{opacity:0}100%{opacity:0}" },
  flick: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%,100%{opacity:0}" },
  dance: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "linear", frames: "0%,70%,88%,100%{transform:rotate(0)}72%,76%,80%,84%{transform:rotate(-10deg)}74%,78%,82%,86%{transform:rotate(10deg)}" },
  twirl: { props: "transform-box:fill-box;transform-origin:center", timing: "steps(1)", frames: "0%{transform:scaleX(1)}72%{transform:scaleX(-1)}75%{transform:scaleX(1)}78%{transform:scaleX(-1)}81%{transform:scaleX(1)}100%{transform:scaleX(1)}" },
  sneeze: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,100%{transform:scale(1)}76%{transform:scale(1.05,.88)}79%{transform:scale(.95,1.08)}84%{transform:scale(1)}" },
  peck: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:rotate(0)}73%,79%,85%{transform:rotate(16deg)}76%,82%{transform:rotate(0)}" },
  zoom: { props: "", timing: "ease-in-out", frames: "0%,70%,100%{transform:translateX(0)}75%{transform:translateX(44px)}81%{transform:translateX(-44px)}87%{transform:translateX(0)}" },
  burst: { props: "opacity:0", timing: "ease-out", frames: "0%,71%{transform:translate(0,0);opacity:0}72%,82%{opacity:1}88%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}" },
  backflip: { props: "transform-box:fill-box;transform-origin:center", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.12,.84)}76%{transform:translateY(-34px) rotate(-180deg)}80%{transform:translateY(-8px) rotate(-360deg)}82%{transform:scale(1.14,.82)}85%{transform:none}" },
  moonwalk: { props: "", timing: "linear", frames: "0%,70%,100%{transform:none}72%{transform:translate(-5px,-1px)}74%{transform:translate(-10px,0)}76%{transform:translate(-15px,-1px)}78%{transform:translate(-20px,0)}80%{transform:translate(-25px,-1px)}82%{transform:translate(-30px,0)}86%{transform:translate(-8px,-6px)}88%{transform:none}" },
  dizzy: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,100%{transform:none}71.5%,74.5%{transform:scaleX(-1)}73%,76%{transform:none}78%,82%{transform:rotate(-8deg)}80%,84%{transform:rotate(8deg)}87%{transform:none}" },
  kiss: { props: "opacity:0;transform-box:fill-box;transform-origin:center", timing: "ease-out", frames: "0%,72%{opacity:0;transform:scale(.3)}74%{opacity:1;transform:scale(.6)}86%{opacity:1;transform:translate(34px,-40px) scale(1.7)}88%,100%{opacity:0;transform:translate(34px,-40px) scale(1.7)}" },
  pucker: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,77%,100%{transform:none}72%,74%{transform:scale(.94,1.06) translateY(-2px)}" },
  juggle: { props: "opacity:0", timing: "ease-in-out", frames: "0%,69.9%{opacity:0;transform:none}70%{opacity:1;transform:none}73%{transform:translate(var(--jx),-22px)}76%{transform:none}79%{transform:translate(var(--jx),-22px)}82%{transform:none}85%{transform:translate(var(--jx),-22px)}88%{opacity:1;transform:none}88.1%,100%{opacity:0}" },
  hiccup: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,100%{transform:none}73%{transform:translateY(-7px) scale(.96,1.05)}74.5%{transform:none}78%{transform:translateY(-7px) scale(.96,1.05)}79.5%{transform:none}83%{transform:translateY(-7px) scale(.96,1.05)}84.5%{transform:none}" },
  vanish: { props: "", timing: "steps(1)", frames: "0%{opacity:1}73%{opacity:0}83.5%{opacity:1}100%{opacity:1}" },
  poof: { props: "opacity:0;transform-box:fill-box;transform-origin:center", timing: "ease-out", frames: "0%,72.4%{opacity:0;transform:scale(.2)}73%{opacity:1;transform:scale(1)}77%{opacity:0;transform:scale(1.5)}82.9%{opacity:0;transform:scale(.2)}83.5%{opacity:1;transform:scale(1)}87.5%,100%{opacity:0;transform:scale(1.5)}" },
  tada: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}84%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  hop: { props: "", timing: "ease-in-out", frames: "0%,70%,76%,82%,88%,100%{transform:none}73%,79%,85%{transform:translateY(-10px)}" },
  "rope-up": { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%{opacity:0}100%{opacity:0}" },
  "rope-down": { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}73%{opacity:1}76%{opacity:0}79%{opacity:1}82%{opacity:0}85%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  pose: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}73%,85%{transform:rotate(-7deg) scale(1.04)}" },
  flash: { props: "opacity:0", timing: "ease-out", frames: "0%,77.9%{opacity:0}78%{opacity:.9}81%,100%{opacity:0}" },
  crawl: { props: "opacity:0", timing: "linear", frames: "0%,69.9%{opacity:0;transform:translateX(44px)}70%{opacity:1;transform:translateX(44px)}78%{opacity:1;transform:translateX(0)}79.5%,100%{opacity:0;transform:translateX(0)}" },
  pounce: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,76%,100%{transform:none}77%{transform:scale(1.1,.85)}78.5%{transform:translate(14px,-14px)}80%{transform:translate(20px,0) scale(1.12,.84)}84%{transform:translate(20px,0)}88%{transform:none}" },
  fixed: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}80%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  raise: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.06,.9)}74%,86%{transform:translateY(-4px) scale(.97,1.05)}" },
  lift: { props: "opacity:0", timing: "ease-out", frames: "0%,72.9%{opacity:0;transform:translateY(10px)}73%{opacity:1;transform:translateY(10px)}76%,86%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}" },
  gum: { props: "opacity:0;transform-box:fill-box;transform-origin:0 50%", timing: "ease-in", frames: "0%,71.9%{opacity:0;transform:scale(0)}72%{opacity:1;transform:scale(.2)}82%{opacity:1;transform:scale(1.6)}83%{opacity:1;transform:scale(1.8)}83.1%,100%{opacity:0;transform:scale(1.8)}" },
  pop: { props: "opacity:0", timing: "ease-out", frames: "0%,83%{opacity:0;transform:translate(0,0)}83.2%{opacity:1}88%{opacity:0;transform:translate(var(--dx),var(--dy))}100%{opacity:0}" },
  sway: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}74%,82%{transform:rotate(-5deg)}78%,86%{transform:rotate(5deg)}" },
  roll: { props: "transform-box:fill-box;transform-origin:center", timing: "linear", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(.85,.75)}76%{transform:translateX(-10px) rotate(-180deg) scale(.8)}80%{transform:translateX(-20px) rotate(-360deg) scale(.8)}84%{transform:translateX(-10px) rotate(-540deg) scale(.8)}87%{transform:rotate(-720deg) scale(.85)}" },
  jet: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.1,.85)}75%{transform:translate(-16px,-18px) scale(.9,1.1)}81%{transform:translate(-20px,-10px)}86%{transform:translate(-8px,-2px)}" },
  inch: { props: "transform-box:fill-box;transform-origin:0 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}73%,79%,85%{transform:scaleX(1.18)}76%,82%{transform:scaleX(.9)}" },
  pounce2: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:translateY(3px) scale(1.06,.9)}76%{transform:translate(8px,-30px) rotate(25deg)}80%{transform:translate(14px,-14px) rotate(70deg)}83%{transform:translate(16px,2px) rotate(90deg) scale(1,.8)}86%{transform:translate(8px,0) rotate(20deg)}" },
  loop: { props: "transform-box:fill-box;transform-origin:center", timing: "linear", frames: "0%,70%,88%,100%{transform:none}73%{transform:translateY(-12px)}77%{transform:translate(-8px,-28px) rotate(-120deg)}81%{transform:translate(-2px,-32px) rotate(-240deg)}85%{transform:translate(4px,-14px) rotate(-360deg)}" },
  jetup: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-out", frames: "0%,70%,88%,100%{transform:none}72%{transform:scale(1.1,.85)}75%{transform:translateY(-32px) scale(.85,1.2)}80%{transform:translateY(-28px)}85%{transform:translateY(-8px)}" },
  belly: { props: "transform-box:fill-box;transform-origin:center", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}73%,85%{transform:rotate(180deg) scaleX(-1) translateY(-2px)}79%{transform:rotate(180deg) scaleX(-1) translateY(-5px)}" },
  type: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "steps(1)", frames: "0%,70%,88%,100%{transform:none}72%,76%,80%,84%{transform:translateY(1px)}74%,78%,82%,86%{transform:none}" },
  line1: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}72%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  line2: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}75%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  line3: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}78%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  pushed: { props: "opacity:0", timing: "steps(1)", frames: "0%{opacity:0}81%{opacity:1}88%{opacity:0}100%{opacity:0}" },
  sip: { props: "transform-box:fill-box;transform-origin:50% 100%", timing: "ease-in-out", frames: "0%,70%,88%,100%{transform:none}76%,82%{transform:rotate(-6deg) translateY(-1px)}" },
  steam: { props: "opacity:0", timing: "ease-out", frames: "0%,70%{opacity:0;transform:translate(0,0)}73%{opacity:.9}88%{opacity:0;transform:translate(var(--dx),-16px)}100%{opacity:0}" },
  note: { props: "opacity:0", timing: "ease-out", frames: "0%,70%{opacity:0;transform:translate(0,0)}72%{opacity:1}88%{opacity:0;transform:translate(var(--dx),-30px)}100%{opacity:0}" }
};
var r3 = (n) => +n.toFixed(3);
function windowed(frames2, start) {
  const g0 = start / TRICK_PERIOD * 100;
  const g1 = (start + TRICK_WINDOW) / TRICK_PERIOD * 100;
  const map = (p) => p <= 70 ? p / 70 * g0 : p <= 88 ? g0 + (p - 70) / 18 * (g1 - g0) : g1 + (p - 88) / 12 * (100 - g1);
  return frames2.replace(/([\d.]+)%/g, (_, p) => `${r3(map(Number(p)))}%`);
}
var fan = (n, spread, rise) => Array.from({ length: n }, (_, i) => ({ dx: Math.round((i / (n - 1) - 0.5) * spread), dy: -rise - i % 2 * 6, delay: i % 3 * 0.15 }));
function trickLayers(trick, species, scale, slot = 0) {
  const start = TRICK_STARTS[slot % TRICK_STARTS.length];
  const css = /* @__PURE__ */ new Map();
  const k = (anim) => {
    const cls = `pf-k${slot}-${anim}`;
    if (!css.has(cls)) {
      const { props: props2, timing, frames: frames2 } = ANIMS[anim];
      css.set(cls, `.${cls}{${props2 ? `${props2};` : ""}animation:${cls} ${TRICK_PERIOD}s ${timing} var(--pf-t0,0s) infinite}@keyframes ${cls}{${windowed(frames2, start)}}`);
    }
    return cls;
  };
  const burst = (from, color, size, particles2, round3 = false, anim = "burst") => particles2.map(
    (p) => `<rect class="${k(anim)}" style="--dx:${p.dx}px;--dy:${p.dy}px;animation-delay:calc(var(--pf-t0,0s) + ${p.delay}s)" x="${from.x - size / 2}" y="${from.y - size / 2}" width="${size}" height="${size}"${round3 ? ` rx="${size / 2}" fill="none" stroke="${color}" stroke-width="1"` : ` fill="${color}"`}/>`
  ).join("");
  const px9 = (grid, palette, x, y, s) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale: s });
  const a = anchors(species);
  const at2 = (p) => ({ x: p.x * scale, y: p.y * scale });
  const mouth = at2(a.mouth);
  const w = species.width * scale;
  const h = species.height * scale;
  const top = a.top * scale;
  const layers = (bodyClass, overlay = "", under = "", beside = "") => ({ bodyClass, overlay, under, beside, css: [...css.values()].join("\n") });
  const say = (text2, cls) => bubble(pixelText(text2), w - 6, top - 2, k(cls));
  switch (trick) {
    case "dance": {
      const body = k("dance");
      return layers(body, emoteBubble("note", w - 6, top - 2, k("show")));
    }
    case "twirl":
      return layers(k("twirl"));
    case "heart-eyes": {
      const hs = Math.max(1, Math.round(scale * 0.75));
      const hearts = a.eyes.map((e) => at2(e)).map((e) => px9(HEART, FX_PALETTE, e.x - 5 * hs / 2, e.y - 2 * hs, hs)).join("");
      return layers("", `<g class="${k("show")}">${hearts}</g>`);
    }
    case "sneeze": {
      const body = k("sneeze");
      return layers(body, emoteBubble("bang", w - 6, top - 2, k("show")) + burst(mouth, "#8ec5ea", Math.max(2, scale * 0.75), fan(5, 50, 6)));
    }
    case "tongue":
      return layers("", `<rect class="${k("show")}" x="${mouth.x - scale}" y="${mouth.y}" width="${2 * scale}" height="${2 * scale}" rx="${scale / 2}" fill="#e63946"/>`);
    case "backflip":
      return layers(k("backflip"));
    case "moonwalk": {
      const body = k("moonwalk");
      return layers(body, emoteBubble("note", w - 6, top - 2, k("show")));
    }
    case "dizzy": {
      const star = ["..y..", ".yyy.", "..y.."];
      const stars = [0, 1, 2].map((i) => {
        const angle = i / 3 * Math.PI * 2;
        return px9(star, { y: "#ffd43b" }, w / 2 + Math.cos(angle) * 16 - 7.5, top - 6 + Math.sin(angle) * 5 - 4.5, 3);
      }).join("");
      const body = k("dizzy");
      return layers(body, `<g class="${k("late")}"><g class="pf-stars">${stars}</g></g>`);
    }
    case "kiss": {
      const body = k("pucker");
      return layers(body, `<g class="${k("kiss")}">${px9(HEART, FX_PALETTE, mouth.x - 5, mouth.y - 6, 2)}</g>`);
    }
    case "juggle": {
      const balls = ["#ff6b6b", "#ffd43b", "#4dabf7"].map((color, i) => {
        const x = w / 2 + (i - 1) * 12 - 4;
        return `<rect class="${k("juggle")}" style="--jx:${(1 - i) * 12}px;animation-delay:calc(var(--pf-t0,0s) + ${i * 0.36}s)" x="${x}" y="${top - 10}" width="8" height="8" rx="4" fill="${color}" stroke="#1f2328" stroke-width="1"/>`;
      }).join("");
      return layers("", balls);
    }
    case "hiccup": {
      const body = k("hiccup");
      return layers(body, "", "", say("HIC!", "show"));
    }
    case "magic": {
      const body = k("vanish");
      const puffs = [[0.5, 0.5, 7], [0.2, 0.35, 5], [0.8, 0.35, 5], [0.3, 0.8, 5], [0.7, 0.8, 5]].map(([fx2, fy, r2]) => `<circle class="${k("poof")}" cx="${w * fx2}" cy="${h * fy}" r="${r2 * (scale / 2)}" fill="#e9ecef" stroke="#adb5bd" stroke-width="1"/>`).join("");
      return layers(body, "", "", puffs + say("TA-DA!", "tada"));
    }
    case "jump-rope": {
      const body = k("hop");
      const s = scale;
      const rope = (y, cls) => `<path class="${cls}" d="M${-2 * s} ${h * 0.55}Q${w / 2} ${y} ${w + 2 * s} ${h * 0.55}" fill="none" stroke="#8a5a33" stroke-width="2"/>`;
      return layers(body, rope(h + 4 * s, k("rope-down")), rope(-4 * s, k("rope-up")));
    }
    case "selfie": {
      const body = k("pose");
      const flash = `<rect class="${k("flash")}" x="${-w * 2}" y="${-h * 3}" width="${w * 5}" height="${h * 5}" fill="#ffffff"/>`;
      return layers(body, "", "", say("CHEESE", "early") + flash);
    }
    case "bug-hunt": {
      const bug = px9(["k.k.k", ".ggg.", "gGgGg", ".ggg.", "k.k.k"], { k: "#1f2328", g: "#2f9e44", G: "#8ce99a" }, w / 2 + 16, h - 15, 3);
      const body = k("pounce");
      return layers(body, "", "", `<g class="${k("crawl")}">${bug}</g>` + bubble(pixelText("FIXED!"), w + 6, top - 2, k("fixed")));
    }
    case "item-get": {
      const body = k("raise");
      const cs = Math.max(2, scale);
      const item = px9(COMMIT, FX_PALETTE, w / 2 - 2 * cs, top - 6 * cs, cs);
      const sparkles = [[-3, 0], [5, -1], [-2, -4], [4.5, -4.5]].map(([dx, dy]) => px9(["..s..", ".sss.", "..s.."], FX_PALETTE, w / 2 + dx * cs - 5, top - 5 * cs + dy * cs, 2)).join("");
      return layers(body, `<g class="${k("lift")}">${item}${sparkles}</g>`);
    }
    case "bubblegum": {
      const r2 = 2 * scale;
      const gum = `<circle class="${k("gum")}" cx="${mouth.x + r2}" cy="${mouth.y - scale}" r="${r2}" fill="#ff8fc7" stroke="#e64980" stroke-width="1"/>`;
      return layers("", gum + burst({ x: mouth.x + 3 * r2, y: mouth.y - scale }, "#ff8fc7", Math.max(2, scale / 2), fan(6, 40, 10), false, "pop"));
    }
    case "sing": {
      const body = k("sway");
      const notes = [0, 1, 2].map((i) => `<g class="${k("note")}" style="--dx:${6 + i * 6}px;animation-delay:calc(var(--pf-t0,0s) + ${i * 0.45}s)">${px9(["..xx", "..x.", "..x.", "xxx.", "xx.."], { x: "#1f2328" }, mouth.x + 4, mouth.y - 10, 2)}</g>`).join("");
      const open = `<rect class="${k("show")}" x="${mouth.x - scale}" y="${mouth.y - scale}" width="${2 * scale}" height="${2 * scale}" rx="${scale}" fill="#3b1d1d"/>`;
      return layers(body, open, "", notes);
    }
    case "laptop": {
      const lx = w / 2 - 22;
      const ly = h - 20;
      const laptop = new RectBatch().add("#343a40", lx, ly, 44, 16).add("#0b1a12", lx + 3, ly + 3, 38, 11).add("#adb5bd", lx - 6, ly + 16, 56, 4).add("#868e96", lx - 6, ly + 19, 56, 1);
      const line = (n, y, parts) => `<g class="${k(`line${n}`)}">${parts.map(([x, lw, c]) => `<rect x="${lx + 5 + x}" y="${ly + y}" width="${lw}" height="2" fill="${c}"/>`).join("")}</g>`;
      const code = line(1, 5, [[0, 8, "#69db7c"], [10, 14, "#e9ecef"]]) + line(2, 8, [[4, 6, "#74c0fc"], [12, 18, "#ffd43b"]]) + line(3, 11, [[4, 12, "#e9ecef"], [18, 6, "#ff8787"]]);
      const glow = `<rect class="${k("show")}" x="${lx + 3}" y="${ly + 3}" width="38" height="11" fill="#69db7c" opacity=".12"/>`;
      return layers(k("type"), "", "", `<g class="${k("show")}">${laptop}</g>${glow}${code}` + bubble(pixelText("PUSHED!"), w - 6, top - 2, k("pushed")));
    }
    case "coffee": {
      const mx = w * 0.62;
      const my = mouth.y - 2;
      const mug = px9(outlined(["mccm..", "mmmmm.", "mmmm.m", "mmmmm.", ".mm..."]), { m: "#f1f3f5", c: "#6b4226", o: "#495057" }, mx, my, 2);
      const steam = [0, 1, 2].map((i) => `<rect class="${k("steam")}" style="--dx:${(i - 1) * 3}px;animation-delay:calc(var(--pf-t0,0s) + ${i * 0.3}s)" x="${mx + 3 + i * 3}" y="${my - 3}" width="2" height="4" rx="1" fill="#e9ecef"/>`).join("");
      return layers(k("sip"), "", "", `<g class="${k("show")}">${mug}</g>${steam}` + say("AAH", "late"));
    }
    case "signature":
      return signature(SIGNATURE[species.id] ?? "bubbles");
  }
  function signature(move) {
    switch (move) {
      case "bubbles":
        return layers("", burst(mouth, "#dff4ff", 2 * scale, fan(4, 30, 34), true));
      case "dig":
        return layers(k("sneeze"), burst({ x: w / 2, y: h - scale }, "#7a5230", scale, fan(6, 70, 14)));
      case "hiss": {
        const fork = new RectBatch().add("#e63946", mouth.x - scale / 2, mouth.y, scale, 2 * scale).add("#e63946", mouth.x - 1.5 * scale, mouth.y + 2 * scale, scale, scale).add("#e63946", mouth.x + 0.5 * scale, mouth.y + 2 * scale, scale, scale);
        return layers("", `<g class="${k("flick")}">${fork}</g>`);
      }
      case "spray":
        return layers("", burst({ x: w / 2, y: h - 2 * scale }, "#4ea8de", Math.max(2, scale), fan(7, 96, 84)));
      case "peck": {
        const seeds = new RectBatch();
        for (const dx of [-3, 2, 6]) seeds.add("#e9c46a", w / 2 + dx * scale, h - scale / 2, scale / 2 + 1, scale / 2 + 1);
        const body = k("peck");
        return layers(body, `<g class="${k("show")}">${seeds}</g>`);
      }
      case "yuzu": {
        const yuzu = px9(outlined([".l.", "yyy", "yYy", ".y."]), { y: "#fcc419", Y: "#ffe066", l: "#51cf66", o: "#8a6a00" }, (species.crownAnchor.x - 2.5) * scale, (species.crownAnchor.y - 5) * scale, scale);
        return layers("", `<g class="${k("lift")}">${yuzu}</g>`);
      }
      case "roll":
        return layers(k("roll"));
      case "ink":
        return layers(k("jet"), "", "", burst({ x: w / 2, y: h - scale }, "#2b2140", scale * 1.5, fan(6, 44, 4)));
      case "slime": {
        const trail = new RectBatch();
        for (let i = 0; i < 5; i++) trail.add(i % 2 ? "#e7f5ff" : "#b6e0f5", -i * 3 * scale - 2 * scale, h - scale, 2 * scale, scale / 2 + 1);
        return layers(k("inch"), "", `<g class="${k("show")}">${trail}</g>`);
      }
      case "pounce":
        return layers(k("pounce2"), "", "", burst({ x: w / 2 + 14, y: h - scale }, "#e9e3d5", scale, fan(6, 50, 12)));
      case "loop":
        return layers(k("loop"));
      case "jetup":
        return layers(k("jetup"), "", "", burst({ x: w / 2, y: h }, "#d0ebff", scale, fan(5, 30, -6)));
      case "float": {
        const pebble = px9(outlined(["ss", "sS"]), { s: "#adb5bd", S: "#dee2e6", o: "#495057" }, w / 2 - 2 * scale, -2 * scale, scale);
        return layers(k("belly"), "", "", `<g class="${k("show")}">${pebble}</g>`);
      }
      case "zoomies": {
        const lines = new RectBatch();
        for (const y of [0.35, 0.55, 0.75]) lines.add("#8d96a0", -4 * scale, h * y, 3 * scale, Math.max(1, scale / 2));
        const body = k("zoom");
        return layers(body, `<g class="${k("show")}">${lines}</g>`);
      }
    }
  }
}
var playful = (mood) => mood === "happy" || mood === "idle";

// src/pet/surprises/wear.ts
var SANTA_HAT = {
  grid: [
    "....rrrr.....",
    "..rrrrrrrr...",
    ".rrRrrrrrrr..",
    ".rRrrrrrr.rr.",
    ".rrrrrrrr..ww",
    "rrrrrrrrr..ww",
    "wwwwwwwwww...",
    "wwWwwwWwww..."
  ],
  palette: { r: "#e03131", R: "#ff6b6b", w: "#ffffff", W: "#dfe6ee" },
  cx: 5,
  sink: 2
};
var WITCH_HAT = {
  grid: [
    "........kk...",
    ".......kkk...",
    "......kkk....",
    ".....kKkk....",
    ".....kKkkk...",
    "....kKkkkk...",
    "....oooyoo...",
    "kkkkkkkkkkkkk"
  ],
  palette: { k: "#3d2a5c", K: "#6a4c93", o: "#f28c28", y: "#ffd166" },
  cx: 6.5,
  sink: 1
};
var TOP_HAT = {
  grid: [
    "..kkkkk..",
    "..kKkkk..",
    "..kKkkk..",
    "..kKkkk..",
    "..yyyyy..",
    "kkkkkkkkk"
  ],
  palette: { k: "#1f2328", K: "#4b5563", y: "#ffd166" },
  sink: 1
};
var PARTY_HAT = {
  grid: [
    "...w...",
    "..wWw..",
    "...p...",
    "..pyp..",
    "..ypy..",
    ".pypyp.",
    ".ypypy.",
    "pypypyp"
  ],
  palette: { p: "#ff5c9a", y: "#ffd166", w: "#ffffff", W: "#4cc9f0" },
  sink: 1
};
function glasses(species, scale, look) {
  const eyes6 = eyeBoxes(species);
  if (!eyes6.length) return "";
  const s = scale;
  const out = [];
  const frame = look === "shades" ? "#111418" : "#1f2328";
  const lenses = eyes6.map((e) => ({ x: (e.x - 0.5) * s, y: (e.y - 0.25) * s, w: (e.w + 1) * s, h: (e.h + 0.5) * s }));
  const lw = Math.max(1, s / 2);
  for (const l of lenses) {
    if (look === "shades") {
      out.push(`<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${s / 2}" fill="${frame}"/>`);
      out.push(`<rect class="pf-s-glint" x="${l.x + s / 2}" y="${l.y + s / 2}" width="${Math.max(1, s / 2)}" height="${Math.max(1, s / 2)}" fill="#ffffff"/>`);
    } else {
      out.push(`<rect x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" rx="${s / 3}" fill="#ffffff" fill-opacity=".18" stroke="${frame}" stroke-width="${lw}"/>`);
    }
  }
  const first = lenses[0];
  const last = lenses[lenses.length - 1];
  if (lenses.length > 1) {
    const bx = first.x + first.w;
    const by = first.y + s / 2;
    out.push(`<rect x="${bx}" y="${by}" width="${last.x - bx}" height="${lw}" fill="${frame}"/>`);
    if (look === "nerd") out.push(`<rect x="${round(bx + (last.x - bx) / 2 - s / 2)}" y="${by - s / 3}" width="${s}" height="${lw + 2 * s / 3}" fill="#f4f1e8"/>`);
  } else {
    out.push(`<rect x="${first.x - 3 * s}" y="${first.y + s / 2}" width="${3 * s}" height="${lw}" fill="${frame}"/>`);
  }
  if (look === "disguise") {
    const a = anchors(species);
    const side = lenses.length === 1;
    for (const l of lenses) out.push(`<rect x="${l.x}" y="${l.y - s}" width="${l.w}" height="${s * 0.75}" fill="#2b1b12"/>`);
    const nx = side ? last.x + last.w - s / 2 : (first.x + last.x + last.w) / 2 - 1.25 * s;
    const ny = first.y + first.h - s / 2;
    out.push(`<rect x="${round(nx)}" y="${round(ny)}" width="${2.5 * s}" height="${2 * s}" rx="${s}" fill="#f4a3a3"/>`);
    out.push(`<rect x="${round(nx + s / 2)}" y="${round(ny + s / 3)}" width="${s * 0.75}" height="${s / 2}" fill="#fff" opacity=".6"/>`);
    const mx = side ? nx - s / 2 : a.mouth.x * s - 2.5 * s;
    const my = Math.max(ny + 2 * s, (a.mouth.y - 1.5) * s);
    out.push(`<path d="M${round(mx)} ${round(my + s)}q${1.25 * s} ${-1.5 * s} ${2.5 * s} 0q${1.25 * s} ${-1.5 * s} ${2.5 * s} 0v${s / 2}q${-1.25 * s} ${-s / 2} ${-2.5 * s} 0q${-1.25 * s} ${-s / 2} ${-2.5 * s} 0z" fill="#2b1b12"/>`);
  }
  return out.join("");
}
function heldAt(species, scale, grid, palette, cls = "") {
  const s = Math.max(2, Math.round(scale * 3 / 4));
  const w = grid[0].length * s;
  const h = grid.length * s;
  const x = species.width * scale - w / 2;
  const y = species.height * scale - h - scale;
  const svg = `<g${cls ? ` class="${cls}"` : ""}>${px(grid, palette, x, y, s)}</g>`;
  return { svg, x, y, w, h };
}
var RED_ENVELOPE = ["rrrrr", "rdddr", "rrdrr", "ryyyr", "rryrr", "rrrrr", "rrrrr"];
var RED_ENVELOPE_PALETTE = { r: "#e03131", d: "#b02525", y: "#ffd166" };
var CANDY_PAIL = [".k..k.", "..kk..", "oooooo", "oyoyoo", "oooyoo", "oyyyoo", ".oooo."];
var CANDY_PAIL_PALETTE = { k: "#3b2a1a", o: "#f28c28", y: "#3b1d00" };
var COFFEE = ["cccc..", "bbbbb.", "bbbb.b", "bwbbb.", "bbbb..", ".bb..."];
var COFFEE_PALETTE = { c: "#6f4e37", b: "#2f81f7", w: "#ffffff" };

// src/pet/surprises/holidays.ts
var TREE = [
  ".....g.....",
  "....ggg....",
  "...gggGg...",
  "....ggg....",
  "...ggggg...",
  "..gggggGg..",
  "...ggggg...",
  "..ggggggg..",
  ".gggggggGg.",
  "ggggggggggg",
  ".....b.....",
  ".....b....."
];
var STAR = ["..y..", ".yyy.", "yyyyy", ".y.y."];
var LIGHTS = [[5, 1], [4, 3], [6, 5], [3, 5], [5, 7], [2, 8], [7, 8], [4, 9], [8, 9], [1, 9]];
var XMAS = ["#ff4d4d", "#ffd166", "#7dd3fc", "#ff9ff3"];
var GIFT_RED = ["..y..y..", "...yy...", "rrryyrrr", "rrryyrrr", "yyyyyyyy", "rrryyrrr", "rrryyrrr"];
var GIFT_BLUE = [".w..w.", "..ww..", "bbwwbb", "wwwwww", "bbwwbb", "bbwwbb"];
function christmas(c) {
  const { scene: sc } = c;
  const s = 4;
  const tx = sc.x + 6;
  const ty = sc.ground - TREE.length * s + 2;
  const lights = LIGHTS.map(
    ([col, row2], i) => `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${tx + col * s}" y="${ty + row2 * s}" width="${s - 1}" height="${s - 1}" fill="${XMAS[i % XMAS.length]}"/>`
  ).join("");
  const star = `<g class="pf-s-twinkle">${px(STAR, { y: "#ffd23f" }, tx + 5.5 * s - 7.5, ty - 4 * 3 + 2, 3)}</g>`;
  const back = px(TREE, { g: "#2b8a3e", G: "#51cf66", b: "#7a4a24" }, tx, ty, s) + lights + star + px(GIFT_RED, { r: "#e03131", y: "#ffd166" }, tx + 40, sc.ground - 17, 3) + px(GIFT_BLUE, { b: "#4c6ef5", w: "#ffffff" }, tx + 22, sc.ground - 13, 3);
  const snow = drift(c.rng, sc, 12, () => `<rect width="2" height="2" fill="#ffffff" opacity=".9"/>`, { seconds: [7, 11], sway: 8 });
  return {
    back,
    front: snow,
    hat: SANTA_HAT,
    banner: { text: "MERRY CHRISTMAS", color: "#c92a2a", shade: "#6b1010" },
    line: "Merry Christmas! \xB7 ho ho ho"
  };
}
var PUMPKIN = ["....gg...", "..ooooo..", ".ooOoOoo.", "ooOooooOo", "ooOooooOo", "ooOooooOo", ".ooOoOoo.", "..ooooo.."];
var PUMPKIN_FACE = [".........", ".........", ".........", "..y...y..", ".yy...yy.", "....y....", ".y.y.y.y.", "..yyyyy.."];
var GHOST = ["..www..", ".wwwww.", "wwkwkww", "wwwwwww", "wwwkwww", "wwwwwww", "wwwwwww", "w.ww.ww"];
var BAT_UP = "M0 0L3 2L5 1L7 2L10 0L8 4L5 3L2 4Z";
var BAT_DOWN = "M0 4L3 2L5 1L7 2L10 4L8 3L5 4L2 3Z";
function halloween(c) {
  const { scene: sc } = c;
  const g = sc.ground;
  const moon2 = `<circle cx="${sc.x + 34}" cy="${sc.y + 50}" r="17" fill="#ffb347" opacity=".25"/><circle cx="${sc.x + 34}" cy="${sc.y + 50}" r="12" fill="#ffc46b"/><circle cx="${sc.x + 30}" cy="${sc.y + 47}" r="2" fill="#f0a63c"/><circle cx="${sc.x + 38}" cy="${sc.y + 54}" r="3" fill="#f0a63c"/>`;
  const bat = (x, y, d) => `<g transform="translate(${x} ${y})"><path class="pf-fa" style="animation-duration:.5s;animation-delay:-${d}s" d="${BAT_UP}"/><path class="pf-fb" style="animation-duration:.5s;animation-delay:-${d}s" d="${BAT_DOWN}"/></g>`;
  const bats2 = `<g class="pf-s-bats" fill="#1a0f24">${bat(0, sc.y + 40, 0)}${bat(16, sc.y + 50, 0.2)}${bat(30, sc.y + 36, 0.1)}${bat(48, sc.y + 46, 0.3)}</g>`;
  const px0 = sc.x + sc.w - 40;
  const pumpkin2 = px(PUMPKIN, { o: "#f28c28", O: "#c9621a", g: "#3f7d3a" }, px0, g - 22, 3) + `<g class="pf-s-flicker">${px(PUMPKIN_FACE, { y: "#ffe066" }, px0, g - 22, 3)}</g>`;
  const ghost = `<g class="pf-s-ghost" opacity="0">${px(GHOST, { w: "#f8f9fa", k: "#343a40" }, sc.x + 14, g - 50, 3)}</g>`;
  const held = heldAt(c.species, c.scale, CANDY_PAIL, CANDY_PAIL_PALETTE);
  return {
    css: `.pf-s-bats{animation:pf-s-bats 13s linear infinite}
@keyframes pf-s-bats{from{transform:translateX(${sc.x + sc.w + 10}px)}to{transform:translateX(${sc.x - 70}px)}}
.pf-s-ghost{animation:pf-s-ghost 9s ease-in-out infinite}
@keyframes pf-s-ghost{0%,20%{opacity:0;transform:translate(0,8px)}35%{opacity:.85;transform:translate(4px,-4px)}55%{opacity:.85;transform:translate(10px,0)}72%{opacity:.85;transform:translate(4px,-6px)}85%,100%{opacity:0;transform:translate(0,8px)}}`,
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${g - sc.y}" fill="#3b1a5a" opacity=".35"/>${moon2}${bats2}${ghost}${pumpkin2}`,
    hat: WITCH_HAT,
    held: held.svg,
    banner: { text: "TRICK OR TREAT", color: "#e8590c", shade: "#5c2200" },
    line: "Trick or treat! \xB7 spooky season"
  };
}
function newYear(c) {
  const year = newYearFor(c.state.date);
  return {
    back: fireworks(c.rng, c.scene, ["#ff5c7a", "#ffd166", "#4cc9f0", "#c3a6ff"], 4),
    front: confetti(c.rng, c.scene, 22),
    hat: TOP_HAT,
    banner: { text: `HAPPY ${year}`, color: "#b8860b", shade: "#4d3800" },
    line: `Happy New Year! \xB7 hello ${year}`
  };
}
var LANTERN = [
  "...yy...",
  ".yyyyyy.",
  ".rrrrrr.",
  "hrrrrrrd",
  "hrrrrrrd",
  "hrryyrrd",
  "hryyyyrd",
  "hrryyrrd",
  "hrrrrrrd",
  ".rrrrrr.",
  ".yyyyyy.",
  "...yy...",
  "..y..y..",
  "..y..y..",
  "..y..y.."
];
var LANTERN_PALETTE = { r: "#e63946", h: "#ff6b6b", d: "#b5202e", y: "#ffd166" };
var COIN = [".yyy.", "yYyYy", "yy.yy", "yYyYy", ".yyy."];
var CRACKER = ["y", "r", "r", "r", "y"];
function lunarNewYear(c) {
  const { scene: sc } = c;
  const animal = zodiacFor(c.state.date);
  const lantern2 = (x, string, delay) => `<g class="pf-s-swing" style="animation-delay:-${delay}s"><rect x="${x + 11}" y="${sc.y}" width="1" height="${string}" fill="#5b4636"/>${px(LANTERN, LANTERN_PALETTE, x, sc.y + string, 3)}</g>`;
  const crackers = new RectBatch();
  const cx = sc.x + 8;
  const cy = sc.ground + 8;
  for (let i = 0; i < 7; i++) crackers.add("#8a5a33", cx + i * 5, cy + i % 2, 5, 1);
  let pops = "";
  for (let i = 0; i < 7; i++) {
    pops += px(CRACKER, { y: "#ffd166", r: "#e03131" }, cx + i * 5 + 1, cy - 4 + i % 2, 2);
    if (i % 2 === 0) {
      const d = round(i * 0.35);
      for (const [dx, dy] of [[-6, -8], [0, -12], [6, -8], [-4, -3], [4, -3]]) {
        pops += `<rect class="pf-s-spark" style="animation-duration:1.4s;animation-delay:-${d}s;--dx:${dx}px;--dy:${dy}px" x="${cx + i * 5 + 1}" y="${cy - 6}" width="2" height="2" fill="${dy < -6 ? "#ffd166" : "#ff6b6b"}"/>`;
      }
    }
  }
  const coins = drift(c.rng, sc, 8, () => px(COIN, { y: "#ffd23f", Y: "#e0a800" }, 0, 0, 1.6), { seconds: [6, 10], sway: 6 });
  return {
    back: lantern2(sc.x + 6, 34, 0) + lantern2(sc.x + sc.w - 30, 40, 1.2) + crackers + pops,
    front: coins,
    held: heldAt(c.species, c.scale, RED_ENVELOPE, RED_ENVELOPE_PALETTE, "pf-s-float").svg,
    banner: { text: `YEAR OF THE ${animal}`, color: "#c92a2a", shade: "#5c0a0a", ink: "#ffd166" },
    line: `Lunar New Year \xB7 year of the ${animal}`
  };
}
var RABBIT = [".x.x...", ".x.x...", ".xxx...", "xxxxxx.", ".xxxxxx", "..x..x."];
var MOONCAKE = ["..cccccccc..", ".cCcCcCcCcc.", ".cccCCCCccc.", ".dddddddddd.", ".dddddddddd.", "wwwwwwwwwwww", ".wwwwwwwwww."];
var ROUND_LANTERN = ["..yy..", ".oooo.", "oOoooo", "oOoooo", ".oooo.", "..yy..", "..y..."];
function midAutumn(c) {
  const { scene: sc } = c;
  const mx = sc.x + sc.w - 38;
  const my = sc.y + 60;
  const moon2 = `<circle cx="${mx}" cy="${my}" r="30" fill="#fff4c2" opacity=".12"/><circle cx="${mx}" cy="${my}" r="25" fill="#fff4c2" opacity=".22"/><circle cx="${mx}" cy="${my}" r="20" fill="#fff1b8"/><circle cx="${mx - 9}" cy="${my - 8}" r="3" fill="#f5e08f"/><circle cx="${mx + 10}" cy="${my + 6}" r="4" fill="#f5e08f"/>` + px(RABBIT, { x: "#e3c86b" }, mx - 6, my - 3, 2);
  const lantern2 = (x, y, d) => `<g class="pf-s-swing" style="animation-delay:-${d}s"><rect x="${x + 5}" y="${sc.y}" width="1" height="${y - sc.y}" fill="#5b4636"/><g class="pf-s-flicker" style="animation-delay:-${d}s">${px(ROUND_LANTERN, { o: "#ff922b", O: "#ffc078", y: "#ffd43b" }, x, y, 2)}</g></g>`;
  const cake2 = px(MOONCAKE, { c: "#d99a4e", C: "#a8652a", d: "#c07f3a", w: "#f1f3f5" }, sc.x + 12, sc.ground - 12, 2);
  return {
    back: moon2 + lantern2(sc.x + 10, sc.y + 40, 0) + lantern2(sc.x + 30, sc.y + 50, 0.8) + cake2,
    banner: { text: "HAPPY MID-AUTUMN", color: "#e8590c", shade: "#6b2500", ink: "#fff3bf" },
    line: "Mid-Autumn \xB7 mooncakes & a full moon"
  };
}
var BALLOON = [".rr.rr.", "rhrrrrr", "rhrrrrr", ".rrrrr.", "..rrr..", "...r..."];
function valentines(c) {
  const { scene: sc, species, scale } = c;
  const w = species.width * scale;
  const h = species.height * scale;
  const hand = { x: w - scale, y: h * 0.55 };
  const bx = w + 2;
  const by = -30;
  const balloon = `<g class="pf-s-float"><path d="M${hand.x} ${hand.y}Q${w + 10} ${h * 0.2} ${bx + 10} ${by + 18}" fill="none" stroke="#8d96a0" stroke-width="1"/>` + px(BALLOON, { r: "#ff4d6d", h: "#ff9fb2" }, bx, by, 3) + `</g>`;
  const hearts = drift(c.rng, sc, 9, () => px(HEART, { p: "#ff8fab" }, 0, 0, 2), { from: sc.ground + 8, fall: -(sc.h - 10), seconds: [6, 10], sway: 10 });
  return {
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}" fill="#ff8fab" opacity=".12"/>`,
    front: hearts,
    held: balloon,
    banner: { text: "BE MY VALENTINE", color: "#e64980", shade: "#6b0f35" },
    line: "Happy Valentine's Day \u2665"
  };
}
var PIE = ["..cccccccc..", ".cCcCcCcCcc.", "cccccccccccc", "dddddddddddd", ".dddddddddd."];
var DIGITS = "3.14159265358979323846264338327950288419716939937510";
function piDay(c) {
  const { scene: sc } = c;
  const s = 2;
  const t = textSize(DIGITS, s);
  const ticker = `<g opacity=".35"><g class="pf-s-ticker" style="--w:${-t.w - 12}px">${text(DIGITS, sc.x + 4, sc.y + 36, s, "#ffffff")}${text(DIGITS, sc.x + 16 + t.w, sc.y + 36, s, "#ffffff")}</g></g>`;
  const x = sc.x + 10;
  const y = sc.ground - 12;
  const flag = `<rect x="${x + 25}" y="${y - 20}" width="1" height="20" fill="#8a5a33"/><rect x="${x + 26}" y="${y - 20}" width="15" height="11" fill="#ffffff"/>${px(pixelText("\u03C0"), { x: "#7048e8" }, x + 27.75, y - 18.25, 1.5)}`;
  const steam = [0, 0.8, 1.6].map((d, i) => `<rect class="pf-s-steam" style="animation-delay:-${d}s" x="${x + 8 + i * 8}" y="${y - 5}" width="2" height="3" fill="#ffffff"/>`).join("");
  return {
    css: `.pf-s-ticker{animation:pf-s-ticker 26s linear infinite}@keyframes pf-s-ticker{to{transform:translateX(var(--w))}}`,
    back: ticker + steam + px(PIE, { c: "#f4a259", C: "#c8553d", d: "#adb5bd" }, x, y, 3) + flag,
    banner: { text: "HAPPY \u03C0 DAY", color: "#7048e8", shade: "#2b1470" },
    line: "Happy \u03C0 day \xB7 3.14159\u2026"
  };
}
function aprilFools(c) {
  return {
    face: glasses(c.species, c.scale, "disguise"),
    banner: { text: "APRIL FOOLS!", color: "#12b886", shade: "#064d38" },
    line: `Nice disguise, ${c.state.petName}!`
  };
}
function binaryColumn(bits) {
  const rows = [];
  for (const b of bits) rows.push(...pixelText(b), "...", "...");
  return rows;
}
function programmersDay(c) {
  const { scene: sc, rng } = c;
  const bs = 1.5;
  const span = 20 * 7 * bs;
  const patterns = [0, 1].map((i) => {
    const bits = Array.from({ length: 20 }, () => rng() < 0.5 ? "0" : "1").join("");
    return `<g id="pf-s-bits${i}">${px(binaryColumn(bits), { x: "#3fb950" }, 0, 0, bs)}</g>`;
  }).join("");
  let rain2 = `<defs>${patterns}</defs>`;
  for (let x = sc.x + 4, i = 0; x < sc.x + sc.w - 4; x += 16, i++) {
    const t = round(5 + rng() * 5);
    const id = `#pf-s-bits${i % 2}`;
    rain2 += `<g class="pf-s-code" style="--t:${t}s;animation-delay:-${round(rng() * t)}s"><use href="${id}" x="${x}" y="${sc.y - span}"/><use href="${id}" x="${x}" y="${sc.y}"/></g>`;
  }
  const mug = heldAt(c.species, c.scale, COFFEE, COFFEE_PALETTE);
  const steam = [0, 1.2].map((d, i) => `<rect class="pf-s-steam" style="animation-delay:-${d}s" x="${mug.x + 2 + i * 5}" y="${mug.y - 4}" width="2" height="3" fill="#ffffff"/>`).join("");
  return {
    css: `.pf-s-code{animation:pf-s-code var(--t) linear infinite}@keyframes pf-s-code{from{transform:translateY(0)}to{transform:translateY(${span}px)}}`,
    back: `<rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}" fill="#0d1117" opacity=".35"/><clipPath id="pf-s-sky"><rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.ground - sc.y}"/></clipPath><g clip-path="url(#pf-s-sky)" opacity=".7">${rain2}</g>`,
    face: glasses(c.species, c.scale, "nerd"),
    held: mug.svg + steam,
    banner: { text: "PROGRAMMER'S DAY", color: "#1a7f37", shade: "#07300f" },
    line: "Programmer's Day \xB7 256 = 0x100"
  };
}
var HOLIDAY_ART = {
  "new-year": newYear,
  "lunar-new-year": lunarNewYear,
  valentines,
  "pi-day": piDay,
  "april-fools": aprilFools,
  "programmers-day": programmersDay,
  "mid-autumn": midAutumn,
  halloween,
  christmas
};

// src/pet/surprises/moments.ts
function cake(years) {
  const n = Math.max(1, Math.min(5, years));
  const cols = Array.from({ length: n }, (_, i) => 7 - (n - 1) + 2 * i);
  const row2 = (ch) => Array.from({ length: 14 }, (_, x) => cols.includes(x) ? ch : ".").join("");
  return {
    flames: [row2("f"), ...Array(10).fill("..............")],
    cake: [
      "..............",
      row2("c"),
      row2("c"),
      "..pppppppppp..",
      ".pppppppppppp.",
      ".pbpbppbpppbp.",
      ".bbbbbbbbbbbb.",
      ".bsbbbsbbbsbb.",
      ".bbbbbbbbbbbb.",
      "dddddddddddddd"
    ]
  };
}
var BALLOON2 = [".bbb.", "bhbbb", "bhbbb", "bbbbb", ".bbb.", "..b.."];
function birthday(c) {
  const { scene: sc } = c;
  const years = c.state.moments?.birthday ?? 1;
  const { cake: body, flames } = cake(years);
  const cx = sc.x + 6;
  const cy = sc.ground - body.length * 3 + 3;
  const cakeSvg = px(body, { c: "#74c0fc", p: "#ffc9de", b: "#c68b59", s: "#ff6b6b", d: "#dee2e6" }, cx, cy, 3) + `<g class="pf-s-flicker">${px(flames, { f: "#ffd43b" }, cx, cy, 3)}</g>`;
  let bunting = `<path d="M${sc.x} ${sc.y + 44}Q${sc.x + sc.w / 2} ${sc.y + 60} ${sc.x + sc.w} ${sc.y + 44}" fill="none" stroke="#8d96a0" stroke-width="1"/>`;
  for (let i = 0; i < 11; i++) {
    const x = sc.x + 6 + i * 18;
    const t = (x - sc.x) / sc.w;
    const y = sc.y + 44 + 16 * 2 * t * (1 - t);
    const color = CONFETTI[i % CONFETTI.length];
    bunting += `<path d="M${round(x)} ${round(y)}h8l-4 8z" fill="${color}"/>`;
  }
  const balloons = [
    [sc.x + sc.w - 40, sc.y + 66, "#ff6b6b", "#ffa8a8", 0],
    [sc.x + sc.w - 26, sc.y + 58, "#4dabf7", "#a5d8ff", 0.9]
  ];
  let air = "";
  for (const [x, y, b, h, d] of balloons) {
    air += `<g class="pf-s-float" style="animation-delay:-${d}s"><path d="M${x + 5} ${y + 12}q-3 12 1 ${sc.ground - y - 12}" fill="none" stroke="#8d96a0" stroke-width="1"/>${px(BALLOON2, { b, h }, x, y, 2)}</g>`;
  }
  return {
    back: bunting + air + cakeSvg,
    front: confetti(c.rng, sc, 10),
    hat: PARTY_HAT,
    banner: { text: `${years} YEAR${years === 1 ? "" : "S"} ON GITHUB`, color: "#e64980", shade: "#5c0f30" },
    line: `GitHub birthday \xB7 ${years} year${years === 1 ? "" : "s"} today`
  };
}
function levelUpTitle(from, to) {
  if (from < 3 && to >= 3) return "IT HATCHED!";
  if (from < 15 && to >= 15) return "ALL GROWN UP!";
  if (from < 50 && to >= 50) return "LEGENDARY!";
  return "LEVEL UP!";
}
function levelUp(c) {
  const { scene: sc, box, state } = c;
  const from = state.moments?.levelUp ?? state.level - 1;
  const pw = Math.round(box.w * 0.9);
  const px0 = round(box.x + (box.w - pw) / 2);
  const bottom = box.y + box.h;
  const pillar = `<defs><linearGradient id="pf-s-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066" stop-opacity="0"/><stop offset=".7" stop-color="#ffe066" stop-opacity=".55"/><stop offset="1" stop-color="#fff9db" stop-opacity=".9"/></linearGradient></defs><rect class="pf-s-pulse" x="${px0}" y="${sc.y}" width="${pw}" height="${bottom - sc.y}" fill="url(#pf-s-beam)"/>`;
  let sparkles = "";
  for (let i = 0; i < 6; i++) {
    const x = round(px0 + 4 + c.rng() * (pw - 12));
    const t2 = round(2.2 + c.rng() * 1.6);
    sparkles += `<g class="pf-s-fall" style="--t:${t2}s;--fy:-${bottom - sc.y - 20}px;--sx:0px;animation-delay:-${round(c.rng() * t2)}s">${px(SPARKLE, { s: "#fff3a0" }, x, bottom - 12, 1.5)}</g>`;
  }
  const label = `LV ${state.level}`;
  const t = textSize(label, 2);
  const top = anchors(c.species).top * c.scale;
  const pop = `<g class="pf-s-pop">${text(label, round(box.w / 2 - t.w / 2), top - 26, 2, "#ffd43b", "#7a4f00")}</g>`;
  return {
    css: `.pf-s-pulse{animation:pf-s-pulse 1.6s ease-in-out infinite}@keyframes pf-s-pulse{0%,100%{opacity:.65}50%{opacity:1}}
.pf-s-pop{animation:pf-s-pop 3s ease-out infinite}@keyframes pf-s-pop{0%{transform:translateY(8px);opacity:0}15%{transform:translateY(0);opacity:1}75%{opacity:1}100%{transform:translateY(-8px);opacity:0}}`,
    follow: pillar + sparkles,
    over: pop,
    banner: { text: levelUpTitle(from, state.level), color: "#f59f00", shade: "#5c3a00" },
    line: `Level up! \xB7 Lv.${from} \u2192 Lv.${state.level}`
  };
}
var RAINBOW = ["#ff6b6b", "#ffa94d", "#ffd43b", "#69db7c", "#4dabf7", "#9775fa"];
function welcomeBack(c) {
  const { scene: sc } = c;
  const days = c.state.moments?.welcomeBack ?? 7;
  const cx = sc.x + sc.w / 2;
  const cy = sc.ground;
  const arcs = RAINBOW.map((color, i) => {
    const r2 = 90 - i * 3.5;
    return `<path d="M${round(cx - r2)} ${cy}A${r2} ${r2} 0 0 1 ${round(cx + r2)} ${cy}" fill="none" stroke="${color}" stroke-width="3.6"/>`;
  }).join("");
  const cloud3 = (x) => new RectBatch().add("#ffffff", x - 14, cy - 10, 28, 10).add("#ffffff", x - 8, cy - 16, 16, 6).add("#ffffff", x - 18, cy - 5, 36, 5).toString();
  return {
    css: `.pf-s-shimmer{animation:pf-s-shimmer 3s ease-in-out infinite}@keyframes pf-s-shimmer{0%,100%{opacity:.75}50%{opacity:.95}}`,
    back: `<g class="pf-s-shimmer" opacity=".75">${arcs}</g>${cloud3(cx - 80)}${cloud3(cx + 80)}`,
    front: confetti(c.rng, sc, 10),
    banner: { text: "WELCOME BACK!", color: "#1c7ed6", shade: "#082c52" },
    line: `Welcome back! \xB7 missed you ${days} days`
  };
}
var MOMENT_ART = { birthday, "level-up": levelUp, "welcome-back": welcomeBack };

// src/pet/surprises/places/types.ts
var PW = 96;
var PH = 60;

// src/pet/surprises/places/photo.ts
var SKIES = {
  day: ["#79c2f2", "#9ad2f7", "#bde3fa", "#dcf1fc"],
  tropical: ["#39b5f0", "#6cc9f5", "#a2dcf8", "#d4f0fc"],
  sunset: ["#f47c6a", "#fb9b72", "#ffc182", "#ffe2a8"],
  dusk: ["#3f3a86", "#6d58a8", "#b877ab", "#f0a79c"],
  night: ["#0e1440", "#172058", "#212d6e", "#2d3a80"],
  desert: ["#86c7ee", "#aad7f0", "#f0dbb0", "#f7e8c8"],
  snow: ["#9fc8e6", "#bddbee", "#d9ebf5", "#eef6fb"],
  mist: ["#b9cbd6", "#cad8e0", "#dae4ea", "#e9eff2"]
};
var STARS = [[6, 4], [18, 12], [30, 3], [44, 9], [58, 5], [70, 14], [82, 6], [90, 18], [12, 22], [52, 20]];
var px2 = (grid, palette, x, y, scale = 2) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });
function sky(x, y, kind) {
  const bands = SKIES[kind];
  const b = new RectBatch();
  const h = PH / bands.length;
  bands.forEach((c, i) => b.add(c, x, y + i * h, PW, h + 0.5));
  if (kind === "night" || kind === "dusk") {
    for (const [sx, sy] of kind === "night" ? STARS : STARS.slice(0, 5)) b.add("#fff8d6", x + sx, y + sy, 1, 1);
  }
  return b.toString();
}
var sun = (x, y, r2 = 6, color = "#ffe066") => `<circle cx="${x}" cy="${y}" r="${r2 + 3}" fill="${color}" opacity=".3"/><circle cx="${x}" cy="${y}" r="${r2}" fill="${color}"/>`;
var moon = (x, y, skyColor = "#172058") => `<circle cx="${x}" cy="${y}" r="6" fill="#fff1b8"/><circle cx="${x + 3}" cy="${y - 2}" r="5" fill="${skyColor}"/>`;
function cloud(x, y, w = 18, color = "#ffffff") {
  return new RectBatch().add(color, x, y + 3, w, 4).add(color, x + w * 0.2, y, w * 0.45, 3).add(color, x + w * 0.55, y + 1, w * 0.3, 2).toString();
}
function ground(x, y, top, color, edge) {
  const b = new RectBatch().add(color, x, y + top, PW, PH - top);
  if (edge) b.add(edge, x, y + top, PW, 2);
  return b.toString();
}
function water(x, y, top, color = "#3a86c8", glint = "#9fd4ff") {
  const b = new RectBatch().add(color, x, y + top, PW, PH - top);
  for (const [gx, gy, gw] of [[6, 4, 10], [34, 9, 8], [60, 3, 12], [80, 11, 9], [20, 14, 7]]) {
    if (top + gy < PH) b.add(glint, x + gx, y + top + gy, gw, 1);
  }
  return b.toString();
}
function hill(x, y, cx, base, w, h, color) {
  const b = new RectBatch();
  for (let i = 0; i < h; i += 2) {
    const t = i / h;
    const half = w / 2 * Math.sqrt(1 - t * t);
    b.add(color, x + Math.round(cx - half), y + base - i - 2, Math.round(half * 2), 2);
  }
  return b.toString();
}
function mountain(x, y, cx, base, w, h, color, cap = 0, snow = "#f8fbff") {
  const b = new RectBatch();
  for (let i = 0; i < h; i += 2) {
    const half = w / 2 * (1 - i / h);
    b.add(h - i <= cap ? snow : color, x + Math.round(cx - half), y + base - i - 2, Math.max(2, Math.round(half * 2)), 2);
  }
  return b.toString();
}
function skyline(x, y, base, blocks2, lit = "#ffd166") {
  const b = new RectBatch();
  for (const [bx, bw, bh, c] of blocks2) {
    b.add(c, x + bx, y + base - bh, bw, bh);
    for (let wy = base - bh + 3; wy < base - 2; wy += 4) for (let wx = bx + 2; wx < bx + bw - 1; wx += 3) if ((wx * 7 + wy * 3) % 5 < 3) b.add(lit, x + wx, y + wy, 1, 1);
  }
  return b.toString();
}

// src/pet/surprises/places/africa.ts
function pyramid(b, cx, base, h) {
  for (let i = 0; i < h; i += 2) {
    const half = h - i;
    b.add("#f0c97a", cx - half, base - i - 2, half, 2).add("#c9a24a", cx, base - i - 2, half, 2);
  }
}
var GIRAFFE = outlined([
  "....yy..",
  "...yyyk.",
  "...yy...",
  "...yd...",
  "...yy...",
  "...dy...",
  "...yy...",
  "yyyyyy..",
  "ydyydyy.",
  "yyydyyy.",
  "y.y..y.y",
  "y.y..y.y"
]);
var ACACIA = [
  "..kkkkkkkkkk..",
  "kkkkkkkkkkkkkk",
  ".kkkkkkkkkkkk.",
  "......kk......",
  ".....kk.......",
  ".....k........",
  ".....k........",
  "....kk........"
];
var TREASURY = [
  "....rrrrrrrrrr....",
  "...rRrRrRrRrRrr...",
  "..rrrrrrrrrrrrrr..",
  "..rc.rc.rrc.rc.r..",
  "..rc.rc.rrc.rc.r..",
  "rrrrrrrrrrrrrrrrrr",
  "rRrRrRrRrRrRrRrRrR",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rc.rc.rkkkkrc.rc.r",
  "rrrrrrrrrrrrrrrrrr"
];
var AFRICA = [
  {
    name: "GIZA",
    ink: "#b8860b",
    stamp: { bg: "#fff9db", grid: ["..y..", ".yyd.", "yyydd", "yyddd"], colors: { y: "#f0c97a", d: "#c9a24a" } },
    souvenir: { name: "a papyrus scroll", grid: ["b.....b", "byyyyyb", "bykkkyb", "byyyyyb", "b.....b"], colors: { b: "#a0673a", y: "#f1e3c6", k: "#8a6a4a" } },
    draw: (x, y) => {
      const b = new RectBatch();
      pyramid(b, x + 76, y + 46, 30);
      pyramid(b, x + 52, y + 46, 20);
      pyramid(b, x + 92, y + 46, 12);
      return { bg: sky(x, y, "desert") + sun(x + 18, y + 12, 6) + b + ground(x, y, 46, "#e8c98f", "#f3dcaa"), feet: { x: x + 22, y: y + 55 }, friend: { x: x + 40, y: y + 55 } };
    }
  },
  {
    name: "SERENGETI",
    ink: "#e67700",
    stamp: { bg: "#fff4e6", grid: ["..yy", "..yk", "..y.", "yyyy", "y..y"], colors: { y: "#f2b84b", k: "#3b2616" } },
    souvenir: { name: "a safari hat", grid: ["..kkk..", ".kbbbk.", "kkkkkkk"], colors: { k: "#c9a86b", b: "#6b4a2a" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + sun(x + 50, y + 34, 12, "#ffd43b") + px2(ACACIA, { k: "#3b2a1a" }, x + 60, y + 22) + ground(x, y, 44, "#d9a84e", "#e8c06a") + px2(GIRAFFE, { y: "#f2b84b", d: "#a0673a", k: "#3b2616", o: "#6b4226" }, x + 74, y + 18),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 46, y: y + 55 }
    })
  },
  {
    name: "CAPE TOWN",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["......", ".gggg.", "gggggg", "bbbbbb"], colors: { g: "#6b7f5a", b: "#1c7ed6" } },
    souvenir: { name: "a protea", grid: [".p.p.", "pPpPp", "pPPPp", ".ggg.", "..g.."], colors: { p: "#f783ac", P: "#fcc2d7", g: "#2f9e44" } },
    draw: (x, y) => {
      const table = new RectBatch().add("#7a8a66", x + 20, y + 16, 64, 22).add("#6b7a58", x + 12, y + 24, 80, 14).add("#8d9c78", x + 22, y + 16, 60, 2);
      return {
        bg: sky(x, y, "day") + table + cloud(x + 22, y + 11, 58) + water(x, y, 38, "#1c7ed6", "#74c0fc") + ground(x, y, 50, "#f1e3c6", "#f8efdc"),
        feet: { x: x + 24, y: y + 56 },
        friend: { x: x + 44, y: y + 56 }
      };
    }
  },
  {
    name: "PETRA",
    ink: "#c2553a",
    stamp: { bg: "#fff4e6", grid: ["rrrrr", "rc.cr", "rrrrr", "rckcr", "rckcr"], colors: { r: "#d9826a", c: "#b5654f", k: "#5b2a1f" } },
    souvenir: { name: "a sand bottle", grid: [".k.", "www", "rrr", "yyy", "ppp", "www"], colors: { k: "#8a5a33", w: "#f1f3f5", r: "#e8590c", y: "#fcc419", p: "#d6336c" } },
    draw: (x, y) => {
      const cliffs = new RectBatch().add("#b5654f", x, y, 30, 60).add("#c97a62", x + 4, y, 8, 60).add("#b5654f", x + 80, y, 16, 60).add("#a0563f", x + 88, y, 8, 60);
      return {
        bg: sky(x, y, "desert") + cliffs + new RectBatch().add("#d9826a", x + 30, y + 4, 50, 56).toString() + px2(TREASURY, { r: "#e8a08a", R: "#c97a62", c: "#b5654f", k: "#5b2a1f" }, x + 37, y + 12) + ground(x, y, 50, "#e8b48a"),
        feet: { x: x + 20, y: y + 57 }
      };
    }
  }
];

// src/pet/surprises/places/americas.ts
var LIBERTY = [
  ".y......",
  "yyy.....",
  ".g......",
  ".g..ggg.",
  ".g.ggggg",
  ".gg.ggg.",
  "..gggggg",
  "...ggggg",
  "...gGggg",
  "...ggggg",
  "..gGgggg",
  "..gggggg",
  "..gGgggg",
  "..gggggg",
  ".ssssssss",
  ".sSsSsSss",
  ".ssssssss",
  "ssssssssss"
];
var GOLDEN_GATE_TOWER = ["r..r", "rrrr", "r..r", "r..r", "rrrr", "r..r", "r..r", "r..r", "rrrr", "r..r", "r..r", "r..r", "r..r", "r..r"];
var LLAMA = outlined([
  "w.w...",
  "wwww..",
  "wkwwn.",
  "wwww..",
  ".ww...",
  ".ww...",
  ".wwwwww",
  ".wwwwww",
  ".wwwwww",
  ".w.w.w."
]);
var CHRIST = ["...w...", "...w...", "wwwwwww", "...w...", "...w...", "..www..", "..www..", "..www..", "..www.."];
var PALM = ["gg.gg..", ".gggg.g", "gg.bggg", "...b..g", "...b...", "...b...", "..b....", "..b....", "..b....", "..b...."];
var AMERICAS = [
  {
    name: "NEW YORK",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["y....", "g.gg.", "ggggg", ".ggg.", "sssss"], colors: { y: "#fcc419", g: "#5fae8f", s: "#adb5bd" } },
    souvenir: { name: "an I \u2665 NY shirt", grid: ["ww.ww", "wwwww", "wwrww", "wwwww", "wwwww"], colors: { w: "#ffffff", r: "#e03131" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 6, y + 8, 16) + skyline(x, y, 38, [[0, 8, 16, "#8d99ae"], [9, 6, 26, "#7a869a"], [16, 8, 20, "#8d99ae"], [25, 5, 30, "#6c7890"], [31, 7, 22, "#8d99ae"], [39, 6, 14, "#7a869a"]], "#e7f5ff") + water(x, y, 38, "#3a86c8", "#9fd4ff") + px2(LIBERTY, { y: "#fcc419", g: "#5fae8f", G: "#8fd1b5", s: "#a0896b", S: "#8a7358" }, x + 68, y + 4) + new RectBatch().add("#b0a08a", x, y + 50, 50, 10).toString(),
      feet: { x: x + 22, y: y + 52 }
    })
  },
  {
    name: "SAN FRANCISCO",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["r..r", "rrrr", "r..r", "rrrr", "r..r"], colors: { r: "#e8590c" } },
    souvenir: { name: "sourdough", grid: [".bbbb.", "bBbBbb", "bbbbbb", ".bbbb."], colors: { b: "#d9a066", B: "#f0c890" } },
    draw: (x, y) => {
      const deck = new RectBatch().add("#c4461c", x, y + 36, PW, 3).add("#8a2e10", x, y + 39, PW, 1);
      return {
        bg: sky(x, y, "day") + hill(x, y, 90, 42, 40, 16, "#6a8f5a") + px2(GOLDEN_GATE_TOWER, { r: "#e8590c" }, x + 34, y + 8) + px2(GOLDEN_GATE_TOWER, { r: "#e8590c" }, x + 78, y + 8) + `<path d="M${x} ${y + 30}Q${x + 20} ${y + 36} ${x + 38} ${y + 10}Q${x + 60} ${y + 34} ${x + 82} ${y + 10}Q${x + 90} ${y + 26} ${x + 96} ${y + 30}" fill="none" stroke="#e8590c" stroke-width="1.2"/>` + deck + water(x, y, 42, "#2f6f9f", "#a5d8ff") + `<rect x="${x}" y="${y + 20}" width="${PW}" height="10" fill="#ffffff" opacity=".35"/>` + new RectBatch().add("#c9b28a", x, y + 52, 44, 8).toString(),
        feet: { x: x + 22, y: y + 54 }
      };
    }
  },
  {
    name: "GRAND CANYON",
    ink: "#c2553a",
    stamp: { bg: "#fff4e6", grid: ["......", "rr..rr", "RRRRRR", "rrrrrr"], colors: { r: "#c2553a", R: "#e8a06a" } },
    souvenir: { name: "a cowboy hat", grid: ["..bbb..", ".bbbbb.", "kkkkkkk", "b.....b"], colors: { b: "#a0673a", k: "#6b4226" } },
    draw: (x, y) => {
      const rock = new RectBatch();
      const bands = ["#a8452e", "#c2553a", "#e8a06a", "#d9774f", "#c2553a", "#a8452e"];
      const butte = (left, widths) => widths.forEach((w, i) => {
        const top = y + 44 - (i + 1) * 5;
        rock.add(bands[i % bands.length], x + left + (widths[0] - w) / 2, top, w, 5).add("#f0b98a", x + left + (widths[0] - w) / 2, top, w, 1);
      });
      butte(40, [56, 50, 46, 38, 30, 14]);
      butte(-6, [34, 30, 24, 16]);
      rock.add("#7a3222", x + 28, y + 44, 16, 16).add("#4dabf7", x + 32, y + 52, 8, 8);
      return { bg: sky(x, y, "sunset") + sun(x + 70, y + 12, 5, "#fff3bf") + rock + ground(x, y, 54, "#c2553a"), feet: { x: x + 16, y: y + 55 } };
    }
  },
  {
    name: "NIAGARA FALLS",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["gggg", "bwbw", "wbwb", "bwbw"], colors: { g: "#2f9e44", b: "#4dabf7", w: "#ffffff" } },
    souvenir: { name: "maple syrup", grid: [".k.", ".b.", "bbb", "brb", "bbb"], colors: { k: "#6b4226", b: "#c8773a", r: "#e03131" } },
    draw: (x, y) => {
      const falls = new RectBatch().add("#4f8f4f", x + 36, y + 14, 60, 8);
      for (let fx2 = 36; fx2 < PW; fx2 += 3) falls.add(fx2 % 2 ? "#e7f5ff" : "#a5d8ff", x + fx2, y + 22, 3, 24);
      return {
        bg: sky(x, y, "day") + falls + `<g class="pf-s-flicker"><rect x="${x + 36}" y="${y + 42}" width="60" height="6" fill="#ffffff" opacity=".6"/></g><path d="M${x + 44} ${y + 40}a26 26 0 0 1 52 0" fill="none" stroke="#ff8787" stroke-width="1.5" opacity=".6"/><path d="M${x + 46} ${y + 40}a24 24 0 0 1 48 0" fill="none" stroke="#ffd43b" stroke-width="1.5" opacity=".6"/><path d="M${x + 48} ${y + 40}a22 22 0 0 1 44 0" fill="none" stroke="#69db7c" stroke-width="1.5" opacity=".6"/>` + water(x, y, 46, "#3a86c8", "#d0ebff") + new RectBatch().add("#6f8f5f", x, y + 14, 36, 46).add("#8a9a6a", x, y + 48, 40, 12).toString(),
        feet: { x: x + 20, y: y + 56 }
      };
    }
  },
  {
    name: "HAWAII",
    ink: "#e8590c",
    stamp: { bg: "#e3fafc", grid: ["gg.gg", ".ggg.", "..b..", "..b..", "wwwww"], colors: { g: "#2f9e44", b: "#8a5a33", w: "#4dabf7" } },
    souvenir: { name: "a pineapple", grid: [".g.g.", "..g..", ".yyy.", "yYyYy", "yyYyy", ".yyy."], colors: { g: "#2f9e44", y: "#fcc419", Y: "#e8a10f" } },
    draw: (x, y) => ({
      bg: sky(x, y, "tropical") + mountain(x, y, 70, 38, 60, 22, "#5a6b5a") + `<g class="pf-s-steam"><rect x="${x + 68}" y="${y + 10}" width="4" height="4" fill="#dee2e6"/></g>` + water(x, y, 36, "#1c9ad6", "#e3fafc") + ground(x, y, 46, "#f4d58d", "#fbe7b0") + px2(PALM, { g: "#2f9e44", b: "#8a5a33" }, x + 76, y + 26) + // A surfboard stuck in the sand.
      `<rect x="${x + 60}" y="${y + 30}" width="5" height="18" rx="2.5" fill="#ff6b6b"/><rect x="${x + 62}" y="${y + 31}" width="1" height="16" fill="#ffffff"/>`,
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 44, y: y + 55 }
    })
  },
  {
    name: "CHICHEN ITZA",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["..t..", ".sss.", "sssss", "sssss"], colors: { t: "#8a7358", s: "#c9b28a" } },
    souvenir: { name: "maracas", grid: ["rr.yy", "rr.yy", ".b..b", ".b..b"], colors: { r: "#e03131", y: "#fcc419", b: "#8a5a33" } },
    draw: (x, y) => {
      const b = new RectBatch();
      const cx = x + 70;
      for (let i = 0; i < 9; i++) {
        const w = 52 - i * 5;
        b.add(i % 2 ? "#c9b28a" : "#b8a07a", cx - w / 2, y + 46 - (i + 1) * 3, w, 3).add("#8a7358", cx - w / 2, y + 46 - (i + 1) * 3, w, 1);
      }
      b.add("#a38b63", cx - 3, y + 19, 6, 27);
      for (let sy = 20; sy < 46; sy += 2) b.add("#8a7358", cx - 3, y + sy, 6, 1);
      b.add("#b8a07a", cx - 7, y + 11, 14, 8).add("#8a7358", cx - 7, y + 10, 14, 1).add("#3b2a1a", cx - 2, y + 14, 4, 5);
      return {
        bg: sky(x, y, "day") + cloud(x + 8, y + 6, 18) + hill(x, y, 18, 46, 40, 14, "#2f7a3f") + hill(x, y, 94, 46, 30, 16, "#3f8f4f") + b + ground(x, y, 46, "#8cbf6a", "#a5d17f"),
        feet: { x: x + 22, y: y + 55 }
      };
    }
  },
  {
    name: "MACHU PICCHU",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["...g..", "..ggg.", ".ggggg", "ssssss"], colors: { g: "#2f7a3f", s: "#adb5bd" } },
    souvenir: { name: "a llama plush", grid: ["w.w.", "wwww", "wkwn", ".ww.", ".wwww", ".w.w."], colors: { w: "#fff4e6", k: "#1a1a1a", n: "#e8a0a0" } },
    draw: (x, y) => {
      const terraces = new RectBatch();
      for (let i = 0; i < 5; i++) terraces.add("#6fae5f", x + 30 - i * 4, y + 36 + i * 4, 70, 4).add("#a3a3a3", x + 30 - i * 4, y + 39 + i * 4, 70, 1);
      terraces.add("#b0a89a", x + 50, y + 30, 10, 6).add("#b0a89a", x + 64, y + 30, 12, 6);
      return {
        bg: sky(x, y, "mist") + mountain(x, y, 76, 36, 34, 32, "#2f6f3f") + mountain(x, y, 40, 40, 50, 16, "#4f8f5f") + terraces + px2(LLAMA, { w: "#fff4e6", k: "#1a1a1a", n: "#e8a0a0", o: "#8a7358" }, x + 80, y + 38),
        feet: { x: x + 22, y: y + 58 }
      };
    }
  },
  {
    name: "RIO DE JANEIRO",
    ink: "#2b8a3e",
    stamp: { bg: "#ebfbee", grid: ["..w..", "wwwww", "..w..", ".ggg.", "ggggg"], colors: { w: "#ffffff", g: "#2f9e44" } },
    souvenir: { name: "a football", grid: [".www.", "wkwkw", "wwkww", "wkwkw", ".www."], colors: { w: "#ffffff", k: "#1a1a1a" } },
    draw: (x, y) => ({
      bg: sky(x, y, "tropical") + hill(x, y, 30, 40, 36, 26, "#3f7d4f") + px2(CHRIST, { w: "#f1f3f5" }, x + 23, y + 0) + hill(x, y, 80, 40, 24, 22, "#4f8f5f") + water(x, y, 38, "#1c9ad6", "#e3fafc") + ground(x, y, 48, "#f4d58d", "#fbe7b0"),
      feet: { x: x + 50, y: y + 56 },
      friend: { x: x + 70, y: y + 56 }
    })
  }
];

// src/pet/surprises/places/asia.ts
var PANDA = outlined([
  ".kk......kk.",
  "kkkwwwwwwkkk",
  ".kwwwwwwwwk.",
  ".wwkkwwkkww.",
  ".wkkwwwwkkw.",
  ".wwwwkkwwww.",
  "..wwwwwwww..",
  ".kkwwwwwwkk.",
  "kkkwwwwwwkkk",
  "kkwwwwwwwwkk",
  ".kkwwwwwwkk.",
  "..kkk..kkk.."
]);
var PEARL_TOWER = [
  "....k....",
  "....s....",
  "....s....",
  "...kpk...",
  "..kpPpk..",
  "...kpk...",
  "....s....",
  "....s....",
  "....s....",
  "...sss...",
  "..kpppk..",
  ".kpPpppk.",
  "kpPpppppk",
  "kpppppppk",
  ".kpppppk.",
  "..kpppk..",
  "..s.s.s..",
  "..s.s.s..",
  ".s..s..s.",
  ".s..s..s.",
  "s...s...s",
  "s...s...s"
];
var WARRIOR = outlined([
  "..hh...",
  ".hhhh..",
  ".ffff..",
  ".fkfk..",
  "..ff...",
  ".aAaA..",
  "aAaAaa.",
  "aaAaAa.",
  "fAaAaf.",
  ".aaaa..",
  ".aAaa..",
  ".l..l..",
  ".l..l..",
  "ll..ll."
]);
var WARRIOR_COLORS = { h: "#4a3526", f: "#c89a6a", k: "#5b3a22", a: "#9c6b45", A: "#7a4f30", l: "#8a5a33", o: "#3b2616" };
var JUNK = [
  "....r.....r.....",
  "...rr....rr.....",
  "..rRr...rRr..r..",
  ".rrRr..rrRr.rr..",
  "rrrRr.rrrRrrRr..",
  "rrrRr.rrrRrrRr..",
  ".rrRr..rrRr.rr..",
  "...b.....b...b..",
  "bbbbbbbbbbbbbbbb",
  ".bBbBbBbBbBbBbb.",
  "..bbbbbbbbbbbb.."
];
var TAIPEI_101 = [
  ".....k.....",
  ".....k.....",
  "....kgk....",
  "....ggg....",
  "...ggggg...",
  ...Array.from({ length: 8 }, () => ["..gGgggGg..", "...ggggg...", "...gwgwg..."]).flat(),
  "..ggggggg..",
  ".ggggggggg.",
  "ggggggggggg"
];
var TOKYO_TOWER = [
  "......o......",
  "......o......",
  ".....ooo.....",
  ".....owo.....",
  ".....ooo.....",
  "....oo.oo....",
  "....o.o.o....",
  "....wwwww....",
  "...oo.o.oo...",
  "...o.o.o.o...",
  "...oo.o.oo...",
  "..ooooooooo..",
  "..wwwwwwwww..",
  "..oo.o.o.oo..",
  "..o.o.o.o.o..",
  ".oo.o.o.o.oo.",
  ".o..o...o..o.",
  "oo..o...o..oo",
  "o...o...o...o"
];
var SEOUL_TOWER = [
  "...k...",
  "...k...",
  "...k...",
  "...w...",
  "..www..",
  ".wwwww.",
  ".wbbbw.",
  ".wwwww.",
  "..www..",
  ...Array.from({ length: 9 }, () => "...w..."),
  "..www.."
];
var TAJ = [
  "............k.............",
  "............k.............",
  "...........www............",
  ".........wwwwwww..........",
  "........wwwwwwwww.........",
  "........wwwwwwwww.........",
  ".m.......wwwwwww.......m..",
  ".m........wwwww........m..",
  "mmm..w...wwwwwww...w..mmm.",
  ".m..www.wwwwwwwww.www..m..",
  ".m..www.wwwwwwwww.www..m..",
  ".m.wwwwwwwwwwwwwwwwwww.m..",
  ".m.wsswwwwwaaawwwwwssw.m..",
  ".m.wsswwwwaaaaawwwwssw.m..",
  ".m.wwwwwwwaaaaawwwwwww.m..",
  "mmmwwwwwwwaaaaawwwwwwwmmm.",
  "wwwwwwwwwwwwwwwwwwwwwwwww."
];
var ANGKOR = [
  "............t............",
  "...........ttt...........",
  "...........ttt...........",
  "...t......ttttt......t...",
  "..ttt.....ttttt.....ttt..",
  "..ttt....ttTtttt....ttt..",
  ".ttttt...ttTtttt...ttttt.",
  ".ttTtt..tttTttttt..ttTtt.",
  ".ttTtt.t.tttttt.t..ttTtt.",
  "ttttttttttttttttttttttttt",
  "tTtTtTtTtTtTtTtTtTtTtTtTt",
  "ttttttttttttttttttttttttt"
];
function torii(b, cx, base, h) {
  const w = h * 0.9;
  const post = Math.max(1, Math.round(h / 10));
  b.add("#d9480f", cx - w / 2 + w * 0.12, base - h, post, h);
  b.add("#d9480f", cx + w / 2 - w * 0.12 - post, base - h, post, h);
  b.add("#d9480f", cx - w / 2 + w * 0.05, base - h * 0.78, w * 0.9, Math.max(1, post));
  b.add("#d9480f", cx - w / 2, base - h - post, w, post + 1);
  b.add("#2b1e1e", cx - w / 2 - 1, base - h - post * 2, w + 2, post);
}
var ASIA = [
  {
    name: "BEIJING",
    ink: "#c92a2a",
    stamp: { bg: "#fff3d6", grid: ["t.t.t", "ttttt", "twtwt", "ttttt", "ttttt"], colors: { t: "#a67c52", w: "#fff3d6" } },
    souvenir: { name: "hawthorn candy", grid: [".r.", "rRr", ".r.", "rRr", ".r.", "rRr", ".b.", ".b."], colors: { r: "#e03131", R: "#ff8787", b: "#8a5a33" } },
    draw: (x, y) => {
      const wall = new RectBatch();
      let wy = 46;
      for (let i = 0; i < 8; i++) {
        const sx = x + 18 + i * 8;
        wall.add("#c9b28a", sx, y + wy, 9, 7).add("#9c8460", sx, y + wy + 6, 9, 1).add("#c9b28a", sx + 1, y + wy - 2, 2, 2).add("#c9b28a", sx + 5, y + wy - 2, 2, 2);
        wy -= 3;
      }
      wall.add("#b39a73", x + 80, y + 14, 14, 20).add("#c9b28a", x + 79, y + 12, 16, 3);
      for (const dx of [79, 83, 87, 91]) wall.add("#c9b28a", x + dx, y + 9, 2, 3);
      wall.add("#5b4636", x + 83, y + 18, 3, 5).add("#5b4636", x + 88, y + 18, 3, 5);
      return {
        bg: sky(x, y, "day") + cloud(x + 10, y + 6, 20) + hill(x, y, 72, 50, 70, 30, "#5ea65e") + hill(x, y, 18, 52, 56, 16, "#79b865") + ground(x, y, 50, "#6fae5f") + wall,
        feet: { x: x + 16, y: y + 57 }
      };
    }
  },
  {
    name: "CHENGDU",
    ink: "#2b8a3e",
    stamp: { bg: "#d3f9d8", grid: [".k.k.", "kwwwk", "wkwkw", "wwkww", ".www."], colors: { k: "#1a1a1a", w: "#ffffff" } },
    souvenir: { name: "a panda plush", grid: [".k.k.", "kwwwk", "wkwkw", "wwkww", "kwwwk", ".k.k."], colors: { k: "#1a1a1a", w: "#ffffff" } },
    draw: (x, y) => {
      const bamboo = new RectBatch();
      for (const [bx, c] of [[4, "#5aa35a"], [14, "#3f8f4f"], [40, "#5aa35a"], [52, "#3f8f4f"], [86, "#5aa35a"], [92, "#3f8f4f"]]) {
        bamboo.add(c, x + bx, y, 3, 50);
        for (let ny = 6; ny < 50; ny += 9) bamboo.add("#2c6b3a", x + bx, y + ny, 3, 1);
        bamboo.add("#6fbf6a", x + bx + 3, y + 10 + bx % 7, 5, 2).add("#6fbf6a", x + bx - 5, y + 22 + bx % 5, 5, 2);
      }
      const stalk = new RectBatch().add("#8fd18f", x + 60, y + 30, 2, 16).add("#6fbf6a", x + 57, y + 28, 4, 2);
      return {
        bg: sky(x, y, "mist") + bamboo + ground(x, y, 48, "#79b865", "#8cc97a") + px2(PANDA, { k: "#1a1a1a", w: "#ffffff", o: "#3b3b3b" }, x + 58, y + 22) + stalk,
        feet: { x: x + 24, y: y + 54 }
      };
    }
  },
  {
    name: "SHANGHAI",
    ink: "#d6336c",
    stamp: { bg: "#1b2156", grid: [".p.", "ppp", ".s.", "ppp", "s.s"], colors: { p: "#ff5c9a", s: "#c3c9e8" } },
    souvenir: { name: "soup dumplings", grid: [".w.w.", "wwwww", "wwwww", "bbbbb", "bBbBb"], colors: { w: "#fff8ef", b: "#c79a5b", B: "#a67c3d" } },
    draw: (x, y) => ({
      bg: sky(x, y, "night") + skyline(x, y, 46, [[34, 8, 20, "#232a52"], [44, 6, 28, "#1c2246"], [52, 10, 16, "#232a52"], [80, 7, 30, "#1c2246"], [88, 8, 22, "#232a52"]], "#ffd6e7") + px2(PEARL_TOWER, { k: "#2a2f5a", p: "#ff5c9a", P: "#ffc2d9", s: "#c3c9e8" }, x + 62, y + 2) + new RectBatch().add("#5c6370", x, y + 44, PW, 4).toString() + water(x, y, 48, "#16204a", "#ff8fb8"),
      feet: { x: x + 20, y: y + 47 },
      friend: { x: x + 40, y: y + 47 }
    })
  },
  {
    name: "GUILIN",
    ink: "#0b7285",
    stamp: { bg: "#e6fcf5", grid: ["..g..g", ".gg.gg", ".gggg.", "gggggg", "bbbbbb"], colors: { g: "#2f9e44", b: "#4dabf7" } },
    souvenir: { name: "a bamboo hat", grid: ["...y...", "..yyy..", ".yYyyy.", "yyyyyyy"], colors: { y: "#e0b861", Y: "#f2d28f" } },
    draw: (x, y) => {
      const raft = new RectBatch();
      for (let i = 0; i < 8; i++) raft.add(i % 2 ? "#c9a36b" : "#a88450", x + 10 + i * 4, y + 50, 4, 4);
      raft.add("#6b4a2a", x + 10, y + 53, 32, 1);
      return {
        bg: sky(x, y, "mist") + hill(x, y, 22, 46, 20, 36, "#8db89a") + hill(x, y, 50, 46, 22, 26, "#7aa888") + hill(x, y, 76, 46, 20, 40, "#6a9e7a") + hill(x, y, 94, 46, 16, 24, "#8db89a") + water(x, y, 44, "#5aa6a0", "#b8e0dc") + raft,
        feet: { x: x + 26, y: y + 51 }
      };
    }
  },
  {
    name: "XI'AN",
    ink: "#a0522d",
    stamp: { bg: "#fff4e6", grid: [".hh.", "hhhh", "ffff", "fkfk", ".ff."], colors: { h: "#4a3526", f: "#c89a6a", k: "#5b3a22" } },
    souvenir: { name: "a mini warrior", grid: [".hh.", ".ff.", "aAaA", "aaAa", ".l.l"], colors: { h: "#4a3526", f: "#c89a6a", a: "#9c6b45", A: "#7a4f30", l: "#8a5a33" } },
    draw: (x, y) => {
      const pit = new RectBatch().add("#c9955f", x, y + 8, PW, 18).add("#b07845", x, y + 26, PW, 34);
      for (let ly = 12; ly < 26; ly += 5) pit.add("#a97a4a", x, y + ly, PW, 1);
      let army = "";
      for (const [wx, base] of [[48, 36], [64, 36], [80, 36], [56, 54], [72, 54], [88, 54]]) army += px2(WARRIOR, WARRIOR_COLORS, x + wx - 8, y + base - 32);
      return { bg: sky(x, y, "day") + pit + army, feet: { x: x + 22, y: y + 56 } };
    }
  },
  {
    name: "HONG KONG",
    ink: "#c92a2a",
    stamp: { bg: "#fff4e6", grid: ["..r..", ".rRr.", "rrRrr", "..b..", "bbbbb"], colors: { r: "#d9480f", R: "#a8350a", b: "#6b4226" } },
    souvenir: { name: "an egg tart", grid: [".bbbb.", "bYyyYb", "byyyyb", ".bbbb."], colors: { b: "#c68b59", y: "#ffd43b", Y: "#fff3bf" } },
    draw: (x, y) => ({
      bg: sky(x, y, "night") + mountain(x, y, 70, 30, 90, 16, "#1c2246") + skyline(x, y, 38, [[0, 8, 22, "#2a3160"], [9, 6, 30, "#232a52"], [16, 9, 18, "#2a3160"], [26, 5, 34, "#1f2550"], [32, 8, 24, "#2a3160"], [41, 7, 28, "#232a52"], [49, 9, 20, "#2a3160"], [59, 6, 32, "#1f2550"], [66, 8, 22, "#2a3160"], [75, 7, 26, "#232a52"], [83, 9, 18, "#2a3160"]], "#9ff0ff") + water(x, y, 38, "#101a44", "#ff8fb8") + px2(JUNK, { r: "#d9480f", R: "#a8350a", b: "#6b4226", B: "#8a5a33" }, x + 58, y + 32) + new RectBatch().add("#5b4636", x, y + 50, 40, 4).add("#3b2a1a", x + 4, y + 54, 3, 6).add("#3b2a1a", x + 32, y + 54, 3, 6).toString(),
      feet: { x: x + 20, y: y + 51 }
    })
  },
  {
    name: "TAIPEI",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["..k..", ".ggg.", ".GgG.", ".ggg.", ".GgG.", "ggggg"], colors: { k: "#3b5b58", g: "#7fbfb5", G: "#a5d8cf" } },
    souvenir: { name: "bubble tea", grid: ["..k..", "wwwww", "wtttw", "wtttw", "wkkkw", ".www."], colors: { k: "#3b2616", w: "#e7f5ff", t: "#d9a066" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 8, y + 8, 18) + hill(x, y, 30, 48, 70, 18, "#6fae7a") + hill(x, y, 88, 48, 50, 14, "#5e9e6a") + skyline(x, y, 48, [[40, 8, 12, "#b8c4d0"], [50, 6, 16, "#a5b4c3"], [82, 9, 14, "#b8c4d0"]], "#e7f5ff") + px2(TAIPEI_101, { k: "#3b5b58", g: "#7fbfb5", G: "#a5d8cf", w: "#e7f5ff" }, x + 60, y + 48 - TAIPEI_101.length * 2) + ground(x, y, 48, "#8a9099", "#adb5bd"),
      feet: { x: x + 22, y: y + 54 },
      friend: { x: x + 42, y: y + 54 }
    })
  },
  {
    name: "TOKYO",
    ink: "#e8590c",
    stamp: { bg: "#fff0f6", grid: ["..w..", ".www.", "bbbbb", "bbbbb"], colors: { w: "#ffffff", b: "#5c7cfa" } },
    souvenir: { name: "a lucky cat", grid: ["w.w.w", "wwwww", "kwkww", "wwrww", "wwwww", ".yyy."], colors: { w: "#ffffff", k: "#1a1a1a", r: "#e03131", y: "#fcc419" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + sun(x + 16, y + 16, 5, "#fff3bf") + mountain(x, y, 36, 46, 70, 30, "#7c86b8", 10) + skyline(x, y, 48, [[0, 10, 8, "#5c4a7a"], [12, 7, 12, "#4a3b66"], [22, 9, 7, "#5c4a7a"], [80, 8, 10, "#4a3b66"], [88, 8, 14, "#5c4a7a"]], "#ffe8a3") + px2(TOKYO_TOWER, { o: "#ff6b1a", w: "#ffffff" }, x + 54, y + 48 - TOKYO_TOWER.length * 2) + ground(x, y, 48, "#6b5a7a"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 }
    })
  },
  {
    name: "KYOTO",
    ink: "#d9480f",
    stamp: { bg: "#fff4e6", grid: ["kkkkkk", "rrrrrr", ".r..r.", "rrrrrr", ".r..r.", ".r..r."], colors: { k: "#2b1e1e", r: "#d9480f" } },
    souvenir: { name: "a cup of matcha", grid: ["wgggw", "wgGgw", "wwwww", ".www."], colors: { w: "#f1f3f5", g: "#6aa84f", G: "#9ccc65" } },
    draw: (x, y) => {
      const gates = new RectBatch();
      for (const [cx, base, h] of [[88, 34, 8], [82, 37, 11], [75, 41, 15], [67, 46, 20], [58, 52, 26]]) torii(gates, x + cx, y + base, h);
      return {
        bg: sky(x, y, "day") + hill(x, y, 60, 44, 110, 30, "#3f7d4f") + ground(x, y, 44, "#5e9e6a") + new RectBatch().add("#d9c7a8", x + 40, y + 44, 56, 16).add("#d9c7a8", x + 62, y + 36, 30, 8).toString() + gates,
        feet: { x: x + 22, y: y + 56 }
      };
    }
  },
  {
    name: "SEOUL",
    ink: "#5f3dc4",
    stamp: { bg: "#f3f0ff", grid: ["..k..", ".www.", ".wbw.", "..w..", "..w..", ".ggg."], colors: { k: "#343a40", w: "#ffffff", b: "#5c7cfa", g: "#2f9e44" } },
    souvenir: { name: "kimchi", grid: [".bb.", "brrb", "brRb", "brrb", ".bb."], colors: { b: "#8a5a33", r: "#e03131", R: "#ff6b6b" } },
    draw: (x, y) => ({
      bg: sky(x, y, "dusk") + hill(x, y, 68, 50, 70, 26, "#2f5d3a") + px2(SEOUL_TOWER, { k: "#343a40", w: "#f1f3f5", b: "#91a7ff" }, x + 61, y + 26 - SEOUL_TOWER.length * 2 + 4) + skyline(x, y, 54, [[0, 12, 10, "#3b3566"], [14, 8, 16, "#2f2a55"], [24, 10, 8, "#3b3566"], [84, 12, 12, "#2f2a55"]], "#ffd8a8") + ground(x, y, 54, "#4a4270"),
      feet: { x: x + 24, y: y + 56 },
      friend: { x: x + 44, y: y + 56 }
    })
  },
  {
    name: "BALI",
    ink: "#2b8a3e",
    stamp: { bg: "#e6fcf5", grid: ["..w..", ".wyw.", "wyyyw", ".wyw.", "..w.."], colors: { w: "#ffffff", y: "#fcc419" } },
    souvenir: { name: "a frangipani", grid: ["..w..", ".wyw.", "wyyyw", ".wyw.", "..w.."], colors: { w: "#ffffff", y: "#fcc419" } },
    draw: (x, y) => {
      const terraces = new RectBatch();
      for (let i = 0; i < 6; i++) terraces.add(i % 2 ? "#74c26b" : "#5eaf57", x + 40 - i * 6, y + 26 + i * 5, 80, 5).add("#9ad48f", x + 40 - i * 6, y + 26 + i * 5, 80, 1);
      const gate = new RectBatch();
      for (const side of [0, 1]) {
        const gx = x + (side ? 82 : 64);
        for (let s = 0; s < 5; s++) gate.add(s % 2 ? "#6b5a4a" : "#826d58", gx + (side ? 0 : s), y + 8 + s * 4, 10 - s, 4);
        gate.add("#826d58", gx, y + 28, 10, 20);
      }
      return { bg: sky(x, y, "tropical") + cloud(x + 6, y + 6, 16) + terraces + gate, feet: { x: x + 22, y: y + 56 } };
    }
  },
  {
    name: "SINGAPORE",
    ink: "#c92a2a",
    stamp: { bg: "#1b2156", grid: ["bbbbbb", "t.t.t.", "t.t.t.", "t.t.t."], colors: { b: "#c3c9e8", t: "#8d99c2" } },
    souvenir: { name: "a durian", grid: [".g.g.", "ggggg", "gGgGg", "ggggg", ".ggg."], colors: { g: "#94d82d", G: "#5c940d" } },
    draw: (x, y) => {
      const mbs = new RectBatch();
      for (const tx of [50, 62, 74]) {
        mbs.add("#8d99c2", x + tx, y + 16, 8, 28).add("#aab4d6", x + tx, y + 16, 2, 28);
        for (let wy = 19; wy < 42; wy += 4) mbs.add("#ffe8a3", x + tx + 3, y + wy, 3, 1);
      }
      mbs.add("#c3c9e8", x + 46, y + 12, 42, 3).add("#5c6b99", x + 48, y + 15, 38, 1).add("#c3c9e8", x + 84, y + 11, 6, 2);
      return {
        bg: sky(x, y, "night") + moon(x + 16, y + 12) + mbs + water(x, y, 44, "#101a44", "#ffe8a3"),
        feet: { x: x + 22, y: y + 44 },
        fg: new RectBatch().add("#5c6370", x, y + 44, 40, 3).toString()
      };
    }
  },
  {
    name: "AGRA",
    ink: "#a61e4d",
    stamp: { bg: "#fff0f6", grid: ["..k..", ".www.", "wwwww", "wwwww", "waaaw", "wwwww"], colors: { k: "#868e96", w: "#ffffff", a: "#d8cbb3" } },
    souvenir: { name: "masala chai", grid: ["..s..", "bbbbb", "bcccb", "bcccb", ".bbb."], colors: { s: "#ffffff", b: "#c68b59", c: "#a0522d" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + px2(TAJ, { k: "#868e96", w: "#f8f4ec", s: "#e3d9c6", a: "#d8cbb3", m: "#f1ebe0" }, x + 44, y + 4) + ground(x, y, 38, "#6fae5f") + new RectBatch().add("#7fc8e6", x + 60, y + 40, 20, 20).add("#bfe6f5", x + 64, y + 42, 4, 16).toString(),
      feet: { x: x + 24, y: y + 56 }
    })
  },
  {
    name: "EVEREST",
    ink: "#1971c2",
    stamp: { bg: "#e7f5ff", grid: ["..w..", ".www.", ".gww.", "gggwg", "ggggg"], colors: { w: "#ffffff", g: "#748ffc" } },
    souvenir: { name: "prayer flags", grid: ["kkkkk", "bwrgy", "bwrgy"], colors: { k: "#5b4636", b: "#1c7ed6", w: "#ffffff", r: "#e03131", g: "#2f9e44", y: "#fcc419" } },
    draw: (x, y) => {
      const flags = new RectBatch();
      const colours = ["#1c7ed6", "#ffffff", "#e03131", "#2f9e44", "#fcc419"];
      for (let i = 0; i < 10; i++) {
        const fx2 = x + 2 + i * 5;
        const fy = y + 8 + Math.round(Math.sin(i / 9 * Math.PI) * 5);
        flags.add("#5b4636", fx2, fy, 5, 1).add(colours[i % 5], fx2 + 1, fy + 1, 3, 4);
      }
      return {
        bg: sky(x, y, "day") + mountain(x, y, 30, 52, 70, 26, "#8ea3c7", 8) + mountain(x, y, 66, 52, 84, 48, "#6f84ad", 18) + mountain(x, y, 94, 52, 40, 20, "#8ea3c7", 6) + ground(x, y, 50, "#eef3f8", "#ffffff") + flags,
        feet: { x: x + 22, y: y + 56 }
      };
    }
  },
  {
    name: "DUBAI",
    ink: "#b8860b",
    stamp: { bg: "#fff9db", grid: ["..s..", "..s..", ".sss.", ".sss.", "sssss"], colors: { s: "#8d99ae" } },
    souvenir: { name: "some dates", grid: ["bb.bb", "bBbbB", ".bb..", ".Bb.."], colors: { b: "#7a4a24", B: "#a0673a" } },
    draw: (x, y) => {
      const burj = new RectBatch();
      const widths = [10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 2, 1, 1, 1];
      widths.forEach((w, i) => burj.add(i % 3 ? "#cfd8e3" : "#eef3f8", x + 72 - w, y + 46 - i * 2, w * 2, 2));
      burj.add("#cfd8e3", x + 71, y + 46 - widths.length * 2 - 8, 2, 8);
      return {
        bg: sky(x, y, "desert") + sun(x + 20, y + 12, 5, "#fff3bf") + burj + hill(x, y, 20, 60, 70, 16, "#e8c98f") + hill(x, y, 80, 60, 60, 12, "#dcb877") + ground(x, y, 52, "#e8c98f"),
        feet: { x: x + 26, y: y + 55 }
      };
    }
  },
  {
    name: "ANGKOR WAT",
    ink: "#9c6b30",
    stamp: { bg: "#fff4e6", grid: ["..t..", ".ttt.", "t.t.t", "ttttt", "ttttt"], colors: { t: "#7a5c3a" } },
    souvenir: { name: "a lotus", grid: ["..p..", ".pPp.", "pPpPp", ".ggg."], colors: { p: "#f783ac", P: "#fcc2d7", g: "#2f9e44" } },
    draw: (x, y) => {
      const lotus = new RectBatch();
      for (const [lx, ly] of [[60, 54], [80, 50], [72, 57]]) lotus.add("#2f9e44", x + lx - 2, y + ly + 2, 7, 2).add("#f783ac", x + lx, y + ly, 3, 2);
      return {
        bg: sky(x, y, "sunset") + sun(x + 80, y + 14, 6, "#fff3bf") + px2(ANGKOR, { t: "#6b4f35", T: "#8a6a4a" }, x + 22, y + 12) + ground(x, y, 36, "#6fae5f") + water(x, y, 44, "#e8a37a", "#ffd8a8") + lotus,
        feet: { x: x + 20, y: y + 44 }
      };
    }
  }
];

// src/pet/surprises/places/europe.ts
var EIFFEL = [
  ".......k.......",
  ".......k.......",
  "......kkk......",
  "......kek......",
  "......kkk......",
  ".....kk.kk.....",
  ".....k.k.k.....",
  ".....kk.kk.....",
  ".....kk.kk.....",
  "....kkkkkkk....",
  "....k.k.k.k....",
  "....kk.k.kk....",
  "...kk.k.k.kk...",
  "...kk.k.k.kk...",
  "..kkkkkkkkkkk..",
  "..kk.k...k.kk..",
  "..k.k.....k.k..",
  ".kk..........kk",
  ".kkkkkkkkkkkkk.",
  ".kk.........kk.",
  "kk...kkkkk...kk",
  "k...kk...kk...k",
  "k..kk.....kk..k"
];
var BIG_BEN = [
  "....k....",
  "....k....",
  "...ttt...",
  "...ttt...",
  "..ttttt..",
  "..tTtTt..",
  ".ttttttt.",
  ".twwwwwt.",
  ".twwkwwt.",
  ".twkkwwt.",
  ".twwwwwt.",
  ".ttttttt.",
  ...Array.from({ length: 6 }, () => [".tTtTtTt.", ".ttttttt."]).flat(),
  "ttttttttt"
];
var BUS = outlined([
  "rrrrrrrrrrrrrrrr",
  "rwwrwwrwwrwwrwwr",
  "rrrrrrrrrrrrrrrr",
  "rwwrwwrwwrwwrwwr",
  "rrrrrrrrrrrrrrrr",
  ".kk........kk..."
]);
var COLOSSEUM = [
  "..............ssssssss..",
  "......ssssssssssssssssss",
  "..ssssssssssssssssssssss",
  ".sakasakasakasakasakasak",
  ".sakasakasakasakasakasak",
  "ssssssssssssssssssssssss",
  "sakasakasakasakasakasaka",
  "sakasakasakasakasakasaka",
  "ssssssssssssssssssssssss",
  "sakasakasakasakasakasaka",
  "sakasakasakasakasakasaka",
  "ssssssssssssssssssssssss"
];
var WINDMILL = [
  "s.......s..",
  ".s.....s...",
  "..s...s....",
  "...s.s.....",
  "....h......",
  "...shs.....",
  "..s.b.s....",
  ".s.bbb.s...",
  "s..bbbb.s..",
  "...bbbb....",
  "..bbwbbb...",
  "..bbwbbb...",
  ".bbbbbbbb..",
  ".bbbbbbbb.."
];
var PARTHENON = [
  "......ppppppp......",
  "...ppppppppppppp...",
  "ppppppppppppppppppp",
  "ppppppppppppppppppp",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "c.c.c.c.c.c.c.c.c.c",
  "ppppppppppppppppppp"
];
var SAGRADA = [
  "..y.....y..y.....y..",
  ".ttt...ttttt....ttt.",
  ".ttt...tt.tt....ttt.",
  ".tTt...tTtTt....tTt.",
  ".ttt..ttttttt...ttt.",
  ".tTt..tTt.tTt...tTt.",
  "ttttt.ttttttt..ttttt",
  "tTtTt.tTtTtTt..tTtTt",
  "tttttttttttttttttttt",
  "tTttTttTttTttTttTttT",
  "tttkkkttttttttkkkttt",
  "tttkkkttttttttkkkttt"
];
var ST_BASILS = [
  ".........y.........",
  "........ggg........",
  "...y...gGgGg...y...",
  "..rrr...ggg...bbb..",
  ".rwrwr..rrr..bwbwb.",
  "..rrr..rrrrr..bbb..",
  "..ttt..ttttt..ttt..",
  "..tRt..tRtRt..tRt..",
  "..ttt..ttttt..ttt..",
  "ttttttttttttttttttt",
  "tRtRtRtRtRtRtRtRtRt",
  "ttttttttkkkttttttt.",
  "ttttttttkkktttttttt"
];
var MOSQUE = [
  "m..........k.........m",
  "m.........www........m",
  "m.......wwwwwww......m",
  "m......wwwwwwwww.....m",
  "m....w.wwwwwwwww.w...m",
  "m...www.wwwwwww.www..m",
  "m..wwwwwwwwwwwwwwwww.m",
  "mm.wwwwwwwwwwwwwwwwwmm",
  "m.wwawwawwawwawwawwaw.",
  "m.wwwwwwwwwwwwwwwwwww."
];
var GATE = [
  ".......qqqqq.......",
  "......qq.q.qq......",
  "sssssssssssssssssss",
  "SSSSSSSSSSSSSSSSSSS",
  "ssssssssssssssssss.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  ".s.s.s.s.s.s.s.s.s.",
  "sssssssssssssssssss"
];
var EUROPE = [
  {
    name: "PARIS",
    ink: "#364fc7",
    stamp: { bg: "#edf2ff", grid: ["..k..", "..k..", ".kkk.", ".k.k.", "k...k"], colors: { k: "#6b5a48" } },
    souvenir: { name: "a croissant", grid: ["..ccc..", ".cCcCc.", "cc...cc"], colors: { c: "#e0a458", C: "#b97a36" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 6, y + 8, 20) + cloud(x + 36, y + 16, 14) + px2(EIFFEL, { k: "#6b5a48", e: "#ffd43b" }, x + 58, y + 4) + ground(x, y, 50, "#79b865", "#8cc97a"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 }
    })
  },
  {
    name: "LONDON",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..k..", ".ttt.", ".twt.", ".ttt.", ".ttt.", "ttttt"], colors: { k: "#5b4636", t: "#c8a86b", w: "#ffffff" } },
    souvenir: { name: "a cup of tea", grid: ["..s...", "wwww..", "wtttww", "wtttw.", ".www.."], colors: { s: "#ffffff", w: "#f1f3f5", t: "#a0522d" } },
    draw: (x, y) => ({
      bg: sky(x, y, "mist") + cloud(x + 6, y + 6, 22, "#f1f3f5") + px2(BIG_BEN, { k: "#5b4636", t: "#c8a86b", T: "#a8894f", w: "#fff8e1" }, x + 74, y + 2) + ground(x, y, 50, "#6b717a", "#868e96") + px2(BUS, { r: "#e03131", w: "#cfe8ff", k: "#212529", o: "#6b1414" }, x + 40, y + 36),
      feet: { x: x + 20, y: y + 57 }
    })
  },
  {
    name: "ROME",
    ink: "#c92a2a",
    stamp: { bg: "#fff4e6", grid: ["sssss", "sksks", "sssss", "sksks"], colors: { s: "#d9b98a", k: "#7a5a3a" } },
    souvenir: { name: "a pizza slice", grid: ["bbbbb", "yryry", ".yry.", "..y.."], colors: { b: "#c68b59", y: "#ffd43b", r: "#e03131" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + sun(x + 16, y + 12, 5) + px2(COLOSSEUM, { s: "#d9b98a", a: "#b8966a", k: "#6b4a2a" }, x + 44, y + 22) + ground(x, y, 46, "#c9b28a", "#d9c7a8"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 }
    })
  },
  {
    name: "VENICE",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["k.....", "kk...k", ".kkkkk", "..kk.."], colors: { k: "#1a1a1a" } },
    souvenir: { name: "a carnival mask", grid: ["p...p", "ggggg", "gkgkg", ".ggg."], colors: { g: "#fcc419", k: "#1a1a1a", p: "#be4bdb" } },
    draw: (x, y) => {
      const houses = new RectBatch();
      for (const [hx, hw, hh, c] of [[0, 14, 30, "#f4a261"], [14, 12, 36, "#e76f51"], [70, 12, 34, "#e9c46a"], [82, 14, 28, "#f4a261"]]) {
        houses.add(c, x + hx, y + 40 - hh, hw, hh);
        for (let wy = 40 - hh + 4; wy < 36; wy += 7) houses.add("#264653", x + hx + 3, y + wy, 3, 4).add("#264653", x + hx + hw - 6, y + wy, 3, 4);
      }
      const gondola = new RectBatch().add("#1a1a1a", x + 28, y + 50, 40, 3).add("#1a1a1a", x + 26, y + 47, 3, 4).add("#1a1a1a", x + 66, y + 46, 3, 5).add("#c92a2a", x + 40, y + 49, 14, 1);
      return {
        bg: sky(x, y, "sunset") + houses + `<path d="M${x + 30} ${y + 30}q18 -12 36 0v4q-18 -9 -36 0z" fill="#e9dcc3"/>` + water(x, y, 40, "#2f7fa8", "#a5d8ff") + gondola,
        feet: { x: x + 48, y: y + 50 }
      };
    }
  },
  {
    name: "AMSTERDAM",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["s...s", ".s.s.", "..h..", ".bbb.", ".bwb."], colors: { s: "#6b4a2a", h: "#343a40", b: "#8a5a33", w: "#fff4e6" } },
    souvenir: { name: "wooden clogs", grid: ["....yy", "yyyyyy", ".yyyyy"], colors: { y: "#fcc419" } },
    draw: (x, y) => {
      const tulips = new RectBatch();
      const colours = ["#e03131", "#fcc419", "#f783ac", "#e03131"];
      for (let row2 = 0; row2 < 4; row2++) for (let tx = 0; tx < PW; tx += 4) tulips.add(colours[row2], x + tx + row2 % 2 * 2, y + 46 + row2 * 4, 2, 2).add("#2f9e44", x + tx + row2 % 2 * 2, y + 48 + row2 * 4, 2, 2);
      return {
        bg: sky(x, y, "day") + cloud(x + 10, y + 6, 18) + ground(x, y, 44, "#5eaf57") + px2(WINDMILL, { s: "#6b4a2a", h: "#343a40", b: "#8a5a33", w: "#fff4e6" }, x + 62, y + 16) + tulips,
        feet: { x: x + 24, y: y + 50 }
      };
    }
  },
  {
    name: "SANTORINI",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: [".bbb.", "bbbbb", "wwwww", "wkwkw"], colors: { b: "#1c7ed6", w: "#ffffff", k: "#495057" } },
    souvenir: { name: "a jar of olives", grid: [".kkk.", "jjjjj", "jgGgj", "jGgGj", "jgGgj", "jjjjj"], colors: { k: "#1c7ed6", j: "#d0ebff", g: "#5c940d", G: "#94d82d" } },
    draw: (x, y) => {
      const town = new RectBatch();
      for (const [hx, hy, hw, hh] of [[46, 22, 14, 10], [58, 16, 12, 16], [70, 24, 14, 10], [82, 18, 14, 14], [52, 30, 16, 8], [74, 32, 16, 8]]) {
        town.add("#ffffff", x + hx, y + hy, hw, hh).add("#dee2e6", x + hx, y + hy + hh - 1, hw, 1).add("#1c7ed6", x + hx + 3, y + hy + hh - 5, 3, 4);
      }
      return {
        bg: sky(x, y, "sunset") + sun(x + 20, y + 30, 6, "#fff3bf") + water(x, y, 36, "#1971c2", "#74c0fc") + hill(x, y, 72, 44, 60, 12, "#b08968") + town + `<path d="M${x + 60} ${y + 16}a5 5 0 0 1 10 0z M${x + 84} ${y + 18}a5 5 0 0 1 10 0z" fill="#1c7ed6"/>` + new RectBatch().add("#f1e3c6", x, y + 50, 44, 10).toString(),
        feet: { x: x + 22, y: y + 52 }
      };
    }
  },
  {
    name: "ATHENS",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["..p..", "ppppp", "c.c.c", "c.c.c", "ppppp"], colors: { p: "#e9dcc3", c: "#d8cbb3" } },
    souvenir: { name: "a greek vase", grid: [".oo.", "oooo", "okko", "oooo", ".oo."], colors: { o: "#e8590c", k: "#1a1a1a" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + sun(x + 16, y + 12, 5) + hill(x, y, 68, 40, 72, 14, "#b8a07a") + px2(PARTHENON, { p: "#e9dcc3", c: "#d8cbb3" }, x + 50, y + 8) + ground(x, y, 40, "#c9b28a") + hill(x, y, 16, 60, 30, 20, "#6b8e4e"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 44, y: y + 55 }
    })
  },
  {
    name: "BARCELONA",
    ink: "#e67700",
    stamp: { bg: "#fff9db", grid: ["y...y", "t.t.t", "t.t.t", "ttttt", "ttttt"], colors: { y: "#fcc419", t: "#b08968" } },
    souvenir: { name: "churros", grid: ["b.b.b", "b.b.b", "b.b.b", "kkkkk", "kkkkk"], colors: { b: "#e0a458", k: "#5c3d2e" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 8, y + 8, 18) + px2(SAGRADA, { y: "#fcc419", t: "#b08968", T: "#8a6a4a", k: "#3b2a1a" }, x + 54, y + 14) + // Still under construction, of course.
      new RectBatch().add("#fcc419", x + 90, y + 4, 1, 34).add("#fcc419", x + 78, y + 4, 16, 1).add("#1a1a1a", x + 80, y + 5, 1, 6).toString() + ground(x, y, 38, "#d9c7a8"),
      feet: { x: x + 22, y: y + 55 },
      friend: { x: x + 40, y: y + 55 }
    })
  },
  {
    name: "MOSCOW",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..y..", ".ggg.", "gGgGg", ".ggg.", "rrrrr"], colors: { y: "#fcc419", g: "#2f9e44", G: "#8ce99a", r: "#c92a2a" } },
    souvenir: { name: "a matryoshka", grid: [".ff.", "rffr", "rrrr", "ryyr", ".rr."], colors: { f: "#f8d8b0", r: "#e03131", y: "#fcc419" } },
    draw: (x, y) => ({
      bg: sky(x, y, "snow") + px2(ST_BASILS, { y: "#fcc419", g: "#2f9e44", G: "#8ce99a", r: "#e03131", w: "#ffffff", b: "#1c7ed6", t: "#b5452b", R: "#e8a18f", k: "#3b1a14" }, x + 54, y + 20) + ground(x, y, 46, "#eef3f8", "#ffffff"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 }
    })
  },
  {
    name: "ICELAND",
    ink: "#0b7285",
    stamp: { bg: "#0e1440", grid: ["g.g..", ".g.g.", "..g.g", "wwwww"], colors: { g: "#69db7c", w: "#ffffff" } },
    souvenir: { name: "a puffin", grid: ["kkk.", "kwwo", "kwwO", "kww."], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b", O: "#e8590c" } },
    draw: (x, y) => ({
      bg: sky(x, y, "night") + // The northern lights ripple across the sky.
      `<g class="pf-s-flicker" opacity=".8"><path d="M${x} ${y + 18}q24 -14 48 0t48 0v6q-24 -12 -48 0t-48 0z" fill="#69db7c" opacity=".7"/><path d="M${x} ${y + 28}q24 -10 48 0t48 -4v4q-24 -8 -48 2t-48 0z" fill="#b197fc" opacity=".5"/></g>` + mountain(x, y, 70, 50, 70, 22, "#3b4a6b", 8) + mountain(x, y, 22, 50, 50, 14, "#4a5a7b", 5) + ground(x, y, 48, "#dfe7f0", "#f8fbff"),
      feet: { x: x + 26, y: y + 55 }
    })
  },
  {
    name: "SWISS ALPS",
    ink: "#c92a2a",
    stamp: { bg: "#fff5f5", grid: ["..w..", ".wgw.", ".ggg.", "ggggg"], colors: { w: "#ffffff", g: "#5c7cfa" } },
    souvenir: { name: "swiss cheese", grid: ["..yyy", "yyoyy", "yoyyy", "yyyyo"], colors: { y: "#fcc419", o: "#e8b10f" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + mountain(x, y, 66, 48, 44, 44, "#7d8aa8", 14) + mountain(x, y, 30, 48, 60, 20, "#95a3be", 6) + ground(x, y, 46, "#6fbf5a", "#8cd176") + // A chalet with a pitched roof.
      new RectBatch().add("#b07845", x + 74, y + 40, 16, 10).add("#ffffff", x + 78, y + 43, 3, 3).add("#ffffff", x + 84, y + 43, 3, 3).toString() + `<path d="M${x + 71} ${y + 41}L${x + 82} ${y + 33}L${x + 93} ${y + 41}Z" fill="#6b3a1e"/>`,
      feet: { x: x + 26, y: y + 55 },
      friend: { x: x + 46, y: y + 55 }
    })
  },
  {
    name: "ISTANBUL",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["m.k.m", "m.w.m", "mwwwm", "wwwww"], colors: { m: "#adb5bd", k: "#868e96", w: "#dee2e6" } },
    souvenir: { name: "a mosaic lamp", grid: ["..k..", ".rbr.", "rbybr", ".rbr.", "..k.."], colors: { k: "#b8860b", r: "#e03131", b: "#1c7ed6", y: "#fcc419" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + sun(x + 18, y + 14, 5, "#fff3bf") + px2(MOSQUE, { m: "#c9cfd6", k: "#868e96", w: "#e9e4dc", a: "#8d99ae" }, x + 50, y + 22) + water(x, y, 42, "#3a6ea5", "#a5d8ff") + new RectBatch().add("#b08968", x, y + 50, 40, 10).toString(),
      feet: { x: x + 20, y: y + 52 }
    })
  },
  {
    name: "BERLIN",
    ink: "#343a40",
    stamp: { bg: "#f8f9fa", grid: ["...q...", "..qqq..", "sssssss", "SSSSSSS", "s.s.s.s", "s.s.s.s", "s.s.s.s", "sssssss"], colors: { q: "#2f9e44", s: "#c9b28a", S: "#a68b5b" } },
    souvenir: { name: "a pretzel", grid: [".bb.bb.", "b..b..b", "b.bwb.b", "bb...bb", ".bbwbb."], colors: { b: "#b5651d", w: "#f8f9fa" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + cloud(x + 8, y + 6, 20) + px2(GATE, { q: "#3f8f6a", s: "#d9c49a", S: "#b8a07a" }, x + 54, y + 20) + ground(x, y, 42, "#adb5bd", "#ced4da"),
      feet: { x: x + 24, y: y + 55 },
      friend: { x: x + 42, y: y + 55 }
    })
  }
];

// src/pet/surprises/places/oceania.ts
var MOAI = outlined([
  ".ssss.",
  "ssssss",
  "kSSSSk",
  "skSSks",
  "ssSSss",
  "ssSSss",
  "sSSSSs",
  "ssssss",
  "skkkks",
  "ssssss",
  ".ssss.",
  "ssssss",
  "ssssss"
]);
var PENGUIN = outlined(["..kk..", ".kkkk.", ".kwkw.", "kkwwff", "kwwwk.", "kwwwk.", "kwwwk.", ".f..f."]);
var CORAL = ["p..p..p.", "p.p.p.p.", "ppp.ppp.", ".p...p..", ".pp.pp..", "..ppp...", "...p....", "...p...."];
var TURTLE = outlined(["..ggg...", ".gGgGg..", "gGgGgGgh", ".ggggg..", "h.....h."]);
var OCEANIA = [
  {
    name: "SYDNEY",
    ink: "#1864ab",
    stamp: { bg: "#e7f5ff", grid: ["..w..w", ".ww.ww", "wwwwww", "bbbbbb"], colors: { w: "#ffffff", b: "#1c7ed6" } },
    souvenir: { name: "a boomerang", grid: ["bb....", "bbb...", ".bbb..", "..bbbb", "...bbb"], colors: { b: "#a0673a" } },
    draw: (x, y) => ({
      bg: sky(x, y, "day") + sun(x + 16, y + 10, 5) + // The Harbour Bridge's arch behind, the Opera House's sails in front.
      `<path d="M${x + 30} ${y + 38}Q${x + 60} ${y + 4} ${x + 96} ${y + 38}" fill="none" stroke="#6c7890" stroke-width="3"/>` + new RectBatch().add("#6c7890", x + 30, y + 36, 66, 2).toString() + `<path d="M${x + 44} ${y + 42}L${x + 54} ${y + 22}L${x + 58} ${y + 42}Z M${x + 54} ${y + 42}L${x + 64} ${y + 18}L${x + 70} ${y + 42}Z M${x + 66} ${y + 42}L${x + 76} ${y + 26}L${x + 80} ${y + 42}Z" fill="#f8f9fa" stroke="#ced4da" stroke-width=".8"/>` + new RectBatch().add("#c9a88a", x + 40, y + 42, 44, 4).toString() + water(x, y, 46, "#1c7ed6", "#a5d8ff") + new RectBatch().add("#b0a08a", x, y + 50, 36, 10).toString(),
      feet: { x: x + 18, y: y + 52 }
    })
  },
  {
    name: "GREAT BARRIER REEF",
    ink: "#0b7285",
    stamp: { bg: "#c5f6fa", grid: ["..oo..o", ".owowoo", "oowowoo", ".owowoo", "..oo..o"], colors: { o: "#ff922b", w: "#ffffff" } },
    souvenir: { name: "a seashell", grid: ["..p..", ".pPp.", "pPpPp", "ppppp"], colors: { p: "#fcc2d7", P: "#f783ac" } },
    draw: (x, y) => ({
      bg: new RectBatch().add("#0c8599", x, y, PW, 60).add("#1098ad", x, y, PW, 20).add("#15aabf", x, y, PW, 8).toString() + `<g opacity=".15" fill="#ffffff"><path d="M${x + 20} ${y}h8l-18 60h-8z M${x + 60} ${y}h8l-18 60h-8z"/></g>` + px2(CORAL, { p: "#ff8787" }, x + 56, y + 36) + px2(CORAL, { p: "#ffa94d" }, x + 76, y + 40) + px2(CORAL, { p: "#da77f2" }, x + 4, y + 42) + px2(TURTLE, { g: "#5c940d", G: "#94d82d", h: "#8ce99a", o: "#2b5f0a" }, x + 60, y + 12) + ground(x, y, 54, "#f4d58d"),
      feet: { x: x + 28, y: y + 54 }
    })
  },
  {
    name: "EASTER ISLAND",
    ink: "#5c940d",
    stamp: { bg: "#f4fce3", grid: [".ss.", "ssss", "kSSk", "sSSs", "sSSs", "skks", "ssss"], colors: { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30" } },
    souvenir: { name: "a mini moai", grid: [".ss.", "ssss", "kSSk", "sSSs", "sSSs", "skks", "ssss"], colors: { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30" } },
    draw: (x, y) => ({
      bg: sky(x, y, "sunset") + sun(x + 20, y + 30, 7, "#fff3bf") + water(x, y, 36, "#3a6ea5", "#ffd8a8") + hill(x, y, 70, 50, 70, 18, "#6f9e4f") + ground(x, y, 50, "#6f9e4f") + [52, 66, 80].map((mx, i) => px2(MOAI, { s: "#8a8a7a", S: "#6b6b5c", k: "#3b3b30", o: "#3b3b30" }, x + mx, y + 20 + i % 2 * 2)).join(""),
      feet: { x: x + 26, y: y + 56 }
    })
  },
  {
    name: "ANTARCTICA",
    ink: "#1971c2",
    stamp: { bg: "#e7f5ff", grid: [".kk.", "kwwk", "kwwk", ".o.o"], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b" } },
    souvenir: { name: "a penguin plush", grid: [".kk.", "kwkw", "kwwo", "kwwk", ".oo."], colors: { k: "#1a1a1a", w: "#ffffff", o: "#ff922b" } },
    draw: (x, y) => ({
      bg: sky(x, y, "snow") + mountain(x, y, 70, 40, 60, 20, "#dbe7f3", 20, "#f8fbff") + mountain(x, y, 30, 40, 40, 12, "#e7eef6", 12, "#ffffff") + water(x, y, 38, "#4a7fb0", "#dbe7f3") + ground(x, y, 46, "#f1f5f9", "#ffffff") + [60, 72, 84].map((px0, i) => px2(PENGUIN, { k: "#1a1a1a", w: "#ffffff", f: "#ff922b", o: "#343a40" }, x + px0, y + 34 + i % 2 * 3)).join(""),
      feet: { x: x + 24, y: y + 56 }
    })
  }
];

// src/pet/surprises/places/programmer.ts
var PALM2 = ["gg.gg..", ".gggg.g", "gg.bggg", "...b..g", "...b...", "..b....", "..b....", "..b...."];
var KERNEL = ["..yyyyyyyyyy..", ".yyyyyyyyyyyy.", "yyhhyyyyyyyyyo", "yyhyyyyyyyyyyo", ".yyyyyyyyyyyo.", "..yyyyyyyyyo..", "...yyyyyyyo...", "....yyyyyo....", ".....wwww.....", "......ww......"];
var DUCK = outlined(["...yyy...", "..yyyyk..", "..yyyyyrr", "..yyyy...", "yyyyyyyy.", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy.."]);
var FLAMES = ["..r.....r....r...r.....r..", ".rr..r.rrr..rr..rrr..r.rr.", "rryrrrrryrrrryrrryrrrrryrr", "ryyyrryyyyrryyyrryyyrryyyr"];
var QUESTION = ["xx.", "..x", ".x.", "...", ".x."];
var PROGRAMMER_PLACES = [
  {
    name: "NULL ISLAND",
    ink: "#1971c2",
    stamp: { bg: "#d0ebff", grid: ["gg.gg", ".ggg.", "..b..", "..b..", "yyyyy"], colors: { g: "#2f9e44", b: "#8a5a33", y: "#f4d58d" } },
    souvenir: { name: "a coconut", grid: [".bbb.", "bbwbb", "bbbbb", ".bbb."], colors: { b: "#8a5a33", w: "#f1e3c6" } },
    draw: (x, y) => ({
      bg: new RectBatch().add("#8fd3ff", x, y, PW, 38).add("#3a86c8", x, y + 38, PW, 22).add("#9fd4ff", x + 8, y + 44, 10, 1).add("#9fd4ff", x + 70, y + 50, 12, 1).add("#f4d58d", x + 18, y + 34, 58, 6).add("#f4d58d", x + 24, y + 32, 46, 2).add("#8a5a33", x + 10, y + 24, 2, 10).add("#ffffff", x + 3, y + 18, 17, 7).toString() + `<circle cx="${x + 84}" cy="${y + 10}" r="6" fill="#ffe066"/>` + text("0,0", x + 5, y + 19, 1, "#1f2328") + px(PALM2, { g: "#2f9e44", b: "#8a5a33" }, x + 60, y + 16, 2),
      feet: { x: x + 40, y: y + 34 },
      friend: { x: x + 68, y: y + 34 }
    })
  },
  {
    name: "LOCALHOST",
    ink: "#2b8a3e",
    stamp: { bg: "#ffe8cc", grid: ["..r..", ".rrr.", "rrrrr", "wwkww", "wwkww"], colors: { r: "#c92a2a", w: "#f8f0e3", k: "#8a5a33" } },
    souvenir: { name: "a keychain", grid: [".yy..", "y..y.", ".yy..", "..y..", "..yy.", "..y.."], colors: { y: "#e0a800" } },
    draw: (x, y) => ({
      bg: `<rect x="${x}" y="${y}" width="${PW}" height="44" fill="#ffd8a8"/><circle cx="${x + 14}" cy="${y + 36}" r="8" fill="#ffa94d"/>` + new RectBatch().add("#8ce99a", x, y + 44, PW, 16).add("#69db7c", x, y + 44, PW, 2).add("#f8f0e3", x + 54, y + 24, 36, 20).add("#ffffff", x + 56, y + 26, 32, 7).add("#8a5a33", x + 67, y + 34, 8, 10).add("#ffd43b", x + 57, y + 35, 7, 6).add("#ffd43b", x + 79, y + 35, 7, 6).toString() + `<path d="M${x + 50} ${y + 24}L${x + 72} ${y + 8}L${x + 94} ${y + 24}Z" fill="#c92a2a"/>` + text("127.0.0.1", x + 57, y + 27, 1, "#495057"),
      feet: { x: x + 26, y: y + 46 },
      friend: { x: x + 44, y: y + 47 }
    })
  },
  {
    name: "THE CLOUD",
    ink: "#1c7ed6",
    stamp: { bg: "#74c0fc", grid: [".ww..", "wwwww", "wwwww"], colors: { w: "#ffffff" } },
    souvenir: { name: "a cloud in a jar", grid: [".kkk.", "gwwwg", "gwwwg", "gwwwg", ".ggg."], colors: { k: "#8a5a33", g: "#a5d8ff", w: "#ffffff" } },
    draw: (x, y) => {
      const leds = [0, 1, 2].map((i) => `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${x + 66}" y="${y + 20 + i * 5}" width="8" height="2" fill="#51cf66"/>`).join("");
      return {
        bg: new RectBatch().add("#74c0fc", x, y, PW, 60).add("#a5d8ff", x, y + 30, PW, 30).add("#ffffff", x + 4, y + 42, 88, 18).add("#ffffff", x + 10, y + 35, 36, 8).add("#ffffff", x + 52, y + 33, 34, 10).add("#ffffff", x + 70, y + 8, 18, 5).add("#ffffff", x + 74, y + 5, 10, 3).add("#495057", x + 63, y + 16, 14, 18).add("#343a40", x + 63, y + 16, 14, 2).toString() + leds,
        feet: { x: x + 28, y: y + 38 },
        friend: { x: x + 46, y: y + 40 }
      };
    }
  },
  {
    name: "STACK OVERFLOW",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["ooooo.", "o.o.o.", "ooooo.", ".ooooo", ".o.o.o", ".ooooo"], colors: { o: "#f76707" } },
    souvenir: { name: "a spare box", grid: ["oooooo", "oyyyyo", "oyooyo", "oyyyyo", "oooooo"], colors: { o: "#7a3500", y: "#ffa94d" } },
    draw: (x, y) => {
      let boxes = "";
      for (let i = 0; i < 5; i++) {
        boxes += `<rect x="${x + 60 + (i % 2 ? 3 : -2)}" y="${y + 41 - i * 8}" width="20" height="7" fill="${i % 2 ? "#ffa94d" : "#f76707"}" stroke="#7a3500" stroke-width="1"/>`;
      }
      return {
        bg: new RectBatch().add("#d0ebff", x, y, PW, 48).add("#ced4da", x, y + 48, PW, 12).toString() + boxes + `<g class="pf-s-teeter"><rect x="${x + 64}" y="${y - 3}" width="20" height="7" fill="#f76707" stroke="#7a3500" stroke-width="1"/></g>`,
        feet: { x: x + 26, y: y + 49 },
        friend: { x: x + 46, y: y + 49 }
      };
    }
  },
  {
    name: "PORT 8080",
    ink: "#0b7285",
    stamp: { bg: "#c5f6fa", grid: ["..k..", ".kkk.", "..k..", "k.k.k", ".kkk."], colors: { k: "#0b7285" } },
    souvenir: { name: "an anchor", grid: ["..k..", ".kkk.", "..k..", "k.k.k", ".kkk."], colors: { k: "#495057" } },
    draw: (x, y) => {
      let tower = "";
      for (let i = 0; i < 4; i++) tower += `<rect x="${x + 78}" y="${y + 10 + i * 6}" width="9" height="6" fill="${i % 2 ? "#ffffff" : "#e03131"}"/>`;
      return {
        bg: new RectBatch().add("#a5d8ff", x, y, PW, 34).add("#1971c2", x, y + 34, PW, 26).add("#74c0fc", x + 56, y + 44, 12, 1).add("#74c0fc", x + 82, y + 50, 10, 1).add("#8a5a33", x, y + 32, 50, 4).add("#6b4226", x + 4, y + 36, 3, 14).add("#6b4226", x + 44, y + 36, 3, 14).add("#8a5a33", x + 58, y + 22, 2, 12).add("#ffffff", x + 50, y + 15, 19, 8).toString() + tower + `<rect x="${x + 77}" y="${y + 3}" width="11" height="7" fill="#343a40"/><rect class="pf-s-blink" x="${x + 79}" y="${y + 5}" width="7" height="3" fill="#ffe066"/>` + text("8080", x + 52, y + 16.5, 1, "#1f2328"),
        feet: { x: x + 24, y: y + 33 }
      };
    }
  },
  {
    name: "THE KERNEL",
    ink: "#e67700",
    stamp: { bg: "#3b1f5c", grid: [".yyy.", "yyyyy", "yyyyy", ".yyy.", "..w.."], colors: { y: "#ffd43b", w: "#fff9db" } },
    souvenir: { name: "some popcorn", grid: ["w.w.w", "wwwww", "rwrwr", "rwrwr", ".rwr."], colors: { w: "#fff9db", r: "#e03131" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#3b1f5c", x, y, PW, 46).add("#5c3d2e", x, y + 46, PW, 14);
      for (const [sx, sy] of [[6, 8], [24, 20], [40, 6], [88, 12], [92, 34]]) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg: b + px(KERNEL, { y: "#ffd43b", h: "#fff3bf", o: "#f59f00", w: "#fff9db" }, x + 56, y + 16, 2),
        feet: { x: x + 28, y: y + 47 },
        friend: { x: x + 44, y: y + 48 }
      };
    }
  },
  {
    name: "404 NOT FOUND",
    ink: "#868e96",
    stamp: { bg: "#e9ecef", grid: QUESTION, colors: { x: "#868e96" } },
    souvenir: { name: "nothing (404)", grid: ["kkkkk", "k.x.k", "k..xk", "k.x.k", "kkkkk"], colors: { k: "#868e96", x: "#495057" } },
    // The photo didn't come out: just "404", and a tail at the edge of the frame.
    draw: (x, y) => ({
      bg: `<rect x="${x}" y="${y}" width="${PW}" height="${PH}" fill="#e9ecef"/>` + text("404", x + 26, y + 10, 4, "#adb5bd") + text("NOT FOUND", x + 31, y + 38, 1, "#adb5bd"),
      feet: { x: x + PW + 8, y: y + 58 }
    })
  },
  {
    name: "/DEV/NULL",
    ink: "#5f3dc4",
    stamp: { bg: "#1a1a2e", grid: [".ooo.", "o...o", "o.k.o", "o...o", ".ooo."], colors: { o: "#845ef7", k: "#ffffff" } },
    souvenir: { name: "an empty bag", grid: ["..k..", ".k.k.", "bbbbb", "b...b", "bbbbb"], colors: { k: "#495057", b: "#adb5bd" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#0b0b14", x, y, PW, PH);
      for (const [sx, sy] of [[8, 6], [20, 40], [44, 8], [86, 20], [80, 52], [12, 54]]) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg: b + `<ellipse cx="${x + 62}" cy="${y + 26}" rx="24" ry="7" fill="none" stroke="#ff922b" stroke-width="2" opacity=".85"/><circle cx="${x + 62}" cy="${y + 26}" r="10" fill="#000000" stroke="#845ef7" stroke-width="2"/><path d="M${x + 38} ${y + 26}a24 7 0 0 0 48 0" fill="none" stroke="#ffc078" stroke-width="2"/>`,
        feet: { x: x + 24, y: y + 50 }
      };
    }
  },
  {
    name: "SPAGHETTI CODE",
    ink: "#c92a2a",
    stamp: { bg: "#fff9db", grid: ["yyy..", "y.yyy", "yyy.y", "..yyy", ".rr.."], colors: { y: "#fab005", r: "#a0522d" } },
    souvenir: { name: "a meatball", grid: [".rr.", "rRrr", "rrrr", ".rr."], colors: { r: "#8a4b2a", R: "#b86b40" } },
    draw: (x, y) => {
      const cloth = new RectBatch().add("#ffe3e3", x, y, PW, 38);
      for (let cx = 0; cx < PW; cx += 8) for (let cy = 38; cy < PH; cy += 8) cloth.add((cx + cy) % 16 ? "#ffffff" : "#e03131", x + cx, y + cy, 8, 8);
      const noodles = px(["..yyy.yyyy..", ".yy.yyy..yy.", "yyyy.yy.yyyy", "y.yyyyyyy.yy", ".yyy.yyyyyy."], { y: "#fcc419" }, x + 24, y + 34, 4);
      return {
        bg: cloth + `<ellipse cx="${x + 48}" cy="${y + 50}" rx="36" ry="8" fill="#ffffff" stroke="#ced4da" stroke-width="1"/>` + noodles + `<circle cx="${x + 70}" cy="${y + 38}" r="5" fill="#8a4b2a"/>`,
        feet: { x: x + 42, y: y + 40 }
      };
    }
  },
  {
    name: "THE FIREWALL",
    ink: "#e8590c",
    stamp: { bg: "#fff4e6", grid: ["..r..", ".rr..", ".ryr.", "ryyyr", ".rrr."], colors: { r: "#f03e3e", y: "#ffd43b" } },
    souvenir: { name: "a marshmallow", grid: ["ww...", "ww...", "..b..", "...b.", "....b"], colors: { w: "#fff4e6", b: "#8a5a33" } },
    draw: (x, y) => {
      const wall = new RectBatch().add("#2b1a3a", x, y, PW, 60).add("#3b2a1a", x, y + 50, PW, 10);
      for (let row2 = 0; row2 < 4; row2++) for (let col = -1; col < 10; col++) wall.add(row2 % 2 ? "#b33b2b" : "#c9452f", x + col * 10 + row2 % 2 * 5, y + 26 + row2 * 6, 9, 5);
      return {
        bg: wall + `<g class="pf-s-flicker">${px(FLAMES, { r: "#ff6b3b", y: "#ffd43b" }, x - 4, y + 10, 4)}</g>`,
        feet: { x: x + 28, y: y + 58 },
        fg: `<path d="M${x + 44} ${y + 46}L${x + 62} ${y + 30}" stroke="#8a5a33" stroke-width="1.5"/><rect x="${x + 60}" y="${y + 26}" width="5" height="5" rx="1" fill="#fff4e6"/>`
      };
    }
  },
  {
    name: "HELLO WORLD",
    ink: "#1c7ed6",
    stamp: { bg: "#0b1d3a", grid: [".bbb.", "bgbgb", "bbgbb", "bgbbb", ".bbb."], colors: { b: "#4dabf7", g: "#51cf66" } },
    souvenir: { name: "a snow globe", grid: [".www.", "wbwbw", "wwgww", ".www.", "kkkkk"], colors: { w: "#e7f5ff", b: "#ffffff", g: "#51cf66", k: "#8a5a33" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#0b1d3a", x, y, PW, PH);
      for (const [sx, sy] of [[8, 8], [30, 14], [70, 6], [88, 24], [14, 30], [80, 40]]) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return {
        bg: b + `<circle cx="${x + 48}" cy="${y + 70}" r="34" fill="#4dabf7"/><path d="M${x + 26} ${y + 46}q8 -6 16 0t12 4v14h-28z M${x + 58} ${y + 42}q6 -2 12 4v10h-12z" fill="#51cf66"/><circle cx="${x + 48}" cy="${y + 70}" r="34" fill="none" stroke="#a5d8ff" stroke-width="1"/>`,
        feet: { x: x + 48, y: y + 37 }
      };
    }
  },
  {
    name: "RUBBER DUCK POND",
    ink: "#e67700",
    stamp: { bg: "#c5f6fa", grid: ["..yy.", ".yyyr", "yyyy.", ".yyy."], colors: { y: "#fcc419", r: "#f76707" } },
    souvenir: { name: "a rubber duck", grid: ["..yy.", ".yyyr", "yyyy.", ".yyy."], colors: { y: "#fcc419", r: "#f76707" } },
    draw: (x, y) => ({
      bg: new RectBatch().add("#c5f6fa", x, y, PW, 36).add("#4dabf7", x, y + 36, PW, 24).add("#a5d8ff", x + 6, y + 44, 12, 1).add("#a5d8ff", x + 76, y + 50, 12, 1).toString() + px(DUCK, { y: "#fcc419", k: "#1a1a1a", r: "#f76707", o: "#8a6a00" }, x + 34, y + 20, 4),
      feet: { x: x + 50, y: y + 28 }
    })
  },
  {
    name: "THE MAINFRAME",
    ink: "#2b8a3e",
    stamp: { bg: "#e9ecef", grid: ["kkkkk", "kwwwk", "kkkkk", "kgggk", "kgggk"], colors: { k: "#343a40", w: "#ffffff", g: "#adb5bd" } },
    souvenir: { name: "a floppy disk", grid: ["kkkkk", "kwwwk", "kkkkk", "kgggk", "kgggk"], colors: { k: "#1c7ed6", w: "#ffffff", g: "#dee2e6" } },
    draw: (x, y) => {
      const b = new RectBatch().add("#343a40", x, y, PW, 46).add("#212529", x, y + 46, PW, 14);
      let reels = "";
      for (const cx of [52, 72]) {
        b.add("#adb5bd", x + cx - 8, y + 8, 18, 38);
        reels += `<circle cx="${x + cx + 1}" cy="${y + 16}" r="5" fill="#495057" stroke="#dee2e6"/><circle cx="${x + cx + 1}" cy="${y + 28}" r="5" fill="#495057" stroke="#dee2e6"/>`;
        for (let i = 0; i < 3; i++) reels += `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${x + cx - 5 + i * 5}" y="${y + 38}" width="3" height="2" fill="${["#ff6b6b", "#51cf66", "#ffd43b"][i]}"/>`;
      }
      return { bg: b + reels, feet: { x: x + 22, y: y + 56 } };
    }
  }
];

// src/pet/surprises/places/index.ts
var PLACES = [...PROGRAMMER_PLACES, ...ASIA, ...EUROPE, ...AFRICA, ...AMERICAS, ...OCEANIA];

// src/pet/sprite.ts
var FACE2 = {
  happy: { eyes: "happy", mouth: "smile", blush: true },
  idle: { eyes: "open", mouth: "smile", blush: false },
  hungry: { eyes: "sad", mouth: "frown", blush: false },
  sleeping: { eyes: "closed", mouth: "neutral", blush: false }
};
var FRAME_SPEED = { happy: 0.3, idle: 0.24, hungry: 1, sleeping: 1 };
var SPRITE_CSS = `
.pf-fa{animation:pf-a 1s steps(1) infinite}
.pf-fb{opacity:0;animation:pf-b 1s steps(1) infinite}
@keyframes pf-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
${BEHAVIOR_CSS}
.pf-bob{animation:pf-bob 2s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
`;
function frames(a, b, seconds) {
  if (a === b) return a;
  const style = `style="animation-duration:${seconds * 2}s"`;
  return `<g class="pf-fa" ${style}>${a}</g><g class="pf-fb" ${style}>${b}</g>`;
}
function renderPetSprite(state, scale, { lively = true, emote = true, eyes: swap = null, hat, face: faceArt = "" } = {}) {
  if (state.stage === "egg") return eggSprite(state, scale);
  const species = getSpecies(state.species);
  const legendary = state.stage === "legendary";
  const palette = legendary ? { ...species.palette, ...species.legendaryPalette } : species.palette;
  const px9 = (layers) => renderPixels(layers, palette, { scale });
  const face = FACE2[state.mood];
  const [limbA, limbB] = species.limbs[state.mood];
  const side = glance(species.eyes.open);
  let eyes6 = state.mood === "idle" ? `<g class="pf-eo">${px9(species.eyes.open)}</g>${side ? `<g class="pf-eg">${px9(side)}</g>` : ""}<g class="pf-es">${px9(species.eyes.closed)}</g>` : px9(species.eyes[face.eyes]);
  if (swap) {
    const alt = (kind) => px9(kind === "closed" ? species.eyes.closed : crossEyes(species.eyes.open, species.width));
    eyes6 = `<g class="${swap.hide}">${eyes6}</g>${swap.alts.map((a) => `<g class="${a.cls}">${alt(a.kind)}</g>`).join("")}`;
  }
  let crown2 = "";
  const cs = Math.max(1, Math.round(scale * 3 / 4));
  if (hat) {
    const hx = species.crownAnchor.x * scale - (hat.cx ?? hat.grid[0].length / 2) * scale;
    const hy = species.crownAnchor.y * scale - (hat.grid.length - (hat.sink ?? 1)) * scale;
    crown2 = renderPixels([{ x: 0, y: 0, grid: hat.grid }], hat.palette, { x: hx, y: hy, scale });
  } else if (legendary) {
    const cx = species.crownAnchor.x * scale - CROWN[0].length * cs / 2;
    const cy = species.crownAnchor.y * scale - CROWN.length * cs - 1.5 * scale;
    crown2 = `<g class="pf-bob">${renderPixels([{ x: 0, y: 0, grid: CROWN }], FX_PALETTE, { x: cx, y: cy, scale: cs })}</g>`;
  }
  let svg = [
    frames(px9(limbA), px9(limbB), FRAME_SPEED[state.mood]),
    px9(species.body),
    px9(species.mouths[face.mouth]),
    face.blush ? px9(species.blush) : "",
    eyes6,
    faceArt,
    crown2
  ].join("");
  let css = "";
  if (lively && playful(state.mood)) {
    const tricks = state.trick ? TRICK_STARTS.map(() => state.trick) : tricksFor(state.date, state.login);
    let body = svg;
    let beside = "";
    tricks.forEach((trick, slot) => {
      const t = trickLayers(trick, species, scale, slot);
      body = `${t.under}${body}${t.overlay}`;
      if (t.bodyClass) body = `<g class="${t.bodyClass}">${body}</g>`;
      beside += t.beside;
      css += t.css;
    });
    const bubble2 = emote ? emoteBubble(state.mood === "happy" ? "note" : "question", species.width * scale - 4, anchors(species).top * scale - 2, "pf-emote") : "";
    svg = `${body}${beside}${bubble2}`;
  }
  return { svg, width: species.width * scale, height: species.height * scale, css };
}
function eggSprite(state, scale) {
  const layers = [{ x: 0, y: 0, grid: EGG }];
  if (state.xp / xpForLevel(3) >= 0.5) layers.push({ x: 0, y: 0, grid: EGG_CRACK });
  return {
    svg: renderPixels(layers, EGG_PALETTE, { scale }),
    width: EGG[0].length * scale,
    height: EGG.length * scale
  };
}

// src/pet/surprises/postcard.ts
var SPARKLE2 = ["..s..", ".sss.", "sssss", ".sss.", "..s.."];
var PLACE_COUNT = PLACES.length;
function tripFor(login, date) {
  const rng = seeded(`postcard:${login}:${date}`);
  const place = pick(rng, PLACES);
  const roll = rng();
  return {
    place,
    golden: roll < 0.08,
    night: roll >= 0.08 && roll < 0.22,
    friend: roll >= 0.22 && roll < 0.42 ? pick(rng, Object.keys(SPECIES)) : null
  };
}
function postcardPlace(login, date) {
  return tripFor(login, date).place;
}
var placeTitle = (name) => name.startsWith("/") ? name.toLowerCase() : name.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase());
var at = (sprite, feet6) => `<g transform="translate(${round(feet6.x - sprite.width / 2)} ${round(feet6.y - sprite.height)})">${sprite.svg}</g>`;
function postcard(c) {
  const { scene: sc, state } = c;
  const trip = tripFor(state.login, state.date);
  const { place } = trip;
  const snapshot = (species) => renderPetSprite({ ...state, species, mood: "happy", trick: void 0, care: void 0 }, 2, { lively: false });
  const W3 = 152;
  const H3 = 98;
  const x = sc.x + 6;
  const y = sc.y + 34;
  const photo = { x: x + 6, y: y + 6 };
  const shot = place.draw(photo.x, photo.y);
  const night = trip.night ? `<rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}" fill="#0b1040" opacity=".5"/>` + [[10, 6], [30, 14], [62, 4], [84, 10], [48, 18]].map(([dx, dy]) => `<rect x="${photo.x + dx}" y="${photo.y + dy}" width="1.5" height="1.5" fill="#fff8d6"/>`).join("") : "";
  const friend2 = trip.friend && shot.friend && trip.friend !== state.species ? at(snapshot(trip.friend), shot.friend) : "";
  const pictured = `${shot.bg}${night}${friend2}${at(snapshot(state.species), shot.feet)}${shot.fg ?? ""}`;
  const sx = x + W3 - 34;
  const sy = y + 6;
  const iconW = place.stamp.grid[0].length * 2;
  const iconH = place.stamp.grid.length * 2;
  const iconColors = trip.golden ? Object.fromEntries(Object.keys(place.stamp.colors).map((k) => [k, "#b8860b"])) : place.stamp.colors;
  const stamp = `<rect x="${sx}" y="${sy}" width="26" height="30" fill="#ffffff" stroke="${trip.golden ? "#c99a1a" : "#adb5bd"}" stroke-width="1" stroke-dasharray="2 1"/><rect x="${sx + 3}" y="${sy + 3}" width="20" height="24" fill="${trip.golden ? "#ffe066" : place.stamp.bg}"/>` + px(place.stamp.grid, iconColors, sx + 13 - iconW / 2, sy + 15 - iconH / 2, 2) + (trip.golden ? `<g class="pf-s-twinkle">${px(SPARKLE2, { s: "#fff9db" }, sx + 18, sy - 3, 1.5)}</g>` : "");
  const postmark = `<g fill="none" stroke="#495057" stroke-width="1" opacity=".5"><circle cx="${sx}" cy="${sy + 30}" r="8"/><circle cx="${sx}" cy="${sy + 30}" r="5"/></g>`;
  const address = new RectBatch().add("#c9b79a", x + PW + 12, y + 50, W3 - PW - 20, 1).add("#c9b79a", x + PW + 12, y + 57, W3 - PW - 20, 1).add("#c9b79a", x + PW + 12, y + 64, W3 - PW - 26, 1).toString();
  const scribble = `<path d="M${x + PW + 13} ${y + 47}q3 -3 6 0t6 0t6 0M${x + PW + 13} ${y + 54}q3 -3 6 0t6 0" fill="none" stroke="#5b4636" stroke-width="1"/>`;
  const card = `<rect x="${x + 3}" y="${y + 3}" width="${W3}" height="${H3}" fill="#000000" opacity=".2"/><rect x="${x}" y="${y}" width="${W3}" height="${H3}" fill="#fffaf0" stroke="#d9cbb0" stroke-width="1"/><clipPath id="pf-s-photo"><rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}"/></clipPath><g clip-path="url(#pf-s-photo)">${pictured}</g><rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}" fill="none" stroke="#5b4636" stroke-width="1" opacity=".4"/>` + stamp + postmark + address + scribble + text("GREETINGS FROM", x + 7, y + 71, 1, "#8a6d4b") + text(place.name, x + 7, y + 79, 2, place.ink, "#e9dfcc");
  const line = `<path d="M${sc.x} ${y - 8}Q${sc.x + sc.w / 2} ${y - 2} ${sc.x + sc.w} ${y - 8}" fill="none" stroke="#8d96a0" stroke-width="1"/>`;
  const peg = `<rect x="${x + W3 / 2 - 3}" y="${y - 9}" width="6" height="13" rx="1" fill="#d9a066"/><rect x="${x + W3 / 2 - 1}" y="${y - 9}" width="2" height="13" fill="#b07d4a"/>`;
  const right = sc.x + sc.w;
  const g = sc.ground;
  const mailbox = `<rect x="${right - 14}" y="${g - 24}" width="4" height="24" fill="#8a5a33"/><rect x="${right - 22}" y="${g - 36}" width="20" height="13" rx="4" fill="#1c7ed6"/><rect x="${right - 20}" y="${g - 31}" width="12" height="2" fill="#0b3a66"/><rect x="${right - 4}" y="${g - 46}" width="2" height="12" fill="#e03131"/><rect x="${right - 4}" y="${g - 46}" width="5" height="5" fill="#e03131"/>`;
  return {
    css: `.pf-s-sway{transform-box:fill-box;transform-origin:50% 0;animation:pf-s-sway 4.5s ease-in-out infinite alternate}@keyframes pf-s-sway{from{transform:rotate(-2deg)}to{transform:rotate(1.5deg)}}
.pf-s-teeter{transform-box:fill-box;transform-origin:0 100%;animation:pf-s-teeter 2.4s ease-in-out infinite alternate}@keyframes pf-s-teeter{from{transform:rotate(-4deg)}to{transform:rotate(14deg)}}`,
    replace: `${line}${mailbox}<g class="pf-s-sway">${peg}${card}</g>`,
    line: trip.golden ? "Weekend trip \xB7 a golden stamp!" : `Weekend trip \xB7 ${placeTitle(place.name)}`
  };
}
function souvenir(c) {
  const from = c.state.moments?.backFrom;
  const place = from ? postcardPlace(c.state.login, from) : PLACES[0];
  const grid = outlined(place.souvenir.grid, "@");
  const s = c.scale;
  const w = grid[0].length * s;
  const h = grid.length * s;
  const x = c.species.width * s - w / 3;
  const y = c.species.height * s - h;
  const sparkle = `<g class="pf-s-twinkle">${px(SPARKLE2, { s: "#fff3a0" }, x + w - 4, y - 8, 2)}</g>`;
  return {
    held: px(grid, { ...place.souvenir.colors, "@": "#3b2a1a" }, x, y, s) + sparkle,
    line: `Back home \xB7 brought ${place.souvenir.name}`
  };
}

// src/pet/surprises/rare.ts
var CYCLE = 24;
var pct = (t) => `${+(t / CYCLE * 100).toFixed(2)}%`;
var shown = (name, from, to) => `.${name}{opacity:0;animation:${name} ${CYCLE}s steps(1) infinite}@keyframes ${name}{0%{opacity:0}${pct(from)}{opacity:1}${pct(to)}{opacity:0}100%{opacity:0}}`;
var SAUCER = [
  "......cccccc......",
  ".....cwCCCCCc.....",
  "....cCCCCCCCCc....",
  ".ssssssssssssssss.",
  "sSSSSSSSSSSSSSSSSs",
  ".ssssssssssssssss.",
  "....dddddddddd...."
];
var SAUCER_LIGHTS = ["..................", "..................", "..................", "..................", ".y..r..g..y..r..g.", "..................", ".................."];
function ufo(c) {
  const { scene: sc, box } = c;
  const s = 3;
  const uw = SAUCER[0].length * s;
  const ux = round(box.x + box.w / 2 - uw / 2);
  const uy = sc.y + 16;
  const under = uy + SAUCER.length * s;
  const rise = Math.round(box.y + box.h / 2 - under - 4);
  const beam = `<path class="pf-s-beam" d="M${ux + uw / 2 - 8} ${under}h16L${round(box.x + box.w + 6)} ${box.y + box.h}H${round(box.x - 6)}Z" fill="#b2f2bb" opacity="0"/>`;
  const saucer = `<g class="pf-s-ufo">${px(SAUCER, { c: "#99e9f2", C: "#66d9e8", w: "#ffffff", s: "#adb5bd", S: "#868e96", d: "#495057" }, ux, uy, s)}<g class="pf-s-blink">${px(SAUCER_LIGHTS, { y: "#ffe066", r: "#ff6b6b", g: "#69db7c" }, ux, uy, s)}</g></g>`;
  const top = anchors(c.species).top * c.scale;
  const huh = bubble(pixelText("?!"), box.w - 6, top - 2, "pf-s-huh");
  return {
    css: `.pf-s-ufo{animation:pf-s-ufo ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-ufo{0%{transform:translate(-160px,-50px)}12%{transform:translate(0,0)}20%{transform:translate(0,-3px)}30%{transform:translate(0,0)}50%{transform:translate(0,-3px)}72%{transform:translate(0,0)}86%,100%{transform:translate(180px,-60px)}}
.pf-s-beam{animation:pf-s-beam ${CYCLE}s steps(1) infinite}
@keyframes pf-s-beam{0%{opacity:0}${pct(4.3)}{opacity:.5}${pct(4.6)}{opacity:.15}${pct(4.9)}{opacity:.5}${pct(16.4)}{opacity:0}100%{opacity:0}}
.pf-s-abduct{transform-box:fill-box;transform-origin:center;animation:pf-s-abduct ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-abduct{0%,${pct(5.2)}{transform:none;opacity:1}${pct(10)}{transform:translateY(-${rise}px) scale(.35) rotate(-24deg);opacity:1}${pct(10.4)},${pct(13)}{transform:translateY(-${rise}px) scale(.35);opacity:0}${pct(13.4)}{transform:translateY(-${rise}px) scale(.35) rotate(20deg);opacity:1}${pct(15.6)}{transform:none;opacity:1}100%{transform:none;opacity:1}}
${shown("pf-s-huh", 15.8, 19.4)}`,
    follow: beam + saucer,
    bodyClass: "pf-s-abduct",
    over: huh,
    line: "Close encounter of the pet kind"
  };
}
function friend(c) {
  const { scene: sc, state } = c;
  const id = pick(c.rng, Object.keys(SPECIES).filter((k) => k !== state.species && k !== c.species.id));
  const buddy = getSpecies(id);
  const s = 3;
  const sprite = renderPetSprite({ ...state, species: id, stage: "baby", mood: "idle", trick: void 0, care: void 0 }, s, { lively: false });
  const fw = sprite.width;
  const fh = sprite.height;
  const meet = sc.x + sc.w - fw - 18;
  const y = sc.ground - fh - 4 + s;
  const flip = buddy.facing === "right" ? ` transform="translate(${fw} 0) scale(-1 1)"` : "";
  const hello = bubble(pixelText("HI!"), fw - 4, 0, "pf-s-hi");
  const love = `<g class="pf-s-love">${px(HEART, { p: "#ff5c7a" }, fw / 2 - 5, -12, 2)}</g>`;
  return {
    css: `.pf-s-friend{animation:pf-s-friend ${CYCLE}s linear infinite}
@keyframes pf-s-friend{0%{transform:translateX(${sc.x + sc.w + 4}px)}${pct(4.6)}{transform:translateX(${meet}px)}${pct(11)}{transform:translateX(${meet}px)}${pct(20.5)},100%{transform:translateX(${sc.x - fw - 8}px)}}
.pf-s-wave{animation:pf-s-wave ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-wave{0%,${pct(5)}{transform:none}${pct(5.4)}{transform:translateY(-6px)}${pct(5.8)}{transform:none}${pct(6.2)}{transform:translateY(-6px)}${pct(6.6)},100%{transform:none}}
${shown("pf-s-hi", 5, 8)}
${shown("pf-s-love", 8.2, 10.8)}`,
    back: `<g class="pf-s-friend"><g transform="translate(0 ${y})"><g class="pf-s-wave"><g${flip}>${sprite.svg}</g>${hello}${love}</g></g></g>`,
    line: `${buddy.defaultName} the ${id} dropped by`
  };
}
var WINGS_OPEN = ["pp...pp", "pPp.pPp", ".ppkpp.", "..pkp..", ".pp.pp."];
var WINGS_SHUT = [".......", "..p.p..", "..pkp..", "..pkp..", "...k..."];
function butterfly(c) {
  const { species, scale } = c;
  const a = anchors(species);
  const side = species.facing === "right";
  const eye = a.eyes[0];
  const nose = side ? { x: Math.min(species.width - 1, eye.x + 2), y: eye.y } : { x: a.eyes.reduce((sum, e) => sum + e.x, 0) / a.eyes.length, y: Math.max(...a.eyes.map((e) => e.y)) + 1 };
  const bx = round(nose.x * scale - 7);
  const by = round(nose.y * scale - 9);
  const palette = { p: "#ffa94d", P: "#fff3bf", k: "#343a40" };
  const wings2 = `<g class="pf-fa" style="animation-duration:.3s">${px(WINGS_OPEN, palette, 0, 0, 2)}</g><g class="pf-fb" style="animation-duration:.3s">${px(WINGS_SHUT, palette, 0, 0, 2)}</g>`;
  return {
    css: `.pf-s-fly{animation:pf-s-fly ${CYCLE}s ease-in-out infinite}
@keyframes pf-s-fly{0%{transform:translate(-60px,-70px);opacity:0}3%{opacity:1}14%{transform:translate(50px,-50px)}26%{transform:translate(-24px,-44px)}38%{transform:translate(18px,-30px)}${pct(10.8)}{transform:translate(0,-8px)}${pct(11.3)},${pct(16.3)}{transform:translate(0,0);opacity:1}${pct(17.4)}{transform:translate(26px,-26px)}${pct(19.4)}{transform:translate(80px,-80px);opacity:1}${pct(19.5)},100%{transform:translate(-60px,-70px);opacity:0}}`,
    held: `<g transform="translate(${bx} ${by})"><g class="pf-s-fly">${wings2}</g></g>`,
    crossed: [[11.4, 16.3]],
    line: "A butterfly landed on its nose"
  };
}
function sunglasses(c) {
  const { scene: sc } = c;
  const sx = sc.x + sc.w - 30;
  const sy = sc.y + 28;
  let rays = "";
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    rays += `<rect x="${round(sx + Math.cos(angle) * 16 - 2)}" y="${round(sy + Math.sin(angle) * 16 - 2)}" width="4" height="4" fill="#ffd43b"/>`;
  }
  return {
    css: `.pf-s-glint{animation:pf-s-glint 4s steps(1) infinite}@keyframes pf-s-glint{0%,78%{opacity:0}80%,90%{opacity:.9}92%,100%{opacity:0}}
.pf-s-sun{transform-box:fill-box;transform-origin:center;animation:pf-s-sun 16s linear infinite}@keyframes pf-s-sun{to{transform:rotate(360deg)}}`,
    back: `<g class="pf-s-sun">${rays}</g><circle cx="${sx}" cy="${sy}" r="10" fill="#ffd43b"/><circle cx="${sx - 3}" cy="${sy - 3}" r="3" fill="#fff3bf"/>`,
    face: glasses(c.species, c.scale, "shades"),
    line: "Summer mode \xB7 too cool for school"
  };
}
var RARE_ART = { ufo, friend, butterfly, sunglasses };

// src/pet/surprises/index.ts
var isHoliday = (s) => HOLIDAYS.includes(s);
var tripRoll = (login, date) => seeded(`surprise:${login}:${date}`)() < 0.5;
function surpriseFor(state, season) {
  if (state.surprise !== void 0) return state.surprise;
  const holiday = holidayFor(state.date);
  if (holiday) return holiday;
  const m = state.moments ?? {};
  if (m.birthday) return "birthday";
  if (state.ranAway) return null;
  if (m.levelUp !== void 0) return "level-up";
  if (m.welcomeBack) return "welcome-back";
  if (state.stage === "egg") return null;
  const calm = state.mood === "idle" || state.mood === "happy";
  const r2 = seeded(`surprise:${state.login}:${state.date}`)();
  const weekday = (/* @__PURE__ */ new Date(`${state.date}T00:00:00Z`)).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  if (calm && weekend && state.daysSinceLastContribution >= 1 && tripRoll(state.login, state.date)) return "postcard";
  if (calm && m.backFrom) return "souvenir";
  if (state.mood !== "sleeping" && r2 >= 0.95) return "ufo";
  if (calm && r2 >= 0.87 && r2 < 0.95) return "friend";
  if (calm && season === "spring" && r2 >= 0.6 && r2 < 0.87) return "butterfly";
  if (calm && season === "summer" && r2 >= 0.6 && r2 < 0.87) return "sunglasses";
  return null;
}
function disguiseFor(state) {
  return pick(seeded(`fools:${state.login}:${state.date}`), Object.keys(SPECIES).filter((id) => id !== state.species));
}
function showSurprise(surprise2, ctx, where) {
  const draw = isHoliday(surprise2) ? HOLIDAY_ART[surprise2] : surprise2 === "postcard" ? postcard : surprise2 === "souvenir" ? souvenir : surprise2 in MOMENT_ART ? MOMENT_ART[surprise2] : RARE_ART[surprise2];
  const art = { ...draw(ctx) };
  if (where !== "pet") {
    delete art.held;
    delete art.over;
    delete art.follow;
    delete art.bodyClass;
    delete art.crossed;
    delete art.replace;
    if (where !== "visit") {
      delete art.hat;
      delete art.face;
    }
  }
  return { art, css: `${KIT_CSS}${art.css ?? ""}`, banner: art.banner ? banner(art.banner, ctx.scene) : "" };
}

// src/pet/state.ts
var MAX_LEVEL = 99;
var RUN_AWAY_DAYS = 30;
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
var WELCOME_BACK_DAYS = 7;
function momentsFor(profile, xp, level, date) {
  const moments = {};
  const cal = profile.calendar;
  if (profile.createdAt) {
    const born = profile.createdAt.slice(0, 10);
    const years = Number(date.slice(0, 4)) - Number(born.slice(0, 4));
    const leap = (y) => y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
    const md = born.slice(5) === "02-29" && !leap(Number(date.slice(0, 4))) ? "02-28" : born.slice(5);
    if (years >= 1 && date.slice(5) === md) moments.birthday = years;
  }
  const recent = cal.slice(-2).reduce((sum, d) => sum + d.count, 0);
  const before = levelForXp(xp - recent);
  if (recent > 0 && before < level) moments.levelUp = before;
  let i = cal.length - 1;
  while (i >= 0 && cal[i].count === 0) i--;
  if (i >= cal.length - 2) {
    let gap = 0;
    for (let j = i - 1; j >= 0 && cal[j].count === 0; j--) gap++;
    if (gap >= WELCOME_BACK_DAYS && i - 1 - gap >= 0) moments.welcomeBack = gap;
  }
  return moments;
}
function computePetState(profile, options = {}) {
  const state = stateFor(profile, options);
  const cal = profile.calendar;
  if (cal.length >= 2) {
    const yesterday = stateFor({ ...profile, calendar: cal.slice(0, -1), lifetimeContributions: profile.lifetimeContributions - cal.at(-1).count }, options);
    if (surpriseFor(yesterday, "autumn") === "postcard") state.moments = { ...state.moments, backFrom: yesterday.date };
  }
  return state;
}
function stateFor(profile, options) {
  const xp = profile.lifetimeContributions + profile.totalStars * 2 + profile.followers * 3;
  const level = levelForXp(xp);
  const topLanguage = profile.languages[0]?.name ?? null;
  const species = getSpecies(options.species ?? speciesForLanguage(topLanguage));
  const stats = {
    str: statFor(profile.commits),
    int: statFor(profile.pullRequests + profile.reviews),
    cha: statFor(profile.totalStars + profile.followers),
    dex: statFor(profile.issues)
  };
  const date = profile.calendar.at(-1)?.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return {
    login: profile.login,
    date,
    petName: options.petName ?? species.defaultName,
    species: species.id,
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
    stats,
    ranAway: options.runaway !== false && level >= 3 && daysSinceLastContribution(profile.calendar) >= RUN_AWAY_DAYS,
    moments: momentsFor(profile, xp, level, date)
  };
}

// src/demo.ts
var MOODS = ["happy", "idle", "hungry", "sleeping"];
var STAGES = ["egg", "baby", "adult", "legendary"];

// src/care/commands.ts
var CARE_ACTIONS = ["feed", "bath", "play"];
var TITLE_PREFIX = "ProfileForge:";
var SYNONYMS = {
  feed: "feed",
  food: "feed",
  eat: "feed",
  bath: "bath",
  wash: "bath",
  clean: "bath",
  play: "play",
  ball: "play"
};
function parseCommand(body) {
  if (body.length > 2e3) return null;
  const match = /^[^\p{L}\p{N}]*([a-z]+)/iu.exec(body);
  const word = (match?.[1] ?? "").toLowerCase();
  return Object.hasOwn(SYNONYMS, word) ? SYNONYMS[word] : null;
}
function houseLink(repo, issue) {
  return `https://github.com/${repo}/issues/${issue}`;
}

// src/types.ts
var SURPRISES = [
  ...HOLIDAYS,
  "birthday",
  "level-up",
  "welcome-back",
  "postcard",
  "souvenir",
  "ufo",
  "friend",
  "butterfly",
  "sunglasses"
];

// src/options.ts
var LOGIN_RE = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
var MAX_NAME = 16;
var WIDGETS = ["pet", "city"];
function oneOf(value, allowed) {
  return allowed.includes(value) ? value : void 0;
}
function parsePetParams(q) {
  const species = q.get("species");
  return {
    widget: oneOf(q.get("widget"), WIDGETS) ?? "pet",
    theme: q.get("theme") ?? void 0,
    hideBorder: q.get("hide_border") === "true",
    petName: q.get("name")?.trim().slice(0, MAX_NAME) || void 0,
    species: isSpecies(species) ? species : void 0,
    showPet: q.get("pet") !== "false",
    runaway: q.get("runaway") !== "false",
    season: oneOf(q.get("season"), SEASONS),
    hemisphere: oneOf(q.get("hemisphere"), HEMISPHERES),
    mood: oneOf(q.get("mood"), MOODS),
    stage: oneOf(q.get("stage"), STAGES),
    trick: oneOf(q.get("trick"), TRICKS),
    away: q.get("away") === "true",
    visit: oneOf(q.get("visit"), [...CARE_ACTIONS, "all"]),
    surprise: oneOf(q.get("surprise"), SURPRISES),
    dirt: oneOf(q.get("dirt"), ["0", "1", "2", "3"]) ? Number(q.get("dirt")) : void 0
  };
}

// src/action/care.ts
import { mkdir as mkdir2, readFile, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname2 } from "node:path";

// src/care/state.ts
var LIMITS = {
  /** Each visitor may do each action once per UTC day. */
  perVisitorPerAction: 1,
  /** Across everyone, per UTC day. */
  perDay: 60,
  /** Issues handled per run; the rest wait for the next one. */
  perRun: 30,
  maxFileBytes: 64 * 1024,
  maxRecent: 5,
  maxTotal: 1e9
};
var DEFAULT_RULES = { actions: [...CARE_ACTIONS], dirt: true };
function parseRules(actions, dirt2) {
  const list = actions.trim() ? actions.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) : [...CARE_ACTIONS];
  const unknown = list.filter((a) => !CARE_ACTIONS.includes(a));
  if (unknown.length) throw new Error(`care_actions: unknown ${unknown.map((u) => `"${u}"`).join(", ")} (use ${CARE_ACTIONS.join(", ")})`);
  if (!list.length) throw new Error("care_actions: pick at least one of feed, bath, play");
  const chosen = CARE_ACTIONS.filter((a) => list.includes(a));
  return { actions: chosen, dirt: dirt2.trim().toLowerCase() !== "false" && chosen.includes("bath") };
}
var utcDay = (d) => d.toISOString().slice(0, 10);
var todayOf = (state, login) => Object.hasOwn(state.today, login) ? state.today[login] : [];
function newCareState(now) {
  return {
    version: 1,
    since: now.toISOString(),
    last: { feed: null, bath: null, play: null },
    day: utcDay(now),
    today: {},
    todayTotal: 0,
    totals: { feed: 0, bath: 0, play: 0 },
    recent: [],
    house: { issue: null, cursor: 0, cursorAt: null }
  };
}
var isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var isAction = (v) => CARE_ACTIONS.includes(v);
var isLogin = (v) => typeof v === "string" && LOGIN_RE.test(v);
function isTime(v, now) {
  if (typeof v !== "string" || v.length > 40) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t <= now.getTime() + 6e4 && new Date(t).toISOString() === v;
}
var count = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0 ? Math.min(v, LIMITS.maxTotal) : 0;
function parseCareState(text2, now) {
  const fresh = newCareState(now);
  if (text2 === null) return { state: fresh };
  if (text2.length > LIMITS.maxFileBytes) return { state: fresh, warning: "care file too large, starting over" };
  let raw;
  try {
    raw = JSON.parse(text2);
  } catch {
    return { state: fresh, warning: "care file is not valid JSON, starting over" };
  }
  if (!isObject(raw) || raw.version !== 1) return { state: fresh, warning: "unknown care file format, starting over" };
  const state = fresh;
  if (isTime(raw.since, now)) state.since = raw.since;
  if (isObject(raw.last)) {
    for (const a of CARE_ACTIONS) if (isTime(raw.last[a], now)) state.last[a] = raw.last[a];
  }
  if (isObject(raw.totals)) {
    for (const a of CARE_ACTIONS) state.totals[a] = count(raw.totals[a]);
  }
  if (raw.day === state.day && isObject(raw.today)) {
    for (const [login, actions] of Object.entries(raw.today).slice(0, LIMITS.perDay)) {
      if (isLogin(login) && Array.isArray(actions)) {
        const valid = [...new Set(actions.filter(isAction))];
        if (valid.length) state.today[login] = valid;
      }
    }
    state.todayTotal = Math.min(count(raw.todayTotal), LIMITS.perDay);
  }
  if (Array.isArray(raw.recent)) {
    state.recent = raw.recent.filter((e) => isObject(e) && isAction(e.action) && isLogin(e.by) && isTime(e.at, now)).slice(0, LIMITS.maxRecent).map(({ action, by, at: at2 }) => ({ action, by, at: at2 }));
  }
  if (isObject(raw.house)) {
    const { issue, cursor, cursorAt } = raw.house;
    if (Number.isSafeInteger(issue) && issue > 0) state.house.issue = issue;
    if (Number.isSafeInteger(cursor) && cursor > 0) state.house.cursor = cursor;
    if (isTime(cursorAt, now)) state.house.cursorAt = cursorAt;
  }
  return { state };
}
var serializeCareState = (state) => JSON.stringify(state, null, 2) + "\n";
function startDay(state, now) {
  if (state.day !== utcDay(now)) {
    state.day = utcDay(now);
    state.today = {};
    state.todayTotal = 0;
  }
}
function visit(state, login, action, now) {
  if (state.todayTotal >= LIMITS.perDay) return { kind: "busy" };
  if (todayOf(state, login).filter((a) => a === action).length >= LIMITS.perVisitorPerAction) return { kind: "limited", action };
  const at2 = now.toISOString();
  state.today[login] = [...todayOf(state, login), action];
  state.todayTotal++;
  state.totals[action] = Math.min(state.totals[action] + 1, LIMITS.maxTotal);
  state.last[action] = at2;
  state.recent = [{ action, by: login, at: at2 }, ...state.recent].slice(0, LIMITS.maxRecent);
  return { kind: "done", action };
}
function applyComments(previous, comments, now, rules = DEFAULT_RULES) {
  const state = structuredClone(previous);
  startDay(state, now);
  const handled = [];
  const fresh = comments.filter((c) => c.id > state.house.cursor).sort((a, b) => a.id - b.id);
  for (const comment2 of fresh) {
    if (handled.length >= LIMITS.perRun) break;
    state.house.cursor = comment2.id;
    if (isTime(comment2.createdAt, now)) state.house.cursorAt = comment2.createdAt;
    if (comment2.userType !== "User" || !isLogin(comment2.login)) continue;
    const action = parseCommand(comment2.body);
    if (!action || !rules.actions.includes(action)) continue;
    handled.push({ comment: comment2, outcome: visit(state, comment2.login, action, now) });
  }
  return { state, handled };
}
function reactionFor(outcome) {
  return outcome.kind === "done" ? "heart" : outcome.kind === "limited" ? "eyes" : "confused";
}
function houseIssue(petName, rules = DEFAULT_RULES) {
  const rows = {
    feed: "| `feed` | \u{1F356} a meal |",
    bath: `| \`bath\` | \u{1F6C1} a bath${rules.dirt ? ` (${petName} gets smelly without one!)` : ""} |`,
    play: "| `play` | \u{1F3BE} a game of fetch |"
  };
  return {
    title: `ProfileForge: ${petName}'s house \u{1F3E0}`,
    body: [
      `## Welcome to ${petName}'s house!`,
      "",
      `Leave a comment starting with one of these words to take care of ${petName}:`,
      "",
      "| Comment | |",
      "|---|---|",
      ...rules.actions.map((a) => rows[a]),
      "",
      `${petName} reacts with \u2764\uFE0F when it's done, or \u{1F440} if you already did that today. Your visit shows up on the profile card within a few minutes.`,
      "",
      "<sub>Powered by [ProfileForge](https://github.com/LobsterEnigma/ProfileForge). Each visitor can do each action once a day.</sub>"
    ].join("\n")
  };
}
function redirectReply(petName, house) {
  return `\u{1F3E0} ${petName} lives in its house now! Say hi in #${house}: comment \`feed\`, \`bath\` or \`play\` there. Closing this one to keep things tidy.`;
}

// src/github/issues.ts
var API = "https://api.github.com";
var REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
var IssuesError = class extends Error {
};
function headers(token) {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "ProfileForge"
  };
}
function checkRepo(repo) {
  if (!REPO_RE.test(repo)) throw new IssuesError(`"${repo}" is not a valid owner/repo`);
}
function checkNumber(n) {
  if (!Number.isSafeInteger(n) || n <= 0) throw new IssuesError(`"${n}" is not a valid id`);
}
async function listCareIssues(token, repo, f = fetch) {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues?state=open&sort=created&direction=asc&per_page=100`, {
    headers: headers(token)
  });
  if (!res.ok) throw new IssuesError(`listing issues failed: ${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body)) throw new IssuesError("unexpected issues response");
  const prefix = TITLE_PREFIX.toLowerCase();
  return body.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const i = item;
    const user = i.user;
    if ("pull_request" in i || !Number.isInteger(i.number) || typeof i.title !== "string" || !i.title.trim().toLowerCase().startsWith(prefix) || typeof user?.login !== "string" || typeof user?.type !== "string") {
      return [];
    }
    return [{ number: i.number, title: i.title, login: user.login, userType: user.type }];
  });
}
async function listHouseComments(token, repo, issue, q, f = fetch) {
  checkRepo(repo);
  checkNumber(issue);
  const out = [];
  const query = `per_page=100${q.since ? `&since=${encodeURIComponent(q.since)}` : ""}`;
  for (let page = 1; page <= 50 && out.length < q.want; page++) {
    const res = await f(`${API}/repos/${repo}/issues/${issue}/comments?${query}&page=${page}`, { headers: headers(token) });
    if (!res.ok) throw new IssuesError(`listing comments on #${issue} failed: ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body)) throw new IssuesError("unexpected comments response");
    for (const item of body) {
      if (typeof item !== "object" || item === null) continue;
      const c = item;
      const user = c.user;
      if (Number.isSafeInteger(c.id) && c.id > q.after && typeof c.body === "string" && typeof c.created_at === "string" && typeof user?.login === "string" && typeof user?.type === "string") {
        out.push({ id: c.id, body: c.body, login: user.login, userType: user.type, createdAt: new Date(c.created_at).toISOString() });
      }
    }
    if (body.length < 100) break;
  }
  return out;
}
async function react(token, repo, commentId, content, f = fetch) {
  checkRepo(repo);
  checkNumber(commentId);
  const res = await f(`${API}/repos/${repo}/issues/comments/${commentId}/reactions`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!res.ok) throw new IssuesError(`reacting to comment ${commentId} failed: ${res.status}`);
}
async function createIssue(token, repo, title, body, f = fetch) {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ title, body })
  });
  if (!res.ok) throw new IssuesError(`creating the house issue failed: ${res.status}`);
  const number = (await res.json()).number;
  if (!Number.isSafeInteger(number) || number <= 0) throw new IssuesError("unexpected issue response");
  return number;
}
async function comment(token, repo, issue, body, f = fetch) {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues/${issue}/comments`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ body })
  });
  if (!res.ok) throw new IssuesError(`commenting on #${issue} failed: ${res.status}`);
}
async function close(token, repo, issue, f = fetch) {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues/${issue}`, {
    method: "PATCH",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ state: "closed", state_reason: "completed" })
  });
  if (!res.ok) throw new IssuesError(`closing #${issue} failed: ${res.status}`);
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
      createdAt
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
        privacy: PUBLIC
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
    createdAt: user.createdAt,
    followers: user.followers.totalCount,
    totalStars: repos.reduce((sum, r2) => sum + r2.stargazerCount, 0),
    lifetimeContributions: await fetchLifetimeContributions(token, user.login, cc.contributionYears),
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    reviews: cc.totalPullRequestReviewContributions,
    issues: cc.totalIssueContributions,
    calendar,
    languages: aggregateLanguages(repos)
  };
}

// src/care/view.ts
var HOUR = 36e5;
var DAY2 = 24 * HOUR;
var FRESH = 12 * HOUR;
var FED_KEEPS_HOME = 30 * DAY2;
var DIRT_DAYS = [3, 6, 10];
var age = (iso, now) => iso ? now.getTime() - Date.parse(iso) : Infinity;
function careView(state, now, rules = DEFAULT_RULES) {
  const sinceBath = age(state.last.bath ?? state.since, now) / DAY2;
  const dirt2 = rules.dirt ? DIRT_DAYS.filter((d) => sinceBath >= d).length : 0;
  const latest = state.recent[0];
  const visitors = [];
  for (const e of state.recent) {
    if (age(e.at, now) >= FRESH) break;
    if (!visitors.some((v) => v.action === e.action)) visitors.push({ login: e.by, action: e.action });
  }
  visitors.reverse();
  return {
    fed: age(state.last.feed, now) < FRESH,
    bathed: age(state.last.bath, now) < FRESH,
    played: age(state.last.play, now) < FRESH,
    dirt: dirt2,
    visitor: latest && age(latest.at, now) < FRESH ? { login: latest.by, action: latest.action } : null,
    visitors
  };
}
function applyCare(pet2, state, now, rules = DEFAULT_RULES) {
  const view = careView(state, now, rules);
  let mood = pet2.mood;
  if (view.fed && mood === "hungry") mood = "idle";
  if (view.played && mood === "idle") mood = "happy";
  const ranAway = pet2.ranAway && age(state.last.feed, now) >= FED_KEEPS_HOME;
  return { ...pet2, mood, ranAway, care: view };
}

// src/city/state.ts
function groupWeeks(calendar) {
  const weeks = [];
  for (const day of calendar) {
    const isSunday = (/* @__PURE__ */ new Date(`${day.date}T00:00:00Z`)).getUTCDay() === 0;
    let week = weeks[weeks.length - 1];
    if (!week || isSunday) {
      week = { start: day.date, total: 0, activeDays: 0 };
      weeks.push(week);
    }
    week.total += day.count;
    if (day.count > 0) week.activeDays++;
  }
  return weeks;
}
function longestStreak(calendar) {
  let best = 0;
  let run = 0;
  for (const day of calendar) {
    run = day.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
function computeCityState(profile, pet2 = {}) {
  const weeks = groupWeeks(profile.calendar);
  const bestWeek = weeks.reduce((best, w) => w.total > (best?.total ?? 0) ? w : best, null);
  return {
    login: profile.login,
    date: profile.calendar.at(-1)?.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    topLanguage: profile.languages[0] ?? null,
    weeks,
    total: profile.calendar.reduce((sum, d) => sum + d.count, 0),
    bestWeek,
    currentStreak: currentStreak(profile.calendar),
    longestStreak: longestStreak(profile.calendar),
    activeDays14: profile.calendar.slice(-14).filter((d) => d.count > 0).length,
    daysSinceLastContribution: daysSinceLastContribution(profile.calendar),
    pet: pet2 === false ? null : computePetState(profile, pet2)
  };
}

// src/svg/css.ts
function blocks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth > 0; j++) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
    }
    out.push({ head: css.slice(i, open).trim(), body: css.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
}
function matches(selector, classes) {
  const names = selector.match(/\.[\w-]+/g);
  if (!names || /[#[:]/.test(selector.replace(/\.[\w-]+/g, ""))) return true;
  return names.every((n) => classes.has(n.slice(1)));
}
function pruneCss(css, markup) {
  const classes = /* @__PURE__ */ new Set();
  for (const m of markup.matchAll(/class="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) classes.add(c);
  const all = blocks(css);
  const kept = all.filter((b) => b.head.startsWith("@") || b.head.split(",").some((s) => matches(s.trim(), classes)));
  const used = kept.filter((b) => !b.head.startsWith("@keyframes")).map((b) => b.body).join(";") + markup;
  return kept.filter((b) => {
    const name = b.head.match(/^@keyframes\s+([\w-]+)/)?.[1];
    return !name || new RegExp(`(?:animation(?:-name)?:\\s*|[\\s,])${name}(?![\\w-])`).test(used);
  }).map((b) => `${b.head}{${b.body}}`).join("\n");
}
function pruneSvgStyle(svg) {
  const start = svg.indexOf("<style>");
  const end = svg.indexOf("</style>", start);
  if (start < 0 || end < 0) return svg;
  const css = svg.slice(start + 7, end);
  const markup = svg.slice(0, start) + svg.slice(end + 8);
  return `${svg.slice(0, start + 7)}${pruneCss(css, markup)}${svg.slice(end)}`;
}

// src/svg/escape.ts
var ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};
function escapeXml(text2) {
  return text2.replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// src/svg/stepped.ts
function stepped(fill, x0, w, top, bottom, step = 2) {
  let d = "";
  for (let start = 0; start < w; start += step) {
    if (top(start) === void 0) continue;
    let end = start;
    while (end + step < w && top(end + step) !== void 0) end += step;
    let y = top(start);
    let run = 0;
    d += `M${x0 + start} ${y}`;
    for (let x = start; x <= end; x += step) {
      const t = top(x);
      if (t !== y) {
        if (run) d += `h${run}`;
        d += `V${y = t}`;
        run = 0;
      }
      run += step;
    }
    d += `h${run}`;
    run = 0;
    for (let x = end; x >= start; x -= step) {
      const b = bottom(x, top(x));
      if (b !== y) {
        if (run) d += `h-${run}`;
        d += `V${y = b}`;
        run = 0;
      }
      run += step;
    }
    d += `h-${run}z`;
    start = end;
  }
  if (!d) return "";
  return fill.startsWith("var(") ? `<path style="fill:${fill}" d="${d}"/>` : `<path fill="${fill}" d="${d}"/>`;
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
  stars: "0",
  citySkyTop: "#4b5aa8",
  citySkyBottom: "#ffb38a",
  cityText: "#ffffff",
  cityMuted: "#e8e6ff",
  bldg1: "#2f3354",
  bldg2: "#3b4066",
  bldg3: "#262a45",
  bldg4: "#5a3f62",
  bldg5: "#2b5566",
  cityHaze: "#8e82b8",
  cityHill: "#b69bc0",
  cityWater: "#7d78bd",
  cityWaterDeep: "#2c3263",
  cityQuay: "#6a6388",
  windowOn: "#ffd166",
  windowAlt: "#ffe8a3",
  windowOff: "#4a5078",
  road: "#23263b",
  celestial: "#ff8a5c"
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
  stars: "1",
  citySkyTop: "#070f24",
  citySkyBottom: "#1f2c55",
  cityText: "#e6edf3",
  cityMuted: "#9fb0d0",
  bldg1: "#161d33",
  bldg2: "#1d2640",
  bldg3: "#121829",
  bldg4: "#1d1a33",
  bldg5: "#122536",
  cityHaze: "#1b2647",
  cityHill: "#16203d",
  cityWater: "#132048",
  cityWaterDeep: "#050b1c",
  cityQuay: "#2b3452",
  windowOn: "#ffd166",
  windowAlt: "#9ad1ff",
  windowOff: "#26304d",
  road: "#0e1322",
  celestial: "#f4f1de"
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
    stars: "1",
    citySkyTop: "#15161e",
    citySkyBottom: "#3a3450",
    cityText: "#f8f8f2",
    cityMuted: "#a4acd4",
    bldg1: "#383a4a",
    bldg2: "#44475a",
    bldg3: "#2e3040",
    bldg4: "#3d3350",
    bldg5: "#2f3a4a",
    cityHaze: "#33354a",
    cityHill: "#2b2c3c",
    cityWater: "#2c2e40",
    cityWaterDeep: "#17181f",
    cityQuay: "#474a5e",
    windowOn: "#f1fa8c",
    windowAlt: "#8be9fd",
    windowOff: "#4d5066",
    road: "#21222c",
    celestial: "#f8f8f2"
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
    bldg4: "#306230",
    bldg5: "#0f380f",
    cityHaze: "#8bac0f",
    cityHill: "#8bac0f",
    cityWater: "#8bac0f",
    cityWaterDeep: "#306230",
    cityQuay: "#306230",
    windowOn: "#9bbc0f",
    windowAlt: "#8bac0f",
    windowOff: "#0f380f",
    road: "#0f380f",
    celestial: "#306230"
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
    bldg4: "#9a5a88",
    bldg5: "#86628a",
    cityHaze: "#e6a8c0",
    cityHill: "#f0c0d2",
    cityWater: "#efb0c6",
    cityWaterDeep: "#b86c8c",
    cityQuay: "#b56d8a",
    windowOn: "#fff3b0",
    windowAlt: "#ffd6e4",
    windowOff: "#c98aa3",
    road: "#7d3d57",
    celestial: "#fff6f8"
  }
};
var THEME_NAMES = Object.keys(THEMES);
function vars(t) {
  return Object.entries(t).map(([k, v]) => `--pf-${k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}:${v}`).join(";");
}
function themeCss(name) {
  const theme = name && Object.hasOwn(THEMES, name) ? THEMES[name] : THEMES.auto;
  if ("light" in theme) {
    return `.pf{${vars(theme.light)}}@media (prefers-color-scheme:dark){.pf{${vars(theme.dark)}}}`;
  }
  return `.pf{${vars(theme)}}`;
}
var FILTERS = {
  gameboy: `<filter id="pf-theme" color-interpolation-filters="sRGB">
  <feColorMatrix type="matrix" values=".299 .587 .114 0 0 .299 .587 .114 0 0 .299 .587 .114 0 0 0 0 0 1 0"/>
  <feComponentTransfer>
    <feFuncR type="discrete" tableValues=".059 .188 .545 .608"/>
    <feFuncG type="discrete" tableValues=".22 .384 .675 .737"/>
    <feFuncB type="discrete" tableValues=".059 .188 .059 .059"/>
  </feComponentTransfer>
</filter>`
};
function themeFilter(name) {
  const filter = name && Object.hasOwn(FILTERS, name) ? FILTERS[name] : void 0;
  return filter ? { defs: `<defs>${filter}</defs>`, attr: ` filter="url(#pf-theme)"` } : { defs: "", attr: "" };
}

// src/color.ts
function hexToHsl(hex) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const [r2, g, b] = [m[1], m[2], m[3]].map((c) => parseInt(c, 16) / 255);
  const max = Math.max(r2, g, b);
  const min = Math.min(r2, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r2 ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r2) / d + 2 : (r2 - g) / d + 4;
  return [h / 6, s, l];
}
function hslToHex(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function neonize(hex, fallback = "#ff79c6") {
  const hsl = hex ? hexToHsl(hex) : null;
  if (!hsl) return fallback;
  const [h, s, l] = hsl;
  if (s < 0.08) return hslToHex(0.55, 0.35, 0.8);
  return hslToHex(h, Math.max(s, 0.7), Math.min(Math.max(l, 0.62), 0.74));
}

// src/city/buildings.ts
function classedBatch(c, cls) {
  let batch = c.classed.get(cls);
  if (!batch) c.classed.set(cls, batch = new RectBatch());
  return batch;
}
var newCanvas = () => ({
  walls: new RectBatch(),
  shade: new RectBatch(),
  light: new RectBatch(),
  rim: new RectBatch(),
  glass: new RectBatch(),
  windows: new LineBatch(),
  lit: new LineBatch(),
  dim: new LineBatch(),
  faint: new LineBatch(),
  shops: new LineBatch(),
  awnings: new RectBatch(),
  sunlit: new RectBatch(),
  iron: new RectBatch(),
  nature: new RectBatch(),
  front: new RectBatch(),
  classed: /* @__PURE__ */ new Map(),
  extras: []
});
var renderCanvas = (c) => `<g id="pf-walls">${c.walls}</g><rect x="0" y="0" width="${W}" height="${BASE_Y}" fill="url(#pf-volume)" mask="url(#pf-wallmask)"/><g class="pf-sunlit">${c.sunlit}</g><g opacity=".2">${c.glass}</g><g opacity=".24">${c.shade}</g><g opacity=".13">${c.light}</g><g class="pf-rim">${c.rim}</g>${c.windows}<g id="pf-lit">${c.lit}<g opacity=".72">${c.dim}</g><g opacity=".45">${c.faint}</g></g><g class="pf-night"><g opacity=".75">${c.shops}</g></g><g class="pf-day">${c.awnings}</g><g opacity=".85">${c.iron}</g>${c.nature}${c.front}${[...c.classed].map(([cls, b]) => `<g class="${cls}">${b}</g>`).join("")}${c.extras.join("")}`;
var ON = "var(--pf-window-on)";
var ALT = "var(--pf-window-alt)";
var OFF = "var(--pf-window-off)";
var TRUNK2 = "#6b4b2a";
var CRANE = "#f5a623";
var BEACON = "#ff4d4d";
var ROOFS = ["#7a3b2e", "#4f3f63", "#35536b"];
function pickStyle(floors, rng) {
  const r2 = rng();
  if (floors >= 11) return r2 < 0.25 ? "setback" : r2 < 0.45 ? "glass" : r2 < 0.58 ? "spire" : "classic";
  if (floors <= 5) return r2 < 0.4 ? "brick" : r2 < 0.5 ? "glass" : "classic";
  return r2 < 0.2 ? "glass" : r2 < 0.4 ? "brick" : "classic";
}
function light2(c, rng, x, y, w, h) {
  const color = rng() < 0.08 ? ALT : ON;
  if (rng() < 0.02) {
    c.extras.push(`<rect class="pf-flicker" style="animation-delay:-${(rng() * 7).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
    return;
  }
  const tier = rng();
  (tier < 0.55 ? c.lit : tier < 0.85 ? c.dim : c.faint).add(color, x, y, w, h);
}
function addWindow(c, rng, lit, x, y, w, h) {
  if (rng() < lit) light2(c, rng, x, y, w, h);
  else c.windows.add(OFF, x, y, w, h);
}
var CUTS = {
  grid: { ww: 2, gap: 2, wh: 3, dy: 2 },
  pairs: { ww: 3, gap: 2, wh: 3, dy: 2 },
  slit: { ww: 1, gap: 2, wh: 4, dy: 1 },
  ribbon: { ww: 3, gap: 1, wh: 3, dy: 2 },
  curtain: { ww: 2, gap: 0, wh: 4, dy: 1 },
  brick: { ww: 2, gap: 2, wh: 2, dy: 2, sill: true }
};
function facade(c, rng, x, w, fromFloor, toFloor, lit, cutName, pilasters = false) {
  const cut = CUTS[cutName];
  const step = cut.ww + cut.gap;
  const n = Math.max(1, Math.floor((w - 3 + cut.gap) / step));
  const left = x + Math.floor((w - (n * step - cut.gap)) / 2) + 1;
  if (pilasters && cut.gap >= 2) {
    const y0 = BASE_Y - toFloor * FLOOR_H;
    for (let i = 0; i < n - 1; i++) c.light.add("#fff", left + i * step + cut.ww, y0, 1, (toFloor - fromFloor) * FLOOR_H);
  }
  for (let f = fromFloor; f < toFloor; f++) {
    const y = BASE_Y - (f + 1) * FLOOR_H + cut.dy;
    const r2 = rng();
    let from = 0;
    let to = -1;
    if (r2 < lit * 0.45) to = n - 1;
    else if (r2 < lit * 1.15) {
      from = Math.floor(rng() * n);
      to = Math.min(n - 1, from + Math.floor(rng() * n));
    }
    for (let i = 0; i < n; i++) {
      const wx = left + i * step;
      if (i >= from && i <= to) light2(c, rng, wx, y, cut.ww, cut.wh);
      else if (rng() < lit * 0.08) light2(c, rng, wx, y, cut.ww, cut.wh);
      else c.windows.add(OFF, wx, y, cut.ww, cut.wh);
    }
    if (cut.sill) c.light.add("#fff", left - 1, y + cut.wh, n * step - cut.gap + 2, 1);
  }
}
function shadeBlock(c, x, top, w, bottom = BASE_Y) {
  c.shade.add("#000", x, top, 2, bottom - top);
  c.light.add("#fff", x, top, w, 1);
  c.rim.add("var(--pf-celestial)", x + w - 1, top, 1, bottom - top);
  c.sunlit.add("var(--pf-celestial)", x + w - 4, top, 3, bottom - top);
}
var AWNINGS = ["#e8505b", "#2f9e8f", "#f2a93b", "#6c63d9", "#3a86c8"];
function shopfront(c, rng, x, w) {
  for (let sx = x + 2; sx + 3 <= x + w - 1; sx += 4) c.shops.add(ON, sx, BASE_Y - 4, 3, 3);
  c.awnings.add(AWNINGS[Math.floor(rng() * AWNINGS.length)], x + 1, BASE_Y - 6, w - 2, 2);
}
var NEON = ["#ff5c8a", "#4de1ff", "#ffe066", "#8cff66", "#c77dff"];
function billboard(c, rng, x, w, top) {
  const color = NEON[Math.floor(rng() * NEON.length)];
  const bw = Math.max(6, w - 4);
  const bx = x + Math.floor((w - bw) / 2);
  c.iron.add("#1b1b26", bx + 1, top - 3, 1, 3).add("#1b1b26", bx + bw - 2, top - 3, 1, 3);
  c.extras.push(
    `<rect x="${bx}" y="${top - 8}" width="${bw}" height="5" fill="#1b1b26"/>`,
    `<g class="pf-neon"><rect x="${bx + 1}" y="${top - 7}" width="${bw - 2}" height="3" fill="${color}" class="pf-night"/><rect x="${bx + 1}" y="${top - 7}" width="${bw - 2}" height="3" fill="#e9e4f0" class="pf-day"/></g>`
  );
  return top - 8;
}
function drawBuilding(c, rng, b) {
  const { x, w, floors, fill, style, lit } = b;
  const top = BASE_Y - floors * FLOOR_H - U;
  const cx = x + Math.floor(w / 2);
  if (style === "house") return drawHouse(c, rng, b);
  if (style === "setback") {
    const base = Math.max(2, Math.round(floors * 0.6));
    const ledge = BASE_Y - base * FLOOR_H;
    const tw = Math.max(6, w - 6);
    const tx = x + Math.floor((w - tw) / 2);
    c.walls.add(fill, x, ledge, w, BASE_Y - ledge).add(fill, tx, top, tw, ledge - top);
    shadeBlock(c, x, ledge, w);
    shadeBlock(c, tx, top, tw, ledge);
    facade(c, rng, x, w, 1, base, lit, "ribbon");
    facade(c, rng, tx, tw, base, floors, lit, "slit");
    shopfront(c, rng, x, w);
    c.walls.add(fill, tx + 2, top - 3, tw - 4, 3);
    if (b.snow) c.front.add(SNOW, x, ledge - 2, tx - x, 2).add(SNOW, tx + tw, ledge - 2, x + w - tx - tw, 2).add(SNOW, tx + 2, top - 5, tw - 4, 2);
    return top - 3;
  }
  c.walls.add(fill, x, top, w, BASE_Y - top);
  shadeBlock(c, x, top, w);
  if (style === "glass") {
    c.glass.add(ALT, x + 2, top + 2, w - 3, BASE_Y - top - 6);
    for (let f = 1; f < floors; f += 1) c.shade.add("#000", x + 2, BASE_Y - f * FLOOR_H, w - 3, 1);
    facade(c, rng, x, w, 1, floors, lit * 0.8, rng() < 0.5 ? "curtain" : "ribbon");
  } else {
    const cut = style === "brick" ? "brick" : style === "spire" ? "slit" : rng() < 0.5 ? "grid" : "pairs";
    facade(c, rng, x, w, floors > 2 ? 1 : 0, floors, lit, cut, style === "classic");
    if (style === "brick") for (let f = 3; f < floors; f += 3) c.light.add("#fff", x, BASE_Y - f * FLOOR_H, w, 1);
  }
  if (floors > 2) {
    c.shade.add("#000", x + 2, BASE_Y - FLOOR_H, w - 3, FLOOR_H);
    c.lit.add(ON, cx - 1, BASE_Y - 4, 2, 4);
  }
  if (floors > 2) shopfront(c, rng, x, w);
  if (style === "spire") {
    c.walls.add(fill, x + 2, top - 2, w - 4, 2).add(fill, cx - 3, top - 4, 6, 2).add(fill, cx - 1, top - 12, 2, 8);
    if (b.snow) c.front.add(SNOW, x, top - 2, 2, 2).add(SNOW, x + w - 2, top - 2, 2, 2).add(SNOW, cx - 3, top - 6, 6, 2);
    return top;
  }
  if (style === "glass" && floors >= 8 && rng() < 0.6) {
    for (let i = 0; i < w; i += 2) {
      const h = Math.max(0, Math.round((w - i) * 0.5));
      if (h) c.walls.add(fill, x + i, top - h, 2, h);
    }
    c.glass.add(ALT, x + 2, top - Math.round(w * 0.5) + 2, 2, Math.round(w * 0.5) - 2);
    return top - Math.round(w * 0.5);
  }
  if (b.roofDetails && floors >= 3) {
    const roof = rng();
    if (style === "brick" && roof < 0.5) c.walls.add(fill, x + w - 4, top - 6, 2, 6);
    else if (roof < 0.2) {
      c.walls.add(fill, x + w - 4, top - 8, 2, 8);
      if (floors >= 9) c.extras.push(`<rect class="pf-beacon" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" x="${x + w - 4}" y="${top - 10}" width="2" height="2" fill="${BEACON}"/>`);
    } else if (roof < 0.34) c.walls.add(fill, cx - 3, top - 7, 6, 4).add(fill, cx - 2, top - 3, 1, 3).add(fill, cx + 1, top - 3, 1, 3);
    else if (roof < 0.46) c.walls.add(fill, x + 2, top - 4, 4, 4);
    else if (roof < 0.62) {
      if (floors >= 8) c.walls.add(fill, x + 2, top - 3, w - 4, 3).add(fill, x + 4, top - 5, w - 8, 2);
    } else if (roof < 0.67) return billboard(c, rng, x, w, top);
    else if (roof < 0.8) c.nature.add("#3f8f4f", x + 1, top - 2, w - 2, 2).add("#5cb85c", x + 2, top - 3, 3, 1).add("#5cb85c", x + w - 6, top - 3, 3, 1);
  }
  if (b.snow) c.front.add(SNOW, x, top - 2, w, 2);
  return top;
}
function drawHouse(c, rng, b) {
  const { x, w, floors, fill, lit } = b;
  const wallTop = BASE_Y - (floors === 1 ? 8 : 12);
  const roof = ROOFS[Math.floor(rng() * ROOFS.length)];
  const cx = x + Math.floor(w / 2);
  c.walls.add(fill, x + 1, wallTop, w - 2, BASE_Y - wallTop);
  shadeBlock(c, x + 1, wallTop, w - 2);
  const steps = Math.floor(w / 4);
  for (let i = 0; i < steps; i++) c.walls.add(roof, x + i * 2, wallTop - 2 - i * 2, w - i * 4, 2);
  if (rng() < 0.5) c.walls.add(roof, x + w - 4, wallTop - 7, 2, 4);
  c.walls.add(roof, x + 3, BASE_Y - 5, 3, 5);
  addWindow(c, rng, lit, x + w - 6, BASE_Y - 6, 3, 3);
  if (floors === 2) {
    addWindow(c, rng, lit, x + 3, BASE_Y - 11, 3, 3);
    addWindow(c, rng, lit, x + w - 6, BASE_Y - 11, 3, 3);
  }
  if (b.snow) {
    for (let i = 0; i < steps; i++) c.front.add(SNOW, x + i * 2, wallTop - 2 - i * 2, 2, 1).add(SNOW, x + w - i * 2 - 2, wallTop - 2 - i * 2, 2, 1);
    c.front.add(SNOW, cx - 1, wallTop - steps * 2, 2, 1);
  }
  return wallTop - steps * 2;
}
function drawPark(c, rng, x, w, look) {
  const pick2 = (colors) => colors[Math.floor(rng() * colors.length)];
  const cx = x + Math.floor(w / 2);
  c.nature.add(look.grass, x, BASE_Y - 2, w, 2);
  const kind = rng();
  if (kind < 0.4) {
    const canopy = pick2(look.canopy);
    c.nature.add(TRUNK2, cx - 1, BASE_Y - 8, 2, 6);
    c.nature.add(canopy, cx - 4, BASE_Y - 16, 8, 8).add(canopy, cx - 3, BASE_Y - 18, 6, 2);
  } else if (kind < 0.65) {
    c.nature.add(TRUNK2, cx - 1, BASE_Y - 6, 2, 4);
    c.nature.add(look.pine, cx - 4, BASE_Y - 12, 8, 6).add(look.pine, cx - 3, BASE_Y - 17, 6, 5);
    c.nature.add(look.pineTip, cx - 1, BASE_Y - 21, 2, 4);
    if (look.snow) c.nature.add(SNOW, cx - 3, BASE_Y - 17, 6, 1).add(SNOW, cx - 4, BASE_Y - 12, 8, 1);
  } else if (kind < 0.85) {
    c.nature.add(pick2(look.bush), x + 1, BASE_Y - 6, 5, 4).add(pick2(look.bush), x + w - 6, BASE_Y - 5, 4, 3);
  } else if (look.snow) {
    c.nature.add(SNOW, cx - 3, BASE_Y - 8, 6, 6).add(SNOW, cx - 2, BASE_Y - 12, 4, 4).add("#f4a261", cx + 2, BASE_Y - 11, 2, 1);
  } else {
    c.nature.add(pick2(look.bush), x + 1, BASE_Y - 4, w - 2, 2);
    for (const [fx2, color] of [[2, "#ff8fa3"], [6, "#ffd166"], [10, "#c3a6ff"]]) {
      if (fx2 < w - 2) c.nature.add(color, x + fx2, BASE_Y - 6, 2, 2);
    }
  }
}
var SHORT_NAMES = {
  "Jupyter Notebook": "JUPYTER",
  "Vim Script": "VIM",
  "Emacs Lisp": "ELISP",
  "Objective-C": "OBJ-C",
  PowerShell: "PWSH",
  JavaScript: "JS",
  TypeScript: "TS"
};
function signLabel(language) {
  return (SHORT_NAMES[language] ?? language).toUpperCase().slice(0, 10);
}
var SIGN_H = 11;
function neonSign(c, cx, boardTop, language) {
  const label = signLabel(language.name);
  const color = neonize(language.color);
  const w = Math.round(label.length * 5.4 + 10);
  const left = Math.round(cx - w / 2);
  c.extras.push(
    `<g class="pf-neon" filter="url(#pf-glow)">`,
    `<rect x="${left}" y="${boardTop}" width="${w}" height="${SIGN_H}" rx="2" fill="#0b0b12" fill-opacity=".92" stroke="${color}" stroke-width="1.2"/>`,
    `<text x="${cx}" y="${boardTop + 8}" text-anchor="middle" class="pf-sign" fill="${color}">${escapeXml(label)}</text>`,
    `</g>`
  );
}
function drawLandmark(c, x, w, top, language) {
  const cx = x + Math.floor(w / 2);
  let antennaBase = top;
  const beam = (delay) => `<path class="pf-search" style="transform-origin:${cx}px ${top}px;animation-delay:-${delay}s" d="M${cx - 1} ${top}L${cx - 14} ${top - 150}L${cx + 14} ${top - 150}L${cx + 1} ${top}Z" fill="url(#pf-searchlight)"/>`;
  c.extras.push(`<g class="pf-night">${beam(0)}${beam(4.5)}</g>`);
  if (language) {
    const boardTop = top - 17;
    const sw = Math.round(signLabel(language.name).length * 5.4 + 10);
    const left = Math.round(cx - sw / 2);
    for (const legX of [left + 3, left + sw - 5]) {
      c.extras.push(`<rect x="${legX}" y="${boardTop + SIGN_H}" width="2" height="${top - boardTop - SIGN_H}" style="fill:var(--pf-bldg3)"/>`);
    }
    neonSign(c, cx, boardTop, language);
    antennaBase = boardTop;
  }
  c.extras.push(
    `<rect x="${cx - 1}" y="${antennaBase - 14}" width="2" height="14" style="fill:var(--pf-window-off)"/>`,
    `<rect class="pf-beacon" x="${cx - 2}" y="${antennaBase - 18}" width="4" height="4" fill="${BEACON}"/>`
  );
}
function drawCrane(c, x, base, sign = null) {
  const mastTop = base - 34;
  const hookX = x - 13;
  const crane = new RectBatch().add(CRANE, x + 9, mastTop, 2, base - mastTop).add(CRANE, x - 16, mastTop, 34, 2).add(CRANE, x + 13, mastTop + 2, 5, 3).add(CRANE, hookX, mastTop + 2, 1, sign ? 8 : 14).add(CRANE, hookX - 2, mastTop + (sign ? 10 : 16), 5, 3);
  for (let y = mastTop + 4; y < base - 2; y += 6) crane.add("#c77f0e", x + 9, y, 2, 1);
  c.extras.push(crane.toString(), `<rect class="pf-beacon" x="${x + 8}" y="${mastTop - 4}" width="4" height="4" fill="${BEACON}"/>`);
  if (sign) neonSign(c, hookX + 0.5, mastTop + 14, sign);
}

// src/city/events.ts
var EVENTS_CSS = `
.pf-xmas-a{animation:pf-xmas 1.4s steps(1) infinite}
.pf-xmas-b{animation:pf-xmas 1.4s steps(1) infinite;animation-delay:-.7s}
@keyframes pf-xmas{0%{opacity:1}50%{opacity:.25}100%{opacity:.25}}
.pf-swing{transform-box:fill-box;transform-origin:50% 0;animation:pf-swing 2.6s ease-in-out infinite alternate}
@keyframes pf-swing{0%{transform:rotate(-8deg)}100%{transform:rotate(8deg)}}
.pf-bats{animation:pf-bats 30s linear infinite}
@keyframes pf-bats{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-launch{animation:pf-launch 4.2s ease-out infinite}
@keyframes pf-launch{0%{transform:translateY(90px);opacity:0}5%{opacity:1}30%{transform:translateY(0);opacity:1}33%,100%{transform:translateY(0);opacity:0}}
.pf-spark{animation:pf-spark 4.2s ease-out infinite}
@keyframes pf-spark{0%,30%{transform:translate(0,0);opacity:0}32%{opacity:1}70%{opacity:.9}100%{transform:translate(var(--dx),var(--dy));opacity:0}}
`;
var XMAS2 = ["#ff4d4d", "#ffd166", "#7dd3fc", "#7dff9b"];
function roofDecor(c, rng, x, w, top, holiday) {
  if (holiday === "halloween" && rng() < 0.22) {
    pumpkin(c, x + Math.floor(w / 2) - 3, top - 4);
  } else if (holiday === "christmas") {
    for (let i = 0; i < Math.floor((w - 1) / 3); i++) {
      classedBatch(c, i % 2 ? "pf-xmas-b" : "pf-xmas-a").add(XMAS2[(i + Math.floor(rng() * 4)) % 4], x + 1 + i * 3, top - 1, 2, 2);
    }
  } else if (holiday === "lunar-new-year" && rng() < 0.3) {
    lantern(c, x + 1, top + 2);
  }
}
function parkDecor(c, rng, x, w, holiday) {
  if (holiday === "halloween" && rng() < 0.6) pumpkin(c, x + 1, BASE_Y - 6);
  if (holiday === "lunar-new-year" && rng() < 0.5) lantern(c, x + w - 6, BASE_Y - 24);
}
function pumpkin(c, x, y) {
  c.extras.push(
    `<rect x="${x}" y="${y}" width="6" height="4" rx="1" fill="#f28c28"/>`,
    `<rect x="${x + 2}" y="${y - 1}" width="2" height="1" fill="#3f7d3a"/>`,
    `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#3b1d00"/>`,
    `<rect x="${x + 4}" y="${y + 1}" width="1" height="1" fill="#3b1d00"/>`
  );
}
function lantern(c, x, y) {
  c.extras.push(
    `<g class="pf-swing"><rect x="${x + 1}" y="${y}" width="2" height="1" fill="#ffd166"/>`,
    `<rect x="${x}" y="${y + 1}" width="4" height="5" rx="1" fill="#e63946"/>`,
    `<rect x="${x + 1}" y="${y + 6}" width="2" height="2" fill="#ffd166"/></g>`
  );
}
function bats(holiday) {
  if (holiday !== "halloween") return "";
  const bat = (dx, dy) => `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 1L2 0L3 2L4 0L6 1"/><path class="pf-flap-b" d="M0 0L2 2L3 1L4 2L6 0"/></g>`;
  return `<g class="pf-bats" style="animation-delay:-4s"><g transform="translate(0 72)" fill="none" stroke="#140c1c" stroke-width="1.6">${bat(0, 0)}${bat(12, 7)}${bat(24, -4)}${bat(36, 5)}${bat(48, -1)}</g></g>`;
}
var SPARK_COLORS = ["#ff5c7a", "#ffd166", "#7dd3fc", "#c3a6ff", "#7dff9b"];
function fireworks2(rng) {
  const out = [];
  for (let b = 0; b < 3; b++) {
    const cx = Math.round(140 + b * 220 + rng() * 80);
    const cy = Math.round(72 + rng() * 40);
    const color = SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)];
    const delay = `animation-delay:-${(b * 1.4).toFixed(1)}s`;
    out.push(`<rect class="pf-launch" style="${delay}" x="${cx}" y="${cy}" width="2" height="5" fill="${color}"/>`);
    for (let i = 0; i < 14; i++) {
      const angle = i / 14 * Math.PI * 2;
      const r2 = 20 + rng() * 10;
      const dx = Math.round(Math.cos(angle) * r2);
      const dy = Math.round(Math.sin(angle) * r2 + 8);
      out.push(
        `<rect class="pf-spark" style="${delay};--dx:${dx}px;--dy:${dy}px" x="${cx}" y="${cy}" width="2" height="2" fill="${color}"/>`
      );
    }
  }
  return `<g>${out.join("")}</g>`;
}

// src/city/pet.ts
var CITY_PET_CSS = `
.pf-stroll{animation:pf-stroll 80s linear infinite}
@keyframes pf-stroll{0%,100%{transform:translateX(40px)}46%,50%{transform:translateX(720px)}96%{transform:translateX(40px)}}
.pf-face{transform-box:fill-box;transform-origin:center;animation:pf-face 80s steps(1) infinite}
@keyframes pf-face{0%{transform:scaleX(1)}48%{transform:scaleX(-1)}98%{transform:scaleX(1)}}
.pf-hop{animation:pf-hop .5s ease-in-out infinite}
@keyframes pf-hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.pf-zz{animation:pf-zz 2.6s ease-out infinite}
@keyframes pf-zz{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(6px,-18px);opacity:0}}
`;
var REST_X = 214;
function strollingPet(pet2) {
  if (!pet2 || pet2.ranAway) return "";
  const sprite = renderPetSprite(pet2, 1, { lively: false });
  const y = ROAD_Y - sprite.height;
  const walking = pet2.stage !== "egg" && (pet2.mood === "happy" || pet2.mood === "idle");
  if (walking) {
    const hop = pet2.mood === "happy" ? ` class="pf-hop"` : "";
    return `<g class="pf-stroll" style="animation-delay:-12s"><g transform="translate(0 ${y})"><g class="pf-face" style="animation-delay:-12s"><g${hop}>${sprite.svg}</g></g></g></g>`;
  }
  const top = y;
  const right = REST_X + sprite.width;
  let thought = "";
  if (pet2.mood === "sleeping") {
    thought = [0, 0.9, 1.8].map(
      (delay) => `<g class="pf-zz" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid: ZED }], FX_PALETTE, { x: right - 4, y: top - 6, scale: 1 })}</g>`
    ).join("");
  } else if (pet2.mood === "hungry") {
    thought = `<g class="pf-bob"><rect x="${right - 2}" y="${top - 14}" width="12" height="11" rx="4" fill="#ffffff" opacity=".9"/>${renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: right + 1, y: top - 11, scale: 1.5 })}</g>`;
  }
  return `<g transform="translate(${REST_X} ${y})">${sprite.svg}</g>${thought}`;
}

// src/world/weather.ts
function weatherFor(daysSinceLastContribution2) {
  if (daysSinceLastContribution2 >= 14) return "fog";
  if (daysSinceLastContribution2 >= 4) return "rain";
  return "clear";
}
var WEATHER_CSS = `
.pf-drift{animation:pf-drift 160s linear infinite}
@keyframes pf-drift{0%{transform:translateX(-160px)}100%{transform:translateX(${W + 60}px)}}
.pf-rain{animation:pf-rain .8s linear infinite}
@keyframes pf-rain{0%{transform:translate(0,-12px)}100%{transform:translate(-26px,${H + 12}px)}}
.pf-fog{animation:pf-fog 24s ease-in-out infinite alternate}
@keyframes pf-fog{0%{transform:translateX(-50px)}100%{transform:translateX(50px)}}
`;
function cloud2(batch, fill, x, y, s) {
  batch.add(fill, x, y + 4 * s, 22 * s, 4 * s).add(fill, x + 4 * s, y + s, 10 * s, 4 * s).add(fill, x + 10 * s, y, 8 * s, 5 * s).add(fill, x + 16 * s, y + 2 * s, 5 * s, 3 * s);
}
function overcast(rng) {
  const batch = new RectBatch();
  for (let x = -30; x < W; x += 70 + Math.round(rng() * 40)) {
    cloud2(batch, "#6f7689", x, 58 + Math.round(rng() * 40), 3);
  }
  return `<rect width="${W}" height="${H}" fill="#1b2033" opacity=".28"/><g opacity=".85">${batch}</g>`;
}
function rain(rng, area = CITY_AREA) {
  const drops = [];
  const count2 = Math.round(70 * area.w / W) + 6;
  for (let i = 0; i < count2; i++) {
    const x = area.x + Math.round(rng() * (area.w + 40));
    const seconds = (0.55 + rng() * 0.4).toFixed(2);
    const delay = (rng() * 1).toFixed(2);
    drops.push(
      `<rect class="pf-rain" style="animation-duration:${seconds}s;animation-delay:-${delay}s" x="${x}" y="${area.y}" width="1" height="7" fill="#b9d3ff" opacity=".55"/>`
    );
  }
  return `<g>${drops.join("")}</g>`;
}
function fog(area = CITY_AREA) {
  const bands = [
    { y: area.ground - 84, h: 40, o: 0.35, d: 0 },
    { y: area.ground - 52, h: 44, o: 0.45, d: 8 },
    { y: area.ground - 24, h: 40, o: 0.55, d: 15 }
  ];
  return bands.map(
    (b) => `<rect class="pf-fog" style="animation-delay:-${b.d}s" x="${area.x - 60}" y="${b.y}" width="${area.w + 120}" height="${b.h}" fill="url(#pf-fog)" opacity="${b.o}"/>`
  ).join("");
}

// src/city/celestial.ts
var SYNODIC_MONTH = 29.530588853;
var KNOWN_NEW_MOON = Date.UTC(2e3, 0, 6, 18, 14);
function moonPhase(date) {
  const t = Date.parse(`${date}T12:00:00Z`);
  const days = (t - KNOWN_NEW_MOON) / 864e5;
  return (days / SYNODIC_MONTH % 1 + 1) % 1;
}
function moonPhaseName(phase) {
  const names = [
    "new moon",
    "waxing crescent",
    "first quarter",
    "waxing gibbous",
    "full moon",
    "waning gibbous",
    "last quarter",
    "waning crescent"
  ];
  return names[Math.round(phase * 8) % 8];
}
function pixelCircle(batch, fill, cx, cy, radius, px9) {
  const r2 = Math.round(radius / px9);
  for (let dy = -r2; dy < r2; dy++) {
    const half = Math.round(Math.sqrt(r2 * r2 - (dy + 0.5) ** 2));
    batch.add(fill, cx - half * px9, cy + dy * px9, half * 2 * px9, px9);
  }
}
function pixelMoon(cx, cy, radius, px9, phase, south = false) {
  const lit = new RectBatch();
  const dark2 = new RectBatch();
  const r2 = Math.round(radius / px9);
  const terminator = Math.cos(2 * Math.PI * phase);
  for (let dy = -r2; dy < r2; dy++) {
    const yc = (dy + 0.5) / r2;
    const half = Math.sqrt(Math.max(0, 1 - yc * yc));
    const cols = Math.round(half * r2);
    let runStart = -cols;
    let runLit = null;
    const flush = (end) => {
      if (runLit === null || end <= runStart) return;
      (runLit ? lit : dark2).add("var(--pf-celestial)", cx + runStart * px9, cy + dy * px9, (end - runStart) * px9, px9);
    };
    for (let dx = -cols; dx < cols; dx++) {
      const xc = (dx + 0.5) / r2 * (south ? -1 : 1);
      const isLit = phase < 0.5 ? xc > half * terminator : xc < -half * terminator;
      if (isLit !== runLit) {
        flush(dx);
        runStart = dx;
        runLit = isLit;
      }
    }
    flush(cols);
  }
  return `<g opacity=".13">${dark2}</g>${lit}`;
}

// src/city/render.ts
var SANS = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
var MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
var SHADES = ["var(--pf-bldg1)", "var(--pf-bldg2)", "var(--pf-bldg3)", "var(--pf-bldg4)", "var(--pf-bldg5)"];
var SUN = { x: 640, y: 122, r: 30 };
var MOON = { x: 700, y: 70, r: 13 };
var CAR = [
  "...ccccc....",
  "..cwwcwwc...",
  "qccccccccccy",
  "cccccccccccc",
  "cckkcccckkcc",
  ".kggk..kggk.",
  "..kk....kk.."
];
var CAR_COLORS = ["#e63946", "#4ea8de", "#f4a261"];
var FERRY = ["....ss.......", "..wwwwwwwww..", "..wlwlwlwlw..", "rrrrrrrrrrrrr", ".hhhhhhhhhhh."];
var SAILBOAT = ["...m....", "..sm....", ".ssm....", "sssm....", "...m....", "hhhhhhh.", ".hhhhh.."];
var BALLOON3 = ["..rrrr..", ".ryrryr.", "ryrrrryr", "ryrrrryr", ".ryrryr.", "..rrrr..", "...kk...", "...bb..."];
var CSS = `
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 2.2s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.pf-night{opacity:var(--pf-stars)}
.pf-day{opacity:calc(1 - var(--pf-stars))}
.pf-beam{opacity:var(--pf-stars)}
.pf-glow{opacity:var(--pf-stars)}
.pf-rim{opacity:calc(.45 - var(--pf-stars) * .25)}
.pf-sunlit{opacity:calc((1 - var(--pf-stars)) * .14)}
.pf-bloom{opacity:calc(var(--pf-stars) * .55)}
.pf-flicker{animation:pf-flicker 7s linear infinite}
@keyframes pf-flicker{0%,84%,100%{opacity:1}85%,93%{opacity:0}}
.pf-beacon{animation:pf-beacon 1.6s steps(1) infinite}
@keyframes pf-beacon{0%{opacity:1}50%{opacity:.15}100%{opacity:.15}}
.pf-strobe{animation:pf-strobe 1.1s steps(1) infinite}
@keyframes pf-strobe{0%{opacity:1}12%{opacity:0}100%{opacity:0}}
.pf-neon{animation:pf-buzz 6s linear infinite}
@keyframes pf-buzz{0%,90%,94%,97%,100%{opacity:1}91%,95%{opacity:.35}}
.pf-search{animation:pf-search 9s ease-in-out infinite alternate}
@keyframes pf-search{0%{transform:rotate(-32deg)}100%{transform:rotate(30deg)}}
.pf-sign{font:700 8px ${MONO};letter-spacing:.06em}
.pf-drive-r{animation:pf-drive-r 14s linear infinite}
.pf-drive-l{animation:pf-drive-l 18s linear infinite}
@keyframes pf-drive-r{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
@keyframes pf-drive-l{0%{transform:translateX(${W + 60}px)}100%{transform:translateX(-60px)}}
.pf-sail-r{animation:pf-drive-r 70s linear infinite}
.pf-sail-l{animation:pf-drive-l 95s linear infinite}
.pf-bob{animation:pf-bob 2.4s ease-in-out infinite}
@keyframes pf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(1px)}}
.pf-fly{animation:pf-fly 38s linear infinite}
@keyframes pf-fly{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-flock{animation:pf-flock 46s linear infinite}
@keyframes pf-flock{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
.pf-balloon{animation:pf-balloon 120s linear infinite}
@keyframes pf-balloon{0%{transform:translate(-40px,8px)}50%{transform:translate(${W / 2}px,-6px)}100%{transform:translate(${W + 40}px,4px)}}
.pf-flap-a{animation:pf-flap-a .6s steps(1) infinite}
.pf-flap-b{opacity:0;animation:pf-flap-b .6s steps(1) infinite}
@keyframes pf-flap-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-flap-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.pf-shoot{animation:pf-shoot 9s ease-out infinite}
@keyframes pf-shoot{0%{transform:translate(0,0);opacity:0}2%{opacity:1}12%{transform:translate(-170px,74px);opacity:0}100%{transform:translate(-170px,74px);opacity:0}}
.pf-ripple{animation:pf-ripple 2.4s steps(8) infinite}
@keyframes pf-ripple{0%{transform:translate(0,0)}100%{transform:translate(-40px,3px)}}
.pf-wave{animation:pf-wave 7s ease-in-out infinite alternate}
@keyframes pf-wave{0%{transform:translateX(-6px)}100%{transform:translateX(6px)}}
.pf-glint{animation:pf-glint 2.6s steps(1) infinite}
@keyframes pf-glint{0%,100%{opacity:.15}30%{opacity:1}60%{opacity:.5}}
.pf-drop{transform-box:fill-box;transform-origin:center;animation:pf-drop 1.6s ease-out infinite}
@keyframes pf-drop{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.6);opacity:0}}
${SEASON_CSS}
${WEATHER_CSS}
${EVENTS_CSS}
${CITY_PET_CSS}
${SPRITE_CSS}
.pf-title{font:700 18px ${SANS};fill:var(--pf-city-text)}
.pf-sub{font:400 12px ${SANS};fill:var(--pf-city-muted)}
.pf-chip{font:700 10px ${MONO};fill:var(--pf-city-text);letter-spacing:.05em}
.pf-halo{paint-order:stroke;stroke:var(--pf-city-sky-top);stroke-width:3px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;
function floorsFor(week, maxTotal) {
  if (week.total <= 0 || maxTotal <= 0) return 0;
  const ratio = (week.total / maxTotal) ** 0.6;
  return Math.max(1, Math.round(1 + (MAX_FLOORS - 1) * ratio));
}
function widthFor(week) {
  return week.activeDays <= 1 ? 10 : week.activeDays <= 3 ? 12 : week.activeDays <= 5 ? 14 : 16;
}
var px3 = (grid, palette, x, y, scale = U) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });
function sky2(state, rng, weather, south, retro) {
  const base = `<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>`;
  if (weather !== "clear") return base;
  const stars = new RectBatch();
  const twinkles = [];
  for (let i = 0; i < 70; i++) {
    const x = Math.round(rng() * (W - 20)) + 10;
    const y = Math.round(rng() * 150) + 6;
    const size = rng() < 0.12 ? 2 : 1;
    if (rng() < 0.22) {
      twinkles.push(`<rect class="pf-twinkle" style="animation-delay:-${(rng() * 3).toFixed(2)}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`);
    } else {
      stars.add(size === 2 ? "#ffffff" : "#c9d6ff", x, y, size, size);
    }
  }
  const dust = new RectBatch();
  for (let i = 0; i < 60; i++) {
    const t = rng();
    const x = Math.round(60 + t * 520 + (rng() - 0.5) * 70);
    const y = Math.round(10 + t * 120 + (rng() - 0.5) * 40);
    dust.add("#dfe6ff", x, y, 1, 1);
  }
  const sun2 = new RectBatch();
  pixelCircle(sun2, "var(--pf-celestial)", SUN.x, SUN.y, SUN.r, 4);
  const halo = (r2, o) => `<circle cx="${SUN.x}" cy="${SUN.y}" r="${r2}" style="fill:var(--pf-celestial)" opacity="${o}"/>`;
  const moonHalo = `<circle cx="${MOON.x}" cy="${MOON.y}" r="34" style="fill:var(--pf-celestial)" opacity=".05"/><circle cx="${MOON.x}" cy="${MOON.y}" r="22" style="fill:var(--pf-celestial)" opacity=".08"/>`;
  const shootingStar = state.currentStreak >= 7 ? `<g class="pf-shoot"><line x1="560" y1="34" x2="592" y2="20" stroke="url(#pf-tail)" stroke-width="2"/><rect x="558" y="33" width="3" height="3" fill="#fff"/></g>` : "";
  return `${base}
<g class="pf-day">${retro ? "" : `<ellipse cx="${SUN.x}" cy="${BASE_Y}" rx="330" ry="90" fill="url(#pf-horizon)"/>${halo(84, 0.1)}${halo(60, 0.18)}`}${sun2}</g>
<g class="pf-night"><g opacity=".35">${dust}</g>${stars}${twinkles.join("")}${moonHalo}${pixelMoon(MOON.x, MOON.y, MOON.r, U, moonPhase(state.date), south)}${shootingStar}</g>`;
}
function clouds(rng) {
  const out = [];
  for (let i = 0; i < 5; i++) {
    const s = rng() < 0.4 ? 3 : 2;
    const body = new RectBatch().add("#ffffff", 0, 4 * s, 22 * s, 3 * s).add("#ffffff", 4 * s, s, 10 * s, 4 * s).add("#ffffff", 10 * s, 0, 8 * s, 5 * s).add("#ffffff", 16 * s, 2 * s, 5 * s, 3 * s);
    const lit = new RectBatch().add("var(--pf-celestial)", 2 * s, 7 * s, 18 * s, s);
    const y = 70 + Math.round(rng() * 60);
    const delay = Math.round(rng() * 160);
    out.push(`<g class="pf-drift" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})"><g opacity=".75">${body}</g><g opacity=".55">${lit}</g></g></g>`);
  }
  return `<g class="pf-day">${out.join("")}</g>`;
}
function flyers(weather) {
  const plane = new RectBatch().add("var(--pf-bldg1)", 0, 2, 18, 3).add("var(--pf-bldg1)", 14, -1, 3, 3).add("var(--pf-bldg1)", 6, 5, 6, 2);
  const flyingPlane = `<g class="pf-fly" style="animation-delay:-14s"><g transform="translate(0 96)">${plane}
<rect class="pf-beacon" x="8" y="7" width="2" height="2" fill="#ff4d4d"/>
<rect class="pf-beacon" style="animation-delay:-.8s" x="-1" y="3" width="2" height="2" fill="#7dff9b"/>
<rect class="pf-strobe" x="16" y="-2" width="2" height="2" fill="#ffffff"/></g></g>`;
  const bird = (dx, dy) => `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 0L3 3L6 0"/><path class="pf-flap-b" d="M0 3L3 2L6 3"/></g>`;
  const flock = `<g class="pf-flock" style="animation-delay:-20s"><g transform="translate(0 116)" fill="none" stroke="var(--pf-bldg3)" stroke-width="1.3">${bird(0, 0)}${bird(10, 5)}${bird(-9, 6)}${bird(20, 10)}</g></g>`;
  const balloon = `<g class="pf-balloon" style="animation-delay:-38s"><g transform="translate(0 78)">${px3(BALLOON3, { r: "#e8505b", y: "#ffd166", k: "#5b3a29", b: "#8a5a33" }, 0, 0, 2)}</g></g>`;
  return weather === "clear" ? `${flyingPlane}<g class="pf-day">${flock}${balloon}</g>` : flyingPlane;
}
function farside(rng) {
  const hills2 = stepped("var(--pf-city-hill)", 0, W, (x2) => BASE_Y - Math.round(40 + 16 * Math.sin(x2 / 90) + 9 * Math.sin(x2 / 31 + 1)), () => BASE_Y);
  const blocks2 = new RectBatch();
  const lights = new RectBatch();
  const masts = [];
  let x = 0;
  while (x < W) {
    const w = 8 + Math.round(rng() * 14);
    const h = 26 + Math.round(rng() ** 1.7 * 62);
    const mast = silhouette(blocks2, "var(--pf-city-haze)", rng, x, w, h);
    for (let i = 0; i < Math.round(h / 20); i++) {
      lights.add("var(--pf-window-on)", x + 2 + Math.round(rng() * (w - 4)), BASE_Y - h + 4 + Math.round(rng() * (h - 8)), 1, 1);
    }
    if (mast && masts.length < 4) masts.push(`<rect class="pf-beacon" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" x="${mast.x}" y="${mast.y - 2}" width="2" height="2" fill="#ff4d4d"/>`);
    x += w + (rng() < 0.3 ? 3 : 0);
  }
  return `<g opacity=".7">${hills2}</g><g id="pf-far" opacity=".62">${blocks2}</g><rect x="0" y="${BASE_Y - 100}" width="${W}" height="100" fill="url(#pf-farwin)" mask="url(#pf-farmask)"/><g class="pf-night" opacity=".7">${lights}${masts.join("")}</g>${tvTower()}<rect x="0" y="${BASE_Y - 70}" width="${W}" height="70" fill="url(#pf-haze)"/>` + midtown(rng);
}
function silhouette(b, fill, rng, x, w, h) {
  let tx = x;
  let tw = w;
  const top = BASE_Y - h;
  if (w >= 10 && rng() < 0.35) {
    const lower = Math.round(h * (0.45 + rng() * 0.25));
    const inset = 2 + Math.floor(rng() * (w / 5));
    tx = x + inset;
    tw = w - 2 * inset;
    b.add(fill, x, BASE_Y - lower, w, lower).add(fill, tx, top, tw, h - lower);
  } else b.add(fill, x, top, w, h);
  const cx = tx + Math.floor(tw / 2);
  const crown2 = rng();
  if (crown2 < 0.16 && h > 50) {
    b.add(fill, cx - 1, top - 4, 2, 4).add(fill, cx, top - 12, 1, 8);
    return { x: cx - 1, y: top - 12 };
  }
  if (crown2 < 0.3) {
    b.add(fill, tx + tw - 3, top - 7, 1, 7);
    return h > 60 ? { x: tx + tw - 4, y: top - 7 } : null;
  }
  if (crown2 < 0.44 && tw >= 8) b.add(fill, tx + 2, top - 3, tw - 4, 3).add(fill, tx + 4, top - 5, tw - 8, 2);
  else if (crown2 < 0.56) for (let i = 0; i < tw; i += 2) b.add(fill, tx + i, top - Math.round((tw - i) / 2.5), 2, Math.round((tw - i) / 2.5));
  else if (crown2 < 0.64 && tw >= 8) b.add(fill, tx + 2, top - 2, tw - 4, 2).add(fill, tx + 3, top - 4, tw - 6, 2).add(fill, cx - 1, top - 6, 2, 2);
  else if (crown2 < 0.8) b.add(fill, tx + 1, top - 2, Math.max(2, Math.floor(tw / 3)), 2);
  return null;
}
function midtown(rng) {
  const blocks2 = new RectBatch();
  const windows = new RectBatch();
  let x = -4;
  while (x < W) {
    const w = 10 + Math.round(rng() * 14);
    const h = 34 + Math.round(rng() ** 1.4 * 56);
    silhouette(blocks2, "var(--pf-bldg2)", rng, x, w, h);
    for (let y = BASE_Y - h + 4; y < BASE_Y - 4; y += 5) {
      if (rng() > 0.34) continue;
      const from = x + 2 + Math.floor(rng() * (w - 4) / 4) * 4;
      const run = 1 + Math.floor(rng() * 4);
      for (let i = 0; i < run && from + i * 4 < x + w - 3; i++) windows.add("var(--pf-window-on)", from + i * 4 + 1, y + 1, 2, 2);
    }
    x += w + (rng() < 0.4 ? 3 : 0);
  }
  return `<g opacity=".72"><g id="pf-mid">${blocks2}</g></g><rect class="pf-day" x="0" y="${BASE_Y - 110}" width="${W}" height="110" fill="url(#pf-midwin)" mask="url(#pf-midmask)"/><g class="pf-night" opacity=".42">${windows}</g><rect x="0" y="${BASE_Y - 40}" width="${W}" height="40" fill="url(#pf-haze)" opacity=".6"/>`;
}
function tvTower() {
  const cx = 150;
  const top = BASE_Y - 104;
  const deckY = BASE_Y - 70;
  const shaft = new RectBatch();
  for (let y = deckY + 6; y < BASE_Y; y += 2) {
    const half = Math.round(2 + (y - deckY) / (BASE_Y - deckY) * 6);
    shaft.add("var(--pf-city-haze)", cx - half, y, half * 2, 2);
  }
  shaft.add("var(--pf-city-haze)", cx - 2, top + 14, 4, deckY - top - 14).add("var(--pf-city-haze)", cx - 9, deckY, 18, 6).add("var(--pf-city-haze)", cx - 6, deckY - 2, 12, 2).add("var(--pf-city-haze)", cx - 5, top + 20, 10, 3).add("var(--pf-city-haze)", cx - 1, top, 2, 14);
  const lattice = new RectBatch();
  for (let y = deckY + 10; y < BASE_Y - 4; y += 8) lattice.add("#ffffff", cx - 1, y, 2, 1);
  const windows = new RectBatch();
  for (let x = cx - 7; x < cx + 7; x += 3) windows.add("#ffe6a8", x, deckY + 2, 2, 2);
  windows.add("#ffe6a8", cx - 3, top + 21, 2, 1).add("#ffe6a8", cx + 1, top + 21, 2, 1);
  return `<g opacity=".92">${shaft}<g opacity=".08">${lattice}</g></g><g class="pf-night"><g opacity=".8">${windows}</g><rect class="pf-beacon" x="${cx - 1}" y="${top - 2}" width="2" height="2" fill="#ff4d4d"/><rect class="pf-beacon" style="animation-delay:-.8s" x="${cx - 1}" y="${top + 8}" width="2" height="2" fill="#ff4d4d"/></g>`;
}
function skyline2(state, season, holiday, weather) {
  const canvas = newCanvas();
  const look = LOOKS[season];
  const weeks = state.weeks;
  const maxTotal = Math.max(0, ...weeks.map((w) => w.total));
  const widths = weeks.map(widthFor);
  let x = RIGHT_EDGE - widths.reduce((a, b) => a + b, 0);
  let prevShade = -1;
  weeks.forEach((week, i) => {
    const rng = seeded(`${state.login}:${week.start}`);
    const w = widths[i];
    const bx = x;
    x += w;
    if (bx + w < 0) return;
    const isCurrent = i === weeks.length - 1;
    const isBest = state.bestWeek?.start === week.start;
    const special = isCurrent || isBest;
    const quiet = !special && week.total > 0 && week.total <= 3;
    const floors = quiet ? week.total === 1 ? 1 : 2 : floorsFor(week, maxTotal);
    if (floors === 0) {
      if (isCurrent) drawCrane(canvas, bx, BASE_Y);
      else {
        drawPark(canvas, rng, bx, w, look);
        parkDecor(canvas, rng, bx, w, holiday);
      }
      prevShade = -1;
      return;
    }
    let shade = Math.floor(rng() * SHADES.length);
    if (shade === prevShade) shade = (shade + 1) % SHADES.length;
    prevShade = shade;
    const top = drawBuilding(canvas, rng, {
      x: bx,
      w,
      floors,
      fill: SHADES[shade],
      style: special ? "classic" : quiet ? "house" : pickStyle(floors, rng),
      // Busier weeks keep more lights on; fog swallows half of them.
      lit: (0.08 + 0.74 * (week.activeDays / 7)) * (weather === "fog" ? 0.5 : 1),
      snow: look.snow,
      roofDetails: !special
    });
    if (isCurrent) drawCrane(canvas, bx, top, isBest ? state.topLanguage : null);
    else if (isBest) drawLandmark(canvas, bx, w, top, state.topLanguage);
    else roofDecor(canvas, rng, bx, w, top, holiday);
  });
  return `${renderCanvas(canvas)}<use href="#pf-lit" class="pf-bloom" filter="url(#pf-bloom)"/>`;
}
function quay(state, season, pet2) {
  const snowy = LOOKS[season].snow;
  const ground2 = new RectBatch().add(snowy ? "#e3ebf5" : "var(--pf-window-off)", 0, BASE_Y, W, ROAD_Y - BASE_Y).add("var(--pf-road)", 0, ROAD_Y, W, QUAY_Y - ROAD_Y);
  const wall = new RectBatch().add("var(--pf-city-quay)", 0, QUAY_Y, W, WATER_Y - QUAY_Y);
  const coping = new RectBatch().add("#ffffff", 0, QUAY_Y, W, 2);
  const joints = new RectBatch().add("#000000", 0, QUAY_Y + 2, W, 1).add("#000000", 0, QUAY_Y + 6, W, 1).add("#000000", 0, WATER_Y - 1, W, 1);
  for (let x = 0; x < W; x += 16) joints.add("#000000", x, QUAY_Y + 3, 1, 3).add("#000000", x + 8, QUAY_Y + 7, 1, WATER_Y - QUAY_Y - 7);
  const curb = new RectBatch().add("#ffffff", 0, BASE_Y, W, 1).add("#000000", 0, ROAD_Y, W, 1);
  const lane = new RectBatch();
  for (let x = 6; x < W; x += 26) lane.add("#f2e3a8", x, ROAD_Y + 7, 12, 1);
  const bollards = new RectBatch();
  for (let x = 20; x < W; x += 40) bollards.add("var(--pf-road)", x, QUAY_Y - 2, 2, 3);
  const lamps = new RectBatch();
  const glows = [];
  for (let x = 60; x < W; x += 120) {
    lamps.add("var(--pf-road)", x, BASE_Y - 20, 2, 22).add("var(--pf-road)", x, BASE_Y - 20, 7, 2);
    lamps.add("var(--pf-window-on)", x + 4, BASE_Y - 18, 3, 2);
    glows.push(`<ellipse cx="${x + 5}" cy="${BASE_Y - 6}" rx="13" ry="16" fill="url(#pf-lamp)"/>`);
  }
  const cars = state.activeDays14 === 0 ? 0 : state.activeDays14 <= 4 ? 1 : state.activeDays14 <= 9 ? 2 : 3;
  const lanes = [
    { dir: "r", y: ROAD_Y - 2, delay: 3 },
    { dir: "l", y: ROAD_Y, delay: 7 },
    { dir: "r", y: ROAD_Y - 2, delay: 10 }
  ];
  const traffic = lanes.slice(0, cars).map(({ dir, y, delay }, i) => {
    const palette = { c: CAR_COLORS[i], w: "#bde0fe", k: "#0b0b0f", g: "#c3c8d0", y: "#fff3a0", q: "#ff4d4d" };
    const grid = dir === "r" ? CAR : mirror(CAR);
    const beam = dir === "r" ? `<path class="pf-beam" d="M24 5L58 1V11Z" fill="url(#pf-beam-r)"/>` : `<path class="pf-beam" d="M0 5L-34 1V11Z" fill="url(#pf-beam-l)"/>`;
    return `<g class="pf-drive-${dir}" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})">${beam}${renderPixels([{ x: 0, y: 0, grid }], palette, { scale: U })}</g></g>`;
  });
  return `${ground2}<g opacity=".14">${curb}</g><g opacity=".5">${lane}</g>${litter(LOOKS[season], seeded(`litter:${state.login}`))}<g class="pf-glow">${glows.join("")}</g>${lamps}${pet2}${traffic.join("")}${wall}<g opacity=".35">${coping}</g><g opacity=".3">${joints}</g>${bollards}`;
}
function bay(rng, season, weather) {
  const h = H - WATER_Y;
  const water3 = `<rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="url(#pf-water)"/>`;
  const reflection = `<g mask="url(#pf-reflect)" opacity=".6"><use href="#pf-city" transform="matrix(1 0 0 -1 0 ${BASE_Y + MIRROR_Y})"/></g><rect x="0" y="${WATER_Y}" width="${W}" height="${MIRROR_Y - WATER_Y}" style="fill:var(--pf-city-quay)" opacity=".55"/><g class="pf-wave" opacity=".3"><rect x="-10" y="${WATER_Y}" width="${W + 20}" height="1" fill="#ffffff"/></g>`;
  const path = (cx, color, spread) => {
    const out = [];
    for (let i = 0; i < 9; i++) {
      const y = WATER_Y + 3 + i * 5 + Math.round(rng() * 2);
      const w = 6 + Math.round(rng() * spread * (0.4 + i / 12));
      const x = Math.round(cx - w / 2 + (rng() - 0.5) * (6 + i * 2));
      out.push(`<rect class="pf-glint" style="animation-delay:-${(rng() * 2.6).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="1"/>`);
    }
    return out.join("");
  };
  const waves = new RectBatch();
  for (let i = 0; i < 26; i++) {
    const y = WATER_Y + 4 + Math.round(rng() * (h - 8));
    waves.add("#ffffff", Math.round(rng() * W), y, 8 + Math.round(rng() * 22), 1);
  }
  const ferry = `<g class="pf-sail-r" style="animation-delay:-22s"><g transform="translate(0 ${WATER_Y + 12})"><g class="pf-bob">${px3(FERRY, { s: "#3a3f55", w: "#f1f3f5", l: "var(--pf-window-on)", r: "#c0392b", h: "#23263b" }, 0, 0, 2)}</g><rect x="-10" y="11" width="10" height="1" fill="#ffffff" opacity=".5"/></g></g>`;
  const sailboat = weather !== "clear" ? "" : `<g class="pf-day"><g class="pf-sail-l" style="animation-delay:-60s"><g transform="translate(0 ${WATER_Y + 30})"><g class="pf-bob" style="animation-delay:-1s">${px3(SAILBOAT, { s: "#fdfcf7", m: "#6b4b2a", h: "#2c4a5e" }, 0, 0, 2)}</g></g></g></g>`;
  const winter = season === "winter" ? `<rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="#eef4fb" opacity=".22"/>` : "";
  const drops = weather === "rain" ? Array.from({ length: 10 }, () => `<ellipse class="pf-drop" style="animation-delay:-${(rng() * 1.6).toFixed(2)}s" cx="${Math.round(rng() * W)}" cy="${WATER_Y + 6 + Math.round(rng() * (h - 10))}" rx="5" ry="1.5" fill="none" stroke="#dbe7ff" stroke-width=".8"/>`).join("") : "";
  const lights = weather === "clear" ? `<g class="pf-day">${path(SUN.x, "var(--pf-celestial)", 60)}</g><g class="pf-night">${path(MOON.x, "#fff4d6", 26)}</g>` : "";
  return `${water3}${reflection}<g class="pf-wave" opacity=".14">${waves}</g>${lights}${winter}${drops}${ferry}${sailboat}`;
}
var TROPHY = ["y.yyy.y", "y.yyy.y", ".yyyyy.", "..yyy..", "...y...", "..yyy..", ".yyyyy."];
var FLAME = ["...o...", "..oo...", "..ooo..", ".ooyoo.", ".oyyyo.", ".oyyyo.", "..ooo.."];
var STAR2 = ["...y...", "..yyy..", "yyyyyyy", ".yyyyy.", "..yyy..", ".yy.yy.", ".y...y."];
function chips(state) {
  const items = [
    [TROPHY, `BEST WEEK ${state.bestWeek?.total ?? 0}`],
    [FLAME, `STREAK ${state.currentStreak}D`],
    [STAR2, `LONGEST ${state.longestStreak}D`]
  ];
  const palette = { y: "#ffd166", o: "#ff7a45" };
  let right = W - 20;
  const out = [];
  for (const [icon, label] of items.reverse()) {
    const w = Math.round(label.length * 6.1 + 26);
    const x = right - w;
    out.unshift(
      `<g><rect x="${x}" y="20" width="${w}" height="18" rx="9" fill="#0b0f1e" fill-opacity=".38"/>${px3(icon, palette, x + 7, 24, 1.5)}<text x="${x + 20}" y="32.5" class="pf-chip">${escapeXml(label)}</text></g>`
    );
    right = x - 6;
  }
  return out.join("");
}
function renderCityCard(state, options = {}) {
  const rng = seeded(`city:${state.login}`);
  const season = options.season ?? seasonFor(state.date, options.hemisphere);
  const look = LOOKS[season];
  const holiday = holidayFor(state.date);
  const weather = weatherFor(state.daysSinceLastContribution);
  const current = state.weeks.at(-1);
  const newRecord = !!current && state.bestWeek?.start === current.start && current.total >= 10;
  const celebrating = state.currentStreak >= 30 || newRecord || holiday === "new-year";
  const filter = themeFilter(options.theme);
  const login = escapeXml(state.login);
  const border = options.hideBorder ? "" : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  const desc = `A pixel city on the water built from ${state.total} contributions, one building per week, in ${season} under a ${moonPhaseName(moonPhase(state.date))}${weather === "clear" ? "" : `, ${weather === "rain" ? "in the rain" : "lost in fog"}`}${celebrating ? ", with fireworks" : ""}. Best week: ${state.bestWeek?.total ?? 0}. Current streak: ${state.currentStreak} days.`;
  const h = H - WATER_Y;
  return pruneSvgStyle(`<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${login}'s ProfileForge city</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}${CSS}</style>
<defs>
  <clipPath id="pf-clip"><rect width="${W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-sky-top)"/>
    <stop offset=".72" style="stop-color:var(--pf-city-sky-bottom)"/>
  </linearGradient>
  <radialGradient id="pf-horizon"><stop offset="0" style="stop-color:var(--pf-celestial);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--pf-celestial);stop-opacity:0"/></radialGradient>
  <linearGradient id="pf-water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-water)"/>
    <stop offset="1" style="stop-color:var(--pf-city-water-deep)"/>
  </linearGradient>
  <linearGradient id="pf-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient>
  <pattern id="pf-ripples" width="40" height="3" patternUnits="userSpaceOnUse"><rect x="4" y="2" width="22" height="1" fill="#000"/><rect x="30" y="1" width="7" height="1" fill="#000"/></pattern>
  <mask id="pf-reflect" maskUnits="userSpaceOnUse" x="0" y="${WATER_Y}" width="${W}" height="${h}">
    <rect x="0" y="${WATER_Y}" width="${W}" height="${h}" fill="url(#pf-fade)"/>
    <g class="pf-ripple"><rect x="0" y="${WATER_Y - 3}" width="${W + 40}" height="${h + 6}" fill="url(#pf-ripples)"/></g>
  </mask>
  <radialGradient id="pf-lamp" cy=".2"><stop offset="0" style="stop-color:var(--pf-window-on);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--pf-window-on);stop-opacity:0"/></radialGradient>
  <linearGradient id="pf-searchlight" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff6d0" stop-opacity=".35"/><stop offset="1" stop-color="#fff6d0" stop-opacity="0"/></linearGradient>
  <linearGradient id="pf-beam-r"><stop offset="0" stop-color="#fff3a0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></linearGradient>
  <linearGradient id="pf-beam-l" x1="1" x2="0"><stop offset="0" stop-color="#fff3a0" stop-opacity=".55"/><stop offset="1" stop-color="#fff3a0" stop-opacity="0"/></linearGradient>
  <linearGradient id="pf-tail" gradientUnits="userSpaceOnUse" x1="560" y1="34" x2="592" y2="20">
    <stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="pf-fog" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d7deea" stop-opacity="0"/><stop offset=".5" stop-color="#d7deea"/><stop offset="1" stop-color="#d7deea" stop-opacity="0"/>
  </linearGradient>
  <filter id="pf-glow" x="-30%" y="-60%" width="160%" height="220%">
    <feGaussianBlur stdDeviation="1.6" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="pf-volume" gradientUnits="userSpaceOnUse" x1="0" y1="70" x2="0" y2="${BASE_Y}"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></linearGradient>
  <linearGradient id="pf-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pf-city-sky-bottom);stop-opacity:0"/><stop offset="1" style="stop-color:var(--pf-city-sky-bottom);stop-opacity:.55"/></linearGradient>
  <pattern id="pf-farwin" width="3" height="4" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="1" height="2" fill="#fff" opacity=".13"/></pattern>
  <pattern id="pf-midwin" width="4" height="5" patternUnits="userSpaceOnUse"><rect x="1" y="1" width="2" height="2" fill="#fff" opacity=".1"/></pattern>
  <mask id="pf-farmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-far"/></mask>
  <mask id="pf-midmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-mid"/></mask>
  <mask id="pf-wallmask" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${BASE_Y}"><use href="#pf-walls"/></mask>
  <filter id="pf-bloom" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.5"/></filter>
</defs>
${filter.defs}
<g clip-path="url(#pf-clip)"><g${filter.attr}>
${sky2(state, rng, weather, options.hemisphere === "south", options.theme === "gameboy")}
${weather === "clear" ? clouds(rng) : overcast(rng)}
${flyers(weather)}
${bats(holiday)}
${celebrating ? fireworks2(rng) : ""}
<g id="pf-city">${farside(rng)}${skyline2(state, season, holiday, weather)}</g>
${weather === "clear" ? fireflies(look, rng) : ""}
${quay(state, season, strollingPet(state.pet))}
${bay(rng, season, weather)}
${weather === "rain" && season !== "winter" ? rain(rng) : fallingParticles(look, rng)}
${weather === "fog" ? fog() : ""}
</g></g>
${border}
<text x="24" y="36" class="pf-title pf-halo">${login}'s city</text>
<text x="24" y="56" class="pf-sub pf-halo">${state.total.toLocaleString("en-US")} contributions in the last year</text>
${chips(state)}
</svg>`);
}

// src/pet/wear.ts
var BEANIE = {
  grid: outlined(["...ww...", "...ww...", "..rrrr..", ".rrrrrr.", ".wwwwww.", "rrrrrrrr", "cccccccc"]),
  palette: { w: "#f8f9fa", r: "#e03131", c: "#c92a2a", o: "#5c1414" },
  sink: 2
};
var UMBRELLA = [
  "......bbbb......",
  "...bbbBbbBbbb...",
  ".bbBbbbbbbbbbBb.",
  "bBbbbbbbbbbbbbBb",
  "bbbbbbbbbbbbbbbb",
  "b..b...b...b...b"
];
var WEAR_CSS = `
.pf-drip{animation:pf-drip 1.2s linear infinite}
@keyframes pf-drip{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(10px);opacity:0}}
.pf-leaf{opacity:0;animation:pf-leaf 14s ease-in-out infinite}
@keyframes pf-leaf{0%{opacity:0;transform:translate(-18px,-46px) rotate(-60deg)}8%{opacity:1}14%{transform:translate(8px,-30px) rotate(30deg)}20%{transform:translate(-6px,-14px) rotate(-30deg)}26%,62%{opacity:1;transform:translate(0,0) rotate(0)}70%{opacity:1;transform:translate(26px,-18px) rotate(80deg)}76%,100%{opacity:0;transform:translate(52px,-34px) rotate(160deg)}}
.pf-dust{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-dust .9s ease-out infinite}
@keyframes pf-dust{0%,68%{opacity:0;transform:translate(0,0) scale(.4)}72%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-3px) scale(1.4)}}
`;
function umbrella(species, scale) {
  const w = species.width * scale;
  const canopyW = UMBRELLA[0].length * scale;
  const cx = Math.min(w - scale, Math.round(w * 0.64));
  const x = cx - canopyW / 2;
  const rimY = (species.crownAnchor.y - 3) * scale;
  const y = rimY - UMBRELLA.length * scale;
  const canopy = renderPixels([{ x: 0, y: 0, grid: UMBRELLA }], { b: "#4c6ef5", B: "#91a7ff" }, { x, y, scale });
  const shaft = `<rect x="${cx - scale / 2}" y="${rimY - scale}" width="${scale}" height="${Math.round(species.height * 0.45 * scale) - rimY}" fill="#5c3d2e"/>`;
  const hook = `<rect x="${cx - scale / 2}" y="${Math.round(species.height * 0.45 * scale)}" width="${2 * scale}" height="${scale}" fill="#5c3d2e"/>`;
  const drips = [0, 0.4, 0.8].map((d, i) => `<rect class="pf-drip" style="animation-delay:-${d}s" x="${x + [0, canopyW - 2, canopyW / 2 + 12][i]}" y="${rimY}" width="2" height="3" fill="#a5d8ff"/>`).join("");
  return `${shaft}${hook}${canopy}${drips}`;
}
function autumnLeaf(species, scale, color) {
  const leaf2 = renderPixels([{ x: 0, y: 0, grid: ["..ll", ".lll", "lll.", "s..."] }], { l: color, s: "#6b4b2a" }, { x: 0, y: 0, scale: 2 });
  const x = species.crownAnchor.x * scale - 4;
  const y = (species.crownAnchor.y - 2) * scale - 6;
  return `<g transform="translate(${x} ${y})"><g class="pf-leaf">${leaf2}</g></g>`;
}
function landingDust(w, h) {
  return [
    [w * 0.2, -5],
    [w * 0.8, 5]
  ].map(([x, dx]) => `<rect class="pf-dust" style="--dx:${dx}px" x="${x - 3}" y="${h - 4}" width="6" height="4" rx="2" fill="#e9dcc3"/>`).join("");
}

// src/pet/backdrop.ts
var BACKDROP_CSS = `.pf-bd-n{opacity:calc(var(--pf-stars) * .72)}`;
var snap = (y) => Math.round(y / 2) * 2;
var band = (area, fill, top, bottom) => stepped(fill, area.x, area.w, top, bottom);
function skyline3(area, top, fill, rim) {
  return band(area, fill, top, () => area.ground + 2) + (rim ? band(area, rim, top, (_, t) => t + 1) : "");
}
var hills = (area, height) => (x) => {
  const h = Math.round(height(x));
  return h > 0 ? area.ground - h : void 0;
};
var treeline = (area, crowns) => (x) => {
  let top;
  const cx0 = area.x + x + 1;
  for (const [cx, cy, r2] of crowns) {
    const dx = Math.abs(cx0 - cx);
    if (dx > r2) continue;
    const t = snap(cy - Math.sqrt(r2 * r2 - dx * dx));
    top = top === void 0 ? t : Math.min(top, t);
  }
  return top;
};
var pines = (area, trees, base) => (x) => {
  let top;
  const cx0 = area.x + x + 1;
  for (const [cx, h] of trees) {
    const t = snap(base - h + Math.abs(cx0 - cx) * 2.4);
    if (t < base) top = top === void 0 ? t : Math.min(top, t);
  }
  return top;
};
function crown(b, fill, cx, cy, r2) {
  for (let dy = -r2; dy <= r2; dy += 2) {
    const half = Math.round(Math.sqrt(Math.max(0, r2 * r2 - dy * dy)) / 2) * 2;
    if (half > 0) b.add(fill, cx - half, cy + dy, half * 2, 2);
  }
}
var jitter = (i, span) => (i * 37 + 11) % 17 / 16 * span;
function row(area, from, step, cy, r2, wobble, seed = 0) {
  const out = [];
  for (let i = 0, x = from; x < area.w + r2; i++, x += step) out.push([area.x + x, cy - Math.round(jitter(i + seed, wobble)), r2]);
  return out;
}
var px4 = (grid, palette, x, y) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale: 2 });
var BARN = [
  "...RRRR...",
  "..RRRRRR..",
  ".RRRRRRRR.",
  "rrrrrrrrrr",
  "rwrrwwrrwr",
  "rrrrwwrrrr",
  "rrrrwwrrrr"
];
var SILO = [".ss.", "ssss", "sSss", "sSss", "sSss", "sSss", "sSss"];
function water2(area, [top, bottom]) {
  return `<defs><linearGradient id="pf-bd-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect x="${area.x}" y="${area.y}" width="${area.w}" height="${area.ground - area.y + 2}" fill="url(#pf-bd-water)"/>`;
}
function snowcap(area, top, depth) {
  return band(area, "#f4f7fb", (x) => depth(x) > 1 ? top(x) : void 0, (x, t) => t + Math.round(depth(x)));
}
var SEASON_WASH = {
  autumn: { fill: "#e0892f", opacity: 0.32 },
  winter: { fill: "#f1f5fa", opacity: 0.62 }
};
function backdrop(terrain, area, night, season) {
  const g = area.ground;
  const L = area.x;
  const W3 = area.w;
  const b = new RectBatch();
  let art = "";
  switch (terrain) {
    case "meadow":
    case "river": {
      art += skyline3(area, hills(area, (x) => 15 + 6 * Math.sin(x / 23) + 3 * Math.sin(x / 9 + 1)), "#c7e0b3", "#dcedc9");
      const near2 = (x) => 7 + 4 * Math.sin(x / 31 + 2) + 2 * Math.sin(x / 11);
      art += skyline3(area, hills(area, near2), "#a4cd8b", "#b9dba2");
      for (const [x, r2] of [[26, 4], [34, 3], [150, 5], [172, 4]]) {
        const cy = g - Math.round(near2(x)) - r2;
        b.add("#7a5a3a", L + x - 1, cy + r2 - 1, 2, 4);
        crown(b, "#74b163", L + x, cy, r2);
      }
      break;
    }
    case "jungle":
      art += skyline3(area, treeline(area, row(area, -6, 14, g - 28, 11, 14)), "#9fcca5");
      art += skyline3(area, treeline(area, row(area, 2, 17, g - 13, 9, 8, 3)), "#6db27a");
      break;
    case "savanna": {
      const peak = 150;
      const kili = (x) => {
        const d = Math.abs(x - peak);
        return d < 14 ? 40 - (d > 10 ? (d - 10) * 2 : 0) : Math.max(0, 32 - (d - 14) * 0.5);
      };
      const top = hills(area, kili);
      art += skyline3(area, top, "#c9bdac", "#dbd1c2");
      art += snowcap(area, top, (x) => {
        const d = Math.abs(x - peak);
        return d < 11 ? 5 + x * 7 % 3 : d < 17 ? 2 + (x % 4 === 0 ? 1 : 0) : 0;
      });
      art += skyline3(area, () => g - 3, "#dcc882");
      for (const [x, w] of [[24, 16], [58, 12], [186, 18]]) {
        b.add("#8f7f55", L + x - 1, g - 12, 2, 10).add("#8f7f55", L + x - w / 2, g - 14, w, 3).add("#8f7f55", L + x - w / 2 + 3, g - 16, w - 6, 2);
      }
      break;
    }
    case "farm":
      art += skyline3(area, hills(area, (x) => 14 + 5 * Math.sin(x / 27 + 0.5)), "#c3dca2", "#d5e8ba");
      art += skyline3(area, hills(area, (x) => 6 + 2 * Math.sin(x / 17)), "#e8d58f", "#f2e3a8");
      art += px4(BARN, { R: "#9b3b33", r: "#c4574c", w: "#f4ede0" }, L + 150, g - 30) + px4(SILO, { s: "#b8c2cc", S: "#9aa6b2" }, L + 172, g - 30);
      break;
    case "pond":
      art += skyline3(area, hills(area, (x) => 8 + 3 * Math.sin(x / 19)), "#c6dfb4");
      art += skyline3(area, treeline(area, row(area, -4, 12, g - 16, 8, 6)), "#a3cd93");
      art += skyline3(area, treeline(area, [40, 52, 120, 134].map((x) => [L + x, g - 6, 6])), "#7eb86c");
      break;
    case "onsen": {
      const peak = 158;
      const top = hills(area, (x) => Math.abs(x - peak) < 6 ? 58 : Math.max(0, 62 - Math.abs(x - peak) * 0.72));
      art += skyline3(area, top, "#aebfd8", "#c3d0e4");
      art += snowcap(area, top, (x) => Math.max(0, 18 - Math.abs(x - peak) * 0.55) + x * 5 % 4);
      art += skyline3(area, treeline(area, row(area, -2, 11, g - 9, 6, 4)), "#93c083");
      break;
    }
    case "forest": {
      art += skyline3(area, treeline(area, row(area, -6, 15, g - 32, 11, 8)), "#b2d2a2");
      const near2 = row(area, 6, 24, g - 24, 11, 6, 5);
      art += skyline3(area, treeline(area, near2), "#7fb56e");
      for (const [cx] of near2) b.add("#6d8f55", cx - 2, g - 12, 4, 14);
      break;
    }
    case "garden":
      art += skyline3(area, hills(area, (x) => 20 + (x % 16 < 8 ? 1 : 0) + Math.round(Math.sin(x / 5) * 1.2)), "#8cc275", "#a4d18c");
      for (let x = 4; x < W3; x += 12) b.add("#f4f1ea", L + x, g - 14, 4, 16).add("#f4f1ea", L + x + 1, g - 16, 2, 2);
      b.add("#f4f1ea", L, g - 11, W3, 2).add("#f4f1ea", L, g - 5, W3, 2);
      break;
    case "pinewood": {
      art += skyline3(area, hills(area, (x) => 26 + 9 * Math.sin(x / 21 + 1) + 4 * Math.sin(x / 7)), "#c5d4de", "#d6e1e9");
      const far = [];
      for (let i = 0, x = -2; x < W3 + 8; i++, x += 9) far.push([L + x, 24 + Math.round(jitter(i, 12))]);
      const near2 = [];
      for (let i = 0, x = 4; x < W3 + 8; i++, x += 14) near2.push([L + x, 16 + Math.round(jitter(i + 4, 8))]);
      art += skyline3(area, pines(area, far, g), "#a4c4b3");
      art += skyline3(area, pines(area, near2, g + 2), "#79a58a");
      break;
    }
    case "treetop":
      art += skyline3(area, treeline(area, row(area, -4, 14, g - 14, 9, 6)), "#bddcaf");
      art += skyline3(area, treeline(area, row(area, 4, 18, g - 5, 8, 4, 2)), "#94c783");
      break;
    case "reef": {
      art += water2(area, ["#9ad7f2", "#3f9fd3"]);
      const rock = (x) => 14 + 6 * Math.sin(x / 17 + 1) + 3 * Math.sin(x / 6);
      art += skyline3(area, hills(area, rock), "#5f9cc2", "#7fb6d4");
      for (const [x, r2, c] of [[20, 6, "#e59ab8"], [60, 5, "#f0b27f"], [150, 7, "#d9a0e6"], [182, 5, "#e59ab8"], [100, 4, "#f0b27f"]]) {
        crown(b, c, L + x, g - Math.round(rock(x)) - r2 + 2, r2);
      }
      break;
    }
    case "deepsea": {
      art += water2(area, ["#3a6fb8", "#123a78"]);
      const pillars = [[0, 22, 70], [24, 14, 44], [150, 18, 56], [176, 24, 84]];
      art += skyline3(area, (x) => {
        for (const [x0, w, h] of pillars) {
          if (x >= x0 && x < x0 + w) return g - Math.round(h - Math.abs(x - x0 - w / 2) * 0.8 - x * 7 % 5);
        }
        return void 0;
      }, "#122c56");
      break;
    }
    case "beach":
      return "";
  }
  const box = `x="${L}" y="${area.y}" width="${W3}" height="${g - area.y + 2}"`;
  const wash = season && terrain !== "reef" && terrain !== "deepsea" ? SEASON_WASH[season] : void 0;
  const shade = `<mask id="pf-bd-m" style="mask-type:alpha" maskUnits="userSpaceOnUse" ${box}><use href="#pf-bd"/></mask>` + (wash ? `<rect mask="url(#pf-bd-m)" ${box} fill="${wash.fill}" opacity="${wash.opacity}"/>` : "") + `<rect class="pf-bd-n" mask="url(#pf-bd-m)" ${box} fill="#0e1838"${night ? ` style="opacity:.72"` : ""}/>`;
  return `<g id="pf-bd">${art}${b}</g>${shade}`;
}

// src/pet/beach.ts
var HORIZON = 26;
var BANDS = [
  [2, "#b9def2"],
  // haze where sea meets sky
  [4, "#2c6aa8"],
  [6, "#3180c2"],
  [6, "#3a95d4"],
  [5, "#4aabde"],
  [3, "#72cbe5"]
  // shallows, reaching the sand
];
var GLINTS = [
  [30, 4, 2, 0],
  [96, 3, 2, 1.1],
  [150, 5, 2, 2.3],
  [178, 3, 1, 0.6],
  [12, 9, 3, 1.7],
  [70, 10, 3, 0.3],
  [128, 8, 3, 2.8],
  [188, 11, 2, 1.4],
  [44, 15, 4, 2.1],
  [110, 16, 3, 0.9],
  [164, 14, 4, 3.2],
  [22, 20, 4, 1.2],
  [84, 21, 5, 2.6],
  [146, 20, 4, 0.1]
];
var SWELLS = [
  [8, 8, 18],
  [62, 7, 26],
  [120, 9, 20],
  [170, 8, 16],
  [26, 14, 24],
  [92, 13, 30],
  [150, 15, 22],
  [4, 19, 20],
  [60, 19, 28],
  [124, 20, 26],
  [180, 19, 14]
];
var LACE = [0, 1, 2, 2, 1, 0, 1, 3, 2, 1, 0, 0, 1, 2, 3, 2, 1, 1, 0, 1, 2, 1, 0, 2];
var lobe = (x, phase) => Math.round(2.4 * Math.sin(x / 14 + phase) + 1.2 * Math.sin(x / 5.5 + phase * 2.3));
var PALM3 = [
  "......lll.........",
  "...llLLLLLll.lll..",
  ".lLLL.lLLLlLLLLLl.",
  "lLL..lLL.cLLl..LLl",
  "L...lL..cCtLL...LL",
  "L..lL....ttlL....L",
  "...L.....Tt.L.....",
  "..L......tt..L....",
  ".........tT.......",
  "........tt........",
  "........Tt........",
  ".......tt.........",
  ".......tT.........",
  "......tt..........",
  "......Tt..........",
  "......tt..........",
  "......tT..........",
  ".....ttt.........."
];
var PALM_COLORS = { L: "#2b7a3d", l: "#48a854", t: "#9a6b3f", T: "#6f4a2a", c: "#6b4226", C: "#8a5a33" };
var STARFISH = ["..s..", ".sSs.", "sSSSs", ".s.s.", "s...s"];
var SHELL3 = ["..p..", ".pPp.", "pPpPp", "ppppp"];
var GULL_UP = ["g.....g", ".w...w.", "..www.."];
var GULL_DOWN = ["..www..", ".w...w.", "g.....g"];
var GULL_COLORS = { w: "#f8f9fa", g: "#6c757d" };
var band2 = (fill, left, w, top, bottom) => stepped(fill, left, w, top, bottom);
var px5 = (grid, palette, x, y, scale = 2) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });
function beachProps(area) {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  const grains = new RectBatch();
  for (const [dx, dy, dark2] of [
    [14, 8, 1],
    [40, 22, 0],
    [58, 12, 1],
    [76, 26, 0],
    [102, 18, 1],
    [124, 28, 1],
    [140, 10, 0],
    [158, 24, 1],
    [184, 14, 0],
    [192, 28, 1],
    [30, 30, 1],
    [88, 8, 0]
  ]) {
    grains.add(dark2 ? "var(--pf-ground-dark)" : "#fff3d6", left + dx, g + dy, 2, dark2 ? 2 : 1);
  }
  return grains.toString() + px5(STARFISH, { s: "#f4845f", S: "#f9a47f" }, left + 18, g + 12) + px5(SHELL3, { p: "#f7c6d9", P: "#e39bb6" }, right - 32, g + 16);
}
function palm(area) {
  return px5(PALM3, PALM_COLORS, area.x - 8, area.ground + 8 - PALM3.length * 3, 3);
}
function beachAmbient(area, night) {
  const g = area.ground;
  const left = area.x;
  const w = area.w;
  const top = g - HORIZON;
  const sea = new RectBatch();
  let y = top;
  for (const [h, color] of BANDS) {
    sea.add(color, left, y, w, h);
    y += h;
  }
  const swells = new RectBatch();
  for (const [dx, dy, sw] of SWELLS) swells.add(dy < 12 ? "#285f99" : "#3486c4", left + dx, top + dy, sw, 1);
  for (const [dx, dy, sw] of SWELLS) swells.add(dy < 12 ? "#4d9bd6" : "#6cc0e8", left + dx + 3, top + dy + 1, sw - 6, 1);
  const glints = GLINTS.map(
    ([dx, dy, gw, d]) => `<rect class="pf-bch-glint" style="animation-delay:-${d}s" x="${left + dx}" y="${top + dy}" width="${gw}" height="1" fill="#f1fbff"/>`
  ).join("");
  const dark2 = `<rect class="pf-bch-dark" x="${left}" y="${top}" width="${w}" height="${HORIZON}" fill="#0b1638"${night ? ` style="opacity:.55"` : ""}/>`;
  const moonPath = night ? [[3, 8, 0], [5, 6, 0.7], [8, 10, 1.3], [11, 7, 0.4], [14, 12, 1.8], [17, 9, 1], [20, 14, 0.2], [23, 10, 1.5]].map(([dy, mw, d]) => `<rect class="pf-bch-glint" style="animation-delay:-${d}s" x="${left + 36 - mw / 2 + dy * 3 % 5 - 2}" y="${top + dy}" width="${mw}" height="1" fill="#fff1b8"/>`).join("") : "";
  const crest = new RectBatch();
  for (let x = 0; x < w; x += 2) if (LACE[(x / 2 + 5) % LACE.length] === 3) crest.add("#e3f6fc", left + x, g - 6, 2, 2);
  const crestLine = band2("#ffffff", left, w, () => g - 4, (x) => g - 3 + (LACE[(x / 2 + 5) % LACE.length] > 1 ? 1 : 0));
  const breaker = `<g class="pf-bch-crest">${crestLine}${crest}</g>`;
  const swash = (reach, delay, phase) => {
    const edge = (x) => g + lobe(x, phase);
    const streaks = new RectBatch();
    for (let i = 0; i < 9; i++) {
      const x = Math.round((i * 23 + phase * 17) % (w - 8));
      streaks.add("#f4fcff", left + x, edge(x) - 5 - i * 5 % 4, 4 + i % 3 * 2, 1);
    }
    const sheet = band2("#a6e0f0", left, w, () => g - 14, edge);
    const foam = band2("#dff4fb", left, w, (x) => edge(x) - 3, (x) => edge(x) - 1) + band2("#ffffff", left, w, (x) => edge(x) - 1, (x) => edge(x) + 1);
    const wet = band2("#5c4a2e", left, w, () => g, (x) => g + Math.max(1, reach + lobe(x, phase)));
    return `<g class="pf-bch-wet" style="animation-delay:-${delay}s">${wet}</g><g clip-path="url(#pf-bch-shore)"><g class="pf-bch-swash" style="--reach:${reach}px;animation-delay:-${delay}s"><g opacity=".55">${sheet}</g>${foam}${streaks}</g></g>`;
  };
  const gull = night ? "" : `<g class="pf-bch-gull-sky" transform="translate(0 ${area.y + 34})"><g class="pf-bch-gull"><g class="pf-fa" style="animation-duration:.9s">${px5(GULL_UP, GULL_COLORS, 0, 0)}</g><g class="pf-fb" style="animation-duration:.9s">${px5(GULL_DOWN, GULL_COLORS, 0, 0)}</g></g></g>`;
  const surf = `<g class="pf-bch-surf">${swash(9, 0, 0)}${swash(5, 3.6, 2.4)}${breaker}</g>`;
  const svg = `<clipPath id="pf-bch-shore"><rect x="${left}" y="${g - 2}" width="${w}" height="${HORIZON}"/></clipPath>` + sea + swells + `<g class="pf-bch-drift">${glints}</g>` + dark2 + moonPath + surf + palm(area) + gull;
  const css = `.pf-bch-dark{opacity:calc(var(--pf-stars) * .55)}
.pf-bch-surf{opacity:calc(1 - var(--pf-stars) * .3)}
.pf-bch-gull-sky{opacity:calc(1 - var(--pf-stars))}
.pf-bch-glint{opacity:0;animation:pf-bch-glint 3s steps(1) infinite}
@keyframes pf-bch-glint{0%,100%{opacity:0}20%{opacity:.95}45%{opacity:.4}70%{opacity:0}}
.pf-bch-drift{animation:pf-bch-drift 9s ease-in-out infinite}
@keyframes pf-bch-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
.pf-bch-swash{animation:pf-bch-swash 7.2s infinite}
@keyframes pf-bch-swash{0%{transform:translateY(0);opacity:1;animation-timing-function:cubic-bezier(.2,.7,.3,1)}38%{transform:translateY(var(--reach));opacity:1;animation-timing-function:ease-in-out}55%{transform:translateY(var(--reach));opacity:.9;animation-timing-function:ease-in}92%{transform:translateY(1px);opacity:0}100%{transform:translateY(0);opacity:0}}
.pf-bch-wet{opacity:0;animation:pf-bch-wet 7.2s infinite}
@keyframes pf-bch-wet{0%{opacity:0}35%{opacity:.28}60%{opacity:.26}100%{opacity:0}}
.pf-bch-crest{animation:pf-bch-crest 3.6s ease-in infinite}
@keyframes pf-bch-crest{0%{transform:translateY(-3px);opacity:0}45%{opacity:1}85%{transform:translateY(1px);opacity:1}100%{transform:translateY(2px);opacity:0}}
.pf-bch-gull{animation:pf-bch-gull 28s linear infinite}
@keyframes pf-bch-gull{0%{transform:translate(${left - 20}px,6px)}50%{transform:translate(${left + w / 2}px,0)}100%{transform:translate(${left + w + 20}px,10px)}}`;
  return { svg, css };
}

// src/pet/homes.ts
var px6 = (grid, palette, x, y, scale) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });
var BAMBOO = ["g.", "gl", "gg", "Gg", "gg", "gl", "gg", "Gg", "gg", "gl", "gg", "Gg"];
var BAMBOO_LEAF = ["..ll", "lll.", "l..."];
var YUZU = outlined([".l.", "yyy", "yYy", ".y."]);
var LOG = outlined(["bbbbbbbbbbbrr", "bBbbbbBbbbbRr", "bbbbbbbbbbbrr"]);
var MUSHROOM = outlined(["..rrrr..", ".rwrrwr.", "rrrrrwrr", "rwrrrrrr", "..ssss..", "..ssss..", "..ssss.."]);
var MUSHROOM_SMALL = outlined([".rr.", "rwrr", ".ss.", ".ss."]);
var CORAL2 = [
  "c...c...",
  "c.c.c.c.",
  "ccc.ccc.",
  ".c...c..",
  ".cc.cc..",
  "..ccc...",
  "...c....",
  "...c...."
];
var CLAM = outlined([".pppp.", "pPpPpp", "pppppp"]);
var BIG_LEAF = outlined(["...gg..", "..gGgg.", ".ggGggg", "ggGgggg", "gGggggg", ".gggg..", "..s....", "..s...."]);
var TULIP = ["r.r.r", "rrrrr", ".rrr.", "..g..", ".gg..", "..g..", "..gg.", "..g.."];
var PINE = outlined(["...g...", "..ggg..", ".gGggg.", "..ggg..", ".ggggg.", "gggGggg", "..ggg..", ".ggggg.", "ggggggg", "...b...", "...b..."]);
var STUMP = outlined(["wwwww", "bbbbb", "bBbbb", "bbbbb"]);
var BIRDHOUSE = outlined(["..rr..", ".rrrr.", "rrrrrr", "wwwwww", "wwkkww", "wwkkww", "wwwwww", "..bb..", "..bb..", "..bb..", "..bb..", "..bb.."]);
var TREE2 = outlined([
  "....gggggg....",
  "..ggGGggggg...",
  ".gGGggggGggg..",
  "gggggggggGggg.",
  "ggGggggggggggg",
  "gggggGgggGgggg",
  ".gggggggggggg.",
  "..gggggbgggg..",
  "....g.bb.g....",
  "......bb......",
  "......bbb.....",
  "......bb......",
  "......bb......",
  ".....bbbb....."
]);
function homeProps(home, area) {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  const b = new RectBatch();
  let art = "";
  switch (home) {
    case "onsen": {
      art += px6(BAMBOO, { g: "#5aa35a", G: "#2f7a3a", l: "#8fd18f" }, left + 6, g - 36, 3);
      art += px6(BAMBOO, { g: "#5aa35a", G: "#2f7a3a", l: "#8fd18f" }, left + 16, g - 28, 3);
      art += px6(BAMBOO_LEAF, { l: "#6fbf6a" }, left + 12, g - 40, 3);
      const px0 = right - 62;
      b.add("#8a9099", px0, g + 3, 56, 18).add("#8a9099", px0 + 4, g + 1, 48, 22);
      b.add("#7fd3d8", px0 + 5, g + 5, 46, 14).add("#b6ecee", px0 + 10, g + 7, 16, 2).add("#b6ecee", px0 + 30, g + 12, 12, 2);
      for (const [dx, dy] of [[0, 4], [10, 0], [22, 1], [34, 0], [46, 3], [52, 12], [44, 20], [28, 21], [12, 20], [2, 14]]) {
        b.add("#b0b6bf", px0 + dx, g + dy, 6, 4).add("#6b717a", px0 + dx, g + dy + 3, 6, 1);
      }
      break;
    }
    case "forest": {
      art += px6(LOG, { b: "#8a5a33", B: "#6b4226", r: "#d9a066", R: "#b07d4a", o: "#3b2616" }, left + 2, g - 9, 3);
      art += px6(MUSHROOM, { r: "#e03131", w: "#ffffff", s: "#f1e3c6", o: "#4a1a0c" }, right - 30, g - 24, 3);
      art += px6(MUSHROOM_SMALL, { r: "#e03131", w: "#ffffff", s: "#f1e3c6", o: "#4a1a0c" }, right - 44, g - 14, 2);
      for (const [x, y, c] of [[left + 50, g + 12, "#d9822b"], [left + 90, g + 20, "#b5651d"], [right - 70, g + 14, "#e8a45a"], [left + 30, g + 22, "#b5651d"]]) {
        b.add(c, x, y, 4, 2).add(c, x + 1, y - 1, 2, 1);
      }
      break;
    }
    case "reef": {
      art += `<rect class="pf-amb-water" x="${left}" y="${area.y}" width="${area.w}" height="${g - area.y}" fill="#1c7fc4"/>`;
      art += `<g class="pf-amb-rays" fill="#ffffff">${[20, 70, 130].map((x) => `<path d="M${left + x} ${area.y}h14l-40 ${g - area.y}h-14z"/>`).join("")}</g>`;
      art += px6(CORAL2, { c: "#ff7f9e" }, left + 4, g - 24, 3);
      art += px6(CORAL2, { c: "#ffb35c" }, left + 22, g - 16, 2);
      art += px6(CLAM, { p: "#f7c6d9", P: "#e39bb6", o: "#8a4a64" }, right - 44, g + 8, 2);
      break;
    }
    case "garden": {
      art += px6(BIG_LEAF, { g: "#5cb85c", G: "#8fd18f", s: "#3f8f4f", o: "#2c6b3a" }, left + 2, g - 36, 4);
      art += px6(TULIP, { r: "#ff6b6b", g: "#3f8f4f" }, right - 36, g - 22, 3);
      art += px6(TULIP, { r: "#ffd43b", g: "#3f8f4f" }, right - 20, g - 18, 3);
      b.add("#9fd0ec", left + 60, g + 12, 30, 5).add("#9fd0ec", left + 64, g + 11, 22, 1).add("#d0ebff", left + 66, g + 13, 8, 1);
      break;
    }
    case "pinewood": {
      const pine = { g: "#2f6b3a", G: "#4f9a55", b: "#6b4226", o: "#173a20" };
      art += px6(PINE, pine, left - 4, g - 36, 3) + px6(PINE, pine, left + 18, g - 26, 2) + px6(PINE, pine, right - 26, g - 36, 3);
      art += px6(STUMP, { w: "#e9c89a", b: "#8a5a33", B: "#6b4226", o: "#3b2616" }, right - 52, g - 10, 2);
      break;
    }
    case "deepsea": {
      art += `<rect class="pf-amb-deep" x="${left}" y="${area.y}" width="${area.w}" height="${g - area.y}" fill="#0a3a82"/>`;
      for (const [x, y] of [[20, 30], [60, 18], [150, 40], [180, 22], [110, 60], [36, 76], [170, 84], [90, 34]]) {
        art += `<rect class="pf-twinkle" style="animation-delay:-${x % 7 / 3}s" x="${left + x}" y="${area.y + y}" width="2" height="2" fill="#8ff0ff"/>`;
      }
      b.add("#3b4a5c", left + 6, g - 8, 22, 10).add("#4f6275", left + 10, g - 12, 12, 4).add("#3b4a5c", right - 30, g - 6, 18, 8);
      break;
    }
    case "river": {
      b.add("#4ea8de", left, g + 8, area.w, 14).add("#7cc4f2", left, g + 8, area.w, 2);
      for (const [x, y] of [[8, 5], [34, 4], [150, 5], [184, 3]]) b.add("#8a9099", left + x, g + y, 10, 5).add("#b0b6bf", left + x + 2, g + y, 5, 2);
      for (const x of [right - 14, right - 10, right - 6]) b.add("#3f8f4f", x, g - 18, 2, 22).add("#8a5a33", x, g - 22, 2, 5);
      break;
    }
    case "treetop": {
      art += px6(TREE2, { g: "#4f9a55", G: "#7fc27a", b: "#7a4a24", o: "#24502b" }, left - 14, g - 46, 3);
      art += px6(BIRDHOUSE, { r: "#c92a2a", w: "#e9c89a", k: "#3b2616", b: "#8a5a33", o: "#3b2616" }, right - 28, g - 42, 3);
      break;
    }
  }
  return `${b}${art}`;
}
var LADYBUG = outlined(["rkr", "rrr"]);
var FISH = outlined(["y..yy.", "yyyyky", "y..yy."]);
var MOUSE = outlined(["m.m.", "mmmm", "mkmm", "mmmn"]);
var FEATHER = [".f", "ff", "f.", "f."];
function homeAmbient(home, area) {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (home) {
    case "onsen": {
      const steam = [0, 1.2, 2.4].map((d, i) => `<g class="pf-amb-steam" style="animation-delay:-${d}s">${px6(["x.", ".x", "x.", ".x", "x."], { x: "#d6e2ee" }, right - 50 + i * 16, g - 8, 3)}</g>`).join("");
      const yuzu = `<g class="pf-amb-bob2">${px6(YUZU, { y: "#fcc419", Y: "#ffe066", l: "#51cf66", o: "#8a6a00" }, right - 30, g + 6, 2)}</g>`;
      return {
        svg: steam + yuzu,
        css: `.pf-amb-steam{opacity:0;animation:pf-amb-steam 3.6s ease-out infinite}@keyframes pf-amb-steam{0%{transform:translate(0,0);opacity:0}25%{opacity:.7}100%{transform:translate(4px,-30px);opacity:0}}
.pf-amb-bob2{animation:pf-amb-bob2 2.4s ease-in-out infinite}@keyframes pf-amb-bob2{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px) rotate(8deg)}}`
      };
    }
    case "forest":
      return {
        svg: `<g class="pf-amb-crawl">${px6(LADYBUG, { r: "#e03131", k: "#1a1a1a", o: "#1a1a1a" }, left + 6, g - 13, 2)}</g>`,
        css: `.pf-amb-crawl{animation:pf-amb-crawl 12s ease-in-out infinite alternate}@keyframes pf-amb-crawl{0%,10%{transform:translateX(0)}90%,100%{transform:translateX(26px)}}`
      };
    case "reef": {
      const bubbles = [0, 1.1, 2.3, 3.2].map((d, i) => `<rect class="pf-amb-rise" style="animation-delay:-${d}s" x="${[left + 30, right - 30, left + 60, right - 60][i]}" y="${g}" width="3" height="3" rx="1.5" fill="none" stroke="#d0ebff" stroke-width="1"/>`).join("");
      const fish = `<g class="pf-amb-swim">${px6(FISH, { y: "#ffd43b", k: "#1a1a1a", o: "#8a6a00" }, 0, area.y + 38, 2)}</g>`;
      const weed = [0, 0.8].map((d, i) => `<g class="pf-amb-sway" style="animation-delay:-${d}s">${px6(["g", "gg", ".g", "gg", "g.", "gg", ".g", "g", "g"], { g: "#2f9e44" }, right - 22 + i * 8, g - 26 + i * 6, 3)}</g>`).join("");
      return {
        svg: weed + bubbles + fish,
        css: `.pf-amb-water{opacity:calc(.28 + var(--pf-stars) * .12)}.pf-amb-rays{opacity:calc(.1 - var(--pf-stars) * .08)}
.pf-amb-rise{animation:pf-amb-rise 4.4s linear infinite}@keyframes pf-amb-rise{0%{transform:translate(0,0);opacity:0}10%{opacity:1}100%{transform:translate(4px,-110px);opacity:0}}
.pf-amb-swim{animation:pf-amb-swim 14s linear infinite}@keyframes pf-amb-swim{0%{transform:translate(${left - 20}px,0)}50%{transform:translate(${left + area.w / 2}px,-6px)}100%{transform:translate(${right + 10}px,2px)}}
.pf-amb-sway{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-sway 3s ease-in-out infinite alternate}@keyframes pf-amb-sway{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}`
      };
    }
    case "garden":
      return {
        svg: `<rect class="pf-amb-drip" x="${left + 10}" y="${g - 18}" width="3" height="4" rx="1.5" fill="#7cc4f2"/>`,
        css: `.pf-amb-drip{animation:pf-amb-drip 3.2s ease-in infinite}@keyframes pf-amb-drip{0%,55%{transform:translateY(0);opacity:1}80%{transform:translateY(18px);opacity:1}81%,100%{transform:translateY(18px);opacity:0}}`
      };
    case "pinewood": {
      const hx = right - 70;
      return {
        svg: `<clipPath id="pf-amb-burrow"><rect x="${hx - 2}" y="${g}" width="16" height="12"/></clipPath><rect x="${hx}" y="${g + 10}" width="12" height="3" rx="1" fill="#3b2616"/><g clip-path="url(#pf-amb-burrow)"><g class="pf-amb-peek">${px6(MOUSE, { m: "#b8a898", k: "#1a1a1a", n: "#ff8fa3", o: "#5b4636" }, hx + 1, g + 10, 2)}</g></g>`,
        css: `.pf-amb-peek{animation:pf-amb-peek 8s ease-in-out infinite}@keyframes pf-amb-peek{0%,50%,100%{transform:none}58%,78%{transform:translateY(-9px)}}`
      };
    }
    case "deepsea": {
      const jelly = outlined([".jjj.", "jJjjj", "jjjjj", "j.j.j", "j.j.j"]);
      return {
        svg: `<g class="pf-amb-jelly">${px6(jelly, { j: "#f3a6ff", J: "#ffffff", o: "#9b4fb3" }, right - 46, area.y + 40, 2)}</g>`,
        css: `.pf-amb-deep{opacity:calc(.62 + var(--pf-stars) * .13)}
.pf-amb-jelly{animation:pf-amb-jelly 5s ease-in-out infinite}@keyframes pf-amb-jelly{0%,100%{transform:translate(0,0) scale(1,1)}25%{transform:translate(-4px,-10px) scale(1.1,.85)}50%{transform:translate(-6px,-18px) scale(.95,1.08)}75%{transform:translate(-2px,-8px)}}`
      };
    }
    case "river": {
      const ripples = [0, 1, 2].map((i) => `<rect class="pf-amb-flow" style="animation-delay:-${i * 1.7}s" x="${left}" y="${g + 13 + i % 2 * 4}" width="10" height="1" fill="#d0ebff"/>`).join("");
      const leaf2 = `<g class="pf-amb-flow" style="animation-duration:9s;animation-delay:-3s">${px6(["..gg", ".ggg", "ggg.", "g..."], { g: "#51cf66" }, left, g + 9, 2)}</g>`;
      return {
        svg: ripples + leaf2,
        css: `.pf-amb-flow{animation:pf-amb-flow 5s linear infinite}@keyframes pf-amb-flow{from{transform:translateX(-12px)}to{transform:translateX(${area.w}px)}}`
      };
    }
    case "treetop":
      return {
        svg: `<g class="pf-amb-feather">${px6(FEATHER, { f: "#ffffff" }, left + 24, area.y + 30, 2)}</g>`,
        css: `.pf-amb-feather{animation:pf-amb-feather 9s ease-in-out infinite}@keyframes pf-amb-feather{0%{transform:translate(0,0);opacity:0}10%{opacity:1}30%{transform:translate(12px,26px)}55%{transform:translate(-2px,54px)}80%{transform:translate(10px,82px);opacity:1}95%,100%{transform:translate(4px,96px);opacity:0}}`
      };
  }
}

// src/pet/scenery.ts
var TERRAIN = {
  crab: "beach",
  gopher: "meadow",
  snake: "jungle",
  elephant: "savanna",
  chick: "farm",
  turtle: "pond",
  capybara: "onsen",
  hedgehog: "forest",
  octopus: "reef",
  snail: "garden",
  fox: "pinewood",
  swift: "treetop",
  squid: "deepsea",
  otter: "river"
};
var terrainFor = (species) => Object.hasOwn(TERRAIN, species) ? TERRAIN[species] : "beach";
var TINT = {
  beach: "#e9cf98",
  meadow: "#79b865",
  jungle: "#4f9a55",
  savanna: "#cfb25e",
  farm: "#86b862",
  pond: "#79b865",
  onsen: "#8cbf73",
  forest: "#6fa55a",
  reef: null,
  garden: "#7cc36a",
  pinewood: "#6f9e5c",
  treetop: "#7fb366",
  deepsea: null,
  river: "#7fb366"
};
var SCENERY_CSS = `.pf-tint{opacity:calc(.75 - var(--pf-stars) * .4)}`;
var GREEN = "#3f8f4f";
var DARK_GREEN = "#2c6b3a";
var WOOD = "#8a5a33";
var DRY = "#b8953f";
var BLADES = [1, 3, 2, 0, 1, 4, 2, 1, 0, 2, 3, 1, 0, 1, 2, 5, 1, 0, 2, 1, 3, 0, 1, 2];
function groundCover(species, area, bottom, snowy) {
  const terrain = terrainFor(species);
  const tint = TINT[terrain];
  const g = area.ground;
  const h = bottom - g;
  const blades = tint && terrain !== "beach";
  const top = blades ? (x) => g - 2 - BLADES[x / 2 % BLADES.length] : (x) => x % 16 < 8 ? g - 3 : void 0;
  let out = stepped("var(--pf-ground)", area.x, area.w, top, () => g + 1);
  if (tint) out += `<g class="pf-tint"><rect x="${area.x}" y="${g}" width="${area.w}" height="${h}" fill="${tint}"/>${blades ? stepped(tint, area.x, area.w, top, () => g) : ""}</g>`;
  if (snowy) out += `<g opacity=".85"><rect x="${area.x}" y="${g - 2}" width="${area.w}" height="${h + 2}" fill="${SNOW}"/></g>`;
  return out;
}
function props(species, area) {
  const b = new RectBatch();
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (terrainFor(species)) {
    case "beach":
      return beachProps(area);
    case "meadow":
      b.add("#7a5230", right - 42, g - 6, 30, 6).add("#7a5230", right - 38, g - 10, 22, 4).add("#3a2616", right - 32, g - 6, 10, 6);
      for (const x of [left + 10, left + 34, right - 56, right - 10]) tuft(b, x, g, GREEN);
      break;
    case "jungle":
      fern(b, left + 16, g);
      fern(b, right - 16, g);
      for (let y = area.y; y < area.y + 46; y += 6) b.add(DARK_GREEN, left + 40 + y / 6 % 2, y, 2, 6);
      b.add(GREEN, left + 37, area.y + 20, 4, 3).add(GREEN, left + 42, area.y + 34, 4, 3);
      break;
    case "savanna":
      b.add(WOOD, right - 30, g - 40, 4, 40).add(WOOD, right - 36, g - 44, 4, 8).add(WOOD, right - 24, g - 46, 4, 8);
      b.add(DARK_GREEN, right - 52, g - 52, 50, 6).add(DARK_GREEN, right - 46, g - 56, 38, 4);
      for (const x of [left + 12, left + 36, right - 64]) tuft(b, x, g, DRY);
      break;
    case "farm":
      for (let x = left + 6; x < right; x += 24) b.add(WOOD, x, g - 18, 4, 18);
      b.add(WOOD, left, g - 14, area.w, 2).add(WOOD, left, g - 7, area.w, 2);
      for (const [x, y] of [[left + 26, g + 10], [left + 44, g + 18], [right - 40, g + 12], [right - 22, g + 20], [left + 70, g + 22]]) {
        b.add("#e9c46a", x, y, 2, 2);
      }
      break;
    case "pond":
      b.add("#5fa8d3", right - 70, g + 6, 56, 14).add("#5fa8d3", right - 64, g + 4, 44, 2).add("#5fa8d3", right - 64, g + 20, 44, 2);
      b.add("#9fd0ec", right - 58, g + 9, 12, 2);
      b.add("#3f8f4f", right - 36, g + 10, 10, 5).add("#ff8fa3", right - 33, g + 9, 3, 2);
      for (const x of [right - 12, right - 8]) b.add(DARK_GREEN, x, g - 16, 2, 22).add(WOOD, x, g - 20, 2, 5);
      break;
    default:
      return homeProps(terrainFor(species), area);
  }
  return b.toString();
}
function tuft(b, x, ground2, color) {
  b.add(color, x, ground2 - 5, 2, 5).add(color, x - 3, ground2 - 3, 2, 3).add(color, x + 3, ground2 - 4, 2, 4);
}
function fern(b, x, ground2) {
  const fronds = [
    [-4, -2, 5],
    [-2, -4, 6],
    [0, -5, 6],
    [2, -4, 6],
    [4, -2, 5]
  ];
  for (const [dx, dy, steps] of fronds) {
    for (let j = 1; j <= steps; j++) {
      b.add(j % 2 ? GREEN : DARK_GREEN, x + dx * j - 2, ground2 + dy * j, 4, 3);
    }
  }
  b.add(DARK_GREEN, x - 1, ground2 - 4, 3, 4);
}
var px7 = (grid, palette, x, y, scale) => renderPixels([{ x: 0, y: 0, grid }], palette, { x, y, scale });
var BEE = [".ww.", "ykyk", ".yk."];
var PARROT = [".rr.", "rrwk", "rrry", ".gr.", ".gg.", ".bb."];
var BIRD = [".kk.", "kkkw", "kkk.", ".y.."];
var WORM = [".p", "pp", "p.", "pp", ".p"];
var FISH2 = ["..oo..", "oooooo", ".oo.oo"];
function ambient(species, area, night = false) {
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (terrainFor(species)) {
    case "beach":
      return beachAmbient(area, night);
    case "meadow": {
      const bee = `<g class="pf-amb-bee"><g class="pf-fa" style="animation-duration:.2s">${px7(BEE, { w: "#e7f5ff", y: "#ffd43b", k: "#343a40" }, 0, 0, 2)}</g><g class="pf-fb" style="animation-duration:.2s">${px7(BEE.slice(1), { w: "#e7f5ff", y: "#ffd43b", k: "#343a40" }, 0, 2, 2)}</g></g>`;
      return {
        svg: `<g transform="translate(${right - 40} ${g - 26})">${bee}</g>`,
        css: `.pf-amb-bee{animation:pf-amb-bee 7s ease-in-out infinite}@keyframes pf-amb-bee{0%,100%{transform:translate(0,0)}20%{transform:translate(-14px,-8px)}40%{transform:translate(-4px,-16px)}60%{transform:translate(12px,-6px)}80%{transform:translate(4px,4px)}}`
      };
    }
    case "jungle":
      return {
        svg: `<g transform="translate(${right - 22} ${g - 40})"><g class="pf-amb-bob">${px7(PARROT, { r: "#e03131", w: "#ffffff", k: "#1f2328", y: "#ffd43b", g: "#2f9e44", b: "#1c7ed6" }, 0, 0, 3)}</g></g>`,
        css: `.pf-amb-bob{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-bob 5s steps(1) infinite}@keyframes pf-amb-bob{0%,60%{transform:none}64%{transform:rotate(-12deg)}72%{transform:none}76%{transform:rotate(-12deg)}84%,100%{transform:none}}`
      };
    case "savanna":
      return {
        svg: `<g transform="translate(${right - 44} ${g - 64})"><g class="pf-amb-hop">${px7(BIRD, { k: "#5c3d2e", w: "#ffffff", y: "#f59f00" }, 0, 0, 2)}</g></g>`,
        css: `.pf-amb-hop{animation:pf-amb-hop 6s ease-in-out infinite}@keyframes pf-amb-hop{0%,30%{transform:none}35%{transform:translate(6px,-4px)}40%,65%{transform:translate(12px,0)}70%{transform:translate(6px,-4px)}75%,100%{transform:none}}`
      };
    case "farm":
      return {
        svg: `<clipPath id="pf-amb-soil"><rect x="${left + 50}" y="${g}" width="12" height="16"/></clipPath><rect x="${left + 52}" y="${g + 14}" width="8" height="2" fill="#6b4226"/><g clip-path="url(#pf-amb-soil)"><g class="pf-amb-worm">${px7(WORM, { p: "#f783ac" }, left + 54, g + 14, 2)}</g></g>`,
        css: `.pf-amb-worm{transform-box:fill-box;transform-origin:50% 100%;animation:pf-amb-worm 9s ease-in-out infinite}@keyframes pf-amb-worm{0%,55%,100%{transform:none}62%,80%{transform:translateY(-10px)}70%{transform:translateY(-10px) rotate(8deg)}}`
      };
    case "pond": {
      const cx = right - 50;
      const cy = g + 13;
      const ripple = (d) => `<ellipse class="pf-amb-ripple" style="animation-delay:-${d}s" cx="${cx}" cy="${cy}" rx="8" ry="2.5" fill="none" stroke="#d0ebff" stroke-width="1"/>`;
      return {
        svg: `${ripple(0)}${ripple(1.5)}<g class="pf-amb-fish">${px7(FISH2, { o: "#ff922b" }, cx - 6, cy - 2, 2)}</g>`,
        css: `.pf-amb-ripple{transform-box:fill-box;transform-origin:center;animation:pf-amb-ripple 3s ease-out infinite}@keyframes pf-amb-ripple{0%{transform:scale(.3);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.pf-amb-fish{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-amb-fish 8s ease-in-out infinite}@keyframes pf-amb-fish{0%,70%{opacity:0;transform:translate(-8px,4px) rotate(-40deg)}72%{opacity:1}80%{transform:translate(0,-14px) rotate(0)}88%{opacity:1;transform:translate(8px,2px) rotate(40deg)}90%,100%{opacity:0;transform:translate(8px,4px) rotate(40deg)}}`
      };
    }
    default:
      return homeAmbient(terrainFor(species), area);
  }
}

// src/pet/care-fx.ts
var CARE_CSS = `
.pf-stink{opacity:0;animation:pf-stink 2.8s ease-out infinite}
@keyframes pf-stink{0%{transform:translateY(0);opacity:0}20%{opacity:.8}100%{transform:translateY(-22px);opacity:0}}
.pf-orbit{animation:pf-orbit 2.2s linear infinite}
@keyframes pf-orbit{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.pf-buzz{animation:pf-buzz-fly .15s steps(1) infinite}
@keyframes pf-buzz-fly{0%{opacity:1}50%{opacity:.4}100%{opacity:.4}}
`;
function careOverlay(care, w, h, scale) {
  if (!care) return "";
  const out = [];
  if (care.dirt > 0) {
    const rng = seeded("smudges");
    const spots = new RectBatch();
    for (let i = 0; i < [0, 3, 5, 7][care.dirt]; i++) {
      const x = Math.round(w * (0.25 + rng() * 0.5));
      const y = Math.round(h * (0.35 + rng() * 0.5));
      spots.add("#6b4b2a", x, y, 2 * scale, Math.max(2, scale));
    }
    out.push(`<g opacity=".7">${spots}</g>`);
  }
  if (care.dirt >= 2) {
    for (const [i, dx] of [w * 0.25, w * 0.5, w * 0.75].entries()) {
      const x = Math.round(dx);
      out.push(
        `<path class="pf-stink" style="animation-delay:-${(i * 0.9).toFixed(1)}s" d="M${x} -2q3 -3 0 -6t0 -6" fill="none" stroke="#7aa35a" stroke-width="2"/>`
      );
    }
  }
  if (care.dirt >= 3) {
    const cx = w / 2;
    const cy = h * 0.2;
    for (const [i, r2] of [w * 0.45, w * 0.6, w * 0.38].entries()) {
      out.push(
        // Rotating around the group's own origin, which sits on the head.
        `<g transform="translate(${cx} ${cy})"><g class="pf-orbit" style="animation-delay:-${(i * 0.7).toFixed(1)}s;animation-duration:${(1.8 + i * 0.5).toFixed(1)}s"><g class="pf-buzz"><rect x="${Math.round(r2)}" y="0" width="3" height="2" fill="#1a1a1a"/><rect x="${Math.round(r2)}" y="-2" width="2" height="2" fill="#ffffff" opacity=".8"/></g></g></g>`
      );
    }
  }
  return out.join("");
}
function visitorLine(care) {
  return care?.visitor ? lineFor(care.visitor) : null;
}
function lineFor(v) {
  return { feed: `Fed by ${v.login} \u2665`, bath: `Bathed by ${v.login} \u2727`, play: `Played with ${v.login} \u266A` }[v.action];
}

// src/pet/visits.ts
function activeVisits(state) {
  if (state.ranAway || state.stage === "egg") return [];
  const all = state.care?.visitors ?? (state.care?.visitor ? [state.care.visitor] : []);
  return state.mood === "sleeping" ? all.filter((v) => v.action === "bath") : all;
}
var activeVisit = (state) => activeVisits(state).at(-1)?.action ?? null;
var TURN = 6;
function turnCss(n) {
  return Array.from({ length: n }, (_, k) => {
    const a = +(k / n * 100).toFixed(3);
    const b = +((k + 1) / n * 100).toFixed(3);
    const frames2 = k === 0 ? `0%{opacity:1}${b}%{opacity:0}100%{opacity:0}` : `0%{opacity:0}${a}%{opacity:1}${b}%{opacity:0}100%{opacity:0}`;
    return `.pf-turn${k}{animation:pf-turn${k} ${n * TURN}s steps(1) infinite}@keyframes pf-turn${k}{${frames2}}`;
  }).join("\n");
}
var VISIT_CSS = `
.pf-scrub{transform-box:fill-box;transform-origin:50% 100%;animation:pf-scrub 1.6s ease-in-out infinite}
@keyframes pf-scrub{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-1px)}}
.pf-suds{animation:pf-suds 1.6s ease-in-out infinite}
@keyframes pf-suds{0%,100%{transform:translate(0,0)}50%{transform:translate(1px,-2px)}}
.pf-duck{animation:pf-duck 2.2s ease-in-out infinite}
@keyframes pf-duck{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2px) rotate(-6deg)}}
.pf-drop{opacity:0;animation:pf-drop .7s linear infinite}
@keyframes pf-drop{0%{transform:translateY(0);opacity:0}10%{opacity:.9}90%{opacity:.9}100%{transform:translateY(var(--fall));opacity:0}}
.pf-bubble{opacity:0;animation:pf-bubble 3s ease-out infinite}
@keyframes pf-bubble{0%{transform:translate(0,0);opacity:0}10%{opacity:1}80%{opacity:1;transform:translate(var(--dx),-34px)}82%,100%{opacity:0;transform:translate(var(--dx),-36px)}}
.pf-steam{opacity:0;animation:pf-steam 4s ease-out infinite}
@keyframes pf-steam{0%{transform:translate(0,0);opacity:0}25%{opacity:.55}100%{transform:translate(4px,-26px);opacity:0}}
.pf-run{animation:pf-run .3s ease-in-out infinite}
@keyframes pf-run{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.pf-catch{opacity:0;transform-box:fill-box;transform-origin:0 100%;animation:pf-catch 6s steps(1) infinite}
.pf-dust{opacity:0;transform-box:fill-box;transform-origin:center;animation:pf-dust 6s ease-out infinite}
`;
var BOWL = outlined([
  "hhhhhhhhhhhhhh",
  "rrrrrrrrrrrrrr",
  ".rrrrrwrwrrrr.",
  ".rrrrrwwwrrrr.",
  "..rrrrrrrrrr..",
  "...dddddddd..."
]);
var BOWL_COLORS = { h: "#ff8787", r: "#e03131", w: "#ffe3e3", d: "#a61e1e", o: "#5c1010" };
var HEAPS = [
  ["....kkKk....", "..kkKkkkKk..", ".kKkkkkKkkk.", "kkkKkkkkkKkk"],
  ["............", "............", "...kKkkKk...", ".kkkkKkkkkk."],
  ["............", "............", "............", "...kk..Kk..."]
];
var KIBBLE = { k: "#b5651d", K: "#e8a45a" };
var BAG = outlined(["..bbbbbb..", ".bbbbbbbb.", "bbbbbbbbbb", "bwwwwwwwwb", "bwwwwwwwwb", "bwwwwwwwwb", "bwwwwwwwwb", "bbbbbbbbbb", "bbbbbbbbbb", ".bbbbbbbb."]);
var BAG_COLORS = { b: "#4c6ef5", w: "#ffffff", o: "#1b2f7a" };
var TREATS = {
  crab: { grid: [".xx.x", "xxxxx", ".xx.x"], colors: { x: "#4dabf7" } },
  gopher: { grid: ["..gg", ".oo.", "oo..", "o..."], colors: { g: "#2f9e44", o: "#f76707" } },
  snake: { grid: [".w.", "www", "www", ".w."], colors: { w: "#f1e3c6" } },
  elephant: { grid: [".p.", "ppp", ".p.", "ppp", ".p."], colors: { p: "#c68b59" } },
  chick: { grid: [".y.", "yyy", "yyy", "yyy", ".g."], colors: { y: "#fcc419", g: "#2f9e44" } },
  turtle: { grid: ["..gg", ".ggg", "ggg.", "g..."], colors: { g: "#51cf66" } },
  capybara: { grid: [".l.", "yyy", "yyy", ".y."], colors: { y: "#fcc419", l: "#51cf66" } },
  hedgehog: { grid: ["..l", ".rr", "rrr", "rrr", ".r."], colors: { r: "#e03131", l: "#51cf66" } },
  octopus: { grid: ["pp..", ".ppp", "..pp", "..p."], colors: { p: "#ff8787" } },
  snail: { grid: [".gg.", "rrrr", "rwrr", ".rr."], colors: { r: "#fa5252", w: "#ffe3e3", g: "#51cf66" } },
  // The fox and the grapes, finally within reach.
  fox: { grid: ["..g", "ppp", ".pp", ".p."], colors: { p: "#845ef7", g: "#51cf66" } },
  swift: { grid: ["pp..", ".p..", ".pp.", "..pp"], colors: { p: "#f783ac" } },
  squid: { grid: [".bb.b", "bbbbb", ".bb.b"], colors: { b: "#74c0fc" } },
  otter: { grid: [".ss.", "sSss", "ssss"], colors: { s: "#c5a3d9", S: "#f3e8fa" } }
};
var TUB = outlined([
  ".hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh.",
  "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww",
  "swwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws",
  ".wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws.",
  ".wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwws.",
  ".swwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwss.",
  "..wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwss..",
  "..swwwwwwwwwwwwwwwwwwwwwwwwwwwwsss..",
  "...sswwwwwwwwwwwwwwwwwwwwwwwwwssss..",
  ".....sssssssssssssssssssssssssss....",
  "....ggg......................ggg....",
  "...gg..........................gg..."
]);
var TUB_COLORS = { h: "#ffffff", w: "#eef3f8", s: "#c3cfdb", g: "#e0a800", o: "#51606f" };
var SUDS = outlined(["..ww.ww..", ".wwhwwww.", "wwwwwwhww", "wbwwwwwbw", ".bbwbbbb."]);
var SUDS_COLORS = { w: "#ffffff", h: "#ffffff", b: "#cfe3f5", o: "#9fb6cc" };
var DUCK2 = outlined(["..yy...", ".yyyk..", ".yyyyrr", "yyyyy..", "yyyyyyy", ".yyyyy."]);
var DUCK_COLORS = { y: "#ffd23f", k: "#1a1a1a", r: "#f28c28", o: "#8a5a00" };
var SHOWER_HEAD = outlined(["cccccc", "cCCCCc", ".cccc."]);
var SHOWER_COLORS = { c: "#b8c4d0", C: "#8d9aa8", o: "#51606f" };
var BALL_A = outlined([".yyyy.", "yyyywy", "ywyyyy", "yywyyy", "yyywyy", ".yyyy."]);
var BALL_B = outlined([".yyyy.", "ywyyyy", "yywyyy", "yyyywy", "yyyyyw", ".yyyy."]);
var BALL_COLORS = { y: "#c6e33a", w: "#ffffff", o: "#5f7a12" };
var HAND = outlined(["..ssss....", ".sssssss..", "sssssssccc", "sssssssccc", ".ssssss.cc", "..sss....."]);
var HAND_COLORS = { s: "#f2c29b", c: "#4c6ef5", o: "#8a5a3c" };
var px8 = (grid, colors, x, y, scale) => renderPixels([{ x: 0, y: 0, grid }], colors, { x, y, scale });
function shadow(x, y, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" opacity=".3" style="fill:var(--pf-ground-dark)"/>`;
}
var bowl = (x, ground2, heap = 0) => (heap === null ? "" : px8(HEAPS[heap], KIBBLE, x + 3, ground2 - 26, 3)) + px8(BOWL, BOWL_COLORS, x, ground2 - 21, 3);
var ball = (x, ground2) => px8(BALL_A, BALL_COLORS, x, ground2 - 16, 2);
var MEAL = 6;
function feed(sprite, w, h, scale, stage, species) {
  const pct3 = (t) => `${+(t / MEAL * 100).toFixed(2)}%`;
  const side = species.facing === "right";
  const bowlW = BOWL[0].length * 3;
  const bowlX = stage.cx + 44 - bowlW / 2;
  const box = { x: stage.cx - w / 2, y: stage.ground - h + scale, w, h };
  const wait = -34;
  const eat = bowlX - (stage.cx + w / 2) + (side ? 10 : 18);
  const bagX = bowlX + bowlW - 14;
  const bagY = stage.ground - 92;
  const treat = TREATS[species.id] ?? TREATS.crab;
  const bag = `<g class="pf-bag"><g transform="translate(${bagX} ${bagY})">${px8(BAG, BAG_COLORS, 0, 0, 3)}${px8(treat.grid, treat.colors, 18 - treat.grid[0].length * 3 / 2, 18 - treat.grid.length * 3 / 2 + 3, 3)}</g></g>`;
  const spout = { x: bagX - 2, y: bagY + 20 };
  const kibble = Array.from({ length: 10 }, (_, i) => {
    const t = 0.55 + i * 0.09;
    const dx = bowlX + 12 + i % 4 * 5 - spout.x;
    const dy = stage.ground - 26 - spout.y;
    return `<rect class="pf-kib" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${t}s" x="${spout.x}" y="${spout.y}" width="3" height="3" fill="${i % 2 ? KIBBLE.K : KIBBLE.k}"/>`;
  }).join("");
  const heapShown = (level, from, to) => `.pf-heap${level}{opacity:0;animation:pf-heap${level} ${MEAL}s steps(1) infinite}@keyframes pf-heap${level}{0%{opacity:0}${pct3(from)}{opacity:1}${pct3(to)}{opacity:0}100%{opacity:0}}`;
  const heaps = HEAPS.map((heap, i) => `<g class="pf-heap${i}">${px8(heap, KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g>`).reverse().join("");
  const bites = [2.1, 2.6, 3.1, 3.6, 4.1];
  const dip = side ? "translateY(4px) rotate(10deg)" : "rotate(14deg) translateY(3px)";
  const chompFrames = ["0%{transform:none}", ...bites.flatMap((b) => [`${pct3(b)}{transform:none}`, `${pct3(b + 0.2)}{transform:${dip}}`, `${pct3(b + 0.4)}{transform:none}`]), "100%{transform:none}"].join("");
  const crumbs = bites.flatMap(
    (b, i) => [[-10, -14], [8, -18], [-2, -22]].map(([dx, dy], j) => `<rect class="pf-crumb" style="--dx:${dx + i}px;--dy:${dy}px;animation-delay:${b + 0.22 + j * 0.03}s" x="${bowlX + bowlW / 2}" y="${stage.ground - 24}" width="3" height="3" fill="${j % 2 ? KIBBLE.K : KIBBLE.k}"/>`)
  ).join("");
  const a = anchors(species);
  const mouth = { x: a.mouth.x * scale, y: a.mouth.y * scale };
  const tongue = `<rect class="pf-lick" x="${mouth.x - scale}" y="${mouth.y - scale / 2}" width="${2 * scale}" height="${1.5 * scale}" rx="${scale / 2}" fill="#ff6b8b"/>`;
  const excited = emoteBubble("bang", w - 6, -4, "pf-want-food");
  const nom = bubble(pixelText("NOM"), w - 6, -4, "pf-nom");
  const heart = `<g class="pf-yum">${px8(HEART, FX_PALETTE, w / 2 - 5, -10, 2)}</g>`;
  const css = [
    `.pf-bag{transform-box:fill-box;transform-origin:50% 50%;animation:pf-bag ${MEAL}s ease-in-out infinite}@keyframes pf-bag{0%{transform:translate(50px,-40px)}${pct3(0.35)}{transform:translate(0,0)}${pct3(0.55)},${pct3(1.45)}{transform:rotate(-65deg)}${pct3(1.6)}{transform:rotate(-10deg)}${pct3(1.9)},100%{transform:translate(50px,-40px)}}`,
    `.pf-kib{opacity:0;animation:pf-kib ${MEAL}s cubic-bezier(.4,0,1,1) infinite}@keyframes pf-kib{0%{opacity:1;transform:translate(0,0)}7%{opacity:1;transform:translate(var(--dx),var(--dy))}7.1%,100%{opacity:0}}`,
    heapShown(2, 0.75, 1),
    heapShown(1, 1, 1.3),
    // Full once poured; eaten down in stages.
    `.pf-heap0{opacity:0;animation:pf-heap0 ${MEAL}s steps(1) infinite}@keyframes pf-heap0{0%{opacity:0}${pct3(1.3)}{opacity:1}${pct3(2.9)}{opacity:0}100%{opacity:0}}`,
    `.pf-heap1b{opacity:0;animation:pf-heap1b ${MEAL}s steps(1) infinite}@keyframes pf-heap1b{0%{opacity:0}${pct3(2.9)}{opacity:1}${pct3(3.9)}{opacity:0}100%{opacity:0}}`,
    `.pf-heap2b{opacity:0;animation:pf-heap2b ${MEAL}s steps(1) infinite}@keyframes pf-heap2b{0%{opacity:0}${pct3(3.9)}{opacity:1}${pct3(4.5)}{opacity:0}100%{opacity:0}}`,
    `.pf-meal-walk{animation:pf-meal-walk ${MEAL}s ease-in-out infinite}@keyframes pf-meal-walk{0%,${pct3(1.5)}{transform:translateX(${wait}px)}${pct3(1.95)},${pct3(4.9)}{transform:translateX(${eat}px)}${pct3(5.7)},100%{transform:translateX(${wait}px)}}`,
    `.pf-meal-bounce{animation:pf-meal-bounce ${MEAL}s ease-in-out infinite}@keyframes pf-meal-bounce{0%,${pct3(0.2)},${pct3(0.5)},${pct3(0.8)},${pct3(1.1)},${pct3(1.4)},${pct3(4.55)},${pct3(4.95)},100%{transform:none}${pct3(0.35)},${pct3(0.65)},${pct3(0.95)},${pct3(1.25)}{transform:translateY(-8px)}${pct3(4.75)}{transform:translateY(-10px)}}`,
    `.pf-chomp{transform-box:fill-box;transform-origin:50% 100%;animation:pf-chomp ${MEAL}s ease-in-out infinite}@keyframes pf-chomp{${chompFrames}}`,
    `.pf-crumb{opacity:0;animation:pf-crumb ${MEAL}s ease-out infinite}@keyframes pf-crumb{0%{transform:translate(0,0);opacity:1}6%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}`,
    `.pf-want-food{opacity:0;animation:pf-want-food ${MEAL}s steps(1) infinite}@keyframes pf-want-food{0%{opacity:0}${pct3(0.3)}{opacity:1}${pct3(1.4)}{opacity:0}100%{opacity:0}}`,
    `.pf-nom{opacity:0;animation:pf-nom ${MEAL}s steps(1) infinite}@keyframes pf-nom{0%{opacity:0}${pct3(2.2)}{opacity:1}${pct3(4.4)}{opacity:0}100%{opacity:0}}`,
    `.pf-lick{opacity:0;animation:pf-lick ${MEAL}s steps(1) infinite}@keyframes pf-lick{0%{opacity:0}${pct3(4.6)}{opacity:1}${pct3(4.75)}{opacity:0}${pct3(4.9)}{opacity:1}${pct3(5.05)}{opacity:0}100%{opacity:0}}`,
    `.pf-yum{opacity:0;animation:pf-yum ${MEAL}s ease-out infinite}@keyframes pf-yum{0%,${pct3(4.7)}{opacity:0;transform:translate(0,0)}${pct3(4.8)}{opacity:1}${pct3(5.8)},100%{opacity:0;transform:translate(4px,-24px)}}`
  ].join("\n");
  const pet2 = `<g class="pf-meal-walk">${shadow(box.x + w * 0.1, box.y + h - 2, w * 0.8)}<g transform="translate(${box.x} ${box.y})"><g class="pf-meal-bounce"><g class="pf-chomp">${sprite}${tongue}</g></g>${excited}${nom}${heart}</g></g>`;
  const eaten = `<g class="pf-heap1b">${px8(HEAPS[1], KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g><g class="pf-heap2b">${px8(HEAPS[2], KIBBLE, bowlX + 3, stage.ground - 26, 3)}</g>`;
  return {
    svg: `${pet2}${heaps}${eaten}${px8(BOWL, BOWL_COLORS, bowlX, stage.ground - 21, 3)}${crumbs}${kibble}${bag}`,
    box,
    css
  };
}
function bath(sprite, w, h, scale, stage, species, asleep) {
  const tubW = TUB[0].length * 3;
  const tubH = TUB.length * 3;
  const tubX = stage.cx - tubW / 2;
  const tubY = stage.ground - tubH + 3;
  const box = { x: stage.cx - w / 2, y: Math.round(tubY + 4 - h * 0.7), w, h };
  const crown2 = { x: box.x + species.crownAnchor.x * scale, y: box.y + species.crownAnchor.y * scale };
  const headSuds = `<g class="pf-suds">${px8(SUDS, SUDS_COLORS, crown2.x - 11, crown2.y - 13, 2)}</g>`;
  const rimSuds = [-50, -30, 18, 40].map((dx, i) => `<g class="pf-suds" style="animation-delay:-${i * 0.4}s">${px8(SUDS, SUDS_COLORS, stage.cx + dx - 9, tubY - 9 + i % 2 * 2, 2)}</g>`).join("");
  const pipeX = tubX + tubW - 12;
  const headY = Math.max(stage.ground - 128, box.y - 50);
  const pipe = `<rect x="${pipeX}" y="${headY + 2}" width="4" height="${tubY - headY}" fill="#e0a800"/><rect x="${stage.cx + 6}" y="${headY}" width="${pipeX - stage.cx - 2}" height="4" fill="#e0a800"/><rect x="${pipeX + 4}" y="${headY + 2}" width="1" height="${tubY - headY}" fill="#8a6a00"/>`;
  const head = px8(SHOWER_HEAD, SHOWER_COLORS, stage.cx - 12, headY + 1, 3);
  const fall = box.y - headY - 26;
  const drops = [-9, -4, 1, 6, 11].map((dx, i) => `<rect class="pf-drop" style="--fall:${fall}px;animation-delay:-${i * 0.29 % 0.7}s" x="${stage.cx + dx}" y="${headY + 16}" width="2" height="4" fill="#7cc4f2"/>`).join("");
  const bubbles = [
    [-46, 4, 0],
    [-36, -6, 0.9],
    [38, 6, 1.7],
    [48, -4, 0.5],
    [-42, 3, 2.3]
  ].map(
    ([x, dx, delay]) => `<g class="pf-bubble" style="--dx:${dx}px;animation-delay:-${delay}s">${px8(outlined([".b.", "bhb", ".b."]), { b: "#dff1ff", h: "#ffffff", o: "#8ec5ea" }, stage.cx + x - 4, tubY - 6, 2)}</g>`
  ).join("");
  const steam = [-40, -24, 32].map((x, i) => `<g class="pf-steam" style="animation-delay:-${i * 1.3}s">${px8(["x.", ".x", "x.", ".x"], { x: "#ffffff" }, stage.cx + x, tubY - 16, 2)}</g>`).join("");
  const duck = `<g class="pf-duck">${px8(DUCK2, DUCK_COLORS, stage.cx + 24, tubY - 12, 2)}</g>`;
  const pet2 = asleep ? sprite : `<g class="pf-scrub">${sprite}</g>`;
  return {
    svg: `${shadow(tubX + 8, stage.ground + 1, tubW - 16)}${pipe}${head}${steam}<g transform="translate(${box.x} ${box.y})">${pet2}</g>${headSuds}${asleep ? "" : drops}${px8(TUB, TUB_COLORS, tubX, tubY, 3)}${rimSuds}${duck}${bubbles}`,
    box
  };
}
var FETCH = 6;
var lerp = (a, b, u) => a + (b - a) * Math.min(1, Math.max(0, u));
function arc(t, t0, t1, x0, y0, x1, y1, peak) {
  const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  const top = Math.min(y0, y1) - peak;
  const y = (1 - u) ** 2 * y0 + 2 * u * (1 - u) * (2 * top - (y0 + y1) / 2) + u ** 2 * y1;
  return { x: lerp(x0, x1, u), y };
}
var CHOREOGRAPHY = {
  pet: (t) => {
    const hop = (a, b, height) => t >= a && t <= b ? -Math.sin((t - a) / (b - a) * Math.PI) * height : 0;
    const trot = (a, b) => t >= a && t <= b ? -Math.abs(Math.sin((t - a) / 0.3 * Math.PI)) * 3 : 0;
    let x = 0;
    if (t < 0.9) x = 0;
    else if (t < 2.3) x = lerp(0, -44, (t - 0.9) / 1.4);
    else if (t < 2.6) x = lerp(-44, -52, (t - 2.3) / 0.3);
    else if (t < 3.2) x = -52;
    else if (t < 4.4) x = lerp(-52, 8, (t - 3.2) / 1.2);
    else if (t < 5.2) x = 8;
    else x = lerp(8, 0, (t - 5.2) / 0.8);
    const y = trot(0.9, 2.3) + hop(2.3, 2.6, 16) + hop(2.75, 2.95, 5) + hop(3, 3.2, 5) + trot(3.2, 4.4) + hop(4.65, 5.05, 18);
    return { x, y };
  },
  ball: (t) => {
    if (t < 0.35) return { x: 84, y: -62 };
    if (t < 1.5) return arc(t, 0.35, 1.5, 84, -62, -28, 0, 30);
    if (t < 1.9) return arc(t, 1.5, 1.9, -28, 0, -42, 0, 16);
    if (t < 2.15) return arc(t, 1.9, 2.15, -42, 0, -48, 0, 5);
    if (t < 2.5) return { x: lerp(-48, -52, (t - 2.15) / 0.35), y: 0 };
    if (t < 4.75) return null;
    return arc(t, 4.75, 5.55, 8, -40, 84, -62, 46);
  }
};
function play(sprite, w, h, scale, stage, species) {
  const side = species.facing === "right";
  const a = anchors(species);
  const mouth = { dx: a.mouth.x * scale - w / 2, dy: -(h - a.mouth.y * scale) - 2 };
  const steps = Array.from({ length: FETCH * 10 + 1 }, (_, i) => i / 10);
  const pct3 = (t) => `${+(t / FETCH * 100).toFixed(2)}%`;
  const r2 = (n) => Math.round(n * 10) / 10;
  const facing = (t) => {
    const now = CHOREOGRAPHY.pet(t).x;
    const next = CHOREOGRAPHY.pet(Math.min(FETCH, t + 0.1)).x;
    if (next < now - 0.01) return -1;
    if (next > now + 0.01) return 1;
    return t < 0.9 || t > 5.2 ? 1 : t < 3.2 ? -1 : 1;
  };
  const held = (t) => {
    const p = CHOREOGRAPHY.pet(t);
    const dx = side ? facing(t) * Math.abs(mouth.dx) : mouth.dx;
    return { x: p.x + dx, y: p.y + mouth.dy };
  };
  const petFrames = steps.map((t) => {
    const p = CHOREOGRAPHY.pet(t);
    return `${pct3(t)}{transform:translate(${r2(p.x)}px,${r2(p.y)}px)}`;
  }).join("");
  const ballFrames = steps.map((t) => {
    const b = CHOREOGRAPHY.ball(t) ?? held(t);
    return `${pct3(t)}{transform:translate(${r2(b.x)}px,${r2(b.y)}px)}`;
  }).join("");
  const shadowFrames = steps.map((t) => {
    const b = CHOREOGRAPHY.ball(t) ?? held(t);
    const k = Math.max(0.35, 1 + b.y / 80);
    return `${pct3(t)}{transform:translateX(${r2(b.x)}px) scale(${r2(k)});opacity:${t < 0.35 || t > 5.5 ? 0 : r2(0.35 * k)}}`;
  }).join("");
  const faceFrames = side ? steps.map((t) => `${pct3(t)}{transform:scaleX(${facing(t)})}`).join("") : "";
  const css = [
    `.pf-fetch-pet{animation:pf-fetch-pet ${FETCH}s linear infinite}@keyframes pf-fetch-pet{${petFrames}}`,
    `.pf-fetch-ball{animation:pf-fetch-ball ${FETCH}s linear infinite}@keyframes pf-fetch-ball{${ballFrames}}`,
    `.pf-fetch-shadow{transform-box:fill-box;transform-origin:center;animation:pf-fetch-shadow ${FETCH}s linear infinite}@keyframes pf-fetch-shadow{${shadowFrames}}`,
    side ? `.pf-fetch-face{transform-box:fill-box;transform-origin:center;animation:pf-fetch-face ${FETCH}s steps(1) infinite}@keyframes pf-fetch-face{${faceFrames}}` : "",
    // Crouch before the throw, squash on landing the pounce and the toss.
    `.pf-fetch-squash{transform-box:fill-box;transform-origin:50% 100%;animation:pf-fetch-squash ${FETCH}s ease-in-out infinite}@keyframes pf-fetch-squash{0%,${pct3(0.8)},${pct3(2.5)},${pct3(2.75)},${pct3(4.5)},${pct3(5.15)},${pct3(5.5)},100%{transform:none}${pct3(0.3)}{transform:scale(1.08,.88)}${pct3(2.62)}{transform:scale(1.14,.82)}${pct3(4.62)}{transform:scale(1.1,.86)}${pct3(5.1)}{transform:scale(1.06,.9)}${pct3(5.8)}{transform:scale(1.06,.9)}}`,
    `.pf-ball-a{animation:pf-ball-a .3s steps(1) infinite}.pf-ball-b{opacity:0;animation:pf-ball-a .3s steps(1) infinite;animation-delay:-.15s}@keyframes pf-ball-a{0%{opacity:1}50%{opacity:0}}`,
    `.pf-hand{animation:pf-hand ${FETCH}s ease-in-out infinite}@keyframes pf-hand{0%{transform:translateX(30px)}${pct3(0.15)}{transform:translateX(0)}${pct3(0.45)}{transform:translateX(-6px) rotate(-8deg)}${pct3(0.8)},${pct3(5.1)}{transform:translateX(30px)}${pct3(5.45)}{transform:translateX(0)}${pct3(5.75)},100%{transform:translateX(30px)}}`,
    `@keyframes pf-catch{0%{opacity:0}${pct3(2.6)}{opacity:1}${pct3(3.3)}{opacity:0}100%{opacity:0}}`,
    `@keyframes pf-dust{0%{opacity:0;transform:scale(.4)}2%{opacity:.8;transform:scale(1)}8%,100%{opacity:0;transform:scale(1.6) translateY(-4px)}}`
  ].join("\n");
  const box = { x: stage.cx - w / 2, y: stage.ground - h + scale, w, h };
  const ballSize = BALL_A[0].length * 2;
  const ballAt = { x: stage.cx - ballSize / 2, y: stage.ground - ballSize };
  const ballSvg = `<g class="pf-fetch-ball"><g class="pf-ball-a">${px8(BALL_A, BALL_COLORS, ballAt.x, ballAt.y, 2)}</g><g class="pf-ball-b">${px8(BALL_B, BALL_COLORS, ballAt.x, ballAt.y, 2)}</g></g>`;
  const ballShadow = `<g class="pf-fetch-shadow"><rect x="${stage.cx - 6}" y="${stage.ground + 2}" width="12" height="4" rx="2" style="fill:var(--pf-ground-dark)"/></g>`;
  const hand = `<g class="pf-hand">${px8(HAND, HAND_COLORS, stage.cx + 86, stage.ground - 72, 2)}</g>`;
  const dust = [1.1, 1.5, 1.9, 3.4, 3.8, 4.2].map((t) => {
    const p = CHOREOGRAPHY.pet(t);
    const behind = t < 3 ? w / 2 : -w / 2;
    return `<g class="pf-dust" style="animation-delay:${t - FETCH}s">${px8(outlined([".dd.", "dddd", ".dd."]), { d: "#e9e3d5", o: "#b9ad93" }, stage.cx + p.x + behind - 4, stage.ground - 6, 2)}</g>`;
  }).join("");
  const catchBubble = emoteBubble("bang", w - 6, -4, "pf-catch");
  const body = side ? `<g class="pf-fetch-face">${sprite}</g>` : sprite;
  const pet2 = `<g class="pf-fetch-pet"><g transform="translate(${box.x} ${box.y})"><g class="pf-fetch-squash"><g class="pf-run">${body}</g></g>${catchBubble}</g></g>`;
  const petShadow = `<g class="pf-fetch-pet">${shadow(box.x + w * 0.1, stage.ground - 2 + scale, w * 0.8)}</g>`;
  return { svg: `${petShadow}${ballShadow}${dust}${pet2}${ballSvg}${hand}`, box, css };
}
function visitScene(visit2, state, sprite, scale, stage) {
  const { svg, width: w, height: h } = sprite;
  switch (visit2) {
    case "feed":
      return feed(svg, w, h, scale, stage, getSpecies(state.species));
    case "bath":
      return bath(svg, w, h, scale, stage, getSpecies(state.species), state.mood === "sleeping");
    case "play":
      return play(svg, w, h, scale, stage, getSpecies(state.species));
  }
}

// src/pet/life.ts
var CYCLE2 = 24;
var QUESTION2 = ["xx.", "..x", ".x.", "...", ".x."];
var NOTE = ["..xx", "..x.", "..x.", "xxx.", "xx.."];
var BANG = ["x", "x", "x", ".", "x"];
var DOTS = [".....", ".....", ".....", ".....", "x.x.x"];
var CHATTER = ["LGTM", "WIP", "TODO", "404", "YAY", "GG", "BRB", "NICE", "+1", "DONE", "OK!", "HI!", "LOL", "CODE"];
var SCRIPTS = {
  idle: [
    {
      path: [[0, -34], [3, 10], [11, 10], [14, 34], [16, 34], [19, -20], [22.6, -20], [24, -34]],
      sits: [[6, 8]],
      yawns: [[6.4, 7.6]],
      act: [14.2, 16],
      hops: [[19.2, 20.2]],
      emotes: [
        { span: [3.4, 5.6], glyph: QUESTION2 },
        { span: [19, 20.3], glyph: NOTE }
      ]
    },
    // The explorer: sniffs something out on the right, dashes back, naps on the left.
    {
      path: [[0, 0], [2.5, 30], [5.5, 30], [7, -10], [11, -10], [13, -34], [18, -34], [20, 0], [24, 0]],
      sniffs: [[2.8, 4.1]],
      hops: [[5.6, 6.9]],
      sits: [[13.3, 15.8]],
      yawns: [[13.6, 14.8]],
      act: [16.1, 17.9],
      emotes: [
        { span: [4.1, 5.4], glyph: BANG },
        { span: [18.2, 19.8], glyph: NOTE }
      ]
    }
  ],
  happy: [
    {
      path: [[0, -34], [6, 34], [8.2, 34], [11, 34], [12.5, -34], [13.4, -34], [15, 20], [17, 20], [20.3, -10], [22.6, -10], [24, -34]],
      spins: [[6.2, 7.8]],
      bigJumps: [[15.2, 16.6]],
      emotes: [{ span: [15, 17], glyph: NOTE }]
    },
    // Zoomies: laps across the scene, then jumps for joy on both sides.
    {
      path: [[0, 0], [1.5, 34], [3, -34], [4.5, 34], [6, 0], [11, 0], [12, 20], [14, 20], [16, -30], [18, -30], [20, 0], [24, 0]],
      spins: [[6.2, 7.8]],
      bigJumps: [[12.2, 13.6], [16.2, 17.6]],
      emotes: [
        { span: [12, 14], glyph: pixelText("\u2665") },
        { span: [16, 17.8], glyph: NOTE }
      ]
    }
  ],
  hungry: [
    {
      path: [[0, -24], [6, 0], [9, 0], [12, 8], [24, 8]],
      shakes: [[6.2, 8.6]],
      sniffs: [[12.2, 14.4]],
      sits: [[15, 24]],
      emotes: [
        { span: [6.2, 8.6], glyph: pixelText("GRR") },
        { span: [14.6, 17.4], glyph: DOTS }
      ]
    },
    // Searching: wanders off looking for food, finds nothing, trudges back to the bowl.
    {
      path: [[0, 8], [2, 8], [5, -26], [12, -26], [15, 8], [24, 8]],
      sits: [[0, 1.8], [15.6, 24]],
      sniffs: [[5.3, 7]],
      shakes: [[10, 11.6]],
      emotes: [
        { span: [7.2, 9.4], glyph: QUESTION2 },
        { span: [10, 11.6], glyph: pixelText("GRR") }
      ]
    }
  ],
  sleeping: [
    {
      path: [[0, 0], [24, 0]],
      rolls: [[16, 16.8]]
    }
  ]
};
var pct2 = (t) => `${+(t / CYCLE2 * 100).toFixed(3)}%`;
function showKeyframes(name, spans) {
  const frames2 = ["0%{opacity:0}"];
  for (const [a, b] of spans) frames2.push(`${pct2(a)}{opacity:1}`, `${pct2(b)}{opacity:0}`);
  frames2.push("100%{opacity:0}");
  return `@keyframes ${name}{${frames2.join("")}}`;
}
function hideKeyframes(name, spans) {
  const frames2 = ["0%{opacity:1}"];
  for (const [a, b] of spans) frames2.push(`${pct2(a)}{opacity:0}`, `${pct2(b)}{opacity:1}`);
  frames2.push("100%{opacity:1}");
  return `@keyframes ${name}{${frames2.join("")}}`;
}
function poseKeyframes(name, spans, pose, ramp = 0.3) {
  const frames2 = ["0%{transform:none}"];
  for (const [a, b] of spans) {
    frames2.push(`${pct2(a)}{transform:none}`, `${pct2(Math.min(a + ramp, b))}{transform:${pose(0)}}`);
    frames2.push(`${pct2(Math.max(b - ramp, a))}{transform:${pose(1)}}`, `${pct2(b)}{transform:none}`);
  }
  frames2.push("100%{transform:none}");
  return `@keyframes ${name}{${frames2.join("")}}`;
}
function beatKeyframes(name, spans, values) {
  const frames2 = ["0%{transform:none}"];
  for (const [a, b] of spans) {
    const step = (b - a) / values.length;
    frames2.push(`${pct2(a)}{transform:none}`);
    values.forEach((v, i) => frames2.push(`${pct2(a + step * (i + 0.5))}{transform:${v}}`));
    frames2.push(`${pct2(b)}{transform:none}`);
  }
  frames2.push("100%{transform:none}");
  return `@keyframes ${name}{${frames2.join("")}}`;
}
function faceKeyframes(name, path) {
  let facing = 1;
  const frames2 = [`0%{transform:scaleX(1)}`];
  for (let i = 1; i < path.length; i++) {
    const [t0, x0] = path[i - 1];
    const [, x1] = path[i];
    const next = x1 > x0 ? 1 : x1 < x0 ? -1 : facing;
    if (next !== facing) {
      facing = next;
      frames2.push(`${pct2(t0)}{transform:scaleX(${facing})}`);
    }
  }
  frames2.push(`100%{transform:scaleX(1)}`);
  return `@keyframes ${name}{${frames2.join("")}}`;
}
var SIGNATURE_MOVE = {
  crab: () => ({ transform: ["translateX(-5px)", "translateX(5px)", "translateX(-5px)", "translateX(5px)", "translateX(-5px)", "translateX(5px)"] }),
  gopher: (s, w, h) => ({
    transform: ["scaleY(.6)", "scaleY(0)", "scaleY(0)", "scaleY(0)", "scaleY(1.15)", "scaleY(.95)"],
    particles: dirt(w, h, s)
  }),
  snake: () => ({ transform: ["rotate(-9deg)", "rotate(9deg)", "rotate(-9deg)", "rotate(9deg)", "rotate(-6deg)", "rotate(4deg)"] }),
  elephant: (s, w, h) => ({ transform: ["translateY(-2px)", "none", "translateY(-2px)", "none"], particles: spray(w, h, s) }),
  chick: () => ({ transform: ["translateY(-8px)", "translateY(-18px)", "translateY(-14px)", "translateY(-20px)", "translateY(-10px)", "none"] }),
  turtle: () => ({ transform: ["rotate(90deg) scale(.9)", "rotate(180deg) scale(.9)", "rotate(270deg) scale(.9)", "rotate(360deg) scale(.9)"] }),
  // Shakes off like it just got out of the hot spring.
  capybara: (s, w, h) => ({
    transform: ["rotate(-4deg) translateX(-2px)", "rotate(4deg) translateX(2px)", "rotate(-4deg) translateX(-2px)", "rotate(4deg) translateX(2px)", "rotate(-2deg)", "none"],
    particles: droplets(w, h, s)
  }),
  // Curls into a ball and rolls about.
  hedgehog: () => ({ transform: ["scale(.85,.75)", "rotate(-180deg) scale(.8)", "rotate(-360deg) scale(.8)", "rotate(-540deg) scale(.8)", "rotate(-720deg) scale(.85)", "none"] }),
  // Squirts ink and jets backwards.
  octopus: (s, w, h) => ({ transform: ["scale(1.1,.85)", "translate(-14px,-16px) scale(.9,1.1)", "translate(-18px,-10px)", "translate(-10px,-4px)", "none"], particles: ink(w, h, s) }),
  // Inches along: stretch, then scrunch up.
  snail: () => ({ transform: ["scaleX(1.18)", "scaleX(.9)", "scaleX(1.18)", "scaleX(.9)", "none"] }),
  // Leaps up and dives nose-first, like a fox hunting mice under the snow.
  fox: (s, w, h) => ({
    transform: ["translateY(3px) scale(1.06,.9)", "translate(8px,-28px) rotate(25deg)", "translate(14px,-14px) rotate(70deg)", "translate(16px,2px) rotate(90deg) scale(1,.8)", "none"],
    particles: dirt(w, h, s)
  }),
  // Jets straight up, the way squid do, and sinks back down.
  squid: () => ({ transform: ["scale(1.1,.85)", "translateY(-30px) scale(.85,1.2)", "translateY(-26px)", "translateY(-10px)", "none"] }),
  // Rolls onto its back, like floating down a river.
  otter: () => ({ transform: ["rotate(-90deg)", "rotate(-180deg) translateY(4px)", "rotate(-180deg) translateY(2px)", "rotate(-270deg)", "rotate(-360deg)"] }),
  // A loop-the-loop.
  swift: () => ({ transform: ["translateY(-10px)", "translate(-8px,-26px) rotate(-120deg)", "translate(-2px,-30px) rotate(-240deg)", "translate(4px,-14px) rotate(-360deg)", "none"] })
};
function particles(color, from, size, moves, name) {
  return moves.map(
    ([dx, dy], i) => `<rect class="${name}" style="--dx:${dx}px;--dy:${dy}px;animation-delay:calc(var(--pf-t0,0s) + ${i % 3 * 0.12}s)" x="${from.x}" y="${from.y}" width="${size}" height="${size}" fill="${color}"/>`
  ).join("");
}
var dirt = (w, h, s) => particles("#7a5230", { x: w / 2, y: h - s }, s, [[-26, -14], [-14, -22], [0, -26], [14, -22], [26, -14], [-20, -8], [20, -8]], "pf-life-burst");
var droplets = (w, h, s) => particles("#7cc4f2", { x: w / 2, y: h / 2 }, s, [[-34, -10], [-26, -22], [-12, -28], [12, -28], [26, -22], [34, -10], [0, -30]], "pf-life-burst");
var ink = (w, h, s) => particles("#2b2140", { x: w / 2, y: h - s }, s * 1.5, [[6, 10], [16, 6], [26, 12], [10, 18], [22, 20], [30, 4]], "pf-life-burst");
var spray = (w, h, s) => particles("#4ea8de", { x: w / 2, y: h - 2 * s }, s, [[-30, -56], [-14, -70], [0, -78], [14, -70], [30, -56], [-8, -62], [8, -62]], "pf-life-burst");
var DREAMS = [
  COMMIT,
  ["..rr.", ".rrrr", "rrrr.", "rrr..", ".w...", "w...."],
  // a drumstick
  [".rrr.", "rrwrr", "rrrrr", ".rrr."],
  // the ball
  HEART,
  ["..y..", ".yyy.", "yyyyy", ".yyy.", ".y.y."]
  // a star
];
var DREAM_COLORS = { ...FX_PALETTE, r: "#e76f51", w: "#fff8e7", y: "#ffd23f" };
function lifeFor(mood, species, scale, w, h, date, login, { crossed = [] } = {}) {
  const routines = SCRIPTS[mood];
  const s = routines[Math.floor(seeded(`routine:${login}:${date}`)() * routines.length)];
  const overlaps = ([a0, a1]) => crossed.some(([b0, b1]) => a0 < b1 && b0 < a1);
  const yawns = s.yawns?.filter((span) => !overlaps(span));
  const id = `${mood}-${species.id}`;
  const css = [];
  const bodyClasses = [];
  const overlay = [];
  const a = anchors(species);
  const top = a.top * scale;
  const pathName = `pf-p-${id}`;
  css.push(`@keyframes ${pathName}{${s.path.map(([t, x]) => `${pct2(t)}{transform:translateX(${x}px)}`).join("")}}`);
  css.push(`.${pathName}{animation:${pathName} ${CYCLE2}s ease-in-out var(--pf-t0,0s) infinite}`);
  const faceName = `pf-f-${id}`;
  css.push(faceKeyframes(faceName, s.path), `.${faceName}{transform-box:fill-box;transform-origin:center;animation:${faceName} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
  const body = (suffix, keyframes, timing = "ease-in-out") => {
    const name = `pf-b-${suffix}-${id}`;
    css.push(keyframes.replace("@keyframes X", `@keyframes ${name}`));
    css.push(`.${name}{transform-box:fill-box;transform-origin:50% 100%;animation:${name} ${CYCLE2}s ${timing} var(--pf-t0,0s) infinite}`);
    bodyClasses.push(name);
  };
  if (s.sits) body("sit", poseKeyframes("X", s.sits, () => "scale(1.05,.88)"));
  if (s.hops) body("hop", beatKeyframes("X", s.hops, ["translateY(-9px)", "none", "translateY(-9px)", "none"]));
  if (s.bigJumps) body("jump", beatKeyframes("X", s.bigJumps, ["scale(1.06,.9)", "translateY(-26px) scale(.95,1.08)", "translateY(-22px)", "none"]));
  if (s.spins) body("spin", beatKeyframes("X", s.spins, ["translateY(-10px) scaleX(-1)", "translateY(-16px) scaleX(1)", "translateY(-10px) scaleX(-1)", "none"]), "steps(1)");
  if (s.shakes) body("shake", beatKeyframes("X", s.shakes, Array.from({ length: 10 }, (_, i) => `translateX(${i % 2 ? 2 : -2}px)`)), "linear");
  if (s.sniffs) body("sniff", beatKeyframes("X", s.sniffs, ["rotate(10deg)", "none", "rotate(10deg)", "none"]));
  if (s.rolls) body("roll", beatKeyframes("X", s.rolls, ["scale(1.1,.8) scaleX(-1)", "scaleX(-1)"]));
  if (s.act) {
    const move = (SIGNATURE_MOVE[species.id] ?? SIGNATURE_MOVE.crab)(scale, w, h);
    const origin = ["turtle", "hedgehog", "swift", "otter"].includes(species.id) ? "center" : "50% 100%";
    const name = `pf-b-act-${id}`;
    css.push(beatKeyframes(name, [s.act], move.transform));
    css.push(`.${name}{transform-box:fill-box;transform-origin:${origin};animation:${name} ${CYCLE2}s ease-in-out var(--pf-t0,0s) infinite}`);
    bodyClasses.push(name);
    if (move.particles) {
      css.push(`.pf-life-burst{opacity:0;animation:pf-life-burst ${CYCLE2}s ease-out var(--pf-t0,0s) infinite}`);
      css.push(
        `@keyframes pf-life-burst{0%,${pct2(s.act[0])}{transform:translate(0,0);opacity:0}${pct2(s.act[0] + 0.2)}{opacity:1}${pct2(s.act[0] + 1.2)}{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}`
      );
      overlay.push(move.particles);
    }
  }
  const alts = [];
  if (yawns?.length) {
    const name = `pf-y-${id}`;
    alts.push({ cls: name, kind: "closed" });
    css.push(showKeyframes(name, yawns), `.${name}{opacity:0;animation:${name} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
    const m = { x: a.mouth.x * scale, y: a.mouth.y * scale };
    overlay.push(`<rect class="${name}" x="${m.x - 1.5 * scale}" y="${m.y - scale}" width="${3 * scale}" height="${2.5 * scale}" rx="${scale}" fill="#3b1d1d"/>`);
    css.push(showKeyframes(`pf-yz-${id}`, yawns), `.pf-yz-${id}{opacity:0;animation:pf-yz-${id} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
    overlay.push(`<g class="pf-yz-${id}">${renderPixels([{ x: 0, y: 0, grid: ZED }], FX_PALETTE, { x: w - scale, y: top - 12, scale: 2 })}</g>`);
  }
  if (crossed.length) {
    const name = `pf-x-${id}`;
    alts.push({ cls: name, kind: "crossed" });
    css.push(showKeyframes(name, crossed), `.${name}{opacity:0;animation:${name} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
  }
  let eyes6 = null;
  if (alts.length) {
    eyes6 = { hide: `pf-yh-${id}`, alts };
    css.push(hideKeyframes(eyes6.hide, [...yawns ?? [], ...crossed].sort((p, q) => p[0] - q[0])), `.${eyes6.hide}{animation:${eyes6.hide} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
  }
  const chatter = seeded(`chat:${login}:${date}`);
  const talkative = mood === "idle" || mood === "happy";
  s.emotes?.forEach(({ span, glyph: plain }, i) => {
    const glyph = talkative && chatter() < 0.5 ? pixelText(CHATTER[Math.floor(chatter() * CHATTER.length)]) : plain;
    const name = `pf-e${i}-${id}`;
    css.push(showKeyframes(name, [span]), `.${name}{opacity:0;animation:${name} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
    overlay.push(bubble(glyph, w - 6, top - 2, name));
  });
  if (mood === "happy") {
    for (const [dx, delay] of [[0.15, 0.3], [0.55, 1.2], [0.9, 2.1]]) {
      overlay.push(`<g class="pf-rise" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid: HEART }], FX_PALETTE, { x: w * dx, y: top - 4, scale: 2 })}</g>`);
    }
  }
  if (mood === "hungry") {
    const name = `pf-want-${id}`;
    css.push(showKeyframes(name, [[17.6, 24]]), `.${name}{opacity:0;animation:${name} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
    const bx = w - 6;
    const by = top - 30;
    overlay.push(
      `<g class="${name}"><rect x="${bx - 6}" y="${by + 26}" width="4" height="4" rx="1" fill="#ffffff" stroke="#8d96a0"/><rect x="${bx}" y="${by + 18}" width="6" height="6" rx="2" fill="#ffffff" stroke="#8d96a0"/><rect x="${bx + 2}" y="${by - 6}" width="28" height="24" rx="8" fill="#ffffff" stroke="#8d96a0" stroke-width="1.2"/>${renderPixels([{ x: 0, y: 0, grid: COMMIT }], FX_PALETTE, { x: bx + 9, y: by - 1, scale: 3.5 })}</g>`
    );
  }
  if (mood === "sleeping") {
    const dream = DREAMS[Math.floor(seeded(`dream:${login}:${date}`)() * DREAMS.length)];
    const name = `pf-dream-${id}`;
    css.push(showKeyframes(name, [[6, 12]]), `.${name}{opacity:0;animation:${name} ${CYCLE2}s steps(1) var(--pf-t0,0s) infinite}`);
    const bx = w - 4;
    const by = top - 34;
    const cloud3 = new RectBatch().add("#ffffff", bx, by, 28, 22).add("#ffffff", bx + 4, by - 3, 20, 3).add("#ffffff", bx + 4, by + 22, 20, 3);
    overlay.push(
      `<g class="${name}"><rect x="${bx - 8}" y="${by + 26}" width="4" height="4" rx="2" fill="#ffffff" opacity=".9"/><rect x="${bx - 3}" y="${by + 19}" width="6" height="6" rx="3" fill="#ffffff" opacity=".9"/><g opacity=".92">${cloud3}</g>${renderPixels([{ x: 0, y: 0, grid: dream }], DREAM_COLORS, { x: bx + 6, y: by + 4, scale: 3 })}</g>`
    );
  }
  return { css: css.join("\n"), pathClass: pathName, faceClass: species.facing === "right" ? faceName : "", bodyClasses, overlay: overlay.join(""), eyes: eyes6 };
}
var emptyBowl = (x, ground2) => bowl(x, ground2, null);

// src/pet/night.ts
var r = (n) => Math.round(n * 100) / 100;
var NIGHTCAP = {
  grid: [
    "........ww",
    "......bbww",
    ".....bwbb.",
    "....bbbw..",
    "...bwbbb..",
    "..bbbwbb..",
    ".bwbbbbwb.",
    "wwwwwwwwww"
  ],
  palette: { b: "#6c7fd8", w: "#f8f9ff" },
  cx: 5,
  sink: 1
};
var STARS2 = [
  [22, 14, 0, 2],
  [48, 36, 0.7, 3],
  [84, 12, 1.3, 2],
  [120, 30, 0.4, 3],
  [150, 16, 1.1, 2],
  [182, 46, 0.2, 2],
  [36, 62, 1.5, 2],
  [104, 52, 0.9, 2],
  [168, 70, 0.3, 2]
];
function nightSky(s) {
  const stars = STARS2.map(([x, y, d, size]) => `<rect class="pf-twinkle" style="animation-delay:-${d}s" x="${s.x + x}" y="${s.y + y}" width="${size}" height="${size}" fill="#fff8d6"/>`).join("");
  const mx = s.x + 36;
  const my = s.y + 34;
  const moon2 = `<circle cx="${mx}" cy="${my}" r="22" fill="#fff3c4" opacity=".08"/><circle cx="${mx}" cy="${my}" r="16" fill="#fff3c4" opacity=".12"/><circle cx="${mx}" cy="${my}" r="11" fill="#fff1b8"/><circle cx="${mx + 5}" cy="${my - 3}" r="10" fill="#242a63"/>`;
  return `<defs><linearGradient id="pf-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1e4d"/><stop offset=".7" stop-color="#2e2a66"/><stop offset="1" stop-color="#4a3a78"/></linearGradient><radialGradient id="pf-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" fill="url(#pf-night)"/>${stars}${moon2}`;
}
function nightShade(s) {
  return `<rect x="${s.x}" y="${s.ground - 60}" width="${s.w}" height="${s.y + s.h - s.ground + 60}" fill="#141640" opacity=".38"/>`;
}
var LANTERN2 = outlined(["..k..", ".kkk.", "kyyyk", "kyYyk", "kyyyk", "kkkkk"]);
function lanternAndFireflies(s) {
  const lx = s.x + s.w - 34;
  const ly = s.ground - 16;
  const glow = `<circle class="pf-glow" cx="${lx + 7}" cy="${ly + 8}" r="30" fill="url(#pf-glow)"/>`;
  const lantern2 = renderPixels([{ x: 0, y: 0, grid: LANTERN2 }], { k: "#3b2a1a", y: "#ffd27a", Y: "#fff3c4", o: "#1a120a" }, { x: lx, y: ly, scale: 2 });
  const flies = [[30, 70, 0], [90, 40, 1.4], [150, 60, 2.2], [60, 96, 0.8]].map(([x, y, d]) => `<rect class="pf-firefly" style="animation-delay:-${d}s" x="${s.x + x}" y="${s.y + y}" width="2" height="2" fill="#fff59d"/>`).join("");
  return glow + lantern2 + flies;
}
function cushion(x, ground2, w) {
  const cw = w + 20;
  const cx = x - 10;
  const b = new RectBatch().add("#3e3576", cx + 4, ground2 - 8, cw - 8, 14).add("#3e3576", cx, ground2 - 4, cw, 8).add("#8a7ce0", cx + 5, ground2 - 7, cw - 10, 11).add("#8a7ce0", cx + 1, ground2 - 3, cw - 2, 5).add("#b3a8f0", cx + 8, ground2 - 6, cw - 16, 2);
  return b.toString();
}
function quilt(w, h, scale, chin) {
  const top = Math.max(Math.round(h * 0.62 / scale), chin) * scale;
  const tile = 2 * scale;
  const left = -scale / 2;
  const right = w + scale / 2;
  const bottom = h + scale / 2;
  const b = new RectBatch();
  b.add("#6b2d3a", left + scale, top - scale / 2, right - left - 2 * scale, scale / 2);
  b.add("#6b2d3a", left, top, right - left, bottom - top);
  let row2 = 0;
  for (let y = top; y < bottom - scale / 2; y += tile, row2++) {
    let col = 0;
    const inset = row2 === 0 ? scale : scale / 2;
    for (let x = left + inset; x < right - inset; x += tile, col++) {
      const light3 = (row2 + col) % 2 === 0;
      b.add(light3 ? "#f4a3a0" : "#e27d7d", r(x), r(y), r(Math.min(tile, right - inset - x)), r(Math.min(tile, bottom - scale / 2 - y)));
    }
  }
  b.add("#fff4e6", left + scale, top, right - left - 2 * scale, Math.max(1, scale / 2));
  return b.toString();
}
function bedtimeZs(box) {
  const zed = outlined(ZED);
  return [
    [0.72, -4, 2, 0],
    [0.72, -12, 2.5, 1.1],
    [0.72, -22, 3, 2.2]
  ].map(
    ([fx2, dy, s, d]) => `<g class="pf-snooze" style="animation-delay:-${d}s">${renderPixels([{ x: 0, y: 0, grid: zed }], { z: "#ffffff", o: "#2a2d6b" }, { x: r(box.x + box.w * fx2 + (s - 2) * 6), y: r(box.y + dy), scale: s })}</g>`
  ).join("");
}
var NIGHT_CSS = `
.pf-glow{animation:pf-glow 2.8s ease-in-out infinite}
@keyframes pf-glow{0%,100%{opacity:.85}45%{opacity:1}55%{opacity:.7}}
.pf-firefly{animation:pf-firefly 4s ease-in-out infinite}
@keyframes pf-firefly{0%,100%{opacity:.2;transform:translate(0,0)}50%{opacity:1;transform:translate(6px,-8px)}}
.pf-snooze{opacity:0;animation:pf-snooze 3.3s ease-out infinite}
@keyframes pf-snooze{0%{opacity:0;transform:translate(0,4px)}20%{opacity:1}100%{opacity:0;transform:translate(10px,-22px)}}
`;

// src/pet/render.ts
var W2 = 480;
var H2 = 190;
var SCENE = { x: 12, y: 12, w: 200, h: 166 };
var GROUND_Y = SCENE.y + SCENE.h - 34;
var AREA = { x: SCENE.x, y: SCENE.y, w: SCENE.w, ground: GROUND_Y };
var PANEL_X = 230;
var PANEL_RIGHT = W2 - 16;
var SANS2 = "'Segoe UI',Ubuntu,'Helvetica Neue',sans-serif";
var MONO2 = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
var CSS2 = `${SPRITE_CSS}
.pf-walk{animation:pf-walk 9s ease-in-out infinite}
.pf-turn{transform-box:fill-box;transform-origin:center;animation:pf-turn 9s steps(1) infinite}
@keyframes pf-turn{0%{transform:scaleX(1)}45%{transform:scaleX(-1)}95%{transform:scaleX(1)}}
@keyframes pf-walk{0%,100%{transform:translateX(-34px)}40%,50%{transform:translateX(34px)}90%{transform:translateX(-34px)}}
.pf-jump{animation:pf-jump .9s ease-in-out infinite}
@keyframes pf-jump{0%,70%,100%{transform:translateY(0)}10%{transform:translateY(2px)}40%{transform:translateY(-16px)}}
.pf-shadow{transform-box:fill-box;transform-origin:center}
.pf-jump-shadow{animation:pf-jump-shadow .9s ease-in-out infinite}
@keyframes pf-jump-shadow{0%,70%,100%{transform:scaleX(1);opacity:.35}40%{transform:scaleX(.55);opacity:.15}}
.pf-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:pf-breathe 3.2s ease-in-out infinite}
.pf-idle-breathe{transform-box:fill-box;transform-origin:50% 100%;animation:pf-idle-breathe 3.8s ease-in-out infinite}
@keyframes pf-idle-breathe{0%,100%{transform:none}50%{transform:scale(1.015,.98)}}
@keyframes pf-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.93)}}
.pf-shiver{animation:pf-shiver 2.6s linear infinite}
@keyframes pf-shiver{0%,60%,80%,100%{transform:translateX(0)}64%,72%{transform:translateX(-2px)}68%,76%{transform:translateX(2px)}}
.pf-wobble{transform-box:fill-box;transform-origin:50% 100%;animation:pf-wobble 2.4s ease-in-out infinite}
@keyframes pf-wobble{0%,55%,100%{transform:rotate(0)}65%{transform:rotate(-9deg)}75%{transform:rotate(8deg)}85%{transform:rotate(-4deg)}92%{transform:rotate(2deg)}}
.pf-rise{animation:pf-rise 2.7s ease-out infinite}
@keyframes pf-rise{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(8px,-38px);opacity:0}}
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 1.8s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.15;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
.pf-star{opacity:var(--pf-stars)}
.pf-day{opacity:calc(.85 - var(--pf-stars) * .85)}
.pf-cloud{animation:pf-cloud 80s linear infinite}
@keyframes pf-cloud{from{transform:translateX(var(--from))}to{transform:translateX(var(--to))}}
.pf-shoot{opacity:0;animation:pf-shoot 11s ease-in infinite}
@keyframes pf-shoot{0%,88%{opacity:0;transform:translate(0,0)}90%{opacity:1}97%,100%{opacity:0;transform:translate(-60px,28px)}}
${SEASON_CSS}
${WEATHER_CSS}
${SCENERY_CSS}
${BACKDROP_CSS}
${CARE_CSS}
${VISIT_CSS}
${NIGHT_CSS}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;
var TRICK_PREVIEW_SHIFT = 7.6;
var round2 = (n) => Math.round(n * 100) / 100;
function compact(n) {
  if (n < 1e3) return String(n);
  if (n < 1e4) return `${round2(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1e6) return `${Math.round(n / 1e3)}k`;
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
}
var LEAF_COLORS = ["#e76f51", "#f4a261", "#d62828", "#e9c46a"];
var STARS3 = [
  [28, 26, 0],
  [62, 44, 0.7],
  [96, 22, 1.3],
  [138, 38, 0.4],
  [178, 24, 1.1],
  [196, 56, 0.2],
  [44, 70, 1.5]
];
function skyLife() {
  const { x, y, w } = SCENE;
  const cloud3 = (cx, cy, size) => new RectBatch().add("#ffffff", cx, cy, 14 * size, 4 * size).add("#ffffff", cx + 3 * size, cy - 3 * size, 7 * size, 3 * size).add("#ffffff", cx + 2 * size, cy + 4 * size, 11 * size, 2 * size).toString();
  return `<g class="pf-day"><g class="pf-cloud" style="--from:${-x - 20}px;--to:${w + 10}px;animation-duration:70s;animation-delay:-20s">${cloud3(x, y + 30, 2)}</g><g class="pf-cloud" style="--from:${-x - 20}px;--to:${w + 10}px;animation-duration:95s;animation-delay:-70s">${cloud3(x, y + 58, 1.5)}</g></g><g class="pf-star"><g class="pf-shoot"><rect x="${x + w - 40}" y="${y + 14}" width="14" height="1.5" fill="#ffffff" transform="rotate(-25 ${x + w - 33} ${y + 15})"/></g></g>`;
}
function scene(state, world2, filterAttr = "") {
  const { x, y, w, h } = SCENE;
  const stars = STARS3.map(
    ([sx, sy, delay]) => `<rect class="pf-twinkle" style="animation-delay:-${delay}s" x="${sx}" y="${sy}" width="3" height="3" fill="#fff"/>`
  ).join("");
  const overcast2 = world2.weather === "clear" ? "" : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1b2033" opacity=".28"/><g opacity=".85" fill="#6f7689"><rect x="${x + 6}" y="${y + 22}" width="66" height="12"/><rect x="${x + 20}" y="${y + 14}" width="30" height="10"/><rect x="${x + 110}" y="${y + 34}" width="80" height="12"/><rect x="${x + 128}" y="${y + 26}" width="36" height="10"/></g>`;
  return `
<defs>
  <clipPath id="pf-clip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-sky-bottom)"/>
  </linearGradient>
  <linearGradient id="pf-fog" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d7deea" stop-opacity="0"/><stop offset=".5" stop-color="#d7deea"/><stop offset="1" stop-color="#d7deea" stop-opacity="0"/>
  </linearGradient>
</defs>
<g clip-path="url(#pf-clip)"${filterAttr}>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pf-sky)"/>
  ${world2.night ? nightSky({ ...SCENE, ground: GROUND_Y }) : world2.weather === "clear" ? `<g class="pf-star">${stars}</g>${skyLife()}` : overcast2}
  ${backdrop(terrainFor(state.species), AREA, world2.night, world2.season)}
  <rect x="${x}" y="${GROUND_Y}" width="${w}" height="${y + h - GROUND_Y}" style="fill:var(--pf-ground)"/>
  ${groundCover(state.species, AREA, y + h, LOOKS[world2.season].snow)}
  ${props(state.species, AREA)}
  ${ambient(state.species, AREA, world2.night).svg}
  ${world2.night ? nightShade({ ...SCENE, ground: GROUND_Y }) : ""}`;
}
function foreground(world2, rng) {
  const look = LOOKS[world2.season];
  const particles2 = world2.weather === "rain" && world2.season !== "winter" ? rain(rng, AREA) : fallingParticles(look, rng, AREA);
  return [
    world2.weather === "clear" && !world2.night ? fireflies(look, rng, AREA) : "",
    particles2,
    world2.weather === "fog" ? fog(AREA) : ""
  ].join("");
}
function positionFor(widthPx, heightPx, scale) {
  return {
    x: SCENE.x + SCENE.w / 2 - widthPx / 2,
    y: GROUND_Y - heightPx + scale,
    w: widthPx,
    h: heightPx
  };
}
function shadow2(box, mood) {
  const cls = mood === "happy" ? "pf-shadow pf-jump-shadow" : "pf-shadow";
  const sw = box.w * 0.8;
  return `<rect class="${cls}" x="${box.x + (box.w - sw) / 2}" y="${box.y + box.h - 2}" width="${sw}" height="6" rx="3" opacity=".35" style="fill:var(--pf-ground-dark)"/>`;
}
function goodbye() {
  const cx = SCENE.x + SCENE.w / 2;
  const b = new RectBatch().add("#8a5a33", cx - 2, GROUND_Y - 30, 4, 34).add("#fbf3e4", cx - 16, GROUND_Y - 52, 32, 24).add("#5b4636", cx - 16, GROUND_Y - 52, 32, 2).add("#c9b79a", cx - 12, GROUND_Y - 45, 22, 2).add("#c9b79a", cx - 12, GROUND_Y - 40, 18, 2).add("#c9b79a", cx - 12, GROUND_Y - 35, 20, 2).add("#e63946", cx + 8, GROUND_Y - 36, 4, 4);
  const steps = new RectBatch();
  for (let i = 0; i < 6; i++) {
    const x = cx + 14 + i * 14;
    const y = GROUND_Y + 10 + i % 2 * 5;
    steps.add("#3b2a1a", x, y, 4, 3).add("#3b2a1a", x + 5, y - 2, 2, 2);
  }
  return { svg: `${b}<g opacity=".3">${steps}</g>`, box: { x: cx - 16, y: GROUND_Y - 52, w: 32, h: 56 } };
}
function pet(state, art = {}, world2) {
  if (art.replace) return { svg: art.replace, box: { x: SCENE.x, y: SCENE.y, w: 0, h: 0 } };
  if (state.ranAway) return goodbye();
  const scale = state.stage === "baby" ? 3 : 4;
  const visits = activeVisits(state);
  if (visits.length) {
    const face = state.mood === "sleeping" ? state : { ...state, mood: "happy" };
    const scenes = visits.map(({ action }) => {
      const sprite2 = renderPetSprite(face, scale, { lively: false, hat: art.hat, face: art.face });
      if (action !== "bath") sprite2.svg += careOverlay(state.care, sprite2.width, sprite2.height, scale);
      return visitScene(action, state, sprite2, scale, { cx: SCENE.x + SCENE.w / 2, ground: GROUND_Y });
    });
    if (scenes.length === 1) return scenes[0];
    return {
      svg: scenes.map((sc, k) => `<g class="pf-turn${k}">${sc.svg}</g>`).join(""),
      box: scenes[0].box,
      css: scenes.map((sc) => sc.css ?? "").join("\n")
    };
  }
  if (state.stage === "egg") {
    const sprite2 = renderPetSprite(state, scale);
    const box2 = positionFor(sprite2.width, sprite2.height, scale);
    const wobble = state.mood === "happy" || state.mood === "idle" ? "pf-wobble" : "";
    return { svg: `${shadow2(box2, "idle")}<g transform="translate(${box2.x} ${box2.y})"><g class="${wobble}">${sprite2.svg}</g></g>`, box: box2 };
  }
  const species = getSpecies(state.species);
  const w = species.width * scale;
  const h = species.height * scale;
  const life = lifeFor(state.mood, species, scale, w, h, state.date, state.login, { crossed: art.crossed });
  const asleep = state.mood === "sleeping";
  const winter = world2?.season === "winter";
  const sprite = renderPetSprite(state, scale, { emote: false, eyes: life.eyes, hat: art.hat ?? (asleep ? NIGHTCAP : winter ? BEANIE : void 0), face: art.face });
  const rainy = world2?.weather === "rain" && !asleep;
  const leaf2 = world2?.season === "autumn" && !asleep && !art.hat ? autumnLeaf(species, scale, LEAF_COLORS[(state.date.charCodeAt(9) + state.login.length) % LEAF_COLORS.length]) : "";
  const dust = state.mood === "happy" ? landingDust(w, h) : "";
  let body = sprite.svg + careOverlay(state.care, w, h, scale) + (asleep ? quilt(w, h, scale, anchors(species).mouth.y) : "") + (art.held ?? "");
  if (life.faceClass) body = `<g class="${life.faceClass}">${body}</g>`;
  for (const cls of life.bodyClasses) body = `<g class="${cls}">${body}</g>`;
  if (art.bodyClass) body = `<g class="${art.bodyClass}">${body}</g>`;
  const box = positionFor(w, h, scale);
  const inner = state.mood === "happy" ? "pf-jump" : state.mood === "sleeping" ? "pf-breathe" : "pf-idle-breathe";
  const sparkles = state.stage === "legendary" ? legendarySparkles({ x: 0, y: 0, w, h }) : "";
  const props2 = state.mood === "hungry" ? emptyBowl(box.x + w + 12, GROUND_Y) : "";
  return {
    svg: `${props2}<g class="${life.pathClass}">${art.follow ?? ""}${asleep ? cushion(box.x, GROUND_Y + scale, w) : shadow2(box, state.mood)}<g transform="translate(${box.x} ${box.y})">${dust}<g class="${inner}">${body}${leaf2}</g>${rainy ? umbrella(species, scale) : ""}${life.overlay}${art.over ?? ""}${sparkles}</g></g>`,
    box,
    css: life.css + (sprite.css ?? "") + (rainy || leaf2 || dust ? WEAR_CSS : "")
  };
}
function fx(grid, x, y, scale, cls, delay) {
  return `<g class="${cls}" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid }], FX_PALETTE, { x: round2(x), y: round2(y), scale })}</g>`;
}
function zzz(box) {
  return [
    fx(ZED, box.x + box.w * 0.7, box.y - 2, 2, "pf-rise", 0),
    fx(ZED, box.x + box.w * 0.7 + 6, box.y - 8, 2.5, "pf-rise", 0.9),
    fx(ZED, box.x + box.w * 0.7 + 12, box.y - 14, 3, "pf-rise", 1.8)
  ].join("");
}
function legendarySparkles(box) {
  const spots = [
    [-14, 6, 0],
    [box.w + 4, 0, 0.6],
    [-8, box.h - 18, 1.1],
    [box.w + 2, box.h - 26, 1.5]
  ];
  return spots.map(([dx, dy, delay]) => fx(SPARKLE, box.x + dx, box.y + dy, 2, "pf-twinkle", delay)).join("");
}
function effects(state, box) {
  if (state.ranAway) return "";
  const out = [];
  const left = (state.care?.visitors ?? []).map((v) => v.action);
  if (state.mood === "sleeping" && left.includes("feed")) out.push(bowl(SCENE.x + 14, GROUND_Y));
  if (state.mood === "sleeping" && left.includes("play")) out.push(ball(SCENE.x + SCENE.w - 26, GROUND_Y));
  if (activeVisit(state) && state.mood !== "sleeping") return state.stage === "legendary" ? legendarySparkles(box) : "";
  if (state.stage !== "egg") {
    if (state.mood === "sleeping") out.push(bedtimeZs(box));
    return out.join("");
  }
  switch (state.mood) {
    case "happy":
      out.push(
        fx(HEART, box.x + box.w * 0.1, box.y, 2, "pf-rise", 0.3),
        fx(HEART, box.x + box.w * 0.5, box.y - 6, 2, "pf-rise", 1.2),
        fx(HEART, box.x + box.w * 0.85, box.y + 4, 2, "pf-rise", 2.1)
      );
      break;
    case "sleeping":
      out.push(zzz(box));
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
  return out.join("");
}
function bar(label, ratio, value, y, color, charging = false) {
  const segments = 10;
  const filled = ratio <= 0 ? 0 : Math.max(1, Math.min(segments, Math.round(ratio * segments)));
  const x0 = PANEL_X + 30;
  let segs = "";
  for (let i = 0; i < segments; i++) {
    const fill = i < filled ? color : "var(--pf-bar-empty)";
    segs += `<rect x="${x0 + i * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${fill}"/>`;
  }
  const glint = filled ? `<rect class="pf-glint" style="--w:${filled * 14 - 4}px" x="${x0}" y="${y - 9}" width="3" height="10" fill="#ffffff" opacity="0"/>` : "";
  const next = charging && filled < segments ? `<rect class="pf-charge" x="${x0 + filled * 14}" y="${y - 9}" width="12" height="10" rx="1.5" style="fill:${color}"/>` : "";
  return `
  <text x="${PANEL_X}" y="${y}" class="pf-label">${label}</text>${segs}${next}${glint}
  <text x="${PANEL_RIGHT}" y="${y}" class="pf-value" text-anchor="end">${escapeXml(value)}</text>`;
}
var STAT_ICONS = {
  STR: [["......s", "....ss.", "...ss..", "g.ss...", ".gs....", "hg.....", "h......"], { s: "#ced4da", g: "#fab005", h: "#8a5a33" }],
  INT: [["bbbbbbb", "bwwbwwb", "bwwbwwb", "bwwbwwb", "bbbbbbb"], { b: "#4dabf7", w: "#f1f3f5" }],
  CHA: [[".hh.hh.", "hhhhhhh", "hhhhhhh", ".hhhhh.", "..hhh..", "...h..."], { h: "#ff6b8b" }],
  DEX: [["..bbb..", "..bbb..", "..bbbb.", "..bbbbb", "bbbbbbb", "ddddddd"], { b: "#c0803a", d: "#5c3d2e" }]
};
function moodLine(state, special) {
  if (state.ranAway) return "Ran away \xB7 a commit will bring it home";
  const visit2 = visitorLine(state.care);
  if (visit2) return visit2;
  if (special && (state.mood === "happy" || state.mood === "idle" || state.stage === "egg")) return special;
  if (state.stage === "egg") return "Egg \xB7 hatches at Lv.3";
  const d = state.daysSinceLastContribution;
  switch (state.mood) {
    case "happy":
      return state.streak >= 2 ? `Happy \xB7 ${state.streak}-day streak!` : "Happy \xB7 on a roll!";
    case "idle":
      return "Idle \xB7 just vibing";
    case "hungry":
      return `Hungry \xB7 ${d} days without commits`;
    case "sleeping":
      return d >= 365 ? "Zzz \xB7 deep hibernation" : `Zzz \xB7 asleep for ${d} days`;
  }
}
function moodIcon(state) {
  const icon = (grid, color, cls, w) => `<g class="${cls}">${renderPixels([{ x: 0, y: 0, grid }], { x: color }, { x: PANEL_X + (10 - w) / 2, y: 164, scale: 2 })}</g>`;
  if (state.ranAway) return icon(["xx..", "xx..", "....", "..xx", "..xx"], "var(--pf-muted)", "pf-icon-step", 4 * 2);
  if (state.stage === "egg") return icon([".xx.", "xxxx", "xxxx", ".xx."], "#e0cfb1", "pf-icon-wobble", 4 * 2);
  switch (state.mood) {
    case "happy":
      return icon(["xx.xx", "xxxxx", ".xxx.", "..x.."], "#ff5c7a", "pf-icon-beat", 5 * 2);
    case "idle":
      return icon(["..xx", "..x.", "..x.", "xxx.", "xx.."], "var(--pf-accent)", "pf-icon-bob", 4 * 2);
    case "hungry":
      return icon(["x...x", "xxxxx", ".xxx."], "#e05252", "pf-icon-shake", 5 * 2);
    case "sleeping":
      return icon(["xxx", "..x", ".x.", "x..", "xxx"], "var(--pf-muted)", "pf-icon-doze", 3 * 2);
  }
}
function statusLines(state, special) {
  const visitors = state.ranAway ? [] : state.care?.visitors ?? [];
  if (visitors.length < 2) return `<text x="${PANEL_X + 16}" y="174" class="pf-mood">${escapeXml(moodLine(state, special))}</text>`;
  return visitors.map((v, k) => `<text x="${PANEL_X + 16}" y="174" class="pf-mood pf-turn${k}">${escapeXml(lineFor(v))}</text>`).join("");
}
function panel(state, special) {
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
    ([label, value], i) => {
      const [icon, colors] = STAT_ICONS[label];
      const x = PANEL_X + i * 60;
      return `${renderPixels([{ x: 0, y: 0, grid: icon }], colors, { x, y: 128 - 1.5 * icon.length, scale: 1.5 })}<text x="${x + 13}" y="128" class="pf-label">${label}</text><text x="${x}" y="147" class="pf-stat">${value}</text>`;
    }
  ).join("");
  return `
<g>
  <text x="${PANEL_X}" y="40" class="pf-name">${escapeXml(state.petName)}</text>
  <clipPath id="pf-name-clip"><text x="${PANEL_X}" y="40" class="pf-name">${escapeXml(state.petName)}</text></clipPath>
  <g clip-path="url(#pf-name-clip)"><g class="pf-shine"><rect transform="skewX(-20)" x="${PANEL_X - 8}" y="20" width="10" height="26" style="fill:var(--pf-accent)" opacity=".75"/></g></g>
  <text x="${PANEL_X}" y="61" class="pf-class"><tspan class="pf-accent">Lv.${state.level} ${star}${escapeXml(state.className)}</tspan><tspan class="pf-muted">${escapeXml(lang)}</tspan></text>
  ${bar("HP", state.activeDays14 / 14, `${state.activeDays14}/14d`, 88, "var(--pf-hp)")}
  ${bar("EXP", xpRatio, `${compact(state.xp)}/${compact(state.xpNextLevel)}`, 108, "var(--pf-exp)", state.level < 99)}
  ${stats}
  ${moodIcon(state)}
  ${statusLines(state, special)}
</g>`;
}
function surprise(state, season) {
  const id = surpriseFor(state, season);
  if (!id) return null;
  const visiting = !!activeVisit(state);
  if (visiting && !HOLIDAYS.includes(id) && id !== "birthday") return null;
  const where = state.ranAway ? "away" : visiting ? "visit" : state.stage === "egg" ? "egg" : "pet";
  const drawn = id === "april-fools" && (where === "pet" || where === "visit") ? { ...state, species: disguiseFor(state) } : state;
  const species = getSpecies(drawn.species);
  const scale = state.stage === "baby" ? 3 : 4;
  const w = (state.stage === "egg" ? EGG[0].length : species.width) * scale;
  const h = (state.stage === "egg" ? EGG.length : species.height) * scale;
  const ctx = { state: drawn, species, scale, box: positionFor(w, h, scale), scene: { ...SCENE, ground: GROUND_Y }, season, rng: seeded(`${id}:${state.login}:${state.date}`) };
  return { shown: showSurprise(id, ctx, where), state: drawn };
}
function renderPetCard(original, options = {}) {
  const world2 = {
    season: options.season ?? seasonFor(original.date, options.hemisphere),
    weather: original.mood === "sleeping" && !original.ranAway ? "clear" : weatherFor(original.daysSinceLastContribution),
    night: original.mood === "sleeping" && !original.ranAway
  };
  const today = surprise(original, world2.season);
  const state = today?.state ?? original;
  const art = today?.shown.art ?? {};
  const creature = pet(state, art, world2);
  const visitors = original.ranAway ? 0 : original.care?.visitors?.length ?? 0;
  const turns = visitors > 1 ? visitors : 0;
  const filter = themeFilter(options.theme);
  const title = `${original.petName}, ${original.login}'s ProfileForge pet`;
  const desc = `Level ${original.level} ${original.className} ${original.species}, feeling ${original.mood}. ${original.streak}-day streak.`;
  const border = options.hideBorder ? "" : `<rect x=".5" y=".5" width="${W2 - 1}" height="${H2 - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  return pruneSvgStyle(`<svg xmlns="http://www.w3.org/2000/svg" class="pf"${original.trick ? ` style="--pf-t0:-${TRICK_PREVIEW_SHIFT}s"` : ""} width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${escapeXml(title)}</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}
.pf-name{font:700 20px ${SANS2};fill:var(--pf-title)}
.pf-class{font:700 13px ${SANS2}}
.pf-accent{fill:var(--pf-accent)}
.pf-muted{fill:var(--pf-muted);font-weight:400}
.pf-label{font:700 11px ${MONO2};fill:var(--pf-muted)}
.pf-value{font:400 11px ${MONO2};fill:var(--pf-text)}
.pf-stat{font:700 16px ${MONO2};fill:var(--pf-text)}
.pf-mood{font:400 12px ${SANS2};fill:var(--pf-muted)}
.pf-icon-beat,.pf-icon-wobble,.pf-icon-shake{transform-box:fill-box;transform-origin:center}
.pf-icon-beat{animation:pf-icon-beat 1.2s ease-in-out infinite}
@keyframes pf-icon-beat{0%,45%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1.1)}}
.pf-icon-bob{animation:pf-icon-bob 1.6s ease-in-out infinite alternate}
@keyframes pf-icon-bob{to{transform:translateY(-2px)}}
.pf-icon-shake{animation:pf-icon-shake 2.4s linear infinite}
@keyframes pf-icon-shake{0%,70%,100%{transform:none}75%,85%{transform:rotate(-12deg)}80%,90%{transform:rotate(12deg)}}
.pf-icon-doze{animation:pf-icon-doze 3s ease-in-out infinite}
@keyframes pf-icon-doze{0%,100%{opacity:1;transform:none}50%{opacity:.4;transform:translate(1px,-2px)}}
.pf-icon-wobble{animation:pf-icon-shake 3s linear infinite}
.pf-icon-step{animation:pf-icon-doze 2s steps(2) infinite}
.pf-shine{animation:pf-shine 7s ease-in-out infinite}
@keyframes pf-shine{0%,70%{transform:translateX(0)}100%{transform:translateX(210px)}}
.pf-glint{animation:pf-glint 5s ease-in-out infinite}
@keyframes pf-glint{0%,60%{transform:translateX(0);opacity:0}64%{opacity:.6}96%{opacity:.6}100%{transform:translateX(var(--w));opacity:0}}
.pf-charge{animation:pf-charge 2.4s ease-in-out infinite}
@keyframes pf-charge{0%,100%{opacity:.12}50%{opacity:.45}}
${CSS2}${turnCss(turns)}${ambient(original.species, AREA).css}${creature.css ?? ""}${today?.shown.css ?? ""}</style>
${filter.defs}
<rect width="${W2}" height="${H2}" rx="10" style="fill:var(--pf-bg)"/>
${border}
${scene(original, world2, filter.attr)}
  ${world2.night ? lanternAndFireflies({ ...SCENE, ground: GROUND_Y }) : ""}
  ${art.back ?? ""}
  <g>
  ${creature.svg}
  ${art.replace ? "" : effects(state, creature.box)}
  </g>
  ${art.front ?? ""}
  ${foreground(world2, seeded(`pet:${state.login}`))}
  ${today?.shown.banner ?? ""}
</g>
${panel(original, art.line)}
</svg>`);
}

// src/widgets.ts
var world = (p) => ({ theme: p.theme, hideBorder: p.hideBorder, season: p.season, hemisphere: p.hemisphere });
var cityPet = (p) => p.showPet ? { petName: p.petName, species: p.species, runaway: p.runaway } : false;
function renderWidget(profile, params, care) {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") {
    const city = computeCityState(profile, cityPet(params));
    if (care && city.pet) city.pet = applyCare(city.pet, care.state, care.now, care.rules);
    return renderCityCard(city, { ...style, season: params.season, hemisphere: params.hemisphere });
  }
  const pet2 = computePetState(profile, { petName: params.petName, species: params.species, runaway: params.runaway });
  return renderPetCard(care ? applyCare(pet2, care.state, care.now, care.rules) : pet2, world(params));
}

// src/action/generate.ts
function parseOutputs(text2) {
  const specs = text2.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
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
async function generate({ user, token, outputs, workspace, fetch: fetch2 = fetchProfile, care }) {
  const targets = outputs.map((o) => ({ ...o, full: resolveInside(workspace, o.path) }));
  const profile = await fetch2(user, token);
  for (const { full, params } of targets) {
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, renderWidget(profile, params, care));
  }
  const pet2 = targets.find((t) => t.params.widget === "pet")?.params;
  const plain = computePetState(profile, { petName: pet2?.petName, species: pet2?.species, runaway: pet2?.runaway });
  const state = care ? applyCare(plain, care.state, care.now, care.rules) : plain;
  return { files: targets.map((t) => t.full), state };
}

// src/action/care.ts
var ACTIONS_BOT = "github-actions[bot]";
var HOUSE_SUFFIX = "'s house \u{1F3E0}";
var save = async (file, state) => {
  await mkdir2(dirname2(file), { recursive: true });
  await writeFile2(file, serializeCareState(state));
};
async function prepareCare({ workspace, file, token, repo, now, house, rules = DEFAULT_RULES, fetch: f = fetch }) {
  if (!file.endsWith(".json")) throw new Error(`care_file "${file}" must be a .json file`);
  const full = resolveInside(workspace, file);
  const warnings = [];
  const text2 = await readFile(full, "utf8").catch(() => null);
  const parsed = parseCareState(text2, now);
  if (parsed.warning) warnings.push(parsed.warning);
  let state = parsed.state;
  if (house !== void 0) state.house.issue = house;
  let issues = [];
  try {
    issues = await listCareIssues(token, repo, f);
  } catch (err) {
    warnings.push(`couldn't list issues (${err.message})`);
  }
  if (state.house.issue === null) {
    const orphan = issues.find((i) => i.login === ACTIONS_BOT && i.title.endsWith(HOUSE_SUFFIX));
    if (orphan) state.house.issue = orphan.number;
  }
  let handled = [];
  if (state.house.issue !== null) {
    try {
      const comments = await listHouseComments(
        token,
        repo,
        state.house.issue,
        { since: state.house.cursorAt, after: state.house.cursor, want: LIMITS.perRun },
        f
      );
      ({ state, handled } = applyComments(state, comments, now, rules));
    } catch (err) {
      warnings.push(`couldn't read the house's comments, skipping visits this run (${err.message})`);
    }
  }
  const owner = repo.split("/")[0].toLowerCase();
  const strays = issues.filter((i) => i.number !== state.house.issue && i.userType === "User" && i.login.toLowerCase() !== owner);
  await save(full, state);
  return { care: { state, now, rules }, file: full, handled, strays, warnings };
}
async function ensureHouse(prepared, token, repo, petName, f = fetch) {
  const { state } = prepared.care;
  if (state.house.issue !== null) return null;
  const { title, body } = houseIssue(petName, prepared.care.rules);
  const number = await createIssue(token, repo, title, body, f);
  state.house.issue = number;
  await save(prepared.file, state);
  return number;
}
async function answerCare(token, repo, prepared, petName, f = fetch) {
  const warnings = [];
  for (const { comment: c, outcome } of prepared.handled) {
    try {
      await react(token, repo, c.id, reactionFor(outcome), f);
    } catch (err) {
      warnings.push(err.message);
    }
  }
  const house = prepared.care.state.house.issue;
  if (house !== null) {
    for (const stray of prepared.strays) {
      try {
        await comment(token, repo, stray.number, redirectReply(petName, house), f);
        await close(token, repo, stray.number, f);
      } catch (err) {
        warnings.push(err.message);
      }
    }
  }
  return warnings;
}

// src/action/log.ts
function escapeCommand(text2) {
  return text2.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
var warn = (message) => console.log(`::warning title=ProfileForge::${escapeCommand(message)}`);
var fail = (message) => console.log(`::error title=ProfileForge::${escapeCommand(message)}`);

// src/action/main.ts
function input(name) {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? "").trim();
}
function appendTo(envFile, text2) {
  const path = process.env[envFile];
  if (path) appendFileSync(path, text2 + "\n");
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
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  let prepared;
  if (input("care") === "true") {
    const house2 = input("care_issue");
    if (house2 && !/^[1-9]\d{0,9}$/.test(house2)) throw new Error(`care_issue "${house2}" is not an issue number`);
    prepared = await prepareCare({
      workspace,
      file: input("care_file") || "profileforge/care.json",
      token,
      repo,
      now: /* @__PURE__ */ new Date(),
      house: house2 ? Number(house2) : void 0,
      rules: parseRules(input("care_actions"), input("dirt"))
    });
    prepared.warnings.forEach(warn);
  }
  const { files, state } = await generate({ user, token, outputs, workspace, care: prepared?.care });
  const mood = `${state.petName} is ${state.mood} \xB7 Lv.${state.level} ${state.className} (${state.stage})`;
  console.log(`\u{1F980} ${mood}`);
  for (const f of files) console.log(`  wrote ${relative2(workspace, f)}`);
  let opened = null;
  if (prepared) {
    try {
      opened = await ensureHouse(prepared, token, repo, state.petName);
    } catch (err) {
      warn(`couldn't open the pet's house (${err.message})`);
    }
  }
  const house = prepared?.care.state.house.issue;
  const visits = prepared ? ` \xB7 Visits: ${prepared.handled.length}${house ? ` \xB7 House: ${houseLink(repo, house)}` : ""}` : "";
  if (opened) console.log(`\u{1F3E0} Opened ${state.petName}'s house: ${houseLink(repo, opened)}. Link to it from your README!`);
  appendTo("GITHUB_STEP_SUMMARY", `### \u{1F980} ${mood}

Streak: ${state.streak} days \xB7 XP: ${state.xp}${visits}`);
  appendTo("GITHUB_OUTPUT", `mood=${state.mood}
level=${state.level}
stage=${state.stage}`);
  if (input("commit") !== "false") {
    const toCommit = prepared ? [...files, prepared.file] : files;
    commitAndPush(workspace, toCommit, input("commit_message") || "chore: feed the ProfileForge pet");
  }
  if (prepared) (await answerCare(token, repo, prepared, state.petName)).forEach(warn);
}
main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
