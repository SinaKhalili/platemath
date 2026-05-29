import { useEffect, useState } from 'react'
import { usePostHog } from '@posthog/react'
import { MODES, type SessionState } from '../game/state'
import { breakdown, formatTotal, type Round } from '../game/rounds'
import { Barbell } from './Barbell'
import { Confetti } from './Confetti'
import { MultipleChoice } from './MultipleChoice'
import { NumberPad } from './NumberPad'
import { correctChime, plateCascade, tinyTap, wrongBuzz } from '../game/sound'
import { useIsMobile } from '../hooks/useIsMobile'

type Props = {
  state: SessionState
  multiplier: number
  monochrome: boolean
  inputMode: 'choice' | 'numpad'
  onAnswer: (value: number) => void
  onNext: () => void
  onQuit: () => void
}

export function RoundScreen({ state, multiplier, monochrome, inputMode, onAnswer, onNext, onQuit }: Props) {
  const posthog = usePostHog()
  const isMobile = useIsMobile()
  const round = state.round!
  const config = MODES[state.mode]
  const total = config.rounds === 'endless' ? '∞' : config.rounds
  const isTimed = config.scoring === 'tally'
  const [picked, setPicked] = useState<number | null>(null)

  function handleAnswer(value: number) {
    const correct = Math.abs(value - round.total) < 0.001
    posthog.capture('round_answered', {
      mode: state.mode,
      tier: round.tier,
      correct,
      elapsed_ms: Date.now() - state.roundStartedAt,
      round_index: state.roundIndex,
    })
    onAnswer(value)
  }

  function handleQuit() {
    posthog.capture('session_quit', {
      mode: state.mode,
      score: state.score,
      round_index: state.roundIndex,
    })
    onQuit()
  }

  // Reset multiple-choice pick state when the round itself changes.
  // Intentionally NOT depending on phase — the correct/wrong flash on the
  // chosen card needs `picked` to persist into the reveal phase.
  useEffect(() => {
    setPicked(null)
  }, [state.roundIndex])

  // Play plate-drop sound when the round mounts.
  useEffect(() => {
    if (state.phase === 'playing' && round) {
      tinyTap()
      plateCascade(round.perSide.length)
    }
  }, [state.roundIndex, state.phase, round])

  // Play the result sound when revealed.
  useEffect(() => {
    if (state.phase === 'reveal' && state.lastAnswer) {
      if (state.lastAnswer.correct) correctChime()
      else wrongBuzz()
    }
  }, [state.phase, state.lastAnswer])

  const showingResult = state.phase === 'reveal'
  const wasCorrect = state.lastAnswer?.correct ?? false

  function handlePick(i: number) {
    if (state.phase !== 'playing') return
    setPicked(i)
    handleAnswer(round.choices[i])
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={handleQuit} className="chip hover:scale-105 transition-transform" type="button">
          ← Quit
        </button>
        {isTimed ? (
          <TimerDisplay seconds={state.timeRemaining ?? 0} />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="chip">
              Round <span className="font-extrabold ml-1">{state.roundIndex + 1}</span>
              <span className="opacity-60">/ {total}</span>
            </div>
            {state.mode !== 'practice' && (
              <ElapsedClock startedAt={state.sessionStartedAt} frozenMs={state.sessionElapsedMs} />
            )}
          </div>
        )}
        <div className="chip">
          <span>★</span>
          <span className="font-extrabold">{state.score}</span>
        </div>
      </div>

      {/* Tier + streak */}
      <div className="flex items-center justify-between mb-3">
        <span className="chip">Tier {round.tier} · {round.unit.toUpperCase()}</span>
        {state.streak >= 3 && (
          <span className="chip">
            <span className="streak-flame">🔥</span>
            <span>streak {state.streak}</span>
            <span className="opacity-60">×{multiplier.toFixed(2).replace(/\.?0+$/, '')}</span>
          </span>
        )}
      </div>

      {/* Barbell */}
      <div className="round-stage flex-1 flex items-center justify-center py-4">
        <div className="w-full relative">
          <Barbell
            bar={round.bar}
            perSide={round.perSide}
            // Key only on the round index so the plate drop-in plays once per
            // new round. The reveal (phase change) must NOT remount the group,
            // or the plates would re-drop right before hopping — keep the
            // celebratory hop / shake as the only reveal animation.
            animKey={state.roundIndex}
            hop={showingResult && wasCorrect}
            shake={showingResult && !wasCorrect}
            monochrome={monochrome}
            compact={isMobile}
          />
          {showingResult && wasCorrect && (
            <>
              <Confetti triggerKey={state.roundIndex} />
              <div className="score-pop">
                +{state.lastAnswer?.scoreEarned}
                {multiplier > 1 ? (
                  <span className="ml-2 text-2xl text-peach-400 align-middle">
                    ×{multiplier.toFixed(2).replace(/\.?0+$/, '')}
                  </span>
                ) : null}
              </div>
            </>
          )}
          {showingResult && !wasCorrect && isTimed && (
            <div className="score-pop score-pop--neg">−1</div>
          )}
        </div>
      </div>

      {/* Result overlay */}
      {showingResult && !wasCorrect && !isTimed ? (
        <WrongCard round={round} given={state.lastAnswer?.given ?? 0} onContinue={onNext} />
      ) : showingResult && !wasCorrect && isTimed ? (
        <TimedWrongStrip round={round} />
      ) : (
        <div className="mt-2">
          {inputMode === 'choice' ? (
            <MultipleChoice
              choices={round.choices}
              correctIndex={round.correctIndex}
              picked={picked}
              unit={round.unit}
              onPick={handlePick}
              disabled={state.phase !== 'playing'}
            />
          ) : (
            <NumberPad
              onSubmit={handleAnswer}
              unit={round.unit}
              disabled={state.phase !== 'playing'}
              focusKey={state.roundIndex}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function ElapsedClock({ startedAt, frozenMs }: { startedAt: number; frozenMs: number | null }) {
  const [, force] = useState(0)
  useEffect(() => {
    if (frozenMs !== null) return
    const id = setInterval(() => force((x) => (x + 1) % 1_000_000), 1000)
    return () => clearInterval(id)
  }, [frozenMs])
  const ms = frozenMs !== null ? frozenMs : Date.now() - startedAt
  return (
    <div className="chip" style={{ fontVariantNumeric: 'tabular-nums' }}>
      <span>⏱</span>
      <span className="font-extrabold">{formatElapsed(ms)}</span>
    </div>
  )
}

function TimerDisplay({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const urgent = seconds <= 10
  return (
    <div className={`timer-display ${urgent ? 'timer-display--urgent' : ''}`}>
      {m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`}
    </div>
  )
}

function TimedWrongStrip({ round }: { round: Round }) {
  return (
    <div className="card p-4 mt-2 mx-auto max-w-md w-full text-center">
      <div className="text-sm text-rose-400 font-bold mb-1">Not quite</div>
      <div className="fancy-headline text-2xl text-mint-500">{formatTotal(round.total, round.unit)}</div>
    </div>
  )
}

function WrongCard({ round, given, onContinue }: { round: Round; given: number; onContinue: () => void }) {
  return (
    <div className="card p-6 mt-3 mx-auto max-w-xl w-full">
      <div className="text-center">
        <div className="chip mb-3" style={{ background: '#FBE3DF', color: '#9C3A33' }}>
          Not quite
        </div>
        <div className="text-2xl mb-1">
          You said <span className="font-extrabold">{given}</span>
        </div>
        <div className="fancy-headline text-3xl text-mint-500">
          {formatTotal(round.total, round.unit)}
        </div>
        <div className="mt-3 text-ink-700/80 font-mono">{breakdown(round)}</div>
        <button onClick={onContinue} className="btn-chunky btn-chunky--mint mt-5" type="button">
          Got it
        </button>
      </div>
    </div>
  )
}
