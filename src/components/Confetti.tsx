import { useMemo } from 'react'

type Props = {
  /** Number of particles to spawn. */
  count?: number
  /** Visual key that re-triggers the burst (e.g. round index). */
  triggerKey: string | number
}

const COLORS = ['#D94B3E', '#3C68C8', '#E8C642', '#36A559', '#EF9355', '#F4B47A']

export function Confetti({ count = 22, triggerKey }: Props) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
      const dist = 80 + Math.random() * 180
      const dx = Math.cos(angle) * dist
      const dy = Math.sin(angle) * dist - 40 // bias upward a touch
      const rot = (Math.random() - 0.5) * 540
      const delay = Math.random() * 60
      const color = COLORS[i % COLORS.length]
      const shape = i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'star'
      const size = 8 + Math.random() * 10
      return { id: i, dx, dy, rot, delay, color, shape, size }
    })
    // The triggerKey forces a fresh memo so the burst replays.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey, count])

  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={`${triggerKey}-${p.id}`}
          className={`confetti confetti--${p.shape}`}
          style={{
            // CSS custom properties power the keyframe.
            ['--dx' as string]: `${p.dx}px`,
            ['--dy' as string]: `${p.dy}px`,
            ['--rot' as string]: `${p.rot}deg`,
            background: p.shape === 'star' ? 'transparent' : p.color,
            color: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}ms`,
          }}
        >
          {p.shape === 'star' ? '★' : null}
        </span>
      ))}
    </div>
  )
}
