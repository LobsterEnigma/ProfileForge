/**
 * The pet's care log, kept as JSON in the owner's repo. It's read back on every run, so it's
 * treated as untrusted: every field is validated, unknown fields are dropped, and anything
 * malformed falls back to a fresh state rather than failing the run.
 */
import { LOGIN_RE } from "../options.js";
import { CARE_ACTIONS, parseTitle, type CareAction } from "./commands.js";

export const LIMITS = {
  /** Each visitor may do each action once per UTC day. */
  perVisitorPerAction: 1,
  /** Across everyone, per UTC day. */
  perDay: 60,
  /** Issues handled per run; the rest wait for the next one. */
  perRun: 30,
  maxFileBytes: 64 * 1024,
  maxHandled: 300,
  maxRecent: 5,
  maxTotal: 1_000_000_000,
};

export interface CareEvent {
  action: CareAction;
  by: string;
  at: string;
}

export interface CareState {
  version: 1;
  /** When care began: dirt counts from here until the first bath. */
  since: string;
  last: Record<CareAction, string | null>;
  /** The UTC day `today` and `todayTotal` count. */
  day: string;
  today: Record<string, CareAction[]>;
  todayTotal: number;
  totals: Record<CareAction, number>;
  /** Newest first. */
  recent: CareEvent[];
  /** Issue numbers already applied, so a retry never applies one twice. */
  handled: number[];
}

const utcDay = (d: Date) => d.toISOString().slice(0, 10);

/** What `login` did today. Own properties only, so a user called "constructor" is just a user. */
const todayOf = (state: CareState, login: string): CareAction[] => (Object.hasOwn(state.today, login) ? state.today[login]! : []);

export function newCareState(now: Date): CareState {
  return {
    version: 1,
    since: now.toISOString(),
    last: { feed: null, bath: null, play: null },
    day: utcDay(now),
    today: {},
    todayTotal: 0,
    totals: { feed: 0, bath: 0, play: 0 },
    recent: [],
    handled: [],
  };
}

// ── Validation ───────────────────────────────────────────────────────────────

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isAction = (v: unknown): v is CareAction => CARE_ACTIONS.includes(v as CareAction);
const isLogin = (v: unknown): v is string => typeof v === "string" && LOGIN_RE.test(v);

/** An ISO timestamp not in the future (with a little clock slack). */
function isTime(v: unknown, now: Date): v is string {
  if (typeof v !== "string" || v.length > 40) return false;
  const t = Date.parse(v);
  return Number.isFinite(t) && t <= now.getTime() + 60_000 && new Date(t).toISOString() === v;
}

const count = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 ? Math.min(v, LIMITS.maxTotal) : 0;

/**
 * Parses the stored JSON. Invalid pieces are dropped; if the whole file is unusable the
 * state starts over and `warning` says why.
 */
export function parseCareState(text: string | null, now: Date): { state: CareState; warning?: string } {
  const fresh = newCareState(now);
  if (text === null) return { state: fresh };
  if (text.length > LIMITS.maxFileBytes) return { state: fresh, warning: "care file too large, starting over" };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { state: fresh, warning: "care file is not valid JSON, starting over" };
  }
  if (!isObject(raw) || raw.version !== 1) return { state: fresh, warning: "unknown care file format, starting over" };

  const state = fresh;
  if (isTime(raw.since, now)) state.since = raw.since;
  if (isObject(raw.last)) {
    for (const a of CARE_ACTIONS) if (isTime(raw.last[a], now)) state.last[a] = raw.last[a] as string;
  }
  if (isObject(raw.totals)) {
    for (const a of CARE_ACTIONS) state.totals[a] = count(raw.totals[a]);
  }
  // Daily counters only carry over within the same day.
  if (raw.day === state.day && isObject(raw.today)) {
    for (const [login, actions] of Object.entries(raw.today).slice(0, LIMITS.perDay)) {
      if (isLogin(login) && Array.isArray(actions)) {
        const valid = [...new Set(actions.filter(isAction))];
        if (valid.length) state.today[login] = valid;
      }
    }
    state.todayTotal = Math.min(count(raw.todayTotal), LIMITS.perDay);
  }
  if (Array.isArray(raw.recent)) {
    state.recent = raw.recent
      .filter((e): e is CareEvent => isObject(e) && isAction(e.action) && isLogin(e.by) && isTime(e.at, now))
      .slice(0, LIMITS.maxRecent)
      .map(({ action, by, at }) => ({ action, by, at }));
  }
  if (Array.isArray(raw.handled)) {
    state.handled = raw.handled
      .filter((n): n is number => Number.isInteger(n) && (n as number) > 0)
      .slice(-LIMITS.maxHandled);
  }
  return { state };
}

