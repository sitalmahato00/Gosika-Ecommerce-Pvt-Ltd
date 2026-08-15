import React from 'react'

export function Skeleton({ width, height, style, className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, width }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={width || `${100 - i * 12}%`} />
      ))}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
      <Skeleton height={190} className="product-img" />
      <div style={{ padding: 14 }}>
        <Skeleton height={14} width="85%" style={{ marginBottom: 10 }} />
        <Skeleton height={12} width="55%" style={{ marginBottom: 10 }} />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
  )
}

export function ProductCardSkeletonMini() {
  return (
    <div className="card card-pad-none skeleton-mini" style={{ overflow: 'hidden' }}>
      <Skeleton height={120} className="product-img" />
      <div style={{ padding: 8 }}>
        <Skeleton height={10} width="60%" />
        <Skeleton height={10} width="40%" />
      </div>
    </div>
  )
}

export function PageSkeleton({ cards = 8, grid = true }) {
  return (
    <div className={grid ? 'product-grid' : 'grid'}>
      {Array.from({ length: cards }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}) {
  return (
    <div className="empty-state" style={{ padding: '32px 16px' }}>
      <div className="es-icon" style={{ width: 48, height: 48, margin: '0 auto 12px' }}>{icon}</div>
      <h3 className="es-title" style={{ textAlign: 'center', marginBottom: 8 }}>{title}</h3>
      <p className="es-message" style={{ textAlign: 'center', marginBottom: 16, color: 'var(--muted)' }}>{message}</p>
      {action && <div className="es-action" style={{ textAlign: 'center' }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" style={{ padding: '32px 16px', textAlign: 'center' }}>
      <p className="es-error" style={{ color: 'var(--danger)', marginBottom: 16 }}>{message}</p>
      <button onClick={onRetry} className="es-retry-btn" style={{ background: 'var(--primary)', color: 'var(--white)', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  )
}