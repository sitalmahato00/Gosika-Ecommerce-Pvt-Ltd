import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useBranding } from '../context/BrandingContext'
import { errorMessage } from '../utils/format'

const SOCIAL_BASE = '/api/v1/auth'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  )
}

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const branding = useBranding()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light
  const loginHeading = branding.login_heading || 'Welcome back'
  const loginDescription = branding.login_description || `Login to continue shopping across Nepal.`

  const from = location.state?.from?.pathname || location.state?.from || '/account'

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const user = await login(form.identifier, form.password)
      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'there'}!`)
      if (user.roles?.includes('super_admin')) navigate('/admin')
      else if (user.roles?.includes('vendor_admin')) navigate('/vendor')
      else navigate(from)
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
          <span className="brand" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span className="brand-mark"><ShoppingBag size={18} /></span>
            )}
            <span>{brandName}</span>
          </span>
          <h1 style={{ fontSize: 20, marginTop: 14 }}>{loginHeading}</h1>
          <p className="muted m-0 text-sm">{loginDescription}</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <Input label="Email or phone" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="you@example.com" autoComplete="username" />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
          <p className="muted text-xs text-right mb-1" style={{ marginTop: -4 }}>
            <Link to="/forgot-password" className="text-primary">Forgot password?</Link>
          </p>
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Login'}
          </Button>
        </form>

        <div className="divider" style={{ margin: '16px 0', fontSize: 12, color: 'var(--muted)' }}>or continue with</div>
        <a href={`${SOCIAL_BASE}/google/redirect`} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <GoogleIcon /> Continue with Google
        </a>

        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          Don't have an account? <Link to="/register" className="text-primary font-semibold">Create one</Link>
        </p>
        <p className="muted text-xs mt-1" style={{ textAlign: 'center' }}>
          Want to sell on Gosika? <Link to="/vendor/register" className="text-primary font-semibold">Become a Seller</Link>
        </p>
        <div className="alert alert-info" style={{ fontSize: 13 }}>
          Demo accounts (password: <code>password</code>): customer@gosika.com.np · vendor@gosika.com.np · admin@gosika.com.np
        </div>
      </div>
    </div>
  )
}
