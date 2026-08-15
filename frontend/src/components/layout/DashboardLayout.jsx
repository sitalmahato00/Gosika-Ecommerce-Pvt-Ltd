import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag, Menu, X, LogOut, Home, Bell, ChevronRight,
  Store, Wallet, Search, CheckCircle2, ShieldCheck, User,
  Settings, KeyRound, Headphones, ExternalLink, HelpCircle,
  Sparkles, Layers, PanelLeftClose, PanelLeftOpen, ChevronLeft,
  LayoutDashboard, UserCheck, Percent, CreditCard, Shield
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import MobileBottomNav from './MobileBottomNav'

export default function DashboardLayout({
  nav,
  title,
  roleLabel,
  homePath,
  rider,
  onDuty,
  onToggleDuty,
  dutyToggling,
  mobileNav,
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

  const userInitials = initials(user?.name || user?.email || 'A')
  const role = roleLabel || (isSuperAdmin() ? 'Super Admin' : 'Vendor')
  const isVendor = role.toLowerCase().includes('vendor')
  const isDelivery = role.toLowerCase().includes('delivery') || role.toLowerCase().includes('rider')
  const duty = onDuty ?? rider?.is_online ?? false
  const riderName = rider?.name || user?.name || 'Delivery Partner'
  const riderArea = Array.isArray(rider?.service_areas) && rider.service_areas.length > 0
    ? rider.service_areas[0]
    : 'Dispatch Hub'

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toLowerCase()
    
    if (isDelivery) {
      if (q.includes('task') || q.includes('order') || q.includes('deliver')) {
        navigate('/delivery/deliveries')
      } else if (q.includes('active') || q.includes('route') || q.includes('map') || q.includes('gps')) {
        navigate('/delivery/active')
      } else if (q.includes('history') || q.includes('completed') || q.includes('done')) {
        navigate('/delivery/history')
      } else if (q.includes('earning') || q.includes('payout') || q.includes('fee')) {
        navigate('/delivery/earnings')
      } else if (q.includes('transaction') || q.includes('ledger')) {
        navigate('/delivery/transactions')
      } else if (q.includes('cod') || q.includes('cash')) {
        navigate('/delivery/cod-collection')
      } else if (q.includes('profile') || q.includes('vehicle') || q.includes('rider')) {
        navigate('/delivery/profile')
      } else if (q.includes('support') || q.includes('help') || q.includes('faq')) {
        navigate('/delivery/support')
      } else {
        navigate('/delivery/deliveries')
      }
    } else if (isVendor) {
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
    } else {
      // Admin Search Router
      if (q.includes('vendor') || q.includes('koshi') || q.includes('store')) {
        navigate('/admin/vendors')
      } else if (q.includes('order')) {
        navigate('/admin/orders')
      } else if (q.includes('product') || q.includes('category')) {
        navigate('/admin/products')
      } else if (q.includes('user') || q.includes('customer')) {
        navigate('/admin/users')
      } else if (q.includes('commission') || q.includes('payout') || q.includes('settlement')) {
        navigate('/admin/commissions')
      } else if (q.includes('support') || q.includes('ticket')) {
        navigate('/admin/support')
      } else {
        navigate('/admin/orders')
      }
    }
    setSearchQuery('')
  }

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
                background: isDelivery
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : isVendor
                  ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isDelivery
                  ? '0 2px 8px rgba(16,185,129,0.4)'
                  : isVendor
                  ? '0 2px 8px rgba(37,99,235,0.4)'
                  : '0 2px 8px rgba(99,102,241,0.4)',
                flexShrink: 0,
              }}
            >
              {isDelivery ? <Icons.Truck size={18} /> : isVendor ? <ShoppingBag size={18} /> : <Shield size={18} />}
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

        {/* Store & Merchant Identity Profile Box (Vendor only) */}
        {isVendor && (
          <div
            className="store-identity-card"
            style={{
              margin: collapsed ? '8px 6px' : '12px 12px 6px',
              padding: collapsed ? '8px 4px' : '12px',
              borderRadius: 'var(--radius)',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title="Koshi Handicrafts Pvt. Ltd. (Verified)"
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
                  K
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
                  Koshi Handicrafts
                </div>
                <div
                  style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}
                  className="truncate"
                >
                  hello@koshi.com.np
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
              <span className="muted text-xs" style={{ color: '#64748b', fontSize: 10 }}>
                Koshi Hub
              </span>
            </div>
          </div>
        )}

        {/* Delivery Rider Identity Card (Delivery only) */}
        {isDelivery && (
          <div
            className="store-identity-card"
            style={{
              margin: collapsed ? '8px 6px' : '12px 12px 6px',
              padding: collapsed ? '8px 4px' : '12px',
              borderRadius: 'var(--radius)',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
            title={`${riderName} — GOSIKA Delivery Partner`}
          >
            <div className="flex items-center gap-3">
              <span
                className="avatar"
                style={{
                  width: collapsed ? 36 : 40,
                  height: collapsed ? 36 : 40,
                  fontSize: 14,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icons.Truck size={18} />
              </span>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white truncate">{riderName}</div>
                  <div className="text-xs truncate font-mono" style={{ color: '#94a3b8' }}>
                    {rider?.vehicle_number || 'Vehicle not set'}
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <div className="store-details flex items-center justify-between mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span
                  className="chip chip-sm"
                  style={{
                    background: duty ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: duty ? '#34d399' : '#94a3b8',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 8px',
                    border: '1px solid ' + (duty ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)'),
                  }}
                >
                  {duty ? '● Online / On Duty' : '● Offline'}
                </span>
                <span className="muted text-xs truncate" style={{ color: '#64748b', fontSize: 10, maxWidth: 120 }}>
                  {riderArea}
                </span>
              </div>
            )}
          </div>
        )}

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
            if (item.label === 'Vendors') badge = { text: '3', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' }
            if (item.label === 'Notifications') badge = { text: '3', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' }
            if (item.label === 'Support Tickets' || item.label === 'Support') badge = { text: '1', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.2)' }

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
                  background: isDelivery
                    ? duty
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(148, 163, 184, 0.15)'
                    : isVendor
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(99, 102, 241, 0.1)',
                  color: isDelivery ? (duty ? '#10b981' : '#64748b') : isVendor ? '#10b981' : '#6366f1',
                  fontWeight: 800,
                  fontSize: 10,
                  padding: '2px 8px',
                }}
              >
                ● {isDelivery ? (duty ? 'Online / On Duty' : 'Offline') : isVendor ? 'Live & Online' : 'Super Admin Active'}
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
              placeholder={
                isDelivery
                  ? 'Quick search deliveries, earnings, support…'
                  : isVendor
                  ? 'Quick search orders, SKUs, tickets…'
                  : 'Search vendors, orders, users, payouts…'
              }
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

            {/* Wallet / Platform Status Pill */}
            {isDelivery ? (
              <Link
                to="/delivery/earnings"
                className="chip chip-sm hide-sm flex items-center gap-1"
                style={{
                  background: duty ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.15)',
                  color: duty ? '#10b981' : '#64748b',
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '4px 10px',
                  textDecoration: 'none',
                }}
                title="Rider Earnings"
              >
                <Icons.TrendingUp size={13} />
                <span>Rider Earnings</span>
              </Link>
            ) : isVendor ? (
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
            ) : (
              <Link
                to="/admin/commissions"
                className="chip chip-sm hide-sm flex items-center gap-1"
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '4px 10px',
                  textDecoration: 'none',
                }}
                title="Platform Governance"
              >
                <ShieldCheck size={13} />
                <span>System Normal</span>
              </Link>
            )}

            {/* Notifications Bell */}
            <Link
              to={isDelivery ? '/delivery/notifications' : isVendor ? '/vendor/notifications' : '/admin/notifications'}
              className="icon-btn"
              style={{ position: 'relative' }}
              title="Notifications"
            >
              <Bell size={17} />
              {!isDelivery && (
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
              )}
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
                  background: isDelivery
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : isVendor
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  border: isDelivery
                    ? '2px solid rgba(16,185,129,0.25)'
                    : isVendor
                    ? '2px solid rgba(37,99,235,0.2)'
                    : '2px solid rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User profile menu"
              >
                {isDelivery ? initials(riderName) : isVendor ? 'K' : 'A'}
              </button>

              {/* Interactive User Dropdown Menu */}
              {userDropdown && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 250,
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
                      {isVendor
                        ? 'Koshi Handicrafts Pvt. Ltd.'
                        : isDelivery
                        ? riderName
                        : user?.name || 'GOSIKA Platform HQ'}
                    </div>
                    <div className="muted text-xs truncate mt-0.5" style={{ fontSize: 11 }}>
                      {isVendor
                        ? 'hello@koshi.com.np'
                        : isDelivery
                        ? rider?.email || user?.email || 'delivery@gosika.com.np'
                        : user?.email || 'admin@gosika.com.np'}
                    </div>
                    <span
                      className="chip chip-sm mt-1.5"
                      style={{
                        background: isVendor ? 'var(--primary-50)' : 'rgba(99,102,241,0.15)',
                        color: isVendor ? 'var(--primary)' : '#4f46e5',
                        fontWeight: 800,
                        fontSize: 10,
                      }}
                    >
                      {role}
                    </span>
                  </div>

                  {/* Dropdown Links for Vendor vs Admin vs Delivery */}
                  <div style={{ padding: '6px 8px' }}>
                    {isDelivery ? (
                      <>
                        <Link
                          to="/delivery"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <LayoutDashboard size={15} color="#10b981" /> Rider Dashboard
                        </Link>
                        <Link
                          to="/delivery/deliveries"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.Truck size={15} color="#10b981" /> Assigned Deliveries
                        </Link>
                        <Link
                          to="/delivery/active"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.Navigation size={15} color="#10b981" /> Active Delivery
                        </Link>
                        <Link
                          to="/delivery/earnings"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.TrendingUp size={15} color="#10b981" /> Earnings & Payouts
                        </Link>
                        <Link
                          to="/delivery/transactions"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.Receipt size={15} color="#10b981" /> Transactions
                        </Link>
                        <Link
                          to="/delivery/cod-collection"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Wallet size={15} color="#10b981" /> COD Cash Ledger
                        </Link>
                        <Link
                          to="/delivery/notifications"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.Bell size={15} color="#10b981" /> Notifications
                        </Link>
                        <Link
                          to="/delivery/profile"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <User size={15} color="#10b981" /> Rider & Vehicle Profile
                        </Link>
                        <Link
                          to="/delivery/support"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Headphones size={15} color="#10b981" /> Help & Support
                        </Link>
                      </>
                    ) : isVendor ? (
                      <>
                        <Link
                          to="/vendor/store-settings"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Settings size={15} color="var(--primary)" /> Store Operations
                        </Link>
                        <Link
                          to="/vendor/profile"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <User size={15} color="var(--primary)" /> KYC & Merchant Profile
                        </Link>
                        <Link
                          to="/vendor/security"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <KeyRound size={15} color="var(--primary)" /> Security & 2FA
                        </Link>
                        <Link
                          to="/vendor/support"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Headphones size={15} color="var(--primary)" /> Merchant Helpdesk
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/admin"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <LayoutDashboard size={15} color="#4f46e5" /> Admin Control Desk
                        </Link>
                        <Link
                          to="/delivery"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Icons.Truck size={15} color="#10b981" /> Delivery Partner Portal
                        </Link>
                        <Link
                          to="/admin/vendors"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Store size={15} color="#4f46e5" /> Vendor Approvals & KYC
                        </Link>
                        <Link
                          to="/admin/users"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <UserCheck size={15} color="#4f46e5" /> System Users & Roles
                        </Link>
                        <Link
                          to="/admin/commissions"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Percent size={15} color="#4f46e5" /> Platform Commissions
                        </Link>
                        <Link
                          to="/admin/support"
                          className="dash-nav-link"
                          style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }}
                          onClick={() => setUserDropdown(false)}
                        >
                          <Headphones size={15} color="#4f46e5" /> Central Support Desk
                        </Link>
                      </>
                    )}
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
        <main className={mobileNav ? 'dash-content with-bottom-nav' : 'dash-content'}>
          <Outlet />
        </main>
        {mobileNav && <MobileBottomNav items={mobileNav} />}
      </div>
    </div>
  )
}
