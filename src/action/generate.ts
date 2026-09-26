import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fetchProfile } from "../github/fetch.js";
import { parsePetParams, type PetParams } from "../options.js";
import { computePetState } from "../pet/state.js";
import type { GitHubProfile, PetState } from "../types.js";
import { applyCare } from "../care/view.js";
import { renderWidget, type Care } from "../widgets.js";

export interface OutputSpec {
  /** Relative to the workspace, e.g. `profileforge/pet.svg`. */
  path: string;
  params: PetParams;
}

/**
 * One output per line, `path?query`, using the same query params as the API:
 *
 *   profileforge/pet.svg
 *   profileforge/pet-dark.svg?theme=dark&name=Ferris
 */
export function parseOutputs(text: string): OutputSpec[] {
  const specs = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const q = line.indexOf("?");
      const path = q === -1 ? line : line.slice(0, q);
      const query = q === -1 ? "" : line.slice(q + 1);
      if (!path.endsWith(".svg")) throw new Error(`Output "${path}" must end with .svg`);
      return { path, params: parsePetParams(new URLSearchParams(query)) };
    });
  if (specs.length === 0) throw new Error("No outputs given");
  return specs;
}

/** Resolves an output path, refusing anything that would escape the workspace. */
export function resolveInside(workspace: string, path: string): string {
  const full = resolve(workspace, path);
  const rel = relative(workspace, full);
  if (!rel || rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Output "${path}" must stay inside the repository`);
  }
  return full;
}

export interface GenerateOptions {
  user: string;
  token: string;
  outputs: OutputSpec[];
  workspace: string;
  fetch?: (login: string, token: string) => Promise<GitHubProfile>;
  care?: Care;
}

export interface GenerateResult {
  files: string[];
  /** The pet's state (named after the first pet output), for logs and step outputs. */
  state: PetState;
}

export async function generate({ user, token, outputs, workspace, fetch = fetchProfile, care }: GenerateOptions): Promise<GenerateResult> {
  // Validate every path before touching the network or the disk.
  const targets = outputs.map((o) => ({ ...o, full: resolveInside(workspace, o.path) }));
  const profile = await fetch(user, token);

  for (const { full, params } of targets) {
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, renderWidget(profile, params, care));
  }
  const pet = targets.find((t) => t.params.widget === "pet")?.params;
  const plain = computePetState(profile, { petName: pet?.petName, species: pet?.species, runaway: pet?.runaway });
  const state = care ? applyCare(plain, care.state, care.now, care.rules) : plain;
  return { files: targets.map((t) => t.full), state };
}
