import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag, Menu, X, LogOut, Bell,
  Store, Wallet, Search, User,
  Settings, KeyRound, Headphones,
  LayoutDashboard, UserCheck,
  Calendar, ChevronDown, ChevronRight,
  HelpCircle, Shield, Truck
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBranding } from '../../context/BrandingContext'
import { initials, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import MobileBottomNav from './MobileBottomNav'
import api from '../../api/client'

export default function DashboardLayout({
  nav, title, roleLabel, homePath, rider, onDuty, onToggleDuty, dutyToggling, mobileNav,
}) {
  const toast = useToast()
  const { user, logout, isSuperAdmin } = useAuth()
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const brandLogo = branding.logo_dark || branding.logo_light || ''
  const logoUrl = brandLogo ? apiImage(brandLogo) : ''
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setOpen(false); setUserDropdown(false) }, [location.pathname])

  useEffect(() => {
    let alive = true
    const fetchUnread = () => {
      api.get(unreadEndpoint, { skipCache: true })
        .then((res) => { if (alive) setUnreadCount(Number(res.data?.data?.unread_count) || 0) })
        .catch(() => {})
    }
    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => { alive = false; clearInterval(timer) }
  }, [unreadEndpoint])

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
  const unreadEndpoint = isDelivery
    ? '/delivery-partner/notifications/unread-count'
    : isVendor
    ? '/vendor/notifications/unread-count'
    : '/admin/notifications/feed/unread-count'
  const duty = onDuty ?? rider?.is_online ?? false
  const riderName = rider?.name || user?.name || 'Delivery Partner'
  const riderArea = Array.isArray(rider?.service_areas) && rider.service_areas.length > 0 ? rider.service_areas[0] : 'Dispatch Hub'

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
      if (q.includes('vendor') || q.includes('seller')) navigate('/admin/marketplace/vendors')
      else if (q.includes('order')) navigate('/admin/orders')
      else if (q.includes('product') || q.includes('category')) navigate('/admin/marketplace/products')
      else if (q.includes('user') || q.includes('customer')) navigate('/admin/customers')
      else navigate('/admin/orders')
    }
    setSearchQuery('')
  }

  const displayName = isDelivery
    ? riderName
    : isVendor
    ? (user?.company_name || user?.name || 'Vendor')
    : (user?.name || 'Admin')

  const subRoleName = isDelivery
    ? 'Delivery Partner'
    : isVendor
    ? 'Verified Merchant'
    : (isSuperAdmin() ? 'Super Admin' : 'Administrator')

  const userInitial = isDelivery
    ? initials(riderName)
    : isVendor
    ? (displayName.charAt(0) || 'V')
    : (user?.name ? user.name.charAt(0).toUpperCase() : 'A')

  const portalShort = isDelivery ? 'Delivery Portal' : isVendor ? 'Vendor Portal' : 'Marketplace Control'
  const home = homePath || (isDelivery ? '/delivery' : isVendor ? '/vendor' : '/admin')

  return (
    <div
      className="dash-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gridTemplateRows: '64px 1fr',
        gridTemplateAreas: '"sidebar header" "sidebar main"',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#f8fafc'
      }}
    >
      {open && (
        <div
          className="overlay dash-sidebar-overlay"
          onClick={() => setOpen(false)}
          style={{ zIndex: 65, backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.45)' }}
          aria-hidden="true"
        />
      )}

      {/* ============================================================
          STICKY GLASS HEADER (SaaS)
          ============================================================ */}
      <header
        className="dash-topbar saas-glass gpu"
        style={{
          gridArea: 'header',
          height: 64,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.82)',
          boxShadow: '0 4px 18px rgba(2, 6, 23, 0.05)',
          zIndex: 40,
          flexShrink: 0,
          position: 'sticky',
          top: 0,
        }}
      >
        {/* Left: collapse toggle */}
        <div className="dash-topbar-left flex items-center" style={{ gap: 3 }}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (window.innerWidth <= 900) {
                setOpen(!open)
              } else {
                setCollapsed(!collapsed)
              }
            }}
            aria-label="Toggle navigation"
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#334155',
              width: 38,
              height: 38,
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center: omni search pill */}
        <form
          onSubmit={handleGlobalSearch}
          className="hide-sm"
          style={{ flex: 1, maxWidth: 540, margin: '0 24px', position: 'relative' }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
              zIndex: 1
            }}
          />
          <input
            type="text"
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 40,
              paddingRight: 20,
              fontSize: 13.5,
              background: '#f1f5f9',
              color: '#1e293b',
              borderRadius: 9999,
              border: '1px solid transparent',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
              transition: 'box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease'
            }}
            onFocus={(e) => {
              e.target.style.background = '#ffffff'
              e.target.style.boxShadow = '0 0 0 3px rgba(255, 85, 0, 0.14)'
            }}
            onBlur={(e) => {
              e.target.style.background = '#f1f5f9'
              e.target.style.boxShadow = 'inset 0 1px 2px rgba(15, 23, 42, 0.04)'
            }}
            placeholder={
              isDelivery ? 'Search deliveries, earnings, customers...'
              : isVendor ? 'Search orders, products, inventory...'
              : 'Search orders, products, customers...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Right: actions + user */}
        <div className="flex items-center gap-2" style={{ gap: 8 }}>
          {isDelivery && (
            <button
              type="button"
              onClick={onToggleDuty}
              disabled={dutyToggling}
              className="chip hide-sm btn-tactile"
              style={{
                cursor: 'pointer',
                background: duty ? 'rgba(255, 85, 0, 0.1)' : '#f8fafc',
                color: duty ? '#ff5500' : '#64748b',
                border: `1px solid ${duty ? 'rgba(255, 85, 0, 0.28)' : '#e2e8f0'}`,
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {duty ? '● Online' : '○ Offline'}
            </button>
          )}

          <Link
            to={isDelivery ? '/delivery/notifications' : isVendor ? '/vendor/notifications' : '/admin/system/notifications'}
            className="btn-tactile"
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              textDecoration: 'none'
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="badge-pop"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  minWidth: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to={isDelivery ? '/delivery/support' : isVendor ? '/vendor/support' : '/admin/customers/support'}
            className="hide-sm btn-tactile"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              textDecoration: 'none'
            }}
            title="Help & Support"
          >
            <HelpCircle size={18} />
          </Link>

          <Link
            to={isDelivery ? '/delivery/settings' : isVendor ? '/vendor/stores' : '/admin/system/settings'}
            className="hide-sm btn-tactile"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#334155',
              textDecoration: 'none'
            }}
            title="Settings"
          >
            <Settings size={18} />
          </Link>

          {/* User profile chip */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdown(!userDropdown)}
              className="btn-tactile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                padding: '4px 12px 4px 5px',
                borderRadius: 9999,
                color: '#1e293b',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)'
              }}
              aria-label="User profile menu"
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#161d2b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800
                }}
              >
                {userInitial}
              </span>
              <div className="hide-sm" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                  {subRoleName}
                </div>
              </div>
              <ChevronDown size={14} style={{ color: '#94a3b8' }} />
            </button>

            {userDropdown && (
              <div
                className="card modal-ease"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 250,
                  padding: 0,
                  zIndex: 100,
                  boxShadow: 'var(--shadow-xl)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: '#fff',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <div className="font-bold text-sm text-ink truncate">
                    {displayName}
                  </div>
                  <div className="muted text-xs truncate" style={{ marginTop: 2, fontSize: 11 }}>
                    {user?.email || 'admin@gosika.com.np'}
                  </div>
                  <span
                    className="chip chip-sm"
                    style={{
                      marginTop: 6,
                      display: 'inline-flex',
                      background: 'rgba(255,85,0,0.12)',
                      color: '#ff5500',
                      fontWeight: 800,
                      fontSize: 10
                    }}
                  >
                    {subRoleName}
                  </span>
                </div>
                <div style={{ padding: '6px 8px' }}>
                  {isDelivery ? (
                    <>
                      <Link to="/delivery" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <LayoutDashboard size={15} color="#ff5500" /> Rider Dashboard
                      </Link>
                      <Link to="/delivery/profile" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <User size={15} color="#ff5500" /> Profile
                      </Link>
                      <Link to="/delivery/support" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <Headphones size={15} color="#ff5500" /> Help & Support
                      </Link>
                    </>
                  ) : isVendor ? (
                    <>
                      <Link to="/vendor/stores" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <Settings size={15} color="#ff5500" /> Store Operations
                      </Link>
                      <Link to="/vendor/profile" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <User size={15} color="#ff5500" /> Merchant Profile
                      </Link>
                      <Link to="/vendor/support" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <Headphones size={15} color="#ff5500" /> Support Desk
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/admin" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <LayoutDashboard size={15} color="#ff5500" /> Admin Dashboard
                      </Link>
                      <Link to="/admin/marketplace/vendors" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <Store size={15} color="#ff5500" /> Sellers & Approvals
                      </Link>
                      <Link to="/admin/system/settings" className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <Settings size={15} color="#ff5500" /> Marketplace Settings
                      </Link>
                    </>
                  )}
                </div>
                <div style={{ padding: '6px 8px' }}>
                  <div style={{ padding: '6px 10px 8px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', color: '#94a3b8' }}>SWITCH PORTAL</div>
                  {[
                    { label: 'Super Admin', sub: 'Marketplace control', icon: 'LayoutDashboard', to: '/admin' },
                    { label: 'Merchant Hub', sub: 'Vendor & store ops', icon: 'Store', to: '/vendor' },
                    { label: 'Logistics & Fleet', sub: 'Dispatch & delivery', icon: 'Truck', to: '/delivery' },
                    { label: 'Buyer Portal', sub: 'Shop & account hub', icon: 'User', to: '/account' },
                  ].map((p) => {
                    const PortalIcon = Icons[p.icon]
                    const activePortal = location.pathname.startsWith(p.to)
                    return (
                      <Link key={p.to} to={p.to} className="dash-nav-link" style={{ color: 'var(--ink)', fontSize: 13, padding: '8px 10px' }} onClick={() => setUserDropdown(false)}>
                        <PortalIcon size={15} color={activePortal ? '#ff5500' : '#94a3b8'} /> {p.label}
                      </Link>
                    )
                  })}
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

      {/* ============================================================
          BODY: dual-zone sidebar + independent content pane
          ============================================================ */}
      <aside
        className={`dash-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
        aria-label={`${title} navigation`}
        style={{
          gridArea: 'sidebar',
          width: collapsed ? 72 : 224,
            background: '#161d2b',
            borderRight: '1px solid #20293a',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            height: '100%',
            overflow: 'hidden',
            overflowX: 'hidden',
            transition: 'width 0.22s ease',
            zIndex: 50
          }}
        >
          {/* PINNED brand zone */}
          <div
            className="dash-sidebar-brand shrink-0"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 10,
              padding: collapsed ? '14px 0' : '14px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
              background: '#131924'
            }}
          >
            <Link to={home} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff', minWidth: 0 }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  style={{ height: 34, width: 'auto', objectFit: 'contain' }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: '#ff5500',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(255, 85, 0, 0.35)'
                  }}
                >
                  <ShoppingBag size={17} strokeWidth={2.4} />
                </div>
              )}
              {!collapsed && (
                <div style={{ lineHeight: 1.15, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#fff', letterSpacing: '0.03em', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {brandName}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                    {portalShort}
                  </div>
                </div>
              )}
            </Link>
            <button className="dash-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation" style={{ color: '#94a3b8' }}>
              <X size={18} />
            </button>
          </div>

          {/* Delivery Rider duty card */}
          {isDelivery && !collapsed && (
            <div
              style={{
                margin: '12px 12px 4px',
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#ff5500',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Truck size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#fff' }}>{riderName}</div>
                  <div className="text-xs truncate" style={{ color: '#94a3b8' }}>{riderArea}</div>
                </div>
              </div>
            </div>
          )}

          {/* SCROLLING nav zone */}
          <nav className="dash-nav saas-scroll" aria-label="Dashboard menu" style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
            {nav.map((item, i) => {
              if (item.section) {
                return (
                  <div
                    key={`section-${i}`}
                    className="dash-nav-section"
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#64748b',
                      padding: collapsed ? '14px 4px 4px' : '16px 12px 6px',
                      fontWeight: 700,
                      textAlign: collapsed ? 'center' : 'left'
                    }}
                  >
                    {collapsed ? '—' : item.section}
                  </div>
                )
              }

              const badgeCount = item.badge
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
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: collapsed ? '10px 0' : '10px 14px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 8,
                    fontSize: 13.5,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? '#ff5500' : 'transparent',
                    boxShadow: isActive ? '0 4px 14px rgba(255, 85, 0, 0.35)' : 'none',
                    fontWeight: isActive ? 600 : 500,
                    marginBottom: 3,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    transform: isActive ? 'translateX(2px)' : 'none'
                  })}
                >
                  <Ic size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {badgeCount && !collapsed && (
                    <span className="badge-pop dash-nav-badge" style={{ minWidth: 20, textAlign: 'center' }}>
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* PINNED profile footer */}
          <div
            className="dash-sidebar-user-footer shrink-0 gpu"
            style={{
              flexShrink: 0,
              padding: '12px 14px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: '#131924',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer'
            }}
            onClick={() => setUserDropdown(!userDropdown)}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#ff5500',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0
              }}
            >
              {userInitial}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {subRoleName}
                </div>
              </div>
            )}
            {!collapsed && <ChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />}
          </div>
        </aside>

        {/* Right: independent scrollable content pane */}
        <main
          className={mobileNav ? 'dash-content with-bottom-nav' : 'dash-content'}
          style={{
            gridArea: 'main',
            flex: 1,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#f8fafc',
            padding: '22px 26px'
          }}
        >
          <Outlet />
        </main>
        {mobileNav && <MobileBottomNav items={mobileNav} />}
    </div>
  )
}