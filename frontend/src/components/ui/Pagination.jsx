import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page = 1, lastPage = 1, total, perPage, onChange }) {
  if (lastPage <= 1) return null

  const pages = []
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) pages.push(p)
  }
  const items = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push('...')
    items.push(p)
  })

  return (
    <div className="flex items-center justify-between wrap gap-3 mt-3" style={{ padding: '4px 0' }}>
      {total != null && (
        <span className="muted text-sm">
          {total.toLocaleString()} item{total !== 1 ? 's' : ''}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          className="icon-btn btn-sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {items.map((it, i) =>
          it === '...' ? (
            <span key={`e${i}`} className="muted text-sm" style={{ padding: '0 4px' }}>
              …
            </span>
          ) : (
            <button
              key={it}
              className="icon-btn btn-sm"
              style={
                it === page
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : undefined
              }
              onClick={() => onChange(it)}
              aria-current={it === page ? 'page' : undefined}
            >
              {it}
            </button>
          ),
        )}
        <button
          className="icon-btn btn-sm"
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
