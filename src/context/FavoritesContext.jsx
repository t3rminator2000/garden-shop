import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LS } from '../constants'
import { readStorage, writeStorage } from '../utils/storage'

const FavoritesContext = createContext(null)

const sanitize = (raw) => (Array.isArray(raw) ? [...new Set(raw.map(Number).filter(Number.isFinite))] : [])

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState(() => sanitize(readStorage(LS.favorites, [])))

  useEffect(() => {
    writeStorage(LS.favorites, ids)
  }, [ids])
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS.favorites) setIds(sanitize(readStorage(LS.favorites, [])))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = useCallback(
    (id) => {
      const added = !ids.includes(id)
      setIds((prev) => (added ? [id, ...prev.filter((x) => x !== id)] : prev.filter((x) => x !== id)))
      return added
    },
    [ids],
  )

  const value = useMemo(() => ({ ids, count: ids.length, has: (id) => ids.includes(id), toggle }), [ids, toggle])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites нужно вызывать внутри FavoritesProvider')
  return ctx
}
