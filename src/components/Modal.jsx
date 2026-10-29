import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { useDialog } from '../hooks/useDialog'

// Диалоговое окно: подтверждение удаления, увеличение фото
export default function Modal({ open, title, onClose, children, size = 'md', hideTitle = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useDialog(open, onClose, ref)
  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal__head">
          <h2 id={titleId} className={`modal__title${hideTitle ? ' sr-only' : ''}`}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть окно">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
