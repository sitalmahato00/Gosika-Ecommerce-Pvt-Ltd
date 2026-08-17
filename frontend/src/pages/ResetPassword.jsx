import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ShoppingBag, Lock, CheckCircle2 } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
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

  if (!token || !email) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <h1 style={{ fontSize: 20 }}>Invalid reset link</h1>
          <p className="muted text-sm">This password reset link is invalid or missing required parameters.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: 12 }}>Request a new link</Link>
        </div>
      </div>
    )
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
          <span className="avatar" style={{ width: 56, height: 56, margin: '0 auto 14px' }}><Lock size={26} /></span>
          <h1 style={{ fontSize: 20 }}>Reset your password</h1>
          <p className="muted m-0 text-sm">Enter a new password for <strong>{email}</strong>.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
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
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Reset password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
