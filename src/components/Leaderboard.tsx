import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formatElapsed } from './RoundScreen'

type Props = {
  mode: 'sprint' | 'challenge'
  realgym: boolean
  title: string
}

export function Leaderboard({ mode, realgym, title }: Props) {
  const rows = useQuery(api.scores.topScores, { mode, realgym, limit: 5 })

  return (
    <div className="leaderboard">
      <div className="leaderboard__title">
        <span>🏆</span>
        <span>{title}</span>
        {realgym ? <span className="leaderboard__tag">Real Gym</span> : null}
      </div>
      {rows === undefined ? (
        <div className="leaderboard__empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="leaderboard__empty">No scores yet — be the first!</div>
      ) : (
        <ol className="leaderboard__list">
          {rows.map((r, i) => (
            <li key={r._id} className="leaderboard__row">
              <span className="leaderboard__rank">{i + 1}</span>
              <span className="leaderboard__name">{r.name}</span>
              <span className="leaderboard__score">{r.score}</span>
              {mode === 'challenge' ? (
                <span className="leaderboard__time">{formatElapsed(r.elapsedMs)}</span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
