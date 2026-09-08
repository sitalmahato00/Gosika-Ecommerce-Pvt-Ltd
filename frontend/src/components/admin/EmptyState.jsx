import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items matching your criteria at this time.',
  action,
  style = {}
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        background: '#fafbfc',
        borderRadius: 12,
        border: '1px dashed var(--border)',
        ...style
      }}
    >
      <div
        className="row-enter gpu"
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: '#f1f5f9',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          animation: 'float-in 600ms cubic-bezier(0.16,1,0.3,1) both'
        }}
      >
        <Icon size={26} />
      </div>
      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 380, margin: '6px 0 0', lineHeight: 1.45 }}>
        {description}
      </p>
      {action && (
        <div style={{ marginTop: 18 }}>
          {action}
        </div>
      )}
    </div>
  )
}
