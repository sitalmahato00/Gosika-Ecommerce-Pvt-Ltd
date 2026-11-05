import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../ui/Spinner'
import { getPortalHome, getUserPortal } from '../../utils/portalAccess'

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
  if (user) return <Navigate to={getPortalHome(user)} replace />
  return children
}

export function VendorRoute({ children }) {
  const { user, booted } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/seller/login" state={{ from: '/vendor' }} replace />
  if (getUserPortal(user) !== 'vendor') return <Navigate to={getPortalHome(user)} replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, booted } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/admin/login" state={{ from: '/admin' }} replace />
  if (getUserPortal(user) !== 'admin') return <Navigate to={getPortalHome(user)} replace />
  return children
}

export function DeliveryRoute({ children }) {
  const { user, booted } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return <Navigate to="/admin/login" state={{ from: '/delivery' }} replace />
  if (getUserPortal(user) !== 'delivery') return <Navigate to={getPortalHome(user)} replace />
  return children
}

export function CustomerRoute({ children }) {
  const { user, booted } = useAuth()
  if (!booted) return <FullPageLoading />
  if (!user) return children
  if (getUserPortal(user) !== 'customer') return <Navigate to={getPortalHome(user)} replace />
  return children
}
