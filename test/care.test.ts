import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLValidator } from "fast-xml-parser";
import { describe, expect, it, vi } from "vitest";
import { answerCare, ensureHouse, prepareCare } from "../src/action/care.js";
import { escapeCommand } from "../src/action/log.js";
import { houseLink, parseCommand } from "../src/care/commands.js";
import {
  applyComments,
  houseIssue,
  LIMITS,
  newCareState,
  parseCareState,
  reactionFor,
  redirectReply,
  serializeCareState,
  type CareComment,
} from "../src/care/state.js";
import { applyCare, careView } from "../src/care/view.js";
import { demoState } from "../src/demo.js";
import { listCareIssues, listHouseComments } from "../src/github/issues.js";
import { renderPetCard } from "../src/pet/render.js";

const NOW = new Date("2026-09-25T12:00:00.000Z");
const HOUR = 3_600_000;
const ago = (hours: number) => new Date(NOW.getTime() - hours * HOUR).toISOString();
const say = (id: number, body: string, login = "octocat", userType = "User"): CareComment => ({ id, body, login, userType, createdAt: ago(1) });
const house = () => {
  const s = newCareState(NOW);
  s.house.issue = 1;
  return s;
};

describe("parseCommand", () => {
  it("reads the first word of a comment", () => {
    expect(parseCommand("feed")).toBe("feed");
    expect(parseCommand("🍖 feed please!")).toBe("feed");
    expect(parseCommand("/BATH")).toBe("bath");
    expect(parseCommand("  ball time")).toBe("play");
  });

  it("leaves chat alone", () => {
    expect(parseCommand("so cute!")).toBeNull();
    expect(parseCommand("feedback: love it")).toBeNull();
    expect(parseCommand("I want to feed it")).toBeNull();
    expect(parseCommand("")).toBeNull();
  });

  it("does not resolve Object.prototype names", () => {
    for (const word of ["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"]) expect(parseCommand(word)).toBeNull();
  });

  it("ignores huge comments", () => {
    expect(parseCommand(`feed ${"x".repeat(3000)}`)).toBeNull();
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
    const { state } = applyComments(house(), [say(10, "feed")], NOW);
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
        house: { issue: "7", cursor: -3, cursorAt: "<script>", evil: true },
        injected: "<script>alert(1)</script>",
      }),
      NOW,
    );
    expect(state.since).toBe(fresh.since);
    expect(state.last).toEqual({ feed: null, bath: null, play: ago(1) });
    expect(state.totals).toEqual({ feed: 0, bath: 0, play: 3 });
    expect(state.today).toEqual({ octocat: ["feed"] });
    expect(Object.getPrototypeOf(state.today)).toBe(Object.prototype);
    expect(state.todayTotal).toBe(LIMITS.perDay);
    expect(state.recent).toEqual([{ action: "play", by: "octocat", at: ago(2) }]);
    expect(state.house).toEqual({ issue: null, cursor: 0, cursorAt: null });
    expect(serializeCareState(state)).not.toMatch(/script|injected|svg|evil/);
  });

  it("keeps a valid house", () => {
    const text = JSON.stringify({ ...fresh, house: { issue: 3, cursor: 99, cursorAt: ago(1) } });
    expect(parseCareState(text, NOW).state.house).toEqual({ issue: 3, cursor: 99, cursorAt: ago(1) });
  });

  it("forgets yesterday's counters", () => {
    const { state } = parseCareState(JSON.stringify({ ...fresh, day: "2026-09-24", today: { octocat: ["feed"] }, todayTotal: 1 }), NOW);
    expect(state.today).toEqual({});
    expect(state.todayTotal).toBe(0);
  });
});

