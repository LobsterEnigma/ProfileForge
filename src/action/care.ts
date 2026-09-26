/**
 * Care, end to end. Visitors comment in the pet's house (one issue); each run reads the new
 * comments, applies them and saves the log. Reactions wait until the log is committed, so a
 * visitor only gets a ❤️ once their visit is safely stored.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  applyComments,
  houseIssue,
  LIMITS,
  parseCareState,
  reactionFor,
  redirectReply,
  serializeCareState,
  DEFAULT_RULES,
  type CareIssue,
  type CareRules,
  type CareState,
  type HandledComment,
} from "../care/state.js";
import { close, comment, createIssue, listCareIssues, listHouseComments, react } from "../github/issues.js";
import type { Care } from "../widgets.js";
import { resolveInside } from "./generate.js";

type Fetch = typeof fetch;

const ACTIONS_BOT = "github-actions[bot]";
const HOUSE_SUFFIX = "'s house 🏠";

export interface PrepareOptions {
  workspace: string;
  /** Relative to the workspace, must be a .json file. */
  file: string;
  token: string;
  /** owner/repo of the profile repository. */
  repo: string;
  now: Date;
  /** The house issue, when the owner picked one (`care_issue`). */
  house?: number;
  rules?: CareRules;
  fetch?: Fetch;
}

export interface Prepared {
  care: Care;
  /** Absolute path of the saved care log, to commit alongside the SVGs. */
  file: string;
  handled: HandledComment[];
  /** Open care issues outside the house (e.g. from old links), to point to the house and close. */
  strays: CareIssue[];
  warnings: string[];
}

const save = async (file: string, state: CareState) => {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, serializeCareState(state));
};

export async function prepareCare({ workspace, file, token, repo, now, house, rules = DEFAULT_RULES, fetch: f = fetch }: PrepareOptions): Promise<Prepared> {
  if (!file.endsWith(".json")) throw new Error(`care_file "${file}" must be a .json file`);
  const full = resolveInside(workspace, file);
  const warnings: string[] = [];

  const text = await readFile(full, "utf8").catch(() => null);
  const parsed = parseCareState(text, now);
  if (parsed.warning) warnings.push(parsed.warning);
  let state = parsed.state;
  if (house !== undefined) state.house.issue = house;

  let issues: CareIssue[] = [];
  try {
    issues = await listCareIssues(token, repo, f);
  } catch (err) {
    warnings.push(`couldn't list issues (${(err as Error).message})`);
  }
  // A house this Action opened on a run whose commit didn't land: move back in, don't build another.
  if (state.house.issue === null) {
    const orphan = issues.find((i) => i.login === ACTIONS_BOT && i.title.endsWith(HOUSE_SUFFIX));
    if (orphan) state.house.issue = orphan.number;
  }

  let handled: HandledComment[] = [];
  if (state.house.issue !== null) {
    try {
      const comments = await listHouseComments(
        token,
        repo,
        state.house.issue,
        { since: state.house.cursorAt, after: state.house.cursor, want: LIMITS.perRun },
        f,
      );
      ({ state, handled } = applyComments(state, comments, now, rules));
    } catch (err) {
      warnings.push(`couldn't read the house's comments, skipping visits this run (${(err as Error).message})`);
    }
  }

  // Never tidy away the owner's own issues, even if they look like care requests.
  const owner = repo.split("/")[0]!.toLowerCase();
  const strays = issues.filter((i) => i.number !== state.house.issue && i.userType === "User" && i.login.toLowerCase() !== owner);

  await save(full, state);
  return { care: { state, now, rules }, file: full, handled, strays, warnings };
}

/**
 * Opens the house on the first run, once the pet's name is known. Saves the log again with the
 * issue number, so it's committed with everything else. Returns the new issue, if any.
 */
export async function ensureHouse(prepared: Prepared, token: string, repo: string, petName: string, f: Fetch = fetch): Promise<number | null> {
  const { state } = prepared.care;
  if (state.house.issue !== null) return null;
  const { title, body } = houseIssue(petName, prepared.care.rules);
  const number = await createIssue(token, repo, title, body, f);
  state.house.issue = number;
  await save(prepared.file, state);
  return number;
}

/** Reacts to handled comments and tidies stray care issues. Failures become warnings. */
export async function answerCare(token: string, repo: string, prepared: Prepared, petName: string, f: Fetch = fetch): Promise<string[]> {
  const warnings: string[] = [];
  for (const { comment: c, outcome } of prepared.handled) {
    try {
      await react(token, repo, c.id, reactionFor(outcome), f);
    } catch (err) {
      warnings.push((err as Error).message);
    }
  }
  const house = prepared.care.state.house.issue;
  if (house !== null) {
    for (const stray of prepared.strays) {
      try {
        await comment(token, repo, stray.number, redirectReply(petName, house), f);
        await close(token, repo, stray.number, f);
      } catch (err) {
        warnings.push((err as Error).message);
      }
    }
  }
  return warnings;
}
