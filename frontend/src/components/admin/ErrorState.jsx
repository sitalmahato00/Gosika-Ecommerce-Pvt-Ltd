import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information.',
  onRetry,
  style = {}
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        background: '#fff1f2',
        borderRadius: 12,
        border: '1px solid #fecdd3',
        ...style
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#fee2e2',
          color: '#e11d48',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#9f1239', margin: 0 }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: '#be123c', maxWidth: 420, margin: '6px 0 0', lineHeight: 1.45 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-sm"
          style={{
            marginTop: 16,
            background: '#e11d48',
            color: '#fff',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            borderRadius: 8
          }}
        >
          <RefreshCw size={13} />
          Retry Connection
        </button>
      )}
    </div>
  )
}
