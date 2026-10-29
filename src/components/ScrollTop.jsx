import { useEffect, useState } from 'react'
import Icon from './Icon'

// Кнопка «Наверх». Появляется, когда страница прокручена больше чем на два экрана,
// и возвращает к началу плавно. При включённой экономии движения прокрутка мгновенная.
export default function ScrollTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 1.2)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const up = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      className={`scroll-top${show ? ' is-visible' : ''}`}
      onClick={up}
      aria-label="Наверх страницы"
      tabIndex={show ? 0 : -1}
      aria-hidden={show ? undefined : 'true'}
    >
      <Icon name="chevron-up" size={22} strokeWidth={2} />
    </button>
  )
}
