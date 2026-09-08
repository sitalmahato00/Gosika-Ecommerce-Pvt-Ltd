import React, { useEffect, useState } from 'react'
import { Search, RotateCcw, Filter } from 'lucide-react'
import { useDebouncedValue } from '../../utils/useDebounce'

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by name, ID, reference...',
  statusFilter,
  onStatusChange,
  statusOptions = [],
  segmented = false,
  debounceMs = 0,
  extraFilters,
  onReset,
  showReset = true,
  children
}) {
  const hasActiveFilters = Boolean(search || (statusFilter && statusFilter !== 'all'))

  // Opt-in debounce: local input value drives the visible box; onSearchChange
  // fires `debounceMs` later. When debounceMs is 0, behavior is unchanged.
  const [local, setLocal] = useState(search || '')
  const debounced = useDebouncedValue(local, debounceMs || 400)
  const [raf, setRaf] = useState(false)

  useEffect(() => {
    setLocal(search || '')
  }, [search])

  useEffect(() => {
    if (!debounceMs || !raf) return
    onSearchChange && onSearchChange(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, raf])

  const handleInput = (v) => {
    setLocal(v)
    if (!debounceMs) {
      onSearchChange && onSearchChange(v)
    } else {
      setRaf(true)
    }
  }

  return (
    <div
      className="card"
      style={{
        padding: '14px 18px',
        borderRadius: 12,
        marginBottom: 16,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, flex: 1, minWidth: 260 }}>
        {/* Search Input */}
        {onSearchChange && (
          <div style={{ position: 'relative', minWidth: 220, maxWidth: 360, flex: 1 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              className="input"
              value={local}
              onChange={e => handleInput(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                paddingLeft: 34,
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                width: '100%',
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
              }}
            />
          </div>
        )}

        {/* Status Dropdown */}
        {(statusOptions.length > 0 && !segmented) && (
          <div style={{ minWidth: 140 }}>
            <select
              className="input"
              value={statusFilter || 'all'}
              onChange={e => onStatusChange(e.target.value)}
              style={{
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Segmented sliding filter pill */}
        {statusOptions.length > 0 && segmented && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: '#f1f5f9',
              padding: 3,
              borderRadius: 10,
              overflowX: 'auto',
              maxWidth: '100%'
            }}
          >
            {[{ value: 'all', label: 'All' }, ...statusOptions].map(opt => {
              const active = (statusFilter || 'all') === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onStatusChange(opt.value)}
                  className="btn-tactile"
                  style={{
                    border: 'none',
                    whiteSpace: 'nowrap',
                    background: 'transparent',
                    color: active ? '#ff5500' : '#64748b',
                    fontWeight: 700,
                    fontSize: 11.5,
                    padding: '6px 13px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        {extraFilters}

        {/* Reset Filters */}
        {showReset && hasActiveFilters && onReset && (
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-tactile"
            onClick={onReset}
            style={{
              height: 36,
              color: '#64748b',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600
            }}
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {children && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {children}
        </div>
      )}
    </div>
  )
}