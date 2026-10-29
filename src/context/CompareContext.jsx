import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { COMPARE_MAX, LS } from '../constants'
import { readStorage, writeStorage } from '../utils/storage'

const CompareContext = createContext(null)

const sanitize = (raw) =>
  Array.isArray(raw) ? [...new Set(raw.map(Number).filter(Number.isFinite))].slice(0, COMPARE_MAX) : []

// Список товаров для сравнения. Хранится в localStorage, не больше COMPARE_MAX позиций.
export function CompareProvider({ children }) {
  const [ids, setIds] = useState(() => sanitize(readStorage(LS.compare, [])))

  useEffect(() => {
    writeStorage(LS.compare, ids)
  }, [ids])
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === LS.compare) setIds(sanitize(readStorage(LS.compare, [])))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Возвращает, что получилось: added - добавили, removed - убрали, full - список заполнен
  const toggle = useCallback(
    (id) => {
      const n = Number(id)
      if (!Number.isFinite(n)) return { state: 'error' }
      if (ids.includes(n)) {
        setIds((prev) => prev.filter((x) => x !== n))
        return { state: 'removed' }
      }
      if (ids.length >= COMPARE_MAX) return { state: 'full', max: COMPARE_MAX }
      setIds((prev) => [...prev, n])
      return { state: 'added', count: ids.length + 1 }
    },
    [ids],
  )

  const remove = useCallback((id) => setIds((prev) => prev.filter((x) => x !== Number(id))), [])
  const clear = useCallback(() => setIds([]), [])

  const value = useMemo(
    () => ({ ids, count: ids.length, max: COMPARE_MAX, has: (id) => ids.includes(Number(id)), toggle, remove, clear }),
    [ids, toggle, remove, clear],
  )
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare нужно вызывать внутри CompareProvider')
  return ctx
}
