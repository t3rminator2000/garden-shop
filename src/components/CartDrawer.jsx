import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import ProductImage from './ProductImage'
import QuantityStepper from './QuantityStepper'
import { EmptyState, Spinner } from './States'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useDialog } from '../hooks/useDialog'
import { formatPrice } from '../utils/format'

// Панель корзины (макет «Управление корзиной»): открывается по клику на «Корзина» на любой странице
export default function CartDrawer() {
  const { cartOpen, closeCart } = useUI()
  const { lines, positions, totalQty, goodsTotal, setQty, remove, loading } = useCart()
  const navigate = useNavigate()
  const ref = useRef(null)
  useDialog(cartOpen, closeCart, ref)

  if (!cartOpen) return null
  const go = (path) => {
    closeCart()
    navigate(path)
  }

  return (
    <div className="overlay overlay--drawer" onMouseDown={(e) => e.target === e.currentTarget && closeCart()}>
      <aside ref={ref} className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1}>
        <div className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">Корзина{positions > 0 ? ` (${totalQty})` : ''}</h2>
          <button type="button" className="icon-btn" onClick={closeCart} aria-label="Закрыть корзину">
            <Icon name="close" size={20} />
          </button>
        </div>

        {positions === 0 ? (
          <div className="drawer__empty">
            <EmptyState icon="cart" title="В корзине пока пусто">
              <button type="button" className="btn btn--primary" onClick={() => go('/catalog')}>Перейти в каталог</button>
            </EmptyState>
          </div>
        ) : loading && !lines.length ? (
          <div className="drawer__empty"><Spinner /></div>
        ) : (
          <>
            <ul className="drawer__list">
              {lines.map(({ product, qty, sum }) => (
                <li key={product.id} className="drawer__item">
                  <Link to={`/product/${product.id}`} onClick={closeCart} className="drawer__thumb" aria-hidden="true" tabIndex={-1}>
                    <ProductImage product={product} label="Фото" iconSize={20} />
                  </Link>
                  <div className="drawer__info">
                    <Link to={`/product/${product.id}`} onClick={closeCart} className="drawer__name">{product.title}</Link>
                    <span className="drawer__unit">{formatPrice(product.finalPrice)} за шт.</span>
                    <div className="drawer__row">
                      <QuantityStepper value={qty} max={Math.min(product.stock, 99)} onChange={(n) => setQty(product.id, n)} label={`Количество: ${product.title}`} compact />
                      <strong className="drawer__sum">{formatPrice(sum)}</strong>
                    </div>
                    <button type="button" className="link-btn" onClick={() => remove(product.id)}>Удалить</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="drawer__total"><span>Итого</span><strong>{formatPrice(goodsTotal)}</strong></div>
              <button type="button" className="btn btn--outline btn--block" onClick={() => go('/cart')}>Перейти в корзину</button>
              <button type="button" className="btn btn--primary btn--block" onClick={() => go('/checkout')}>Оформить заказ</button>
              <p className="drawer__note">Корзина сохраняется в браузере и не пропадает после закрытия вкладки</p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
