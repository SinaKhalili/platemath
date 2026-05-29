# Plate Math 🏋️

A bite-sized game for getting fast at mental barbell math. A loaded bar drops in,
you call the total weight — tap a multiple-choice answer or type it on the keypad.
Built to feel like a Suika / Rhythm-Heaven toy: chunky plates, springy animations,
synthesized sound, global leaderboards.

**Play:** https://platemath.surreali.workers.dev

## Modes

- **Sprint** — as many as you can in 60 seconds. +1 right, −1 wrong, floored at 0.
- **Challenge** — 25 rounds as fast as you can (your time is the flex).
- **Practice** — endless, no pressure, no score.

Every round uses canonical "real gym" loadouts — the way a lifter actually loads a
bar (largest plate first), never two 25s where a 45 would do. Toggle multiple-choice
vs. typed answers and colored vs. plain-gray plates in Options.

## Tech

- **[TanStack Start](https://tanstack.com/start)** (React 19, Vite) on **Cloudflare Workers**
- **[Convex](https://convex.dev)** for the global high-score leaderboards
- **[PostHog](https://posthog.com)** for product analytics
- Tailwind v4, bespoke SVG barbell, Web Audio synthesized SFX — no asset files

## Develop

```bash
pnpm install
pnpm dev        # runs Convex + Vite together
```

Create a `.env` with your own keys:

```
VITE_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...   # PostHog project (client) key — safe to ship
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

`pnpm dev` provisions a local Convex deployment and writes `VITE_CONVEX_URL` to
`.env.local` automatically on first run.

## Project layout

```
convex/            # schema + leaderboard query/mutations (scores.ts)
src/game/          # round generation, scoring, sound, share helpers, state
src/components/    # Barbell (SVG), Landing, RoundScreen, leaderboards, etc.
src/routes/        # TanStack Start routes; __root.tsx wires the providers
```

## Deploy

```bash
# Pushes Convex functions to prod + builds the frontend against the prod URL,
# then uploads the Cloudflare Worker.
npx convex deploy --cmd 'pnpm run build' --cmd-url-env-var-name VITE_CONVEX_URL
pnpm exec wrangler deploy
```

Requires `CONVEX_DEPLOY_KEY` (production) and a Cloudflare login or
`CLOUDFLARE_API_TOKEN` in the environment.

## License

MIT
