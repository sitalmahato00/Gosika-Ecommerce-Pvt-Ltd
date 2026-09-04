import React, { useState, useEffect, useRef } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ShoppingBag, Menu, X, LogOut, Bell,
  Store, Wallet, Search, CheckCircle2, User,
  Settings, KeyRound, Headphones,
  PanelLeftClose, PanelLeftOpen,
  LayoutDashboard, UserCheck,
  Calendar, ChevronDown, ChevronRight,
  HelpCircle, Shield, Truck
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBranding } from '../../context/BrandingContext'
import { initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import MobileBottomNav from './MobileBottomNav'

export default function DashboardLayout({
  nav, title, roleLabel, homePath, rider, onDuty, onToggleDuty, dutyToggling, mobileNav,
}) {
  const toast = useToast()
  const { user, logout, isSuperAdmin } = useAuth()
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || branding.logo_dark
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

  return (
    <div className="dash-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {open && (
        <div className="overlay dash-sidebar-overlay" onClick={() => setOpen(false)} style={{ zIndex: 65 }} aria-hidden="true" />
      )}

      {/* ============================================================
          TOPBAR — Solid Brand Orange bar matching Image 2
          ============================================================ */}
      <header
        className="dash-topbar"
        style={{
          height: 64,
          background: '#ff5500',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 60,
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(255, 85, 0, 0.25)',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        {/* Left Section: Logo + Hamburger Menu */}
        <div className="flex items-center gap-3" style={{ minWidth: collapsed ? 'auto' : 220 }}>
          <Link
            to={isDelivery ? '/delivery' : isVendor ? '/vendor' : '/admin'}
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={brandName} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            ) : (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#ffffff',
                  color: '#ff5500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}
              >
                <ShoppingBag size={22} strokeWidth={2.4} />
              </div>
            )}
            <div style={{ lineHeight: 1.15 }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.04em', color: '#fff' }}>
                {brandName}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.02em' }}>
                {isDelivery ? 'Delivery Partner' : isVendor ? 'Vendor Portal' : 'Marketplace Admin'}
              </div>
            </div>
          </Link>

          {/* Hamburger toggle button */}
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
              marginLeft: 8,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              width: 36,
              height: 36,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center: Search input pill matching Image 2 */}
        <form
          onSubmit={handleGlobalSearch}
          className="hide-sm"
          style={{ flex: 1, maxWidth: 540, margin: '0 24px', position: 'relative' }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 44,
              paddingRight: 20,
              fontSize: 13.5,
              background: '#ffffff',
              color: '#1e293b',
              borderRadius: 9999,
              border: 'none',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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

        {/* Right: Actions, Notifications, User Avatar */}
        <div className="flex items-center gap-3">
          {/* Duty status toggle for Rider */}
          {isDelivery && (
            <button
              type="button"
              onClick={onToggleDuty}
              disabled={dutyToggling}
              className="chip hide-sm"
              style={{
                cursor: 'pointer',
                background: duty ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '5px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {duty ? '● Online' : '○ Offline'}
            </button>
          )}

          {/* Notifications Bell with Red Badge matching Image 2 */}
          <Link
            to={isDelivery ? '/delivery/notifications' : isVendor ? '/vendor/notifications' : '/admin/system/notifications'}
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textDecoration: 'none'
            }}
            title="Notifications"
          >
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 17,
                height: 17,
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #ff5500'
              }}
            >
              5
            </span>
          </Link>

          {/* Help Center Icon */}
          <Link
            to={isDelivery ? '/delivery/support' : isVendor ? '/vendor/support' : '/admin/customers/support'}
            className="hide-sm"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textDecoration: 'none'
            }}
            title="Help & Support"
          >
            <HelpCircle size={18} />
          </Link>

          {/* Settings Icon */}
          <Link
            to={isDelivery ? '/delivery/settings' : isVendor ? '/vendor/stores' : '/admin/system/settings'}
            className="hide-sm"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              textDecoration: 'none'
            }}
            title="Settings"
          >
            <Settings size={18} />
          </Link>

          {/* User Profile Avatar block matching Image 2 */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdown(!userDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                padding: '4px 12px 4px 5px',
                borderRadius: 9999,
                color: '#fff'
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
                  fontSize: 14,
                  fontWeight: 800
                }}
              >
                {userInitial}
              </span>
              <div className="hide-sm" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.8)' }}>
                  {subRoleName}
                </div>
              </div>
              <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.85)' }} />
            </button>

            {/* Dropdown Card */}
            {userDropdown && (
              <div
                className="card"
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
          MAIN BODY: Left Dark Sidebar + Right Content Area
          ============================================================ */}
      <div className="dash-body" style={{ display: 'flex', flex: 1, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left Dark Sidebar matching Image 2 */}
        <aside
          className={`dash-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
          aria-label={`${title} navigation`}
          style={{
            width: collapsed ? 72 : 220,
            background: '#161d2b',
            borderRight: '1px solid #20293a',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
            zIndex: 50
          }}
        >
          {/* Close button for mobile */}
          <div className="dash-sidebar-header show-sm" style={{ padding: '12px 16px', display: 'none' }}>
            <span style={{ color: '#fff', fontWeight: 800 }}>Navigation</span>
            <button className="dash-sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>

          {/* Delivery Rider Duty card if on delivery portal */}
          {isDelivery && !collapsed && (
            <div
              style={{
                margin: '12px 12px 6px',
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)'
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

          {/* Nav Links categorized into sections */}
          <nav className="dash-nav" aria-label="Dashboard menu" style={{ flex: 1, padding: '12px 10px' }}>
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
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Ic size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
                  {badgeCount && !collapsed && (
                    <span
                      style={{
                        background: '#ff5500',
                        color: '#ffffff',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: 9999,
                        minWidth: 20,
                        textAlign: 'center'
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom user profile snippet matching Image 2 */}
          <div
            className="dash-sidebar-user-footer"
            style={{
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', truncate: true }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {subRoleName}
                </div>
              </div>
            )}
            {!collapsed && <ChevronDown size={14} color="#64748b" />}
          </div>
        </aside>

        {/* Right: Main Scrollable Content */}
        <main
          className={mobileNav ? 'dash-content with-bottom-nav' : 'dash-content'}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#f4f6f9',
            padding: '18px 22px',
            minWidth: 0
          }}
        >
          <Outlet />
        </main>
        {mobileNav && <MobileBottomNav items={mobileNav} />}
      </div>
    </div>
  )
}
