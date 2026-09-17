import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Mail, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'
import useEmailVerification from '../../hooks/useEmailVerification'

const SKIP_PREFIXES = [
  '/login',
  '/register',
  '/vendor/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/social-auth',
  '/password/reset',
]

export default function EmailVerificationPrompt() {
  const { user, reloadUser } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(null)

  const email = user?.email
  const verified = !!user?.email_verified_at
  const shouldPrompt = !!user && !verified && !SKIP_PREFIXES.some((p) => pathname.startsWith(p))

  const { code, setCode, sending, verifying, sent, error, resend, verify } = useEmailVerification({
    email,
    verified,
    onVerified: reloadUser,
    autoSend: open,
  })

  useEffect(() => {
    if (shouldPrompt && dismissed !== (user?.id || email)) setOpen(true)
  }, [shouldPrompt, dismissed, user, email])

  if (!shouldPrompt || verified) return null

  return (
    <Modal open={open} onClose={() => { setDismissed(user?.id || email); setOpen(false) }} title="Verify Your Email">
      <div className="flex items-center gap-3 mb-4 wrap">
        <span
          className="avatar"
          style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}
        >
          <Mail size={20} />
        </span>
        <div className="min-w-0">
          <div className="font-bold text-sm text-ink">Welcome! One more step to activate your account.</div>
          <p className="muted text-xs m-0">
            A 6-digit verification code was sent to <b style={{ color: 'var(--ink)' }}>{email}</b>. Enter it below to verify your email.
          </p>
        </div>
      </div>

      <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {sent && !error && (
          <div className="alert" style={{ margin: 0, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#0f9d76', fontSize: 12.5 }}>
            <MailCheck size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Code sent! Check <b>{email}</b> (and spam folder). It expires in 60 minutes.
          </div>
        )}
        <div>
          <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
            Verification Code
          </label>
          <input
            className="input"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit code"
            style={{ width: '100%' }}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="flex items-center gap-2 wrap">
          <Button type="submit" disabled={verifying}>
            {verifying ? <Spinner size={15} color="#fff" /> : <ShieldCheck size={15} />}
            {verifying ? 'Verifying…' : 'Verify Email'}
          </Button>
          <Button type="button" variant="outline" onClick={resend} disabled={sending}>
            {sending ? <Spinner size={15} /> : <RefreshCw size={15} />}
            {sending ? 'Sending…' : sent ? 'Resend Code' : 'Send Code'}
          </Button>
        </div>
        <button
          type="button"
          className="btn btn-link btn-sm"
          style={{ alignSelf: 'flex-start', marginTop: 4, color: 'var(--muted)' }}
          onClick={() => { setDismissed(user?.id || email); setOpen(false) }}
        >
          Verify later — I'll do it from my account settings
        </button>
      </form>
    </Modal>
  )
}