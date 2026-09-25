import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it, vi } from "vitest";
import { answerIssues, prepareCare } from "../src/action/care.js";
import { escapeCommand } from "../src/action/log.js";
import { careLink, parseTitle } from "../src/care/commands.js";
import { applyIssues, LIMITS, newCareState, parseCareState, replyFor, serializeCareState, type CareIssue } from "../src/care/state.js";
import { applyCare, careView } from "../src/care/view.js";
import { demoState } from "../src/demo.js";
import { listCareIssues } from "../src/github/issues.js";
import { renderPetCard } from "../src/pet/render.js";

const NOW = new Date("2026-09-25T12:00:00.000Z");
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(NOW.getTime() - hours * HOUR).toISOString();
const issue = (number: number, title: string, login = "octocat", userType = "User"): CareIssue => ({ number, title, login, userType });

describe("parseTitle", () => {
  it("understands the three actions and a few synonyms", () => {
    expect(parseTitle("ProfileForge: feed")).toEqual({ kind: "action", action: "feed" });
    expect(parseTitle("  profileforge:BATH please")).toEqual({ kind: "action", action: "bath" });
    expect(parseTitle("ProfileForge: ball 🎾")).toEqual({ kind: "action", action: "play" });
  });

  it("ignores issues that aren't for the pet", () => {
    expect(parseTitle("Bug: feed button broken")).toBeNull();
    expect(parseTitle("feed")).toBeNull();
  });

  it("does not resolve Object.prototype names", () => {
    for (const word of ["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"]) {
      expect(parseTitle(`ProfileForge: ${word}`)).toEqual({ kind: "unknown" });
    }
  });

  it("rejects absurdly long titles", () => {
    expect(parseTitle(`ProfileForge: feed ${"x".repeat(300)}`)).toBeNull();
  });

  it("builds prefilled issue links", () => {
    expect(careLink("octocat/octocat", "feed")).toMatch(/^https:\/\/github\.com\/octocat\/octocat\/issues\/new\?title=ProfileForge%3A%20feed&body=/);
  });
});

describe("parseCareState", () => {
  const fresh = newCareState(NOW);

  it("starts fresh without a file", () => {
    expect(parseCareState(null, NOW)).toEqual({ state: fresh });
  });

  it.each([
    ["not json", "{nope"],
    ["wrong version", JSON.stringify({ version: 2 })],
    ["an array", "[]"],
    ["too large", " ".repeat(LIMITS.maxFileBytes + 1)],
  ])("starts over on %s", (_, text) => {
    const result = parseCareState(text, NOW);
    expect(result.state).toEqual(fresh);
    expect(result.warning).toBeTruthy();
  });

  it("round-trips a valid state", () => {
    const { state } = applyIssues(fresh, [issue(1, "ProfileForge: feed")], NOW);
    expect(parseCareState(serializeCareState(state), NOW).state).toEqual(state);
  });

  it("drops invalid and hostile fields", () => {
    const { state } = parseCareState(
      JSON.stringify({
        version: 1,
        since: "yesterday",
        last: { feed: "2099-01-01T00:00:00.000Z", bath: 42, play: ago(1), extra: ago(1) },
        totals: { feed: -5, bath: 1.5, play: 3 },
        day: fresh.day,
        today: { "<script>": ["feed"], "__proto__": ["feed"], octocat: ["feed", "feed", "dance"] },
        todayTotal: 9999,
        recent: [
          { action: "feed", by: "octo cat", at: ago(1) },
          { action: "play", by: "octocat", at: ago(2), extra: "<svg>" },
          { action: "rm -rf", by: "octocat", at: ago(2) },
        ],
        handled: [1, -1, 2.5, "3", 4],
        injected: "<script>alert(1)</script>",
      }),
      NOW,
    );
    expect(state.since).toBe(fresh.since);
    expect(state.last).toEqual({ feed: null, bath: null, play: ago(1) }); // future and non-string dates dropped
    expect(state.totals).toEqual({ feed: 0, bath: 0, play: 3 });
    expect(state.today).toEqual({ octocat: ["feed"] });
    expect(Object.getPrototypeOf(state.today)).toBe(Object.prototype);
    expect(state.todayTotal).toBe(LIMITS.perDay);
    expect(state.recent).toEqual([{ action: "play", by: "octocat", at: ago(2) }]);
    expect(state.handled).toEqual([1, 4]);
    expect(serializeCareState(state)).not.toMatch(/script|injected|svg/);
  });

  it("forgets yesterday's counters", () => {
    const { state } = parseCareState(JSON.stringify({ ...fresh, day: "2026-09-24", today: { octocat: ["feed"] }, todayTotal: 1 }), NOW);
    expect(state.today).toEqual({});
    expect(state.todayTotal).toBe(0);
  });
});

