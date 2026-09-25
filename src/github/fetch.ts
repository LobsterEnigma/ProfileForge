import type { ContributionDay, GitHubProfile, LanguageShare } from "../types.js";

const ENDPOINT = "https://api.github.com/graphql";

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly kind: "not_found" | "rate_limited" | "auth" | "upstream",
  ) {
    super(message);
  }
}

const PROFILE_QUERY = /* GraphQL */ `
  query Profile($login: String!) {
    user(login: $login) {
      login
      name
      followers { totalCount }
      contributionsCollection {
        contributionYears
        totalCommitContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalIssueContributions
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          stargazerCount
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }
`;

interface ProfileResponse {
  user: {
    login: string;
    name: string | null;
    followers: { totalCount: number };
    contributionsCollection: {
      contributionYears: number[];
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalIssueContributions: number;
      contributionCalendar: {
        weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
      };
    };
    repositories: {
      nodes: {
        stargazerCount: number;
        languages: { edges: { size: number; node: { name: string; color: string | null } }[] };
      }[];
    };
  } | null;
}

async function graphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "ProfileForge",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401) throw new GitHubError("GitHub token is invalid", "auth");
  if (res.status === 403 || res.status === 429) throw new GitHubError("GitHub API rate limit hit", "rate_limited");
  if (!res.ok) throw new GitHubError(`GitHub API responded ${res.status}`, "upstream");

  const body = (await res.json()) as { data?: T; errors?: { type?: string; message: string }[] };
  if (body.errors?.length) {
    const first = body.errors[0]!;
    if (first.type === "NOT_FOUND") throw new GitHubError("User not found", "not_found");
    if (first.type === "RATE_LIMITED") throw new GitHubError("GitHub API rate limit hit", "rate_limited");
    throw new GitHubError(first.message, "upstream");
  }
  if (!body.data) throw new GitHubError("Empty response from GitHub", "upstream");
  return body.data;
}

/** One aliased contributionsCollection per year — a single request no matter how old the account is. */
async function fetchLifetimeContributions(token: string, login: string, years: number[]): Promise<number> {
  if (years.length === 0) return 0;
  const fields = years
    .map(
      (y) =>
        `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") { contributionCalendar { totalContributions } }`,
    )
    .join("\n");
  const query = `query Lifetime($login: String!) { user(login: $login) { ${fields} } }`;
  const data = await graphql<{ user: Record<string, { contributionCalendar: { totalContributions: number } }> }>(
    token,
    query,
    { login },
  );
  return Object.values(data.user).reduce((sum, c) => sum + c.contributionCalendar.totalContributions, 0);
}

export function aggregateLanguages(
  repos: NonNullable<ProfileResponse["user"]>["repositories"]["nodes"],
): LanguageShare[] {
  const byName = new Map<string, LanguageShare>();
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const entry = byName.get(node.name) ?? { name: node.name, color: node.color, bytes: 0 };
      entry.bytes += size;
      byName.set(node.name, entry);
    }
  }
  return [...byName.values()].sort((a, b) => b.bytes - a.bytes);
}

export async function fetchProfile(login: string, token: string): Promise<GitHubProfile> {
  const { user } = await graphql<ProfileResponse>(token, PROFILE_QUERY, { login });
  if (!user) throw new GitHubError("User not found", "not_found");

  const cc = user.contributionsCollection;
  const calendar: ContributionDay[] = cc.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
  );
  const repos = user.repositories.nodes;

  return {
    login: user.login,
    name: user.name,
    followers: user.followers.totalCount,
    totalStars: repos.reduce((sum, r) => sum + r.stargazerCount, 0),
    lifetimeContributions: await fetchLifetimeContributions(token, user.login, cc.contributionYears),
    commits: cc.totalCommitContributions,
    pullRequests: cc.totalPullRequestContributions,
    reviews: cc.totalPullRequestReviewContributions,
    issues: cc.totalIssueContributions,
    calendar,
    languages: aggregateLanguages(repos),
  };
}
