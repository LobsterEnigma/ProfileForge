/**
 * Visitors care for a pet by commenting "feed", "bath" or "play" in its house: one issue whose
 * title starts with TITLE_PREFIX. Comments are untrusted: only their first word is matched
 * against this allowlist, and it is never echoed, rendered or passed to a shell.
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

/**
 * A comment in the pet's house: its first word is the command ("feed", "🍖 feed", "/feed").
 * Anything else is just a visitor chatting and is left alone.
 */
export function parseCommand(body: string): CareAction | null {
  if (body.length > 2000) return null;
  const match = /^[^\p{L}\p{N}]*([a-z]+)/iu.exec(body);
  const word = (match?.[1] ?? "").toLowerCase();
  return Object.hasOwn(SYNONYMS, word) ? SYNONYMS[word]! : null;
}

/** The link visitors follow to the pet's house. */
export function houseLink(repo: string, issue: number): string {
  return `https://github.com/${repo}/issues/${issue}`;
}
