type Props = {
  choices: number[]
  correctIndex: number
  picked: number | null
  unit: 'lb' | 'kg'
  onPick: (index: number) => void
  disabled?: boolean
}

function pretty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

export function MultipleChoice({ choices, correctIndex, picked, unit, onPick, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
      {choices.map((c, i) => {
        const isPicked = picked === i
        const isCorrect = picked !== null && i === correctIndex
        const isWrongPick = isPicked && i !== correctIndex
        let cls = 'choice-card'
        if (isCorrect) cls += ' choice-card--correct'
        if (isWrongPick) cls += ' choice-card--wrong'
        return (
          <button
            key={i}
            className={cls}
            onClick={() => onPick(i)}
            disabled={disabled}
            type="button"
          >
            {pretty(c)} <span className="text-xl opacity-60 ml-1">{unit}</span>
          </button>
        )
      })}
    </div>
  )
}
