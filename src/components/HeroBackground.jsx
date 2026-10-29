import { useState } from 'react'
import FlowerField from './FlowerField'

// Фон баннера: рисованное поле цветов (FlowerField).
// Своё видео подключается через .env: VITE_HERO_VIDEO=/video/hero.mp4.
// Файл кладут в папку public. Без этой переменной играет только рисунок.
function shouldPlayVideo() {
  const src = import.meta.env.VITE_HERO_VIDEO
  if (!src || src === 'off') return false
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  if (window.innerWidth < 576) return false
  if (navigator.connection?.saveData) return false
  return true
}

export default function HeroBackground() {
  const [enabled] = useState(shouldPlayVideo)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = import.meta.env.VITE_HERO_VIDEO

  return (
    <div className="hero-bg" aria-hidden="true">
      <FlowerField />
      {enabled && !failed && (
        <video
          className={`hero-bg__video${ready ? ' is-ready' : ''}`}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setReady(true)}
          onError={() => setFailed(true)}
        />
      )}
      <div className="hero-bg__shade" />
    </div>
  )
}
