/**
 * Pixel art as ASCII grids: every character is one pixel, looked up in a palette.
 * `.` and space are transparent.
 *
 *   const heart = ["pp.pp", "ppppp", ".ppp.", "..p.."];
 */
export type Grid = readonly string[];
export type Palette = Readonly<Record<string, string>>;

export interface PixelOptions {
  x?: number;
  y?: number;
  /** Size of one pixel in SVG units. */
  scale: number;
}

/** A grid positioned on a larger canvas, measured in pixels (not SVG units). */
export interface Layer {
  x: number;
  y: number;
  grid: Grid;
}

export const layer = (x: number, y: number, grid: Grid): Layer => ({ x, y, grid });

export function mirror(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse().join(""));
}

function fillAttr(color: string): string {
  // CSS variables are only valid inside style, not in presentation attributes.
  return color.startsWith("var(") ? `style="fill:${color}"` : `fill="${color}"`;
}

/**
 * Renders layers into one `<path>` per color. Horizontal runs of the same color are
 * merged, which keeps a 20×13 sprite to a few hundred bytes.
 */
export function renderPixels(layers: readonly Layer[], palette: Palette, { x = 0, y = 0, scale }: PixelOptions): string {
  const paths = new Map<string, string[]>();

  for (const l of layers) {
    l.grid.forEach((row, ry) => {
      let cx = 0;
      while (cx < row.length) {
        const ch = row[cx]!;
        let run = 1;
        while (row[cx + run] === ch) run++;
        if (ch !== "." && ch !== " ") {
          const color = palette[ch];
          if (color === undefined) throw new Error(`Pixel "${ch}" has no palette entry`);
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

export const pixelSize = (grid: Grid) => ({
  width: Math.max(0, ...grid.map((r) => r.length)),
  height: grid.length,
});

/**
 * Adds a one-pixel outline (`o`) around a grid's shape, growing it by a pixel on every side.
 * Outlines are what make small pixel art read clearly on any background.
 */
export function outlined(grid: Grid): Grid {
  const w = Math.max(...grid.map((r) => r.length)) + 2;
  const padded = ["", ...grid, ""].map((row) => `.${row}`.padEnd(w, "."));
  const solid = (x: number, y: number) => {
    const c = padded[y]?.[x];
    return c !== undefined && c !== "." && c !== " ";
  };
  return padded.map((row, y) =>
    [...row].map((c, x) => (c === "." && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ? "o" : c)).join(""),
  );
}