export const serializeCareState = (state: CareState) => JSON.stringify(state, null, 2) + "\n";

// ── Applying issues ──────────────────────────────────────────────────────────

export interface CareIssue {
  number: number;
  title: string;
  login: string;
  /** "User", "Bot", "Organization"… from the GitHub API. */
  userType: string;
}

export type Outcome =
  | { kind: "done"; action: CareAction }
  | { kind: "limited"; action: CareAction }
  | { kind: "busy" }
  | { kind: "unknown" };

export interface Handled {
  issue: CareIssue;
  outcome: Outcome;
}

/**
 * Applies care issues, oldest first. Returns the new state and what happened to each issue,
 * so the caller can reply once the state is safely committed. Issues that aren't for the pet,
 * come from bots, or were already handled are skipped.
 */
export function applyIssues(previous: CareState, issues: CareIssue[], now: Date): { state: CareState; handled: Handled[] } {
  const state: CareState = structuredClone(previous);
  if (state.day !== utcDay(now)) {
    state.day = utcDay(now);
    state.today = {};
    state.todayTotal = 0;
  }

  const seen = new Set(state.handled);
  const handled: Handled[] = [];
  const queue = [...issues].sort((a, b) => a.number - b.number);

  for (const issue of queue) {
    if (handled.length >= LIMITS.perRun) break;
    if (seen.has(issue.number) || issue.userType !== "User" || !isLogin(issue.login)) continue;
    const parsed = parseTitle(issue.title);
    if (!parsed) continue;

    let outcome: Outcome;
    if (parsed.kind === "unknown") {
      outcome = { kind: "unknown" };
    } else if (state.todayTotal >= LIMITS.perDay) {
      outcome = { kind: "busy" };
    } else if (todayOf(state, issue.login).filter((a) => a === parsed.action).length >= LIMITS.perVisitorPerAction) {
      outcome = { kind: "limited", action: parsed.action };
    } else {
      const at = now.toISOString();
      state.today[issue.login] = [...todayOf(state, issue.login), parsed.action];
      state.todayTotal++;
      state.totals[parsed.action] = Math.min(state.totals[parsed.action] + 1, LIMITS.maxTotal);
      state.last[parsed.action] = at;
      state.recent = [{ action: parsed.action, by: issue.login, at }, ...state.recent].slice(0, LIMITS.maxRecent);
      outcome = { kind: "done", action: parsed.action };
    }

    handled.push({ issue, outcome });
    seen.add(issue.number);
    state.handled = [...state.handled, issue.number].slice(-LIMITS.maxHandled);
  }
  return { state, handled };
}

/** The reply posted on a handled issue. Only fixed text, the pet's name and a validated login. */
export function replyFor(outcome: Outcome, petName: string, login: string): string {
  switch (outcome.kind) {
    case "done":
      return {
        feed: `🍖 Nom nom! ${petName} is fed. Thanks for stopping by, ${login}!`,
        bath: `🛁 Splash! ${petName} is squeaky clean again. Thanks, ${login}!`,
        play: `🎾 ${petName} chased the ball and had a blast. Thanks for playing, ${login}!`,
      }[outcome.action] + "\n\nThe card updates within a few minutes. This issue closes itself.";
    case "limited":
      return `${petName} already got that from you today. Come back tomorrow! 🌙`;
    case "busy":
      return `${petName} has had a very busy day and is resting now. Try again tomorrow! 💤`;
    case "unknown":
      return `${petName} only understands \`feed\`, \`bath\` and \`play\`. Try a title like "ProfileForge: feed".`;
  }
}
