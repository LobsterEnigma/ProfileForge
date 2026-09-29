/**
 * GitHub Action entry point. Bundled into dist/action.js (`npm run build:action`),
 * so it runs with zero dependencies on the runner.
 */
import { appendFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { LOGIN_RE } from "../options.js";
import { answerCare, ensureHouse, prepareCare, type Prepared } from "./care.js";
import { houseLink } from "../care/commands.js";
import { parseRules } from "../care/state.js";
import { generate, parseOutputs, resolveInside } from "./generate.js";
import { commitAndPush, prepareBranch, publishToBranch, readFromBranch } from "./publish.js";
import { fail, warn } from "./log.js";

function input(name: string): string {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? "").trim();
}

function appendTo(envFile: string, text: string): void {
  const path = process.env[envFile];
  if (path) appendFileSync(path, text + "\n");
}

async function main(): Promise<void> {
  const user = input("github_user_name");
  const token = input("github_token");
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();

  if (!LOGIN_RE.test(user)) throw new Error(`"${user}" is not a valid GitHub login`);
  if (!token) throw new Error("github_token is empty");

  const outputs = parseOutputs(input("outputs"));
  const repo = process.env.GITHUB_REPOSITORY ?? "";

  // With `branch`, everything goes to a separate branch, replaced by one commit each run.
  const branch = input("commit") !== "false" ? input("branch") : "";
  const branchExists = branch ? prepareBranch(workspace, branch) : false;

  // Visitors' care, if the owner turned it on: applied before rendering, answered after committing.
  let prepared: Prepared | undefined;
  if (input("care") === "true") {
    const careFile = input("care_file") || "profileforge/care.json";
    if (!careFile.endsWith(".json")) throw new Error(`care_file "${careFile}" must be a .json file`);
    // The log lives on the output branch too; bring it back (a copy on main is the fallback).
    const saved = branchExists ? readFromBranch(workspace, branch, careFile) : null;
    if (saved !== null) {
      const full = resolveInside(workspace, careFile);
      await mkdir(dirname(full), { recursive: true });
      await writeFile(full, saved);
    }
    const house = input("care_issue");
    if (house && !/^[1-9]\d{0,9}$/.test(house)) throw new Error(`care_issue "${house}" is not an issue number`);
    prepared = await prepareCare({
      workspace,
      file: careFile,
      token,
      repo,
      now: new Date(),
      house: house ? Number(house) : undefined,
      rules: parseRules(input("care_actions"), input("dirt")),
    });
    prepared.warnings.forEach(warn);
  }

  const { files, state } = await generate({ user, token, outputs, workspace, care: prepared?.care });

  const mood = `${state.petName} is ${state.mood} · Lv.${state.level} ${state.className} (${state.stage})`;
  console.log(`🦀 ${mood}`);
  for (const f of files) console.log(`  wrote ${relative(workspace, f)}`);
  let opened: number | null = null;
  if (prepared) {
    try {
      opened = await ensureHouse(prepared, token, repo, state.petName);
    } catch (err) {
      warn(`couldn't open the pet's house (${(err as Error).message})`);
    }
  }

  const house = prepared?.care.state.house.issue;
  const visits = prepared ? ` · Visits: ${prepared.handled.length}${house ? ` · House: ${houseLink(repo, house)}` : ""}` : "";
  if (opened) console.log(`🏠 Opened ${state.petName}'s house: ${houseLink(repo, opened)}. Link to it from your README!`);
  appendTo("GITHUB_STEP_SUMMARY", `### 🦀 ${mood}\n\nStreak: ${state.streak} days · XP: ${state.xp}${visits}`);
  appendTo("GITHUB_OUTPUT", `mood=${state.mood}\nlevel=${state.level}\nstage=${state.stage}`);

  if (input("commit") !== "false") {
    const toCommit = prepared ? [...files, prepared.file] : files;
    const message = input("commit_message") || "chore: feed the ProfileForge pet";
    const result = branch ? await publishToBranch(workspace, branch, toCommit, message) : commitAndPush(workspace, toCommit, message);
    const paths = toCommit.map((f) => relative(workspace, f)).join(", ");
    if (result === "unchanged") console.log("Pet unchanged since last run, nothing to commit.");
    else console.log(branch ? `Published ${paths} to the ${branch} branch (one commit, history replaced)` : `Committed ${paths}`);
  }

  // Only now, with the visits saved, tell the visitors.
  if (prepared) (await answerCare(token, repo, prepared, state.petName)).forEach(warn);
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
