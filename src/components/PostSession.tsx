import type { SessionState } from '../game/state'
import { MODES } from '../game/state'
import { formatElapsed } from './RoundScreen'

type Props = {
  state: SessionState
  accuracy: number
  avgTimeMs: number
  onPlayAgain: () => void
  onPractice: () => void
  onHome: () => void
  isNewBest: boolean
}

export function PostSession({ state, accuracy, avgTimeMs, onPlayAgain, onPractice, onHome, isNewBest }: Props) {
  const cfg = MODES[state.mode]
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
        <p className="text-ink-700/70 mb-6">{cfg.label} · {state.history.length} rounds</p>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 px-3 py-3 shadow-[0_2px_0_rgba(180,130,70,0.18)]">
      <div className="text-sm uppercase tracking-wide text-ink-700/70 font-semibold">{label}</div>
      <div className="fancy-headline text-2xl text-ink-800">{value}</div>
    </div>
  )
}
