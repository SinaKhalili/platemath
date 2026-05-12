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
    masterGain.gain.value = 0.45
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
  envelope([660, 880, 1320], 'triangle', [0.08, 0.08, 0.18], [0.35, 0.35, 0.0001])
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
