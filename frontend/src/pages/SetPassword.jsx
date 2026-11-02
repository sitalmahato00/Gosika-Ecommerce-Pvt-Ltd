import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, KeyRound, Lock } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import AuthBrand from '../components/layout/AuthBrand'
import api from '../api/client'
import { errorMessage } from '../utils/format'

export default function SetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [complete, setComplete] = useState(false)
  const [loginPath, setLoginPath] = useState('/seller/login')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Your password must be at least 8 characters.')
      return
    }
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/admin-invitation/complete', {
        email,
        token,
        password,
        password_confirmation: confirmation,
      })
      const roles = response.data?.data?.user?.roles || []
      setLoginPath(roles.some((role) => !['vendor_admin', 'delivery_partner', 'customer'].includes(role))
        ? '/admin/login'
        : '/seller/login')
      setComplete(true)
    } catch (requestError) {
      setError(errorMessage(requestError, 'This invitation link is invalid or expired. Ask an administrator to send a new one.'))
    } finally {
      setLoading(false)
    }
  }

  if (!email || !token) {
    return (
      <div className="page-shell container container-narrow auth-card-page">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <AuthBrand />
          <h1 style={{ fontSize: 20 }}>Invitation link is incomplete</h1>
          <p className="muted text-sm">Open the complete invitation link from your email to verify your account and set a password.</p>
        </div>
      </div>
    )
  }

  if (complete) {
    return (
      <div className="page-shell container container-narrow auth-card-page">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <AuthBrand />
          <span className="avatar" style={{ width: 56, height: 56, margin: '0 auto 14px', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={26} />
          </span>
          <h1 style={{ fontSize: 20 }}>Account verified</h1>
          <p className="muted text-sm" style={{ lineHeight: 1.6 }}>
            Your email is verified and your password has been set. You can now sign in.
          </p>
          <Button type="button" block onClick={() => navigate(loginPath)} style={{ marginTop: 16 }}>
            Continue to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow auth-card-page">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <AuthBrand />
          <span className="avatar" style={{ width: 56, height: 56, margin: '14px auto 0' }}><Lock size={26} /></span>
          <h1 style={{ fontSize: 20, marginTop: 8 }}>Verify email and set password</h1>
          <p className="muted m-0 text-sm">Create a password for <strong>{email}</strong>. This invitation link can only be used once.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <Input
            label="New password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Input
            label="Confirm password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : <KeyRound size={16} />}
            {loading ? 'Setting password…' : 'Verify and set password'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          <Link to="/seller/login" className="text-primary font-semibold">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
