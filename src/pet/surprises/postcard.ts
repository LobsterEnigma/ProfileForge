/**
 * Weekend trips. On a quiet weekend day the pet may pack a bag and head off around the world
 * (or somewhere only a programmer would go), sending back a postcard with itself in the picture.
 * Like a travelling frog, it keeps you guessing: 58 destinations (see places/), each with its
 * own stamp; now and then a friend in the photo, a night shot, or a rare golden stamp; and the
 * day after, a souvenir.
 */
import { pick, seeded } from "../../random.js";
import { RectBatch } from "../../svg/batch.js";
import { outlined, type Grid } from "../../svg/pixel.js";
import { PLACES } from "./places/index.js";
import { PH, PW, type Place } from "./places/types.js";
import { SPECIES } from "../species/index.js";
import { renderPetSprite, type Sprite } from "../sprite.js";
import { px, round, text, type Art, type Ctx } from "./kit.js";
import type { PetState } from "../../types.js";

const SPARKLE: Grid = ["..s..", ".sss.", "sssss", ".sss.", "..s.."];

export const PLACE_COUNT = PLACES.length;

/** Everything about a trip is decided by the date: where, and what kind of photo came back. */
export function tripFor(login: string, date: string) {
  const rng = seeded(`postcard:${login}:${date}`);
  const place = pick(rng, PLACES);
  const roll = rng();
  return {
    place,
    golden: roll < 0.08,
    night: roll >= 0.08 && roll < 0.22,
    friend: roll >= 0.22 && roll < 0.42 ? pick(rng, Object.keys(SPECIES)) : null,
  };
}

export { PLACES };
export type { Place };

export function postcardPlace(login: string, date: string): Place {
  return tripFor(login, date).place;
}

/** "NULL ISLAND" → "Null Island"; paths like /dev/null stay lower case. */
export const placeTitle = (name: string) => (name.startsWith("/") ? name.toLowerCase() : name.toLowerCase().replace(/\b[a-z]/g, (ch) => ch.toUpperCase()));

const at = (sprite: Sprite, feet: { x: number; y: number }) => `<g transform="translate(${round(feet.x - sprite.width / 2)} ${round(feet.y - sprite.height)})">${sprite.svg}</g>`;

/** Just the photo of `place` with a pet in it, at the origin (for previews and tests). */
export function placePhoto(place: Place, species: string, state: PetState): string {
  const shot = place.draw(0, 0);
  const pet = renderPetSprite({ ...state, species, mood: "happy", trick: undefined, care: undefined }, 2, { lively: false });
  return `${shot.bg}${at(pet, shot.feet)}${shot.fg ?? ""}`;
}

