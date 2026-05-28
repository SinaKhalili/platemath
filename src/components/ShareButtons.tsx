import { useState } from 'react'
import { copyText, shareIntentUrl, type ShareTargetId } from '../game/share'

type Props = {
  message: string
  url: string
}

const SECONDARY: { id: ShareTargetId; label: string; brand: string }[] = [
  { id: 'whatsapp', label: 'WhatsApp', brand: '#25D366' },
  { id: 'reddit', label: 'Reddit', brand: '#FF4500' },
  { id: 'telegram', label: 'Telegram', brand: '#229ED9' },
]

export function ShareButtons({ message, url }: Props) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    const ok = await copyText(`${message} ${url}`)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="share">
      <div className="share__label">Share your score</div>
      <div className="share__primary">
        <button type="button" className="share__btn share__btn--copy flex-1" onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
        <a
          className="share__btn flex-1"
          style={{ ['--brand' as string]: '#000000' }}
          href={shareIntentUrl('x', message, url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Post to X
        </a>
      </div>
      <div className="share__secondary">
        {SECONDARY.map((t) => (
          <a
            key={t.id}
            className="share__btn share__btn--sm"
            style={{ ['--brand' as string]: t.brand }}
            href={shareIntentUrl(t.id, message, url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.label}
          </a>
        ))}
      </div>
    </div>
  )
}
