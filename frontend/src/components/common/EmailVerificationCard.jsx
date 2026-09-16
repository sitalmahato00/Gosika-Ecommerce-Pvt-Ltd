import React, { useRef, useState, useEffect } from 'react'
import { Mail, MailCheck, RefreshCw, ShieldCheck, Send } from 'lucide-react'
import api from '../../api/client'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function EmailVerificationCard({ user, onVerified }) {
  const toast = useToast()
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const sentOnce = useRef(false)
  const email = user?.email
  const verified = !!user?.email_verified_at

  useEffect(() => {
    if (!verified && email && !sentOnce.current) {
      sentOnce.current = true
      sendCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, verified])

  const sendCode = async () => {
    setError(null)
    setSending(true)
    try {
      await api.post('/auth/email/resend', { email })
      setSent(true)
      toast.success(`Verification code sent to ${email}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const verify = async (e) => {
    e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code you received by email.')
      return
    }
    setVerifying(true)
    try {
      await api.post('/auth/email/verify', { email, code })
      toast.success('Email verified — your account is now active.')
      if (onVerified) await onVerified()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  if (verified || !email) return null

  return (
    <div
      className="card"
      style={{
        padding: 22,
        border: '1px solid rgba(37, 99, 235, 0.25)',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(255,255,255,0))',
      }}
    >
      <div className="flex items-center gap-3 mb-3 wrap">
        <span
          className="avatar"
          style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}
        >
          <Mail size={19} />
        </span>
        <div className="min-w-0">
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            Verify Your Email
            <span className="chip chip-sm" style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 800 }}>PENDING</span>
          </h3>
          <p className="muted text-xs" style={{ margin: 0 }}>
            Account not active yet — a 6-digit code was sent to <b style={{ color: 'var(--ink)' }}>{email}</b>. Enter it to activate your account.
          </p>
        </div>
      </div>

      <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 620 }}>
        {error && <div className="alert alert-error" style={{ margin: 0 }}>{error}</div>}
        {sent && !error && (
          <div className="alert" style={{ margin: 0, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#0f9d76', fontSize: 12.5 }}>
            <MailCheck size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Code sent! Check <b>{email}</b> (and spam folder). It expires in 60 minutes.
          </div>
        )}
        <div className="flex items-end gap-2 wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
              Verification Code
            </label>
            <input
              className="input"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <Button type="submit" disabled={verifying}>
            {verifying ? <Spinner size={15} color="#fff" /> : <ShieldCheck size={15} />}
            {verifying ? 'Verifying…' : 'Verify Email'}
          </Button>
          <Button type="button" variant="outline" onClick={sendCode} disabled={sending}>
            {sending ? <Spinner size={15} /> : <RefreshCw size={15} />}
            {sending ? 'Sending…' : sent ? 'Resend Code' : 'Send Code'}
          </Button>
        </div>
        <p className="muted" style={{ fontSize: 11.5, margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Send size={11} /> Already have a code from sign-up? Enter it directly — no need to resend.
        </p>
      </form>
    </div>
  )
}