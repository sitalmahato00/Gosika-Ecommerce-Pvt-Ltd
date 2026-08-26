import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  badge,
  badgeColor = 'blue',
  actions,
  children
}) {
  return (
    <div className="admin-page-header" style={{ marginBottom: 20 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: 8 }}>
          <ol style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: 0, listStyle: 'none', fontSize: 12, color: 'var(--muted)' }}>
            <li>
              <Link to="/admin" style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
                Admin
              </Link>
            </li>
            {breadcrumbs.map((crumb, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={12} color="#94a3b8" />
                {crumb.to && i < breadcrumbs.length - 1 ? (
                  <Link to={crumb.to} style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: 0, letterSpacing: '-0.02em' }}>
              {title}
            </h1>
            {badge && (
              <span className={`badge badge-${badgeColor}`} style={{ fontSize: 12, fontWeight: 700 }}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0', lineHeight: 1.4 }}>
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div style={{ marginTop: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}
