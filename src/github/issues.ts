/**
 * The few REST calls care needs: list open issues, comment, close. Everything that comes back
 * is validated before use.
 */
import { TITLE_PREFIX } from "../care/commands.js";
import type { CareIssue } from "../care/state.js";

const API = "https://api.github.com";
const REPO_RE = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;

export class IssuesError extends Error {}

type Fetch = typeof fetch;

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "ProfileForge",
  };
}

function checkRepo(repo: string): void {
  if (!REPO_RE.test(repo)) throw new IssuesError(`"${repo}" is not a valid owner/repo`);
}

/** Open issues whose title starts like a care request, oldest first (one page is plenty). */
export async function listCareIssues(token: string, repo: string, f: Fetch = fetch): Promise<CareIssue[]> {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues?state=open&sort=created&direction=asc&per_page=100`, {
    headers: headers(token),
  });
  if (!res.ok) throw new IssuesError(`listing issues failed: ${res.status}`);
  const body: unknown = await res.json();
  if (!Array.isArray(body)) throw new IssuesError("unexpected issues response");

  const prefix = TITLE_PREFIX.toLowerCase();
  return body.flatMap((item: unknown): CareIssue[] => {
    if (typeof item !== "object" || item === null) return [];
    const i = item as Record<string, unknown>;
    const user = i.user as Record<string, unknown> | null;
    if (
      "pull_request" in i ||
      !Number.isInteger(i.number) ||
      typeof i.title !== "string" ||
      !i.title.trim().toLowerCase().startsWith(prefix) ||
      typeof user?.login !== "string" ||
      typeof user?.type !== "string"
    ) {
      return [];
    }
    return [{ number: i.number as number, title: i.title, login: user.login, userType: user.type }];
  });
}

export async function comment(token: string, repo: string, issue: number, body: string, f: Fetch = fetch): Promise<void> {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues/${issue}/comments`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new IssuesError(`commenting on #${issue} failed: ${res.status}`);
}

export async function close(token: string, repo: string, issue: number, f: Fetch = fetch): Promise<void> {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues/${issue}`, {
    method: "PATCH",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ state: "closed", state_reason: "completed" }),
  });
  if (!res.ok) throw new IssuesError(`closing #${issue} failed: ${res.status}`);
}
