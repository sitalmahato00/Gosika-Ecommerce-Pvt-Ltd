import axios from 'axios'

const rawApi = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
})

rawApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('gosika_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

rawApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gosika_token')
      localStorage.removeItem('gosika_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

// In-memory cache & in-flight request deduplication maps
const cache = new Map()
const inFlight = new Map()

// Helper to build canonical cache key
function getCacheKey(url, params = {}) {
  const sortedParams = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
  return `${url}::${sortedParams}`
}

// TTL configuration by route pattern (in milliseconds)
function getTTL(url = '') {
  if (url.includes('/platform/config') || url.includes('/categories') || url.includes('/brands')) {
    return 120000 // 2 minutes
  }
  if (url.includes('/marketplace/stores')) {
    return 60000 // 1 minute
  }
  if (url.includes('/admin/analytics') || url.includes('/admin/dashboard')) {
    return 30000 // 30 seconds
  }
  if (url.includes('/products')) {
    return 45000 // 45 seconds
  }
  return 20000 // 20 seconds default
}

// Clone response object so callers can safely read without mutating cached instance
function cloneResponse(res) {
  if (!res) return res
  return {
    ...res,
    data: typeof res.data === 'object' && res.data !== null ? JSON.parse(JSON.stringify(res.data)) : res.data,
  }
}

// Clear cache helper on mutations or manual refresh
export function invalidateCache(prefix) {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const k of cache.keys()) {
    if (k.includes(prefix)) {
      cache.delete(k)
    }
  }
}

// Cached GET wrapper with deduplication and SWR
async function cachedGet(url, config = {}) {
  if (config.skipCache || config.headers?.['Cache-Control'] === 'no-cache') {
    return rawApi.get(url, config)
  }

  const key = getCacheKey(url, config.params)
  const ttl = getTTL(url)
  const now = Date.now()
  const cached = cache.get(key)

  // 1. Fresh Cache Hit -> Instant 0ms return!
  if (cached && (now - cached.timestamp < ttl)) {
    return cloneResponse(cached.response)
  }

  // 2. In-flight request deduplication -> wait on already dispatched promise
  if (inFlight.has(key)) {
    const res = await inFlight.get(key)
    return cloneResponse(res)
  }

  // 3. Stale Cache -> Return stale immediately, revalidate silently in background
  if (cached && (now - cached.timestamp < ttl * 3)) {
    const bgPromise = rawApi.get(url, config)
      .then((fresh) => {
        cache.set(key, { response: fresh, timestamp: Date.now() })
        return fresh
      })
      .catch(() => {})
      .finally(() => {
        inFlight.delete(key)
      })
    inFlight.set(key, bgPromise)
    return cloneResponse(cached.response)
  }

  // 4. Cold miss -> Fetch, deduplicate, cache, and return
  const fetchPromise = rawApi.get(url, config)
    .then((res) => {
      cache.set(key, { response: res, timestamp: Date.now() })
      return res
    })
    .finally(() => {
      inFlight.delete(key)
    })

  inFlight.set(key, fetchPromise)
  return fetchPromise
}

// Create proxy API client
const api = new Proxy(rawApi, {
  get(target, prop) {
    if (prop === 'get') {
      return cachedGet
    }
    if (prop === 'clearCache') {
      return invalidateCache
    }
    if (['post', 'put', 'patch', 'delete'].includes(prop)) {
      return async (...args) => {
        const res = await target[prop](...args)
        const url = args[0] || ''
        if (url.includes('/products') || url.includes('/categories')) {
          invalidateCache('/products')
          invalidateCache('/categories')
        } else if (url.includes('/orders') || url.includes('/cart')) {
          invalidateCache('/orders')
          invalidateCache('/cart')
          invalidateCache('/admin/analytics')
        } else if (url.includes('/stores') || url.includes('/vendor')) {
          invalidateCache('/stores')
          invalidateCache('/marketplace')
        } else {
          invalidateCache()
        }
        return res
      }
    }
    return target[prop]
  },
})

export default api