describe("applyIssues", () => {
  const fresh = newCareState(NOW);

  it("applies a visit and remembers the issue", () => {
    const { state, handled } = applyIssues(fresh, [issue(7, "ProfileForge: feed")], NOW);
    expect(handled).toEqual([{ issue: issue(7, "ProfileForge: feed"), outcome: { kind: "done", action: "feed" } }]);
    expect(state.last.feed).toBe(NOW.toISOString());
    expect(state.totals.feed).toBe(1);
    expect(state.recent[0]).toEqual({ action: "feed", by: "octocat", at: NOW.toISOString() });
    expect(state.handled).toEqual([7]);
    expect(fresh.handled).toEqual([]); // the input isn't mutated
  });

  it("never applies the same issue twice", () => {
    const once = applyIssues(fresh, [issue(7, "ProfileForge: feed")], NOW).state;
    const twice = applyIssues(once, [issue(7, "ProfileForge: feed")], NOW);
    expect(twice.handled).toEqual([]);
    expect(twice.state.totals.feed).toBe(1);
  });

  it("limits each visitor to each action once a day", () => {
    const { handled, state } = applyIssues(fresh, [issue(1, "ProfileForge: feed"), issue(2, "ProfileForge: feed"), issue(3, "ProfileForge: play")], NOW);
    expect(handled.map((h) => h.outcome.kind)).toEqual(["done", "limited", "done"]);
    expect(state.totals.feed).toBe(1);
  });

  it("caps visits per day across everyone", () => {
    const crowd = Array.from({ length: LIMITS.perDay + 5 }, (_, i) => issue(i + 1, "ProfileForge: feed", `user${i}`));
    let state = fresh;
    const outcomes: string[] = [];
    for (let i = 0; i < crowd.length; i += LIMITS.perRun) {
      const run = applyIssues(state, crowd.slice(i, i + LIMITS.perRun), NOW);
      state = run.state;
      outcomes.push(...run.handled.map((h) => h.outcome.kind));
    }
    expect(outcomes.filter((o) => o === "done")).toHaveLength(LIMITS.perDay);
    expect(outcomes.filter((o) => o === "busy")).toHaveLength(5);
  });

  it("handles at most perRun issues, oldest first", () => {
    const many = Array.from({ length: LIMITS.perRun + 10 }, (_, i) => issue(1000 - i, "ProfileForge: play", `u${i}`));
    const { handled } = applyIssues(fresh, many, NOW);
    expect(handled).toHaveLength(LIMITS.perRun);
    expect(handled[0]!.issue.number).toBe(1000 - many.length + 1);
  });

  it("ignores bots, odd logins and unrelated issues", () => {
    const { handled } = applyIssues(
      fresh,
      [issue(1, "ProfileForge: feed", "dependabot[bot]", "Bot"), issue(2, "ProfileForge: feed", "bad login"), issue(3, "Some bug")],
      NOW,
    );
    expect(handled).toEqual([]);
  });

  it("copes with visitors named after Object.prototype members", () => {
    const { state, handled } = applyIssues(fresh, [issue(1, "ProfileForge: feed", "constructor"), issue(2, "ProfileForge: play", "toString")], NOW);
    expect(handled.map((h) => h.outcome.kind)).toEqual(["done", "done"]);
    expect(state.today).toEqual({ constructor: ["feed"], toString: ["play"] });
  });

  it("answers unknown commands without applying anything", () => {
    const { state, handled } = applyIssues(fresh, [issue(1, "ProfileForge: constructor")], NOW);
    expect(handled[0]!.outcome).toEqual({ kind: "unknown" });
    expect(state.totals).toEqual(fresh.totals);
  });

  it("starts a new day's counters", () => {
    const yesterday = applyIssues(fresh, [issue(1, "ProfileForge: feed")], new Date(NOW.getTime() - 24 * HOUR)).state;
    const { handled } = applyIssues(yesterday, [issue(2, "ProfileForge: feed")], NOW);
    expect(handled[0]!.outcome.kind).toBe("done");
  });
});

