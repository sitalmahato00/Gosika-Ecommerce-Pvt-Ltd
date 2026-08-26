import React from 'react'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'
import EmptyState from './EmptyState'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  pagination = null, // { current_page, last_page, total, per_page }
  onPageChange,
  emptyTitle = 'No data found',
  emptyDescription = 'No records are currently available.',
  emptyAction,
  onRowClick,
  keyField = 'id',
  selectable = false,
  selectedKeys = [],
  onSelectKey,
  onSelectAll,
  style = {}
}) {
  const allSelected = data.length > 0 && selectedKeys.length === data.length

  return (
    <div className="card card-pad-none" style={{ borderRadius: 14, overflow: 'hidden', ...style }}>
      <div className="table-wrap">
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 42, textAlign: 'center', padding: '12px 8px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => onSelectAll && onSelectAll(e.target.checked)}
                    disabled={loading || data.length === 0}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width,
                    padding: '12px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: '#f8fafc',
                    borderBottom: '1px solid var(--border)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {selectable && (
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <Skeleton width={16} height={16} />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '14px 16px' }}>
                      <Skeleton height={18} width={col.skeletonWidth || '70%'} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: '40px 20px', textAlign: 'center' }}
                >
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    style={{ border: 'none', background: 'transparent', padding: '20px 0' }}
                  />
                </td>
              </tr>
            ) : (
              data.map((item, rowIdx) => {
                const rowKey = item[keyField] || item.uuid || rowIdx
                const isSelected = selectedKeys.includes(rowKey)

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
                    }}
                    className={onRowClick ? 'hover:bg-slate-50' : ''}
                  >
                    {selectable && (
                      <td
                        style={{ width: 42, textAlign: 'center', padding: '12px 8px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => onSelectKey && onSelectKey(rowKey, e.target.checked)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    {columns.map((col, cIdx) => {
                      const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor]) : null
                      return (
                        <td
                          key={col.key || cIdx}
                          style={{
                            textAlign: col.align || 'left',
                            padding: '12px 16px',
                            fontSize: 13,
                            color: 'var(--ink)',
                            borderBottom: '1px solid var(--border)',
                            verticalAlign: 'middle'
                          }}
                        >
                          {col.render ? col.render(item, val) : (val !== null && val !== undefined ? String(val) : '—')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.total > 0 && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            background: '#fafbfc'
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
            Showing{' '}
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {Math.min((pagination.current_page - 1) * (pagination.per_page || 15) + 1, pagination.total)}
            </span>{' '}
            to{' '}
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {Math.min(pagination.current_page * (pagination.per_page || 15), pagination.total)}
            </span>{' '}
            of{' '}
            <span style={{ fontWeight: 700, color: 'var(--ink)' }}>
              {pagination.total}
            </span>{' '}
            results
          </div>

          {pagination.last_page > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => onPageChange && onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
                style={{ height: 32, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <span style={{ fontSize: 12, fontWeight: 700, padding: '0 8px', color: 'var(--ink)' }}>
                Page {pagination.current_page} of {pagination.last_page}
              </span>

              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => onPageChange && onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
                style={{ height: 32, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
