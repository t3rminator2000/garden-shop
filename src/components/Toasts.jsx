import Icon from './Icon'
import { useUI } from '../context/UIContext'

// Всплывающие уведомления. Не забирают фокус, озвучиваются скринридером.
export default function Toasts() {
  const { toasts, dismissToast } = useUI()
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <Icon name={t.type === 'error' ? 'alert' : t.type === 'success' ? 'check' : 'info'} size={18} />
          <span>{t.text}</span>
          <button type="button" className="toast__close" onClick={() => dismissToast(t.id)} aria-label="Закрыть уведомление">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
