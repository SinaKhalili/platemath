export function buildShareMessage(opts: { score: number; rank: number | null; total: number | null }): string {
  const { score, rank, total } = opts
  const rankPart = rank && total ? ` 🏋️‍♂️ rank #${rank} of ${total}` : ''
  return `💪 I scored ${score} on Plate Math${rankPart}. Can you beat me? 💪`
}

/** Copy text to the clipboard. Returns false if the clipboard API is unavailable. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }
  return false
}

export type ShareTargetId = 'x' | 'whatsapp' | 'reddit' | 'telegram'

/** Build the web-intent URL for a given social target. */
export function shareIntentUrl(target: ShareTargetId, message: string, url: string): string {
  const m = encodeURIComponent(message)
  const u = encodeURIComponent(url)
  const both = encodeURIComponent(`${message} ${url}`)
  switch (target) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${m}&url=${u}`
    case 'whatsapp':
      return `https://wa.me/?text=${both}`
    case 'reddit':
      return `https://www.reddit.com/submit?title=${m}&url=${u}`
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${m}`
  }
}
