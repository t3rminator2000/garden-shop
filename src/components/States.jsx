import Icon from './Icon'

// Пустое состояние: «Ничего не найдено», «В корзине пока пусто» и т.п.
export function EmptyState({ icon = 'sprout', title, text, children }) {
  return (
    <div className="state" role="status">
      <span className="state__icon"><Icon name={icon} size={30} strokeWidth={1.3} /></span>
      <h2 className="state__title">{title}</h2>
      {text && <p className="state__text">{text}</p>}
      {children && <div className="state__actions">{children}</div>}
    </div>
  )
}

// Ошибка загрузки с кнопкой «Повторить»
export function ErrorState({ error, onRetry, title = 'Не удалось загрузить данные' }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon"><Icon name="alert" size={30} strokeWidth={1.3} /></span>
      <h2 className="state__title">{title}</h2>
      <p className="state__text">{error?.message || 'Попробуйте ещё раз'}</p>
      {onRetry && (
        <div className="state__actions">
          <button type="button" className="btn btn--primary" onClick={onRetry}>Повторить</button>
        </div>
      )}
    </div>
  )
}

export function Spinner({ label = 'Загрузка' }) {
  return <span className="spinner" role="status" aria-label={label} />
}

// Скелетон карточек товаров (состояние «Загрузка данных»)
export function ProductSkeletons({ count = 9 }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div className="card card--skeleton" key={i} aria-hidden="true">
          <div className="skeleton skeleton--img" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
          <div className="skeleton skeleton--btn" />
        </div>
      ))}
    </>
  )
}
