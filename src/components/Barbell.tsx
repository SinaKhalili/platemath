import type { Bar, Plate } from '../game/plates'

type Props = {
  bar: Bar
  perSide: Plate[]
  /** Change this to retrigger the drop-in animation (e.g., round index). */
  animKey: string | number
  /** When set, plays the celebratory hop. */
  hop?: boolean
  /** When set, plays a sad wobble. */
  shake?: boolean
  /** Render every plate in the same gray (no Olympic colors). */
  monochrome?: boolean
}

const MONO_PALETTE = {
  color: '#CFCAB8',
  ring: '#6F6957',
}

// Layout constants in SVG user units.
const VBW = 920
const VBH = 320
const CENTER_Y = 175

// Bar geometry — outer to inner on the left half.
const END_CAP_X = 60
const END_CAP_LEN = 26
const END_CAP_HEIGHT = 38
const SLEEVE_X = END_CAP_X + END_CAP_LEN - 6 // overlap end cap slightly so they read as one piece
const SLEEVE_HEIGHT = 26
const BUSHING_W = 20
const BUSHING_HEIGHT = 48
const SHAFT_HALF = 95
const SHAFT_HEIGHT = 14

const SHAFT_LEFT_X = VBW / 2 - SHAFT_HALF
const SHAFT_RIGHT_X = VBW / 2 + SHAFT_HALF
const BUSHING_LEFT_X = SHAFT_LEFT_X - BUSHING_W
const BUSHING_RIGHT_X = SHAFT_RIGHT_X
const SLEEVE_LEN = BUSHING_LEFT_X - SLEEVE_X

// Plate stack starts at the outer edge of the bushing and moves outward.
const PLATE_INNER_EDGE_LEFT = BUSHING_LEFT_X
const PLATE_INNER_EDGE_RIGHT = BUSHING_RIGHT_X + BUSHING_W

// Plate size envelope.
const MAX_PLATE_HEIGHT = 240
const MAX_PLATE_THICKNESS = 44
const MIN_PLATE_THICKNESS = 14
const PLATE_GAP = 5

// Colors — warm-tinted metallics that complement the cream background.
const C = {
  endCap: '#3F3A30',
  endCapHighlight: '#6F6759',
  sleeve: '#E2DCC9',
  sleeveBand: '#BFB7A1',
  bushing: '#3F3A30',
  bushingHighlight: '#6F6759',
  shaft: '#CFC6AE',
  knurl: '#6F6759',
}

