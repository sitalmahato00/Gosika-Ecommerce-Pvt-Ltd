import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import AuthPortalShell from '../components/layout/AuthPortalShell'
import api from '../api/client'

export default function AdminLogin() {
  const toast = useToast()
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
      const isAdmin = roles.includes('super_admin')
      const isDeliveryPartner = roles.includes('delivery_partner')
      const hasCustomAdminRole = roles.some(role => 
        !['customer', 'vendor_admin'].includes(role)
      )
      
      // STRICT PORTAL VALIDATION: Only admin/staff allowed
      if (!isAdmin && !isDeliveryPartner && !hasCustomAdminRole) {
        const isVendor = roles.includes('vendor_admin')
        const isCustomer = roles.includes('customer')
        
        let correctPortal = ''
        let roleType = ''
        
        if (isVendor) {
          correctPortal = '/vendor/login'
          roleType = 'vendor'
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
      
      // User is admin/staff - NOW complete the login
      localStorage.setItem('gosika_token', token)
      localStorage.setItem('gosika_user', JSON.stringify(user))
      
      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'there'}!`)
      
      // Force page reload to ensure AuthContext picks up the new user
      if (isDeliveryPartner) {
        window.location.href = '/delivery'
      } else {
        window.location.href = '/admin'
      }
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <AuthPortalShell
      portal="Admin Portal"
      title="Admin"
      description="Manage your marketplace, users, and products, and keep everything running smoothly."
      highlights={['Manage vendors and products', 'Handle orders and payments', 'Track platform performance', 'Configure system settings']}
    >
      {error && <div className="alert alert-error auth-portal__error" role="alert">{error}</div>}
      <form onSubmit={submit} className="auth-portal__form">
          <Input 
            label="Email or phone" 
            required 
            value={form.identifier} 
            onChange={(e) => setForm({ ...form, identifier: e.target.value })} 
            placeholder="admin@example.com" 
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
            {loading ? <Spinner size={16} color="#fff" /> : 'Login as Admin'}
          </Button>
        </form>
      <p className="auth-portal__restricted">Restricted to authorized administrators and staff</p>
    </AuthPortalShell>
  )
}
