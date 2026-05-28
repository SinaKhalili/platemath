import { useEffect, useRef, useState } from 'react'
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
  const [text, setText] = useState(message)
  const [copied, setCopied] = useState(false)
  const edited = useRef(false)

  // Keep the preview synced to the generated message until the user edits it,
  // then preserve their wording (the score can update once the submit lands).
  useEffect(() => {
    if (!edited.current) setText(message)
  }, [message])

  async function onCopy() {
    const ok = await copyText(`${text} ${url}`)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="share">
      <div className="share__label">Share your score</div>
      <textarea
        className="share__preview"
        value={text}
        rows={3}
        onChange={(e) => {
          edited.current = true
          setText(e.target.value)
        }}
        aria-label="Editable share text"
      />
      <div className="share__url-hint">{url} will be attached</div>
      <div className="share__primary">
        <button type="button" className="share__btn share__btn--copy flex-1" onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy text'}
        </button>
        <a
          className="share__btn flex-1"
          style={{ ['--brand' as string]: '#000000' }}
          href={shareIntentUrl('x', text, url)}
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
            href={shareIntentUrl(t.id, text, url)}
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
