import React from 'react'
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="page-shell container">
      <div className="empty-state" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="es-icon"><Compass size={40} strokeWidth={1.5} /></div>
        <h1 style={{ fontSize: 28 }}>404</h1>
        <h3>Page not found</h3>
        <p className="muted">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex items-center justify-center gap-2 wrap">
          <Link to="/" className="btn btn-primary">Go home</Link>
          <Link to="/shop" className="btn btn-outline">Browse products</Link>
        </div>
      </div>
    </div>
  )
}
