import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import { Checkbox, PasswordField, RadioOption, SelectField, TextField } from '../components/Fields'
import { EmptyState, Spinner } from '../components/States'
import { ApiError, authApi, ordersApi } from '../api'
import { DELIVERY, PAYMENTS, REGIONS, deliveryCost } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useUI } from '../context/UIContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPrice } from '../utils/format'
import { promoDiscount } from '../utils/promo'
import { formatPhone, validateEmail, validateIndex, validatePassword, validatePhone, validateRequired } from '../utils/validators'

const STEPS = ['Контакты', 'Доставка', 'Оплата', 'Подтверждение']

function validate(f) {
  const needsAddress = DELIVERY.find((d) => d.id === f.delivery)?.needsAddress
  const words = f.name.trim().split(/\s+/).filter(Boolean)
  // Для аккаунта почта обязательна: это логин
  const needsAccount = f.createAccount
  return {
    name: !f.name.trim() ? 'Введите фамилию и имя' : words.length < 2 ? 'Укажите фамилию и имя' : '',
    phone: validatePhone(f.phone),
    email: needsAccount ? validateEmail(f.email) : validateEmail(f.email, { required: false }),
    password: needsAccount ? validatePassword(f.password) : '',
    index: needsAddress ? validateIndex(f.index) : '',
    city: needsAddress ? validateRequired(f.city, 'Введите город') : '',
    street: needsAddress ? validateRequired(f.street, 'Введите улицу') : '',
    house: needsAddress ? validateRequired(f.house, 'Введите дом') : '',
    consent: f.consent ? '' : 'Нужно согласие на обработку персональных данных',
  }
}

