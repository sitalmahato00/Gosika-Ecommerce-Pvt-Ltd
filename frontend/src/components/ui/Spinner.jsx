import React from 'react'

export default function Spinner({ size = 20, color = 'currentColor', label }) {
  return (
    <span
      role="status"
      aria-label={label || 'Loading'}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }}
    />
  )
}
