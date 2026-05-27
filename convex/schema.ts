import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  scores: defineTable({
    /** 'sprint' or 'challenge'. Practice and other untracked modes are never written. */
    mode: v.union(v.literal('sprint'), v.literal('challenge')),
    /** Was the Real Gym toggle on for this run? Affects difficulty and is tracked separately. */
    realgym: v.boolean(),
    /** For 'sprint', this is the +/- tally final value (>= 0). For 'challenge', total points. */
    score: v.number(),
    /** 0..1 fraction of correct answers. */
    accuracy: v.number(),
    /**
     * Total time spent in the session in milliseconds. For 'challenge' this is what
     * the player races against. For 'sprint' it's always around the time limit.
     */
    elapsedMs: v.number(),
    /** Display name. Lowercased lookup name is stored in `nameKey`. */
    name: v.string(),
    nameKey: v.string(),
    /** Number of rounds completed. */
    rounds: v.number(),
    /** Player's longest streak in the session. */
    bestStreak: v.number(),
  })
    // Top scores per (mode, realgym), highest first.
    .index('by_board', ['mode', 'realgym', 'score'])
    // Per-player history (so a leaderboard can collapse to "best per player" later).
    .index('by_player_board', ['nameKey', 'mode', 'realgym']),
})
