import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const MAX_NAME_LEN = 20

function normalizeName(raw: string): { display: string; key: string } {
  // Strip control chars, collapse whitespace, cap length.
  const cleaned = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LEN)
  const display = cleaned.length === 0 ? 'anon' : cleaned
  return { display, key: display.toLowerCase() }
}

export const submit = mutation({
  args: {
    mode: v.union(v.literal('sprint'), v.literal('challenge')),
    realgym: v.boolean(),
    score: v.number(),
    accuracy: v.number(),
    elapsedMs: v.number(),
    name: v.string(),
    rounds: v.number(),
    bestStreak: v.number(),
    /** Stable per-device id so two players who pick the same name don't collide. */
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.score) || args.score < 0) return null
    if (args.rounds <= 0) return null
    if (args.playerId.length === 0) return null
    const { display, key } = normalizeName(args.name)
    const id = await ctx.db.insert('scores', {
      mode: args.mode,
      realgym: args.realgym,
      score: Math.round(args.score),
      accuracy: Math.max(0, Math.min(1, args.accuracy)),
      elapsedMs: Math.max(0, Math.round(args.elapsedMs)),
      name: display,
      nameKey: key,
      playerId: args.playerId,
      rounds: args.rounds,
      bestStreak: Math.max(0, Math.round(args.bestStreak)),
    })
    return id
  },
})

export const rename = mutation({
  args: {
    playerId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.playerId.length === 0) return 0
    const { display, key } = normalizeName(args.name)
    const rows = await ctx.db
      .query('scores')
      .withIndex('by_player', (q) => q.eq('playerId', args.playerId))
      .collect()
    for (const row of rows) {
      if (row.name !== display || row.nameKey !== key) {
        await ctx.db.patch(row._id, { name: display, nameKey: key })
      }
    }
    return rows.length
  },
})

export const topScores = query({
  args: {
    mode: v.union(v.literal('sprint'), v.literal('challenge')),
    realgym: v.boolean(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(2000, Math.max(1, args.limit ?? 5))
    // Pull a multiple of `limit` so we can collapse to best-per-player without
    // missing entries when many runs belong to the same player. Capped at 5000.
    const overscan = Math.min(5000, Math.max(limit * 4, 60))
    // Highest score first within (mode, realgym).
    const candidates = await ctx.db
      .query('scores')
      .withIndex('by_board', (q) => q.eq('mode', args.mode).eq('realgym', args.realgym))
      .order('desc')
      .take(overscan)

    // For Challenge, tiebreak by faster elapsed time so a 25/25 in 90s beats a 25/25 in 130s.
    const sorted =
      args.mode === 'challenge'
        ? [...candidates].sort((a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs)
        : candidates

    // Collapse to one row per player (best run). Prefer playerId so two players
    // with the same display name keep separate rows; fall back to nameKey for
    // pre-uuid legacy rows.
    const seen = new Set<string>()
    const result: typeof sorted = []
    for (const row of sorted) {
      const key = row.playerId ?? `legacy:${row.nameKey}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(row)
      if (result.length >= limit) break
    }
    return result.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      name: r.name,
      score: r.score,
      accuracy: r.accuracy,
      elapsedMs: r.elapsedMs,
      rounds: r.rounds,
      bestStreak: r.bestStreak,
      playerId: r.playerId,
    }))
  },
})
