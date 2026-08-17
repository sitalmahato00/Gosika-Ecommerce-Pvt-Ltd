import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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
          <span className="brand" style={{ justifyContent: 'center' }}>
            <span className="brand-mark"><ShoppingBag size={18} /></span> GOSIKA
          </span>
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Welcome back</h1>
          <p className="muted m-0 text-sm">Login to continue shopping across Nepal.</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <Input label="Email or phone" required value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} placeholder="you@example.com" autoComplete="username" />
          <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete="current-password" />
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Login'}
          </Button>
        </form>
        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          Don't have an account? <Link to="/register" className="text-primary font-semibold">Create one</Link>
        </p>
      </div>
    </div>
  )
}
