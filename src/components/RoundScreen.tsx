import { useEffect, useState } from 'react'
import { MODES, type SessionState } from '../game/state'
import { breakdown, formatTotal, type Round } from '../game/rounds'
import { Barbell } from './Barbell'
import { Confetti } from './Confetti'
import { MultipleChoice } from './MultipleChoice'
import { NumberPad } from './NumberPad'
import { correctChime, plateCascade, tinyTap, wrongBuzz } from '../game/sound'

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
  const round = state.round!
  const config = MODES[state.mode]
  const total = config.rounds === 'endless' ? '∞' : config.rounds
  const isTimed = config.scoring === 'tally'
  const [picked, setPicked] = useState<number | null>(null)

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
    onAnswer(round.choices[i])
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={onQuit} className="chip hover:scale-105 transition-transform" type="button">
          ← Quit
        </button>
        {isTimed ? (
          <TimerDisplay seconds={state.timeRemaining ?? 0} />
        ) : (
          <div className="chip">
            Round <span className="font-extrabold ml-1">{state.roundIndex + 1}</span>
            <span className="opacity-60">/ {total}</span>
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
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="w-full relative">
          <Barbell
            bar={round.bar}
            perSide={round.perSide}
            animKey={`${state.roundIndex}-${state.phase}`}
            hop={showingResult && wasCorrect}
            shake={showingResult && !wasCorrect}
            monochrome={monochrome}
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
            <NumberPad onSubmit={onAnswer} unit={round.unit} disabled={state.phase !== 'playing'} />
          )}
        </div>
      )}
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