describe("applyComments", () => {
  it("applies commands and moves the cursor past every comment", () => {
    const start = house();
    const { state, handled } = applyComments(start, [say(12, "so cute"), say(11, "feed"), say(13, "Bot says feed", "bot", "Bot")], NOW);
    expect(handled).toEqual([{ comment: say(11, "feed"), outcome: { kind: "done", action: "feed" } }]);
    expect(state.house.cursor).toBe(13);
    expect(state.last.feed).toBe(NOW.toISOString());
    expect(state.recent[0]).toEqual({ action: "feed", by: "octocat", at: NOW.toISOString() });
    expect(start.house.cursor).toBe(0); // the input isn't mutated
  });

  it("never reads a comment twice, even after an edit", () => {
    const once = applyComments(house(), [say(11, "so cute")], NOW).state;
    const edited = applyComments(once, [say(11, "feed")], NOW);
    expect(edited.handled).toEqual([]);
    expect(edited.state.totals.feed).toBe(0);
  });

  it("limits each visitor to each action once a day", () => {
    const { handled, state } = applyComments(house(), [say(1, "feed"), say(2, "feed"), say(3, "play")], NOW);
    expect(handled.map((h) => h.outcome.kind)).toEqual(["done", "limited", "done"]);
    expect(state.totals.feed).toBe(1);
  });

  it("caps visits per day across everyone", () => {
    const crowd = Array.from({ length: LIMITS.perDay + 5 }, (_, i) => say(i + 1, "feed", `user${i}`));
    let state = house();
    const outcomes: string[] = [];
    for (let i = 0; i < 4; i++) {
      const run = applyComments(state, crowd, NOW);
      state = run.state;
      outcomes.push(...run.handled.map((h) => h.outcome.kind));
    }
    expect(outcomes.filter((o) => o === "done")).toHaveLength(LIMITS.perDay);
    expect(outcomes.filter((o) => o === "busy")).toHaveLength(5);
  });

  it("handles at most perRun commands, oldest first, and picks up the rest next time", () => {
    const many = Array.from({ length: LIMITS.perRun + 10 }, (_, i) => say(1000 - i, "play", `u${i}`));
    const first = applyComments(house(), many, NOW);
    expect(first.handled).toHaveLength(LIMITS.perRun);
    expect(first.handled[0]!.comment.id).toBe(1000 - many.length + 1);
    expect(applyComments(first.state, many, NOW).handled).toHaveLength(10);
  });

  it("copes with visitors named after Object.prototype members", () => {
    const { state, handled } = applyComments(house(), [say(1, "feed", "constructor"), say(2, "play", "toString")], NOW);
    expect(handled.map((h) => h.outcome.kind)).toEqual(["done", "done"]);
    expect(state.today).toEqual({ constructor: ["feed"], toString: ["play"] });
  });

  it("ignores odd logins", () => {
    expect(applyComments(house(), [say(1, "feed", "bad login")], NOW).handled).toEqual([]);
  });

  it("starts a new day's counters", () => {
    const yesterday = applyComments(house(), [say(1, "feed")], new Date(NOW.getTime() - 24 * HOUR)).state;
    expect(applyComments(yesterday, [say(2, "feed")], NOW).handled[0]!.outcome.kind).toBe("done");
  });

  it("reacts instead of replying", () => {
    expect(reactionFor({ kind: "done", action: "feed" })).toBe("heart");
    expect(reactionFor({ kind: "limited", action: "feed" })).toBe("eyes");
    expect(reactionFor({ kind: "busy" })).toBe("confused");
  });
});

describe("house texts", () => {
  it("only use fixed text and the owner's pet name", () => {
    const { title, body } = houseIssue("Pinchy");
    expect(title).toBe("ProfileForge: Pinchy's house 🏠");
    expect(body).toContain("`feed`");
    expect(redirectReply("Pinchy", 3)).toContain("#3");
    expect(houseLink("octocat/octocat", 3)).toBe("https://github.com/octocat/octocat/issues/3");
  });
});

describe("careView and applyCare", () => {
  const base = newCareState(new Date(NOW.getTime() - 20 * 24 * HOUR));

  it("gets dirtier the longer it goes without a bath", () => {
    const at = (days: number) => careView({ ...base, last: { ...base.last, bath: ago(days * 24) } }, NOW).dirt;
    expect([at(0), at(3), at(6), at(10)]).toEqual([0, 1, 2, 3]);
    expect(careView(base, NOW).dirt).toBe(3);
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
        const visitor = { login: "octocat", action: "play" as const };
        const care = { fed: true, bathed: dirt === 0, played: true, dirt, visitor, visitors: [visitor] };
        const svg = renderPetCard({ ...demoState(mood), care });
        expect(XMLValidator.validate(svg)).toBe(true);
        expect(svg).not.toMatch(/undefined|NaN/);
      }
    }
  });
});

