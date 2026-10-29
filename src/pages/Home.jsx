import { Link } from 'react-router-dom'
import HeroBackground from '../components/HeroBackground'
import Icon from '../components/Icon'
import PhotoPlaceholder from '../components/PhotoPlaceholder'
import ProductGrid from '../components/ProductGrid'
import { ErrorState } from '../components/States'
import { catalogApi } from '../api'
import { CATEGORIES } from '../constants'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

const BENEFITS = [
  { icon: 'truck', title: 'Доставка по России', text: 'Стоимость зависит от региона' },
  { icon: 'card', title: 'Оплата картой и СБП', text: 'Или при получении' },
  { icon: 'store', title: 'Самовывоз', text: 'Из офиса магазина, бесплатно' },
]

function ProductSection({ title, to, request }) {
  const { data, loading, error, reload } = useAsync(request, [])
  return (
    <section className="section container" aria-labelledby={`h-${to}`}>
      <div className="section__head">
        <h2 id={`h-${to}`} className="section__title">{title}</h2>
        <Link to={to} className="section__more">
          Смотреть все <Icon name="arrow-right" size={16} />
        </Link>
      </div>
      {error ? <ErrorState error={error} onRetry={reload} /> : <ProductGrid items={data?.items} loading={loading} skeletons={4} columns={4} />}
    </section>
  )
}

export default function Home() {
  useDocumentTitle('')
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <HeroBackground />
        <div className="container hero__content">
          <h1 id="hero-title" className="hero__title">Весенняя распродажа семян: скидки на популярные сорта</h1>
          <Link to="/catalog?sale=1" className="btn btn--light btn--lg">Смотреть акции</Link>
        </div>
      </section>

      <section className="section container" aria-labelledby="cats-title">
        <h2 id="cats-title" className="section__title">Категории</h2>
        <ul className="cat-grid">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link to={`/catalog/${c.slug}`} className="cat-tile">
                <PhotoPlaceholder label="Фото" className="cat-tile__photo" />
                <span className="cat-tile__name">{c.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ProductSection title="Новинки" to="/catalog?new=1" request={() => catalogApi.queryProducts({ isNew: true, perPage: 4, sort: 'new' })} />
      <ProductSection title="Хит продаж" to="/catalog?hit=1" request={() => catalogApi.queryProducts({ isHit: true, perPage: 4 })} />

      <section className="section container" aria-label="Преимущества магазина">
        <ul className="benefits">
          {BENEFITS.map((b) => (
            <li key={b.title} className="benefit">
              <span className="benefit__icon"><Icon name={b.icon} size={24} strokeWidth={1.4} /></span>
              <div>
                <h3 className="benefit__title">{b.title}</h3>
                <p className="benefit__text">{b.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
