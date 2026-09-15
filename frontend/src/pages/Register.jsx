import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Store } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'
import api from '../api/client'
import AuthBrand from '../components/layout/AuthBrand'

const SOCIAL_BASE = '/api/v1/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const { saveSession } = useAuth()

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', password_confirmation: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const res = await api.post('/auth/register', form)
      const { token, user: u } = res.data.data
      saveSession(token, u)
      setPendingEmail(form.email)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setFieldErrors(data.errors)
      else setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: '32px 24px' }}>
          <span className="avatar" style={{ width: 64, height: 64, margin: '0 auto 14px', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle2 size={32} />
          </span>
          <h1 style={{ fontSize: 20 }}>Account created!</h1>
          <div className="alert alert-success" style={{ textAlign: 'left' }}>
            We sent a verification code to <strong>{pendingEmail}</strong>. In the dev environment, check <code>storage/logs/notifications.log</code> for your OTP.
          </div>
          <div className="flex items-center justify-center gap-2 wrap" style={{ marginTop: 16 }}>
            <Link to="/verify" className="btn btn-primary">Verify email</Link>
            <Link to="/login" className="btn btn-outline">Go to login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <AuthBrand />
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Create your account</h1>
          <p className="muted m-0 text-sm">Join thousands of shoppers across Nepal.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">First name *</label>
              <input className="input" required value={form.first_name} onChange={set('first_name')} />
              {fieldErrors.first_name && <div className="field-error">{fieldErrors.first_name[0]}</div>}
            </div>
            <div className="form-group">
              <label className="label">Last name *</label>
              <input className="input" required value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <Input label="Email *" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" error={fieldErrors.email?.[0]} />
          <Input label="Phone (optional)" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" error={fieldErrors.phone?.[0]} />
          <Input label="Password *" type="password" required value={form.password} onChange={set('password')} placeholder="Min 8 characters with letters & numbers" error={fieldErrors.password?.[0]} />
          <Input label="Confirm password *" type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} />

          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Create account'}
          </Button>
        </form>

        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
        </p>

        <div className="divider" style={{ margin: '14px 0', fontSize: 12, color: 'var(--muted)' }}>or sign up with</div>
        <a href={`${SOCIAL_BASE}/google/redirect`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <GoogleIcon /> Continue with Google
        </a>

        <Link to="/vendor/register" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 4 }}>
          <Store size={15} /> Sell on Gosika as a Merchant
        </Link>
      </div>
    </div>
  )
}
