/**
 * Status-tinted theme system used across all portal order/parcel tables.
 *
 * Every status resolves to one of 5 canonical visual families. Each family
 * exports a row background + hover, a 4px left border accent, and a pill
 * badge text/bg so every table in the platform renders consistently.
 */
const THEMES = {
  success: {
    row: 'rgba(236, 253, 245, 0.6)',
    rowHover: 'rgba(209, 250, 229, 0.75)',
    border: '#10b981',
    badgeText: '#047857',
    badgeBg: 'rgba(209, 250, 229, 0.85)',
    label: 'Delivered',
  },
  transit: {
    row: 'rgba(250, 245, 255, 0.6)',
    rowHover: 'rgba(243, 232, 255, 0.75)',
    border: '#a855f7',
    badgeText: '#7e22ce',
    badgeBg: 'rgba(243, 232, 255, 0.85)',
    label: 'In Transit',
  },
  processing: {
    row: 'rgba(240, 249, 255, 0.6)',
    rowHover: 'rgba(224, 242, 254, 0.75)',
    border: '#0ea5e9',
    badgeText: '#0369a1',
    badgeBg: 'rgba(224, 242, 254, 0.85)',
    label: 'Processing',
  },
  pending: {
    row: 'rgba(255, 251, 235, 0.6)',
    rowHover: 'rgba(254, 243, 199, 0.75)',
    border: '#f59e0b',
    badgeText: '#b45309',
    badgeBg: 'rgba(254, 243, 199, 0.85)',
    label: 'Pending',
  },
  danger: {
    row: 'rgba(255, 241, 242, 0.6)',
    rowHover: 'rgba(255, 228, 230, 0.75)',
    border: '#f43f5e',
    badgeText: '#be123c',
    badgeBg: 'rgba(255, 228, 230, 0.85)',
    label: 'Cancelled',
  },
}

const STATUS_KEYWORDS = [
  { keys: ['deliver', 'complete', 'fulfill', 'pod', 'capture', 'success'], theme: 'success' },
  { keys: ['transit', 'route', 'out', 'pickup', 'pick', 'courier', 'handover', 'hand off', 'shipped'], theme: 'transit' },
  { keys: ['process', 'ready', 'pack', 'preparing', 'confirmed'], theme: 'processing' },
  { keys: ['pending', 'review', 'verif', 'submitted', 'screening', 'wait'], theme: 'pending' },
  { keys: ['cancel', 'refund', 'fail', 'reject', 'return', 'rto', 'claim', 'void', 'dispute', 'error'], theme: 'danger' },
]

const DEFAULT_THEME = 'pending'

export function resolveStatusTheme(status) {
  const s = String(status || '').toLowerCase().replace(/[_-]+/g, ' ').trim()
  if (!s) return THEMES[DEFAULT_THEME]

  for (const group of STATUS_KEYWORDS) {
    if (group.keys.some((k) => s.includes(k))) return THEMES[group.theme]
  }
  return THEMES[DEFAULT_THEME]
}

export function statusTint(status) {
  return resolveStatusTheme(status)
}

/**
 * A left-border CSS style object. Pass to a <tr> style.
 */
export function statusRowStyle(status, hover = false) {
  const theme = resolveStatusTheme(status)
  return {
    background: hover ? theme.rowHover : theme.row,
    borderLeft: `4px solid ${theme.border}`,
    transition: 'background 0.18s ease',
  }
}

export const STATUS_THEMES = THEMES

export const STATUS_FILTERS = [
  { key: 'all', label: 'All', theme: null },
  { key: 'delivered', label: 'Delivered', theme: THEMES.success },
  { key: 'transit', label: 'In Transit', theme: THEMES.transit },
  { key: 'processing', label: 'Processing', theme: THEMES.processing },
  { key: 'pending', label: 'Pending', theme: THEMES.pending },
  { key: 'cancelled', label: 'Cancelled', theme: THEMES.danger },
]