describe("GitHub client", () => {
  const respond = (body: unknown, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

  it("keeps only well-formed comments", async () => {
    const f = respond([
      { id: 5, body: "feed", created_at: "2026-09-25T10:00:00Z", user: { login: "octocat", type: "User" } },
      { id: "6", body: "feed", created_at: "2026-09-25T10:00:00Z", user: { login: "octocat", type: "User" } },
      { id: 7, body: null, created_at: "2026-09-25T10:00:00Z", user: { login: "octocat", type: "User" } },
      { id: 8, body: "feed", created_at: "2026-09-25T10:00:00Z", user: null },
      "garbage",
    ]);
    expect(await listHouseComments("t", "me/me", 3, { since: "2026-09-25T09:00:00.000Z", after: 0, want: 30 }, f)).toEqual([
      { id: 5, body: "feed", login: "octocat", userType: "User", createdAt: "2026-09-25T10:00:00.000Z" },
    ]);
    expect(f.mock.calls[0]![0]).toBe("https://api.github.com/repos/me/me/issues/3/comments?per_page=100&since=2026-09-25T09%3A00%3A00.000Z&page=1");
  });

  it("pages past old comments until it finds new ones", async () => {
    const page = (from: number) => Array.from({ length: 100 }, (_, i) => ({ id: from + i, body: "hi", created_at: "2026-09-25T10:00:00Z", user: { login: "octocat", type: "User" } }));
    const pages = [page(1), page(101), page(201), page(301), page(401), page(501), page(601).slice(0, 40)];
    const f = vi.fn(async (url: string | URL | Request) => new Response(JSON.stringify(pages[Number(new URL(String(url)).searchParams.get("page")) - 1] ?? [])));
    const fresh = await listHouseComments("t", "me/me", 3, { since: null, after: 590, want: 30 }, f as unknown as typeof fetch);
    expect(fresh.map((c) => c.id)).toEqual(Array.from({ length: 50 }, (_, i) => 591 + i));
    expect(f).toHaveBeenCalledTimes(7);
  });

  it("keeps only care-looking issues, without pull requests", async () => {
    const f = respond([
      { number: 1, title: "ProfileForge: feed", user: { login: "octocat", type: "User" } },
      { number: 2, title: "ProfileForge: feed", user: { login: "octocat", type: "User" }, pull_request: {} },
      { number: 3, title: "Unrelated", user: { login: "octocat", type: "User" } },
    ]);
    expect(await listCareIssues("t", "me/me", f)).toEqual([{ number: 1, title: "ProfileForge: feed", login: "octocat", userType: "User" }]);
  });

  it("refuses odd repositories and ids before calling anything", async () => {
    const f = vi.fn();
    await expect(listCareIssues("t", "octocat/../../evil", f)).rejects.toThrow(/owner\/repo/);
    const q = { since: null, after: 0, want: 30 };
    await expect(listHouseComments("t", "me/me", -1, q, f)).rejects.toThrow(/valid id/);
    await expect(listHouseComments("t", "me/me", 1.5, q, f)).rejects.toThrow(/valid id/);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("prepareCare, ensureHouse and answerCare", () => {
  const HOSTILE = "feed <img src=x onerror=alert(1)> $(rm -rf /) ::set-output name=x::y";

  interface Call {
    url: string;
    method: string;
    body?: string;
  }

  function github(comments: unknown[], issues: unknown[] = [], created = 42) {
    const calls: Call[] = [];
    const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push({ url: u, method: init?.method ?? "GET", body: init?.body as string | undefined });
      if (!init?.method && u.includes("/comments")) return new Response(JSON.stringify(comments));
      if (!init?.method) return new Response(JSON.stringify(issues));
      if (init.method === "POST" && u.endsWith("/issues")) return new Response(JSON.stringify({ number: created }), { status: 201 });
      return new Response("{}", { status: 201 });
    }) as unknown as typeof fetch;
    return { f, calls };
  }

  async function workspace(state?: ReturnType<typeof newCareState>) {
    const dir = await mkdtemp(join(tmpdir(), "pf-care-"));
    if (state) {
      await mkdir(join(dir, "profileforge"));
      await writeFile(join(dir, "profileforge/care.json"), serializeCareState(state));
    }
    return dir;
  }

  it("opens the house on the first run", async () => {
    const dir = await workspace();
    const { f, calls } = github([]);
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(await ensureHouse(prepared, "t", "me/me", "Pinchy", f)).toBe(42);
    const create = calls.find((c) => c.method === "POST")!;
    expect(create.url).toBe("https://api.github.com/repos/me/me/issues");
    expect(JSON.parse(create.body!).title).toBe("ProfileForge: Pinchy's house 🏠");
    expect(JSON.parse(await readFile(prepared.file, "utf8")).house.issue).toBe(42);
    expect(await ensureHouse(prepared, "t", "me/me", "Pinchy", f)).toBeNull(); // only once
  });

  it("moves back into a house it opened on a run that didn't commit", async () => {
    const dir = await workspace();
    const { f, calls } = github([], [{ number: 11, title: "ProfileForge: Pinchy's house 🏠", user: { login: "github-actions[bot]", type: "Bot" } }]);
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.care.state.house.issue).toBe(11);
    expect(await ensureHouse(prepared, "t", "me/me", "Pinchy", f)).toBeNull();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("doesn't mistake a visitor's look-alike issue for its house", async () => {
    const dir = await workspace();
    const { f } = github([], [{ number: 12, title: "ProfileForge: Pinchy's house 🏠", user: { login: "prankster", type: "User" } }]);
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.care.state.house.issue).toBeNull();
    expect(prepared.strays.map((s) => s.number)).toEqual([12]);
  });

  it("uses the owner's own house issue", async () => {
    const dir = await workspace();
    const { f } = github([]);
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, house: 5, fetch: f });
    expect(prepared.care.state.house.issue).toBe(5);
    expect(await ensureHouse(prepared, "t", "me/me", "Pinchy", f)).toBeNull();
  });

  it("applies comments, saves the log, then reacts, never echoing what visitors wrote", async () => {
    const dir = await workspace(house());
    const { f, calls } = github([{ id: 9, body: HOSTILE, created_at: "2026-09-25T11:00:00Z", user: { login: "octocat", type: "User" } }]);
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.handled).toHaveLength(1);
    const saved = await readFile(prepared.file, "utf8");
    expect(saved).not.toMatch(/onerror|rm -rf|set-output/);
    expect(JSON.parse(saved).house).toMatchObject({ issue: 1, cursor: 9, cursorAt: "2026-09-25T11:00:00.000Z" });

    expect(await answerCare("t", "me/me", prepared, "Pinchy", f)).toEqual([]);
    const reaction = calls.find((c) => c.url.endsWith("/reactions"))!;
    expect(reaction.url).toBe("https://api.github.com/repos/me/me/issues/comments/9/reactions");
    expect(JSON.parse(reaction.body!)).toEqual({ content: "heart" });
    expect(calls.some((c) => c.body?.includes("onerror"))).toBe(false);

    const svg = renderPetCard(applyCare(demoState("happy"), prepared.care.state, NOW));
    expect(svg).not.toContain("onerror");
    expect(svg).toContain("Fed by octocat");
  });

  it("points stray care issues to the house and closes them, but never the owner's", async () => {
    const dir = await workspace(house());
    const { f, calls } = github(
      [],
      [
        { number: 1, title: "ProfileForge: Pinchy's house", user: { login: "me", type: "User" } },
        { number: 7, title: "ProfileForge: feed", user: { login: "visitor", type: "User" } },
        { number: 8, title: "ProfileForge: my notes", user: { login: "me", type: "User" } },
        { number: 9, title: "ProfileForge: feed", user: { login: "spam[bot]", type: "Bot" } },
      ],
    );
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.strays.map((s) => s.number)).toEqual([7]);
    await answerCare("t", "me/me", prepared, "Pinchy", f);
    const writes = calls.filter((c) => c.method !== "GET").map((c) => `${c.method} ${c.url}`);
    expect(writes).toEqual(["POST https://api.github.com/repos/me/me/issues/7/comments", "PATCH https://api.github.com/repos/me/me/issues/7"]);
  });

  it("keeps going when GitHub is unavailable", async () => {
    const dir = await workspace(house());
    const f = vi.fn(async () => new Response("{}", { status: 403 })) as unknown as typeof fetch;
    const prepared = await prepareCare({ workspace: dir, file: "profileforge/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(prepared.handled).toEqual([]);
    expect(prepared.warnings.join()).toMatch(/403/);
    const warnings = await answerCare("t", "me/me", { ...prepared, handled: [{ comment: say(1, "feed"), outcome: { kind: "done", action: "feed" } }] }, "Pinchy", f);
    expect(warnings).toEqual([expect.stringMatching(/403/)]);
  });

  it("creates the care folder on the very first run", async () => {
    const dir = await mkdtemp(join(tmpdir(), "pf-care-"));
    const { f } = github([]);
    const prepared = await prepareCare({ workspace: dir, file: "new/folder/care.json", token: "t", repo: "me/me", now: NOW, fetch: f });
    expect(JSON.parse(await readFile(prepared.file, "utf8")).version).toBe(1);
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
