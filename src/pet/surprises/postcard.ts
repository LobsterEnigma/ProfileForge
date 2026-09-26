/**
 * Weekend travels: on a quiet weekend day the pet may pack a bag and head somewhere only a
 * programmer would go, sending back a postcard with itself in the picture.
 */
import { pick, seeded } from "../../random.js";
import { RectBatch } from "../../svg/batch.js";
import type { Grid } from "../../svg/pixel.js";
import { renderPetSprite, type Sprite } from "../sprite.js";
import { HEART } from "../sprites.js";
import { px, round, text, type Art, type Ctx } from "./kit.js";

/** The photo is 128 × 56; `draw` paints it from its top-left corner and places the pet. */
interface Place {
  name: string;
  ink: string;
  draw: (x: number, y: number, pet: Sprite) => string;
}

const at = (pet: Sprite, x: number, y: number) => `<g transform="translate(${round(x)} ${round(y)})">${pet.svg}</g>`;

const PALM: Grid = ["gg.gg..", ".gggg.g", "gg.bggg", "...b..g", "...b...", "..b....", "..b....", "..b...."];
/** A corn kernel: a flat top tapering to a pale tip. */
const KERNEL: Grid = [
  "..yyyyyyyyyy..",
  ".yyyyyyyyyyyy.",
  "yyhhyyyyyyyyyo",
  "yyhhyyyyyyyyyo",
  "yyhyyyyyyyyyyo",
  ".yyyyyyyyyyyo.",
  ".yyyyyyyyyyyo.",
  "..yyyyyyyyyo..",
  "..yyyyyyyyyo..",
  "...yyyyyyyo...",
  "....yyyyyo....",
  ".....wwww.....",
  "......ww......",
];

