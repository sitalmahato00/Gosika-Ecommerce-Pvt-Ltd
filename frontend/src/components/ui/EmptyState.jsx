import React from 'react'
import { PackageSearch } from 'lucide-react'

export default function EmptyState({ icon: Icon = PackageSearch, title, message, action, size = 40 }) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <Icon size={size} strokeWidth={1.5} />
      </div>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {message && <p className="muted" style={{ maxWidth: 420, margin: '0 auto 16px' }}>{message}</p>}
      {action}
    </div>
  )
}
