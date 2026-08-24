// Simple, fast in-memory cache for instant navigation without full-page reloads
const cache = new Map()

export function getCached(key) {
  return cache.get(key) || null
}

export function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(key) {
  if (key) cache.delete(key)
  else cache.clear()
}
