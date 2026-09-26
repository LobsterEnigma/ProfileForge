/**
 * The pet's care log, kept as JSON in the owner's repo. It's read back on every run, so it's
 * treated as untrusted: every field is validated, unknown fields are dropped, and anything
 * malformed falls back to a fresh state rather than failing the run.
 */
import { LOGIN_RE } from "../options.js";
import { CARE_ACTIONS, parseCommand, type CareAction } from "./commands.js";

export const LIMITS = {
  /** Each visitor may do each action once per UTC day. */
  perVisitorPerAction: 1,
  /** Across everyone, per UTC day. */
  perDay: 60,
  /** Issues handled per run; the rest wait for the next one. */
  perRun: 30,
  maxFileBytes: 64 * 1024,
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
  /** The pet's house: one issue where visitors comment, and the last comment already read. */
  house: { issue: number | null; cursor: number; cursorAt: string | null };
}

/** What the owner lets visitors do, and whether skipped baths show. */
export interface CareRules {
  actions: CareAction[];
  dirt: boolean;
}

export const DEFAULT_RULES: CareRules = { actions: [...CARE_ACTIONS], dirt: true };

/**
 * Reads the `care_actions` and `dirt` inputs. Without baths there's no way to get clean again,
 * so dirt is off whenever bath is.
 */
export function parseRules(actions: string, dirt: string): CareRules {
  const list = actions.trim() ? actions.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean) : [...CARE_ACTIONS];
  const unknown = list.filter((a) => !CARE_ACTIONS.includes(a as CareAction));
  if (unknown.length) throw new Error(`care_actions: unknown ${unknown.map((u) => `"${u}"`).join(", ")} (use ${CARE_ACTIONS.join(", ")})`);
  if (!list.length) throw new Error("care_actions: pick at least one of feed, bath, play");
  const chosen = CARE_ACTIONS.filter((a) => list.includes(a));
  return { actions: chosen, dirt: dirt.trim().toLowerCase() !== "false" && chosen.includes("bath") };
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
    house: { issue: null, cursor: 0, cursorAt: null },
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
  if (isObject(raw.house)) {
    const { issue, cursor, cursorAt } = raw.house;
    if (Number.isSafeInteger(issue) && (issue as number) > 0) state.house.issue = issue as number;
    if (Number.isSafeInteger(cursor) && (cursor as number) > 0) state.house.cursor = cursor as number;
    if (isTime(cursorAt, now)) state.house.cursorAt = cursorAt;
  }
  return { state };
}

export const serializeCareState = (state: CareState) => JSON.stringify(state, null, 2) + "\n";

// ── Applying issues ──────────────────────────────────────────────────────────

/** An open issue whose title looks like a care request (from before the house existed). */
export interface CareIssue {
  number: number;
  title: string;
  login: string;
  /** "User", "Bot", "Organization"… from the GitHub API. */
  userType: string;
}

export type Outcome = { kind: "done"; action: CareAction } | { kind: "limited"; action: CareAction } | { kind: "busy" };

function startDay(state: CareState, now: Date): void {
  if (state.day !== utcDay(now)) {
    state.day = utcDay(now);
    state.today = {};
    state.todayTotal = 0;
  }
}

/** One visit, within the daily limits. Mutates `state`, which is always a private copy. */
function visit(state: CareState, login: string, action: CareAction, now: Date): Outcome {
  if (state.todayTotal >= LIMITS.perDay) return { kind: "busy" };
  if (todayOf(state, login).filter((a) => a === action).length >= LIMITS.perVisitorPerAction) return { kind: "limited", action };
  const at = now.toISOString();
  state.today[login] = [...todayOf(state, login), action];
  state.todayTotal++;
  state.totals[action] = Math.min(state.totals[action] + 1, LIMITS.maxTotal);
  state.last[action] = at;
  state.recent = [{ action, by: login, at }, ...state.recent].slice(0, LIMITS.maxRecent);
  return { kind: "done", action };
}

export interface CareComment {
  id: number;
  body: string;
  login: string;
  userType: string;
  /** ISO timestamp from the API, used to only fetch newer comments next time. */
  createdAt: string;
}

export interface HandledComment {
  comment: CareComment;
  outcome: Outcome;
}

/**
 * Applies new comments in the pet's house, oldest first. The cursor moves past every comment
 * it reads (chat, bots, commands alike), so none is ever read twice, even if edited later.
 */
export function applyComments(
  previous: CareState,
  comments: CareComment[],
  now: Date,
  rules: CareRules = DEFAULT_RULES,
): { state: CareState; handled: HandledComment[] } {
  const state: CareState = structuredClone(previous);
  startDay(state, now);
  const handled: HandledComment[] = [];
  const fresh = comments.filter((c) => c.id > state.house.cursor).sort((a, b) => a.id - b.id);

  for (const comment of fresh) {
    if (handled.length >= LIMITS.perRun) break;
    state.house.cursor = comment.id;
    if (isTime(comment.createdAt, now)) state.house.cursorAt = comment.createdAt;
    if (comment.userType !== "User" || !isLogin(comment.login)) continue;
    // Commands the owner turned off are just chat.
    const action = parseCommand(comment.body);
    if (!action || !rules.actions.includes(action)) continue;
    handled.push({ comment, outcome: visit(state, comment.login, action, now) });
  }
  return { state, handled };
}

/** How the pet answers a comment in its house: a reaction, never a reply. */
export function reactionFor(outcome: HandledComment["outcome"]): "heart" | "eyes" | "confused" {
  return outcome.kind === "done" ? "heart" : outcome.kind === "limited" ? "eyes" : "confused";
}

/** The house issue's opening post, listing only what visitors may do. Fixed text and the owner's pet name only. */
export function houseIssue(petName: string, rules: CareRules = DEFAULT_RULES): { title: string; body: string } {
  const rows: Record<CareAction, string> = {
    feed: "| `feed` | 🍖 a meal |",
    bath: `| \`bath\` | 🛁 a bath${rules.dirt ? ` (${petName} gets smelly without one!)` : ""} |`,
    play: "| `play` | 🎾 a game of fetch |",
  };
  return {
    title: `ProfileForge: ${petName}'s house 🏠`,
    body: [
      `## Welcome to ${petName}'s house!`,
      "",
      `Leave a comment starting with one of these words to take care of ${petName}:`,
      "",
      "| Comment | |",
      "|---|---|",
      ...rules.actions.map((a) => rows[a]),
      "",
      `${petName} reacts with ❤️ when it's done, or 👀 if you already did that today. Your visit shows up on the profile card within a few minutes.`,
      "",
      "<sub>Powered by [ProfileForge](https://github.com/LobsterEnigma/ProfileForge). Each visitor can do each action once a day.</sub>",
    ].join("\n"),
  };
}

/** The reply on a stray care issue, pointing its author to the house. Fixed text only. */
export function redirectReply(petName: string, house: number): string {
  return `🏠 ${petName} lives in its house now! Say hi in #${house}: comment \`feed\`, \`bath\` or \`play\` there. Closing this one to keep things tidy.`;
}
