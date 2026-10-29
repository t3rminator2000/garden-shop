import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import { ErrorState, Spinner } from '../components/States'
import NotFound from './NotFound'
import { ordersApi } from '../api'
import { DELIVERY, ORDER_STATUS, PAYMENTS } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { addressLine, formatPrice, orderNumber } from '../utils/format'

// Заказ оформлен (макет «Заказ оформлен»)
export default function OrderSuccess() {
  const { orderId } = useParams()
  const { isAuth } = useAuth()
  const { data: order, loading, error, reload } = useAsync(() => ordersApi.getOrder(orderId), [orderId])
  useDocumentTitle(order ? `Заказ ${orderNumber(order.id)} оформлен` : 'Заказ')

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>
  if (loading) return <div className="container section" style={{ textAlign: 'center' }}><Spinner /></div>
  if (!order) return <NotFound />

  const delivery = DELIVERY.find((d) => d.id === order.delivery)
  const payment = PAYMENTS.find((p) => p.id === order.payment)

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Корзина', to: '/cart' }, { label: 'Заказ оформлен' }]} />
      <div className="success">
        <span className="success__icon"><Icon name="check" size={30} strokeWidth={2} /></span>
        <h1 className="success__title">Заказ {orderNumber(order.id)} оформлен</h1>
        <p className="success__text">
          {order.contact.email ? `Мы отправили подтверждение на ${order.contact.email}` : `Мы свяжемся с вами по телефону ${order.contact.phone}`}
        </p>
        <p className="success__status">Статус заказа: <strong>{ORDER_STATUS[order.status].customer}</strong></p>

        <section className="panel success__box" aria-labelledby="order-items">
          <h2 id="order-items" className="panel__title">Состав заказа</h2>
          <ul className="summary__lines">
            {order.items.map((i) => (
              <li key={i.productId}><span>{i.title} × {i.qty}</span><span>{formatPrice(i.price * i.qty)}</span></li>
            ))}
            <li><span>Доставка ({delivery?.title || '-'})</span><span>{order.deliveryCost === 0 ? 'Бесплатно' : formatPrice(order.deliveryCost)}</span></li>
            {order.discount > 0 && (
              <li className="summary__discount"><span>Скидка по промокоду {order.promo}</span><span>−{formatPrice(order.discount)}</span></li>
            )}
          </ul>
          <p className="summary__total-line"><span>Итого</span><strong>{formatPrice(order.total)}</strong></p>
          <p className="muted-note">Оплата: {payment?.short || '-'}. Адрес: {addressLine(order) || '-'}</p>
        </section>

        <div className="state__actions">
          <Link to={isAuth ? '/profile/orders' : '/login'} className="btn btn--primary">Мои заказы</Link>
          <Link to="/catalog" className="btn btn--outline">Продолжить покупки</Link>
        </div>
      </div>
    </div>
  )
}
