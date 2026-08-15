import React, { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Uncaught runtime exception caught by GOSIKA ErrorBoundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          background: 'var(--bg)',
        }}>
          <div className="card" style={{
            maxWidth: 520,
            width: '100%',
            padding: 32,
            textAlign: 'center',
            boxShadow: 'var(--shadow-xl)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '999px',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <AlertTriangle size={28} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: 'var(--ink)' }}>
              Something went wrong
            </h2>

            <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
              An unexpected error occurred while rendering this view. Your cart, session, and account data remain secure.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#0f172a',
                color: '#f87171',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                marginBottom: 20,
                fontFamily: 'monospace',
                overflowX: 'auto',
              }}>
                <summary style={{ cursor: 'pointer', color: '#94a3b8', marginBottom: 6 }}>
                  Technical Error Details
                </summary>
                {this.state.error.toString()}
              </details>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={this.handleGoHome}>
                <Home size={15} /> Return Home
              </button>
              <button className="btn btn-primary" onClick={this.handleReload}>
                <RefreshCw size={15} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
