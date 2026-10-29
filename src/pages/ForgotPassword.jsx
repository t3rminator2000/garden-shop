import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import Icon from '../components/Icon'
import { TextField } from '../components/Fields'
import { ApiError, authApi } from '../api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

// Восстановление пароля. Письмо не отправляется: сервера нет, поведение показано для интерфейса.
export default function ForgotPassword() {
  useDocumentTitle('Восстановление пароля')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await authApi.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить запрос')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container section section--tight">
      <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Вход', to: '/login' }, { label: 'Восстановление пароля' }]} />
      <h1 className="page-title">Восстановление пароля</h1>
      <div className="panel panel--narrow">
        {sent ? (
          <div role="status">
            <p className="success-line"><Icon name="check" size={18} /> Запрос принят</p>
            <p>Если адрес {email.trim()} есть в системе, на него придёт ссылка для смены пароля.</p>
            <p className="muted-note">В учебной версии письма не отправляются.</p>
            <Link to="/login" className="btn btn--primary">Вернуться ко входу</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <TextField label="E-mail" type="email" autoComplete="email" autoFocus placeholder="name@example.ru" value={email} error={error} onChange={(e) => setEmail(e.target.value)} hint="Укажите e-mail, с которым вы регистрировались" />
            <div className="panel__row panel__row--actions">
              <button type="submit" className="btn btn--primary" disabled={busy}>{busy ? 'Отправляем…' : 'Отправить ссылку'}</button>
              <Link to="/login" className="btn btn--ghost">Назад ко входу</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
