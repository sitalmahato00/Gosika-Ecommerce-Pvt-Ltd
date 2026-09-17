import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, Lock, CheckCircle2, RefreshCw, KeyRound } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'
import AuthBrand from '../components/layout/AuthBrand'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [resent, setResent] = useState(false)

  if (!email) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <h1 style={{ fontSize: 20 }}>Missing email</h1>
          <p className="muted text-sm">We need your account email to reset your password. Please request a code first.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 12 }}>Request a verification code</Link>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('New passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      })
      setDone(true)
      toast.success('Password reset successfully!')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setError(null)
    setResent(false)
    try {
      await api.post('/auth/forgot-password', { email })
      setResent(true)
      toast.success('A new verification code was sent.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setResending(false)
    }
  }

  if (done) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <span className="avatar" style={{ width: 56, height: 56, margin: '0 auto 14px', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={26} />
          </span>
          <h1 style={{ fontSize: 20 }}>Password reset!</h1>
          <p className="muted text-sm" style={{ lineHeight: 1.6 }}>Your password has been updated. You can now log in with your new password.</p>
          <Button variant="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>Go to login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <AuthBrand />
          <span className="avatar" style={{ width: 56, height: 56, margin: '14px auto 0' }}><Lock size={26} /></span>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>Reset your password</h1>
          <p className="muted m-0 text-sm">
            <MailCheck size={13} style={{ verticalAlign: '-2px' }} /> Enter the 6-digit code sent to <strong>{email}</strong> along with your new password.
          </p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {resent && !error && (
          <div className="alert" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#0f9d76', fontSize: 12.5 }}>
            A new verification code was sent to {email}.
          </div>
        )}
        <form onSubmit={submit}>
          <Input
            label="Verification code"
            type="text"
            inputMode="numeric"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="6-digit code"
            autoComplete="one-time-code"
          />
          <Input
            label="New password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters with letters & numbers"
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
          />
          <Button type="submit" block size="lg" disabled={loading || resending}>
            {loading ? <Spinner size={16} color="#fff" /> : <KeyRound size={16} />}
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
          <Button type="button" variant="outline" block size="md" style={{ marginTop: 8 }} onClick={resend} disabled={loading || resending}>
            {resending ? <Spinner size={15} /> : <RefreshCw size={15} />}
            {resending ? 'Sending…' : 'Resend code'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          <Link to="/forgot-password" className="text-primary font-semibold">Use a different email</Link>
        </p>
      </div>
    </div>
  )
}