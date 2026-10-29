import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { TextField } from '../components/Fields'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import ProductGrid from '../components/ProductGrid'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { catalogApi } from '../api'
import { CART_RECOMMENDED_IDS } from '../constants'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice } from '../utils/format'

// Страница корзины: таблица товаров, итог и блок «С этим товаром покупают»
export default function Cart() {
  useDocumentTitle('Корзина')
  const navigate = useNavigate()
  const { lines, items, loading, error, totalQty, goodsTotal, setQty, remove, clear, promo, promoOk, promoError, promoTitle, promoDiscount, applyPromo, clearPromo } = useCart()
  const { showToast } = useUI()
  const [confirmClear, setConfirmClear] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const inCart = items.map((i) => i.productId)
  const key = inCart.join(',')

  const rec = useAsync(async () => {
    const byId = await catalogApi.getProductsByIds(CART_RECOMMENDED_IDS)
    let list = CART_RECOMMENDED_IDS.map((id) => byId.find((p) => p.id === id)).filter((p) => p && p.published && !inCart.includes(p.id))
    if (list.length < 4) {
      const more = (await catalogApi.queryProducts({ perPage: 12 })).items.filter((p) => !inCart.includes(p.id) && !list.some((l) => l.id === p.id))
      list = [...list, ...more].slice(0, 4)
    }
    return list
  }, [key])

  const crumbs = [{ label: 'Главная', to: '/' }, { label: 'Корзина' }]

  const submitPromo = (e) => {
    e.preventDefault()
    const res = applyPromo(code)
    if (!res.ok) return setCodeError(res.error)
    setCodeError('')
    setCode('')
    showToast(`Промокод ${res.promo.code} применён`, 'success')
  }

  if (!items.length) {
    return (
      <div className="container section section--tight">
        <Breadcrumbs items={crumbs} />
        <h1 className="page-title">Корзина</h1>
        <EmptyState icon="cart" title="В корзине пока пусто" text="Добавьте товары из каталога">
          <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={crumbs} />
      <h1 className="page-title">Корзина</h1>

      {error ? (
        <ErrorState error={error} title="Не удалось загрузить товары корзины" />
      ) : loading && !lines.length ? (
        <div style={{ textAlign: 'center' }}><Spinner /></div>
      ) : (
        <div className="cart">
          <div className="cart__main">
            <table className="cart-table">
              <caption className="sr-only">Товары в корзине</caption>
              <thead>
                <tr>
                  <th scope="col">Товар</th>
                  <th scope="col">Цена</th>
                  <th scope="col">Количество</th>
                  <th scope="col">Сумма</th>
                  <th scope="col"><span className="sr-only">Удалить</span></th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ product, qty, sum }) => (
                  <tr key={product.id}>
                    <td data-label="Товар">
                      <div className="cart-item">
                        <Link to={`/product/${product.id}`} className="cart-item__thumb" tabIndex={-1} aria-hidden="true"><ProductImage product={product} label="Фото" iconSize={22} /></Link>
                        <div>
                          <Link to={`/product/${product.id}`} className="cart-item__name">{product.title}</Link>
                          <p className="cart-item__sku">Артикул: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Цена">{formatPrice(product.finalPrice)}</td>
                    <td data-label="Количество"><QuantityStepper value={qty} max={Math.min(product.stock, 99)} onChange={(n) => setQty(product.id, n)} label={`Количество: ${product.title}`} /></td>
                    <td data-label="Сумма"><strong>{formatPrice(sum)}</strong></td>
                    <td className="cart-table__del">
                      <button type="button" className="icon-btn" onClick={() => remove(product.id)} aria-label={`Удалить «${product.title}» из корзины`}><Icon name="close" size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lines.length < items.length && <p className="muted-note">Часть товаров больше недоступна и скрыта из корзины.</p>}
            <div className="cart__actions">
              <Link to="/catalog" className="btn btn--ghost"><Icon name="arrow-left" size={16} /> Продолжить покупки</Link>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmClear(true)}>Очистить корзину</button>
            </div>
          </div>

          <aside className="summary" aria-labelledby="sum-title">
            <h2 id="sum-title" className="summary__title">Ваш заказ</h2>
            {promoOk ? (
              <div className="promo promo--applied">
                <p className="promo__applied-title"><Icon name="tag" size={16} /> Промокод {promo}</p>
                <p className="promo__hint">{promoTitle}</p>
                <button type="button" className="link-btn" onClick={() => { clearPromo(); showToast('Промокод отменён', 'info') }}>Отменить промокод</button>
              </div>
            ) : (
              <form className="promo" onSubmit={submitPromo} noValidate>
                <TextField
                  label="Промокод"
                  value={code}
                  error={codeError || (promo ? promoError : '')}
                  maxLength={20}
                  placeholder="Например, SAD10"
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError('') }}
                />
                <button type="submit" className="btn btn--outline">Применить</button>
              </form>
            )}

            <dl className="summary__rows">
              <div><dt>Товары ({totalQty})</dt><dd>{formatPrice(goodsTotal)}</dd></div>
              {promoDiscount > 0 && (
                <div className="summary__discount"><dt>Скидка по промокоду</dt><dd>−{formatPrice(promoDiscount)}</dd></div>
              )}
              <div><dt>Доставка</dt><dd className="summary__muted">Считается при оформлении</dd></div>
              <div className="summary__total"><dt>Итого</dt><dd>{formatPrice(Math.max(0, goodsTotal - promoDiscount))}</dd></div>
            </dl>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => navigate('/checkout')} disabled={!lines.length}>Оформить заказ</button>
            <p className="summary__note">Оформить заказ можно без регистрации</p>
          </aside>
        </div>
      )}

      <section className="product-section" aria-labelledby="rec-title">
        <h2 id="rec-title">С этим товаром покупают</h2>
        <ProductGrid items={rec.data || []} loading={rec.loading} skeletons={4} columns={4} />
      </section>

      <Modal open={confirmClear} onClose={() => setConfirmClear(false)} title="Очистить корзину?" size="sm">
        <p>Все товары будут удалены из корзины.</p>
        <div className="modal__actions">
          <button type="button" className="btn btn--outline" onClick={() => setConfirmClear(false)}>Отмена</button>
          <button type="button" className="btn btn--danger" onClick={() => { clear(); setConfirmClear(false) }}>Очистить</button>
        </div>
      </Modal>
    </div>
  )
}
