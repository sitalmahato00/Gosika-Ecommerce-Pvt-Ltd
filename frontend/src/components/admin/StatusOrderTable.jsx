import React, { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { statusTint, STATUS_FILTERS } from '../../utils/statusTints'

const TINT_BADGE = {
  success: { color: '#047857', bg: 'rgba(209,250,229,0.85)' },
  transit: { color: '#7e22ce', bg: 'rgba(243,232,255,0.85)' },
  processing: { color: '#0369a1', bg: 'rgba(224,242,254,0.85)' },
  pending: { color: '#b45309', bg: 'rgba(254,243,199,0.85)' },
  danger: { color: '#be123c', bg: 'rgba(255,228,230,0.85)' },
}

/**
 * Status-tinted data table.
 *
 * props:
 *  - columns: [{ key, label, render?(row), cls? }]
 *  - rows:    [row]
 *  - getStatus: (row) => string   (resolved to a tint theme)
 *  - statusFilterProp / onStatusFilter (controlled) OR internalFiler (default)
 *  - searchPlaceholder, searchKeys: [string] or (row)=>string
 *  - perPage
 *  - rowKey
 *  - rowTo (optional) link builder for clickable rows
 *  - emptyText
 *
 * Rows receive a left 4px tint border + light tinted background + staggered
 * fade/translate entrance tied to the active filter/search key.
 */
export default function StatusOrderTable({
  columns = [],
  rows = [],
  getStatus = (r) => (r && r.status) || 'pending',
  statusFilter = 'all',
  onStatusFilter,
  showStatusFilter = true,
  searchPlaceholder = 'Search…',
  searchKeys = [],
  perPage = 10,
  rowKey = (r, i) => i,
  rowTo,
  emptyText = 'No records match your current filters.',
  stickyFirstColumn = false,
}) {
  const [internalFilter, setInternalFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const activeFilter = onStatusFilter ? statusFilter : internalFilter

  const filtered = useMemo(() => {
    let list = rows
    if (activeFilter !== 'all') {
      const target = activeFilter
      list = list.filter((r) => getTintKey(getStatus(r)) === target)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = (r) => {
        if (searchKeys.length) {
          return searchKeys.map((k) => (typeof k === 'function' ? k(r) : r?.[k])).join(' ').toLowerCase()
        }
        return Object.values(r || {}).join(' ').toLowerCase()
      }
      list = list.filter((r) => haystack(r).includes(q))
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, activeFilter, search, searchKeys])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  const setFilter = (f) => {
    setInternalFilter(f)
    setPage(1)
    if (onStatusFilter) onStatusFilter(f)
  }

  const themeOf = (row) => TINT_BADGE[getTintKey(getStatus(row))] || TINT_BADGE.pending

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Toolbar: search + status filter pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 190, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder={searchPlaceholder}
            style={{
              width: '100%', height: 34, paddingLeft: 30, paddingRight: 10, fontSize: 12.5,
              borderRadius: 8, border: '1px solid var(--border)', background: '#f8fafc',
              color: '#1e293b', outline: 'none', transition: 'all .15s ease',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#ff5500'; e.target.style.background = '#fff' }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = '#f8fafc' }}
          />
        </div>

        {showStatusFilter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map((f) => {
              const active = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className="btn-tactile"
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: active ? '#ff5500' : '#e2e8f0',
                    background: active ? '#ff5500' : '#f8fafc',
                    color: active ? '#ffffff' : '#475569',
                    textTransform: 'capitalize', transition: 'all .15s ease',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#fafbfc', borderBottom: '1px solid var(--border)', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {columns.map((c) => (
                <th key={c.key} style={{ padding: '11px 16px', fontWeight: 700, ...(stickyFirstColumn && c.sticky ? { position: 'sticky', left: 0, background: '#fafbfc', zIndex: 2 } : {}) }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '44px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {emptyText}
                </td>
              </tr>
            ) : paged.map((row, i) => {
              const tint = statusTint(getStatus(row))
              const badge = themeOf(row)
              return (
                <tr
                  key={rowKey(row, i)}
                  className="status-row"
                  style={{
                    background: tint.row,
                    borderLeft: `4px solid ${tint.border}`,
                    borderBottom: '1px solid rgba(226,232,240,0.6)',
                    transition: 'background .18s ease',
                    animation: 'stagger-in .35s ease both',
                    animationDelay: `${i * 30}ms`,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = tint.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = tint.row)}
                >
                  {columns.map((c) => (
                    <td key={c.key} style={{ padding: '12px 16px', color: '#334155', ...(stickyFirstColumn && c.sticky ? { position: 'sticky', left: 0, background: tint.row, zIndex: 1 } : {}) }}>
                      {c.render ? c.render(row, badge, tint) : (row?.[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: counts + pagination */}
      <div style={{ padding: '11px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, background: '#fafbfc' }}>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>
          {filtered.length === 0 ? '0 results' : `Showing ${(safePage - 1) * perPage + 1}–${Math.min(safePage * perPage, filtered.length)} of ${filtered.length}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.5 : 1 }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ minWidth: 64, textAlign: 'center', fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            style={{ width: 28, height: 28, borderRadius: 7, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: '#fff', color: '#475569', cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.5 : 1 }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes stagger-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* Return the canonical filter key for a status string */
function getTintKey(status) {
  const wantedSeeds = [
    ['success', /deliver|complete|fulfill|pod|capture|success/],
    ['transit', /transit|route|out\b|pickup|pick|courier|shipped|handover|hand\s*off/],
    ['processing', /process|ready|pack|confirmed|preparing/],
    ['pending', /pending|review|verif|wait|submitted|screening/],
    ['danger', /cancel|refund|fail|reject|return|rto|claim|dispute|void/],
  ]
  const s = String(status || '').toLowerCase().replace(/[_-\s]+/g, ' ')
  for (const [key, re] of wantedSeeds) {
    if (re.test(s)) return key
  }
  return 'pending'
}
