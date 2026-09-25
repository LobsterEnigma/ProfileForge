import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it, vi } from "vitest";
import { generate, parseOutputs, resolveInside } from "../src/action/generate.js";
import { profile } from "./helpers.js";

describe("parseOutputs", () => {
  it("parses one output per line with API-style params", () => {
    const specs = parseOutputs(`
      profileforge/pet.svg
      # comments and blank lines are ignored

      profileforge/dark.svg?theme=dark&name=Ferris&hide_border=true
    `);
    expect(specs).toHaveLength(2);
    expect(specs[0]).toMatchObject({ path: "profileforge/pet.svg", params: { hideBorder: false } });
    expect(specs[0]!.params.petName).toBeUndefined(); // the species picks its own name
    expect(specs[1]).toMatchObject({
      path: "profileforge/dark.svg",
      params: { theme: "dark", petName: "Ferris", hideBorder: true },
    });
  });

  it("requires .svg files", () => expect(() => parseOutputs("pet.png")).toThrow(/\.svg/));
  it("requires at least one output", () => expect(() => parseOutputs("  \n# nothing\n")).toThrow(/No outputs/));
});

describe("resolveInside", () => {
  it("keeps paths inside the workspace", () => {
    expect(resolveInside("/repo", "a/b.svg")).toBe("/repo/a/b.svg");
    expect(() => resolveInside("/repo", "../evil.svg")).toThrow(/inside/);
    expect(() => resolveInside("/repo", "/etc/evil.svg")).toThrow(/inside/);
  });
});

describe("generate", () => {
  it("fetches once and writes every output", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "pf-"));
    const fetch = vi.fn().mockResolvedValue(profile());
    const { files, state } = await generate({
      user: "octocat",
      token: "t",
      workspace,
      fetch,
      outputs: parseOutputs("out/pet.svg?name=Ferris\nout/nested/dark.svg?theme=dark"),
    });

    expect(fetch).toHaveBeenCalledOnce();
    expect(files).toEqual([join(workspace, "out/pet.svg"), join(workspace, "out/nested/dark.svg")]);
    expect(state.petName).toBe("Ferris");
    for (const f of files) expect(XMLValidator.validate(await readFile(f, "utf8"))).toBe(true);
    expect(await readFile(files[1]!, "utf8")).toContain("#0d1117"); // dark theme
  });

  it("renders the widget each output asks for", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "pf-"));
    const { files } = await generate({
      user: "octocat",
      token: "t",
      workspace,
      fetch: vi.fn().mockResolvedValue(profile()),
      outputs: parseOutputs("pet.svg\ncity.svg?widget=city"),
    });
    expect(await readFile(files[0]!, "utf8")).toContain("ProfileForge pet");
    expect(await readFile(files[1]!, "utf8")).toContain("ProfileForge city");
  });

  it("validates paths before hitting the network", async () => {
    const fetch = vi.fn();
    await expect(
      generate({ user: "octocat", token: "t", workspace: "/repo", fetch, outputs: parseOutputs("../x.svg") }),
    ).rejects.toThrow(/inside/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
