import React from 'react'

const VARIANTS = ['draft', 'pending', 'pending_review', 'active', 'approved', 'published', 'in_stock', 'low_stock', 'out_of_stock', 'suspended', 'rejected', 'cancelled', 'failed', 'accepted', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'paid', 'completed', 'initiated', 'processing', 'confirmed', 'preparing', 'ready_for_pickup', 'returned', 'returned_to_vendor', 'refunded', 'payment_pending', 'under_review', 'verified', 'info', 'default', 'danger', 'success', 'warning']

export default function Badge({ children, variant = 'default', dot }) {
  const v = VARIANTS.includes(variant) ? variant : 'default'
  return (
    <span className={`badge badge-${v}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', display: 'inline-block' }} />}
      {children}
    </span>
  )
}