describe("replyFor", () => {
  it("only uses fixed text, the pet's name and the login", () => {
    const outcomes = [
      { kind: "done", action: "feed" },
      { kind: "done", action: "bath" },
      { kind: "done", action: "play" },
      { kind: "limited", action: "feed" },
      { kind: "busy" },
      { kind: "unknown" },
    ] as const;
    for (const o of outcomes) {
      const reply = replyFor(o, "Pinchy", "octocat");
      expect(reply).toContain("Pinchy");
      expect(reply).not.toContain("@");
    }
  });
});

describe("careView and applyCare", () => {
  const base = newCareState(new Date(NOW.getTime() - 20 * 24 * HOUR));

  it("gets dirtier the longer it goes without a bath", () => {
    const at = (days: number) => careView({ ...base, last: { ...base.last, bath: ago(days * 24) } }, NOW).dirt;
    expect([at(0), at(3), at(6), at(10)]).toEqual([0, 1, 2, 3]);
    expect(careView(base, NOW).dirt).toBe(3); // never bathed since care began 20 days ago
  });

  it("shows recent visits and forgets old ones", () => {
    const state = { ...base, last: { feed: ago(2), bath: ago(30), play: null }, recent: [{ action: "feed" as const, by: "octocat", at: ago(2) }] };
    expect(careView(state, NOW)).toMatchObject({ fed: true, bathed: false, played: false, visitor: { login: "octocat", action: "feed" } });
    expect(careView({ ...state, recent: [{ action: "feed", by: "octocat", at: ago(13) }] }, NOW).visitor).toBeNull();
  });

  it("lets a meal chase hunger away and keep the pet home", () => {
    const hungry = { ...demoState("hungry"), ranAway: true };
    const fed = applyCare(hungry, { ...base, last: { ...base.last, feed: ago(1) } }, NOW);
    expect(fed.mood).toBe("idle");
    expect(fed.ranAway).toBe(false);
    expect(applyCare(hungry, base, NOW).ranAway).toBe(true);
  });

  it("renders every level of care as valid SVG", () => {
    for (const dirt of [0, 1, 2, 3] as const) {
      for (const mood of ["happy", "idle", "hungry", "sleeping"] as const) {
        const care = { fed: true, bathed: dirt === 0, played: true, dirt, visitor: { login: "octocat", action: "play" as const } };
        const svg = renderPetCard({ ...demoState(mood), care });
        expect(XMLValidator.validate(svg)).toBe(true);
        expect(svg).not.toMatch(/undefined|NaN/);
      }
    }
    const flies = renderPetCard({ ...demoState("idle"), care: { fed: false, bathed: false, played: false, dirt: 3, visitor: null } });
    expect(flies).toContain('class="pf-orbit"');
    expect(flies).toContain('class="pf-stink"');
  });
});

describe("GitHub issues client", () => {
  const respond = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it("keeps only well-formed care issues", async () => {
    const f = respond([
      { number: 1, title: "ProfileForge: feed", user: { login: "octocat", type: "User" } },
      { number: 2, title: "ProfileForge: feed", user: { login: "octocat", type: "User" }, pull_request: {} },
      { number: 3, title: "Unrelated", user: { login: "octocat", type: "User" } },
      { number: "4", title: "ProfileForge: feed", user: { login: "octocat", type: "User" } },
      { number: 5, title: "ProfileForge: play", user: null },
      "garbage",
    ]);
    expect(await listCareIssues("t", "octocat/octocat", f)).toEqual([issue(1, "ProfileForge: feed")]);
    expect(f.mock.calls[0]![0]).toBe("https://api.github.com/repos/octocat/octocat/issues?state=open&sort=created&direction=asc&per_page=100");
  });

  it("refuses odd repository names before calling anything", async () => {
    const f = vi.fn();
    await expect(listCareIssues("t", "octocat/../../evil", f)).rejects.toThrow(/owner\/repo/);
    await expect(listCareIssues("t", "https://evil.example/x", f)).rejects.toThrow();
    expect(f).not.toHaveBeenCalled();
  });

  it("reports API failures", async () => {
    await expect(listCareIssues("t", "octocat/octocat", respond({ message: "nope" }, 403))).rejects.toThrow(/403/);
  });
});

