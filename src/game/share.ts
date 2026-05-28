export type ShareResult = 'shared' | 'copied' | 'failed'

/**
 * Share a result line. Uses the native share sheet when available
 * (mostly mobile), otherwise copies the text to the clipboard.
 */
export async function shareText(text: string): Promise<ShareResult> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      // AbortError = user dismissed the sheet; treat as a no-op, not a failure.
      if (err instanceof DOMException && err.name === 'AbortError') return 'failed'
      // Fall through to clipboard on any other share error.
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return 'copied'
    } catch {
      return 'failed'
    }
  }
  return 'failed'
}

export function buildShareText(opts: {
  modeLabel: string
  score: number
  rank: number | null
  total: number | null
  url: string
}): string {
  const { modeLabel, score, rank, total, url } = opts
  const rankPart = rank && total ? ` — rank #${rank} of ${total}` : ''
  return `I scored ${score} on Plate Math ${modeLabel}${rankPart} 🏋️ Can you beat me? ${url}`
}
