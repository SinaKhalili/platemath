import { useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import type { SessionState, Settings } from '../game/state'
import { MODES } from '../game/state'
import { api } from '../../convex/_generated/api'
import { formatElapsed } from './RoundScreen'

type Props = {
  state: SessionState
  accuracy: number
  avgTimeMs: number
  settings: Settings
  setSettings: (partial: Partial<Settings>) => void
  onPlayAgain: () => void
  onPractice: () => void
  onHome: () => void
  isNewBest: boolean
}

export function PostSession({
  state,
  accuracy,
  avgTimeMs,
  settings,
  setSettings,
  onPlayAgain,
  onPractice,
  onHome,
  isNewBest,
}: Props) {
  const cfg = MODES[state.mode]
  const isRanked = state.mode === 'sprint' || state.mode === 'challenge'
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="card p-8 md:p-10 max-w-lg w-full text-center">
        {isNewBest && (
          <div className="chip mb-4 mx-auto" style={{ background: '#FFE9C7', color: '#9A5A1A' }}>
            <span>🏆</span>
            <span>New personal best</span>
          </div>
        )}
        <h2 className="fancy-headline text-3xl mb-1">Rack it up</h2>
        <p className="text-ink-700/70 mb-6">
          {cfg.label} · {state.history.length} rounds
        </p>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <Stat label="Score" value={String(state.score)} />
          <Stat label="Accuracy" value={`${Math.round(accuracy * 100)}%`} />
          <Stat
            label="Time"
            value={state.sessionElapsedMs != null ? formatElapsed(state.sessionElapsedMs) : '—'}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Avg / round" value={avgTimeMs ? `${(avgTimeMs / 1000).toFixed(1)}s` : '—'} />
          <Stat label="Best streak" value={String(state.bestStreak)} />
          <Stat
            label="Top tier"
            value={String(state.history.reduce((m, h) => Math.max(m, h.round.tier), 1))}
          />
        </div>

        {isRanked && (
          <LeaderboardSubmit
            state={state}
            settings={settings}
            setSettings={setSettings}
            accuracy={accuracy}
          />
        )}

        <div className="grid gap-3">
          <button onClick={onPlayAgain} className="btn-chunky" type="button">
            Play Again
          </button>
          <button onClick={onPractice} className="btn-chunky btn-chunky--ghost" type="button">
            Try Practice
          </button>
          <button onClick={onHome} className="btn-chunky btn-chunky--ghost" type="button">
            Home
          </button>
        </div>
      </div>
    </div>
  )
}

type SubmitStatus = 'idle' | 'submitting' | 'submitted' | 'error'

function LeaderboardSubmit({
  state,
  settings,
  setSettings,
  accuracy,
}: {
  state: SessionState
  settings: Settings
  setSettings: (partial: Partial<Settings>) => void
  accuracy: number
}) {
  const submit = useMutation(api.scores.submit)
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [draftName, setDraftName] = useState('')
  const didSubmitRef = useRef(false)

  // Auto-submit once when a name already exists.
  useEffect(() => {
    if (didSubmitRef.current) return
    if (!settings.playerName.trim()) return
    if (state.mode !== 'sprint' && state.mode !== 'challenge') return
    didSubmitRef.current = true
    setStatus('submitting')
    submit({
      mode: state.mode,
      realgym: settings.realgym,
      score: state.score,
      accuracy,
      elapsedMs: state.sessionElapsedMs ?? 0,
      name: settings.playerName,
      rounds: state.history.length,
      bestStreak: state.bestStreak,
    })
      .then(() => setStatus('submitted'))
      .catch(() => setStatus('error'))
  }, [submit, settings.playerName, settings.realgym, state, accuracy])

  if (settings.playerName.trim().length === 0) {
    return (
      <form
        className="mb-6 rounded-2xl bg-white/60 p-4 border-2 border-peach-300/40"
        onSubmit={(e) => {
          e.preventDefault()
          const cleaned = draftName.trim().slice(0, 20)
          if (cleaned.length === 0) return
          setSettings({ playerName: cleaned })
          // The effect above will pick up the new name and submit.
        }}
      >
        <div className="fancy-headline text-lg mb-1">Save to the leaderboard?</div>
        <p className="text-sm text-ink-700/70 mb-3">Pick a name — used for global high scores.</p>
        <div className="flex gap-2">
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            className="leaderboard-name-input flex-1"
            type="text"
          />
          <button type="submit" className="btn-chunky btn-chunky--mint" disabled={draftName.trim().length === 0}>
            Save
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mb-6 flex items-center justify-center gap-2 text-sm text-ink-700/80">
      {status === 'submitting' && <span>Sending to leaderboard…</span>}
      {status === 'submitted' && (
        <>
          <span>✓ Saved as</span>
          <span className="font-extrabold text-ink-800">{settings.playerName}</span>
        </>
      )}
      {status === 'error' && <span className="text-rose-400">Couldn't reach the leaderboard.</span>}
      {status === 'idle' && <span>Waiting…</span>}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-3 shadow-[0_2px_0_rgba(180,130,70,0.18)]">
      <div className="text-sm uppercase tracking-wide text-ink-700/70 font-semibold">{label}</div>
      <div className="fancy-headline text-2xl text-ink-800">{value}</div>
    </div>
  )
}
