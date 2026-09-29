import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { commitAndPush, prepareBranch, publishToBranch, readFromBranch, validBranch } from "../src/action/publish.js";

const ID = ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "init.defaultBranch=main"];
const git = (cwd: string, ...args: string[]) => execFileSync("git", [...ID, ...args], { cwd, encoding: "utf8" }).trim();

/** A remote with one commit on main, and a clone of it: like actions/checkout. */
async function repo(): Promise<{ remote: string; work: string }> {
  const root = await mkdtemp(join(tmpdir(), "pf-git-"));
  const remote = join(root, "remote.git");
  const seed = join(root, "seed");
  git(root, "init", "--bare", "--quiet", remote);
  git(root, "init", "--quiet", seed);
  await writeFile(join(seed, "README.md"), "# me\n");
  git(seed, "add", "README.md");
  git(seed, "commit", "--quiet", "-m", "hello");
  git(seed, "push", "--quiet", remote, "main");
  const work = join(root, "work");
  git(root, "clone", "--quiet", remote, work);
  return { remote, work };
}

async function write(work: string, path: string, text: string): Promise<string> {
  const full = join(work, path);
  await mkdir(join(full, ".."), { recursive: true });
  await writeFile(full, text);
  return full;
}

describe("publishing to an output branch", () => {
  it("keeps the branch at a single commit and never touches main", async () => {
    const { remote, work } = await repo();
    const mainBefore = git(remote, "rev-parse", "main");

    expect(prepareBranch(work, "output")).toBe(false); // doesn't exist yet
    const pet = await write(work, "profile/pet.svg", "<svg>1</svg>");
    const care = await write(work, "profile/care.json", "{}");
    expect(await publishToBranch(work, "output", [pet, care], "feed")).toBe("pushed");
    expect(git(remote, "rev-list", "--count", "output")).toBe("1");
    expect(git(remote, "ls-tree", "-r", "--name-only", "output").split("\n")).toEqual(["profile/care.json", "profile/pet.svg"]);

    // Same files next run: nothing to push.
    expect(prepareBranch(work, "output")).toBe(true);
    expect(await publishToBranch(work, "output", [pet, care], "feed")).toBe("unchanged");

    // New pet: still one commit, with the new file.
    await write(work, "profile/pet.svg", "<svg>2</svg>");
    expect(await publishToBranch(work, "output", [pet, care], "feed")).toBe("pushed");
    expect(git(remote, "rev-list", "--count", "output")).toBe("1");
    expect(git(remote, "show", "output:profile/pet.svg")).toBe("<svg>2</svg>");
    expect(git(remote, "log", "-1", "--format=%an", "output")).toBe("github-actions[bot]");

    // Main never moved, and the working tree was left alone.
    expect(git(remote, "rev-parse", "main")).toBe(mainBefore);
    expect(git(work, "log", "--format=%s")).toBe("hello");
  });

  it("reads the care log back from the branch", async () => {
    const { work } = await repo();
    const care = await write(work, "profile/care.json", '{"visits":1}');
    prepareBranch(work, "output");
    await publishToBranch(work, "output", [care], "feed");
    prepareBranch(work, "output");
    expect(readFromBranch(work, "output", "profile/care.json")).toBe('{"visits":1}');
    expect(readFromBranch(work, "output", "profile/missing.json")).toBeNull();
  });

  it("refuses to overwrite the branch the workflow runs on", async () => {
    const { work } = await repo();
    expect(() => prepareBranch(work, "main")).toThrow(/runs on/);
  });

  it("accepts plain branch names only", () => {
    for (const ok of ["output", "gh-pages", "pf/output", "v1.out"]) expect(validBranch(ok), ok).toBe(true);
    for (const bad of ["", "-f", "/x", "a..b", "a b", "x/", "x.lock", "a;rm", "$(x)"]) expect(validBranch(bad), bad).toBe(false);
  });
});

describe("committing on the checked-out branch", () => {
  it("commits and pushes changes, and skips when nothing changed", async () => {
    const { remote, work } = await repo();
    const pet = await write(work, "pet.svg", "<svg/>");
    expect(commitAndPush(work, [pet], "feed")).toBe("pushed");
    expect(git(remote, "log", "-1", "--format=%s", "main")).toBe("feed");
    expect(commitAndPush(work, [pet], "feed")).toBe("unchanged");
  });
});
