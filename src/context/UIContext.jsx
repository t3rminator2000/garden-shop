import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const showToast = useCallback(
    (text, type = 'info', ms = 3500) => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-2), { id, text, type }])
      setTimeout(() => dismissToast(id), ms)
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({ cartOpen, openCart, closeCart, toasts, showToast, dismissToast }),
    [cartOpen, openCart, closeCart, toasts, showToast, dismissToast],
  )
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI нужно вызывать внутри UIProvider')
  return ctx
}
