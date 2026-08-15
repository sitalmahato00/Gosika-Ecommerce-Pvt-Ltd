import React from 'react'
import { money } from '../../utils/format'

export default function PriceTag({ price, compareAt, size = 'md' }) {
  const discount =
    compareAt && Number(compareAt) > Number(price)
      ? Math.round(((Number(compareAt) - Number(price)) / Number(compareAt)) * 100)
      : null
  return (
    <div className="flex items-center gap-2 wrap">
      <span className="price-current" style={{ fontSize: size === 'lg' ? 22 : size === 'sm' ? 14 : 16 }}>
        {money(price)}
      </span>
      {discount && (
        <>
          <span className="price-old" style={{ fontSize: size === 'lg' ? 15 : 12 }}>
            {money(compareAt)}
          </span>
          <span className="discount-tag">{discount}% OFF</span>
        </>
      )}
    </div>
  )
}
