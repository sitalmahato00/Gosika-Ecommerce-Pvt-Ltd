import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import AuthPortalShell from '../components/layout/AuthPortalShell'
import VendorRegister from './vendor/VendorRegister'
import api from '../api/client'

export default function VendorLogin() {
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const isRegistering = searchParams.get('mode') === 'register'
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Use the api client which handles CSRF properly
      const res = await api.post('/auth/login', {
        identifier: form.identifier,
        password: form.password,
        device_name: 'web'
      })
      
      const { user, token } = res.data.data
      
      // NOW check roles BEFORE completing login
      const roles = user.roles || []
      const isVendor = roles.includes('vendor_admin')
      
      // STRICT PORTAL VALIDATION: Only vendors allowed
      if (!isVendor) {
        const isCustomer = roles.includes('customer')
        const hasStaffRole = roles.some(role => 
          !['customer', 'vendor_admin'].includes(role)
        )
        
        let correctPortal = ''
        let roleType = ''
        
        if (hasStaffRole) {
          correctPortal = '/admin/login'
          roleType = 'staff/admin'
        } else if (isCustomer) {
          correctPortal = '/login'
          roleType = 'customer'
        } else {
          correctPortal = ''
          roleType = 'unknown'
        }
        
        // Logout the token we just created
        try {
          await api.post('/auth/logout', null, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        } catch {}
        
        // Show error - DON'T save anything to localStorage
        if (correctPortal) {
          setError(`This account belongs to the ${roleType} portal. Please sign in through ${correctPortal}.`)
        } else {
          setError('You do not have permission to access this portal. Please contact support.')
        }
        setLoading(false)
        return
      }
      
      // User is a vendor - NOW complete the login
      localStorage.setItem('gosika_token', token)
      localStorage.setItem('gosika_user', JSON.stringify(user))
      
      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'there'}!`)
      
      // Force page reload to ensure AuthContext picks up the new user
      window.location.href = '/vendor'
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <AuthPortalShell
      portal="Seller Portal"
      title="Seller"
      description="Grow your business and reach thousands of customers."
      highlights={['List your products', 'Manage orders and inventory', 'Track your sales', 'Get paid securely']}
      registrationMode={isRegistering}
    >
      {isRegistering ? (
        <VendorRegister />
      ) : (
        <>
          {error && <div className="alert alert-error auth-portal__error" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-portal__form">
            <Input
              label="Email or phone"
              required
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="vendor@example.com"
              autoComplete="username"
            />
            <Input
              label="Password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <p className="muted text-xs text-right mb-1" style={{ marginTop: -4 }}>
              <Link to="/forgot-password" className="text-primary">Forgot password?</Link>
            </p>
            <Button type="submit" block size="lg" disabled={loading} style={{ marginTop: 12 }}>
              {loading ? <Spinner size={16} color="#fff" /> : 'Login as Seller'}
            </Button>
          </form>

          <div className="auth-portal__register">
            <span>New to Gosika?</span>
            <Link to="/vendor/login?mode=register" className="btn btn-outline">Sign up</Link>
          </div>
        </>
      )}
    </AuthPortalShell>
  )
}
