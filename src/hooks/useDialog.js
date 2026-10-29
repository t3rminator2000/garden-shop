import { useEffect } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Поведение диалога: Escape закрывает, Tab не выходит за пределы окна,
// фон не прокручивается, фокус возвращается на кнопку, которая открыла окно.
export function useDialog(open, onClose, ref) {
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const node = ref.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusables = () => (node ? [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null) : [])
    const first = focusables()[0]
    ;(first || node)?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !node) return
      const list = focusables()
      if (!list.length) return e.preventDefault()
      const a = list[0]
      const z = list[list.length - 1]
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault()
        z.focus()
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault()
        a.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (previous && typeof previous.focus === 'function') previous.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}
