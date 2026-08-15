import React from 'react'
import { Minus, Plus } from 'lucide-react'

export default function QtyStepper({ value, onChange, min = 1, max = 99, disabled, compact }) {
  return (
    <div
      className="flex items-center"
      style={{
        border: '1px solid var(--border-dark)',
        borderRadius: compact ? 8 : 'var(--radius-sm)',
        overflow: 'hidden',
        background: '#fff',
        width: compact ? 92 : 116,
        height: compact ? 32 : 38,
      }}
    >
      <button
        type="button"
        className="flex-1 flex items-center justify-center"
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', height: '100%' }}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={compact ? 14 : 16} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10)
          onChange(Number.isNaN(v) ? min : Math.min(max, Math.max(min, v)))
        }}
        disabled={disabled}
        aria-label="Quantity"
        style={{
          width: 44,
          textAlign: 'center',
          border: 'none',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          background: 'transparent',
          fontSize: 14,
          fontWeight: 600,
          height: '100%',
          appearance: 'textfield',
        }}
      />
      <button
        type="button"
        className="flex-1 flex items-center justify-center"
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', height: '100%' }}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={compact ? 14 : 16} />
      </button>
    </div>
  )
}
