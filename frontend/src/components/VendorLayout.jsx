import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function VendorLayout({ children }) {
  const { isVendor, logout } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)

  useEffect(() => {
    api.get('/vendor/me').then((r) => setVendor(r.data.data)).catch(() => {})
  }, [])

  if (!isVendor()) {
    return (
      <div className="container" style={{ maxWidth: 500, textAlign: 'center', paddingTop: 64 }}>
        <h1 className="page-title">Vendor access required</h1>
        <p className="muted">Log in with a vendor account to manage your store.</p>
        <button className="btn btn-primary mt-2" onClick={() => navigate('/login')}>Login</button>
      </div>
    )
  }

  const status = vendor?.status

  return (
    <div className="container">
      <div className="flex justify-between align-center mt-2">
        <h1 className="page-title">Vendor dashboard</h1>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>

      {status !== 'approved' && (
        <div className="alert alert-info">
          Your vendor application is <strong>{status}</strong>. Product management requires an approved vendor account.
        </div>
      )}

      <div className="flex gap-2 mt-2 mb-2">
        <NavLink to="/vendor/products" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm`}>
          Products
        </NavLink>
        <NavLink to="/vendor/brand-requests" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm`}>
          Brand requests
        </NavLink>
      </div>

      {children}
    </div>
  )
}
