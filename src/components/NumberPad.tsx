import { useEffect, useRef, useState } from 'react'

type Props = {
  onSubmit: (value: number) => void
  disabled?: boolean
  unit: 'lb' | 'kg'
  /** Bumps focus back into the input — pass the round index so each new round refocuses. */
  focusKey: number | string
}

export function NumberPad({ onSubmit, disabled, unit, focusKey }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Reset the entry and pull focus back when the round changes or once we're playable again.
  useEffect(() => {
    setValue('')
    if (!disabled) {
      // Tiny defer so any animation/transition that just stole focus settles first.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [focusKey, disabled])

  function sanitize(next: string): string {
    // Allow only digits and a single dot, max 6 visible chars (e.g., "499.75").
    let cleaned = next.replace(/[^0-9.]/g, '')
    const firstDot = cleaned.indexOf('.')
    if (firstDot !== -1) {
      cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
    }
    if (cleaned.startsWith('.')) cleaned = '0' + cleaned
    return cleaned.slice(0, 6)
  }

  function press(s: string) {
    if (disabled) return
    inputRef.current?.focus()
    if (s === '⌫') setValue((v) => v.slice(0, -1))
    else if (s === '.') setValue((v) => sanitize(v.length === 0 ? '0.' : v + '.'))
    else setValue((v) => sanitize(v + s))
  }

  function submit() {
    if (disabled) return
    const n = parseFloat(value)
    if (!isNaN(n)) {
      onSubmit(n)
      setValue('')
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫']

  return (
    <form
      className="flex flex-col items-stretch gap-4 w-full max-w-sm mx-auto"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label className={`number-display ${value.length === 0 ? 'number-display--placeholder' : ''}`}>
        <input
          ref={inputRef}
          className="number-display__input"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          placeholder="0"
          disabled={disabled}
          onChange={(e) => setValue(sanitize(e.target.value))}
          aria-label="Total weight"
        />
        <span className="number-display__unit">{unit}</span>
      </label>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            className={`keypad-key ${k === '⌫' ? 'keypad-key--muted' : ''}`}
            onClick={() => press(k)}
            disabled={disabled}
            type="button"
            tabIndex={-1}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        className="btn-chunky btn-chunky--mint"
        disabled={disabled || value.length === 0}
        type="submit"
        tabIndex={-1}
      >
        Lock it in
      </button>
    </form>
  )
}
