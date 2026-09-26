/**
 * GitHub Action entry point. Bundled into dist/action.js (`npm run build:action`),
 * so it runs with zero dependencies on the runner.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative } from "node:path";
import { LOGIN_RE } from "../options.js";
import { answerCare, ensureHouse, prepareCare, type Prepared } from "./care.js";
import { houseLink } from "../care/commands.js";
import { parseRules } from "../care/state.js";
import { generate, parseOutputs } from "./generate.js";
import { fail, warn } from "./log.js";

function input(name: string): string {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? "").trim();
}

function appendTo(envFile: string, text: string): void {
  const path = process.env[envFile];
  if (path) appendFileSync(path, text + "\n");
}

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commitAndPush(workspace: string, files: string[], message: string): void {
  const paths = files.map((f) => relative(workspace, f));
  git(workspace, "add", "--", ...paths);
  if (!git(workspace, "status", "--porcelain", "--", ...paths)) {
    console.log("Pet unchanged since last run, nothing to commit.");
    return;
  }
  git(
    workspace,
    "-c", "user.name=github-actions[bot]",
    "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit", "-m", message, "--", ...paths,
  );
  try {
    git(workspace, "push");
  } catch {
    // Someone pushed while we were rendering: replay our commit on top and retry once.
    git(workspace, "pull", "--rebase");
    git(workspace, "push");
  }
  console.log(`Committed ${paths.join(", ")}`);
}

async function main(): Promise<void> {
  const user = input("github_user_name");
  const token = input("github_token");
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();

  if (!LOGIN_RE.test(user)) throw new Error(`"${user}" is not a valid GitHub login`);
  if (!token) throw new Error("github_token is empty");

  const outputs = parseOutputs(input("outputs"));
  const repo = process.env.GITHUB_REPOSITORY ?? "";

  // Visitors' care, if the owner turned it on: applied before rendering, answered after committing.
  let prepared: Prepared | undefined;
  if (input("care") === "true") {
    const house = input("care_issue");
    if (house && !/^[1-9]\d{0,9}$/.test(house)) throw new Error(`care_issue "${house}" is not an issue number`);
    prepared = await prepareCare({
      workspace,
      file: input("care_file") || "profileforge/care.json",
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
    commitAndPush(workspace, toCommit, input("commit_message") || "chore: feed the ProfileForge pet");
  }

  // Only now, with the visits saved, tell the visitors.
  if (prepared) (await answerCare(token, repo, prepared, state.petName)).forEach(warn);
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
