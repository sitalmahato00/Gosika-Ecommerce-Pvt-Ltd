import React from 'react'
import { statusMeta } from '../../utils/delivery'

export default function DeliveryStatusBadge({ status, size = 'sm' }) {
  const meta = statusMeta(status)
  return (
    <span
      className={`chip chip-${size}`}
      style={{
        background: meta.bg,
        color: meta.color,
        fontWeight: 800,
        fontSize: size === 'xs' ? 10 : 11,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {meta.label}
    </span>
  )
}