export function postcard(c: Ctx): Art {
  const { scene: sc, state } = c;
  const trip = tripFor(state.login, state.date);
  const { place } = trip;
  const snapshot = (species: string) => renderPetSprite({ ...state, species, mood: "happy", trick: undefined, care: undefined }, 2, { lively: false });
  const W = 152;
  const H = 98;
  const x = sc.x + 6;
  const y = sc.y + 34;
  const photo = { x: x + 6, y: y + 6 };

  // The photo: the place, maybe at night, maybe with a friend, and the pet (flash on).
  const shot = place.draw(photo.x, photo.y);
  const night = trip.night
    ? `<rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}" fill="#0b1040" opacity=".5"/>` +
      [[10, 6], [30, 14], [62, 4], [84, 10], [48, 18]].map(([dx, dy]) => `<rect x="${photo.x + dx!}" y="${photo.y + dy!}" width="1.5" height="1.5" fill="#fff8d6"/>`).join("")
    : "";
  const friend = trip.friend && shot.friend && trip.friend !== state.species ? at(snapshot(trip.friend), shot.friend) : "";
  const pictured = `${shot.bg}${night}${friend}${at(snapshot(state.species), shot.feet)}${shot.fg ?? ""}`;

  // The back half of the card: a stamp (golden, if you're lucky), a postmark, and an address.
  const sx = x + W - 34;
  const sy = y + 6;
  const iconW = place.stamp.grid[0]!.length * 2;
  const iconH = place.stamp.grid.length * 2;
  const iconColors = trip.golden ? Object.fromEntries(Object.keys(place.stamp.colors).map((k) => [k, "#b8860b"])) : place.stamp.colors;
  const stamp =
    `<rect x="${sx}" y="${sy}" width="26" height="30" fill="#ffffff" stroke="${trip.golden ? "#c99a1a" : "#adb5bd"}" stroke-width="1" stroke-dasharray="2 1"/>` +
    `<rect x="${sx + 3}" y="${sy + 3}" width="20" height="24" fill="${trip.golden ? "#ffe066" : place.stamp.bg}"/>` +
    px(place.stamp.grid, iconColors, sx + 13 - iconW / 2, sy + 15 - iconH / 2, 2) +
    (trip.golden ? `<g class="pf-s-twinkle">${px(SPARKLE, { s: "#fff9db" }, sx + 18, sy - 3, 1.5)}</g>` : "");
  const postmark = `<g fill="none" stroke="#495057" stroke-width="1" opacity=".5"><circle cx="${sx}" cy="${sy + 30}" r="8"/><circle cx="${sx}" cy="${sy + 30}" r="5"/></g>`;
  const address = new RectBatch()
    .add("#c9b79a", x + PW + 12, y + 50, W - PW - 20, 1)
    .add("#c9b79a", x + PW + 12, y + 57, W - PW - 20, 1)
    .add("#c9b79a", x + PW + 12, y + 64, W - PW - 26, 1)
    .toString();
  const scribble = `<path d="M${x + PW + 13} ${y + 47}q3 -3 6 0t6 0t6 0M${x + PW + 13} ${y + 54}q3 -3 6 0t6 0" fill="none" stroke="#5b4636" stroke-width="1"/>`;

  const card =
    `<rect x="${x + 3}" y="${y + 3}" width="${W}" height="${H}" fill="#000000" opacity=".2"/>` +
    `<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#fffaf0" stroke="#d9cbb0" stroke-width="1"/>` +
    `<clipPath id="pf-s-photo"><rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}"/></clipPath>` +
    `<g clip-path="url(#pf-s-photo)">${pictured}</g><rect x="${photo.x}" y="${photo.y}" width="${PW}" height="${PH}" fill="none" stroke="#5b4636" stroke-width="1" opacity=".4"/>` +
    stamp +
    postmark +
    address +
    scribble +
    text("GREETINGS FROM", x + 7, y + 71, 1, "#8a6d4b") +
    text(place.name, x + 7, y + 79, 2, place.ink, "#e9dfcc");
  const line = `<path d="M${sc.x} ${y - 8}Q${sc.x + sc.w / 2} ${y - 2} ${sc.x + sc.w} ${y - 8}" fill="none" stroke="#8d96a0" stroke-width="1"/>`;
  const peg = `<rect x="${x + W / 2 - 3}" y="${y - 9}" width="6" height="13" rx="1" fill="#d9a066"/><rect x="${x + W / 2 - 1}" y="${y - 9}" width="2" height="13" fill="#b07d4a"/>`;
  const right = sc.x + sc.w;
  const g = sc.ground;
  const mailbox =
    `<rect x="${right - 14}" y="${g - 24}" width="4" height="24" fill="#8a5a33"/><rect x="${right - 22}" y="${g - 36}" width="20" height="13" rx="4" fill="#1c7ed6"/>` +
    `<rect x="${right - 20}" y="${g - 31}" width="12" height="2" fill="#0b3a66"/><rect x="${right - 4}" y="${g - 46}" width="2" height="12" fill="#e03131"/><rect x="${right - 4}" y="${g - 46}" width="5" height="5" fill="#e03131"/>`;
  return {
    css: `.pf-s-sway{transform-box:fill-box;transform-origin:50% 0;animation:pf-s-sway 4.5s ease-in-out infinite alternate}@keyframes pf-s-sway{from{transform:rotate(-2deg)}to{transform:rotate(1.5deg)}}
.pf-s-teeter{transform-box:fill-box;transform-origin:0 100%;animation:pf-s-teeter 2.4s ease-in-out infinite alternate}@keyframes pf-s-teeter{from{transform:rotate(-4deg)}to{transform:rotate(14deg)}}`,
    replace: `${line}${mailbox}<g class="pf-s-sway">${peg}${card}</g>`,
    line: trip.golden ? "Weekend trip · a golden stamp!" : `Weekend trip · ${placeTitle(place.name)}`,
  };
}

/** The day after a trip: the pet is back, with a souvenir at its side. */
export function souvenir(c: Ctx): Art {
  const from = c.state.moments?.backFrom;
  const place = from ? postcardPlace(c.state.login, from) : PLACES[0]!;
  // Set down proudly at its side, full-size, with a little sparkle.
  // "@" for the outline, so a souvenir's own colours (even an "o") are left alone.
  const grid = outlined(place.souvenir.grid, "@");
  const s = c.scale;
  const w = grid[0]!.length * s;
  const h = grid.length * s;
  const x = c.species.width * s - w / 3;
  const y = c.species.height * s - h;
  const sparkle = `<g class="pf-s-twinkle">${px(SPARKLE, { s: "#fff3a0" }, x + w - 4, y - 8, 2)}</g>`;
  return {
    held: px(grid, { ...place.souvenir.colors, "@": "#3b2a1a" }, x, y, s) + sparkle,
    line: `Back home · brought ${place.souvenir.name}`,
  };
}
