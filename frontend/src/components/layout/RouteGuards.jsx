import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'

function FullPageLoading() {
  return (
    <div className="page-shell container flex flex-col items-center justify-center gap-3" style={{ minHeight: '60vh' }}>
      <Spinner size={32} color="var(--primary)" />
      <p className="muted">Loading…</p>
    </div>
  )
}

export function AuthRoute({ children }) {
  const { user, booted } = useAuth()
  const location = useLocation()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function GuestRoute({ children }) {
  const { user, booted } = useAuth()
  if (!booted) return <FullPageLoading />
  if (user) return <Navigate to="/account" replace />
  return children
}

export function VendorRoute({ children }) {
  const { user, booted, isVendor, isSuperAdmin } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: '/vendor' }} replace />
  // Allow vendors or super admins (super admins can access all portals)
  if (!isVendor() && !isSuperAdmin()) return <Navigate to="/account" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, booted, isSuperAdmin, isDeliveryPartner } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
  
  // Allow super_admin, delivery_partner, or custom admin roles
  const roles = user?.roles || []
  const isAdmin = isSuperAdmin()
  const isDelivery = isDeliveryPartner()
  const hasCustomAdminRole = roles.some(role => 
    !['customer', 'vendor_admin'].includes(role)
  )
  
  if (!isAdmin && !isDelivery && !hasCustomAdminRole) {
    return <Navigate to="/account" replace />
  }
  
  return children
}

export function DeliveryRoute({ children }) {
  const { user, booted, isDeliveryPartner, isSuperAdmin } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: '/delivery' }} replace />
  // Allow delivery partners or super admins (for testing/managing delivery operations)
  if (!isDeliveryPartner() && !isSuperAdmin()) return <Navigate to="/account" replace />
  return children
}
