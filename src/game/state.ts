import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generateRealisticRound, generateRound, tierForRound, type Round } from './rounds'

export type Mode = 'sprint' | 'quick' | 'standard' | 'practice'

export type Scoring = 'points' | 'tally'

export type ModeConfig = {
  id: Mode
  label: string
  rounds: number | 'endless'
  maxTier: 1 | 2 | 3 | 4
  blurb: string
  scoring: Scoring
  /** Seconds. Only set for timed modes. */
  timeLimit?: number
}

export const MODES: Record<Mode, ModeConfig> = {
  sprint: {
    id: 'sprint',
    label: 'Sprint',
    rounds: 'endless',
    maxTier: 4,
    blurb: 'As many as you can in 35 seconds.',
    scoring: 'tally',
    timeLimit: 35,
  },
  quick: { id: 'quick', label: 'Quick Play', rounds: 10, maxTier: 2, blurb: 'Ten rounds, classic combos.', scoring: 'points' },
  standard: { id: 'standard', label: 'Standard', rounds: 25, maxTier: 4, blurb: 'Twenty-five rounds. Tiers 1 through 4.', scoring: 'points' },
  practice: { id: 'practice', label: 'Practice', rounds: 'endless', maxTier: 4, blurb: 'Endless drilling. No score.', scoring: 'points' },
}

export type Phase = 'landing' | 'playing' | 'reveal' | 'finished'

export type Settings = {
  realgym: boolean
  monochrome: boolean
  inputMode: 'choice' | 'numpad'
}

const DEFAULT_SETTINGS: Settings = { realgym: true, monochrome: false, inputMode: 'numpad' }

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
  history: Answer[]
  roundStartedAt: number
  sessionStartedAt: number
  /** Frozen at finish; null while playing. */
  sessionElapsedMs: number | null
  lastAnswer: Answer | null
  /** Seconds remaining for timed modes; null otherwise. */
  timeRemaining: number | null
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

