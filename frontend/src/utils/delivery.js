import api from '../api/client'

export const DELIVERY_STATUS_ORDER = [
  'assigned',
  'accepted',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'failed',
  'returned_to_vendor',
]

export const DELIVERY_STATUS_META = {
  assigned: { label: 'Assigned', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)' },
  accepted: { label: 'Accepted', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
  picked_up: { label: 'Picked Up', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  out_for_delivery: { label: 'Out for Delivery', color: '#ea580c', bg: 'rgba(234, 88, 12, 0.12)' },
  delivered: { label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  returned_to_vendor: { label: 'Returned to Vendor', color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
}

export const ACTIVE_STATUSES = ['assigned', 'accepted', 'picked_up', 'out_for_delivery']
export const FINAL_STATUSES = ['delivered', 'failed', 'returned_to_vendor']

export function statusMeta(status) {
  return DELIVERY_STATUS_META[status] || {
    label: String(status || '').replace(/_/g, ' '),
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
  }
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status)
}

export function isFinalStatus(status) {
  return FINAL_STATUSES.includes(status)
}

export const FAILURE_REASONS = [
  'Customer not available',
  'Address not found',
  'Customer refused delivery',
  'Incorrect contact details',
  'Vehicle breakdown or route issue',
  'Parcel damaged',
  'Other',
]

export function isSameDay(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const n = new Date()
  const start = new Date(n)
  start.setHours(0, 0, 0, 0)
  const day = n.getDay() || 7
  start.setDate(n.getDate() - day + 1)
  return d >= start
}

export function isThisMonth(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth()
}

export function completionDate(assignment) {
  if (!assignment) return null
  return (
    assignment.delivered_at ||
    assignment.failed_at ||
    assignment.out_for_delivery_at ||
    assignment.picked_up_at ||
    assignment.accepted_at ||
    assignment.assigned_at ||
    assignment.updated_at
  )
}

// Returns the logical next workflow action for a given assignment status.
export function nextStep(assignment) {
  if (!assignment) return null
  switch (assignment.status) {
    case 'assigned':
      return { type: 'accept', label: 'Accept Delivery', color: 'primary' }
    case 'accepted':
      return { type: 'pickup', label: 'Proceed to Pickup', to: `/delivery/deliveries/${assignment.id}/pickup`, color: 'primary' }
    case 'picked_up':
      return { type: 'deliver', label: 'Start Delivery', to: `/delivery/deliveries/${assignment.id}/deliver`, color: 'primary' }
    case 'out_for_delivery':
      return { type: 'deliver', label: 'Confirm Delivery', to: `/delivery/deliveries/${assignment.id}/deliver`, color: 'success' }
    case 'failed':
      return { type: 'return', label: 'Return to Vendor', color: 'outline' }
    default:
      return null
  }
}

// Passes the envelope through exactly like other list pages (e.g. /vendor/orders),
// so useList can unwrap `data` (items) and `meta.pagination`.
export function listFetcher(path, params = {}) {
  return async (page, per_page) => {
    return api.get(path, { params: { page, per_page, ...params } })
  }
}
