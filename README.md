<div align="center">

# ProfileForge

**Forge your GitHub profile with animated SVG widgets.**

A pixel pet that lives on your commits: it bounces when you ship, gets hungry when you don't,
and evolves as your lifetime contributions grow.

<img src="examples/mood-happy.svg" alt="A happy pixel crab jumping next to its RPG stats" width="480">

</div>

---

## Quick start

Drop one line into your profile README (`<username>/<username>/README.md`):

```md
![My ProfileForge pet](https://YOUR-DEPLOYMENT/api/pet?user=YOUR_GITHUB_LOGIN)
```

> A public instance is on the way. Until then, [self-host it on Vercel](#self-hosting) in about two minutes.

## It has moods

Your pet reacts to your recent contribution calendar:

| Mood | When | |
|---|---|---|
| **Happy** | 3+ day streak, or 15+ contributions this week | <img src="examples/mood-happy.svg" width="300"> |
| **Idle** | Contributed in the last 3 days | <img src="examples/mood-idle.svg" width="300"> |
| **Hungry** | 4–13 days without contributions: it dreams of green squares | <img src="examples/mood-hungry.svg" width="300"> |
| **Sleeping** | 14+ quiet days | <img src="examples/mood-sleeping.svg" width="300"> |

## It evolves

XP = lifetime contributions + 2 × stars + 3 × followers, so **levels never go down**.

| Stage | Level | |
|---|---|---|
| Egg | 1–2 (cracks as it gets close) | <img src="examples/stage-egg.svg" width="300"> |
| Baby | 3–14 | <img src="examples/stage-baby.svg" width="300"> |
| Adult | 15–49 | <img src="examples/stage-adult.svg" width="300"> |
| Legendary | 50+ (gold, crown, sparkles) | <img src="examples/stage-legendary.svg" width="300"> |

## It has RPG stats

- **Class**: picked from your top language. Rust → *Berserker*, Haskell → *Archmage*, CSS → *Bard*, Shell → *Necromancer*, … ([full list](src/pet/classes.ts))
- **HP**: how many of the last 14 days you contributed
- **EXP**: progress to the next level
- **STR** commits · **INT** PRs + reviews · **CHA** stars + followers · **DEX** issues (last year, log scale, 1–99)

## Options

| Param | Default | Description |
|---|---|---|
| `user` | *required* | GitHub login. `demo` renders a sample pet. |
| `name` | `Pinchy` | Your pet's name (max 16 chars). |
| `theme` | `auto` | `auto` · `light` · `dark` · `dracula` · `gameboy` · `sakura` |
| `hide_border` | `false` | `true` to drop the card border. |
| `mood`, `stage` | | Only with `user=demo`, to preview any state. |

`auto` follows the viewer's light/dark setting. At night, the beach gets stars.

| | | |
|---|---|---|
| <img src="examples/theme-light.svg" width="260"><br>`light` | <img src="examples/theme-dark.svg" width="260"><br>`dark` | <img src="examples/theme-dracula.svg" width="260"><br>`dracula` |
| <img src="examples/theme-gameboy.svg" width="260"><br>`gameboy` | <img src="examples/theme-sakura.svg" width="260"><br>`sakura` | |

## Self-hosting

1. Fork this repo and import it in [Vercel](https://vercel.com/new).
2. Create a [GitHub token](https://github.com/settings/personal-access-tokens/new). A fine-grained token with **no extra permissions** is enough for public data.
3. Add it as the `GITHUB_TOKEN` environment variable and deploy.
4. Your pet lives at `https://<your-app>.vercel.app/api/pet?user=<login>`.

Responses are cached for 4 hours, so your pet updates a few times a day.

## Development

```bash
npm install
npm run dev        # http://localhost:3000: gallery of every mood × stage × theme
npm test
```

`GITHUB_TOKEN=... npm run dev` also lets the gallery render real users.
`/zoom?x=4&user=demo&mood=idle` blows a card up for pixel-level inspection.

### How it works

GitHub strips JavaScript from README images, so everything is plain SVG + CSS:

- Sprites are ASCII grids (`src/pet/species/crab.ts`), compiled to one `<path>` per color with horizontal runs merged.
- Frame animation swaps two layers with `steps(1)` opacity keyframes; movement uses nested `<g>`s so walking, jumping and breathing never fight over `transform`.
- Floating hearts and Zzz use negative `animation-delay`, so the first frame already looks alive.
- `prefers-reduced-motion` freezes everything.

### Add a species 🦀🐹🐍

Every pet is one file of ASCII art. Copy [`src/pet/species/crab.ts`](src/pet/species/crab.ts), redraw the grids
(body, four eye styles, three mouths, two limb frames per mood), register it in `index.ts`, and check it at `/zoom`.
A Go gopher, a Python snake, a PHP elephant: all very welcome.

## Roadmap

- [ ] More species, picked from your top language
- [ ] GitHub Action mode (generate the SVG in your own repo, no shared rate limits)
- [ ] 🌃 Pixel city: your contribution graph as a skyline at night
- [ ] Web configurator: build your card and copy the Markdown

## License

[MIT](LICENSE)
