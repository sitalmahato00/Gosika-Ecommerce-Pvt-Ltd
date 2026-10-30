import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ShoppingBag } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import { useToast } from '../context/ToastContext'
import { useBranding } from '../context/BrandingContext'
import { apiImage } from '../utils/format'
import api from '../api/client'

export default function AdminLogin() {
  const toast = useToast()
  const branding = useBranding()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || ''

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
          correctPortal = '/vendor-login'
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
          setError(`❌ Access Denied: This is the Admin & Staff Portal. You are a ${roleType} user. Please use the correct portal at ${correctPortal}`)
        } else {
          setError('❌ Access Denied: You do not have permission to access any portal. Please contact support.')
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
    <div className="page-shell" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', padding: '32px 28px' }}>
        <div className="text-center mb-2">
          <div className="flex items-center justify-center mb-3">
            <div style={{ 
              width: 56, 
              height: 56, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={28} color="#fff" />
            </div>
          </div>
          <span className="brand" style={{ justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {logoUrl ? (
              <img src={apiImage(logoUrl)} alt={brandName} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <span className="brand-mark"><ShoppingBag size={16} /></span>
            )}
            <span style={{ fontSize: 16 }}>{brandName}</span>
          </span>
          <h1 style={{ fontSize: 22, marginTop: 8, fontWeight: 800 }}>Admin & Staff Portal</h1>
          <p className="muted m-0 text-sm">Sign in to access administrative dashboard</p>
        </div>
        {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}
        <form onSubmit={submit} style={{ marginTop: 20 }}>
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
            {loading ? <Spinner size={16} color="#fff" /> : 'Sign In'}
          </Button>
        </form>

        <div className="alert alert-info" style={{ fontSize: 12, marginTop: 16, padding: '10px 12px' }}>
          <strong>🔒 Restricted Access</strong><br />
          This portal is for administrative staff, delivery partners, and authorized personnel only.
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p className="muted text-xs">Not an admin?</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Customer Login</Link>
            <Link to="/vendor-login" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Vendor Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
