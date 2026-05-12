import { useEffect, useState } from 'react'
import { MODES, type SessionState } from '../game/state'
import { breakdown, formatTotal, type Round } from '../game/rounds'
import { Barbell } from './Barbell'
import { MultipleChoice } from './MultipleChoice'
import { NumberPad } from './NumberPad'
import { correctChime, plateCascade, tinyTap, wrongBuzz } from '../game/sound'

type Props = {
  state: SessionState
  multiplier: number
  onAnswer: (value: number) => void
  onNext: () => void
  onQuit: () => void
  onToggleInput: (mode: 'choice' | 'numpad') => void
}

export function RoundScreen({ state, multiplier, onAnswer, onNext, onQuit, onToggleInput }: Props) {
  const round = state.round!
  const config = MODES[state.mode]
  const total = config.rounds === 'endless' ? '∞' : config.rounds
  const [picked, setPicked] = useState<number | null>(null)

  // Reset multiple-choice pick state when round changes.
  useEffect(() => {
    setPicked(null)
  }, [state.roundIndex, state.phase])

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
        <div className="chip">
          Round <span className="font-extrabold ml-1">{state.roundIndex + 1}</span>
          <span className="opacity-60">/ {total}</span>
        </div>
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
        <div className="w-full">
          <Barbell
            bar={round.bar}
            perSide={round.perSide}
            animKey={`${state.roundIndex}-${state.phase}`}
            hop={showingResult && wasCorrect}
            shake={showingResult && !wasCorrect}
          />
        </div>
      </div>

      {/* Result overlay */}
      {showingResult && !wasCorrect ? (
        <WrongCard round={round} given={state.lastAnswer?.given ?? 0} onContinue={onNext} />
      ) : (
        <div className="mt-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => onToggleInput('choice')}
              className={`chip ${state.inputMode === 'choice' ? 'bg-white shadow-sm' : 'opacity-50'}`}
              type="button"
            >
              Tap
            </button>
            <button
              onClick={() => onToggleInput('numpad')}
              className={`chip ${state.inputMode === 'numpad' ? 'bg-white shadow-sm' : 'opacity-50'}`}
              type="button"
            >
              Type
            </button>
          </div>
          {state.inputMode === 'choice' ? (
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
