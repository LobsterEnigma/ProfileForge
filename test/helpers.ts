import type { ContributionDay, GitHubProfile } from "../src/types.js";

/** Builds a calendar from counts, oldest first; the last entry is "today". */
export function calendar(counts: number[]): ContributionDay[] {
  const today = Date.UTC(2026, 8, 24);
  return counts.map((count, i) => ({
    date: new Date(today - (counts.length - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    count,
  }));
}

export function profile(overrides: Partial<GitHubProfile> = {}): GitHubProfile {
  return {
    login: "octocat",
    name: "The Octocat",
    followers: 100,
    totalStars: 250,
    lifetimeContributions: 3000,
    commits: 800,
    pullRequests: 120,
    reviews: 60,
    issues: 40,
    calendar: calendar([...Array(360).fill(1), 2, 3, 0, 4, 5]),
    languages: [{ name: "Rust", color: "#dea584", bytes: 9000 }],
    ...overrides,
  };
}
