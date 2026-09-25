import { afterEach, describe, expect, it, vi } from "vitest";
import { handlePet } from "../src/handler.js";

const call = (query: string, env: { GITHUB_TOKEN?: string } = {}) =>
  handlePet(new URL(`http://localhost/api/pet?${query}`), env);

function graphqlResponse(data: unknown) {
  return new Response(JSON.stringify({ data }), { status: 200, headers: { "content-type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("handlePet", () => {
  it("serves the demo pet without a token", async () => {
    const res = await call("user=demo&mood=sleeping&stage=baby&name=Crabby");
    expect(res.headers.get("content-type")).toContain("image/svg+xml");
    const svg = await res.text();
    expect(svg).toContain("Crabby");
    expect(svg).toContain("asleep");
  });

  it("rejects invalid logins", async () => {
    expect(await (await call("user=-bad-")).text()).toContain("invalid user");
    expect(await (await call("")).text()).toContain("invalid user");
  });

  it("explains a missing token", async () => {
    expect(await (await call("user=octocat")).text()).toContain("GITHUB_TOKEN");
  });

  it("fetches, computes and renders a real user", async () => {
    const days = Array.from({ length: 7 }, (_, i) => ({ date: `2026-09-${18 + i}`, contributionCount: i % 2 }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        graphqlResponse({
          user: {
            login: "octo-real",
            name: null,
            followers: { totalCount: 5 },
            contributionsCollection: {
              contributionYears: [2026, 2025],
              totalCommitContributions: 10,
              totalPullRequestContributions: 2,
              totalPullRequestReviewContributions: 1,
              totalIssueContributions: 3,
              contributionCalendar: { weeks: [{ contributionDays: days }] },
            },
            repositories: {
              nodes: [
                { stargazerCount: 7, languages: { edges: [{ size: 10, node: { name: "Go", color: "#00ADD8" } }] } },
                { stargazerCount: 1, languages: { edges: [{ size: 50, node: { name: "Python", color: "#3572A5" } }] } },
              ],
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        graphqlResponse({
          user: {
            y2026: { contributionCalendar: { totalContributions: 400 } },
            y2025: { contributionCalendar: { totalContributions: 600 } },
          },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const svg = await (await call("user=octo-real", { GITHUB_TOKEN: "t" })).text();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(svg).toContain("Summoner"); // Python has more bytes than Go
    // xp = 1000 lifetime + 8 stars * 2 + 5 followers * 3 = 1031 → level 15
    expect(svg).toContain("Lv.15");
  });

  it("shows a friendly card when the user doesn't exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { user: null }, errors: [{ type: "NOT_FOUND", message: "nope" }] })),
      ),
    );
    const svg = await (await call("user=nobody-here", { GITHUB_TOKEN: "t" })).text();
    expect(svg).toContain("User not found");
  });
});
