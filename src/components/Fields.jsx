import { useId, useState } from 'react'
import Icon from './Icon'

// Поля форм: подпись всегда видна, ошибка стоит прямо под полем.

export function TextField({ label, error, hint, required, multiline = false, rows = 4, className = '', right, ...props }) {
  const id = useId()
  const descId = `${id}-desc`
  const Tag = multiline ? 'textarea' : 'input'
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      <div className="field__control">
        <Tag
          id={id}
          className={multiline ? 'input input--area' : 'input'}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? descId : undefined}
          aria-required={required || undefined}
          rows={multiline ? rows : undefined}
          {...props}
        />
        {right}
      </div>
      {(error || hint) && (
        <p id={descId} className={error ? 'field__error' : 'field__hint'} role={error ? 'alert' : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function PasswordField({ label, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <TextField
      {...props}
      label={label}
      type={shown ? 'text' : 'password'}
      right={
        <button type="button" className="field__toggle" onClick={() => setShown((s) => !s)} aria-pressed={shown}>
          <Icon name="eye" size={16} /> {shown ? 'Скрыть' : 'Показать'}
        </button>
      }
    />
  )
}

export function SelectField({ label, error, hint, required, options, className = '', placeholder, ...props }) {
  const id = useId()
  const descId = `${id}-desc`
  return (
    <div className={`field${error ? ' field--error' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && <span className="field__req" aria-hidden="true"> *</span>}
      </label>
      <div className="field__control field__control--select">
        <select id={id} className="input input--select" aria-invalid={error ? 'true' : undefined} aria-describedby={error || hint ? descId : undefined} {...props}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} className="field__chevron" />
      </div>
      {(error || hint) && (
        <p id={descId} className={error ? 'field__error' : 'field__hint'} role={error ? 'alert' : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Checkbox({ label, error, className = '', ...props }) {
  const id = useId()
  return (
    <div className={`check${error ? ' check--error' : ''} ${className}`.trim()}>
      <input id={id} type="checkbox" className="check__input" aria-invalid={error ? 'true' : undefined} {...props} />
      <label htmlFor={id} className="check__label">
        <span className="check__box" aria-hidden="true"><Icon name="check" size={14} strokeWidth={2.2} /></span>
        <span>{label}</span>
      </label>
      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  )
}

export function RadioOption({ label, note, price, className = '', ...props }) {
  const id = useId()
  return (
    <div className={`radio ${className}`.trim()}>
      <input id={id} type="radio" className="radio__input" {...props} />
      <label htmlFor={id} className="radio__label">
        <span className="radio__dot" aria-hidden="true" />
        <span className="radio__text">
          {label}
          {note && <small className="radio__note"> ({note})</small>}
        </span>
        {price != null && <span className="radio__price">{price}</span>}
      </label>
    </div>
  )
}
