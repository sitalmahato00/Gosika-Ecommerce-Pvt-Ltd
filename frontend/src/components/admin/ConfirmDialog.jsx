import React, { useState } from 'react'
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // danger | warning | primary | success
  requireReason = false,
  reasonPlaceholder = 'Please enter a detailed reason for this action...',
  loading = false
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError('Please provide a reason before continuing.')
      return
    }
    setError('')
    onConfirm(reason)
  }

  const iconConfig = {
    danger: { Icon: AlertTriangle, bg: '#fee2e2', color: '#e11d48', btnBg: '#dc2626' },
    warning: { Icon: AlertTriangle, bg: '#fef3c7', color: '#d97706', btnBg: '#d97706' },
    primary: { Icon: Info, bg: '#dbeafe', color: '#2563eb', btnBg: 'var(--primary)' },
    success: { Icon: CheckCircle, bg: '#dcfce7', color: '#16a34a', btnBg: '#16a34a' }
  }[variant] || { Icon: AlertTriangle, bg: '#fee2e2', color: '#e11d48', btnBg: '#dc2626' }

  const Icon = iconConfig.Icon

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: iconConfig.bg,
              color: iconConfig.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon size={22} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '6px 0 0', lineHeight: 1.45 }}>
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason Input if Required */}
        {requireReason && (
          <div style={{ padding: '0 24px 16px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
              Reason / Explanation <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              className="input"
              rows={3}
              value={reason}
              onChange={e => { setReason(e.target.value); setError('') }}
              placeholder={reasonPlaceholder}
              style={{ width: '100%', resize: 'vertical', fontSize: 13, padding: '8px 12px' }}
              disabled={loading}
            />
            {error && (
              <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, display: 'block', marginTop: 4 }}>
                {error}
              </span>
            )}
          </div>
        )}

        {/* Action Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}
        >
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClose}
            disabled={loading}
            style={{ fontWeight: 600, borderRadius: 8, height: 36, padding: '0 16px' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              background: iconConfig.btnBg,
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              borderRadius: 8,
              height: 36,
              padding: '0 18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
