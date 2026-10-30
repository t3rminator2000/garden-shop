import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/Icon'
import OrderStatus from '../../components/OrderStatus'
import ProductImage from '../../components/ProductImage'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { catalogApi, ordersApi } from '../../api'
import { DELIVERY, PAYMENTS } from '../../constants'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useUI } from '../../context/UIContext'
import { useAsync } from '../../hooks/useAsync'
import { addressLine, formatDate, formatPrice, goodsLabel, orderNumber } from '../../utils/format'

const TIMELINE = [
  { id: 'processing', label: 'В обработке' },
  { id: 'shipped', label: 'Отправлен' },
  { id: 'delivered', label: 'Доставлен' },
]
const stageOf = (status) => (status === 'delivered' ? 2 : status === 'shipped' ? 1 : 0)

export default function ProfileOrders() {
  const { user } = useAuth()
  const { add } = useCart()
  const { openCart, showToast } = useUI()
  // В заказе хранится название и цена на момент покупки, фото там нет.
  // Поэтому для миниатюр подтягиваем товары из каталога.
  const { data, loading, error, reload } = useAsync(async () => {
    const list = await ordersApi.listUserOrders(user.key)
    const ids = [...new Set(list.flatMap((o) => o.items.map((i) => i.productId)))]
    let products = []
    // Заказы важнее миниатюр: если каталог не ответил, показываем список без фото
    if (ids.length) products = await catalogApi.getProductsByIds(ids).catch(() => [])
    return { orders: list, byId: new Map(products.map((p) => [p.id, p])) }
  }, [user.key])
  const orders = data?.orders
  const byId = data?.byId
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (orders?.length && !orders.some((o) => o.id === selected)) setSelected(orders[0].id)
  }, [orders, selected])

  const repeat = async (order) => {
    try {
      const products = await catalogApi.getProductsByIds(order.items.map((i) => i.productId))
      let added = 0
      let skipped = 0
      for (const item of order.items) {
        const p = products.find((x) => x.id === item.productId)
        if (p && p.published && p.inStock) {
          add(p, item.qty)
          added++
        } else skipped++
      }
      if (added) {
        showToast(skipped ? `Добавлено ${goodsLabel(added)}, ещё ${goodsLabel(skipped)} недоступно` : 'Товары из заказа добавлены в корзину', skipped ? 'info' : 'success')
        openCart()
      } else showToast('Этих товаров сейчас нет в наличии', 'error')
    } catch {
      showToast('Не удалось повторить заказ. Попробуйте ещё раз', 'error')
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  if (loading && !orders) return <div style={{ textAlign: 'center' }}><Spinner /></div>
  if (!orders?.length) {
    return (
      <EmptyState icon="box" title="Заказов пока нет" text="Когда вы оформите заказ, он появится здесь">
        <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
      </EmptyState>
    )
  }
  const current = orders.find((o) => o.id === selected) || orders[0]

  return (
    <section aria-labelledby="orders-title">
      <h2 id="orders-title" className="section__title section__title--sm">Мои заказы</h2>
      <ul className="orders">
        {orders.map((o) => (
          <li key={o.id} className={`order${o.id === current.id ? ' is-selected' : ''}`}>
            <div className="order__head">
              <h3 className="order__title">Заказ {orderNumber(o.id)} от {formatDate(o.createdAt)}</h3>
              <OrderStatus status={o.status} />
            </div>
            <div className="order__body">
              <div className="order__thumbs" aria-hidden="true">
                {o.items.slice(0, 3).map((i) => (
                  <ProductImage key={i.productId} product={byId?.get(i.productId) || { title: i.title }} label="Фото" className="order__thumb" iconSize={16} />
                ))}
              </div>
              <span className="order__count">{goodsLabel(o.items.length)}</span>
              <strong className="order__sum">{formatPrice(o.total)}</strong>
              <div className="order__actions">
                <button type="button" className="btn btn--outline" aria-expanded={o.id === current.id} onClick={() => setSelected(o.id)}>Подробнее</button>
                <button type="button" className="btn btn--outline" onClick={() => repeat(o)}><Icon name="refresh" size={16} /> Повторить заказ</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <article className="panel order-detail" aria-live="polite">
        <h3 className="panel__title">Заказ {orderNumber(current.id)}: подробно</h3>
        {current.status === 'cancelled' ? (
          <p className="status status--cancelled">Заказ отменён</p>
        ) : (
          <ol className="timeline" aria-label="Статус заказа">
            {TIMELINE.map((t, i) => (
              <li key={t.id} className={`timeline__item${i <= stageOf(current.status) ? ' is-done' : ''}${i === stageOf(current.status) ? ' is-current' : ''}`} aria-current={i === stageOf(current.status) ? 'step' : undefined}>
                <span className="timeline__dot" aria-hidden="true">{i < stageOf(current.status) ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}</span>
                {t.label}
              </li>
            ))}
          </ol>
        )}
        <ul className="summary__lines">
          {current.items.map((i) => (
            <li key={i.productId}><span>{i.title} × {i.qty}</span><span>{formatPrice(i.price * i.qty)}</span></li>
          ))}
          <li><span>Доставка ({DELIVERY.find((d) => d.id === current.delivery)?.title})</span><span>{current.deliveryCost === 0 ? 'Бесплатно' : formatPrice(current.deliveryCost)}</span></li>
          {current.discount > 0 && (
            <li className="summary__discount"><span>Скидка по промокоду {current.promo}</span><span>−{formatPrice(current.discount)}</span></li>
          )}
        </ul>
        <p className="summary__total-line"><span>Итого</span><strong>{formatPrice(current.total)}</strong></p>
        <p className="muted-note">Оплата: {PAYMENTS.find((p) => p.id === current.payment)?.short}. Адрес: {addressLine(current) || '-'}</p>
      </article>
    </section>
  )
}
