import React, { useState, useEffect } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, Menu, X, LogOut, Home, Bell, ChevronRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'

export default function DashboardLayout({ nav, title, roleLabel, homePath }) {
  const { user, logout, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // Close sidebar on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const userInitials = initials(user?.name || user?.email || 'U')
  const role = roleLabel || (isSuperAdmin() ? 'Super Admin' : 'Vendor')

  return (
    <div className="dash-shell">
      {/* Overlay for mobile */}
      {open && (
        <div
          className="overlay dash-sidebar-overlay"
          onClick={() => setOpen(false)}
          style={{ zIndex: 65 }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${open ? 'open' : ''}`} aria-label={`${title} navigation`}>
        {/* Sidebar header */}
        <div className="dash-sidebar-header">
          <Link to="/" className="brand" style={{ color: '#fff', fontSize: 18 }} aria-label="GOSIKA home">
            <span className="brand-mark" style={{ width: 32, height: 32 }}>
              <ShoppingBag size={15} />
            </span>
            GOSIKA
          </Link>
          <button
            className="dash-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info in sidebar */}
        {user && (
          <div style={{ padding: '12px 14px 4px', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            <div className="flex items-center gap-3">
              <span
                className="avatar"
                style={{ width: 38, height: 38, fontSize: 13, background: 'var(--primary)', color: '#fff', flexShrink: 0 }}
              >
                {userInitials}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }} className="truncate">{user.name}</div>
                <div style={{ color: '#64748b', fontSize: 11 }} className="truncate">{user.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 999,
                background: 'rgba(37,99,235,0.2)', color: '#60a5fa',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.04em'
              }}>
                {role}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="dash-nav" aria-label="Dashboard menu">
          {nav.map((item, i) =>
            item.section ? (
              <div key={`section-${i}`} className="dash-nav-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
                aria-label={item.label}
              >
                {(() => {
                  const Ic = Icons[item.icon] || Icons.Circle
                  return <Ic size={16} aria-hidden="true" />
                })()}
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="dash-nav-footer">
          <Link to={homePath || '/'} className="dash-nav-link" style={{ marginBottom: 2 }}>
            <Home size={16} aria-hidden="true" />
            <span>Back to Store</span>
          </Link>
          <button
            className="dash-nav-link"
            style={{ color: '#f87171' }}
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar" role="banner">
          <button
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            style={{ flexShrink: 0 }}
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="dash-topbar-title">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="chip hide-sm"
              style={{ fontSize: 11 }}
            >
              {role}
            </span>

            <Link
              to={homePath || '/'}
              className="icon-btn hide-sm"
              aria-label="Back to store"
              title="Back to store"
            >
              <Home size={17} />
            </Link>

            <button
              className="icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={17} />
            </button>

            {user && (
              <div className="flex items-center gap-2">
                <span
                  className="avatar"
                  title={user.name}
                  aria-label={`Logged in as ${user.name}`}
                  style={{ width: 34, height: 34, fontSize: 13, background: 'var(--primary)', color: '#fff', cursor: 'default' }}
                >
                  {userInitials}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
