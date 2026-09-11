import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { LogOut, ChevronRight, Menu, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useBranding } from '../../context/BrandingContext'
import { initials, apiImage } from '../../utils/format'
import { CUSTOMER_NAV } from '../../utils/constants'
import { AccountNavContext } from './AccountUI'

function AccountNavItems({ onNavigate }) {
  return CUSTOMER_NAV.map((item, idx) => {
    if (item.section) {
      return (
        <div key={`s-${item.section}-${idx}`} className="acc-s-label">
          <span className="acc-s-label-text">{item.section}</span>
        </div>
      )
    }
    const Icon = Icons[item.icon] || Icons.Circle
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        aria-label={item.label}
        title={item.label}
        className={({ isActive }) => `acc-nav-link${isActive ? ' active' : ''}`}
      >
        <Icon size={17} strokeWidth={2} aria-hidden="true" />
        <span className="acc-nav-text">{item.label}</span>
      </NavLink>
    )
  })
}

export default function AccountLayout() {
  const { user, logout } = useAuth()
  const branding = useBranding()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [label, setLabel] = useState('My Account')

  const userInitials = useMemo(() => initials(user?.name || user?.email || 'U'), [user])
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const brandLogo = branding.logo_light || branding.logo_dark || ''

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const navCtx = useMemo(() => ({ label, setLabel }), [label])

  return (
    <div className="page-shell container account-shell" style={{ paddingTop: 24, paddingBottom: 56 }}>
      {/* Desktop breadcrumb */}
      <BreadcrumbNav activeLabel={label} />

      {/* Mobile account toolbar */}
      <div className="acc-mobilebar">
        <button
          type="button"
          className="acc-menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Open account menu"
          aria-expanded={menuOpen}
        >
          <Menu size={22} />
        </button>
        <div className="acc-current-title">{label}</div>
        <Link to="/account/profile" className="acc-mobile-avatar" aria-label="Go to profile">
          {user?.avatar ? (
            <img src={apiImage(user.avatar)} alt="" />
          ) : (
            <span>{userInitials}</span>
          )}
        </Link>
      </div>

      {/* Mobile drawer + backdrop */}
      {menuOpen && <div className="acc-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <aside
        className={`acc-drawer ${menuOpen ? 'open' : ''}`}
        aria-hidden={!menuOpen}
        aria-label="Account menu"
      >
        <div className="acc-drawer-head">
          <BrandBlock link={false} brandName={brandName} brandLogo={brandLogo} />
          <button
            type="button"
            className="acc-drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {user && (
          <div className="acc-user">
            {user.avatar ? (
              <img className="acc-user-avatar" src={apiImage(user.avatar)} alt="" />
            ) : (
              <span className="acc-user-avatar">{userInitials}</span>
            )}
            <div className="acc-user-text">
              <div className="acc-user-name">{user.name}</div>
              <div className="acc-user-mail">{user.email}</div>
            </div>
          </div>
        )}

        <div className="acc-nav-scroll">
          <nav className="acc-nav" aria-label="Account navigation" onClick={() => setMenuOpen(false)}>
            <AccountNavItems onNavigate={() => setMenuOpen(false)} />
          </nav>
        </div>

        <button type="button" className="acc-logout" onClick={handleLogout}>
          <LogOut size={17} />
          <span className="acc-logout-text">Logout</span>
        </button>
      </aside>

      {/* Desktop / tablet grid */}
      <div className="account-layout" id="account-layout-grid">
        <aside className="acc-sidebar">
          <BrandBlock link brandName={brandName} brandLogo={brandLogo} />
          {user && (
            <div className="acc-user">
              {user.avatar ? (
                <img className="acc-user-avatar" src={apiImage(user.avatar)} alt="" />
              ) : (
                <span className="acc-user-avatar">{userInitials}</span>
              )}
              <div className="acc-user-text">
                <div className="acc-user-name">{user.name}</div>
                <div className="acc-user-mail">{user.email}</div>
              </div>
            </div>
          )}
          <div className="acc-nav-scroll">
            <nav className="acc-nav" aria-label="Account navigation">
              <AccountNavItems />
            </nav>
          </div>
          <button type="button" className="acc-logout" onClick={handleLogout}>
            <LogOut size={17} />
            <span className="acc-logout-text">Logout</span>
          </button>
        </aside>

        <main className="account-main" style={{ minWidth: 0 }}>
          <AccountNavContext.Provider value={navCtx}>
            <Outlet />
          </AccountNavContext.Provider>
        </main>
      </div>
    </div>
  )
}

function BrandBlock({ link, brandName, brandLogo }) {
  const logo = (
    <>
      {brandLogo ? (
        <img className="acc-brand-logo" src={apiImage(brandLogo)} alt={`${brandName} logo`} />
      ) : (
        <span className="acc-brand-mark">G</span>
      )}
      <span className="acc-brand-text">{brandName}</span>
    </>
  )
  return link ? (
    <Link className="acc-brand" to="/" aria-label={`${brandName} Home`}>
      {logo}
    </Link>
  ) : (
    <div className="acc-brand">{logo}</div>
  )
}

function BreadcrumbNav({ activeLabel }) {
  return (
    <nav className="acc-breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <ChevronRight size={13} className="acc-breadcrumb-sep" />
      <span>My Account</span>
      {activeLabel && activeLabel !== 'My Account' && (
        <>
          <ChevronRight size={13} className="acc-breadcrumb-sep" />
          <span className="acc-breadcrumb-here">{activeLabel}</span>
        </>
      )}
    </nav>
  )
}