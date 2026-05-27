import { useGame } from '../game/state'
import { Landing } from './Landing'
import { PostSession } from './PostSession'
import { RoundScreen } from './RoundScreen'

export function Game() {
  const game = useGame()
  const { state, settings } = game

  if (state.phase === 'landing' || !state.round) {
    return (
      <Landing
        onStart={game.start}
        bests={game.bests}
        settings={settings}
        setSettings={game.setSettings}
        bestKeyFor={game.bestKey}
      />
    )
  }

  if (state.phase === 'finished') {
    const isNewBest = (game.bests[game.currentBestKey] ?? 0) <= state.score && state.score > 0
    return (
      <PostSession
        state={state}
        accuracy={game.accuracy}
        avgTimeMs={game.avgTimeMs}
        onPlayAgain={() => game.start(state.mode)}
        onPractice={() => game.start('practice')}
        onHome={game.toLanding}
        isNewBest={isNewBest}
      />
    )
  }

  return (
    <RoundScreen
      state={state}
      multiplier={game.multiplier}
      monochrome={settings.monochrome}
      inputMode={settings.inputMode}
      onAnswer={game.answer}
      onNext={game.next}
      onQuit={game.toLanding}
    />
  )
}
