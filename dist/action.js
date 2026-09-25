// src/action/main.ts
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative as relative2 } from "node:path";

// src/city/layout.ts
var W = 800;
var H = 260;
var U = 2;
var BASE_Y = 226;
var ROAD_Y = 230;
var BUILDING_W = 7 * U;
var FLOOR_H = 3 * U;
var MAX_FLOORS = 21;
var RIGHT_EDGE = W - 28;

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
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
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

// src/pet/species/chick.ts
var BODY = [
  "....oooooo....",
  "..oohyyyyyoo..",
  ".ohyyyyyyyyyo.",
  ".oyyyyyyyyyyo.",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  "oyyyyyyyyyyyyo",
  ".oyyyyyyyyyyo.",
  "..oyyyyyyyyo..",
  "...oooooooo..."
];
var WING = ["oo.", "oyo", "oyo", ".oo"];
var WING_UP = [".oo", "oyo", "oo."];
var FOOT = ["b.b", "bbb"];
var wings = (grid, y) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var feet = (leftY = 13) => [layer(5, leftY, FOOT), layer(10, 13, FOOT)];
var eyes = (grid, x = 5) => [layer(x, 5, grid), layer(x + 6, 5, grid)];
var chick = {
  id: "chick",
  defaultName: "Chirpy",
  width: 18,
  height: 15,
  palette: {
    o: "#5c4400",
    y: "#f7df1e",
    h: "#fff59d",
    b: "#f28c28",
    r: "#c0392b",
    k: "#1a1a1a",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#7a5200",
    y: "#ffd54a",
    h: "#ffffff"
  },
  body: [layer(8, 0, ["oo"]), layer(2, 1, BODY)],
  eyes: {
    open: eyes(["kw", "kk"]),
    happy: eyes([".kk.", "k..k"], 4),
    closed: eyes(["k..k", ".kk."], 4),
    sad: eyes(["oo", "kk"])
  },
  mouths: {
    // Beak open mid-chirp.
    smile: [layer(7, 7, ["bbbb", ".rr.", ".bb."])],
    neutral: [layer(7, 7, ["bbbb", ".bb."])],
    frown: [layer(7, 8, [".bb.", "bbbb"])]
  },
  blush: [layer(3, 7, ["pp"]), layer(13, 7, ["pp"])],
  limbs: {
    // Flapping with joy.
    happy: [
      [...wings(WING, 6), ...feet()],
      [...wings(WING_UP, 4), ...feet()]
    ],
    // Hopping along.
    idle: [
      [...wings(WING, 6), ...feet()],
      [...wings(WING, 6), ...feet(12)]
    ],
    hungry: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet()]
    ],
    sleeping: [
      [...wings(WING, 7), ...feet()],
      [...wings(WING, 7), ...feet()]
    ]
  },
  crownAnchor: { x: 9, y: 0 }
};

// src/pet/species/crab.ts
var BODY2 = [
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
  body: [layer(4, 6, BODY2)],
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

// src/pet/species/elephant.ts
var TORSO = [
  ".oooooooooooo.",
  "obbbbbbbbbbbbo",
  "obbbbbbbbbbbbo",
  "obbbbbbbbbbbbo"
];
var HEAD = [
  "..oooooooo..",
  ".obbbbbbbbo.",
  "obhhbbbbbbbo",
  "obhbbbbbbbbo",
  "obbbbbbbbbbo",
  "obbbbbbbbbbo",
  "obbbbbbbbbbo",
  ".obbbbbbbbo.",
  "..odbbbbdo..",
  "...oobboo..."
];
var TRUNK = ["obbo", "obbo", "obbo", ".oo."];
var EAR = [
  ".ooo.",
  "obbbo",
  "obeeb",
  "obeeb",
  "obeeb",
  "obbeb",
  ".obbb",
  "..ooo"
];
var EAR_FLAP = [
  "..oo.",
  ".obbo",
  ".obeb",
  ".obeb",
  ".obeb",
  ".obbb",
  "..obb",
  "...oo"
];
var FOOT2 = ["obo", "obo", "ooo"];
var ears = (grid, y = 1) => [layer(0, y, grid), layer(15, y, mirror(grid))];
var feet2 = (leftY = 11, rightY = 11) => [layer(4, leftY, FOOT2), layer(13, rightY, FOOT2)];
var pair = (x, y, grid, gap) => [layer(x, y, grid), layer(x + gap, y, grid)];
var elephant = {
  id: "elephant",
  defaultName: "Ellie",
  width: 20,
  height: 14,
  palette: {
    o: "#2d2a4a",
    b: "#8892bf",
    h: "#b7bfe8",
    d: "#6c74a8",
    e: "#d8a7c4",
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
    e: "#ffd98a"
  },
  body: [layer(3, 7, TORSO), layer(4, 0, HEAD), layer(8, 10, TRUNK), layer(7, 10, ["t"]), layer(12, 10, ["t"])],
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
      [...ears(EAR), ...feet2()],
      [...ears(EAR_FLAP), ...feet2()]
    ],
    // Plodding along.
    idle: [
      [...ears(EAR), ...feet2()],
      [...ears(EAR), ...feet2(10, 11)]
    ],
    hungry: [
      [...ears(EAR, 2), ...feet2()],
      [...ears(EAR, 2), ...feet2()]
    ],
    sleeping: [
      [...ears(EAR, 2), ...feet2()],
      [...ears(EAR, 2), ...feet2()]
    ]
  },
  crownAnchor: { x: 10, y: 0 }
};

// src/pet/species/gopher.ts
var BODY3 = [
  "..oooooooooo..",
  ".oghhgggggggo.",
  "oghggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  "oggggggggggggo",
  ".oggggggggggo.",
  "..oooooooooo.."
];
var EAR2 = [".oo", "ogg"];
var SNOUT = [".kk.", "ssss", ".ss."];
var TEETH = layer(7, 11, ["ww"]);
var ARM = ["oo", "og", "oo"];
var FOOT3 = ["osso", "osso", "oooo"];
var eyes3 = (grid) => [layer(2, 4, grid), layer(10, 4, grid)];
var arms = (y = 8) => [layer(0, y, ARM), layer(14, y, mirror(ARM))];
var feet3 = (leftY = 14) => [layer(3, leftY, FOOT3), layer(9, 14, FOOT3)];
var gopher = {
  id: "gopher",
  defaultName: "Gogo",
  width: 16,
  height: 17,
  palette: {
    o: "#1f4e5f",
    g: "#7fd5ea",
    h: "#bdf0fa",
    s: "#f3d6b2",
    k: "#151515",
    w: "#ffffff",
    p: "#ff8fa3"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    g: "#f6c343",
    h: "#fff1a8"
  },
  body: [layer(2, 1, EAR2), layer(11, 1, mirror(EAR2)), layer(1, 2, BODY3), layer(6, 8, SNOUT)],
  eyes: {
    open: eyes3([".oo.", "owko", "owwo", ".oo."]),
    happy: eyes3(["....", ".oo.", "o..o", "...."]),
    closed: eyes3(["....", "....", "o..o", ".oo."]),
    sad: eyes3(["....", "oooo", "owko", ".oo."])
  },
  mouths: {
    smile: [layer(6, 10, ["o..o"]), TEETH],
    neutral: [TEETH],
    frown: [layer(6, 11, ["o..o"]), TEETH]
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
      [...arms(), ...feet3(13)]
    ],
    hungry: [
      [...arms(9), ...feet3()],
      [...arms(9), ...feet3()]
    ],
    sleeping: [
      [...arms(9), ...feet3()],
      [...arms(9), ...feet3()]
    ]
  },
  crownAnchor: { x: 8, y: 1 }
};

