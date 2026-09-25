/**
 * Visitors care for a pet by opening an issue titled "ProfileForge: feed" (or bath, play).
 * Titles are untrusted: they are only ever matched against this allowlist, never echoed,
 * rendered or passed to a shell.
 */
export const CARE_ACTIONS = ["feed", "bath", "play"] as const;
export type CareAction = (typeof CARE_ACTIONS)[number];

export const TITLE_PREFIX = "ProfileForge:";

const SYNONYMS: Record<string, CareAction> = {
  feed: "feed",
  food: "feed",
  eat: "feed",
  bath: "bath",
  wash: "bath",
  clean: "bath",
  play: "play",
  ball: "play",
};

export type ParsedTitle = { kind: "action"; action: CareAction } | { kind: "unknown" };

/** `null` for issues that aren't for the pet at all. */
export function parseTitle(title: string): ParsedTitle | null {
  if (title.length > 256) return null;
  const match = /^\s*profileforge\s*:\s*([a-z]+)?/i.exec(title);
  if (!match) return null;
  // Own properties only: "constructor" or "toString" must not resolve to Object's.
  const word = (match[1] ?? "").toLowerCase();
  return Object.hasOwn(SYNONYMS, word) ? { kind: "action", action: SYNONYMS[word]! } : { kind: "unknown" };
}

/** A prefilled "new issue" link for a care action, for the profile README. */
export function careLink(repo: string, action: CareAction): string {
  const title = encodeURIComponent(`${TITLE_PREFIX} ${action}`);
  const body = encodeURIComponent("Just press **Create**. Your visit reaches the pet in a minute or two.");
  return `https://github.com/${repo}/issues/new?title=${title}&body=${body}`;
}
