import { useCallback, useEffect, useRef, useState } from 'react'

// Загрузка данных с состояниями loading / error и повтором запроса.
// fn должна возвращать Promise. Устаревшие ответы отбрасываются.
export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(() => fnRef.current())
      .then(
        (data) => !cancelled && setState({ data, error: null, loading: false }),
        (error) => !cancelled && setState({ data: null, error, loading: false }),
      )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
