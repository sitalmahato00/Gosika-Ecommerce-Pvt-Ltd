export function money(value) {
  const n = Number(value || 0)
  return 'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const FALLBACK_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80', // Pashmina / Shawl
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', // Headphones / Tech
  'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80', // Organic Herbal Tea
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80', // Clothing / Fashion
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80', // Spices & Herbs
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', // Shoes / Footwear
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80', // Handmade Crafts
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80', // Smartphone & Accessories
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80', // Trekking Backpack
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80', // Watch / Accessories
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80', // Skincare & Beauty
  'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80', // Kitchen & Cookware
]

const KEYWORD_IMAGE_MAP = [
  { keywords: ['pashmina', 'shawl', 'cashmere', 'wool', 'scarf'], url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' },
  { keywords: ['tea', 'herbal', 'green tea', 'organic', 'honey'], url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80' },
  { keywords: ['headphone', 'earbud', 'audio', 'speaker', 'bluetooth'], url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' },
  { keywords: ['phone', 'mobile', 'smartphone', 'gadget', 'electronic'], url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80' },
  { keywords: ['shirt', 'jacket', 'hoodie', 'dress', 'apparel', 'cloth', 'kurti'], url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80' },
  { keywords: ['shoe', 'sneaker', 'boot', 'footwear', 'sandal'], url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { keywords: ['craft', 'handmade', 'statue', 'brass', 'singing bowl', 'art'], url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80' },
  { keywords: ['spice', 'cardamom', 'ginger', 'pepper', 'dal', 'rice'], url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80' },
  { keywords: ['bag', 'backpack', 'wallet', 'purse', 'leather'], url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
  { keywords: ['watch', 'clock', 'smartwatch'], url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80' },
  { keywords: ['cream', 'lotion', 'beauty', 'cosmetic', 'serum', 'soap'], url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80' },
  { keywords: ['cook', 'pot', 'pan', 'kitchen', 'knife', 'bowl'], url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80' },
]

export function apiImage(path, fallbackKey = 0) {
  if (!path) {
    if (typeof fallbackKey === 'string') {
      const lower = fallbackKey.toLowerCase()
      const found = KEYWORD_IMAGE_MAP.find((item) => item.keywords.some((kw) => lower.includes(kw)))
      if (found) return found.url
      const hash = lower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return FALLBACK_PRODUCT_IMAGES[hash % FALLBACK_PRODUCT_IMAGES.length]
    }
    const idx = Math.abs(Number(fallbackKey) || 0)
    return FALLBACK_PRODUCT_IMAGES[idx % FALLBACK_PRODUCT_IMAGES.length]
  }
  if (/^https?:\/\//.test(path)) return path
  if (/^data:/.test(path)) return path
  if (path.startsWith('/storage/')) return path
  return `/storage/${path}`
}

export function getProductImage(product, index = 0) {
  if (!product) return FALLBACK_PRODUCT_IMAGES[0]
  const explicit = product.primary_image?.url ||
    product.images?.[index]?.url ||
    product.primary_image ||
    product.image ||
    product.cover_image

  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return apiImage(explicit)
  }

  const nameOrCategory = `${product.product_name || ''} ${product.name || ''} ${product.title || ''} ${product.category?.name || ''} ${product.category?.slug || ''}`
  return apiImage(null, nameOrCategory || product.id || index)
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
  if (data?.message) return data.message
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first)) return first[0]
    if (typeof first === 'string') return first
  }
  if (err?.message === 'Network Error') return 'Network error. Check your connection and try again.'
  return fallback
}


