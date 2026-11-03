import React, { useEffect, useState } from 'react'
import { Search, RotateCcw, X } from 'lucide-react'
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
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApplyFilters,
  applying = false,
  hasActiveFilters: hasActiveFiltersOverride,
  children
}) {
  const hasDateFilters = typeof onFromDateChange === 'function' || typeof onToDateChange === 'function'
  const hasActiveFilters = hasActiveFiltersOverride ?? Boolean(
    search ||
    (statusFilter && statusFilter !== 'all') ||
    fromDate ||
    toDate
  )

  const [local, setLocal] = useState(search || '')
  const debounced = useDebouncedValue(local, debounceMs || 400)
  const [raf, setRaf] = useState(false)
  const dateRangeValid = !fromDate || !toDate || fromDate <= toDate

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

  const submitFilters = () => {
      if (!dateRangeValid || applying) return
      if (debounceMs && onSearchChange) onSearchChange(local.trim())
      onApplyFilters?.()
  }

  return (
      <div
        className="card"
        style={{
          padding: 16,
          borderRadius: 12,
          marginBottom: 16,
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 0
        }}
      >
        {onSearchChange && (
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none'
              }}
            />
            <input
              type="search"
              className="input"
              value={local}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submitFilters()
                }
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              style={{
                paddingLeft: 38,
                paddingRight: local ? 38 : 12,
                height: 42,
                fontSize: 13,
                borderRadius: 9,
                width: '100%',
                transition: 'box-shadow 0.15s ease, border-color 0.15s ease'
              }}
            />
            {local && (
              <button
                type="button"
                onClick={() => handleInput('')}
                aria-label="Clear search"
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 28,
                  height: 28,
                  border: 0,
                  borderRadius: 6,
                  background: 'transparent',
                  color: '#64748b',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: hasDateFilters ? 'flex-end' : 'center', flexWrap: 'wrap', gap: 8, width: '100%' }}>
          {statusOptions.length > 0 && !segmented && (
            <div style={{ flex: '1 1 150px', minWidth: 130, maxWidth: 220 }}>
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
                aria-label="Filter by status"
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

        {hasDateFilters && (
          <>
            <label style={{ display: 'flex', flex: '1 1 150px', flexDirection: 'column', gap: 4, minWidth: 135, maxWidth: 190 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>From date</span>
              <input
                type="date"
                className="input"
                value={fromDate || ''}
                max={toDate || undefined}
                onChange={e => onFromDateChange?.(e.target.value)}
                style={{ height: 36, fontSize: 13, borderRadius: 8 }}
              />
            </label>
            <label style={{ display: 'flex', flex: '1 1 150px', flexDirection: 'column', gap: 4, minWidth: 135, maxWidth: 190 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em' }}>To date</span>
              <input
                type="date"
                className="input"
                value={toDate || ''}
                min={fromDate || undefined}
                onChange={e => onToDateChange?.(e.target.value)}
                style={{ height: 36, fontSize: 13, borderRadius: 8 }}
              />
            </label>
            {!dateRangeValid && (
              <span role="alert" style={{ flexBasis: '100%', color: '#b91c1c', fontSize: 12 }}>
                From date must be on or before the to date.
              </span>
            )}
          </>
        )}

        {(onApplyFilters || (showReset && hasActiveFilters && onReset)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: onApplyFilters ? 'auto' : 0 }}>
            {showReset && onReset && (onApplyFilters || hasActiveFilters) && (
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
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
            {onApplyFilters && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={submitFilters}
                disabled={!dateRangeValid || applying}
                style={{ height: 36, whiteSpace: 'nowrap' }}
              >
                {applying ? 'Applying…' : 'Apply filters'}
              </button>
            )}
          </div>
        )}

        {children && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>}
      </div>
    </div>
  )
}