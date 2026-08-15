import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', password_confirmation: '' })
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
      await api.post('/auth/register', form)
      setPendingEmail(form.email)
      toast.success('Account created! Please verify your email.')
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
        <div className="card" style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: '32px 24px' }}>
          <h1 style={{ fontSize: 20 }}>Verify your account</h1>
          <div className="alert alert-success" style={{ textAlign: 'left' }}>Account created successfully!</div>
          <p className="muted" style={{ lineHeight: 1.6 }}>
            We sent a verification code to <strong>{pendingEmail}</strong>. In the dev environment, check{' '}
            <code>storage/logs/notifications.log</code> for your OTP.
          </p>
          <Link to="/verify" className="btn btn-primary btn-block">I have my code</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 480, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <span className="brand" style={{ justifyContent: 'center' }}>
            <span className="brand-mark"><ShoppingBag size={18} /></span> GOSIKA
          </span>
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Create your account</h1>
          <p className="muted m-0 text-sm">Join thousands of shoppers across Nepal.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="label">First name</label>
              <input className="input" required value={form.first_name} onChange={set('first_name')} />
              {fieldErrors.first_name && <div className="field-error">{fieldErrors.first_name[0]}</div>}
            </div>
            <div className="form-group">
              <label className="label">Last name</label>
              <input className="input" required value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" error={fieldErrors.email?.[0]} />
          <Input label="Phone (optional)" value={form.phone} onChange={set('phone')} placeholder="98XXXXXXXX" error={fieldErrors.phone?.[0]} />
          <Input label="Password" type="password" required value={form.password} onChange={set('password')} placeholder="Min 8 characters" error={fieldErrors.password?.[0]} />
          <Input label="Confirm password" type="password" required value={form.password_confirmation} onChange={set('password_confirmation')} />
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Create account'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login" className="text-primary font-semibold">Login</Link>
        </p>
        <p className="muted text-xs mt-2" style={{ textAlign: 'center' }}>
          Want to sell? <Link to="/vendor/register" className="text-primary font-semibold">Become a seller</Link>
        </p>
      </div>
    </div>
  )
}
