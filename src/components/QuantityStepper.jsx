import { useEffect, useState } from 'react'
import Icon from './Icon'

// Счётчик количества: − 1 +
export default function QuantityStepper({ value, onChange, min = 1, max = 99, label = 'Количество', compact = false }) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const clamp = (n) => Math.min(max, Math.max(min, n))
  const commit = () => {
    const n = Math.floor(Number(text))
    const next = Number.isFinite(n) ? clamp(n) : value
    setText(String(next))
    if (next !== value) onChange(next)
  }

  return (
    <div className={`qty${compact ? ' qty--compact' : ''}`} role="group" aria-label={label}>
      <button type="button" className="qty__btn" onClick={() => onChange(clamp(value - 1))} disabled={value <= min} aria-label="Уменьшить количество">
        <Icon name="minus" size={16} />
      </button>
      <input
        className="qty__input"
        type="text"
        inputMode="numeric"
        value={text}
        aria-label={label}
        onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 2))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      <button type="button" className="qty__btn" onClick={() => onChange(clamp(value + 1))} disabled={value >= max} aria-label="Увеличить количество">
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
