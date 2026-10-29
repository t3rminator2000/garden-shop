import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import { PasswordField, TextField } from '../components/Fields'
import { ApiError } from '../api'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatPhone, passwordStrength, validateEmail, validateName, validatePassword, validatePhone } from '../utils/validators'

const STRENGTH = {
  weak: { text: 'Простой пароль', cls: 'weak' },
  ok: { text: 'Хороший пароль', cls: 'ok' },
  strong: { text: 'Надёжный пароль', cls: 'strong' },
}

// Вход и регистрация на одной странице (макет «Авторизация»)
export default function AuthPage({ mode }) {
  const { isAuth } = useAuth()
  const location = useLocation()
  useDocumentTitle(mode === 'register' ? 'Регистрация' : 'Вход')
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : null
  if (isAuth) return <Navigate to={from || '/profile'} replace />

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Вход' }]} />
      <h1 className="page-title">Вход и регистрация</h1>
      <div className="auth">
        <LoginForm from={from} autoFocus={mode !== 'register'} />
        <RegisterForm from={from} autoFocus={mode === 'register'} />
      </div>
      <p className="muted-note auth__note">После входа вы вернётесь на страницу, с которой начали</p>
    </div>
  )
}

function LoginForm({ from, autoFocus }) {
  const { login } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()
  const [form, setForm] = useState({ id: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.password) {
      setError('Введите e-mail и пароль')
      return
    }
    setBusy(true)
    setError('')
    try {
      const s = await login(form.id, form.password)
      showToast(`Добро пожаловать, ${s.name.split(' ')[0]}`, 'success')
      navigate(from || '/profile', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти. Попробуйте ещё раз')
      setBusy(false)
    }
  }

  return (
    <form className="panel auth__form" onSubmit={submit} noValidate aria-labelledby="login-title">
      <h2 id="login-title" className="panel__title">Вход</h2>
      <TextField label="E-mail" name="email" autoComplete="username" autoFocus={autoFocus} placeholder="name@example.ru" value={form.id} maxLength={100} onChange={(e) => setForm({ ...form, id: e.target.value })} />
      <PasswordField label="Пароль" name="password" autoComplete="current-password" placeholder="••••••" value={form.password} maxLength={100} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      {error && <p className="form-alert" role="alert"><Icon name="alert" size={18} /> {error}</p>}
      <Link to="/forgot-password" className="auth__forgot">Забыли пароль?</Link>
      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
      <p className="auth__hint">
        Нет аккаунта? Зарегистрируйтесь <span className="only-wide">справа</span><span className="only-narrow">ниже</span>
      </p>
      <Link to="/checkout" className="btn btn--outline btn--block">Оформить заказ без регистрации</Link>

      <details className="demo">
        <summary>Учебные записи для проверки</summary>
        <ul>
          <li>Администратор: admin@garden.local, пароль Admin2026</li>
          <li>Покупатель с заказами: demo@garden.local, пароль Demo2026</li>
          <li>Через DummyJSON: логин emilys, пароль emilyspass (нужен интернет)</li>
        </ul>
      </details>
    </form>
  )
}

function RegisterForm({ from, autoFocus }) {
  const { register } = useAuth()
  const { showToast } = useUI()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const errors = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone, { required: false }),
    password: validatePassword(form.password),
    confirm: !form.confirm ? 'Повторите пароль' : form.confirm !== form.password ? 'Пароли не совпадают' : '',
  }
  const shown = (k) => (touched[k] ? errors[k] : '') || serverErrors[k] || ''
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }))
  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setServerErrors((s) => ({ ...s, [k]: '' }))
  }
  const strength = form.password ? STRENGTH[passwordStrength(form.password)] : null

  const submit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true })
    setError('')
    if (Object.values(errors).some(Boolean)) {
      setTimeout(() => e.target.querySelector('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    setBusy(true)
    try {
      await register(form)
      showToast('Аккаунт создан', 'success')
      navigate(from || '/profile', { replace: true })
    } catch (err) {
      if (err.fields) setServerErrors(err.fields)
      else setError(err instanceof ApiError ? err.message : 'Не удалось зарегистрироваться. Попробуйте ещё раз')
      setBusy(false)
    }
  }

  return (
    <form className="panel auth__form" onSubmit={submit} noValidate aria-labelledby="reg-title">
      <h2 id="reg-title" className="panel__title">Регистрация</h2>
      <TextField label="Имя" name="name" autoComplete="name" autoFocus={autoFocus} placeholder="Ваше имя" value={form.name} error={shown('name')} maxLength={80} onChange={(e) => set('name', e.target.value)} onBlur={blur('name')} />
      <TextField label="E-mail" name="reg-email" type="email" autoComplete="email" placeholder="name@example.ru" value={form.email} error={shown('email')} maxLength={100} onChange={(e) => set('email', e.target.value)} onBlur={blur('email')} />
      <TextField label="Телефон" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (000) 000-00-00" value={form.phone} error={shown('phone')} onChange={(e) => set('phone', formatPhone(e.target.value))} onBlur={blur('phone')} />
      <PasswordField
        label="Пароль"
        name="new-password"
        autoComplete="new-password"
        placeholder="Придумайте пароль"
        value={form.password}
        error={shown('password')}
        hint="Не короче 8 символов, буквы и цифры"
        maxLength={100}
        onChange={(e) => set('password', e.target.value)}
        onBlur={blur('password')}
      />
      {strength && <p className={`strength strength--${strength.cls}`} aria-live="polite">{strength.text}</p>}
      <PasswordField label="Повторите пароль" name="confirm-password" autoComplete="new-password" placeholder="Ещё раз пароль" value={form.confirm} error={shown('confirm')} maxLength={100} onChange={(e) => set('confirm', e.target.value)} onBlur={blur('confirm')} />
      {error && <p className="form-alert" role="alert"><Icon name="alert" size={18} /> {error}</p>}
      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>{busy ? 'Создаём…' : 'Зарегистрироваться'}</button>
    </form>
  )
}
