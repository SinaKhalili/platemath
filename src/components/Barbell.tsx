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
}

// Layout constants in SVG user units.
const VBW = 920
const VBH = 340
const CENTER_Y = 180
const SHAFT_HALF = 80 // center grip extends ±SHAFT_HALF from middle
const SLEEVE_LEN = 230 // each sleeve is this long
const SLEEVE_X_INNER = VBW / 2 - SHAFT_HALF // start of left collar
const SLEEVE_X_OUTER = SLEEVE_X_INNER - SLEEVE_LEN // outer end of left sleeve
const END_CAP_W = 28
const SHAFT_HEIGHT = 18
const SLEEVE_HEIGHT = 34
const COLLAR_W = 16
const COLLAR_H = 64

// Maximum plate diameter in SVG units (the biggest plate visually).
const MAX_PLATE_HEIGHT = 240
// Maximum plate thickness for the chunkiest plate.
const MAX_PLATE_THICKNESS = 46
const MIN_PLATE_THICKNESS = 14
const PLATE_GAP = 6

export function Barbell({ bar, perSide, animKey, hop, shake }: Props) {
  // Plates are pre-sorted largest first. Stack them outward from the collar.
  const plateGeom = perSide.map((p) => ({
    plate: p,
    width: MIN_PLATE_THICKNESS + (MAX_PLATE_THICKNESS - MIN_PLATE_THICKNESS) * p.thickness,
    height: MAX_PLATE_HEIGHT * p.diameter,
  }))

  // Compute x offsets from the inner collar going outward.
  let runningOffset = COLLAR_W + 4
  const placed = plateGeom.map((pg, i) => {
    const x = runningOffset
    runningOffset += pg.width + PLATE_GAP
    return { ...pg, offset: x, index: i }
  })

  const sleeveColor = '#D7D2C2'
  const sleeveShadow = '#A7A293'
  const shaftColor = '#BFB8A5'
  const shaftShadow = '#8E8775'
  const collarColor = '#5A5347'
  const knurlColor = '#8C8676'

  // Knurling dots in the center grip.
  const knurlRows = 3
  const knurlCols = 14
  const knurlGap = (SHAFT_HALF * 2) / (knurlCols + 1)

  return (
    <svg
      viewBox={`0 0 ${VBW} ${VBH}`}
      className={`barbell ${hop ? 'barbell--hop' : ''} ${shake ? 'barbell--shake' : ''}`}
      aria-label={`Barbell loaded with ${perSide.length * 2} plates`}
      role="img"
    >
      <defs>
        <filter id="plate-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.18" />
        </filter>
        <filter id="bar-shadow" x="-5%" y="-5%" width="110%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      <g key={animKey} className="barbell__group">
        {/* End caps */}
        <rect
          x={SLEEVE_X_OUTER - END_CAP_W}
          y={CENTER_Y - SLEEVE_HEIGHT / 2 - 3}
          width={END_CAP_W}
          height={SLEEVE_HEIGHT + 6}
          rx={6}
          fill={collarColor}
          filter="url(#bar-shadow)"
        />
        <rect
          x={VBW - SLEEVE_X_OUTER}
          y={CENTER_Y - SLEEVE_HEIGHT / 2 - 3}
          width={END_CAP_W}
          height={SLEEVE_HEIGHT + 6}
          rx={6}
          fill={collarColor}
          filter="url(#bar-shadow)"
        />

        {/* Left sleeve */}
        <rect
          x={SLEEVE_X_OUTER}
          y={CENTER_Y - SLEEVE_HEIGHT / 2}
          width={SLEEVE_LEN}
          height={SLEEVE_HEIGHT}
          rx={SLEEVE_HEIGHT / 2}
          fill={sleeveColor}
          stroke={sleeveShadow}
          strokeWidth={1.5}
        />
        {/* Right sleeve */}
        <rect
          x={VBW - SLEEVE_X_INNER}
          y={CENTER_Y - SLEEVE_HEIGHT / 2}
          width={SLEEVE_LEN}
          height={SLEEVE_HEIGHT}
          rx={SLEEVE_HEIGHT / 2}
          fill={sleeveColor}
          stroke={sleeveShadow}
          strokeWidth={1.5}
        />

        {/* Inner collars */}
        <rect
          x={SLEEVE_X_INNER - COLLAR_W}
          y={CENTER_Y - COLLAR_H / 2}
          width={COLLAR_W}
          height={COLLAR_H}
          rx={4}
          fill={collarColor}
        />
        <rect
          x={VBW - SLEEVE_X_INNER}
          y={CENTER_Y - COLLAR_H / 2}
          width={COLLAR_W}
          height={COLLAR_H}
          rx={4}
          fill={collarColor}
        />

        {/* Shaft (center grip) */}
        <rect
          x={SLEEVE_X_INNER}
          y={CENTER_Y - SHAFT_HEIGHT / 2}
          width={SHAFT_HALF * 2}
          height={SHAFT_HEIGHT}
          rx={SHAFT_HEIGHT / 2}
          fill={shaftColor}
          stroke={shaftShadow}
          strokeWidth={1.5}
        />

        {/* Knurling dots */}
        {Array.from({ length: knurlRows }).map((_, r) =>
          Array.from({ length: knurlCols }).map((_, c) => {
            const cx = SLEEVE_X_INNER + knurlGap * (c + 1)
            const cy = CENTER_Y - SHAFT_HEIGHT / 2 + 4 + r * 3
            return <circle key={`k-${r}-${c}`} cx={cx} cy={cy} r={1.1} fill={knurlColor} />
          }),
        )}

        {/* Plates — left side and right side mirrored */}
        {placed.map((pg, i) => {
          const leftX = SLEEVE_X_INNER - COLLAR_W - 4 - pg.offset - pg.width
          const rightX = VBW - SLEEVE_X_INNER + COLLAR_W + 4 + pg.offset
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

        {/* Bar label, faint, under the bar */}
        <text
          x={VBW / 2}
          y={CENTER_Y + 80}
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
  const radius = Math.min(w * 0.45, 14)
  // Label sized to fit comfortably inside the plate edge (the narrow dimension).
  const fontSize = Math.min(w * 0.7, h * 0.11)
  const cx = x + w / 2
  const cy = y + h / 2
  const isLight = plate.color === '#F2EEDF' || plate.color === '#C8C5BB' || plate.color === '#E8C642'
  const labelFill = isLight ? '#2A2A2E' : 'white'
  return (
    <g
      className={`plate plate--${mirrored ? 'r' : 'l'}`}
      style={{ animationDelay: delay }}
      filter="url(#plate-shadow)"
    >
      {/* Main plate rectangle */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={radius}
        fill={plate.color}
        stroke={plate.ring}
        strokeWidth={2.5}
      />
      {/* Inner highlight ring (slight inset) */}
      <rect
        x={x + 2}
        y={y + 2}
        width={w - 4}
        height={h - 4}
        rx={radius - 2}
        fill="none"
        stroke="white"
        strokeOpacity={0.22}
        strokeWidth={1.5}
      />
      {/* Top glossy highlight */}
      <rect
        x={x + 3}
        y={y + 4}
        width={w - 6}
        height={Math.max(2, h * 0.04)}
        rx={radius * 0.6}
        fill="white"
        opacity={0.45}
      />
      {/* Center hub (sleeve hole) */}
      <rect
        x={x - 1}
        y={cy - SLEEVE_HEIGHT / 2 + 2}
        width={w + 2}
        height={SLEEVE_HEIGHT - 4}
        fill={plate.ring}
        opacity={0.55}
      />
      {/* Label, rotated vertically so it reads top-to-bottom like a stacked plate. */}
      {h > 80 && fontSize > 6 && (
        <text
          x={cx}
          y={y + h * 0.32}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={800}
          fill={labelFill}
          transform={`rotate(90 ${cx} ${y + h * 0.32})`}
          style={{ letterSpacing: '1px', fontFamily: 'Fredoka, Nunito, sans-serif' }}
        >
          {plate.label}
        </text>
      )}
    </g>
  )
}
