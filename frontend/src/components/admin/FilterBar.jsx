import React from 'react'
import { Search, RotateCcw, Filter } from 'lucide-react'

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search by name, ID, reference...',
  statusFilter,
  onStatusChange,
  statusOptions = [],
  extraFilters,
  onReset,
  showReset = true,
  children
}) {
  const hasActiveFilters = Boolean(search || (statusFilter && statusFilter !== 'all'))

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
              value={search || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                paddingLeft: 34,
                height: 36,
                fontSize: 13,
                borderRadius: 8,
                width: '100%'
              }}
            />
          </div>
        )}

        {/* Status Dropdown */}
        {statusOptions.length > 0 && (
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

        {extraFilters}

        {/* Reset Filters */}
        {showReset && hasActiveFilters && onReset && (
          <button
            type="button"
            className="btn btn-ghost btn-xs"
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
