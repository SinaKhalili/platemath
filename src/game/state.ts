import { useCallback, useEffect, useMemo, useState } from 'react'
import { generateRound, tierForRound, type Round } from './rounds'

export type Mode = 'quick' | 'standard' | 'practice'

export type ModeConfig = {
  id: Mode
  label: string
  rounds: number | 'endless'
  maxTier: 1 | 2 | 3 | 4
  blurb: string
}

export const MODES: Record<Mode, ModeConfig> = {
  quick: { id: 'quick', label: 'Quick Play', rounds: 10, maxTier: 2, blurb: 'Ten rounds, classic combos.' },
  standard: { id: 'standard', label: 'Standard', rounds: 25, maxTier: 4, blurb: 'Twenty-five rounds. Tiers 1 through 4.' },
  practice: { id: 'practice', label: 'Practice', rounds: 'endless', maxTier: 4, blurb: 'Endless drilling. No score.' },
}

export type Phase = 'landing' | 'playing' | 'reveal' | 'finished'

export type Answer = {
  round: Round
  given: number | null
  correct: boolean
  elapsedMs: number
  scoreEarned: number
}

export type SessionState = {
  mode: Mode
  roundIndex: number
  round: Round | null
  phase: Phase
  score: number
  streak: number
  bestStreak: number
  inputMode: 'choice' | 'numpad'
  history: Answer[]
  roundStartedAt: number
  lastAnswer: Answer | null
}

function loadBest(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem('platemath:best')
    return raw ? (JSON.parse(raw) as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function saveBest(best: Record<string, number>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('platemath:best', JSON.stringify(best))
  } catch {
    /* ignore */
  }
}

function streakMultiplier(streak: number): number {
  if (streak < 3) return 1
  const m = 1 + (streak - 2) * 0.25
  return Math.min(3, m)
}

function basePoints(tier: 1 | 2 | 3 | 4): number {
  return [100, 150, 220, 320][tier - 1]
}

export function useGame() {
  const [state, setState] = useState<SessionState>(() => ({
    mode: 'quick',
    roundIndex: 0,
    round: null,
    phase: 'landing',
    score: 0,
    streak: 0,
    bestStreak: 0,
    inputMode: 'choice',
    history: [],
    roundStartedAt: 0,
    lastAnswer: null,
  }))
  const [bests, setBests] = useState<Record<string, number>>(() => loadBest())

  const start = useCallback((mode: Mode) => {
    const tier = tierForRound(0, MODES[mode].rounds === 'endless' ? 25 : MODES[mode].rounds, MODES[mode].maxTier)
    const round = generateRound(tier)
    setState((s) => ({
      ...s,
      mode,
      roundIndex: 0,
      round,
      phase: 'playing',
      score: 0,
      streak: 0,
      bestStreak: 0,
      history: [],
      roundStartedAt: Date.now(),
      lastAnswer: null,
    }))
  }, [])

  const setInputMode = useCallback((m: 'choice' | 'numpad') => {
    setState((s) => ({ ...s, inputMode: m }))
  }, [])

  const answer = useCallback((value: number) => {
    setState((s) => {
      if (!s.round || s.phase !== 'playing') return s
      const correct = Math.abs(value - s.round.total) < 0.001
      const elapsedMs = Date.now() - s.roundStartedAt
      const nextStreak = correct ? s.streak + 1 : 0
      const mult = streakMultiplier(nextStreak)
      const earned = correct ? Math.round(basePoints(s.round.tier) * mult) : 0
      const entry: Answer = { round: s.round, given: value, correct, elapsedMs, scoreEarned: earned }
      return {
        ...s,
        phase: 'reveal',
        score: s.score + earned,
        streak: nextStreak,
        bestStreak: Math.max(s.bestStreak, nextStreak),
        history: [...s.history, entry],
        lastAnswer: entry,
      }
    })
  }, [])

  const next = useCallback(() => {
    setState((s) => {
      const config = MODES[s.mode]
      const nextIndex = s.roundIndex + 1
      const total = config.rounds === 'endless' ? 25 : config.rounds
      const sessionOver = config.rounds !== 'endless' && nextIndex >= config.rounds
      if (sessionOver) {
        const key = `${s.mode}`
        const prev = bests[key] ?? 0
        if (s.score > prev) {
          const updated = { ...bests, [key]: s.score }
          saveBest(updated)
          setBests(updated)
        }
        return { ...s, phase: 'finished' }
      }
      const tier = tierForRound(nextIndex, total, config.maxTier)
      const round = generateRound(tier)
      return {
        ...s,
        roundIndex: nextIndex,
        round,
        phase: 'playing',
        roundStartedAt: Date.now(),
        lastAnswer: null,
      }
    })
  }, [bests])

  const toLanding = useCallback(() => {
    setState((s) => ({ ...s, phase: 'landing' }))
  }, [])

  // Auto-advance after correct answers; wrong answers wait for player.
  useEffect(() => {
    if (state.phase === 'reveal' && state.lastAnswer?.correct) {
      const id = setTimeout(() => next(), 850)
      return () => clearTimeout(id)
    }
  }, [state.phase, state.lastAnswer, next])

  const accuracy = useMemo(() => {
    if (state.history.length === 0) return 0
    return state.history.filter((h) => h.correct).length / state.history.length
  }, [state.history])

  const avgTimeMs = useMemo(() => {
    const correct = state.history.filter((h) => h.correct)
    if (correct.length === 0) return 0
    return correct.reduce((s, h) => s + h.elapsedMs, 0) / correct.length
  }, [state.history])

  return {
    state,
    bests,
    start,
    answer,
    next,
    toLanding,
    setInputMode,
    accuracy,
    avgTimeMs,
    multiplier: streakMultiplier(state.streak),
  }
}
