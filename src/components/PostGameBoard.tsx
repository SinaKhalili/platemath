import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { formatElapsed } from './RoundScreen'
import { FullLeaderboard } from './FullLeaderboard'
import { buildShareMessage } from '../game/share'
import { ShareButtons } from './ShareButtons'

type Props = {
  mode: 'sprint' | 'challenge'
  modeLabel: string
  playerId: string
}

export function PostGameBoard({ mode, modeLabel, playerId }: Props) {
  const rows = useQuery(api.scores.topScores, { mode, realgym: true, limit: 2000 })
  const [showFull, setShowFull] = useState(false)

  if (rows === undefined) {
    return <div className="leaderboard__empty mb-6">Loading leaderboard…</div>
  }

  const myIndex = rows.findIndex((r) => r.playerId === playerId)
  const myRank = myIndex >= 0 ? myIndex + 1 : null
  const total = rows.length
  const myRow = myIndex >= 0 ? rows[myIndex] : null

  // Top 5 plus the player's own row if they're further down.
  const top = rows.slice(0, 5)
  const showOwnRowSeparately = myIndex >= 5

  const shareMessage = buildShareMessage({
    modeLabel,
    score: myRow?.score ?? 0,
    rank: myRank,
    total,
  })
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="mb-6">
      {myRank != null && (
        <div className="postgame-rank">
          You're rank <span className="font-extrabold">#{myRank}</span>
          <span className="opacity-60"> of {total}</span>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="leaderboard__empty">You're the first!</div>
      ) : (
        <ol className="leaderboard__list text-left">
          {top.map((r, i) => (
            <Row key={r._id} rank={i + 1} row={r} mode={mode} isMe={r.playerId === playerId} />
          ))}
          {showOwnRowSeparately && myRow && (
            <>
              <li className="postgame-gap" aria-hidden>
                ⋯
              </li>
              <Row rank={myRank!} row={myRow} mode={mode} isMe />
            </>
          )}
        </ol>
      )}

      {myRow && <ShareButtons message={shareMessage} url={shareUrl} />}

      <div className="text-center mt-2">
        <button className="leaderboard__view-all" type="button" onClick={() => setShowFull(true)}>
          View full leaderboard →
        </button>
      </div>

      {showFull && (
        <FullLeaderboard mode={mode} title={modeLabel} playerId={playerId} onClose={() => setShowFull(false)} />
      )}
    </div>
  )
}

function Row({
  rank,
  row,
  mode,
  isMe,
}: {
  rank: number
  row: { _id: string; name: string; score: number; elapsedMs: number; playerId?: string }
  mode: 'sprint' | 'challenge'
  isMe: boolean
}) {
  return (
    <li className={`leaderboard__row ${isMe ? 'leaderboard__row--me' : ''}`}>
      <span className="leaderboard__rank">{rank}</span>
      <span className="leaderboard__name">
        {row.name}
        {isMe ? ' (you)' : ''}
      </span>
      <span className="leaderboard__score">{row.score}</span>
      {mode === 'challenge' ? <span className="leaderboard__time">{formatElapsed(row.elapsedMs)}</span> : null}
    </li>
  )
}