// src/pet/species/snake.ts
var HEAD2 = [
  "...oooo...",
  ".oobbbboo.",
  "obbbbbbbbo",
  "obhbbbbbbo",
  "obbbbbbbbo",
  ".oobbbboo.",
  "...obbo..."
];
var COILS = [
  "....oooooooo....",
  "...obbyybbyybo..",
  "..obbyybbyybbyo.",
  "..oooooooooooo..",
  ".obbyybbyybbyybo",
  "obbyybbyybbyybbo",
  "obbyybbyybbyybbo",
  ".oooooooooooooo."
];
var TAIL_UP = layer(18, 9, [".o", "oy", "o."]);
var TAIL_DOWN = layer(18, 11, ["o.", "oy", ".o"]);
var snake = {
  id: "snake",
  defaultName: "Monty",
  width: 20,
  height: 15,
  palette: {
    o: "#1b2f4a",
    b: "#3776ab",
    h: "#6fa3d6",
    y: "#ffd43b",
    w: "#ffffff",
    k: "#111111",
    p: "#ff8fa3",
    r: "#e63946"
  },
  legendaryPalette: {
    o: "#5a3d0a",
    b: "#f6c343",
    h: "#fff1a8",
    y: "#fff8d6"
  },
  body: [layer(2, 7, COILS), layer(5, 0, HEAD2)],
  eyes: {
    open: [layer(7, 2, ["kw", "kk"]), layer(11, 2, ["kw", "kk"])],
    happy: [layer(6, 2, [".k.", "k.k"]), layer(11, 2, [".k.", "k.k"])],
    closed: [layer(6, 2, ["k.k", ".k."]), layer(11, 2, ["k.k", ".k."])],
    sad: [layer(7, 2, ["oo", "kk"]), layer(11, 2, ["oo", "kk"])]
  },
  mouths: {
    // Tongue out!
    smile: [layer(8, 4, ["o..o", ".rr."])],
    neutral: [layer(9, 5, ["oo"])],
    frown: [layer(8, 4, [".oo.", "o..o"])]
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

// src/pet/species/turtle.ts
var SHELL = [
  "...oooooo...",
  ".oohsssssoo.",
  "ohsssddsssso",
  "osssdssdssso",
  "ossdssssdsso",
  "osssddddssso",
  "oeeeeeeeeeeo",
  ".oooooooooo."
];
var HEAD3 = [".oooo.", "oggggo", "oggggo", "oggggo", ".oooo."];
var TAIL = ["oo", ".o"];
var LEG = ["ogo", "ogo", "ooo"];
var legs2 = (back = 4, front = 11) => [layer(back, 9, LEG), layer(front, 9, LEG)];
var turtle = {
  id: "turtle",
  defaultName: "Shelly",
  width: 20,
  height: 12,
  facing: "right",
  palette: {
    o: "#13304f",
    s: "#3178c6",
    h: "#7fb0e8",
    d: "#235a97",
    e: "#9fc3ec",
    g: "#9ad3a8",
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
  body: [layer(1, 7, TAIL), layer(3, 2, SHELL), layer(14, 4, HEAD3)],
  eyes: {
    open: [layer(16, 5, ["kw", "kk"])],
    happy: [layer(16, 5, [".k", "k."])],
    closed: [layer(16, 6, ["kk"])],
    sad: [layer(16, 5, ["oo", "kk"])]
  },
  mouths: {
    smile: [layer(17, 7, ["kk"]), layer(18, 6, ["k"])],
    neutral: [layer(17, 7, ["kk"])],
    frown: [layer(16, 7, ["kk"])]
  },
  blush: [layer(15, 7, ["p"])],
  limbs: {
    // A happy little shuffle.
    happy: [legs2(), legs2(5, 10)],
    // Slow and steady.
    idle: [legs2(), legs2(5, 10)],
    hungry: [legs2(), legs2()],
    // Tucked into its shell.
    sleeping: [[], []]
  },
  crownAnchor: { x: 9, y: 2 }
};

// src/pet/species/index.ts
var SPECIES = { crab, gopher, snake, elephant, chick, turtle };
var BY_LANGUAGE = {
  Rust: "crab",
  Go: "gopher",
  Python: "snake",
  "Jupyter Notebook": "snake",
  PHP: "elephant",
  JavaScript: "chick",
  TypeScript: "turtle"
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
function computePetState(profile, options = {}) {
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
  return {
    login: profile.login,
    date: profile.calendar.at(-1)?.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
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
    ranAway: level >= 3 && daysSinceLastContribution(profile.calendar) >= RUN_AWAY_DAYS
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
function parseTitle(title) {
  if (title.length > 256) return null;
  const match = /^\s*profileforge\s*:\s*([a-z]+)?/i.exec(title);
  if (!match) return null;
  const word = (match[1] ?? "").toLowerCase();
  return Object.hasOwn(SYNONYMS, word) ? { kind: "action", action: SYNONYMS[word] } : { kind: "unknown" };
}

// src/svg/batch.ts
var RectBatch = class {
  paths = /* @__PURE__ */ new Map();
  add(fill, x, y, w, h) {
    const segs = this.paths.get(fill) ?? [];
    segs.push(`M${x} ${y}h${w}v${h}h${-w}z`);
    this.paths.set(fill, segs);
    return this;
  }
  toString() {
    return [...this.paths].map(([fill, segs]) => {
      const attr = fill.startsWith("var(") ? `style="fill:${fill}"` : `fill="${fill}"`;
      return `<path ${attr} d="${segs.join("")}"/>`;
    }).join("");
  }
};

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

// src/pet/behavior.ts
function shiftPupils(grid, dir) {
  return grid.map((row) => {
    const px = [...row];
    const order = dir === -1 ? px.keys() : [...px.keys()].reverse();
    for (const i of order) {
      if (px[i] === "k" && px[i + dir] === "w") [px[i], px[i + dir]] = [px[i + dir], px[i]];
    }
    return px.join("");
  });
}
function glance(eyes4) {
  for (const dir of [-1, 1]) {
    const moved = eyes4.map((l) => ({ ...l, grid: shiftPupils(l.grid, dir) }));
    if (moved.some((l, i) => l.grid.join() !== eyes4[i].grid.join())) return moved;
  }
  return null;
}
var width = (l) => Math.max(...l.grid.map((r) => r.length));
function anchors(species) {
  const eyes4 = species.eyes.open.filter((l) => /[kw]/.test(l.grid.join(""))).map((l) => ({ x: l.x + width(l) / 2, y: l.y + l.grid.length / 2 }));
  const mouthLayers = [species.mouths.smile, species.mouths.neutral, species.mouths.frown].find((m) => m.length) ?? [];
  const mouth = mouthLayers.length ? {
    x: (Math.min(...mouthLayers.map((l) => l.x)) + Math.max(...mouthLayers.map((l) => l.x + width(l)))) / 2,
    y: Math.max(...mouthLayers.map((l) => l.y + l.grid.length))
  } : { x: species.width / 2, y: species.height * 0.7 };
  const top = Math.min(...species.eyes.open.map((l) => l.y));
  return { eyes: eyes4, mouth, top };
}
var GLYPHS = {
  question: ["xxx", "..x", ".xx", "...", ".x."],
  note: ["..xx", "..x.", "..x.", "xxx.", "xx.."],
  bang: [".x.", ".x.", ".x.", "...", ".x."]
};
function emoteBubble(emote, x, y, cls, style = "") {
  const glyph = GLYPHS[emote];
  const w = glyph[0].length * 2 + 8;
  const h = 18;
  return `<g class="${cls}"${style ? ` style="${style}"` : ""}><rect x="${x}" y="${y - h}" width="${w}" height="${h - 4}" rx="4" fill="#ffffff" stroke="#1f2328" stroke-width="1"/><rect x="${x + 3}" y="${y - 5}" width="3" height="3" fill="#ffffff" stroke="#1f2328" stroke-width="1"/>${renderPixels([{ x: 0, y: 0, grid: glyph }], { x: "#1f2328" }, { x: x + 4, y: y - h + 2, scale: 2 })}</g>`;
}
var TRICKS = ["dance", "twirl", "heart-eyes", "sneeze", "tongue", "signature"];
var SIGNATURE = {
  crab: "bubbles",
  gopher: "dig",
  snake: "hiss",
  elephant: "spray",
  chick: "peck",
  turtle: "zoomies"
};
function trickFor(date, login) {
  const pool = ["signature", "signature", "dance", "twirl", "heart-eyes", "sneeze", "tongue"];
  return pool[Math.floor(seeded(`trick:${login}:${date}`)() * pool.length)];
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
.pf-show{opacity:0;animation:pf-show 12s steps(1) infinite}
@keyframes pf-show{0%{opacity:0}70%{opacity:1}88%{opacity:0}100%{opacity:0}}
.pf-flick{opacity:0;animation:pf-flick 12s steps(1) infinite}
@keyframes pf-flick{0%{opacity:0}70%{opacity:1}73%{opacity:0}76%{opacity:1}79%{opacity:0}82%{opacity:1}85%,100%{opacity:0}}
.pf-dance{transform-box:fill-box;transform-origin:50% 100%;animation:pf-dance 12s linear infinite}
@keyframes pf-dance{0%,70%,88%,100%{transform:rotate(0)}72%,76%,80%,84%{transform:rotate(-10deg)}74%,78%,82%,86%{transform:rotate(10deg)}}
.pf-twirl{transform-box:fill-box;transform-origin:center;animation:pf-twirl 12s steps(1) infinite}
@keyframes pf-twirl{0%{transform:scaleX(1)}72%{transform:scaleX(-1)}75%{transform:scaleX(1)}78%{transform:scaleX(-1)}81%{transform:scaleX(1)}100%{transform:scaleX(1)}}
.pf-sneeze{transform-box:fill-box;transform-origin:50% 100%;animation:pf-sneeze 12s ease-in-out infinite}
@keyframes pf-sneeze{0%,70%,100%{transform:scale(1)}76%{transform:scale(1.05,.88)}79%{transform:scale(.95,1.08)}84%{transform:scale(1)}}
.pf-peck{transform-box:fill-box;transform-origin:50% 100%;animation:pf-peck 12s ease-in-out infinite}
@keyframes pf-peck{0%,70%,88%,100%{transform:rotate(0)}73%,79%,85%{transform:rotate(16deg)}76%,82%{transform:rotate(0)}}
.pf-zoom{animation:pf-zoom 12s ease-in-out infinite}
@keyframes pf-zoom{0%,70%,100%{transform:translateX(0)}75%{transform:translateX(44px)}81%{transform:translateX(-44px)}87%{transform:translateX(0)}}
.pf-burst{opacity:0;animation:pf-burst 12s ease-out infinite}
@keyframes pf-burst{0%,71%{transform:translate(0,0);opacity:0}72%,82%{opacity:1}88%{transform:translate(var(--dx),var(--dy));opacity:0}100%{opacity:0}}
`;
function burst(from, color, size, particles, round2 = false) {
  return particles.map(
    (p) => `<rect class="pf-burst" style="--dx:${p.dx}px;--dy:${p.dy}px;animation-delay:${p.delay}s" x="${from.x - size / 2}" y="${from.y - size / 2}" width="${size}" height="${size}"${round2 ? ` rx="${size / 2}" fill="none" stroke="${color}" stroke-width="1"` : ` fill="${color}"`}/>`
  ).join("");
}
var fan = (n, spread, rise) => Array.from({ length: n }, (_, i) => ({ dx: Math.round((i / (n - 1) - 0.5) * spread), dy: -rise - i % 2 * 6, delay: i % 3 * 0.15 }));
function trickLayers(trick, species, scale) {
  const a = anchors(species);
  const at = (p) => ({ x: p.x * scale, y: p.y * scale });
  const mouth = at(a.mouth);
  const w = species.width * scale;
  const h = species.height * scale;
  switch (trick) {
    case "dance":
      return { bodyClass: "pf-dance", overlay: emoteBubble("note", w - 6, a.top * scale - 2, "pf-show") };
    case "twirl":
      return { bodyClass: "pf-twirl", overlay: "" };
    case "heart-eyes": {
      const hs = Math.max(1, Math.round(scale * 0.75));
      const hearts = a.eyes.map((e) => at(e)).map((e) => renderPixels([{ x: 0, y: 0, grid: HEART }], FX_PALETTE, { x: e.x - 5 * hs / 2, y: e.y - 2 * hs, scale: hs })).join("");
      return { bodyClass: "", overlay: `<g class="pf-show">${hearts}</g>` };
    }
    case "sneeze":
      return {
        bodyClass: "pf-sneeze",
        overlay: emoteBubble("bang", w - 6, a.top * scale - 2, "pf-show") + burst(mouth, "#8ec5ea", Math.max(2, scale * 0.75), fan(5, 50, 6))
      };
    case "tongue":
      return {
        bodyClass: "",
        overlay: `<rect class="pf-show" x="${mouth.x - scale}" y="${mouth.y}" width="${2 * scale}" height="${2 * scale}" rx="${scale / 2}" fill="#e63946"/>`
      };
    case "signature":
      return signature(SIGNATURE[species.id] ?? "bubbles", mouth, w, h, scale);
  }
}
function signature(move, mouth, w, h, scale) {
  switch (move) {
    case "bubbles":
      return { bodyClass: "", overlay: burst(mouth, "#dff4ff", 2 * scale, fan(4, 30, 34), true) };
    case "dig":
      return { bodyClass: "pf-sneeze", overlay: burst({ x: w / 2, y: h - scale }, "#7a5230", scale, fan(6, 70, 14)) };
    case "hiss": {
      const fork = new RectBatch().add("#e63946", mouth.x - scale / 2, mouth.y, scale, 2 * scale).add("#e63946", mouth.x - 1.5 * scale, mouth.y + 2 * scale, scale, scale).add("#e63946", mouth.x + 0.5 * scale, mouth.y + 2 * scale, scale, scale);
      return { bodyClass: "", overlay: `<g class="pf-flick">${fork}</g>` };
    }
    case "spray":
      return { bodyClass: "", overlay: burst({ x: w / 2, y: h - 2 * scale }, "#4ea8de", Math.max(2, scale), fan(7, 96, 84)) };
    case "peck": {
      const seeds = new RectBatch();
      for (const dx of [-3, 2, 6]) seeds.add("#e9c46a", w / 2 + dx * scale, h - scale / 2, scale / 2 + 1, scale / 2 + 1);
      return { bodyClass: "pf-peck", overlay: `<g class="pf-show">${seeds}</g>` };
    }
    case "zoomies": {
      const lines = new RectBatch();
      for (const y of [0.35, 0.55, 0.75]) lines.add("#8d96a0", -4 * scale, h * y, 3 * scale, Math.max(1, scale / 2));
      return { bodyClass: "pf-zoom", overlay: `<g class="pf-show">${lines}</g>` };
    }
  }
}
var playful = (mood) => mood === "happy" || mood === "idle";

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
    season: oneOf(q.get("season"), SEASONS),
    hemisphere: oneOf(q.get("hemisphere"), HEMISPHERES),
    mood: oneOf(q.get("mood"), MOODS),
    stage: oneOf(q.get("stage"), STAGES),
    trick: oneOf(q.get("trick"), TRICKS),
    away: q.get("away") === "true",
    visit: oneOf(q.get("visit"), CARE_ACTIONS),
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
  maxHandled: 300,
  maxRecent: 5,
  maxTotal: 1e9
};
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
    handled: []
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
function parseCareState(text, now) {
  const fresh = newCareState(now);
  if (text === null) return { state: fresh };
  if (text.length > LIMITS.maxFileBytes) return { state: fresh, warning: "care file too large, starting over" };
  let raw;
  try {
    raw = JSON.parse(text);
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
    state.recent = raw.recent.filter((e) => isObject(e) && isAction(e.action) && isLogin(e.by) && isTime(e.at, now)).slice(0, LIMITS.maxRecent).map(({ action, by, at }) => ({ action, by, at }));
  }
  if (Array.isArray(raw.handled)) {
    state.handled = raw.handled.filter((n) => Number.isInteger(n) && n > 0).slice(-LIMITS.maxHandled);
  }
  return { state };
}
var serializeCareState = (state) => JSON.stringify(state, null, 2) + "\n";
function applyIssues(previous, issues, now) {
  const state = structuredClone(previous);
  if (state.day !== utcDay(now)) {
    state.day = utcDay(now);
    state.today = {};
    state.todayTotal = 0;
  }
  const seen = new Set(state.handled);
  const handled = [];
  const queue = [...issues].sort((a, b) => a.number - b.number);
  for (const issue of queue) {
    if (handled.length >= LIMITS.perRun) break;
    if (seen.has(issue.number) || issue.userType !== "User" || !isLogin(issue.login)) continue;
    const parsed = parseTitle(issue.title);
    if (!parsed) continue;
    let outcome;
    if (parsed.kind === "unknown") {
      outcome = { kind: "unknown" };
    } else if (state.todayTotal >= LIMITS.perDay) {
      outcome = { kind: "busy" };
    } else if (todayOf(state, issue.login).filter((a) => a === parsed.action).length >= LIMITS.perVisitorPerAction) {
      outcome = { kind: "limited", action: parsed.action };
    } else {
      const at = now.toISOString();
      state.today[issue.login] = [...todayOf(state, issue.login), parsed.action];
      state.todayTotal++;
      state.totals[parsed.action] = Math.min(state.totals[parsed.action] + 1, LIMITS.maxTotal);
      state.last[parsed.action] = at;
      state.recent = [{ action: parsed.action, by: issue.login, at }, ...state.recent].slice(0, LIMITS.maxRecent);
      outcome = { kind: "done", action: parsed.action };
    }
    handled.push({ issue, outcome });
    seen.add(issue.number);
    state.handled = [...state.handled, issue.number].slice(-LIMITS.maxHandled);
  }
  return { state, handled };
}
function replyFor(outcome, petName, login) {
  switch (outcome.kind) {
    case "done":
      return {
        feed: `\u{1F356} Nom nom! ${petName} is fed. Thanks for stopping by, ${login}!`,
        bath: `\u{1F6C1} Splash! ${petName} is squeaky clean again. Thanks, ${login}!`,
        play: `\u{1F3BE} ${petName} chased the ball and had a blast. Thanks for playing, ${login}!`
      }[outcome.action] + "\n\nThe card updates within a few minutes. This issue closes itself.";
    case "limited":
      return `${petName} already got that from you today. Come back tomorrow! \u{1F319}`;
    case "busy":
      return `${petName} has had a very busy day and is resting now. Try again tomorrow! \u{1F4A4}`;
    case "unknown":
      return `${petName} only understands \`feed\`, \`bath\` and \`play\`. Try a title like "ProfileForge: feed".`;
  }
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

// src/care/view.ts
var HOUR = 36e5;
var DAY = 24 * HOUR;
var FRESH = 12 * HOUR;
var FED_KEEPS_HOME = 30 * DAY;
var DIRT_DAYS = [3, 6, 10];
var age = (iso, now) => iso ? now.getTime() - Date.parse(iso) : Infinity;
function careView(state, now) {
  const sinceBath = age(state.last.bath ?? state.since, now) / DAY;
  const dirt = DIRT_DAYS.filter((d) => sinceBath >= d).length;
  const latest = state.recent[0];
  return {
    fed: age(state.last.feed, now) < FRESH,
    bathed: age(state.last.bath, now) < FRESH,
    played: age(state.last.play, now) < FRESH,
    dirt,
    visitor: latest && age(latest.at, now) < FRESH ? { login: latest.by, action: latest.action } : null
  };
}
function applyCare(pet2, state, now) {
  const view = careView(state, now);
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

// src/pet/sprite.ts
var FACE = {
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
function renderPetSprite(state, scale, { lively = true } = {}) {
  if (state.stage === "egg") return eggSprite(state, scale);
  const species = getSpecies(state.species);
  const legendary = state.stage === "legendary";
  const palette = legendary ? { ...species.palette, ...species.legendaryPalette } : species.palette;
  const px = (layers) => renderPixels(layers, palette, { scale });
  const face = FACE[state.mood];
  const [limbA, limbB] = species.limbs[state.mood];
  const side = glance(species.eyes.open);
  const eyes4 = state.mood === "idle" ? `<g class="pf-eo">${px(species.eyes.open)}</g>${side ? `<g class="pf-eg">${px(side)}</g>` : ""}<g class="pf-es">${px(species.eyes.closed)}</g>` : px(species.eyes[face.eyes]);
  let crown = "";
  if (legendary) {
    const cs = Math.max(1, Math.round(scale * 3 / 4));
    const cx = species.crownAnchor.x * scale - CROWN[0].length * cs / 2;
    const cy = species.crownAnchor.y * scale - CROWN.length * cs - 1.5 * scale;
    crown = `<g class="pf-bob">${renderPixels([{ x: 0, y: 0, grid: CROWN }], FX_PALETTE, { x: cx, y: cy, scale: cs })}</g>`;
  }
  let svg = [
    frames(px(limbA), px(limbB), FRAME_SPEED[state.mood]),
    px(species.body),
    px(species.mouths[face.mouth]),
    face.blush ? px(species.blush) : "",
    eyes4,
    crown
  ].join("");
  if (lively && playful(state.mood)) {
    const trick = trickLayers(state.trick ?? trickFor(state.date, state.login), species, scale);
    const emote = emoteBubble(state.mood === "happy" ? "note" : "question", species.width * scale - 4, anchors(species).top * scale - 2, "pf-emote");
    svg = `<g${trick.bodyClass ? ` class="${trick.bodyClass}"` : ""}>${svg}${trick.overlay}</g>${emote}`;
  }
  return { svg, width: species.width * scale, height: species.height * scale };
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
  const [r, g, b] = [m[1], m[2], m[3]].map((c) => parseInt(c, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
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
var newCanvas = () => ({
  walls: new RectBatch(),
  windows: new RectBatch(),
  nature: new RectBatch(),
  front: new RectBatch(),
  extras: []
});
var renderCanvas = (c) => `${c.walls}${c.windows}${c.nature}${c.front}${c.extras.join("")}`;
var ON = "var(--pf-window-on)";
var ALT = "var(--pf-window-alt)";
var OFF = "var(--pf-window-off)";
var TRUNK2 = "#6b4b2a";
var CRANE = "#f5a623";
var BEACON = "#ff4d4d";
var ROOFS = ["#7a3b2e", "#4f3f63", "#35536b"];
function pickStyle(floors, rng) {
  const r = rng();
  if (floors >= 12) return r < 0.25 ? "setback" : r < 0.4 ? "glass" : r < 0.52 ? "spire" : "classic";
  if (floors <= 6) return r < 0.4 ? "brick" : r < 0.48 ? "glass" : "classic";
  return r < 0.15 ? "glass" : r < 0.35 ? "brick" : "classic";
}
function addWindow(c, rng, lit, alt, x, y, w, h) {
  if (rng() >= lit) {
    c.windows.add(OFF, x, y, w, h);
    return;
  }
  const color = rng() < alt ? ALT : ON;
  if (rng() < 0.04) {
    c.extras.push(
      `<rect class="pf-flicker" style="animation-delay:-${(rng() * 7).toFixed(2)}s;fill:${color}" x="${x}" y="${y}" width="${w}" height="${h}"/>`
    );
  } else {
    c.windows.add(color, x, y, w, h);
  }
}
function drawBuilding(c, rng, b) {
  const { x, floors, fill, style, lit } = b;
  const top = BASE_Y - floors * FLOOR_H - U;
  const floorY = (f) => BASE_Y - (f + 1) * FLOOR_H;
  if (style === "house") return drawHouse(c, rng, b);
  if (style === "setback") {
    const base = Math.max(2, Math.round(floors * 0.6));
    const ledge = BASE_Y - base * FLOOR_H;
    c.walls.add(fill, x, ledge, BUILDING_W, BASE_Y - ledge).add(fill, x + 3, top, 8, ledge - top);
    for (let f = 0; f < floors; f++) {
      if (f < base) {
        addWindow(c, rng, lit, 0.12, x + U, floorY(f) + U, 2 * U, 2 * U);
        addWindow(c, rng, lit, 0.12, x + 4 * U, floorY(f) + U, 2 * U, 2 * U);
      } else {
        addWindow(c, rng, lit, 0.12, x + 5, floorY(f) + U, 2 * U, 2 * U);
      }
    }
    if (b.snow) c.front.add(SNOW, x, ledge - 2, 3, 2).add(SNOW, x + 11, ledge - 2, 3, 2).add(SNOW, x + 3, top - 2, 8, 2);
    return top;
  }
  c.walls.add(fill, x, top, BUILDING_W, BASE_Y - top);
  for (let f = 0; f < floors; f++) {
    const y = floorY(f);
    if (style === "brick") {
      for (const wx of [x + 2, x + 6, x + 10]) addWindow(c, rng, lit, 0.08, wx, y + U, U, 2 * U);
    } else if (style === "glass") {
      addWindow(c, rng, lit, 0.25, x + U, y, 2 * U, FLOOR_H);
      addWindow(c, rng, lit, 0.25, x + 4 * U, y, 2 * U, FLOOR_H);
    } else {
      addWindow(c, rng, lit, 0.12, x + U, y + U, 2 * U, 2 * U);
      addWindow(c, rng, lit, 0.12, x + 4 * U, y + U, 2 * U, 2 * U);
    }
  }
  if (style === "spire") {
    c.walls.add(fill, x + 2, top - 2, 10, 2).add(fill, x + 4, top - 4, 6, 2).add(fill, x + 6, top - 12, 2, 8);
    if (b.snow) c.front.add(SNOW, x, top - 2, 2, 2).add(SNOW, x + 12, top - 2, 2, 2).add(SNOW, x + 4, top - 6, 6, 2);
    return top;
  }
  if (b.roofDetails && floors >= 3) {
    const roof = rng();
    if (style === "brick" && roof < 0.5) c.walls.add(fill, x + 10, top - 6, 2, 6);
    else if (roof < 0.22) c.walls.add(fill, x + 10, top - 8, 2, 8);
    else if (roof < 0.38) c.walls.add(fill, x + 4, top - 7, 6, 4).add(fill, x + 5, top - 3, 1, 3).add(fill, x + 8, top - 3, 1, 3);
    else if (roof < 0.5) c.walls.add(fill, x + 2, top - 4, 4, 4);
  }
  if (b.snow) c.front.add(SNOW, x, top - 2, BUILDING_W, 2);
  return top;
}
function drawHouse(c, rng, b) {
  const { x, floors, fill, lit } = b;
  const wallTop = BASE_Y - (floors === 1 ? 8 : 12);
  const roof = ROOFS[Math.floor(rng() * ROOFS.length)];
  c.walls.add(fill, x + 1, wallTop, 12, BASE_Y - wallTop);
  c.walls.add(roof, x, wallTop - 2, 14, 2).add(roof, x + 2, wallTop - 4, 10, 2).add(roof, x + 4, wallTop - 6, 6, 2).add(roof, x + 6, wallTop - 8, 2, 2);
  if (rng() < 0.5) c.walls.add(roof, x + 10, wallTop - 7, 2, 4);
  c.walls.add(roof, x + 3, BASE_Y - 5, 3, 5);
  addWindow(c, rng, lit, 0.1, x + 8, BASE_Y - 6, 3, 3);
  if (floors === 2) {
    addWindow(c, rng, lit, 0.1, x + 3, BASE_Y - 11, 3, 3);
    addWindow(c, rng, lit, 0.1, x + 8, BASE_Y - 11, 3, 3);
  }
  if (b.snow) {
    for (const [sx, sy] of [[6, 8], [4, 6], [8, 6], [2, 4], [10, 4], [0, 2], [12, 2]]) {
      c.front.add(SNOW, x + sx, wallTop - sy, 2, 1);
    }
  }
  return wallTop - 8;
}
function drawPark(c, rng, x, look) {
  const pick = (colors) => colors[Math.floor(rng() * colors.length)];
  c.nature.add(look.grass, x, BASE_Y - 2, BUILDING_W, 2);
  const kind = rng();
  if (kind < 0.4) {
    const canopy = pick(look.canopy);
    c.nature.add(TRUNK2, x + 6, BASE_Y - 8, 2, 6);
    c.nature.add(canopy, x + 3, BASE_Y - 16, 8, 8).add(canopy, x + 4, BASE_Y - 18, 6, 2);
  } else if (kind < 0.65) {
    c.nature.add(TRUNK2, x + 6, BASE_Y - 6, 2, 4);
    c.nature.add(look.pine, x + 3, BASE_Y - 12, 8, 6).add(look.pine, x + 4, BASE_Y - 17, 6, 5);
    c.nature.add(look.pineTip, x + 6, BASE_Y - 21, 2, 4);
    if (look.snow) c.nature.add(SNOW, x + 4, BASE_Y - 17, 6, 1).add(SNOW, x + 3, BASE_Y - 12, 8, 1);
  } else if (kind < 0.85) {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 6, 5, 4).add(pick(look.bush), x + 8, BASE_Y - 5, 4, 3);
  } else if (look.snow) {
    c.nature.add(SNOW, x + 4, BASE_Y - 8, 6, 6).add(SNOW, x + 5, BASE_Y - 12, 4, 4).add("#f4a261", x + 9, BASE_Y - 11, 2, 1);
  } else {
    c.nature.add(pick(look.bush), x + 1, BASE_Y - 4, 12, 2);
    for (const [fx2, color] of [[2, "#ff8fa3"], [6, "#ffd166"], [10, "#c3a6ff"]]) {
      c.nature.add(color, x + fx2, BASE_Y - 6, 2, 2);
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
function drawLandmark(c, x, top, language) {
  const cx = x + BUILDING_W / 2;
  let antennaBase = top;
  if (language) {
    const boardTop = top - 17;
    const w = Math.round(signLabel(language.name).length * 5.4 + 10);
    const left = Math.round(cx - w / 2);
    for (const legX of [left + 3, left + w - 5]) {
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
  c.extras.push(crane.toString(), `<rect class="pf-beacon" x="${x + 8}" y="${mastTop - 4}" width="4" height="4" fill="${BEACON}"/>`);
  if (sign) neonSign(c, hookX + 0.5, mastTop + 14, sign);
}

// src/city/events.ts
var LUNAR_NEW_YEAR = {
  2026: "02-17",
  2027: "02-06",
  2028: "01-26",
  2029: "02-13",
  2030: "02-03",
  2031: "01-23",
  2032: "02-11",
  2033: "01-31",
  2034: "02-19",
  2035: "02-08"
};
var DAY2 = 864e5;
function holidayFor(date) {
  const md = date.slice(5);
  if (md >= "10-25" && md <= "10-31") return "halloween";
  if (md >= "12-18" && md <= "12-26") return "christmas";
  if (md === "12-31" || md === "01-01") return "new-year";
  const lny = LUNAR_NEW_YEAR[Number(date.slice(0, 4))];
  if (lny && Math.abs(Date.parse(`${date}T00:00:00Z`) - Date.parse(`${date.slice(0, 4)}-${lny}T00:00:00Z`)) <= 3 * DAY2) {
    return "lunar-new-year";
  }
  return null;
}
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
var XMAS = ["#ff4d4d", "#ffd166", "#7dd3fc", "#7dff9b"];
function roofDecor(c, rng, x, top, holiday) {
  if (holiday === "halloween" && rng() < 0.22) {
    pumpkin(c, x + 4, top - 4);
  } else if (holiday === "christmas") {
    for (let i = 0; i < 5; i++) {
      const cls = i % 2 ? "pf-xmas-b" : "pf-xmas-a";
      c.extras.push(`<rect class="${cls}" x="${x + 1 + i * 3}" y="${top - 1}" width="2" height="2" fill="${XMAS[(i + Math.floor(rng() * 4)) % 4]}"/>`);
    }
  } else if (holiday === "lunar-new-year" && rng() < 0.3) {
    lantern(c, x + 1, top + 2);
  }
}
function parkDecor(c, rng, x, holiday) {
  if (holiday === "halloween" && rng() < 0.6) pumpkin(c, x + 1, BASE_Y - 6);
  if (holiday === "lunar-new-year" && rng() < 0.5) lantern(c, x + 8, BASE_Y - 24);
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
function fireworks(rng) {
  const out = [];
  for (let b = 0; b < 3; b++) {
    const cx = Math.round(140 + b * 220 + rng() * 80);
    const cy = Math.round(72 + rng() * 40);
    const color = SPARK_COLORS[Math.floor(rng() * SPARK_COLORS.length)];
    const delay = `animation-delay:-${(b * 1.4).toFixed(1)}s`;
    out.push(`<rect class="pf-launch" style="${delay}" x="${cx}" y="${cy}" width="2" height="5" fill="${color}"/>`);
    for (let i = 0; i < 14; i++) {
      const angle = i / 14 * Math.PI * 2;
      const r = 20 + rng() * 10;
      const dx = Math.round(Math.cos(angle) * r);
      const dy = Math.round(Math.sin(angle) * r + 8);
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
  const y = ROAD_Y + 1 - sprite.height;
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
function cloud(batch, fill, x, y, s) {
  batch.add(fill, x, y + 4 * s, 22 * s, 4 * s).add(fill, x + 4 * s, y + s, 10 * s, 4 * s).add(fill, x + 10 * s, y, 8 * s, 5 * s).add(fill, x + 16 * s, y + 2 * s, 5 * s, 3 * s);
}
function clouds(rng) {
  const out = [];
  for (let i = 0; i < 4; i++) {
    const batch = new RectBatch();
    cloud(batch, "#ffffff", 0, 0, 2);
    const y = 64 + Math.round(rng() * 70);
    const delay = Math.round(rng() * 160);
    out.push(`<g class="pf-drift" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})" opacity=".7">${batch}</g></g>`);
  }
  return `<g class="pf-day">${out.join("")}</g>`;
}
function overcast(rng) {
  const batch = new RectBatch();
  for (let x = -30; x < W; x += 70 + Math.round(rng() * 40)) {
    cloud(batch, "#6f7689", x, 58 + Math.round(rng() * 40), 3);
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
function pixelCircle(batch, fill, cx, cy, radius, px) {
  const r = Math.round(radius / px);
  for (let dy = -r; dy < r; dy++) {
    const half = Math.round(Math.sqrt(r * r - (dy + 0.5) ** 2));
    batch.add(fill, cx - half * px, cy + dy * px, half * 2 * px, px);
  }
}
function pixelMoon(cx, cy, radius, px, phase, south = false) {
  const lit = new RectBatch();
  const dark2 = new RectBatch();
  const r = Math.round(radius / px);
  const terminator = Math.cos(2 * Math.PI * phase);
  for (let dy = -r; dy < r; dy++) {
    const yc = (dy + 0.5) / r;
    const half = Math.sqrt(Math.max(0, 1 - yc * yc));
    const cols = Math.round(half * r);
    let runStart = -cols;
    let runLit = null;
    const flush = (end) => {
      if (runLit === null || end <= runStart) return;
      (runLit ? lit : dark2).add("var(--pf-celestial)", cx + runStart * px, cy + dy * px, (end - runStart) * px, px);
    };
    for (let dx = -cols; dx < cols; dx++) {
      const xc = (dx + 0.5) / r * (south ? -1 : 1);
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
var SHADES = ["var(--pf-bldg1)", "var(--pf-bldg2)", "var(--pf-bldg3)"];
var CAR = [
  "...ccccc....",
  "..cwwcwwc...",
  "qccccccccccy",
  "cccccccccccc",
  ".kk......kk."
];
var CAR_COLORS = ["#e63946", "#4ea8de", "#f4a261"];
var CSS = `
.pf-twinkle{transform-box:fill-box;transform-origin:center;animation:pf-twinkle 2.2s ease-in-out infinite}
@keyframes pf-twinkle{0%,100%{opacity:.2}50%{opacity:1}}
.pf-night{opacity:var(--pf-stars)}
.pf-day{opacity:calc(1 - var(--pf-stars))}
.pf-beam{opacity:var(--pf-stars)}
.pf-glow{opacity:var(--pf-stars)}
.pf-flicker{animation:pf-flicker 7s linear infinite}
@keyframes pf-flicker{0%,84%,100%{opacity:1}85%,93%{opacity:0}}
.pf-beacon{animation:pf-beacon 1.6s steps(1) infinite}
@keyframes pf-beacon{0%{opacity:1}50%{opacity:.15}100%{opacity:.15}}
.pf-strobe{animation:pf-strobe 1.1s steps(1) infinite}
@keyframes pf-strobe{0%{opacity:1}12%{opacity:0}100%{opacity:0}}
.pf-neon{animation:pf-buzz 6s linear infinite}
@keyframes pf-buzz{0%,90%,94%,97%,100%{opacity:1}91%,95%{opacity:.35}}
.pf-sign{font:700 8px ${MONO};letter-spacing:.06em}
.pf-drive-r{animation:pf-drive-r 14s linear infinite}
.pf-drive-l{animation:pf-drive-l 18s linear infinite}
@keyframes pf-drive-r{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
@keyframes pf-drive-l{0%{transform:translateX(${W + 60}px)}100%{transform:translateX(-60px)}}
.pf-fly{animation:pf-fly 38s linear infinite}
@keyframes pf-fly{0%{transform:translateX(${W + 40}px)}100%{transform:translateX(-80px)}}
.pf-flock{animation:pf-flock 46s linear infinite}
@keyframes pf-flock{0%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}
.pf-flap-a{animation:pf-flap-a .6s steps(1) infinite}
.pf-flap-b{opacity:0;animation:pf-flap-b .6s steps(1) infinite}
@keyframes pf-flap-a{0%{opacity:1}50%{opacity:0}100%{opacity:0}}
@keyframes pf-flap-b{0%{opacity:0}50%{opacity:1}100%{opacity:1}}
.pf-shoot{animation:pf-shoot 9s ease-out infinite}
@keyframes pf-shoot{0%{transform:translate(0,0);opacity:0}2%{opacity:1}12%{transform:translate(-170px,74px);opacity:0}100%{transform:translate(-170px,74px);opacity:0}}
${SEASON_CSS}
${WEATHER_CSS}
${EVENTS_CSS}
${CITY_PET_CSS}
${SPRITE_CSS}
.pf-title{font:700 18px ${SANS};fill:var(--pf-city-text)}
.pf-sub{font:400 12px ${SANS};fill:var(--pf-city-muted)}
.pf-stats{font:700 11px ${MONO};fill:var(--pf-city-muted);letter-spacing:.04em}
.pf-halo{paint-order:stroke;stroke:var(--pf-city-sky-top);stroke-width:3px;stroke-linejoin:round}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;
function floorsFor(week, maxTotal) {
  if (week.total <= 0 || maxTotal <= 0) return 0;
  const ratio = (week.total / maxTotal) ** 0.6;
  return Math.max(1, Math.round(1 + (MAX_FLOORS - 1) * ratio));
}
function sky(state, rng, weather, south) {
  const stars = new RectBatch();
  const twinkles = [];
  for (let i = 0; i < 46; i++) {
    const x = Math.round(rng() * (W - 20)) + 10;
    const y = Math.round(rng() * 150) + 8;
    if (rng() < 0.25) {
      twinkles.push(
        `<rect class="pf-twinkle" style="animation-delay:-${(rng() * 3).toFixed(2)}s" x="${x}" y="${y}" width="2" height="2" fill="#fff"/>`
      );
    } else {
      stars.add("#fff", x, y, 2, 2);
    }
  }
  const sun = new RectBatch();
  pixelCircle(sun, "var(--pf-celestial)", 640, 168, 40, 4);
  const sunGlow = new RectBatch();
  pixelCircle(sunGlow, "var(--pf-celestial)", 640, 168, 60, 4);
  const shootingStar = state.currentStreak >= 7 ? `<g class="pf-shoot"><line x1="560" y1="34" x2="592" y2="20" stroke="url(#pf-tail)" stroke-width="2"/><rect x="558" y="33" width="3" height="3" fill="#fff"/></g>` : "";
  if (weather !== "clear") return `<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>`;
  return `
<rect width="${W}" height="${H}" fill="url(#pf-sky)"/>
<g class="pf-day"><g opacity=".25">${sunGlow}</g>${sun}</g>
<g class="pf-night">${stars}${twinkles.join("")}${pixelMoon(712, 78, 13, U, moonPhase(state.date), south)}${shootingStar}</g>`;
}
function flyers() {
  const plane = new RectBatch().add("var(--pf-bldg1)", 0, 2, 18, 3).add("var(--pf-bldg1)", 14, -1, 3, 3).add("var(--pf-bldg1)", 6, 5, 6, 2);
  const flyingPlane = `<g class="pf-fly" style="animation-delay:-14s"><g transform="translate(0 104)">${plane}
<rect class="pf-beacon" x="8" y="7" width="2" height="2" fill="${"#ff4d4d"}"/>
<rect class="pf-beacon" style="animation-delay:-.8s" x="-1" y="3" width="2" height="2" fill="#7dff9b"/>
<rect class="pf-strobe" x="16" y="-2" width="2" height="2" fill="#ffffff"/></g></g>`;
  const bird = (dx, dy) => `<g transform="translate(${dx} ${dy})"><path class="pf-flap-a" d="M0 0L3 3L6 0"/><path class="pf-flap-b" d="M0 3L3 2L6 3"/></g>`;
  const flock = `<g class="pf-day"><g class="pf-flock" style="animation-delay:-20s"><g transform="translate(0 122)" fill="none" stroke="var(--pf-bldg3)" stroke-width="1.3">${bird(0, 0)}${bird(10, 5)}${bird(-9, 6)}${bird(20, 10)}</g></g></g>`;
  return flyingPlane + flock;
}
function backdrop(rng) {
  const batch = new RectBatch();
  let x = 0;
  while (x < W) {
    const w = 12 + Math.round(rng() * 22);
    const h = 36 + Math.round(rng() * 80);
    batch.add("var(--pf-bldg2)", x, BASE_Y - h, w, h);
    x += w + (rng() < 0.3 ? 4 : 0);
  }
  return `<g opacity=".45">${batch}</g>`;
}
function skyline(state, season, holiday, weather) {
  const canvas = newCanvas();
  const look = LOOKS[season];
  const weeks = state.weeks;
  const maxTotal = Math.max(0, ...weeks.map((w) => w.total));
  const startX = RIGHT_EDGE - weeks.length * BUILDING_W;
  let prevShade = -1;
  weeks.forEach((week, i) => {
    const rng = seeded(`${state.login}:${week.start}`);
    const x = startX + i * BUILDING_W;
    const isCurrent = i === weeks.length - 1;
    const isBest = state.bestWeek?.start === week.start;
    const special = isCurrent || isBest;
    const quiet = !special && week.total > 0 && week.total <= 3;
    const floors = quiet ? week.total === 1 ? 1 : 2 : floorsFor(week, maxTotal);
    if (floors === 0) {
      if (isCurrent) drawCrane(canvas, x, BASE_Y);
      else {
        drawPark(canvas, rng, x, look);
        parkDecor(canvas, rng, x, holiday);
      }
      prevShade = -1;
      return;
    }
    let shade = Math.floor(rng() * SHADES.length);
    if (shade === prevShade) shade = (shade + 1) % SHADES.length;
    prevShade = shade;
    const top = drawBuilding(canvas, rng, {
      x,
      floors,
      fill: SHADES[shade],
      style: special ? "classic" : quiet ? "house" : pickStyle(floors, rng),
      // Busier weeks keep more lights on; fog swallows half of them.
      lit: (0.08 + 0.74 * (week.activeDays / 7)) * (weather === "fog" ? 0.5 : 1),
      snow: look.snow,
      roofDetails: !special
    });
    if (isCurrent) drawCrane(canvas, x, top, isBest ? state.topLanguage : null);
    else if (isBest) drawLandmark(canvas, x, top, state.topLanguage);
    else roofDecor(canvas, rng, x, top, holiday);
  });
  return renderCanvas(canvas);
}
function street(state, season, pet2) {
  const snowy = LOOKS[season].snow;
  const road = new RectBatch().add(snowy ? "#e3ebf5" : "var(--pf-window-off)", 0, BASE_Y, W, ROAD_Y - BASE_Y).add("var(--pf-road)", 0, ROAD_Y, W, H - ROAD_Y);
  const lane = new RectBatch();
  for (let x = 6; x < W; x += 26) lane.add("#f2e3a8", x, 244, 14, 2);
  const lamps = new RectBatch();
  const glows = [];
  for (let x = 60; x < W; x += 136) {
    lamps.add("var(--pf-road)", x, BASE_Y - 22, 2, 22).add("var(--pf-road)", x, BASE_Y - 22, 7, 2);
    lamps.add("var(--pf-window-on)", x + 4, BASE_Y - 20, 3, 2);
    glows.push(`<ellipse cx="${x + 5}" cy="${BASE_Y - 8}" rx="12" ry="16" fill="url(#pf-lamp)"/>`);
  }
  const cars = state.activeDays14 === 0 ? 0 : state.activeDays14 <= 4 ? 1 : state.activeDays14 <= 9 ? 2 : 3;
  const lanes = [
    { dir: "r", y: 233, delay: 3 },
    { dir: "l", y: 247, delay: 7 },
    { dir: "r", y: 233, delay: 10 }
  ];
  const traffic = lanes.slice(0, cars).map(({ dir, y, delay }, i) => {
    const palette = { c: CAR_COLORS[i], w: "#bde0fe", k: "#111111", y: "#fff3a0", q: "#ff4d4d" };
    const grid = dir === "r" ? CAR : mirror(CAR);
    const beam = dir === "r" ? `<path class="pf-beam" d="M24 5L58 1V11Z" fill="url(#pf-beam-r)"/>` : `<path class="pf-beam" d="M0 5L-34 1V11Z" fill="url(#pf-beam-l)"/>`;
    return `<g class="pf-drive-${dir}" style="animation-delay:-${delay}s"><g transform="translate(0 ${y})">${beam}${renderPixels([{ x: 0, y: 0, grid }], palette, { scale: U })}</g></g>`;
  });
  return `${road}<g opacity=".55">${lane}</g>${litter(LOOKS[season], seeded(`litter:${state.login}`))}<g class="pf-glow">${glows.join("")}</g>${lamps}${pet2}${traffic.join("")}`;
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
  const stats = `BEST WEEK ${state.bestWeek?.total ?? 0} \xB7 STREAK ${state.currentStreak}D \xB7 LONGEST ${state.longestStreak}D`;
  const border = options.hideBorder ? "" : `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  const desc = `A pixel city built from ${state.total} contributions, one building per week, in ${season} under a ${moonPhaseName(moonPhase(state.date))}${weather === "clear" ? "" : `, ${weather === "rain" ? "in the rain" : "lost in fog"}`}${celebrating ? ", with fireworks" : ""}. Best week: ${state.bestWeek?.total ?? 0}. Current streak: ${state.currentStreak} days.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="pf-title pf-desc">
<title id="pf-title">${login}'s ProfileForge city</title>
<desc id="pf-desc">${escapeXml(desc)}</desc>
<style>${themeCss(options.theme)}${CSS}</style>
<defs>
  <clipPath id="pf-clip"><rect width="${W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" style="stop-color:var(--pf-city-sky-top)"/>
    <stop offset="1" style="stop-color:var(--pf-city-sky-bottom)"/>
  </linearGradient>
  <radialGradient id="pf-lamp" cy=".2"><stop offset="0" style="stop-color:var(--pf-window-on);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--pf-window-on);stop-opacity:0"/></radialGradient>
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
</defs>
${filter.defs}
<g clip-path="url(#pf-clip)"><g${filter.attr}>
${sky(state, rng, weather, options.hemisphere === "south")}
${weather === "clear" ? clouds(rng) : overcast(rng)}
${flyers()}
${bats(holiday)}
${celebrating ? fireworks(rng) : ""}
${backdrop(rng)}
${skyline(state, season, holiday, weather)}
${weather === "clear" ? fireflies(look, rng) : ""}
${street(state, season, strollingPet(state.pet))}
${weather === "rain" && season !== "winter" ? rain(rng) : fallingParticles(look, rng)}
${weather === "fog" ? fog() : ""}
</g></g>
${border}
<text x="24" y="36" class="pf-title pf-halo">${login}'s city</text>
<text x="24" y="56" class="pf-sub pf-halo">${state.total.toLocaleString("en-US")} contributions in the last year</text>
<text x="${W - 24}" y="36" text-anchor="end" class="pf-stats pf-halo">${escapeXml(stats)}</text>
</svg>`;
}

// src/pet/scenery.ts
var TERRAIN = {
  crab: "beach",
  gopher: "meadow",
  snake: "jungle",
  elephant: "savanna",
  chick: "farm",
  turtle: "pond"
};
var terrainFor = (species) => Object.hasOwn(TERRAIN, species) ? TERRAIN[species] : "beach";
var TINT = {
  beach: null,
  meadow: "#79b865",
  jungle: "#4f9a55",
  savanna: "#cfb25e",
  farm: "#86b862",
  pond: "#79b865"
};
var SCENERY_CSS = `.pf-tint{opacity:calc(.75 - var(--pf-stars) * .4)}`;
var GREEN = "#3f8f4f";
var DARK_GREEN = "#2c6b3a";
var WOOD = "#8a5a33";
var DRY = "#b8953f";
function groundCover(species, area, bottom, snowy) {
  const tint = TINT[terrainFor(species)];
  const h = bottom - area.ground + 3;
  let out = tint ? `<rect class="pf-tint" x="${area.x}" y="${area.ground - 3}" width="${area.w}" height="${h}" fill="${tint}"/>` : "";
  if (snowy) out += `<rect x="${area.x}" y="${area.ground - 3}" width="${area.w}" height="${h}" fill="${SNOW}" opacity=".85"/>`;
  return out;
}
function props(species, area) {
  const b = new RectBatch();
  const g = area.ground;
  const left = area.x;
  const right = area.x + area.w;
  switch (terrainFor(species)) {
    case "beach":
      b.add("#f4845f", left + 20, g + 12, 6, 2).add("#f4845f", left + 22, g + 10, 2, 6).add("#f4845f", left + 19, g + 15, 2, 2).add("#f4845f", left + 25, g + 15, 2, 2);
      b.add("#f7c6d9", right - 30, g + 16, 8, 3).add("#f7c6d9", right - 28, g + 14, 4, 2).add("#e39bb6", right - 29, g + 17, 1, 2).add("#e39bb6", right - 25, g + 17, 1, 2);
      break;
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
  }
  return b.toString();
}
function tuft(b, x, ground, color) {
  b.add(color, x, ground - 5, 2, 5).add(color, x - 3, ground - 3, 2, 3).add(color, x + 3, ground - 4, 2, 4);
}
function fern(b, x, ground) {
  const fronds = [
    [-4, -2, 5],
    [-2, -4, 6],
    [0, -5, 6],
    [2, -4, 6],
    [4, -2, 5]
  ];
  for (const [dx, dy, steps] of fronds) {
    for (let j = 1; j <= steps; j++) {
      b.add(j % 2 ? GREEN : DARK_GREEN, x + dx * j - 2, ground + dy * j, 4, 3);
    }
  }
  b.add(DARK_GREEN, x - 1, ground - 4, 3, 4);
}

// src/pet/care-fx.ts
var CARE_CSS = `
.pf-stink{opacity:0;animation:pf-stink 2.8s ease-out infinite}
@keyframes pf-stink{0%{transform:translateY(0);opacity:0}20%{opacity:.8}100%{transform:translateY(-22px);opacity:0}}
.pf-orbit{animation:pf-orbit 2.2s linear infinite}
@keyframes pf-orbit{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.pf-buzz{animation:pf-buzz-fly .15s steps(1) infinite}
@keyframes pf-buzz-fly{0%{opacity:1}50%{opacity:.4}100%{opacity:.4}}
.pf-soap{opacity:0;animation:pf-soap 3s ease-out infinite}
@keyframes pf-soap{0%{transform:translateY(0);opacity:0}15%{opacity:.9}100%{transform:translateY(-30px);opacity:0}}
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
    for (const [i, r] of [w * 0.45, w * 0.6, w * 0.38].entries()) {
      out.push(
        // Rotating around the group's own origin, which sits on the head.
        `<g transform="translate(${cx} ${cy})"><g class="pf-orbit" style="animation-delay:-${(i * 0.7).toFixed(1)}s;animation-duration:${(1.8 + i * 0.5).toFixed(1)}s"><g class="pf-buzz"><rect x="${Math.round(r)}" y="0" width="3" height="2" fill="#1a1a1a"/><rect x="${Math.round(r)}" y="-2" width="2" height="2" fill="#ffffff" opacity=".8"/></g></g></g>`
      );
    }
  }
  if (care.bathed) {
    for (const [i, x] of [w * 0.15, w * 0.5, w * 0.85].entries()) {
      out.push(
        `<rect class="pf-soap" style="animation-delay:-${(i * 1).toFixed(1)}s" x="${Math.round(x)}" y="${Math.round(h * 0.3)}" width="${2 * scale}" height="${2 * scale}" rx="${scale}" fill="none" stroke="#9fd0ec" stroke-width="1.5"/>`
      );
    }
  }
  return out.join("");
}
function careProps(care, left, right, ground) {
  if (!care) return "";
  const b = new RectBatch();
  if (care.fed) {
    b.add("#b5543a", left, ground + 2, 20, 6).add("#b5543a", left + 2, ground + 8, 16, 2).add("#e9c46a", left + 3, ground, 14, 3);
  }
  if (care.played) {
    b.add("#e63946", right - 12, ground + 1, 10, 10).add("#ffffff", right - 12, ground + 5, 10, 2);
  }
  return b.toString();
}
function visitorLine(care) {
  if (!care?.visitor) return null;
  const who = care.visitor.login;
  return { feed: `Fed by ${who} \u2665`, bath: `Bathed by ${who} \u2727`, play: `Played with ${who} \u266A` }[care.visitor.action];
}

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
${SEASON_CSS}
${WEATHER_CSS}
${SCENERY_CSS}
${CARE_CSS}
@media (prefers-reduced-motion:reduce){.pf *{animation:none!important}}
`;
var round = (n) => Math.round(n * 100) / 100;
function compact(n) {
  if (n < 1e3) return String(n);
  if (n < 1e4) return `${round(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  if (n < 1e6) return `${Math.round(n / 1e3)}k`;
  return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
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
function scene(state, world2) {
  const { x, y, w, h } = SCENE;
  const beach = terrainFor(state.species) === "beach";
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
<g clip-path="url(#pf-clip)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#pf-sky)"/>
  ${world2.weather === "clear" ? `<g class="pf-star">${stars}</g>` : overcast2}
  <rect x="${x}" y="${GROUND_Y}" width="${w}" height="${y + h - GROUND_Y}" style="fill:var(--pf-ground)"/>
  <path d="${bumps}" style="fill:var(--pf-ground)"/>
  ${groundCover(state.species, AREA, y + h, LOOKS[world2.season].snow)}
  ${beach ? pebbles : ""}
  ${props(state.species, AREA)}`;
}
function foreground(world2, rng) {
  const look = LOOKS[world2.season];
  const particles = world2.weather === "rain" && world2.season !== "winter" ? rain(rng, AREA) : fallingParticles(look, rng, AREA);
  return [
    world2.weather === "clear" ? fireflies(look, rng, AREA) : "",
    particles,
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
function pet(state) {
  if (state.ranAway) return goodbye();
  const scale = state.stage === "baby" ? 3 : 4;
  const sprite = renderPetSprite(state, scale);
  sprite.svg += careOverlay(state.care, sprite.width, sprite.height, scale);
  const box = positionFor(sprite.width, sprite.height, scale);
  if (state.stage === "egg") {
    const wobble = state.mood === "happy" || state.mood === "idle" ? "pf-wobble" : "";
    return { svg: `${shadow(box, "idle")}<g transform="translate(${box.x} ${box.y})"><g class="${wobble}">${sprite.svg}</g></g>`, box };
  }
  const turns = state.mood === "idle" && getSpecies(state.species).facing === "right";
  return { svg: animated(box, state.mood, turns ? `<g class="pf-turn">${sprite.svg}</g>` : sprite.svg), box };
}
function animated(box, mood, body) {
  const { outer, inner } = motionClass(mood);
  return `<g class="${outer}">${shadow(box, mood)}<g transform="translate(${box.x} ${box.y})"><g class="${inner}">${body}</g></g></g>`;
}
function fx(grid, x, y, scale, cls, delay) {
  return `<g class="${cls}" style="animation-delay:-${delay}s">${renderPixels([{ x: 0, y: 0, grid }], FX_PALETTE, { x: round(x), y: round(y), scale })}</g>`;
}
function effects(state, box) {
  if (state.ranAway) return "";
  const out = [careProps(state.care, SCENE.x + 14, SCENE.x + SCENE.w - 14, GROUND_Y)];
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
  if (state.ranAway) return "Ran away \xB7 a commit will bring it home";
  const visit = visitorLine(state.care);
  if (visit) return visit;
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
  const creature = pet(state);
  const world2 = {
    season: options.season ?? seasonFor(state.date, options.hemisphere),
    weather: weatherFor(state.daysSinceLastContribution)
  };
  const filter = themeFilter(options.theme);
  const title = `${state.petName}, ${state.login}'s ProfileForge pet`;
  const desc = `Level ${state.level} ${state.className} ${state.species}, feeling ${state.mood}. ${state.streak}-day streak.`;
  const border = options.hideBorder ? "" : `<rect x=".5" y=".5" width="${W2 - 1}" height="${H2 - 1}" rx="10" fill="none" style="stroke:var(--pf-border)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pf" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}" role="img" aria-labelledby="pf-title pf-desc">
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
${CSS2}</style>
${filter.defs}
<rect width="${W2}" height="${H2}" rx="10" style="fill:var(--pf-bg)"/>
${border}
${scene(state, world2)}
  <g${filter.attr}>
  ${creature.svg}
  ${effects(state, creature.box)}
  </g>
  ${foreground(world2, seeded(`pet:${state.login}`))}
</g>
${panel(state)}
</svg>`;
}

// src/widgets.ts
var world = (p) => ({ theme: p.theme, hideBorder: p.hideBorder, season: p.season, hemisphere: p.hemisphere });
var cityPet = (p) => p.showPet ? { petName: p.petName, species: p.species } : false;
function renderWidget(profile, params, care) {
  const style = { theme: params.theme, hideBorder: params.hideBorder };
  if (params.widget === "city") {
    const city = computeCityState(profile, cityPet(params));
    if (care && city.pet) city.pet = applyCare(city.pet, care.state, care.now);
    return renderCityCard(city, { ...style, season: params.season, hemisphere: params.hemisphere });
  }
  const pet2 = computePetState(profile, { petName: params.petName, species: params.species });
  return renderPetCard(care ? applyCare(pet2, care.state, care.now) : pet2, world(params));
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
async function generate({ user, token, outputs, workspace, fetch: fetch2 = fetchProfile, care }) {
  const targets = outputs.map((o) => ({ ...o, full: resolveInside(workspace, o.path) }));
  const profile = await fetch2(user, token);
  for (const { full, params } of targets) {
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, renderWidget(profile, params, care));
  }
  const pet2 = targets.find((t) => t.params.widget === "pet")?.params;
  const plain = computePetState(profile, { petName: pet2?.petName, species: pet2?.species });
  const state = care ? applyCare(plain, care.state, care.now) : plain;
  return { files: targets.map((t) => t.full), state };
}

// src/action/care.ts
async function prepareCare({ workspace, file, token, repo, now, fetch: f = fetch }) {
  if (!file.endsWith(".json")) throw new Error(`care_file "${file}" must be a .json file`);
  const full = resolveInside(workspace, file);
  const warnings = [];
  const text = await readFile(full, "utf8").catch(() => null);
  const parsed = parseCareState(text, now);
  if (parsed.warning) warnings.push(parsed.warning);
  let issues = [];
  try {
    issues = await listCareIssues(token, repo, f);
  } catch (err) {
    warnings.push(`couldn't list issues, skipping visits this run (${err.message})`);
  }
  const before = new Set(parsed.state.handled);
  const { state, handled } = applyIssues(parsed.state, issues, now);
  const leftOpen = issues.filter((i) => before.has(i.number)).map((i) => i.number);
  await mkdir2(dirname2(full), { recursive: true });
  await writeFile2(full, serializeCareState(state));
  return { care: { state, now }, file: full, handled, leftOpen, warnings };
}
async function answerIssues(token, repo, prepared, petName, f = fetch) {
  const warnings = [];
  for (const { issue, outcome } of prepared.handled) {
    try {
      await comment(token, repo, issue.number, replyFor(outcome, petName, issue.login), f);
      await close(token, repo, issue.number, f);
    } catch (err) {
      warnings.push(err.message);
    }
  }
  for (const number of prepared.leftOpen) {
    try {
      await close(token, repo, number, f);
    } catch (err) {
      warnings.push(err.message);
    }
  }
  return warnings;
}

// src/action/log.ts
function escapeCommand(text) {
  return text.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
}
var warn = (message) => console.log(`::warning title=ProfileForge::${escapeCommand(message)}`);
var fail = (message) => console.log(`::error title=ProfileForge::${escapeCommand(message)}`);

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
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  let prepared;
  if (input("care") === "true") {
    prepared = await prepareCare({ workspace, file: input("care_file") || "profileforge/care.json", token, repo, now: /* @__PURE__ */ new Date() });
    prepared.warnings.forEach(warn);
  }
  const { files, state } = await generate({ user, token, outputs, workspace, care: prepared?.care });
  const mood = `${state.petName} is ${state.mood} \xB7 Lv.${state.level} ${state.className} (${state.stage})`;
  console.log(`\u{1F980} ${mood}`);
  for (const f of files) console.log(`  wrote ${relative2(workspace, f)}`);
  const visits = prepared ? ` \xB7 Visits handled: ${prepared.handled.length}` : "";
  appendTo("GITHUB_STEP_SUMMARY", `### \u{1F980} ${mood}

Streak: ${state.streak} days \xB7 XP: ${state.xp}${visits}`);
  appendTo("GITHUB_OUTPUT", `mood=${state.mood}
level=${state.level}
stage=${state.stage}`);
  if (input("commit") !== "false") {
    const toCommit = prepared ? [...files, prepared.file] : files;
    commitAndPush(workspace, toCommit, input("commit_message") || "chore: feed the ProfileForge pet");
  }
  if (prepared) (await answerIssues(token, repo, prepared, state.petName)).forEach(warn);
}
main().catch((err) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
