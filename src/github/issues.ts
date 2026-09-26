/**
 * The few REST calls care needs: list open issues, comment, close. Everything that comes back
 * is validated before use.
 */
import { TITLE_PREFIX } from "../care/commands.js";
import type { CareComment, CareIssue } from "../care/state.js";

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

function checkNumber(n: number): void {
  if (!Number.isSafeInteger(n) || n <= 0) throw new IssuesError(`"${n}" is not a valid id`);
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

export interface CommentQuery {
  /** Only comments updated since this time (narrows the listing; ids still decide). */
  since: string | null;
  /** Only comments with an id above this one. */
  after: number;
  /** Stop once this many new comments are found. */
  want: number;
}

/**
 * New comments on the house issue, oldest first. Pages through until `want` new comments turn
 * up, so a missing `since` never leaves recent comments unread behind old ones.
 */
export async function listHouseComments(token: string, repo: string, issue: number, q: CommentQuery, f: Fetch = fetch): Promise<CareComment[]> {
  checkRepo(repo);
  checkNumber(issue);
  const out: CareComment[] = [];
  const query = `per_page=100${q.since ? `&since=${encodeURIComponent(q.since)}` : ""}`;
  for (let page = 1; page <= 50 && out.length < q.want; page++) {
    const res = await f(`${API}/repos/${repo}/issues/${issue}/comments?${query}&page=${page}`, { headers: headers(token) });
    if (!res.ok) throw new IssuesError(`listing comments on #${issue} failed: ${res.status}`);
    const body: unknown = await res.json();
    if (!Array.isArray(body)) throw new IssuesError("unexpected comments response");
    for (const item of body) {
      if (typeof item !== "object" || item === null) continue;
      const c = item as Record<string, unknown>;
      const user = c.user as Record<string, unknown> | null;
      if (
        Number.isSafeInteger(c.id) &&
        (c.id as number) > q.after &&
        typeof c.body === "string" &&
        typeof c.created_at === "string" &&
        typeof user?.login === "string" &&
        typeof user?.type === "string"
      ) {
        out.push({ id: c.id as number, body: c.body, login: user.login, userType: user.type, createdAt: new Date(c.created_at).toISOString() });
      }
    }
    if (body.length < 100) break;
  }
  return out;
}

export async function react(token: string, repo: string, commentId: number, content: "heart" | "eyes" | "confused", f: Fetch = fetch): Promise<void> {
  checkRepo(repo);
  checkNumber(commentId);
  const res = await f(`${API}/repos/${repo}/issues/comments/${commentId}/reactions`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new IssuesError(`reacting to comment ${commentId} failed: ${res.status}`);
}

export async function createIssue(token: string, repo: string, title: string, body: string, f: Fetch = fetch): Promise<number> {
  checkRepo(repo);
  const res = await f(`${API}/repos/${repo}/issues`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) throw new IssuesError(`creating the house issue failed: ${res.status}`);
  const number = ((await res.json()) as { number?: unknown }).number;
  if (!Number.isSafeInteger(number) || (number as number) <= 0) throw new IssuesError("unexpected issue response");
  return number as number;
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