function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem('platemath:settings')
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(s: Settings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('platemath:settings', JSON.stringify(s))
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

function bestKey(mode: Mode, settings: Settings): string {
  // Best scores are tracked separately when Real Gym is on, since the difficulty differs.
  // Monochrome doesn't affect difficulty so it's not part of the key.
  return settings.realgym ? `${mode}:realgym` : mode
}

export function useGame() {
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const [state, setState] = useState<SessionState>(() => ({
    mode: 'quick',
    roundIndex: 0,
    round: null,
    phase: 'landing',
    score: 0,
    streak: 0,
    bestStreak: 0,
    history: [],
    roundStartedAt: 0,
    sessionStartedAt: 0,
    sessionElapsedMs: null,
    lastAnswer: null,
    timeRemaining: null,
  }))
  const [bests, setBests] = useState<Record<string, number>>(() => loadBest())

  const setSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState((s) => {
      const merged = { ...s, ...partial }
      saveSettings(merged)
      return merged
    })
  }, [])

  function buildRound(mode: Mode, roundIndex: number, prevTotal?: number) {
    const cfg = MODES[mode]
    const totalRounds = cfg.rounds === 'endless' ? 25 : cfg.rounds
    // Sprint samples tiers randomly each round so 5/2.5-using and fractional
    // weights can appear immediately, not only after a long ramp.
    const tier =
      mode === 'sprint'
        ? (([1, 2, 2, 2, 3, 3, 3, 4] as const)[Math.floor(Math.random() * 8)] as 1 | 2 | 3 | 4)
        : tierForRound(roundIndex, totalRounds, cfg.maxTier)
    // Avoid producing the same total two rounds in a row.
    for (let attempt = 0; attempt < 10; attempt++) {
      const round = settingsRef.current.realgym ? generateRealisticRound(tier) : generateRound(tier)
      if (prevTotal === undefined || round.total !== prevTotal) return round
    }
    // Couldn't find a different one in 10 tries (small target pool at the lowest tiers); take what we have.
    return settingsRef.current.realgym ? generateRealisticRound(tier) : generateRound(tier)
  }

  const start = useCallback((mode: Mode) => {
    const cfg = MODES[mode]
    const round = buildRound(mode, 0)
    const now = Date.now()
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
      roundStartedAt: now,
      sessionStartedAt: now,
      sessionElapsedMs: null,
      lastAnswer: null,
      timeRemaining: cfg.timeLimit ?? null,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const finalize = useCallback(
    (s: SessionState): SessionState => {
      const cfg = MODES[s.mode]
      const elapsed = Date.now() - s.sessionStartedAt
      const finished: SessionState = { ...s, phase: 'finished', sessionElapsedMs: elapsed }
      if (cfg.scoring === 'points' && s.mode === 'practice') return finished
      const key = bestKey(s.mode, settingsRef.current)
      const prev = bests[key] ?? 0
      if (s.score > prev) {
        const updated = { ...bests, [key]: s.score }
        saveBest(updated)
        setBests(updated)
      }
      return finished
    },
    [bests],
  )

  const answer = useCallback((value: number) => {
    setState((s) => {
      if (!s.round || s.phase !== 'playing') return s
      const cfg = MODES[s.mode]
      const correct = Math.abs(value - s.round.total) < 0.001
      const elapsedMs = Date.now() - s.roundStartedAt
      const nextStreak = correct ? s.streak + 1 : 0
      const mult = streakMultiplier(nextStreak)
      let earned: number
      let nextScore: number
      if (cfg.scoring === 'tally') {
        earned = correct ? 1 : -1
        nextScore = Math.max(0, s.score + earned)
      } else {
        earned = correct ? Math.round(basePoints(s.round.tier) * mult) : 0
        nextScore = s.score + earned
      }
      const entry: Answer = { round: s.round, given: value, correct, elapsedMs, scoreEarned: earned }
      return {
        ...s,
        phase: 'reveal',
        score: nextScore,
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
      const sessionOver = config.rounds !== 'endless' && nextIndex >= config.rounds
      if (sessionOver) return finalize(s)
      const round = buildRound(s.mode, nextIndex, s.round?.total)
      return {
        ...s,
        roundIndex: nextIndex,
        round,
        phase: 'playing',
        roundStartedAt: Date.now(),
        lastAnswer: null,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalize])

  const toLanding = useCallback(() => {
    setState((s) => ({ ...s, phase: 'landing' }))
  }, [])

  // Auto-advance after correct; for timed modes also auto-advance after wrong (shorter pause).
  useEffect(() => {
    if (state.phase !== 'reveal' || !state.lastAnswer) return
    const cfg = MODES[state.mode]
    const correct = state.lastAnswer.correct
    if (correct) {
      const id = setTimeout(() => next(), cfg.scoring === 'tally' ? 500 : 850)
      return () => clearTimeout(id)
    }
    if (cfg.scoring === 'tally') {
      // Wrong in Sprint mode: show the answer briefly then advance.
      const id = setTimeout(() => next(), 1300)
      return () => clearTimeout(id)
    }
  }, [state.phase, state.lastAnswer, state.mode, next])

  // Countdown timer for timed modes.
  useEffect(() => {
    const cfg = MODES[state.mode]
    if (!cfg.timeLimit) return
    if (state.phase !== 'playing' && state.phase !== 'reveal') return
    if (state.timeRemaining === null || state.timeRemaining <= 0) return
    const id = setInterval(() => {
      setState((s) => {
        if (s.timeRemaining === null) return s
        const t = s.timeRemaining - 1
        if (t <= 0) {
          // Time's up — go to post-session, saving best.
          return finalize({ ...s, timeRemaining: 0 })
        }
        return { ...s, timeRemaining: t }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state.mode, state.phase, state.timeRemaining, finalize])

  const accuracy = useMemo(() => {
    if (state.history.length === 0) return 0
    return state.history.filter((h) => h.correct).length / state.history.length
  }, [state.history])

  const avgTimeMs = useMemo(() => {
    const correct = state.history.filter((h) => h.correct)
    if (correct.length === 0) return 0
    return correct.reduce((s, h) => s + h.elapsedMs, 0) / correct.length
  }, [state.history])

  const currentBestKey = bestKey(state.mode, settings)

  return {
    state,
    bests,
    settings,
    setSettings,
    bestKey,
    currentBestKey,
    start,
    answer,
    next,
    toLanding,
    accuracy,
    avgTimeMs,
    multiplier: streakMultiplier(state.streak),
  }
}
