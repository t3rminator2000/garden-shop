import { LS } from '../constants'
import { readStorage, writeStorage } from '../utils/storage'

const LIMIT = 12

export function getViewedIds() {
  const v = readStorage(LS.viewed, [])
  return Array.isArray(v) ? v.filter(Number.isFinite) : []
}

export function addViewed(id) {
  const n = Number(id)
  if (!Number.isFinite(n)) return
  writeStorage(LS.viewed, [n, ...getViewedIds().filter((x) => x !== n)].slice(0, LIMIT))
}
