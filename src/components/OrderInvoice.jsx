import { CONTACTS, DELIVERY, PAYMENTS, SHOP_NAME } from '../constants'
import { addressLine, formatDate, formatPrice, orderNumber } from '../utils/format'

// Накладная к заказу. На экране скрыта, видна только при печати (styles/print.css).
// Печатается через window.print, поэтому отдельное окно и всплывающие блокировщики не нужны.
export default function OrderInvoice({ order }) {
  if (!order) return null
  const delivery = DELIVERY.find((d) => d.id === order.delivery)
  const payment = PAYMENTS.find((p) => p.id === order.payment)

  return (
    <section className="invoice" aria-hidden="true">
      <header className="invoice__head">
        <div>
          <p className="invoice__shop">{SHOP_NAME}</p>
          <p className="invoice__contacts">{CONTACTS.phone} · {CONTACTS.email}</p>
        </div>
        <div className="invoice__num">
          <p>Накладная к заказу {orderNumber(order.id)}</p>
          <p>от {formatDate(order.createdAt)}</p>
        </div>
      </header>

      <table className="invoice__meta">
        <tbody>
          <tr><th scope="row">Покупатель</th><td>{order.contact?.name || '-'}</td></tr>
          <tr><th scope="row">Телефон</th><td>{order.contact?.phone || '-'}</td></tr>
          <tr><th scope="row">E-mail</th><td>{order.contact?.email || '-'}</td></tr>
          <tr><th scope="row">Доставка</th><td>{delivery?.title || '-'}</td></tr>
          <tr><th scope="row">Адрес</th><td>{addressLine(order) || '-'}</td></tr>
          <tr><th scope="row">Оплата</th><td>{payment?.title || '-'}</td></tr>
        </tbody>
      </table>

      <table className="invoice__items">
        <thead>
          <tr>
            <th scope="col">№</th>
            <th scope="col">Товар</th>
            <th scope="col">Кол-во</th>
            <th scope="col">Цена</th>
            <th scope="col">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i, n) => (
            <tr key={i.productId}>
              <td>{n + 1}</td>
              <td>{i.title}</td>
              <td>{i.qty}</td>
              <td>{formatPrice(i.price)}</td>
              <td>{formatPrice(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}>Товары</td><td>{formatPrice(order.goods)}</td></tr>
          <tr><td colSpan={4}>Доставка</td><td>{order.deliveryCost === 0 ? 'Бесплатно' : formatPrice(order.deliveryCost)}</td></tr>
          {order.discount > 0 && (
            <tr><td colSpan={4}>Скидка по промокоду {order.promo}</td><td>−{formatPrice(order.discount)}</td></tr>
          )}
          <tr className="invoice__total"><td colSpan={4}>Итого к оплате</td><td>{formatPrice(order.total)}</td></tr>
        </tfoot>
      </table>

      {order.comment && <p className="invoice__comment">Комментарий покупателя: {order.comment}</p>}

      <div className="invoice__signs">
        <p>Товар отпустил _______________ / _______________</p>
        <p>Товар получил _______________ / _______________</p>
      </div>
    </section>
  )
}
