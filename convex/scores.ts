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
  },
  handler: async (ctx, args) => {
    if (!Number.isFinite(args.score) || args.score < 0) return null
    if (args.rounds <= 0) return null
    const { display, key } = normalizeName(args.name)
    const id = await ctx.db.insert('scores', {
      mode: args.mode,
      realgym: args.realgym,
      score: Math.round(args.score),
      accuracy: Math.max(0, Math.min(1, args.accuracy)),
      elapsedMs: Math.max(0, Math.round(args.elapsedMs)),
      name: display,
      nameKey: key,
      rounds: args.rounds,
      bestStreak: Math.max(0, Math.round(args.bestStreak)),
    })
    return id
  },
})

export const topScores = query({
  args: {
    mode: v.union(v.literal('sprint'), v.literal('challenge')),
    realgym: v.boolean(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(50, Math.max(1, args.limit ?? 5))
    // Pull a bit more than `limit` so we can collapse to best-per-player without
    // missing entries when many runs share the same nameKey.
    const overscan = limit * 6
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

    // Collapse to one row per player (best run).
    const seen = new Set<string>()
    const result: typeof sorted = []
    for (const row of sorted) {
      if (seen.has(row.nameKey)) continue
      seen.add(row.nameKey)
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
    }))
  },
})
