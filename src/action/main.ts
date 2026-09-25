/**
 * GitHub Action entry point. Bundled into dist/action.js (`npm run build:action`),
 * so it runs with zero dependencies on the runner.
 */
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { relative } from "node:path";
import { LOGIN_RE } from "../options.js";
import { generate, parseOutputs } from "./generate.js";

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
  const { files, state } = await generate({ user, token, outputs, workspace });

  const mood = `${state.petName} is ${state.mood} · Lv.${state.level} ${state.className} (${state.stage})`;
  console.log(`🦀 ${mood}`);
  for (const f of files) console.log(`  wrote ${relative(workspace, f)}`);
  appendTo("GITHUB_STEP_SUMMARY", `### 🦀 ${mood}\n\nStreak: ${state.streak} days · XP: ${state.xp}`);
  appendTo("GITHUB_OUTPUT", `mood=${state.mood}\nlevel=${state.level}\nstage=${state.stage}`);

  if (input("commit") !== "false") {
    commitAndPush(workspace, files, input("commit_message") || "chore: feed the ProfileForge pet");
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.log(`::error title=ProfileForge::${message}`);
  process.exitCode = 1;
});
