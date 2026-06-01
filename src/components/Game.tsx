import { useEffect } from 'react'
import { usePostHog } from '@posthog/react'
import { useGame } from '../game/state'
import { Landing } from './Landing'
import { PostSession } from './PostSession'
import { RoundScreen } from './RoundScreen'
import { primeAudio, setMuted } from '../game/sound'

export function Game() {
  const game = useGame()
  const { state, settings } = game
  const posthog = usePostHog()

  // Unlock audio on the first user gesture (required on mobile).
  useEffect(() => {
    primeAudio()
  }, [])

  // Keep the audio engine in sync with the sound setting.
  useEffect(() => {
    setMuted(!settings.soundOn)
  }, [settings.soundOn])

  // Tie PostHog events to the stable per-device playerId (the same id the
  // leaderboard uses) so analytics and scores line up, and keep the person's
  // display name in sync when they set or change it.
  useEffect(() => {
    if (!settings.playerId) return
    posthog.identify(settings.playerId, settings.playerName ? { name: settings.playerName } : undefined)
  }, [posthog, settings.playerId, settings.playerName])

  if (state.phase === 'landing' || !state.round) {
    return (
      <Landing
        onStart={game.start}
        bests={game.bests}
        settings={settings}
        setSettings={game.setSettings}
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
        settings={settings}
        setSettings={game.setSettings}
        onPlayAgain={() => game.start(state.mode)}
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
      onQuit={game.endNow}
    />
  )
}
