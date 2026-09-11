import React, { createContext, useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'

export const AccountNavContext = createContext({ label: 'My Account', setLabel: () => {} })
export const useAccountNav = () => useContext(AccountNavContext)

/** Registers a dynamic page label (used by the mobile account toolbar). */
export function AccountTitle({ label }) {
  const { setLabel } = useAccountNav()
  useEffect(() => { setLabel(label || 'My Account') }, [label, setLabel])
  return null
}

/** Consistent page shell with header for every account sub-page. */
export function AccountPage({ title, subtitle, actions, children, spacing = 20, className = '' }) {
  const { setLabel } = useAccountNav()
  useEffect(() => { setLabel(title || 'My Account') }, [title, setLabel])

  return (
    <div className={`account-page ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: spacing, minWidth: 0 }}>
      <header className="account-page-head">
        <div className="account-page-head-title">
          <h1 className="account-page-title">{title}</h1>
          {subtitle && <p className="account-page-sub">{subtitle}</p>}
        </div>
        {actions && (
          <div className="account-page-actions">{actions}</div>
        )}
      </header>
      {children}
    </div>
  )
}

/** A card with an optional header row (icon + title + subtitle + trailing action). */
export function AccountSection({ title, subtitle, icon: Icon, action, children, pad = 22, className = '' }) {
  return (
    <section className={`card ${className}`} style={{ padding: pad, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      {(title || action) && (
        <div className="account-sec-head">
          {Icon && (
            <span className="account-sec-icon">
              <Icon size={17} strokeWidth={2} />
            </span>
          )}
          <div className="account-sec-titles">
            <h2 className="account-sec-title">{title}</h2>
            {subtitle && <p className="account-sec-sub">{subtitle}</p>}
          </div>
          {action && <div className="account-sec-action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Uniform loading state for account pages. */
export function AccountSkeleton({ rows = 3, height = 96, header = true, asCards = true }) {
  return (
    <div className="account-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {header && <Skeleton height={26} width={220} />}
      {header && <Skeleton height={14} width={340} style={{ maxWidth: '70%' }} />}
      {Array.from({ length: rows }).map((_, i) => (
        asCards
          ? <div key={i} className="card" style={{ padding: 18 }}><Skeleton height={height} /></div>
          : <Skeleton key={i} height={height} />
      ))}
    </div>
  )
}

/** Uniform empty state for account pages (wrapped in a card). */
export function AccountEmpty({ icon, title, message, action, ...rest }) {
  return (
    <div className="card">
      <EmptyState icon={icon} title={title} message={message} action={action} {...rest} />
    </div>
  )
}

/** Uniform error state for account pages. */
export function AccountError({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="card">
      <ErrorState message={message} onRetry={onRetry} />
    </div>
  )
}

/** Responsive auto-fill grid used across account pages. */
export function AccountGrid({ children, min = 200, gap = 14, className = '', style = {} }) {
  return (
    <div
      className={`account-grid ${className}`}
      style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap, minWidth: 0, ...style }}
    >
      {children}
    </div>
  )
}

/** Small KPI / action tile used on dashboards. */
export function AccountStat({ icon: Icon, label, value, sub, to, tone = 'primary' }) {
  const content = (
    <div className="account-stat">
      <span className="account-stat-icon" style={{ background: `var(--${tone}-50, var(--primary-50))`, color: `var(--${tone}, var(--primary))` }}>
        <Icon size={19} strokeWidth={2} />
      </span>
      <div className="account-stat-body">
        <div className="account-stat-value">{value}</div>
        <div className="account-stat-label">{label}</div>
        {sub && <div className="account-stat-sub">{sub}</div>}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="account-stat-link" aria-label={label}>
        {content}
      </Link>
    )
  }
  return content
}