// Оформление заказа: контакты, доставка, оплата, подтверждение (макет «Оформление заказа»)
export default function Checkout() {
  useDocumentTitle('Оформление заказа')
  const navigate = useNavigate()
  const { user, isAuth, register } = useAuth()
  const { lines, items, loading, goodsTotal, totalQty, clear, promo, promoOk, promoTitle } = useCart()
  const { showToast } = useUI()
  const formRef = useRef(null)

  const [form, setForm] = useState({
    name: '', phone: '', email: '', region: REGIONS[0].name, delivery: 'post',
    index: '', city: '', street: '', house: '', flat: '', payment: 'card', comment: '', consent: false,
    createAccount: false, password: '',
  })
  const [touched, setTouched] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Для вошедшего покупателя подставляем сохранённые данные
  useEffect(() => {
    if (!user) return
    const p = authApi.getProfile(user.key)
    setForm((f) => ({
      ...f,
      name: f.name || user.name || '',
      phone: f.phone || formatPhone(user.phone || ''),
      email: f.email || user.email || '',
      region: REGIONS.some((r) => r.name === p.address.region) ? p.address.region : f.region,
      index: f.index || p.address.index,
      city: f.city || p.address.city,
      street: f.street || p.address.street,
      house: f.house || p.address.house,
      flat: f.flat || p.address.flat,
    }))
  }, [user])

  const errors = useMemo(() => validate(form), [form])
  const show = (k) => (touched[k] || attempted ? errors[k] : '')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))

  const delivery = DELIVERY.find((d) => d.id === form.delivery)
  const shipping = deliveryCost(form.delivery, form.region)
  // Промокод действует и на товары, и на доставку: тип кода решает, на что именно
  const discount = promoOk ? promoDiscount(promo, goodsTotal, shipping) : { goodsDiscount: 0, deliveryDiscount: 0, total: 0 }
  const total = Math.max(0, goodsTotal + shipping - discount.total)

  const stepDone = [
    !errors.name && !errors.phone && !errors.email,
    !errors.index && !errors.city && !errors.street && !errors.house,
    Boolean(form.payment),
    !errors.consent,
  ]
  const current = stepDone.findIndex((d) => !d)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setAttempted(true)
    if (Object.values(errors).some(Boolean)) {
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    try {
      // Сначала аккаунт, иначе заказ не к кому привязать
      let owner = user
      if (!isAuth && form.createAccount) {
        try {
          owner = await register({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone,
            password: form.password,
            confirm: form.password,
          })
        } catch (err) {
          const msg = err?.fields?.email || (err instanceof ApiError ? err.message : 'Не удалось создать аккаунт')
          setSubmitError(`${msg}. Снимите галочку «Создать аккаунт», чтобы оформить заказ без него`)
          setBusy(false)
          return
        }
      }
      const order = await ordersApi.createOrder({
        lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        contact: { name: form.name.trim(), phone: form.phone, email: form.email.trim() },
        delivery: form.delivery,
        region: form.region,
        address: delivery.needsAddress ? { index: form.index.trim(), city: form.city.trim(), street: form.street.trim(), house: form.house.trim(), flat: form.flat.trim() } : {},
        payment: form.payment,
        comment: form.comment,
        promo: promoOk ? promo : '',
        ownerKey: owner?.key || null,
      })
      clear()
      if (!isAuth && form.createAccount) showToast('Аккаунт создан, заказ сохранён в личном кабинете', 'success')
      navigate(`/checkout/success/${order.id}`, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Не удалось оформить заказ. Попробуйте ещё раз'
      setSubmitError(msg)
      showToast(msg, 'error')
      setBusy(false)
    }
  }

  const crumbs = [{ label: 'Главная', to: '/' }, { label: 'Корзина', to: '/cart' }, { label: 'Оформление заказа' }]

  if (busy && !items.length) return <div className="container section" style={{ textAlign: 'center' }}><Spinner label="Оформляем заказ" /></div>
  if (!items.length) {
    return (
      <div className="container section section--tight">
        <Breadcrumbs items={crumbs} />
        <EmptyState icon="cart" title="В корзине пока пусто" text="Добавьте товары из каталога, чтобы оформить заказ">
          <Link to="/catalog" className="btn btn--primary">Перейти в каталог</Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={crumbs} />
      <h1 className="page-title">Оформление заказа</h1>

      <ol className="stepper" aria-label="Шаги оформления">
        {STEPS.map((s, i) => {
          const done = stepDone[i] && i < current
          return (
            <li key={s} className={`stepper__item${done ? ' is-done' : ''}${i === current ? ' is-current' : ''}`} aria-current={i === current ? 'step' : undefined}>
              <span className="stepper__num">{done ? <Icon name="check" size={14} strokeWidth={2.4} /> : i + 1}</span>
              <span className="stepper__label">{s}</span>
            </li>
          )
        })}
      </ol>

      {!isAuth && (
        <p className="guest-note" role="note">
          <Icon name="info" size={18} /> Вы оформляете заказ без регистрации. Уже есть аккаунт?{' '}
          <Link to="/login" state={{ from: '/checkout' }}>Войти</Link>
        </p>
      )}

      <form className="checkout" onSubmit={submit} noValidate ref={formRef}>
        <div className="checkout__main">
          <fieldset className="panel">
            <legend className="panel__title">1. Контакты</legend>
            <TextField label="Фамилия, имя, отчество" required value={form.name} error={show('name')} autoComplete="name" maxLength={100} onChange={(e) => set('name', e.target.value)} onBlur={blur('name')} />
            <div className="panel__row">
              <TextField label="Телефон" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (999) 999-99-99" value={form.phone} error={show('phone')} onChange={(e) => set('phone', formatPhone(e.target.value))} onBlur={blur('phone')} />
              <TextField label="E-mail" required={form.createAccount} type="email" autoComplete="email" placeholder="name@example.ru" value={form.email} error={show('email')} maxLength={100} onChange={(e) => set('email', e.target.value)} onBlur={blur('email')} />
            </div>
          </fieldset>

          <fieldset className="panel">
            <legend className="panel__title">2. Доставка</legend>
            <SelectField label="Регион" value={form.region} options={REGIONS.map((r) => ({ value: r.name, label: r.name }))} onChange={(e) => set('region', e.target.value)} hint="Способы доставки и их стоимость зависят от региона" />
            <div className="radio-list" role="radiogroup" aria-label="Способ доставки">
              {DELIVERY.map((d) => {
                const cost = deliveryCost(d.id, form.region)
                return (
                  <RadioOption key={d.id} name="delivery" value={d.id} checked={form.delivery === d.id} onChange={() => set('delivery', d.id)} label={d.title} note={d.note} price={cost === 0 ? 'Бесплатно' : formatPrice(cost)} />
                )
              })}
            </div>
            {delivery.needsAddress && (
              <div className="address">
                <div className="panel__row">
                  <TextField label="Индекс" inputMode="numeric" autoComplete="postal-code" value={form.index} error={show('index')} maxLength={6} onChange={(e) => set('index', e.target.value.replace(/\D/g, ''))} onBlur={blur('index')} />
                  <TextField label="Город" required autoComplete="address-level2" value={form.city} error={show('city')} maxLength={60} onChange={(e) => set('city', e.target.value)} onBlur={blur('city')} />
                </div>
                <TextField label="Улица" required autoComplete="address-line1" value={form.street} error={show('street')} maxLength={80} onChange={(e) => set('street', e.target.value)} onBlur={blur('street')} />
                <div className="panel__row">
                  <TextField label="Дом" required value={form.house} error={show('house')} maxLength={10} onChange={(e) => set('house', e.target.value)} onBlur={blur('house')} />
                  <TextField label="Квартира" value={form.flat} maxLength={10} onChange={(e) => set('flat', e.target.value)} />
                </div>
              </div>
            )}
            {!delivery.needsAddress && <p className="muted-note">Заказ можно забрать в офисе магазина. Адрес пришлём после подтверждения.</p>}
          </fieldset>

          <fieldset className="panel">
            <legend className="panel__title">3. Оплата</legend>
            <div className="radio-list" role="radiogroup" aria-label="Способ оплаты">
              {PAYMENTS.map((p) => (
                <RadioOption key={p.id} name="payment" value={p.id} checked={form.payment === p.id} onChange={() => set('payment', p.id)} label={p.title} />
              ))}
            </div>
          </fieldset>

          <fieldset className="panel">
            <legend className="panel__title">4. Подтверждение</legend>
            <TextField label="Комментарий к заказу" multiline rows={3} value={form.comment} maxLength={500} onChange={(e) => set('comment', e.target.value)} />
            {!isAuth && (
              <>
                <Checkbox
                  label="Создать аккаунт и сохранить заказ"
                  checked={form.createAccount}
                  onChange={(e) => set('createAccount', e.target.checked)}
                />
                {form.createAccount ? (
                  <PasswordField
                    label="Пароль для входа"
                    required
                    value={form.password}
                    error={show('password')}
                    autoComplete="new-password"
                    hint="Логином будет ваш e-mail. Статус заказа появится в личном кабинете"
                    onChange={(e) => set('password', e.target.value)}
                    onBlur={blur('password')}
                  />
                ) : (
                  <p className="muted-note">Без аккаунта статус заказа виден только на странице подтверждения. Сохраните её адрес или номер заказа.</p>
                )}
              </>
            )}
            <Checkbox label="Согласен на обработку персональных данных" checked={form.consent} error={show('consent')} onChange={(e) => set('consent', e.target.checked)} onBlur={blur('consent')} />
          </fieldset>

          {submitError && <p className="form-alert" role="alert"><Icon name="alert" size={18} /> {submitError}</p>}

          <div className="checkout__actions">
            <Link to="/cart" className="btn btn--ghost"><Icon name="arrow-left" size={16} /> Назад в корзину</Link>
            <button type="submit" className="btn btn--primary btn--lg" disabled={busy || loading}>{busy ? 'Оформляем…' : 'Подтвердить заказ'}</button>
          </div>
        </div>

        <aside className="summary summary--sticky" aria-labelledby="co-sum">
          <h2 id="co-sum" className="summary__title">Ваш заказ</h2>
          <ul className="summary__lines">
            {lines.map(({ product, qty, sum }) => (
              <li key={product.id}><span>{product.title} × {qty}</span><span>{formatPrice(sum)}</span></li>
            ))}
          </ul>
          <dl className="summary__rows">
            <div><dt>Товары ({totalQty})</dt><dd>{formatPrice(goodsTotal)}</dd></div>
            {discount.goodsDiscount > 0 && (
              <div className="summary__discount"><dt>Скидка по промокоду {promo}</dt><dd>−{formatPrice(discount.goodsDiscount)}</dd></div>
            )}
            <div>
              <dt>Доставка</dt>
              <dd>
                {shipping === 0 ? 'Бесплатно' : discount.deliveryDiscount > 0 ? (<><s className="price__old">{formatPrice(shipping)}</s> Бесплатно</>) : formatPrice(shipping)}
              </dd>
            </div>
            <div className="summary__total"><dt>Итого</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          {promoOk && <p className="summary__note"><Icon name="tag" size={14} /> {promoTitle}</p>}
        </aside>
      </form>
    </div>
  )
}
