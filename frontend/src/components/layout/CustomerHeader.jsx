import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Heart, User, Search, Menu, Truck, MapPin,
  Store, ChevronDown, X, Bell, Phone, Package, LogOut,
  UserCheck, LayoutDashboard, Settings, Flame, Clock, HelpCircle, Tag
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useWishlist } from '../../context/WishlistContext'
import { useAuth } from '../../context/AuthContext'
import { initials, apiImage } from '../../utils/format'
import Drawer from '../ui/Drawer'
import api from '../../api/client'
import { getCategoryIcon } from '../../utils/icons'
import GosikaLogo from '../common/GosikaLogo'

import { useBranding } from '../../context/BrandingContext'

function Logo({ size = 'md' }) {
  const branding = useBranding()
  const brandName = branding.brand_name || branding.site_name || 'GOSIKA'
  const logoUrl = branding.logo_light || branding.logo_dark
  return (
    <Link to="/" className="brand" aria-label={brandName} style={{ fontSize: 22, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      {logoUrl ? (
        <img src={apiImage(logoUrl)} alt={brandName} className="customer-brand-image" />
      ) : (
        <>
          <GosikaLogo size={32} showText={false} />
          <span style={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            {brandName}
          </span>
        </>
      )}
    </Link>
  )
}

export default function CustomerHeader() {
  const { itemCount } = useCart()
  const { ids: wishlistIds = [] } = useWishlist() || {}
  const { user, isVendor, isSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const accountRef = useRef(null)
  const suggestRef = useRef(null)
  const prevItemCount = useRef(itemCount)

  useEffect(() => {
    api
      .get('/categories', { params: { per_page: 12 } })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    let alive = true
    const fetchUnread = () => {
      api.get('/customer/notifications/unread-count', { skipCache: true })
        .then((res) => { if (alive) setUnreadNotif(Number(res.data?.data?.unread_count) || 0) })
        .catch(() => {})
    }
    fetchUnread()
    const timer = setInterval(fetchUnread, 30000)
    return () => { alive = false; clearInterval(timer) }
  }, [!!user])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close suggestions on Escape key
  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Debounced suggestions fetch when q changes
  useEffect(() => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      setSuggestOpen(false)
      return
    }
    const timer = setTimeout(() => {
      api
        .get('/products/suggestions', { params: { q: trimmed } })
        .then((res) => {
          const items = res.data?.data || []
          setSuggestions(items)
          setSuggestOpen(items.length > 0)
        })
        .catch(() => {
          setSuggestions([])
          setSuggestOpen(false)
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const submitSearch = (e) => {
    e.preventDefault()
    setSuggestOpen(false)
    setSuggestions([])
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (catFilter) params.set('category', catFilter)
    navigate(`/shop?${params.toString()}`)
    setMenuOpen(false)
    setQ('')
  }

  const handleLogout = async () => {
    setAccountOpen(false)
    await logout()
    navigate('/')
  }

  const userInitials = initials(user?.name || user?.email || 'U')
  const isAdminUser = isSuperAdmin()
  const showCustomerOptions = !!user && !isAdminUser
  const wishlistCount = wishlistIds?.length || 0

  return (
    <header className="customer-header" role="banner">
      {/* ---- Top strip matching Design: Solid Brand Orange ---- */}
      <div style={{ background: '#ff5500', color: '#ffffff', fontSize: 12, padding: '7px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="container flex items-center justify-between gap-3" style={{ padding: '0 20px' }}>
          <span className="flex items-center gap-2" style={{ fontWeight: 500, letterSpacing: '0.01em' }}>
            <Truck size={14} color="#ffffff" />
            Delivering across Nepal
          </span>
          <span className="flex items-center gap-5 hide-sm" style={{ fontSize: 12 }}>
            <Link to="/orders" className="flex items-center gap-1.5" style={{ color: '#ffffff', opacity: 0.95, textDecoration: 'none' }}>
              <Clock size={13} /> Track Order
            </Link>
            <Link to="/help" className="flex items-center gap-1.5" style={{ color: '#ffffff', opacity: 0.95, textDecoration: 'none' }}>
              <HelpCircle size={13} /> Help Center
            </Link>
            <Link to="/seller/login" className="flex items-center gap-1.5" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'none' }}>
              <Store size={13} /> Become a Seller
            </Link>
          </span>
        </div>
      </div>

      {/* ---- Main header ---- */}
      <div className="container header-main" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
        {/* Mobile: hamburger */}
        <button
          className="icon-btn show-sm"
          style={{ border: 'none', background: 'none' }}
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
        >
          <Menu size={22} />
        </button>

        <Logo />

        {/* Search bar with Category dropdown — hidden on mobile */}
        <div
          ref={suggestRef}
          className="search-bar hide-sm"
          style={{ flex: 1, position: 'relative' }}
        >
          <form
            onSubmit={submitSearch}
            role="search"
            aria-label="Search products"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8,
              overflow: 'hidden',
              height: 42,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                className="search-cat-select"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter by category"
                style={{
                  height: 42,
                  padding: '0 28px 0 14px',
                  border: 'none',
                  borderRight: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                  appearance: 'none'
                }}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: '#64748b' }} />
            </div>

            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setSuggestOpen(true) }}
              placeholder="Search products, brands and more..."
              aria-label="Search products"
              aria-autocomplete="list"
              aria-expanded={suggestOpen}
              style={{
                flex: 1,
                border: 'none',
                padding: '0 14px',
                fontSize: 13.5,
                outline: 'none',
                background: 'transparent'
              }}
            />

            <button
              type="submit"
              aria-label="Search"
              style={{
                background: '#ff5500',
                color: '#ffffff',
                border: 'none',
                padding: '0 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                transition: 'background 0.15s'
              }}
            >
              <Search size={15} />
              <span className="hide-sm">Search</span>
            </button>
          </form>

          {/* Autocomplete suggestions dropdown */}
          {suggestOpen && suggestions.length > 0 && (
            <div
              role="listbox"
              aria-label="Search suggestions"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 9999,
                background: '#ffffff',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                border: '1px solid #e2e8f0',
                overflow: 'hidden'
              }}
            >
              {suggestions.map((item, idx) => {
                const Icon =
                  item.type === 'product'
                    ? ShoppingBag
                    : item.type === 'brand'
                    ? Store
                    : Tag
                const href =
                  item.type === 'product'
                    ? `/products/${item.slug}`
                    : item.type === 'brand'
                    ? `/search?brand=${item.slug}`
                    : `/search?category=${item.slug}`

                return (
                  <button
                    key={`${item.type}-${item.slug}-${idx}`}
                    role="option"
                    onClick={() => {
                      setSuggestOpen(false)
                      setSuggestions([])
                      setQ('')
                      navigate(href)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: idx < suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 6,
                        background: item.type === 'product' ? '#fff7f0' : item.type === 'brand' ? '#f0f7ff' : '#f0fff4',
                        flexShrink: 0
                      }}
                    >
                      {item.image ? (
                        <img
                          src={item.image.startsWith('http') ? item.image : `/storage/${item.image}`}
                          alt=""
                          style={{ width: 24, height: 24, objectFit: 'contain', borderRadius: 4 }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                        />
                      ) : null}
                      <Icon
                        size={14}
                        color={item.type === 'product' ? '#ff5500' : item.type === 'brand' ? '#3b82f6' : '#22c55e'}
                        style={{ display: item.image ? 'none' : 'block' }}
                      />
                    </span>
                    <span style={{ flex: 1, fontSize: 13.5, color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize', flexShrink: 0 }}>
                      {item.type}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Header actions: Login / Wishlist / Cart */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Search icon on mobile */}
          <button
            className="icon-btn show-sm"
            style={{ border: 'none', background: 'none' }}
            onClick={() => setMenuOpen(true)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Account / Login dropdown */}
          <div style={{ position: 'relative' }} ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              aria-expanded={accountOpen}
              aria-haspopup="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 6px',
                color: '#1e293b'
              }}
            >
              {user ? (
                user.avatar ? (
                  <img
                    src={apiImage(user.avatar)}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                ) : (
                  <span
                    className="avatar"
                    style={{ width: 28, height: 28, fontSize: 11, background: '#ff5500', color: '#fff' }}
                  >
                    {userInitials}
                  </span>
                )
              ) : (
                <User size={20} color="#1e293b" />
              )}
              <div className="account-btn-text" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Welcome</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  {user ? user.name?.split(' ')[0] : 'Login / Register'}
                </div>
              </div>
            </button>

            {accountOpen && (
              <div className="account-dropdown" role="menu">
                {user ? (
                  <>
                    <div className="account-dropdown-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {user.avatar ? (
                        <img
                          src={apiImage(user.avatar)}
                          alt=""
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: 'var(--primary)', color: '#fff' }}>
                          {userInitials}
                        </span>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="font-semibold truncate" style={{ fontSize: 14 }}>{user.name}</div>
                        <div className="muted text-xs truncate">{user.email}</div>
                      </div>
                    </div>
                    {isVendor() && (
                      <span className="chip chip-sm" style={{ marginTop: 6 }}>Vendor</span>
                    )}
                    {isSuperAdmin() && (
                      <span className="chip chip-sm" style={{ marginTop: 6, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>Admin</span>
                    )}
                    <div className="account-dropdown-links">
                      {showCustomerOptions && (
                        <>
                          <Link className="account-dropdown-link" to="/account" onClick={() => setAccountOpen(false)} role="menuitem">
                            <User size={15} /> My Account
                          </Link>
                          <Link className="account-dropdown-link" to="/orders" onClick={() => setAccountOpen(false)} role="menuitem">
                            <Package size={15} /> My Orders
                          </Link>
                          <Link className="account-dropdown-link" to="/wishlist" onClick={() => setAccountOpen(false)} role="menuitem">
                            <Heart size={15} /> Wishlist
                          </Link>
                          <Link className="account-dropdown-link" to="/account/addresses" onClick={() => setAccountOpen(false)} role="menuitem">
                            <MapPin size={15} /> Addresses
                          </Link>
                        </>
                      )}
                      {isVendor() && (
                        <>
                          <div className="account-dropdown-divider" />
                          <Link className="account-dropdown-link" to="/vendor" onClick={() => setAccountOpen(false)} role="menuitem" style={{ color: 'var(--primary)' }}>
                            <LayoutDashboard size={15} /> Vendor Dashboard
                          </Link>
                        </>
                      )}
                      {isSuperAdmin() && (
                        <>
                          <div className="account-dropdown-divider" />
                          <Link className="account-dropdown-link" to="/admin" onClick={() => setAccountOpen(false)} role="menuitem" style={{ color: 'var(--danger)' }}>
                            <Settings size={15} /> Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="account-dropdown-divider" />
                      <button className="account-dropdown-link danger" onClick={handleLogout} role="menuitem">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="account-dropdown-header">
                      <div className="font-semibold" style={{ fontSize: 14 }}>Welcome to GOSIKA</div>
                      <div className="muted text-xs">Sign in to your account</div>
                    </div>
                    <div className="account-dropdown-links">
                      <Link className="account-dropdown-link" to="/login" onClick={() => setAccountOpen(false)} role="menuitem">
                        <User size={15} /> Login
                      </Link>
                      <Link className="account-dropdown-link" to="/register" onClick={() => setAccountOpen(false)} role="menuitem">
                        <UserCheck size={15} /> Create Account
                      </Link>
                      <div className="account-dropdown-divider" />
                      <Link className="account-dropdown-link" to="/seller/login" onClick={() => setAccountOpen(false)} role="menuitem" style={{ color: 'var(--primary)' }}>
                        <Store size={15} /> Become a Seller
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notifications Icon */}
          {user && !isAdminUser && (
            <Link
              to="/account/notifications"
              className="hide-sm"
              aria-label={`Notifications (${unreadNotif} unread)`}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e293b',
                padding: '6px 8px',
                textDecoration: 'none'
              }}
            >
              <Bell size={21} strokeWidth={1.8} />
              {unreadNotif > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 1,
                    right: 2,
                    background: '#ff5500',
                    color: '#ffffff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: '50%',
                    minWidth: 16,
                    height: 16,
                    padding: '0 3px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  {unreadNotif > 99 ? '99+' : unreadNotif}
                </span>
              )}
            </Link>
          )}

          {/* Wishlist Icon */}
          <Link
            to="/wishlist"
            className="hide-sm"
            aria-label={`Wishlist (${wishlistCount} items)`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b',
              padding: '6px 8px',
              textDecoration: 'none'
            }}
          >
            <Heart size={21} strokeWidth={1.8} />
            <span
              style={{
                position: 'absolute',
                top: 1,
                right: 2,
                background: '#ff5500',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '50%',
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              {wishlistCount}
            </span>
          </Link>

          {/* Cart Icon */}
          <Link
            to="/cart"
            aria-label={`Shopping Cart (${itemCount} items)`}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b',
              padding: '6px 8px',
              textDecoration: 'none'
            }}
          >
            <ShoppingBag size={21} strokeWidth={1.8} />
            <span
              style={{
                position: 'absolute',
                top: 1,
                right: 2,
                background: '#ff5500',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: '50%',
                minWidth: 16,
                height: 16,
                padding: '0 3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
              }}
            >
              {itemCount}
            </span>
          </Link>
        </div>
      </div>

      {/* ---- Category nav bar (desktop) matching Design ---- */}
      <nav className="nav-bar hide-sm" aria-label="Category navigation" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '6px 0' }}>
        <div className="container nav-bar-inner" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <NavLink
            to="/shop"
            className="nav-link"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
              color: '#1e293b',
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              textDecoration: 'none'
            }}
          >
            <Menu size={15} color="#ff5500" /> Categories <ChevronDown size={13} />
          </NavLink>
          <NavLink to="/shop?filter=deals" className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, fontSize: 13.5, color: '#334155', textDecoration: 'none' }}>
            <span style={{ color: '#ff5500' }}>⚡</span> Flash Deals
          </NavLink>
          <NavLink to="/shop?sort=newest" className="nav-link" style={{ fontWeight: 600, fontSize: 13.5, color: '#334155', textDecoration: 'none' }}>New Arrivals</NavLink>
          <NavLink to="/brands" className="nav-link" style={{ fontWeight: 600, fontSize: 13.5, color: '#334155', textDecoration: 'none' }}>Top Brands</NavLink>
          <NavLink to="/shop?mode=stores" className="nav-link" style={{ fontWeight: 600, fontSize: 13.5, color: '#334155', textDecoration: 'none' }}>Stores</NavLink>
          <NavLink to="/help" className="nav-link" style={{ fontWeight: 600, fontSize: 13.5, color: '#334155', textDecoration: 'none' }}>Help Center</NavLink>
          <Link to="/seller/login" className="nav-link" style={{ marginLeft: 'auto', color: '#ff5500', fontWeight: 700, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <Store size={15} /> Sell on GOSIKA
          </Link>
        </div>
      </nav>

      {/* ---- Mobile drawer ---- */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        {/* Search in drawer */}
        <form className="search-bar" onSubmit={submitSearch} role="search" style={{ marginBottom: 20 }}>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            aria-label="Search"
          />
          <button type="submit" aria-label="Search"><Search size={16} /></button>
        </form>

        {user ? (
          <div style={{ padding: '12px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
            <div className="flex items-center gap-3">
              <span className="avatar" style={{ width: 40, height: 40, fontSize: 14, background: 'var(--primary)', color: '#fff' }}>
                {userInitials}
              </span>
              <div>
                <div className="font-semibold" style={{ fontSize: 14 }}>{user.name}</div>
                <div className="muted text-xs">{user.email}</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <Link className="btn btn-outline" to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link className="btn btn-primary" to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '8px 0 4px', letterSpacing: '0.06em' }}>Shop</div>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/shop" onClick={() => setMenuOpen(false)}>All Products</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/shop?sort=newest" onClick={() => setMenuOpen(false)}>New Arrivals</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--danger)', background: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }} to="/shop?filter=deals" onClick={() => setMenuOpen(false)}>
            <Flame size={15} color="var(--danger)" /> Today's Deals
          </Link>

          {categories.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 0 4px', letterSpacing: '0.06em' }}>Categories</div>
              {categories.map((c, i) => {
                const Icon = getCategoryIcon(c, i)
                return (
                  <Link
                    key={c.id}
                    className="dash-nav-link"
                    style={{ color: 'var(--ink)', background: 'none' }}
                    to={`/shop?category=${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={15} color="var(--primary)" /> {c.name}
                  </Link>
                )
              })}
            </>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 0 4px', letterSpacing: '0.06em' }}>Account</div>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/cart" onClick={() => setMenuOpen(false)}>
            <ShoppingBag size={15} /> Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
          {!isAdminUser && (
            <>
              <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/orders" onClick={() => setMenuOpen(false)}>
                <Package size={15} /> My Orders
              </Link>
              <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/wishlist" onClick={() => setMenuOpen(false)}>
                <Heart size={15} /> Wishlist
              </Link>
              {user && (
                <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/account" onClick={() => setMenuOpen(false)}>
                  <User size={15} /> My Account
                </Link>
              )}
            </>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 0 4px', letterSpacing: '0.06em' }}>Sell on GOSIKA</div>
          {!isAdminUser && (
            <Link className="dash-nav-link" style={{ color: 'var(--primary)', background: 'none', fontWeight: 600 }} to="/seller/login" onClick={() => setMenuOpen(false)}>
              <Store size={15} /> Become a Seller
            </Link>
          )}
          {isVendor() && (
            <Link className="dash-nav-link" style={{ color: 'var(--primary)', background: 'none' }} to="/vendor" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={15} /> Vendor Dashboard
            </Link>
          )}
          {isSuperAdmin() && (
            <Link className="dash-nav-link" style={{ color: 'var(--danger)', background: 'none' }} to="/admin" onClick={() => setMenuOpen(false)}>
              <Settings size={15} /> Admin Panel
            </Link>
          )}

          {user && (
            <>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  className="dash-nav-link"
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                  onClick={async () => { setMenuOpen(false); await logout(); navigate('/') }}
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </Drawer>
    </header>
  )
}
