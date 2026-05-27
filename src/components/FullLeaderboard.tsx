import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formatElapsed } from './RoundScreen'

type Props = {
  mode: 'sprint' | 'challenge'
  title: string
  playerId: string
  onClose: () => void
}

export function FullLeaderboard({ mode, title, playerId, onClose }: Props) {
  const rows = useQuery(api.scores.topScores, { mode, realgym: true, limit: 2000 })
  const myRowRef = useRef<HTMLLIElement | null>(null)

  // Center the player's row when the list loads.
  useEffect(() => {
    if (!rows) return
    const id = window.setTimeout(() => {
      myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    return () => window.clearTimeout(id)
  }, [rows])

  // Close on Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const myRank = rows?.findIndex((r) => r.playerId === playerId) ?? -1

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal-header">
          <div className="fancy-headline text-2xl flex items-center gap-2">
            <span>🏆</span>
            <span>{title}</span>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {rows === undefined ? (
          <div className="leaderboard__empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="leaderboard__empty">No scores yet — be the first!</div>
        ) : (
          <>
            {myRank >= 0 && (
              <div className="modal-yourank">
                You're rank <span className="font-extrabold">#{myRank + 1}</span> of {rows.length}.
              </div>
            )}
            <ol className="modal-list">
              {rows.map((r, i) => {
                const isMe = r.playerId === playerId
                return (
                  <li
                    key={r._id}
                    ref={isMe ? myRowRef : undefined}
                    className={`leaderboard__row leaderboard__row--full ${isMe ? 'leaderboard__row--me' : ''}`}
                  >
                    <span className="leaderboard__rank">{i + 1}</span>
                    <span className="leaderboard__name">{r.name}{isMe ? ' (you)' : ''}</span>
                    <span className="leaderboard__score">{r.score}</span>
                    {mode === 'challenge' ? (
                      <span className="leaderboard__time">{formatElapsed(r.elapsedMs)}</span>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  )
}
