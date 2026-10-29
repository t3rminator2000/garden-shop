import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import NotFound from './NotFound'
import { CONTACTS, DELIVERY, INFO_LINKS, PAYMENTS, REGIONS, SHOP_NAME, deliveryCost } from '../constants'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice } from '../utils/format'

const FAQ = [
  ['Как оформить заказ без регистрации?', 'Добавьте товары в корзину и нажмите «Оформить заказ». Регистрация не нужна, достаточно указать контакты и адрес.'],
  ['Как узнать статус заказа?', 'Покупатели с аккаунтом видят статус в личном кабинете в разделе «Мои заказы». Остальным статус отправляют по e-mail.'],
  ['Можно ли вернуть товар?', 'Да, в течение 14 дней, если товар не подошёл. Семена в вскрытой упаковке возврату не подлежат.'],
  ['Как выбрать способ доставки?', 'Способы и стоимость показываются при оформлении заказа и зависят от региона.'],
  ['Сохраняется ли корзина?', 'Корзина хранится в браузере и остаётся после закрытия вкладки.'],
]

function Delivery() {
  return (
    <>
      <p>Стоимость доставки зависит от региона и способа. Точная цена показывается при оформлении заказа.</p>
      <h2>Способы доставки</h2>
      <ul className="info-list">
        {DELIVERY.map((d) => (
          <li key={d.id}>
            <strong>{d.title}</strong>{d.note ? ` (${d.note})` : ''}: {d.cost === 0 ? 'бесплатно' : `от ${formatPrice(deliveryCost(d.id, REGIONS[0].name))}`}
          </li>
        ))}
      </ul>
      <h2>Способы оплаты</h2>
      <ul className="info-list">
        {PAYMENTS.map((p) => <li key={p.id}>{p.title}</li>)}
      </ul>
      <h2>Возврат</h2>
      <p>Возврат возможен в течение 14 дней, если товар не подошёл.</p>
    </>
  )
}

function Faq() {
  return (
    <div className="faq">
      {FAQ.map(([q, a]) => (
        <details key={q} className="faq__item">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  )
}

function About() {
  return (
    <>
      <p>{SHOP_NAME} - интернет-магазин товаров для сада и огорода: семена овощей и цветов, саженцы, удобрения, инструмент, всё для теплиц и полива.</p>
      <p>Это учебный проект. Контакты, цены и ассортимент на сайте приведены для примера.</p>
      <h2>Связаться с нами</h2>
      <ul className="info-list">
        <li>Телефон: {CONTACTS.phone}</li>
        <li>E-mail: {CONTACTS.email}</li>
        <li>Время работы: {CONTACTS.hours}</li>
      </ul>
    </>
  )
}

const PAGES = { delivery: Delivery, faq: Faq, about: About }

export default function InfoPage() {
  const { slug } = useParams()
  const page = INFO_LINKS.find((l) => l.slug === slug)
  useDocumentTitle(page?.title || 'Страница не найдена')
  if (!page) return <NotFound />
  const Body = PAGES[slug]
  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: page.title }]} />
      <h1 className="page-title">{page.title}</h1>
      <div className="info">
        <Body />
        <p><Link to="/catalog" className="btn btn--outline">Перейти в каталог</Link></p>
      </div>
    </div>
  )
}