const PLACES: Place[] = [
  {
    name: "NULL ISLAND",
    ink: "#1971c2",
    draw: (x, y, pet) => {
      const b = new RectBatch()
        .add("#8fd3ff", x, y, 128, 36)
        .add("#3a86c8", x, y + 36, 128, 20)
        .add("#9fd4ff", x + 10, y + 42, 10, 1)
        .add("#9fd4ff", x + 96, y + 46, 14, 1)
        .add("#9fd4ff", x + 50, y + 51, 12, 1)
        .add("#f4d58d", x + 30, y + 32, 60, 6)
        .add("#f4d58d", x + 36, y + 30, 48, 2)
        .add("#8a5a33", x + 14, y + 22, 2, 12)
        .add("#ffffff", x + 6, y + 16, 19, 8);
      return (
        b +
        `<circle cx="${x + 112}" cy="${y + 12}" r="7" fill="#ffe066"/>` +
        text("0,0", x + 9, y + 17.5, 1, "#1f2328") +
        px(PALM, { g: "#2f9e44", b: "#8a5a33" }, x + 76, y + 8, 3) +
        at(pet, x + 32, y + 32 - pet.height + 2)
      );
    },
  },
  {
    name: "LOCALHOST",
    ink: "#2b8a3e",
    draw: (x, y, pet) => {
      const b = new RectBatch()
        .add("#ffd8a8", x, y, 128, 44)
        .add("#8ce99a", x, y + 44, 128, 12)
        .add("#69db7c", x, y + 44, 128, 2)
        .add("#f8f0e3", x + 70, y + 24, 40, 20)
        .add("#ffffff", x + 73, y + 26, 34, 7)
        .add("#8a5a33", x + 86, y + 34, 8, 10)
        .add("#ffd43b", x + 74, y + 35, 7, 6)
        .add("#ffd43b", x + 99, y + 35, 7, 6);
      return (
        `<circle cx="${x + 22}" cy="${y + 36}" r="9" fill="#ffa94d"/>` +
        b +
        `<path d="M${x + 66} ${y + 24}L${x + 90} ${y + 8}L${x + 114} ${y + 24}Z" fill="#c92a2a"/>` +
        text("127.0.0.1", x + 76, y + 27, 1, "#495057") +
        at(pet, x + 30, y + 46 - pet.height)
      );
    },
  },
  {
    name: "THE CLOUD",
    ink: "#1c7ed6",
    draw: (x, y, pet) => {
      const b = new RectBatch()
        .add("#74c0fc", x, y, 128, 56)
        .add("#a5d8ff", x, y + 30, 128, 26)
        .add("#ffffff", x + 8, y + 40, 112, 16)
        .add("#ffffff", x + 18, y + 33, 44, 8)
        .add("#ffffff", x + 70, y + 31, 40, 10)
        .add("#ffffff", x + 28, y + 27, 22, 6)
        .add("#ffffff", x + 92, y + 10, 24, 6)
        .add("#ffffff", x + 97, y + 6, 12, 4)
        .add("#495057", x + 84, y + 15, 14, 18)
        .add("#343a40", x + 84, y + 15, 14, 2);
      const leds = [0, 1, 2].map((i) => `<rect class="${i % 2 ? "pf-s-blink" : "pf-s-blink2"}" x="${x + 87}" y="${y + 19 + i * 5}" width="8" height="2" fill="#51cf66"/>`).join("");
      return b + leds + at(pet, x + 30, y + 34 - pet.height + 2);
    },
  },
  {
    name: "STACK OVERFLOW",
    ink: "#e8590c",
    draw: (x, y, pet) => {
      const b = new RectBatch().add("#d0ebff", x, y, 128, 48).add("#ced4da", x, y + 48, 128, 8);
      const boxes: string[] = [];
      for (let i = 0; i < 5; i++) {
        const bx = x + 74 + (i % 2 ? 3 : -2) + (i === 4 ? 4 : 0);
        const by = y + 40 - i * 9;
        boxes.push(`<rect x="${bx}" y="${by}" width="22" height="8" fill="${i % 2 ? "#ffa94d" : "#f76707"}" stroke="#7a3500" stroke-width="1"/>`);
      }
      const top = `<g class="pf-s-teeter"><rect x="${x + 80}" y="${y - 5}" width="22" height="8" fill="#f76707" stroke="#7a3500" stroke-width="1"/></g>`;
      return b + boxes.join("") + top + at(pet, x + 30, y + 48 - pet.height + 1);
    },
  },
  {
    name: "PORT 8080",
    ink: "#0b7285",
    draw: (x, y, pet) => {
      const b = new RectBatch()
        .add("#a5d8ff", x, y, 128, 34)
        .add("#1971c2", x, y + 34, 128, 22)
        .add("#74c0fc", x + 76, y + 44, 12, 1)
        .add("#74c0fc", x + 104, y + 50, 14, 1)
        .add("#8a5a33", x, y + 32, 64, 4)
        .add("#6b4226", x + 6, y + 36, 3, 14)
        .add("#6b4226", x + 34, y + 36, 3, 14)
        .add("#6b4226", x + 58, y + 36, 3, 14)
        .add("#8a5a33", x + 62, y + 22, 2, 10)
        .add("#ffffff", x + 54, y + 15, 19, 8);
      let tower = "";
      for (let i = 0; i < 4; i++) tower += `<rect x="${x + 100}" y="${y + 10 + i * 6}" width="10" height="6" fill="${i % 2 ? "#ffffff" : "#e03131"}"/>`;
      return (
        b +
        tower +
        `<rect x="${x + 98}" y="${y + 34}" width="14" height="2" fill="#495057"/><rect x="${x + 99}" y="${y + 2}" width="12" height="8" fill="#343a40"/>` +
        `<rect class="pf-s-blink" x="${x + 101}" y="${y + 4}" width="8" height="4" fill="#ffe066"/>` +
        text("8080", x + 56, y + 16.5, 1, "#1f2328") +
        at(pet, x + 6, y + 32 - pet.height + 2)
      );
    },
  },
  {
    name: "THE KERNEL",
    ink: "#e67700",
    draw: (x, y, pet) => {
      const b = new RectBatch().add("#3b1f5c", x, y, 128, 46).add("#5c3d2e", x, y + 46, 128, 10);
      for (const [sx, sy] of [[8, 8], [30, 20], [52, 6], [112, 14], [120, 34], [60, 30]] as const) b.add("#ffffff", x + sx, y + sy, 1, 1);
      return (
        b +
        px(KERNEL, { y: "#ffd43b", h: "#fff3bf", o: "#f59f00", w: "#fff9db" }, x + 76, y + 5, 3) +
        at(pet, x + 30, y + 46 - pet.height + 2)
      );
    },
  },
];

