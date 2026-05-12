import { useEffect, useState } from 'react'

type Props = {
  onSubmit: (value: number) => void
  disabled?: boolean
  unit: 'lb' | 'kg'
}

export function NumberPad({ onSubmit, disabled, unit }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    if (disabled) return
    function onKey(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        setValue((v) => (v.length < 5 ? v + e.key : v))
      } else if (e.key === 'Backspace') {
        setValue((v) => v.slice(0, -1))
      } else if (e.key === '.' && !value.includes('.')) {
        setValue((v) => (v.length === 0 ? '0.' : v + '.'))
      } else if (e.key === 'Enter') {
        const n = parseFloat(value)
        if (!isNaN(n)) {
          onSubmit(n)
          setValue('')
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [value, disabled, onSubmit])

  function press(s: string) {
    if (disabled) return
    if (s === '⌫') setValue((v) => v.slice(0, -1))
    else if (s === '.') {
      if (!value.includes('.')) setValue((v) => (v.length === 0 ? '0.' : v + '.'))
    } else {
      setValue((v) => (v.length < 5 ? v + s : v))
    }
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
  const displayValue = value.length === 0 ? '0' : value

  return (
    <div className="flex flex-col items-stretch gap-4 w-full max-w-sm mx-auto">
      <div className={`number-display ${value.length === 0 ? 'number-display--placeholder' : ''}`}>
        {displayValue}
        <span className="text-2xl ml-2 opacity-60">{unit}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            className={`keypad-key ${k === '⌫' ? 'keypad-key--muted' : ''}`}
            onClick={() => press(k)}
            disabled={disabled}
            type="button"
          >
            {k}
          </button>
        ))}
      </div>
      <button
        className="btn-chunky btn-chunky--mint"
        onClick={submit}
        disabled={disabled || value.length === 0}
        type="button"
      >
        Lock it in
      </button>
    </div>
  )
}
