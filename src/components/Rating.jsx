import Icon from './Icon'
import { formatRating, reviewsLabel } from '../utils/format'

// Звёзды рейтинга: ★★★★☆ 4,5 · 12 отзывов
export default function Rating({ value = 0, count, showValue = true, size = 16 }) {
  const filled = Math.round(value)
  return (
    <span className="rating" aria-label={`Рейтинг ${formatRating(value)} из 5${count != null ? `, ${reviewsLabel(count)}` : ''}`}>
      <span className="rating__stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Icon key={i} name="star" size={size} strokeWidth={1.4} filled={i <= filled} className={i <= filled ? 'is-on' : ''} />
        ))}
      </span>
      {showValue && <span className="rating__value" aria-hidden="true">{formatRating(value)}</span>}
      {count != null && <span className="rating__count" aria-hidden="true">{reviewsLabel(count)}</span>}
    </span>
  )
}
