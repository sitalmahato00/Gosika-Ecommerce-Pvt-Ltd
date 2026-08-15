import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="empty-state">
      <div className="es-icon">
        <AlertTriangle size={40} strokeWidth={1.5} />
      </div>
      <h3 style={{ marginBottom: 6 }}>Oops, an error occurred</h3>
      <p className="muted" style={{ maxWidth: 420, margin: '0 auto 16px' }}>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
