import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Mail, ArrowLeft } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '36px 24px' }}>
          <span className="avatar" style={{ width: 56, height: 56, margin: '0 auto 14px', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Mail size={26} />
          </span>
          <h1 style={{ fontSize: 20 }}>Check your email</h1>
          <p className="muted text-sm" style={{ lineHeight: 1.6 }}>
            We've sent a password reset link to <strong>{email}</strong>.
            In the dev environment, check <code>storage/logs/laravel.log</code> for the reset link.
          </p>
          <Button variant="outline" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
            <ArrowLeft size={15} /> Back to login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <span className="brand" style={{ justifyContent: 'center' }}>
            <span className="brand-mark"><ShoppingBag size={18} /></span> GOSIKA
          </span>
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Forgot your password?</h1>
          <p className="muted m-0 text-sm">Enter your email and we'll send you a reset link.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Send reset link'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          <Link to="/login" className="text-primary font-semibold"><ArrowLeft size={13} style={{ verticalAlign: -2 }} /> Back to login</Link>
        </p>
      </div>
    </div>
  )
}
