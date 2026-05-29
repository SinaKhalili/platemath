let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = muted ? 0 : 0.45
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(m: boolean) {
  muted = m
  if (masterGain) masterGain.gain.value = m ? 0 : 0.45
}

export function isMuted() {
  return muted
}

// Mobile browsers (iOS especially) create the AudioContext suspended and only
// allow resuming it from inside a user gesture. Bind a one-time unlock to the
// first interaction so later programmatic sounds (which fire from effects, not
// taps) actually play.
let primed = false
export function primeAudio() {
  if (primed || typeof window === 'undefined') return
  primed = true
  const unlock = () => {
    const c = ensure()
    if (c && c.state === 'suspended') void c.resume()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchend', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('touchend', unlock)
  window.addEventListener('keydown', unlock)
}

function envelope(
  freqs: number[],
  type: OscillatorType,
  durations: number[],
  gainCurve: number[],
  startGain = 0.3,
) {
  const c = ensure()
  if (!c || !masterGain) return
  const now = c.currentTime
  const osc = c.createOscillator()
  osc.type = type
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(startGain, now + 0.005)
  freqs.forEach((f, i) => {
    osc.frequency.setValueAtTime(f, now + (i === 0 ? 0 : sumTo(durations, i)))
  })
  gainCurve.forEach((gv, i) => {
    const t = now + sumTo(durations, i + 1)
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gv), t)
  })
  osc.connect(g)
  g.connect(masterGain)
  const total = durations.reduce((a, b) => a + b, 0)
  osc.start(now)
  osc.stop(now + total + 0.05)
}

function sumTo(arr: number[], i: number) {
  let s = 0
  for (let k = 0; k < i; k++) s += arr[k]
  return s
}

export function plateThud() {
  const c = ensure()
  if (!c || !masterGain) return
  const now = c.currentTime
  // Low body
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(140, now)
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.18)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.5, now + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  osc.connect(g).connect(masterGain)
  osc.start(now)
  osc.stop(now + 0.25)

  // High click
  const click = c.createOscillator()
  click.type = 'triangle'
  click.frequency.setValueAtTime(2200, now)
  click.frequency.exponentialRampToValueAtTime(800, now + 0.05)
  const cg = c.createGain()
  cg.gain.setValueAtTime(0.0001, now)
  cg.gain.exponentialRampToValueAtTime(0.18, now + 0.005)
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)
  click.connect(cg).connect(masterGain)
  click.start(now)
  click.stop(now + 0.08)
}

export function correctChime() {
  const c = ensure()
  if (!c || !masterGain) return
  // Local non-null alias so the narrowing survives inside closures below.
  const out = masterGain
  const now = c.currentTime

  // Layered major chord stinger (C-E-G-ish) with a fast attack.
  const chord = [523.25, 659.25, 783.99, 1046.5]
  chord.forEach((f, i) => {
    const osc = c.createOscillator()
    osc.type = i === 3 ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(f, now)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.22 / chord.length + 0.06, now + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
    osc.connect(g).connect(out)
    osc.start(now)
    osc.stop(now + 0.6)
  })

  // Quick upward swoop on top for that "tada" feeling.
  const swoop = c.createOscillator()
  swoop.type = 'triangle'
  swoop.frequency.setValueAtTime(880, now)
  swoop.frequency.exponentialRampToValueAtTime(2200, now + 0.18)
  const sg = c.createGain()
  sg.gain.setValueAtTime(0.0001, now)
  sg.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
  sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  swoop.connect(sg).connect(out)
  swoop.start(now)
  swoop.stop(now + 0.25)

  // Sub-bass thud that gives it weight, like a barbell hitting a pad.
  const sub = c.createOscillator()
  sub.type = 'sine'
  sub.frequency.setValueAtTime(140, now)
  sub.frequency.exponentialRampToValueAtTime(55, now + 0.18)
  const subG = c.createGain()
  subG.gain.setValueAtTime(0.0001, now)
  subG.gain.exponentialRampToValueAtTime(0.55, now + 0.005)
  subG.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  sub.connect(subG).connect(out)
  sub.start(now)
  sub.stop(now + 0.3)

  // Short noise burst for the snare-like crack.
  try {
    const buffer = c.createBuffer(1, c.sampleRate * 0.08, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.025))
    }
    const noise = c.createBufferSource()
    noise.buffer = buffer
    const ng = c.createGain()
    ng.gain.value = 0.14
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1200
    noise.connect(hp).connect(ng).connect(out)
    noise.start(now)
  } catch {
    /* AudioBuffer not supported, skip */
  }
}

export function wrongBuzz() {
  envelope([220, 165], 'sawtooth', [0.1, 0.2], [0.2, 0.0001], 0.18)
}

export function tinyTap() {
  const c = ensure()
  if (!c || !masterGain) return
  const now = c.currentTime
  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.12, now + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
  osc.connect(g).connect(masterGain)
  osc.start(now)
  osc.stop(now + 0.08)
}

export function plateCascade(count: number) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => plateThud(), i * 70)
  }
}