export function Barbell({ bar, perSide, animKey, hop, shake, monochrome }: Props) {
  // Plates are pre-sorted largest first. Stack them outward from the bushing.
  const renderPlates: Plate[] = monochrome
    ? perSide.map((p) => ({ ...p, color: MONO_PALETTE.color, ring: MONO_PALETTE.ring }))
    : perSide
  const plateGeom = renderPlates.map((p) => ({
    plate: p,
    width: MIN_PLATE_THICKNESS + (MAX_PLATE_THICKNESS - MIN_PLATE_THICKNESS) * p.thickness,
    height: MAX_PLATE_HEIGHT * p.diameter,
  }))

  let runningOffset = 0
  const placed = plateGeom.map((pg) => {
    const offset = runningOffset
    runningOffset += pg.width + PLATE_GAP
    return { ...pg, offset }
  })

  // Knurling pattern across the center grip.
  const knurlCols = 22
  const knurlGap = (SHAFT_HALF * 2 - 16) / (knurlCols - 1)

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      className={`barbell ${hop ? 'barbell--hop' : ''} ${shake ? 'barbell--shake' : ''}`}
      aria-label={`Barbell loaded with ${perSide.length * 2} plates`}
      role="img"
    >
      <defs>
        <filter id="plate-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodOpacity="0.18" />
        </filter>
        <filter id="bar-shadow" x="-5%" y="-30%" width="110%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.16" />
        </filter>
        <linearGradient id="sleeve-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="shaft-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        {renderPlates
          .map((p) => p.color)
          .filter((c, i, arr) => arr.indexOf(c) === i)
          .map((c) => (
            <linearGradient key={c} id={`plate-grad-${c.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
            </linearGradient>
          ))}
      </defs>

      <g key={animKey} className="barbell__group">
        {/* === Bar, drawn before plates so plates can mask it === */}
        <g filter="url(#bar-shadow)">
          {/* Left half */}
          <BarHalf side="left" />
          {/* Right half (mirrored via flipping coordinates) */}
          <BarHalf side="right" />
          {/* Center shaft */}
          <rect
            x={SHAFT_LEFT_X}
            y={CENTER_Y - SHAFT_HEIGHT / 2}
            width={SHAFT_HALF * 2}
            height={SHAFT_HEIGHT}
            rx={SHAFT_HEIGHT / 2}
            fill={C.shaft}
          />
          <rect
            x={SHAFT_LEFT_X}
            y={CENTER_Y - SHAFT_HEIGHT / 2}
            width={SHAFT_HALF * 2}
            height={SHAFT_HEIGHT}
            rx={SHAFT_HEIGHT / 2}
            fill="url(#shaft-gloss)"
          />
          {/* Knurl marks — vertical hashes for a cleaner read than dots */}
          {Array.from({ length: knurlCols }).map((_, i) => {
            const x = SHAFT_LEFT_X + 8 + knurlGap * i
            return (
              <line
                key={`k-${i}`}
                x1={x}
                y1={CENTER_Y - SHAFT_HEIGHT / 2 + 2}
                x2={x}
                y2={CENTER_Y + SHAFT_HEIGHT / 2 - 2}
                stroke={C.knurl}
                strokeWidth={1.2}
                opacity={0.55}
              />
            )
          })}
        </g>

        {/* === Plates === */}
        {placed.map((pg, i) => {
          const leftX = PLATE_INNER_EDGE_LEFT - pg.offset - pg.width
          const rightX = PLATE_INNER_EDGE_RIGHT + pg.offset
          const delay = `${i * 60}ms`
          return (
            <g key={`p-${animKey}-${i}`}>
              <PlateShape
                x={leftX}
                y={CENTER_Y - pg.height / 2}
                w={pg.width}
                h={pg.height}
                plate={pg.plate}
                delay={delay}
              />
              <PlateShape
                x={rightX}
                y={CENTER_Y - pg.height / 2}
                w={pg.width}
                h={pg.height}
                plate={pg.plate}
                delay={delay}
                mirrored
              />
            </g>
          )
        })}

        {/* === Bushings drawn on top of plates so the inner stop is always visible === */}
        <Bushing x={BUSHING_LEFT_X} />
        <Bushing x={BUSHING_RIGHT_X} />

        {/* Bar label below */}
        <text
          x={VBW / 2}
          y={CENTER_Y + 92}
          textAnchor="middle"
          className="barbell__bar-label"
          fill="#7a705b"
        >
          {bar.label}
        </text>
      </g>
    </svg>
  )
}

function BarHalf({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'
  const endCapX = isLeft ? END_CAP_X : VBW - END_CAP_X - END_CAP_LEN
  const sleeveX = isLeft ? SLEEVE_X : VBW - SLEEVE_X - SLEEVE_LEN
  return (
    <g>
      {/* End cap — chunky rounded knob */}
      <rect
        x={endCapX}
        y={CENTER_Y - END_CAP_HEIGHT / 2}
        width={END_CAP_LEN}
        height={END_CAP_HEIGHT}
        rx={9}
        fill={C.endCap}
      />
      {/* End cap highlight */}
      <rect
        x={endCapX + 3}
        y={CENTER_Y - END_CAP_HEIGHT / 2 + 3}
        width={END_CAP_LEN - 6}
        height={5}
        rx={3}
        fill={C.endCapHighlight}
        opacity={0.5}
      />
      {/* Sleeve */}
      <rect
        x={sleeveX}
        y={CENTER_Y - SLEEVE_HEIGHT / 2}
        width={SLEEVE_LEN}
        height={SLEEVE_HEIGHT}
        rx={3}
        fill={C.sleeve}
      />
      {/* Sleeve gloss */}
      <rect
        x={sleeveX}
        y={CENTER_Y - SLEEVE_HEIGHT / 2}
        width={SLEEVE_LEN}
        height={SLEEVE_HEIGHT}
        rx={3}
        fill="url(#sleeve-gloss)"
      />
      {/* Two thin sleeve bands suggesting bushing rotation */}
      <line
        x1={isLeft ? sleeveX + 6 : sleeveX + SLEEVE_LEN - 6}
        y1={CENTER_Y - SLEEVE_HEIGHT / 2 + 1}
        x2={isLeft ? sleeveX + 6 : sleeveX + SLEEVE_LEN - 6}
        y2={CENTER_Y + SLEEVE_HEIGHT / 2 - 1}
        stroke={C.sleeveBand}
        strokeWidth={1.4}
        opacity={0.7}
      />
    </g>
  )
}

function Bushing({ x }: { x: number }) {
  return (
    <g>
      <rect
        x={x}
        y={CENTER_Y - BUSHING_HEIGHT / 2}
        width={BUSHING_W}
        height={BUSHING_HEIGHT}
        rx={5}
        fill={C.bushing}
      />
      {/* Highlight on top edge */}
      <rect
        x={x + 3}
        y={CENTER_Y - BUSHING_HEIGHT / 2 + 3}
        width={BUSHING_W - 6}
        height={4}
        rx={2}
        fill={C.bushingHighlight}
        opacity={0.55}
      />
    </g>
  )
}

type PlateShapeProps = {
  x: number
  y: number
  w: number
  h: number
  plate: Plate
  delay: string
  mirrored?: boolean
}

function PlateShape({ x, y, w, h, plate, delay, mirrored }: PlateShapeProps) {
  const radius = Math.min(w * 0.42, 12)
  const fontSize = Math.min(w * 0.72, h * 0.1)
  const cx = x + w / 2
  const isLight =
    plate.color === '#F2EEDF' ||
    plate.color === '#C8C5BB' ||
    plate.color === '#E8C642' ||
    plate.color === '#F5C84B' ||
    plate.color === MONO_PALETTE.color
  const labelFill = isLight ? '#2A2A2E' : 'white'
  const gradId = `plate-grad-${plate.color.slice(1)}`
  return (
    <g
      className={`plate plate--${mirrored ? 'r' : 'l'}`}
      style={{ animationDelay: delay }}
      filter="url(#plate-shadow)"
    >
      {/* Plate body */}
      <rect x={x} y={y} width={w} height={h} rx={radius} fill={plate.color} />
      {/* Subtle vertical gradient for depth */}
      <rect x={x} y={y} width={w} height={h} rx={radius} fill={`url(#${gradId})`} />
      {/* Outer rim (the painted edge ring on a bumper plate) */}
      <rect
        x={x + 0.75}
        y={y + 0.75}
        width={w - 1.5}
        height={h - 1.5}
        rx={radius - 0.75}
        fill="none"
        stroke={plate.ring}
        strokeWidth={2}
      />
      {/* Top glossy highlight, slightly curved feel */}
      <ellipse cx={cx} cy={y + Math.max(7, h * 0.05)} rx={w * 0.32} ry={Math.max(2, h * 0.018)} fill="white" opacity={0.55} />

      {/* Label, rotated vertically to read top-to-bottom like a stacked plate. */}
      {h > 70 && fontSize > 6 && (
        <text
          x={cx}
          y={y + h * 0.27}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={800}
          fill={labelFill}
          transform={`rotate(90 ${cx} ${y + h * 0.27})`}
          style={{ letterSpacing: '1px', fontFamily: 'Fredoka, Nunito, sans-serif' }}
        >
          {plate.label}
        </text>
      )}
    </g>
  )
}