export function postcardPlace(login: string, date: string): Place {
  return pick(seeded(`postcard:${login}:${date}`), PLACES);
}

const title = (name: string) => name.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase());

export function postcard(c: Ctx): Art {
  const { scene: sc, state } = c;
  const place = postcardPlace(state.login, state.date);
  const pet = renderPetSprite({ ...state, mood: "happy", trick: undefined, care: undefined }, 2, { lively: false });
  const W = 140;
  const H = 94;
  const x = sc.x + 12;
  const y = sc.y + 36;
  const photo = { x: x + 6, y: y + 6 };

  const greet = text("GREETINGS FROM", x + 8, y + 67, 1, "#8a6d4b");
  const name = text(place.name, x + 8, y + 76, 2, place.ink, "#e9dfcc");
  const stamp =
    `<g transform="rotate(6 ${x + W - 16} ${y + 14})"><rect x="${x + W - 28}" y="${y}" width="22" height="26" fill="#ffffff" stroke="#adb5bd" stroke-width="1" stroke-dasharray="2 1"/>` +
    `<rect x="${x + W - 25}" y="${y + 3}" width="16" height="20" fill="#ffe3e3"/>${px(HEART, { p: "#e03131" }, x + W - 22, y + 9, 2)}</g>` +
    `<g fill="none" stroke="#495057" stroke-width="1" opacity=".55"><circle cx="${x + W - 34}" cy="${y + 20}" r="9"/><circle cx="${x + W - 34}" cy="${y + 20}" r="6"/>` +
    `<path d="M${x + W - 72} ${y + 16}q4 -3 8 0t8 0t8 0t8 0M${x + W - 72} ${y + 22}q4 -3 8 0t8 0t8 0t8 0"/></g>`;
  const card =
    `<rect x="${x + 3}" y="${y + 3}" width="${W}" height="${H}" fill="#000000" opacity=".2"/>` +
    `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#fffaf0" stroke="#d9cbb0" stroke-width="1"/>` +
    `<clipPath id="pf-s-photo"><rect x="${photo.x}" y="${photo.y}" width="128" height="56"/></clipPath>` +
    `<g clip-path="url(#pf-s-photo)">${place.draw(photo.x, photo.y, pet)}</g>` +
    greet +
    name +
    stamp;
  // Hung on a line with a clothes peg.
  const line = `<path d="M${sc.x} ${y - 8}Q${sc.x + sc.w / 2} ${y - 2} ${sc.x + sc.w} ${y - 8}" fill="none" stroke="#8d96a0" stroke-width="1"/>`;
  const peg = `<rect x="${x + W / 2 - 3}" y="${y - 9}" width="6" height="13" rx="1" fill="#d9a066"/><rect x="${x + W / 2 - 1}" y="${y - 9}" width="2" height="13" fill="#b07d4a"/>`;
  const right = sc.x + sc.w;
  const g = sc.ground;
  const mailbox =
    `<rect x="${right - 18}" y="${g - 24}" width="4" height="24" fill="#8a5a33"/><rect x="${right - 27}" y="${g - 36}" width="22" height="13" rx="4" fill="#1c7ed6"/>` +
    `<rect x="${right - 25}" y="${g - 31}" width="12" height="2" fill="#0b3a66"/><rect x="${right - 6}" y="${g - 46}" width="2" height="12" fill="#e03131"/><rect x="${right - 6}" y="${g - 46}" width="7" height="5" fill="#e03131"/>`;
  return {
    css: `.pf-s-sway{transform-box:fill-box;transform-origin:50% 0;animation:pf-s-sway 4.5s ease-in-out infinite alternate}@keyframes pf-s-sway{from{transform:rotate(-2.5deg)}to{transform:rotate(2deg)}}
.pf-s-teeter{transform-box:fill-box;transform-origin:0 100%;animation:pf-s-teeter 2.4s ease-in-out infinite alternate}@keyframes pf-s-teeter{from{transform:rotate(-4deg)}to{transform:rotate(14deg)}}`,
    replace: `${line}${mailbox}<g class="pf-s-sway">${peg}${card}</g>`,
    line: `Away · postcard from ${title(place.name)}`,
  };
}
