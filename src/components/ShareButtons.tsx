import { useState } from 'react'
import { copyText, shareIntentUrl, type ShareTargetId } from '../game/share'

type Props = {
  message: string
  url: string
}

const TARGETS: { id: ShareTargetId; label: string; brand: string }[] = [
  { id: 'x', label: 'X', brand: '#000000' },
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
      <div className="share__row">
        {TARGETS.map((t) => (
          <a
            key={t.id}
            className="share__btn"
            style={{ ['--brand' as string]: t.brand }}
            href={shareIntentUrl(t.id, message, url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.label}
          </a>
        ))}
        <button type="button" className="share__btn share__btn--copy" onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  )
}
