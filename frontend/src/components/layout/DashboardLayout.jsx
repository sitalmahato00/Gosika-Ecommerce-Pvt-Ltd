import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag, Menu, X, LogOut, Bell,
  Store, Wallet, Search, CheckCircle2, User,
  Settings, KeyRound, Headphones,
  PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, UserCheck,
  Calendar, ChevronDown
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import MobileBottomNav from './MobileBottomNav'

export default function DashboardLayout({
  nav, title, roleLabel, homePath, rider, onDuty, onToggleDuty, dutyToggling, mobileNav,
}) {
  const toast = useToast()
  const { user, logout, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setOpen(false); setUserDropdown(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setOpen(false); setUserDropdown(false) }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserDropdown(false)
    }
    document.addEventListener('keydown', handler)
    document.addEventListener('mousedown', handler)
    return () => { document.removeEventListener('keydown', handler); document.removeEventListener('mousedown', handler) }
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const role = roleLabel || (isSuperAdmin() ? 'Super Admin' : 'Vendor')
  const isVendor = role.toLowerCase().includes('vendor')
  const isDelivery = role.toLowerCase().includes('delivery') || role.toLowerCase().includes('rider')
  const duty = onDuty ?? rider?.is_online ?? false
  const riderName = rider?.name || user?.name || 'Delivery Partner'
  const riderArea = Array.isArray(rider?.service_areas) && rider.service_areas.length > 0 ? rider.service_areas[0] : 'Dispatch Hub'

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toLowerCase()
    if (isDelivery) {
      if (q.includes('order') || q.includes('deliver')) navigate('/delivery/deliveries')
      else if (q.includes('earning') || q.includes('payout')) navigate('/delivery/earnings')
      else if (q.includes('profile') || q.includes('vehicle')) navigate('/delivery/profile')
      else navigate('/delivery/deliveries')
    } else if (isVendor) {
      if (q.includes('order')) navigate('/vendor/orders')
      else if (q.includes('product')) navigate('/vendor/products')
      else if (q.includes('wallet') || q.includes('earning')) navigate('/vendor/wallet')
      else navigate('/vendor/orders')
    } else {
      if (q.includes('vendor')) navigate('/admin/vendors')
      else if (q.includes('order')) navigate('/admin/orders')
      else if (q.includes('product') || q.includes('category')) navigate('/admin/products')
      else if (q.includes('user') || q.includes('customer')) navigate('/admin/users')
      else navigate('/admin/orders')
    }
    setSearchQuery('')
  }

  const accentGradient = isDelivery
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : isVendor
    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'

  const accentColor = isDelivery ? '#10b981' : isVendor ? '#2563eb' : '#e11d48'

  return (
    <div className="dash-shell">
      {open && (
        <div className="overlay dash-sidebar-overlay" onClick={() => setOpen(false)} style={{ zIndex: 65 }} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} aria-label={`${title} navigation`}>
        {/* Header Logo */}
        <div className="dash-sidebar-header">
          <Link to="/" className="brand" style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <span
              className="brand-mark"
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: accentGradient,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)', flexShrink: 0, fontSize: 18, fontWeight: 900,
              }}
            >
              G
            </span>
            {!collapsed && (
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.04em', color: '#fff' }}>GOSIKA</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>
                  {isDelivery ? 'Delivery Portal' : isVendor ? 'Vendor Panel' : 'Admin Panel'}
                </div>
              </div>
            )}
          </Link>
          <button className="dash-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>



        {/* Delivery Rider Card */}
        {isDelivery && (
          <div
            className="store-identity-card"
            style={{
              margin: collapsed ? '8px 6px' : '12px 12px 6px',
              padding: collapsed ? '8px 4px' : '12px',
              borderRadius: 'var(--radius)',
              background: 'rgba(30,41,59,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="avatar"
                style={{
                  width: collapsed ? 36 : 40, height: collapsed ? 36 : 40, fontSize: 14, fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icons.Truck size={18} />
              </span>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#fff' }}>{riderName}</div>
                  <div className="text-xs truncate" style={{ color: '#94a3b8' }}>{rider?.vehicle_number || 'Vehicle not set'}</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center justify-between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span
                  className="chip chip-sm"
                  style={{
                    background: duty ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)',
                    color: duty ? '#34d399' : '#94a3b8', fontSize: 10, fontWeight: 800, padding: '2px 8px',
                    border: '1px solid ' + (duty ? 'rgba(16,185,129,0.3)' : 'rgba(148,163,184,0.3)'),
                  }}
                >
                  {duty ? '● On Duty' : '● Offline'}
                </span>
                <span style={{ color: '#64748b', fontSize: 10 }}>{riderArea}</span>
              </div>
            )}
          </div>
        )}

        {/* Nav Links */}
        <nav className="dash-nav" aria-label="Dashboard menu">
          {nav.map((item, i) => {
            if (item.section) {
              return <div key={`section-${i}`} className="dash-nav-section">{item.section}</div>
            }
            let badge = null
            if (item.label === 'Order Management' || item.label === 'Orders') badge = { text: '12', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' }
            if (item.label === 'Notifications') badge = { text: '3', color: '#ef4444', bg: 'rgba(239,68,68,0.2)' }
            if (item.label === 'Support' || item.label === 'Support Tickets') badge = { text: '1', color: '#38bdf8', bg: 'rgba(56,189,248,0.2)' }
            const Ic = Icons[item.icon] || Icons.Circle
            return (
              <NavLink
                key={`${item.to}-${i}`}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `dash-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
              >
                <Ic size={16} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge && !collapsed && (
                  <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 999 }}>
                    {badge.text}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="dash-nav-footer">
          <Link
            to={isDelivery ? '/delivery/support' : isVendor ? '/vendor/support' : '/admin/support'}
            className="dash-nav-link"
            style={{ marginBottom: 4, background: 'rgba(255,255,255,0.04)', color: '#cbd5e1' }}
            title={collapsed ? 'Help Center' : undefined}
          >
            <Headphones size={15} color="#94a3b8" />
            <span style={{ flex: 1, fontSize: 13 }}>Help Center</span>
          </Link>
          <button
            type="button"
            className="dash-nav-link"
            style={{ color: '#f87171' }}
            onClick={handleLogout}
            aria-label="Logout"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar" role="banner">
          {/* Left: Menu + Greeting */}
          <div className="flex items-center gap-3">
            <button
              className="icon-btn hide-md-up"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={open}
              style={{ flexShrink: 0 }}
            >
              <Menu size={19} />
            </button>
            <button
              type="button"
              className="icon-btn hide-sm"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{ flexShrink: 0 }}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="hide-sm">
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>
                Hello, {isDelivery ? riderName.split(' ')[0] : isVendor ? 'Vendor' : 'Admin'}!
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                Welcome! Have a great day.
              </div>
            </div>
          </div>

          {/* Center: Search */}
          <form
            onSubmit={handleGlobalSearch}
            className="hide-sm"
            style={{ flex: 1, maxWidth: 400, margin: '0 20px', position: 'relative' }}
          >
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              className="input"
              style={{
                width: '100%', height: 38, paddingLeft: 36, paddingRight: 76,
                fontSize: 13, background: 'var(--bg)', borderRadius: 'var(--radius)',
              }}
              placeholder={
                isDelivery ? 'Search deliveries, earnings...'
                : isVendor ? 'Search orders, products...'
                : 'Search here (Order, Customer, Vendor...)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 10, color: 'var(--muted)', background: '#fff',
              padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', fontWeight: 600,
            }}>
              Ctrl + K
            </span>
          </form>

          {/* Right: Date + Bell + Avatar */}
          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            {/* Date */}
            <div
              className="hide-sm flex items-center gap-2"
              style={{
                padding: '5px 11px', background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                fontSize: 12, color: 'var(--ink)', fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              <Calendar size={13} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <span>{todayFormatted}</span>
            </div>

            {/* Notifications */}
            <Link
              to={isDelivery ? '/delivery/notifications' : isVendor ? '/vendor/notifications' : '/admin/notifications'}
              className="icon-btn"
              style={{ position: 'relative' }}
              title="Notifications"
            >
              <Bell size={17} />
              {!isDelivery && (
                <span style={{
                  position: 'absolute', top: -2, right: -2, width: 16, height: 16,
                  borderRadius: '50%', background: '#ef4444', color: '#fff',
                  fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: '2px solid #fff',
                }}>
                  3
                </span>
              )}
            </Link>

            {/* Avatar + Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 'var(--radius)',
                }}
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User profile menu"
              >
                <span
                  className="avatar"
                  style={{
                    width: 36, height: 36, fontSize: 13, fontWeight: 800,
                    background: isDelivery
                      ? 'linear-gradient(135deg,#10b981,#059669)'
                      : isVendor
                      ? 'linear-gradient(135deg,#2563eb,#1d4ed8)'
                      : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                    color: '#fff', flexShrink: 0,
                  }}
                >
                  {isDelivery ? initials(riderName) : isVendor ? 'K' : initials(user?.name || 'AD')}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
              </button>

              {userDropdown && (
                <div
                  className="card"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 250,
                    padding: 0, zIndex: 100, boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '14px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <div className="font-bold text-sm text-ink truncate">
                      {isVendor ? (user?.company_name || user?.name || 'Vendor Partner') : isDelivery ? riderName : user?.name || 'GOSIKA Super Admin'}
                    </div>
                    <div className="muted text-xs truncate" style={{ marginTop: 2, fontSize: 11 }}>
                      {user?.email || (isVendor ? 'vendor@gosika.com.np' : isDelivery ? 'delivery@gosika.com.np' : 'admin@gosika.com.np')}
                    </div>
                    <span
                      className="chip chip-sm"
                      style={{
                        marginTop: 6, display: 'inline-flex',
                        background: isVendor ? 'var(--primary-50)' : isDelivery ? 'rgba(16,185,129,0.1)' : 'rgba(37,99,235,0.1)',
                        color: isVendor ? 'var(--primary)' : isDelivery ? '#10b981' : 'var(--primary)',
                        fontWeight: 800, fontSize: 10,
                      }}
                    >
                      {role}
                    </span>
                  </div>
                  <div style={{ padding: '6px 8px' }}>
                    {isDelivery ? (
                      <>
                        <Link to="/delivery" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <LayoutDashboard size={15} color="#10b981" /> Rider Dashboard
                        </Link>
                        <Link to="/delivery/profile" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <User size={15} color="#10b981" /> Profile
                        </Link>
                        <Link to="/delivery/support" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <Headphones size={15} color="#10b981" /> Help & Support
                        </Link>
                      </>
                    ) : isVendor ? (
                      <>
                        <Link to="/vendor/store-settings" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <Settings size={15} color="var(--primary)" /> Store Operations
                        </Link>
                        <Link to="/vendor/profile" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <User size={15} color="var(--primary)" /> KYC & Merchant Profile
                        </Link>
                        <Link to="/vendor/security" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <KeyRound size={15} color="var(--primary)" /> Security & 2FA
                        </Link>
                        <Link to="/vendor/support" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <Headphones size={15} color="var(--primary)" /> Merchant Helpdesk
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/admin" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <LayoutDashboard size={15} color="#2563eb" /> Admin Dashboard
                        </Link>
                        <Link to="/admin/vendors" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <Store size={15} color="#2563eb" /> Vendor Approvals
                        </Link>
                        <Link to="/admin/users" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <UserCheck size={15} color="#2563eb" /> System Users & Roles
                        </Link>
                        <Link to="/admin/settings" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                          <Settings size={15} color="#2563eb" /> Settings
                        </Link>
                      </>
                    )}
                  </div>
                  <div style={{ padding: '6px 8px', borderTop: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      className="dash-nav-link"
                      style={{ color: '#ef4444', fontSize: 13, padding: '8px 10px', width: '100%', textAlign: 'left' }}
                      onClick={handleLogout}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={mobileNav ? 'dash-content with-bottom-nav' : 'dash-content'}>
          <Outlet />
        </main>
        {mobileNav && <MobileBottomNav items={mobileNav} />}
      </div>
    </div>
  )
}
