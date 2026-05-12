import { BARS, plate, type Bar, type Plate, type Unit } from './plates'

export type Round = {
  bar: Bar
  perSide: Plate[]
  total: number
  unit: Unit
  tier: 1 | 2 | 3 | 4
  choices: number[]
  correctIndex: number
}

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildPerSide(unit: Unit, sizes: number[], counts: number[]): Plate[] {
  const out: Plate[] = []
  sizes.forEach((s, i) => {
    for (let k = 0; k < counts[i]; k++) out.push(plate(s, unit))
  })
  // Sort largest first (how plates are loaded on the bar).
  return out.sort((a, b) => b.weight - a.weight)
}

function totalFor(bar: Bar, perSide: Plate[]): number {
  const sum = perSide.reduce((s, p) => s + p.weight, 0) * 2 + bar.weight
  return Math.round(sum * 100) / 100
}

function pretty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function buildChoices(total: number, unit: Unit, tier: 1 | 2 | 3 | 4): { choices: number[]; correctIndex: number } {
  const fractional = tier >= 3 && !Number.isInteger(total)
  const step = unit === 'kg' ? (fractional ? 2.5 : 5) : (fractional ? 5 : 10)
  const set = new Set<number>([total])
  const offsets = [step, -step, step * 2, -step * 2, step * 3]
  let i = 0
  while (set.size < 4 && i < offsets.length) {
    const candidate = Math.round((total + offsets[i]) * 100) / 100
    if (candidate > 0) set.add(candidate)
    i++
  }
  while (set.size < 4) {
    const jitter = randInt(1, 4) * step * (Math.random() < 0.5 ? 1 : -1)
    const candidate = Math.round((total + jitter) * 100) / 100
    if (candidate > 0) set.add(candidate)
  }
  const choices = Array.from(set).sort(() => Math.random() - 0.5)
  return { choices, correctIndex: choices.indexOf(total) }
}

function tier1(): Pick<Round, 'bar' | 'perSide' | 'unit' | 'tier'> {
  const bar = BARS['lb-45']
  const size = rand([45, 35, 25])
  const count = randInt(1, size === 45 ? 4 : 3)
  return { bar, perSide: buildPerSide('lb', [size], [count]), unit: 'lb', tier: 1 }
}

function tier2(): Pick<Round, 'bar' | 'perSide' | 'unit' | 'tier'> {
  const bar = BARS['lb-45']
  // Two whole-number plate sizes per side.
  const big = rand([45, 35, 25])
  const small = rand([25, 10, 5].filter((x) => x < big))
  const bigCount = randInt(1, big === 45 ? 3 : 2)
  const smallCount = randInt(1, 2)
  return {
    bar,
    perSide: buildPerSide('lb', [big, small], [bigCount, smallCount]),
    unit: 'lb',
    tier: 2,
  }
}

function tier3(): Pick<Round, 'bar' | 'perSide' | 'unit' | 'tier'> {
  const bar = rand([BARS['lb-45'], BARS['lb-35'], BARS['lb-25'], BARS['lb-15']])
  const big = rand([45, 35, 25])
  const mid = rand([10, 5])
  const tiny = rand([2.5, 1.25])
  return {
    bar,
    perSide: buildPerSide('lb', [big, mid, tiny], [randInt(1, 2), randInt(0, 2), randInt(1, 2)]),
    unit: 'lb',
    tier: 3,
  }
}

function tier4(): Pick<Round, 'bar' | 'perSide' | 'unit' | 'tier'> {
  if (Math.random() < 0.5) {
    const bar = rand([BARS['kg-20'], BARS['kg-15'], BARS['kg-10']])
    const big = rand([25, 20, 15])
    const mid = rand([10, 5])
    const tiny = rand([2.5, 1.25])
    return {
      bar,
      perSide: buildPerSide('kg', [big, mid, tiny], [randInt(1, 2), randInt(0, 2), randInt(0, 1)]),
      unit: 'kg',
      tier: 4,
    }
  }
  // Mixed lb at maximum complexity.
  const bar = BARS['lb-45']
  return {
    bar,
    perSide: buildPerSide('lb', [25, 10, 5], [1, 1, 1]),
    unit: 'lb',
    tier: 4,
  }
}

function tierBuilder(tier: 1 | 2 | 3 | 4) {
  return [tier1, tier2, tier3, tier4][tier - 1]
}

export function tierForRound(roundIndex: number, totalRounds: number, maxTier: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  // Map round 0..n-1 to tiers 1..maxTier, weighted toward higher tiers later.
  const t = Math.min(maxTier, 1 + Math.floor((roundIndex / totalRounds) * maxTier)) as 1 | 2 | 3 | 4
  return t
}

export function generateRound(tier: 1 | 2 | 3 | 4): Round {
  // Retry a few times to avoid degenerate (zero-plate) loadouts.
  for (let attempt = 0; attempt < 8; attempt++) {
    const built = tierBuilder(tier)()
    if (built.perSide.length === 0) continue
    const total = totalFor(built.bar, built.perSide)
    if (total <= built.bar.weight) continue
    const { choices, correctIndex } = buildChoices(total, built.unit, tier)
    return { ...built, total, choices, correctIndex }
  }
  // Fallback that always works.
  const bar = BARS['lb-45']
  const perSide = buildPerSide('lb', [45], [1])
  const total = totalFor(bar, perSide)
  const { choices, correctIndex } = buildChoices(total, 'lb', 1)
  return { bar, perSide, total, choices, correctIndex, unit: 'lb', tier: 1 }
}

export function formatTotal(n: number, unit: Unit): string {
  return `${pretty(n)} ${unit}`
}

export function breakdown(round: Round): string {
  const groups = new Map<number, number>()
  round.perSide.forEach((p) => groups.set(p.weight, (groups.get(p.weight) || 0) + 1))
  const parts = Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([w, count]) => `${count * 2}×${pretty(w)}`)
  const lhs = [`${pretty(round.bar.weight)} bar`, ...parts].join(' + ')
  return `${lhs} = ${pretty(round.total)} ${round.unit}`
}
