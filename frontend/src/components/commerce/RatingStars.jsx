import React from 'react'
import { Star, StarHalf } from 'lucide-react'

export default function RatingStars({ value = 0, count, size = 14, showValue = true }) {
  const v = Number(value || 0)
  const full = Math.floor(v)
  const half = v - full >= 0.5
  return (
    <span className="flex items-center gap-1" style={{ fontSize: 12 }}>
      <span className="rating-stars" aria-label={`Rated ${v.toFixed(1)} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <Star key={i} size={size} fill="currentColor" strokeWidth={0} />
          if (i === full && half) return <StarHalf key={i} size={size} fill="currentColor" strokeWidth={0} />
          return <Star key={i} size={size} fill="none" strokeWidth={1.5} style={{ opacity: 0.35 }} />
        })}
      </span>
      {showValue && v > 0 && <span className="font-semibold">{v.toFixed(1)}</span>}
      {count != null && count > 0 && <span className="muted">({count})</span>}
    </span>
  )
}