describe("prepareCare and answerIssues", () => {
  const TITLE = "ProfileForge: feed <img src=x onerror=alert(1)> $(rm -rf /)";

  async function workspace() {
    const dir = await mkdtemp(join(tmpdir(), "pf-care-"));
    await mkdir(join(dir, "profileforge"));
    return dir;
  }

  it("applies visits, saves the log, then replies and closes", async () => {
    const dir = await workspace();
    const calls: { url: string; method: string; body?: string }[] = [];
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body as string | undefined });
      if (!init?.method) return new Response(JSON.stringify([{ number: 9, title: TITLE, user: { login: "octocat", type: "User" } }]));
      return new Response("{}", { status: 201 });
    }) as unknown as typeof fetch;

    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.handled).toHaveLength(1);
    const saved = await readFile(join(dir, "profileforge/care.json"), "utf8");
    expect(saved).not.toContain("onerror");
    expect(saved).not.toContain("rm -rf");

    expect(await answerIssues("t", "me/me", prepared, "Pinchy", f)).toEqual([]);
    const [, commentCall, closeCall] = calls;
    expect(commentCall).toMatchObject({ url: "https://api.github.com/repos/me/me/issues/9/comments", method: "POST" });
    expect(commentCall!.body).not.toContain("onerror");
    expect(closeCall).toMatchObject({ url: "https://api.github.com/repos/me/me/issues/9", method: "PATCH" });
    expect(JSON.parse(closeCall!.body!)).toEqual({ state: "closed", state_reason: "completed" });

    // The rendered card never shows the title either.
    const svg = renderPetCard(applyCare(demoState("happy"), prepared.care.state, NOW));
    expect(svg).not.toContain("onerror");
    expect(svg).toContain("Fed by octocat");
  });

  it("only closes issues handled on an earlier run", async () => {
    const dir = await workspace();
    const earlier = applyIssues(newCareState(NOW), [issue(9, "ProfileForge: feed")], NOW).state;
    await writeFile(join(dir, "profileforge/care.json"), serializeCareState(earlier));
    const f = vi.fn(async () => new Response(JSON.stringify([{ number: 9, title: "ProfileForge: feed", user: { login: "octocat", type: "User" } }]))) as unknown as typeof fetch;

    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.handled).toEqual([]);
    expect(prepared.leftOpen).toEqual([9]);
    expect(prepared.care.state.totals.feed).toBe(1);
  });

  it("creates the care folder on the very first run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pf-care-"));
    const f = vi.fn(async () => new Response("[]")) as unknown as typeof fetch;
    const prepared = await prepareCare({ workspace: dir, file: "new/folder/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(JSON.parse(await readFile(prepared.file, "utf8")).version).toBe(1);
  });

  it("keeps going when issues can't be listed", async () => {
    const dir = await workspace();
    const f = vi.fn(async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.handled).toEqual([]);
    expect(prepared.warnings.join()).toMatch(/403/);
  });

  it("turns reply failures into warnings", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
    const warnings = await answerIssues("t", "me/me", { handled: [{ issue: issue(1, "ProfileForge: feed"), outcome: { kind: "done", action: "feed" } }], leftOpen: [] }, "Pinchy", f);
    expect(warnings).toEqual([expect.stringMatching(/403/)]);
  });

  it("keeps the care file inside the repository", async () => {
    const dir = await workspace();
    await expect(prepareCare({ workspace: dir, file: "../care.json", token: "t", repo: "me/me", now: NOW, fetch: vi.fn() })).rejects.toThrow(/inside/);
    await expect(prepareCare({ workspace: dir, file: "profileforge/care.sh", token: "t", repo: "me/me", now: NOW, fetch: vi.fn() })).rejects.toThrow(/\.json/);
  });
});

describe("escapeCommand", () => {
  it("neutralises workflow commands in log messages", () => {
    expect(escapeCommand("oops\n::set-output name=x::1\r100%")).toBe("oops%0A::set-output name=x::1%0D100%25");
  });
});
