import { MODES, type Mode } from '../game/state'
import { Barbell } from './Barbell'
import { BARS, plate } from '../game/plates'

type Props = {
  onStart: (mode: Mode) => void
  bests: Record<string, number>
}

export function Landing({ onStart, bests }: Props) {
  // A decorative loaded bar for the hero, totaling 225 lb.
  const heroPlates = [plate(45, 'lb'), plate(25, 'lb')]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-2">
          <span className="chip">🏋️‍♀️ Mental gym math, made fun</span>
        </div>
        <h1 className="fancy-headline text-6xl md:text-7xl text-center mt-3 text-ink-800">
          Plate <span className="text-peach-400">Math</span>
        </h1>
        <p className="text-center text-lg mt-3 max-w-xl mx-auto text-ink-700/80">
          What's on the bar? Tap the right total before your spotter loses count.
        </p>

        <div className="mt-8 mb-4 select-none pointer-events-none">
          <Barbell bar={BARS['lb-45']} perSide={heroPlates} animKey="hero" />
        </div>

        <div className="card p-6 md:p-8 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => onStart('quick')}
              className="btn-chunky text-left flex-col items-start py-6"
              style={{ alignItems: 'flex-start' }}
            >
              <div className="text-2xl">Quick Play</div>
              <div className="text-sm font-medium opacity-90 mt-1">10 rounds · tiers 1–2</div>
            </button>
            <button
              onClick={() => onStart('standard')}
              className="btn-chunky btn-chunky--mint text-left flex-col py-6"
              style={{ alignItems: 'flex-start' }}
            >
              <div className="text-2xl">Standard</div>
              <div className="text-sm font-medium opacity-90 mt-1">25 rounds · tiers 1–4</div>
            </button>
            <button
              onClick={() => onStart('practice')}
              className="btn-chunky btn-chunky--ghost text-left flex-col py-6"
              style={{ alignItems: 'flex-start' }}
            >
              <div className="text-2xl">Practice</div>
              <div className="text-sm font-medium opacity-90 mt-1">Endless · no pressure</div>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {(['quick', 'standard'] as Mode[]).map((m) => (
              <div key={m} className="chip mx-auto">
                <span>Best {MODES[m].label}:</span>
                <span className="font-extrabold text-ink-800">{bests[m] ?? '—'}</span>
              </div>
            ))}
            <div className="chip mx-auto">
              <span>🎨 Suika-style</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm mt-8 text-ink-700/60">
          The colors match real Olympic plates. Bar weight counts. Sound on for the full ride.
        </p>
      </div>
    </div>
  )
}
