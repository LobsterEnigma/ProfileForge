function hexToHsl(hex: string): [number, number, number] | null {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((c) => parseInt(c, 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function lightness(hex: string): number {
  return hexToHsl(hex)?.[2] ?? 0;
}

/**
 * Turns a language color into something that reads as neon: saturated and bright.
 * (Some official colors, like C's #555555, would otherwise look like a dead sign.)
 */
export function neonize(hex: string | null, fallback = "#ff79c6"): string {
  const hsl = hex ? hexToHsl(hex) : null;
  if (!hsl) return fallback;
  const [h, s, l] = hsl;
  // Greys have no hue to saturate; give them a cool white glow instead.
  if (s < 0.08) return hslToHex(0.55, 0.35, 0.8);
  return hslToHex(h, Math.max(s, 0.7), Math.min(Math.max(l, 0.62), 0.74));
}
