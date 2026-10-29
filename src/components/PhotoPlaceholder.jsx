import Icon from './Icon'

// Заглушка на месте фотографии. Настоящие фото подключаются через поле images у товара.
export default function PhotoPlaceholder({ label = 'Фото', className = '', iconSize = 28 }) {
  return (
    <div className={`photo-ph ${className}`.trim()} role="img" aria-label={label}>
      <Icon name="sprout" size={iconSize} strokeWidth={1.3} />
      <span className="photo-ph__label">{label}</span>
    </div>
  )
}
