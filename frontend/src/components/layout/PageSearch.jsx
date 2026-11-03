import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function getPages(nav = []) {
  let section = ''

  return nav.flatMap((item) => {
    if (item.section) {
      section = item.section
      return []
    }

    return item.to && item.label
      ? [{ to: item.to, label: item.label, section }]
      : []
  })
}

export default function PageSearch({ nav, placeholder = 'Search pages...', className = '', style }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const searchId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const pages = useMemo(() => getPages(nav), [nav])
  const normalizedQuery = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!normalizedQuery) return []

    const terms = normalizedQuery.split(/\s+/)
    return pages
      .map((page) => {
        const label = page.label.toLowerCase()
        const section = page.section.toLowerCase()
        const path = page.to.toLowerCase().replace(/[/-]+/g, ' ')
        const searchable = `${label} ${section} ${path}`
        if (!terms.every((term) => searchable.includes(term))) return null

        const score = label === normalizedQuery ? 0
          : label.startsWith(normalizedQuery) ? 1
            : label.includes(normalizedQuery) ? 2
              : section.includes(normalizedQuery) ? 3
                : 4
        return { ...page, score }
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score || a.label.localeCompare(b.label))
      .slice(0, 8)
  }, [normalizedQuery, pages])

  useEffect(() => {
    setQuery('')
    setFocused(false)
    setActiveIndex(0)
  }, [location.pathname])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setFocused(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    setActiveIndex(0)
  }, [normalizedQuery])

  const goToPage = (page) => {
    if (!page) return
    navigate(page.to)
    setQuery('')
    setFocused(false)
    inputRef.current?.blur()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (results.length) goToPage(results[Math.min(activeIndex, results.length - 1)])
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setFocused(false)
      inputRef.current?.blur()
    } else if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    }
  }

  const showResults = focused && normalizedQuery.length > 0

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', ...style }}>
      <form onSubmit={handleSubmit} role="search">
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: 20,
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-label="Search portal pages"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={`${searchId}-results`}
          aria-activedescendant={showResults && results[activeIndex] ? `${searchId}-result-${activeIndex}` : undefined}
          value={query}
          onFocus={() => setFocused(true)}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 40,
            padding: '0 20px 0 40px',
            fontSize: 13.5,
            background: '#f1f5f9',
            color: '#1e293b',
            borderRadius: 9999,
            border: '1px solid transparent',
            outline: 'none',
            boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
            transition: 'box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease',
          }}
        />
      </form>

      {showResults && (
        <div
          id={`${searchId}-results`}
          role="listbox"
          aria-label="Matching pages"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            background: '#fff',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
          }}
        >
          {results.length ? results.map((page, index) => (
            <button
              id={`${searchId}-result-${index}`}
              key={page.to}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => goToPage(page)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%',
                padding: '10px 14px',
                border: 0,
                borderBottom: index < results.length - 1 ? '1px solid #f1f5f9' : 0,
                background: index === activeIndex ? '#fff7ed' : '#fff',
                color: '#1e293b',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{page.label}</span>
              {page.section && (
                <span style={{ marginTop: 2, color: '#64748b', fontSize: 11 }}>{page.section}</span>
              )}
            </button>
          )) : (
            <div style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>
              No matching pages found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
