/**
 * Getting the SVGs (and the care log) into the repository: either as a commit on the branch
 * that was checked out, or, with `branch`, onto a separate branch that's replaced by a single
 * commit every run, so the profile's main branch never gets a bot commit. Use a branch of its
 * own: tools like the contribution snake replace their `output` branch wholesale too.
 */
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const BOT = {
  GIT_AUTHOR_NAME: "github-actions[bot]",
  GIT_AUTHOR_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com",
  GIT_COMMITTER_NAME: "github-actions[bot]",
  GIT_COMMITTER_EMAIL: "41898282+github-actions[bot]@users.noreply.github.com",
};

function git(cwd: string, args: string[], env: Record<string, string> = {}): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } }).trim();
}

function tryGit(cwd: string, args: string[]): string | null {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

/** A plain branch name: letters, digits, `.`, `_`, `-` and `/`, not starting with `-` or `/`. */
export function validBranch(name: string): boolean {
  return /^[A-Za-z0-9._][A-Za-z0-9._/-]{0,99}$/.test(name) && !name.includes("..") && !name.endsWith("/") && !name.endsWith(".lock");
}

const remoteRef = (branch: string) => `refs/remotes/origin/${branch}`;

/**
 * Checks `branch` is safe to overwrite (never the branch the workflow checked out) and
 * fetches it if it exists. Returns whether it exists on the remote.
 */
export function prepareBranch(workspace: string, branch: string): boolean {
  if (!validBranch(branch)) throw new Error(`branch "${branch}" is not a valid branch name`);
  const current = tryGit(workspace, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (current === branch) {
    throw new Error(`branch "${branch}" is the branch this workflow runs on; pick another one (e.g. "output") so it isn't overwritten`);
  }
  return tryGit(workspace, ["fetch", "--quiet", "--depth=1", "origin", `+refs/heads/${branch}:${remoteRef(branch)}`]) !== null;
}

/** A file's contents on the fetched `branch`, or null if it isn't there. */
export function readFromBranch(workspace: string, branch: string, path: string): string | null {
  return tryGit(workspace, ["show", `${remoteRef(branch)}:${path}`]);
}

/**
 * Replaces `branch` with a single commit holding `files` (at their paths in the workspace),
 * without touching the working tree or the checked-out branch. Anything else already on the
 * branch (another tool's files) is kept as it was. Skips the push when nothing changed.
 */
export async function publishToBranch(workspace: string, branch: string, files: string[], message: string): Promise<"pushed" | "unchanged"> {
  const dir = await mkdtemp(join(tmpdir(), "pf-index-"));
  try {
    const env = { GIT_INDEX_FILE: join(dir, "index") };
    const previous = tryGit(workspace, ["rev-parse", "--verify", "--quiet", `${remoteRef(branch)}^{tree}`]);
    if (previous) git(workspace, ["read-tree", previous], env);
    for (const file of files) {
      const path = relative(workspace, file).split("\\").join("/");
      const blob = git(workspace, ["hash-object", "-w", "--", file]);
      git(workspace, ["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`], env);
    }
    const tree = git(workspace, ["write-tree"], env);
    if (previous === tree) return "unchanged";
    const commit = git(workspace, ["commit-tree", tree, "-m", message], BOT);
    git(workspace, ["push", "--force", "--quiet", "origin", `${commit}:refs/heads/${branch}`]);
    return "pushed";
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Commits `files` on the checked-out branch and pushes, if anything changed. */
export function commitAndPush(workspace: string, files: string[], message: string): "pushed" | "unchanged" {
  const paths = files.map((f) => relative(workspace, f));
  git(workspace, ["add", "--", ...paths]);
  if (!git(workspace, ["status", "--porcelain", "--", ...paths])) return "unchanged";
  git(workspace, ["commit", "-m", message, "--", ...paths], BOT);
  try {
    git(workspace, ["push"]);
  } catch {
    // Someone pushed while we were rendering: replay our commit on top and retry once.
    git(workspace, ["pull", "--rebase"]);
    git(workspace, ["push"]);
  }
  return "pushed";
}
