import { demoState } from "./demo.js";
import { fetchProfile, GitHubError } from "./github/fetch.js";
import { LOGIN_RE, parsePetParams } from "./options.js";
import { renderPetCard } from "./pet/render.js";
import { computePetState } from "./pet/state.js";
import { renderErrorCard } from "./svg/error.js";
import type { GitHubProfile } from "./types.js";

// Warm serverless instances reuse this, which saves GitHub API quota on popular profiles.
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { profile: GitHubProfile; expires: number }>();

async function cachedProfile(login: string, token: string): Promise<GitHubProfile> {
  const key = login.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.profile;
  const profile = await fetchProfile(login, token);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, { profile, expires: Date.now() + CACHE_TTL_MS });
  return profile;
}

function svgResponse(body: string, maxAge: number): Response {
  return new Response(body, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=86400`,
    },
  });
}

/** `GET /api/pet?user=<login>` → the pet card as SVG. Shared by the Vercel function and the dev server. */
export async function handlePet(url: URL, env: { GITHUB_TOKEN?: string } = {}): Promise<Response> {
  const { theme, hideBorder, petName, species, mood, stage } = parsePetParams(url.searchParams);
  const user = url.searchParams.get("user")?.trim() ?? "";

  if (user.toLowerCase() === "demo") {
    return svgResponse(renderPetCard(demoState(mood, stage, petName), { theme, hideBorder }), 86400);
  }

  if (!LOGIN_RE.test(user)) {
    return svgResponse(renderErrorCard("Missing or invalid user", "Try /api/pet?user=your-github-login", theme), 300);
  }
  if (!env.GITHUB_TOKEN) {
    return svgResponse(renderErrorCard("Server has no GITHUB_TOKEN", "See the README's self-hosting section", theme), 60);
  }

  try {
    const profile = await cachedProfile(user, env.GITHUB_TOKEN);
    const state = computePetState(profile, { petName, species });
    return svgResponse(renderPetCard(state, { theme, hideBorder }), 4 * 3600);
  } catch (err) {
    if (err instanceof GitHubError) {
      const hint = {
        not_found: `No GitHub user called "${user}"`,
        rate_limited: "The shared instance is busy — try again soon, or self-host / use the Action",
        auth: "The server's GitHub token was rejected",
        upstream: "GitHub had a hiccup — try again in a minute",
      }[err.kind];
      return svgResponse(renderErrorCard(err.kind === "not_found" ? "User not found" : "Couldn't reach GitHub", hint, theme), 300);
    }
    console.error(err);
    return svgResponse(renderErrorCard("Something went wrong", undefined, theme), 60);
  }
}
