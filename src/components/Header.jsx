import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from './Icon'
import SearchBox from './SearchBox'
import { CATEGORIES, SHOP_NAME } from '../constants'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCompare } from '../context/CompareContext'
import { useFavorites } from '../context/FavoritesContext'
import { useUI } from '../context/UIContext'

// Шапка из макета: логотип, «Каталог», поиск, «Избранное», «Личный кабинет», «Корзина (N)»
export default function Header() {
  const { isAuth } = useAuth()
  const { totalQty } = useCart()
  const { count: compareCount } = useCompare()
  const { count: favCount } = useFavorites()
  const { openCart } = useUI()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => setMenuOpen(false), [location.pathname, location.search])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onDown = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setMenuOpen(false)
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  return (
    <header className="header">
      <div className="container header__bar" ref={wrapRef}>
        <Link to="/" className="logo" aria-label={`${SHOP_NAME}, на главную`}>
          <Icon name="leaf" size={22} strokeWidth={1.8} />
          <span>{SHOP_NAME}</span>
        </Link>

        <button
          type="button"
          className="btn btn--outline header__catalog"
          aria-expanded={menuOpen}
          aria-controls="catalog-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Icon name="menu" size={18} />
          <span>Каталог</span>
        </button>

        <div className="header__search">
          <SearchBox />
        </div>

        <nav className="header__nav" aria-label="Личные разделы">
          {compareCount > 0 && (
            <NavLink to="/compare" className="header__link">
              <Icon name="compare" size={20} />
              <span className="header__label">Сравнение</span>
              <span className="header__badge" aria-label={`в сравнении ${compareCount}`}>{compareCount}</span>
            </NavLink>
          )}
          <NavLink to="/favorites" className="header__link">
            <Icon name="heart" size={20} />
            <span className="header__label">Избранное</span>
            {favCount > 0 && <span className="header__badge" aria-label={`в избранном ${favCount}`}>{favCount}</span>}
          </NavLink>
          <NavLink to={isAuth ? '/profile' : '/login'} className="header__link">
            <Icon name="user" size={20} />
            <span className="header__label">Личный кабинет</span>
          </NavLink>
          <button type="button" className="header__link header__cart" onClick={openCart} aria-haspopup="dialog" aria-label={`Корзина, товаров: ${totalQty}`}>
            <Icon name="cart" size={20} />
            <span className="header__label">Корзина ({totalQty})</span>
            <span className="header__badge header__badge--mobile" aria-hidden="true">{totalQty}</span>
          </button>
        </nav>

        {menuOpen && (
          <div className="catalog-menu" id="catalog-menu">
            <div className="catalog-menu__grid">
              {CATEGORIES.map((c) => (
                <div key={c.slug} className="catalog-menu__col">
                  <Link to={`/catalog/${c.slug}`} className="catalog-menu__title">{c.title}</Link>
                  <ul>
                    {c.subs.map((s) => (
                      <li key={s.slug}>
                        <Link to={`/catalog/${c.slug}?sub=${s.slug}`}>{s.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link to="/catalog" className="btn btn--outline catalog-menu__all">Весь каталог</Link>
          </div>
        )}
      </div>
    </header>
  )
}
