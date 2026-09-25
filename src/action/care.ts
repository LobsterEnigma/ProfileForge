/**
 * Care, end to end: read the log, pick up care issues, apply them, save the log. Replies wait
 * until the log is committed, so an issue is only answered once its visit is safely stored.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { applyIssues, parseCareState, replyFor, serializeCareState, type Handled } from "../care/state.js";
import { close, comment, listCareIssues } from "../github/issues.js";
import type { Care } from "../widgets.js";
import { resolveInside } from "./generate.js";

type Fetch = typeof fetch;

export interface PrepareOptions {
  workspace: string;
  /** Relative to the workspace, must be a .json file. */
  file: string;
  token: string;
  /** owner/repo of the profile repository. */
  repo: string;
  now: Date;
  fetch?: Fetch;
}

export interface Prepared {
  care: Care;
  /** Absolute path of the saved care log, to commit alongside the SVGs. */
  file: string;
  handled: Handled[];
  /** Issues handled on an earlier run that are somehow still open (e.g. closing failed). */
  leftOpen: number[];
  warnings: string[];
}

export async function prepareCare({ workspace, file, token, repo, now, fetch: f = fetch }: PrepareOptions): Promise<Prepared> {
  if (!file.endsWith(".json")) throw new Error(`care_file "${file}" must be a .json file`);
  const full = resolveInside(workspace, file);
  const warnings: string[] = [];

  const text = await readFile(full, "utf8").catch(() => null);
  const parsed = parseCareState(text, now);
  if (parsed.warning) warnings.push(parsed.warning);

  let issues: Awaited<ReturnType<typeof listCareIssues>> = [];
  try {
    issues = await listCareIssues(token, repo, f);
  } catch (err) {
    warnings.push(`couldn't list issues, skipping visits this run (${(err as Error).message})`);
  }

  const before = new Set(parsed.state.handled);
  const { state, handled } = applyIssues(parsed.state, issues, now);
  const leftOpen = issues.filter((i) => before.has(i.number)).map((i) => i.number);

  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, serializeCareState(state));
  return { care: { state, now }, file: full, handled, leftOpen, warnings };
}

/** Replies to and closes handled issues. Failures become warnings: the visits are already saved. */
export async function answerIssues(
  token: string,
  repo: string,
  prepared: Pick<Prepared, "handled" | "leftOpen">,
  petName: string,
  f: Fetch = fetch,
): Promise<string[]> {
  const warnings: string[] = [];
  for (const { issue, outcome } of prepared.handled) {
    try {
      await comment(token, repo, issue.number, replyFor(outcome, petName, issue.login), f);
      await close(token, repo, issue.number, f);
    } catch (err) {
      warnings.push((err as Error).message);
    }
  }
  for (const number of prepared.leftOpen) {
    try {
      await close(token, repo, number, f);
    } catch (err) {
      warnings.push((err as Error).message);
    }
  }
  return warnings;
}
