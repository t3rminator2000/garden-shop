import { Link } from 'react-router-dom'
import Icon from './Icon'
import ProductImage from './ProductImage'
import Rating from './Rating'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext'
import { useFavorites } from '../context/FavoritesContext'
import { useUI } from '../context/UIContext'
import { formatPrice } from '../utils/format'

// Карточка товара: фото, бейджи, избранное, сравнение, название, рейтинг, цена, наличие, «В корзину»
export default function ProductCard({ product }) {
  const { add } = useCart()
  const fav = useFavorites()
  const compare = useCompare()
  const { showToast } = useUI()
  const isFav = fav.has(product.id)
  const inCompare = compare.has(product.id)

  const handleAdd = () => {
    const res = add(product, 1)
    if (!res.ok) return showToast('Товара нет в наличии', 'error')
    showToast(res.capped ? 'В корзине максимум доступного количества' : `«${product.title}» добавлен в корзину`, res.capped ? 'info' : 'success')
  }
  const handleFav = () => {
    const added = fav.toggle(product.id)
    showToast(added ? 'Добавлено в избранное' : 'Удалено из избранного', 'info')
  }
  const handleCompare = () => {
    const res = compare.toggle(product.id)
    if (res.state === 'full') return showToast(`В сравнении уже ${res.max} товара. Уберите лишний`, 'info')
    showToast(res.state === 'added' ? 'Товар добавлен к сравнению' : 'Товар убран из сравнения', 'info')
  }

  const badge = product.discount > 0 ? `−${product.discount}%` : product.isNew ? 'Новинка' : product.isHit ? 'Хит' : ''

  return (
    <article className="card">
      <div className="card__media">
        <Link to={`/product/${product.id}`} className="card__image-link" tabIndex={-1} aria-hidden="true">
          <ProductImage product={product} className="card__image" />
        </Link>
        {badge && <span className="badge badge--accent card__badge">{badge}</span>}
        <button
          type="button"
          className={`icon-btn card__fav${isFav ? ' is-active' : ''}`}
          onClick={handleFav}
          aria-pressed={isFav}
          aria-label={isFav ? `Убрать «${product.title}» из избранного` : `Добавить «${product.title}» в избранное`}
        >
          <Icon name="heart" size={20} filled={isFav} />
        </button>
        <button
          type="button"
          className={`icon-btn card__compare${inCompare ? ' is-active' : ''}`}
          onClick={handleCompare}
          aria-pressed={inCompare}
          aria-label={inCompare ? `Убрать «${product.title}» из сравнения` : `Добавить «${product.title}» к сравнению`}
        >
          <Icon name="compare" size={20} />
        </button>
      </div>
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/product/${product.id}`}>{product.title}</Link>
        </h3>
        <Rating value={product.rating} count={product.reviewsCount} />
        <div className="card__price-row">
          <span className="price">
            <strong>{formatPrice(product.finalPrice)}</strong>
            {product.oldPrice && <s className="price__old">{formatPrice(product.oldPrice)}</s>}
          </span>
          <span className={`stock ${product.inStock ? 'stock--in' : 'stock--out'}`}>{product.inStock ? 'В наличии' : 'Нет в наличии'}</span>
        </div>
        <button type="button" className="btn btn--primary btn--block" onClick={handleAdd} disabled={!product.inStock}>
          {product.inStock ? 'В корзину' : 'Нет в наличии'}
        </button>
      </div>
    </article>
  )
}
