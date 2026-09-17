import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'
import AuthBrand from '../components/layout/AuthBrand'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('Verification code sent! Check your email.')
      navigate(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <AuthBrand />
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Forgot your password?</h1>
          <p className="muted m-0 text-sm">Enter your email and we'll send you a 6-digit verification code.</p>
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
            {loading ? <Spinner size={16} color="#fff" /> : 'Send verification code'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          <Link to="/login" className="text-primary font-semibold"><ArrowLeft size={13} style={{ verticalAlign: -2 }} /> Back to login</Link>
        </p>
      </div>
    </div>
  )
}