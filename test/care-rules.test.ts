import { describe, expect, it } from "vitest";
import { applyComments, houseIssue, newCareState, parseRules, type CareComment } from "../src/care/state.js";
import { careView } from "../src/care/view.js";
import { parsePetParams } from "../src/options.js";
import { computePetState } from "../src/pet/state.js";
import { renderWidget } from "../src/widgets.js";
import { calendar, profile } from "./helpers.js";

const NOW = new Date("2026-09-25T12:00:00.000Z");
const say = (id: number, body: string): CareComment => ({ id, body, login: "octocat", userType: "User", createdAt: "2026-09-25T11:00:00.000Z" });
const house = () => {
  const s = newCareState(NOW);
  s.house.issue = 1;
  return s;
};

describe("parseRules", () => {
  it("allows everything by default", () => {
    expect(parseRules("", "")).toEqual({ actions: ["feed", "bath", "play"], dirt: true });
    expect(parseRules("feed,bath,play", "true")).toEqual({ actions: ["feed", "bath", "play"], dirt: true });
  });

  it("takes a subset, forgiving spaces and case", () => {
    expect(parseRules(" Play , feed ", "")).toEqual({ actions: ["feed", "play"], dirt: false });
  });

  it("turns dirt off on request", () => {
    expect(parseRules("feed,bath,play", "false")).toEqual({ actions: ["feed", "bath", "play"], dirt: false });
  });

  it("never lets a pet get dirty when it can't be bathed", () => {
    expect(parseRules("feed", "true").dirt).toBe(false);
  });

  it("rejects typos and empty lists", () => {
    expect(() => parseRules("feed,dance", "")).toThrow(/"dance"/);
    expect(() => parseRules(" , ", "")).toThrow(/at least one/);
  });
});

describe("rules in the house", () => {
  it("treats turned-off commands as chat", () => {
    const rules = parseRules("feed", "");
    const { state, handled } = applyComments(house(), [say(1, "bath"), say(2, "feed")], NOW, rules);
    expect(handled.map((h) => h.comment.id)).toEqual([2]);
    expect(state.house.cursor).toBe(2);
    expect(state.totals.bath).toBe(0);
  });

  it("only lists what visitors may do", () => {
    const { body } = houseIssue("Pinchy", parseRules("feed,play", ""));
    expect(body).toContain("`feed`");
    expect(body).toContain("`play`");
    expect(body).not.toContain("`bath`");
    expect(houseIssue("Pinchy", parseRules("bath", "false")).body).not.toContain("smelly");
    expect(houseIssue("Pinchy").body).toContain("smelly");
  });

  it("keeps the pet clean when dirt is off", () => {
    const neglected = newCareState(new Date(NOW.getTime() - 30 * 86_400_000));
    expect(careView(neglected, NOW).dirt).toBe(3);
    expect(careView(neglected, NOW, parseRules("feed,bath,play", "false")).dirt).toBe(0);
  });
});

describe("runaway=false", () => {
  const gone = profile({ calendar: calendar([5, ...Array(45).fill(0)]) });

  it("keeps the pet home", () => {
    expect(computePetState(gone).ranAway).toBe(true);
    expect(computePetState(gone, { runaway: false }).ranAway).toBe(false);
  });

  it("works on the card and in the city", () => {
    const params = (q: string) => parsePetParams(new URLSearchParams(q));
    expect(renderWidget(gone, params(""))).toContain("Ran away");
    expect(renderWidget(gone, params("runaway=false"))).not.toContain("Ran away");
    expect(renderWidget(gone, params("widget=city&runaway=false"))).toContain('class="pf-zz"'); // asleep on the sidewalk
    expect(renderWidget(gone, params("widget=city"))).not.toContain('class="pf-zz"');
  });
});
