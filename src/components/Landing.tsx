import { useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { MODES, type Mode, type Settings } from '../game/state'
import { Barbell } from './Barbell'
import { BARS, plate } from '../game/plates'
import { Leaderboard } from './Leaderboard'
import { api } from '../../convex/_generated/api'
import { useIsMobile } from '../hooks/useIsMobile'

type Props = {
  onStart: (mode: Mode) => void
  bests: Record<string, number>
  settings: Settings
  setSettings: (partial: Partial<Settings>) => void
}

const MODE_ORDER: Mode[] = ['sprint', 'challenge', 'practice']

const MODE_STYLES: Record<Mode, string> = {
  sprint: 'btn-chunky btn-chunky--rose',
  challenge: 'btn-chunky btn-chunky--mint',
  practice: 'btn-chunky btn-chunky--ghost',
}

export function Landing({ onStart, bests, settings, setSettings }: Props) {
  const heroPlates = [plate(45, 'lb'), plate(25, 'lb')]
  const [optionsOpen, setOptionsOpen] = useState(false)
  const lifterClicks = useRef(0)
  const isMobile = useIsMobile()

  function onLifterClick() {
    lifterClicks.current += 1
    if (lifterClicks.current >= 5) {
      lifterClicks.current = 0
      setSettings({ devMode: !settings.devMode })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-2">
          <span className="chip">
            <button type="button" className="lifter-secret" onClick={onLifterClick} aria-label="Plate Math">
              🏋️‍♀️
            </button>
            <span>Mental gym math, made fun</span>
            {settings.devMode && <span className="dev-badge">DEV · 5s sprint</span>}
          </span>
        </div>
        <h1 className="fancy-headline text-6xl md:text-7xl text-center mt-3 text-ink-800">
          Plate <span className="text-peach-400">Math</span>
        </h1>
        <p className="text-center text-lg mt-3 max-w-xl mx-auto text-ink-700/80">
          What's on the bar? Tap the right total before your spotter loses count.
        </p>

        <div className="mt-8 mb-4 select-none pointer-events-none">
          <Barbell
            bar={BARS['lb-45']}
            perSide={heroPlates}
            animKey="hero"
            monochrome={settings.monochrome}
            compact={isMobile}
          />
        </div>

        <div className="card p-6 md:p-8 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {MODE_ORDER.map((m) => (
              <button
                key={m}
                onClick={() => onStart(m)}
                className={`${MODE_STYLES[m]} text-left flex-col py-6`}
                style={{ alignItems: 'flex-start' }}
                type="button"
              >
                <div className="text-2xl">{MODES[m].label}</div>
                <div className="text-sm font-medium opacity-90 mt-1">{MODES[m].blurb}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setOptionsOpen((v) => !v)}
              className="chip options-toggle"
              aria-expanded={optionsOpen}
            >
              <span>⚙</span>
              <span>Options</span>
              <span className={`options-chevron ${optionsOpen ? 'options-chevron--open' : ''}`} aria-hidden>
                ▾
              </span>
            </button>
          </div>
          {optionsOpen && (
            <div className="options-panel mt-4 grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <NameEditor
                  name={settings.playerName}
                  playerId={settings.playerId}
                  onSave={(name) => setSettings({ playerName: name })}
                />
              </div>
              <Toggle
                label="Multiple choice"
                hint="On = tap an option. Off = type the answer."
                checked={settings.inputMode === 'choice'}
                onChange={(v) => setSettings({ inputMode: v ? 'choice' : 'numpad' })}
              />
              <Toggle
                label="Colored plates"
                hint="Off = uniform gray, no Olympic colors"
                checked={!settings.monochrome}
                onChange={(v) => setSettings({ monochrome: !v })}
              />
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-center">
            {(['sprint', 'challenge'] as Mode[]).map((m) => {
              const score = bests[m] ?? null
              return (
                <div key={m} className="chip">
                  <span>Your best {MODES[m].label}:</span>
                  <span className="font-extrabold text-ink-800">{score ?? '—'}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Leaderboard mode="sprint" title="Top Sprint" playerId={settings.playerId} />
          <Leaderboard mode="challenge" title="Top Challenge" playerId={settings.playerId} />
        </div>

        <p className="text-center text-sm mt-8 text-ink-700/60">
          The colors match real Olympic plates. Bar weight counts. Sound on for the full ride.
        </p>
      </div>
    </div>
  )
}

type NameEditorProps = {
  name: string
  playerId: string
  onSave: (name: string) => void
}

function NameEditor({ name, playerId, onSave }: NameEditorProps) {
  const rename = useMutation(api.scores.rename)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  function commit() {
    const cleaned = draft.trim().slice(0, 20)
    setEditing(false)
    if (cleaned.length === 0 || cleaned === name) return
    onSave(cleaned)
    // Update the player's existing leaderboard rows so the rename is retroactive.
    void rename({ playerId, name: cleaned })
  }

  if (!editing) {
    return (
      <div className="name-editor">
        <div className="name-editor__text">
          <div className="toggle__label">Leaderboard name</div>
          <div className="toggle__hint">
            {name.trim().length > 0 ? (
              <>
                You appear as <span className="font-extrabold text-ink-800">{name}</span>
              </>
            ) : (
              'Not set yet — pick one after your first game, or here.'
            )}
          </div>
        </div>
        <button
          type="button"
          className="btn-chunky btn-chunky--ghost name-editor__btn"
          onClick={() => {
            setDraft(name)
            setEditing(true)
          }}
        >
          {name.trim().length > 0 ? 'Change' : 'Set name'}
        </button>
      </div>
    )
  }

  return (
    <form
      className="name-editor"
      onSubmit={(e) => {
        e.preventDefault()
        commit()
      }}
    >
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Your name"
        maxLength={20}
        className="leaderboard-name-input flex-1"
        type="text"
        onBlur={commit}
      />
      <button type="submit" className="btn-chunky btn-chunky--mint name-editor__btn">
        Save
      </button>
    </form>
  )
}

type ToggleProps = {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`toggle ${checked ? 'toggle--on' : ''}`}
      aria-pressed={checked}
    >
      <div className="toggle__text">
        <div className="toggle__label">{label}</div>
        {hint ? <div className="toggle__hint">{hint}</div> : null}
      </div>
      <div className="toggle__switch">
        <div className="toggle__knob" />
      </div>
    </button>
  )
}
