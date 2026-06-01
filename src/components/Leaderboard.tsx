import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { FullLeaderboard } from './FullLeaderboard'

type Props = {
  mode: 'sprint'
  title: string
  playerId: string
}

export function Leaderboard({ mode, title, playerId }: Props) {
  const rows = useQuery(api.scores.topScores, { mode, realgym: true, limit: 5 })
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="leaderboard">
        <div className="leaderboard__title">
          <span>🏆</span>
          <span>{title}</span>
        </div>
        {rows === undefined ? (
          <div className="leaderboard__empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="leaderboard__empty">No scores yet</div>
        ) : (
          <ol className="leaderboard__list">
            {rows.map((r, i) => {
              const isMe = r.playerId === playerId
              return (
                <li
                  key={r._id}
                  className={`leaderboard__row ${isMe ? 'leaderboard__row--me' : ''}`}
                >
                  <span className="leaderboard__rank">{i + 1}</span>
                  <span className="leaderboard__name">{r.name}{isMe ? ' (you)' : ''}</span>
                  <span className="leaderboard__score">{r.score}</span>
                </li>
              )
            })}
          </ol>
        )}
        <button className="leaderboard__view-all" type="button" onClick={() => setOpen(true)}>
          View full leaderboard →
        </button>
      </div>
      {open && (
        <FullLeaderboard
          mode={mode}
          title={title}
          playerId={playerId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
