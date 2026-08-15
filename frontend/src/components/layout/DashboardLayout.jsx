import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag, Menu, X, LogOut, Home, Bell, ChevronRight,
  Store, Wallet, Search, CheckCircle2, ShieldCheck, User,
  Settings, KeyRound, Headphones, ExternalLink, HelpCircle,
  Sparkles, Layers, PanelLeftClose, PanelLeftOpen, ChevronLeft
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function DashboardLayout({ nav, title, roleLabel, homePath }) {
  const toast = useToast()
  const { user, logout, isSuperAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Close sidebar on route change on mobile
  useEffect(() => {
    setOpen(false)
    setUserDropdown(false)
  }, [location.pathname])

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setUserDropdown(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener('keydown', handler)
    document.addEventListener('mousedown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.removeEventListener('mousedown', handler)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
  }

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toLowerCase()
    if (q.includes('order') || q.startsWith('vo-')) {
      navigate('/vendor/orders')
    } else if (q.includes('product') || q.includes('shawl') || q.includes('tea') || q.includes('bowl')) {
      navigate('/vendor/products')
    } else if (q.includes('wallet') || q.includes('payout') || q.includes('earning')) {
      navigate('/vendor/wallet')
    } else if (q.includes('coupon') || q.includes('promo')) {
      navigate('/vendor/coupons')
    } else if (q.includes('support') || q.includes('ticket') || q.startsWith('tck-')) {
      navigate('/vendor/support')
    } else {
      navigate('/vendor/orders')
    }
    setSearchQuery('')
  }

  const userInitials = initials(user?.name || user?.email || 'K')
  const role = roleLabel || (isSuperAdmin() ? 'Super Admin' : 'Verified Vendor')
  const isVendor = role.toLowerCase().includes('vendor')

  return (
    <div className="dash-shell">
      {/* Mobile Drawer Overlay */}
      {open && (
        <div
          className="overlay dash-sidebar-overlay"
          onClick={() => setOpen(false)}
          style={{ zIndex: 65 }}
          aria-hidden="true"
        />
      )}

      {/* Modern Dashboard Sidebar */}
      <aside className={`dash-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} aria-label={`${title} navigation`}>
        {/* Sidebar Header Brand */}
        <div className="dash-sidebar-header">
          <Link to="/" className="brand" style={{ color: '#fff', fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="brand-mark"
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={18} />
            </span>
            <span style={{ letterSpacing: '0.04em' }}>GOSIKA</span>
          </Link>
          <button
            className="dash-sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Store & Merchant Identity Profile Box */}
        <div
          className="store-identity-card"
          style={{
            margin: collapsed ? '8px 6px' : '12px 12px 6px',
            padding: collapsed ? '8px 4px' : '12px',
            borderRadius: 'var(--radius)',
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          title={isVendor ? 'Koshi Handicrafts Pvt. Ltd. (Verified)' : user?.name}
        >
          <div className="flex items-center gap-3">
            <div style={{ position: 'relative' }}>
              <span
                className="avatar"
                style={{
                  width: collapsed ? 36 : 40,
                  height: collapsed ? 36 : 40,
                  fontSize: 14,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isVendor ? 'K' : userInitials}
              </span>
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #0f172a',
                }}
                title="Online"
              />
            </div>

            <div className="store-details" style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{ color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}
                className="truncate"
              >
                {isVendor ? 'Koshi Handicrafts' : user?.name || 'Administrator'}
              </div>
              <div
                style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}
                className="truncate"
              >
                {isVendor ? 'hello@koshi.com.np' : user?.email}
              </div>
            </div>
          </div>

          <div className="store-details flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span
              className="chip chip-sm"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={10} /> Verified Partner
            </span>
            <span className="muted text-xs" style={{ color: '#64748b', fontSize: 10 }}>Koshi Hub</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="dash-nav" aria-label="Dashboard menu">
          {nav.map((item, i) => {
            if (item.section) {
              return (
                <div key={`section-${i}`} className="dash-nav-section" style={{ color: '#64748b', fontWeight: 800 }}>
                  {item.section}
                </div>
              )
            }

            // Real-time Badge indicators for key menu items
            let badge = null
            if (item.label === 'Orders') badge = { text: '1', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' }
            if (item.label === 'Notifications') badge = { text: '3', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
            if (item.label === 'Support Tickets') badge = { text: '1', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' }

            const Ic = Icons[item.icon] || Icons.Circle

            return (
              <NavLink
                key={item.to}
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
                  <span
                    style={{
                      background: badge.bg,
                      color: badge.color,
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: 999,
                    }}
                  >
                    {badge.text}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="dash-nav-footer">
          <Link
            to={homePath || '/shop'}
            className="dash-nav-link"
            style={{ marginBottom: 4, background: 'rgba(255,255,255,0.04)', color: '#cbd5e1' }}
            title={collapsed ? 'View Customer Store' : undefined}
          >
            <Store size={15} color="#38bdf8" />
            <span style={{ flex: 1, fontSize: 13 }}>View Customer Store</span>
            <ExternalLink size={12} color="#94a3b8" />
          </Link>
          <button
            type="button"
            className="dash-nav-link"
            style={{ color: '#f87171' }}
            onClick={handleLogout}
            aria-label="Logout"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="dash-main">
        {/* Modern Topbar Header */}
        <header className="dash-topbar" role="banner">
          {/* Left: Mobile Toggle, Desktop Collapse Toggle & Store Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Toggle */}
            <button
              className="icon-btn hide-md-up"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={open}
              style={{ flexShrink: 0 }}
            >
              <Menu size={19} />
            </button>

            {/* Desktop Sidebar Collapse Toggle */}
            <button
              type="button"
              className="icon-btn hide-sm"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{ flexShrink: 0 }}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <div className="flex items-center gap-2">
              <h1 className="dash-topbar-title" style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {title}
              </h1>
              <span
                className="chip chip-sm hide-sm"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: 10,
                  padding: '2px 8px',
                }}
              >
                ● Live & Online
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <form
            onSubmit={handleGlobalSearch}
            className="hide-sm"
            style={{ flex: 1, maxWidth: 380, margin: '0 16px', position: 'relative' }}
          >
            <Search
              size={14}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}
            />
            <input
              type="text"
              className="input"
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 34,
                paddingRight: 60,
                fontSize: 12.5,
                background: 'var(--bg)',
                borderRadius: 'var(--radius)',
              }}
              placeholder="Quick search orders, SKUs, tickets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 10,
                color: 'var(--muted)',
                background: '#fff',
                padding: '2px 5px',
                borderRadius: 4,
                border: '1px solid var(--border)',
              }}
            >
              Enter ↵
            </span>
          </form>

          {/* Right: Quick Action Controls & User Dropdown */}
          <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
            {/* Direct Storefront Button */}
            <Link
              to="/shop"
              className="btn btn-outline btn-xs hide-sm flex items-center gap-1"
              style={{ fontWeight: 700 }}
            >
              <Store size={12} /> Live Store
            </Link>

            {/* Wallet Balance Pill */}
            {isVendor && (
              <Link
                to="/vendor/wallet"
                className="chip chip-sm hide-sm flex items-center gap-1"
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '4px 10px',
                  textDecoration: 'none',
                }}
                title="Available Wallet Balance"
              >
                <Wallet size={13} />
                <span>Rs. 18,470</span>
              </Link>
            )}

            {/* Notifications Bell */}
            <Link
              to={isVendor ? '/vendor/notifications' : '/admin/notifications'}
              className="icon-btn"
              style={{ position: 'relative' }}
              title="Notifications"
            >
              <Bell size={17} />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}
              >
                3
              </span>
            </Link>

            {/* User Dropdown Trigger */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                type="button"
                className="avatar"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  border: '2px solid rgba(37,99,235,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User profile menu"
              >
                {isVendor ? 'K' : userInitials}
              </button>

              {/* Interactive User Dropdown Menu */}
              {userDropdown && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 240,
                    padding: 0,
                    zIndex: 100,
                    boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <div style={{ padding: '14px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <div className="font-bold text-sm text-ink truncate">
                      {isVendor ? 'Koshi Handicrafts Pvt. Ltd.' : user?.name}
                    </div>
                    <div className="muted text-xs truncate mt-0.5" style={{ fontSize: 11 }}>
                      {isVendor ? 'hello@koshi.com.np' : user?.email}
                    </div>
                    <span
                      className="chip chip-sm mt-1.5"
                      style={{ background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 800, fontSize: 10 }}
                    >
                      {role}
                    </span>
                  </div>

                  {/* Dropdown Links */}
                  <div style={{ padding: '6px 8px' }}>
                    <Link
                      to={isVendor ? '/vendor/store-settings' : '/admin'}
                      className="dash-nav-link"
                      style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                      onClick={() => setUserDropdown(false)}
                    >
                      <Settings size={15} color="var(--primary)" /> Store Operations
                    </Link>
                    <Link
                      to={isVendor ? '/vendor/profile' : '/admin/profile'}
                      className="dash-nav-link"
                      style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                      onClick={() => setUserDropdown(false)}
                    >
                      <User size={15} color="var(--primary)" /> KYC & Merchant Profile
                    </Link>
                    <Link
                      to={isVendor ? '/vendor/security' : '/admin/security'}
                      className="dash-nav-link"
                      style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                      onClick={() => setUserDropdown(false)}
                    >
                      <KeyRound size={15} color="var(--primary)" /> Security & 2FA
                    </Link>
                    <Link
                      to={isVendor ? '/vendor/support' : '/admin/support'}
                      className="dash-nav-link"
                      style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                      onClick={() => setUserDropdown(false)}
                    >
                      <Headphones size={15} color="var(--primary)" /> Merchant Helpdesk
                    </Link>
                  </div>

                  {/* Dropdown Logout */}
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

        {/* Page Content Viewport */}
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
