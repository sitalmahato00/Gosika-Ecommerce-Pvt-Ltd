export function money(value, options = {}) {
  const n = Number(value || 0)
  const symbol = options.symbol !== undefined ? options.symbol : 'रु'
  const prefix = symbol ? `${symbol}\u00A0` : ''
  return prefix + n.toLocaleString('en-IN', {
    minimumFractionDigits: options.decimals !== undefined ? options.decimals : 2,
    maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
  })
}

/**
 * Safe image error handler — call as onError={handleImgError}
 *
 * What it does:
 *  1. Immediately sets e.target.onerror = null → breaks infinite retry loops
 *  2. Replaces broken src with a lightweight inline SVG placeholder
 *     (no external requests → no CORB, no 1,500-request storm)
 *
 * ⚠️  NEVER do `e.target.src = 'https://...'` in onError without first
 *     setting `e.target.onerror = null`. If the fallback URL also fails
 *     (e.g. blocked by CORB), the browser fires onError again →
 *     infinite loop → "Page Unresponsive" crash.
 */
export function handleImgError(e) {
  e.target.onerror = null // ← must be first; breaks the infinite loop
  e.target.src = IMG_PLACEHOLDER
}

// Inline SVG placeholder — zero network requests, works offline, CORB-safe
export const IMG_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f1f5f9'/%3E%3Crect x='60' y='55' width='80' height='65' rx='6' fill='%23cbd5e1'/%3E%3Ccircle cx='100' cy='135' r='20' fill='%23cbd5e1'/%3E%3Ccircle cx='82' cy='76' r='10' fill='%23e2e8f0'/%3E%3Cpath d='M60 120 l25-28 20 22 14-16 21 22' fill='%23e2e8f0'/%3E%3C/svg%3E"



export function apiImage(path) {
  if (!path) {
    return IMG_PLACEHOLDER
  }
  const cleanPath = String(path).replace(/^.*?\/storage\/(https?:\/\/)/i, '$1')
  if (/^https?:\/\//.test(cleanPath)) return cleanPath
  if (/^data:/.test(cleanPath)) return cleanPath
  if (cleanPath.startsWith('/storage/')) return cleanPath
  return `/storage/${cleanPath}`
}

export function getProductImage(product, index = 0, isFallback = false) {
  if (!product) return IMG_PLACEHOLDER
  if (!isFallback) {
    const explicit = product.primary_image?.url ||
      product.images?.[index]?.url ||
      product.primary_image ||
      product.image ||
      product.cover_image

    if (explicit && typeof explicit === 'string' && explicit.trim()) {
      return apiImage(explicit)
    }
  }

  return IMG_PLACEHOLDER
}

export const FALLBACK_STORE_BANNERS = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80', // Artisan Shop / Boutique
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', // Modern Retail Store
  'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80', // Cozy Storefront
  'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80', // Electronics & Gadgets Shop
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80', // Organic Food & Tea Market
]

export const FALLBACK_STORE_LOGOS = [
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80',
]

export function getStoreImage(store) {
  if (!store) return FALLBACK_STORE_LOGOS[0]
  const explicit = store.logo_url || store.logo || store.image || store.avatar
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return apiImage(explicit)
  }
  const name = store.name || store.company_name || store.store_name || ''
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return FALLBACK_STORE_LOGOS[hash % FALLBACK_STORE_LOGOS.length]
}

export function getStoreBanner(store) {
  if (!store) return FALLBACK_STORE_BANNERS[0]
  const explicit = store.banner_url || store.banner || store.cover_image || store.cover
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return apiImage(explicit)
  }
  const name = store.name || store.company_name || store.store_name || ''
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return FALLBACK_STORE_BANNERS[hash % FALLBACK_STORE_BANNERS.length]
}

export function formatDate(value, opts = {}) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...opts })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export function discountPercent(price, compareAt) {
  const p = Number(price || 0)
  const c = Number(compareAt || 0)
  if (c > p && p > 0) return Math.round(((c - p) / c) * 100)
  return null
}

export function titleCase(str = '') {
  return str
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

export function humanizeEnum(value = '') {
  return titleCase(String(value))
}

export function timeAgo(dateString) {
  if (!dateString) return 'Just now'
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} mins ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs} ${diffHrs === 1 ? 'hr' : 'hrs'} ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data

  // 1. Structured validation errors object: extract exact messages into clean readable text
  if (data?.errors && typeof data.errors === 'object') {
    const list = Object.values(data.errors).flat().filter(Boolean)
    if (list.length > 0) {
      return list.join(' ')
    }
  }

  // 2. Exact message from API if present and not a generic placeholder
  if (data?.message && typeof data.message === 'string') {
    const msg = data.message.trim()
    const generic = ['Validation failed.', 'The given data was invalid.', 'An error occurred', 'Server Error']
    if (msg && !generic.includes(msg)) {
      return msg
    }
  }

  // 3. Fallback to data.message if available
  if (data?.message && typeof data.message === 'string' && data.message.trim()) {
    return data.message
  }

  // 4. Axios error message if network error
  if (err?.message === 'Network Error') {
    return 'Network error. Check your connection and try again.'
  }

  // 5. Fallback
  return fallback
}
