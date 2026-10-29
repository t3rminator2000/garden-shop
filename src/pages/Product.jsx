import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import ProductGrid from '../components/ProductGrid'
import ProductImage from '../components/ProductImage'
import QuantityStepper from '../components/QuantityStepper'
import Rating from '../components/Rating'
import { SelectField, TextField } from '../components/Fields'
import { ErrorState, Spinner } from '../components/States'
import NotFound from './NotFound'
import { ApiError, catalogApi } from '../api'
import { RELATED_BY_SUB, getCategory, getSub } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext'
import { useFavorites } from '../context/FavoritesContext'
import { useUI } from '../context/UIContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { addViewed } from '../hooks/useViewed'
import { formatDate, formatPrice, formatRating, reviewsLabel } from '../utils/format'
import { validateName, validateRequired } from '../utils/validators'

const SECTIONS = [
  { id: 'description', label: () => 'Описание' },
  { id: 'specs', label: () => 'Характеристики' },
  { id: 'reviews', label: (p) => `Отзывы (${p.reviewsCount})` },
  { id: 'questions', label: (p) => `Вопросы и ответы (${p.questions.length})` },
]

const STAR_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n})` }))
const SLOTS_WITHOUT_PHOTOS = 5

async function loadSimilar(p) {
  const same = (await catalogApi.queryProducts({ category: p.category, sub: p.sub, perPage: 20 })).items.filter((x) => x.id !== p.id)
  const list = same.slice(0, 3)
  const relatedId = RELATED_BY_SUB[p.sub]
  if (relatedId && relatedId !== p.id) {
    const rel = await catalogApi.getProduct(relatedId)
    if (rel) list.push(rel)
  }
  if (list.length < 4) {
    const more = (await catalogApi.queryProducts({ category: p.category, perPage: 20 })).items.filter((x) => x.id !== p.id && !list.some((l) => l.id === x.id))
    list.push(...more.slice(0, 4 - list.length))
  }
  return list.slice(0, 4)
}

export default function Product() {
  const { id } = useParams()
  const { data: product, loading, error, reload } = useAsync(() => catalogApi.getProduct(id), [id])
  const similar = useAsync(() => (product ? loadSimilar(product) : Promise.resolve([])), [product?.id])
  useDocumentTitle(product?.title || (loading ? 'Загрузка' : 'Товар не найден'))

  useEffect(() => {
    if (product) addViewed(product.id)
  }, [product?.id])

  if (error) return <div className="container section"><ErrorState error={error} onRetry={reload} /></div>
  if (loading && !product) return <div className="container section" style={{ textAlign: 'center' }}><Spinner /></div>
  if (!product) return <NotFound />

  return (
    <ProductView key={product.id} product={product} similar={similar} onChanged={reload} />
  )
}

function ProductView({ product, similar, onChanged }) {
  const navigate = useNavigate()
  const { add } = useCart()
  const fav = useFavorites()
  const compare = useCompare()
  const { showToast } = useUI()
  const [qty, setQty] = useState(1)
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [section, setSection] = useState('description')
  const cat = getCategory(product.category)
  const sub = getSub(product.category, product.sub)
  const isFav = fav.has(product.id)
  const inCompare = compare.has(product.id)

  // Фото-слоты: настоящие картинки или пять заглушек, как в макете
  const slots = Math.max(product.images.length, product.images.length ? 1 : SLOTS_WITHOUT_PHOTOS)
  const labelOf = (i) => (i === 0 ? 'Главное фото товара (увеличение по клику)' : `Фото ${i + 1}`)

  // Вкладки подсвечиваются по мере прокрутки страницы
  useEffect(() => {
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean)
    if (!('IntersectionObserver' in window)) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setSection(visible.target.id)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [product.id])

  const goTo = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setSection(sectionId)
  }

  const addToCart = () => {
    const res = add(product, qty)
    if (!res.ok) {
      showToast('Товара нет в наличии', 'error')
      return false
    }
    showToast(res.capped ? 'В корзину добавлено максимально доступное количество' : `«${product.title}» добавлен в корзину`, res.capped ? 'info' : 'success')
    return true
  }
  const buyNow = () => {
    if (addToCart()) navigate('/checkout')
  }

  const photoLabel = (i) => (i === 0 ? 'Главное фото товара' : `Фото ${i + 1}`)

  return (
    <div className="container section section--tight">
      <Breadcrumbs
        items={[
          { label: 'Главная', to: '/' },
          { label: 'Каталог', to: '/catalog' },
          { label: cat?.title || 'Товары', to: cat ? `/catalog/${cat.slug}` : '/catalog' },
          ...(sub ? [{ label: sub.title, to: `/catalog/${cat.slug}?sub=${sub.slug}` }] : []),
          { label: product.title },
        ]}
      />

      <div className="product">
        <div className="gallery">
          <button type="button" className="gallery__main" onClick={() => setZoom(true)} aria-label={`Увеличить фото: ${product.title}`}>
            <ProductImage product={product} index={active} label={labelOf(active)} className="gallery__img" iconSize={44} />
            <span className="gallery__zoom"><Icon name="zoom" size={20} /></span>
          </button>
          {slots > 1 && (
            <ul className="gallery__thumbs">
              {Array.from({ length: slots }, (_, i) => i).filter((i) => i !== active).map((i) => (
                <li key={i}>
                  <button type="button" className="gallery__thumb" onClick={() => setActive(i)} aria-label={`Показать ${photoLabel(i).toLowerCase()}`}>
                    <ProductImage product={product} index={i} label={`Фото ${i + 1}`} iconSize={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="product__info">
          <h1 className="product__title">{product.title}</h1>
          <p className="product__meta">
            Артикул: {product.sku} · Категория: {cat ? <Link to={`/catalog/${cat.slug}`}>{cat.title}</Link> : '-'}
          </p>
          <div className="product__rating">
            <Rating value={product.rating} />
            <button type="button" className="link-btn" onClick={() => goTo('reviews')}>{reviewsLabel(product.reviewsCount)}</button>
          </div>
          <div className="product__price">
            <strong>{formatPrice(product.finalPrice)}</strong>
            {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
            {product.discount > 0 && <span className="badge badge--accent">−{product.discount}%</span>}
          </div>
          <div>
            <span className={`badge ${product.inStock ? 'badge--in' : 'badge--out'}`}>{product.inStock ? 'В наличии' : 'Нет в наличии'}</span>
            {product.inStock && product.stock <= 10 && <span className="product__left"> Осталось {product.stock} шт.</span>}
          </div>

          {product.inStock && (
            <div className="product__qty">
              <span className="product__qty-label" id="qty-label">Количество</span>
              <QuantityStepper value={qty} max={Math.min(product.stock, 99)} onChange={setQty} label="Количество" />
            </div>
          )}

          <div className="product__buttons">
            <button type="button" className="btn btn--primary btn--lg" onClick={addToCart} disabled={!product.inStock}>В корзину</button>
            <button type="button" className="btn btn--outline btn--lg" onClick={buyNow} disabled={!product.inStock}>Купить сейчас</button>
          </div>
          <div className="product__extra">
            <button
              type="button"
              className="btn btn--outline product__fav"
              aria-pressed={isFav}
              onClick={() => showToast(fav.toggle(product.id) ? 'Добавлено в избранное' : 'Удалено из избранного', 'info')}
            >
              <Icon name="heart" size={18} filled={isFav} /> {isFav ? 'В избранном' : 'В избранное'}
            </button>
            <button
              type="button"
              className="btn btn--outline product__fav"
              aria-pressed={inCompare}
              onClick={() => {
                const res = compare.toggle(product.id)
                if (res.state === 'full') return showToast(`В сравнении уже ${res.max} товара. Уберите лишний`, 'info')
                showToast(res.state === 'added' ? 'Товар добавлен к сравнению' : 'Товар убран из сравнения', 'info')
              }}
            >
              <Icon name="compare" size={18} /> {inCompare ? 'В сравнении' : 'Сравнить'}
            </button>
          </div>

          <section className="info-box" aria-labelledby="delivery-box">
            <h2 id="delivery-box" className="info-box__title">Доставка и оплата</h2>
            <p>Почта России, пункт выдачи, самовывоз, курьер. Стоимость зависит от региона и считается при оформлении заказа.</p>
            <p>Оплата: картой онлайн, через СБП или при получении.</p>
            <p>Возврат: в течение 14 дней, если товар не подошёл.</p>
          </section>
        </div>
      </div>

      <nav className="anchor-tabs" aria-label="Разделы страницы товара">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" className={`anchor-tabs__btn${section === s.id ? ' is-active' : ''}`} aria-current={section === s.id ? 'true' : undefined} onClick={() => goTo(s.id)}>
            {s.label(product)}
          </button>
        ))}
      </nav>

      <section id="description" className="product-section">
        <h2>Описание</h2>
        <p className="product-section__text">{product.description || 'Описание скоро появится.'}</p>
      </section>

      <section id="specs" className="product-section">
        <h2>Характеристики</h2>
        {product.specs.length ? (
          <dl className="specs">
            {product.specs.map(([name, value]) => (
              <div key={name} className="specs__row"><dt>{name}</dt><dd>{value}</dd></div>
            ))}
          </dl>
        ) : <p className="muted-note">Характеристики не указаны.</p>}
      </section>

      <ReviewsBlock product={product} onChanged={onChanged} />
      <QuestionsBlock product={product} onChanged={onChanged} />

      <section className="product-section" aria-labelledby="similar-title">
        <h2 id="similar-title">Похожие товары</h2>
        <ProductGrid items={similar.data || []} loading={similar.loading} skeletons={4} columns={4} />
      </section>

      <Modal open={zoom} onClose={() => setZoom(false)} title={product.title} size="lg" hideTitle>
        <div className="zoom">
          <ProductImage product={product} index={active} label={labelOf(active)} className="zoom__img" iconSize={64} />
        </div>
      </Modal>
    </div>
  )
}

function ReviewsBlock({ product, onChanged }) {
  const { user } = useAuth()
  const { showToast } = useUI()
  const [form, setForm] = useState({ author: user?.name || '', stars: '5', text: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const total = product.reviews.length
  const count = (n) => product.reviews.filter((r) => r.stars === n).length

  const submit = async (e) => {
    e.preventDefault()
    const next = {
      author: validateName(form.author),
      text: form.text.trim().length < 5 ? 'Напишите отзыв не короче 5 символов' : '',
    }
    setErrors(next)
    if (next.author || next.text) return
    setBusy(true)
    try {
      await catalogApi.addReview(product.id, { author: form.author, stars: Number(form.stars), text: form.text })
      showToast('Спасибо, отзыв добавлен', 'success')
      setForm({ ...form, text: '', stars: '5' })
      onChanged()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось отправить отзыв', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="reviews" className="product-section" aria-labelledby="reviews-title">
      <h2 id="reviews-title">Отзывы</h2>
      <div className="reviews">
        <aside className="reviews__summary">
          <p className="reviews__avg">{total ? formatRating(product.rating) : '-'}</p>
          <Rating value={product.rating} count={total} showValue={false} />
          <ul className="bars">
            {[5, 4, 3, 2, 1].map((n) => (
              <li key={n} className="bars__row">
                <span className="bars__label">{n}★</span>
                <span className="bars__track"><span className="bars__fill" style={{ width: `${total ? (count(n) / total) * 100 : 0}%` }} /></span>
                <span className="bars__num">{count(n)}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="reviews__list">
          {total === 0 && <p className="muted-note">Отзывов пока нет. Станьте первым.</p>}
          {product.reviews.slice(0, 6).map((r) => (
            <article key={r.id} className="review">
              <header className="review__head"><strong>{r.author}</strong><time dateTime={r.date}>{formatDate(r.date)}</time></header>
              <Rating value={r.stars} showValue={false} size={14} />
              <p>{r.text}</p>
            </article>
          ))}
          {total > 6 && <p className="muted-note">Показаны 6 последних отзывов из {total}.</p>}

          <form className="form-box" onSubmit={submit} noValidate>
            <h3>Оставить отзыв</h3>
            <TextField label="Ваше имя" value={form.author} error={errors.author} maxLength={60} autoComplete="name" onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <SelectField label="Оценка" value={form.stars} options={STAR_OPTIONS} onChange={(e) => setForm({ ...form, stars: e.target.value })} />
            <TextField label="Текст отзыва" multiline rows={4} value={form.text} error={errors.text} maxLength={1000} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <button type="submit" className="btn btn--primary" disabled={busy}>Отправить отзыв</button>
          </form>
        </div>
      </div>
    </section>
  )
}

function QuestionsBlock({ product, onChanged }) {
  const { user } = useAuth()
  const { showToast } = useUI()
  const [form, setForm] = useState({ author: user?.name || '', text: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const next = {
      author: validateName(form.author),
      text: validateRequired(form.text, 'Напишите вопрос') || (form.text.trim().length < 5 ? 'Вопрос не короче 5 символов' : ''),
    }
    setErrors(next)
    if (next.author || next.text) return
    setBusy(true)
    try {
      await catalogApi.addQuestion(product.id, { author: form.author, text: form.text })
      showToast('Вопрос отправлен. Магазин ответит на странице товара', 'success')
      setForm({ ...form, text: '' })
      onChanged()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Не удалось отправить вопрос', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="questions" className="product-section" aria-labelledby="questions-title">
      <h2 id="questions-title">Вопросы и ответы</h2>
      <div className="qa">
        <div className="qa__list">
          {product.questions.length === 0 && <p className="muted-note">Вопросов пока нет.</p>}
          {product.questions.map((q) => (
            <article key={q.id} className="review">
              <header className="review__head"><strong>{q.author}</strong><time dateTime={q.date}>{formatDate(q.date)}</time></header>
              <p>{q.text}</p>
              {q.answer ? (
                <div className="answer">
                  <header className="review__head"><strong>{q.answer.author}</strong><time dateTime={q.answer.date}>{formatDate(q.answer.date)}</time></header>
                  <p>{q.answer.text}</p>
                </div>
              ) : (
                <p className="muted-note">Ответ магазина появится здесь.</p>
              )}
            </article>
          ))}
        </div>
        <form className="form-box" onSubmit={submit} noValidate>
          <h3>Задать вопрос</h3>
          <TextField label="Ваше имя" value={form.author} error={errors.author} maxLength={60} autoComplete="name" onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <TextField label="Ваш вопрос" multiline rows={4} value={form.text} error={errors.text} maxLength={500} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          <button type="submit" className="btn btn--primary" disabled={busy}>Отправить вопрос</button>
        </form>
      </div>
    </section>
  )
}
