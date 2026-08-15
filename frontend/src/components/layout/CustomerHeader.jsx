import React, { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Heart, User, Search, Menu, Truck, MapPin,
  Store, ChevronDown, X, Bell, Phone, Package, LogOut,
  UserCheck, LayoutDashboard, Settings, Flame
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'
import Drawer from '../ui/Drawer'
import api from '../../api/client'

function Logo({ size = 'md' }) {
  const fontSize = size === 'sm' ? 18 : 22
  const markSize = size === 'sm' ? 30 : 36
  const iconSize = size === 'sm' ? 14 : 18
  return (
    <Link to="/" className="brand" aria-label="GOSIKA — Nepal's trusted marketplace" style={{ fontSize }}>
      <span className="brand-mark" style={{ width: markSize, height: markSize }}>
        <ShoppingBag size={iconSize} />
      </span>
      GOSIKA
    </Link>
  )
}

export default function CustomerHeader() {
  const { itemCount } = useCart()
  const { user, isVendor, isSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const accountRef = useRef(null)
  const prevItemCount = useRef(itemCount)

  useEffect(() => {
    api
      .get('/categories', { params: { per_page: 12 } })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {})
  }, [])

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

  const submitSearch = (e) => {
    e.preventDefault()
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

  return (
    <header className="customer-header" role="banner">
      {/* ---- Top strip ---- */}
      <div className="header-top">
        <div className="container flex items-center justify-between gap-3" style={{ padding: '0 20px' }}>
          <span className="flex items-center gap-2">
            <Truck size={13} />
            Free delivery over Rs. 2,000 · Delivered across Nepal
          </span>
          <span className="flex items-center gap-4 hide-sm" style={{ fontSize: 12 }}>
            <Link to="/orders" className="flex items-center gap-1" style={{ color: 'inherit' }}>
              <Package size={12} /> Track Order
            </Link>
            <Link to="/help" className="flex items-center gap-1" style={{ color: 'inherit' }}>
              <Phone size={12} /> Support
            </Link>
            <Link to="/vendor/register" className="flex items-center gap-1" style={{ color: '#93c5fd' }}>
              <Store size={12} /> Sell on GOSIKA
            </Link>
          </span>
        </div>
      </div>

      {/* ---- Main header ---- */}
      <div className="container header-main">
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

        {/* Search bar — hidden on mobile */}
        <form
          className="search-bar hide-sm"
          onSubmit={submitSearch}
          role="search"
          aria-label="Search products"
          style={{ flex: 1 }}
        >
          <select
            className="search-cat-select"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            aria-label="Filter by category"
            style={{ padding: '9px 12px', border: 'none', borderRight: '1px solid var(--border)', background: 'var(--bg)', fontSize: 13, color: 'var(--muted)', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands, and stores across Nepal…"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <Search size={16} />
          </button>
        </form>

        {/* Header actions */}
        <div className="header-actions">
          {/* Search icon on mobile */}
          <button
            className="icon-btn show-sm"
            style={{ border: 'none', background: 'none' }}
            onClick={() => setMenuOpen(true)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          <Link to="/orders" className="header-action hide-sm" aria-label="My orders">
            <span className="h-icon"><Package size={21} /></span>
            <span>Orders</span>
          </Link>

          <Link to="/wishlist" className="header-action" aria-label="My wishlist">
            <span className="h-icon"><Heart size={21} /></span>
            <span className="hide-sm">Wishlist</span>
          </Link>

          <Link to="/cart" className="header-action" aria-label={`Shopping cart, ${itemCount} items`}>
            <span className="h-icon" style={{ position: 'relative' }}>
              <ShoppingBag size={21} />
              {itemCount > 0 && (
                <span className="cart-count-bubble" key={itemCount}>
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </span>
            <span className="hide-sm">Cart</span>
          </Link>

          {/* Account dropdown */}
          <div style={{ position: 'relative' }} ref={accountRef}>
            <button
              className="header-action"
              onClick={() => setAccountOpen((o) => !o)}
              aria-expanded={accountOpen}
              aria-haspopup="true"
              aria-label={user ? `Account menu for ${user.name}` : 'Login or create account'}
            >
              {user ? (
                <span
                  className="avatar"
                  style={{ width: 28, height: 28, fontSize: 11, background: 'var(--primary)', color: '#fff' }}
                >
                  {userInitials}
                </span>
              ) : (
                <span className="h-icon"><User size={21} /></span>
              )}
              <span className="hide-sm">
                {user ? user.name?.split(' ')[0] : 'Login'}
              </span>
              <ChevronDown size={13} style={{ transition: 'transform 0.2s', transform: accountOpen ? 'rotate(180deg)' : 'none' }} />
            </button>

            {accountOpen && (
              <div className="account-dropdown" role="menu">
                {user ? (
                  <>
                    <div className="account-dropdown-header">
                      <div className="font-semibold truncate" style={{ fontSize: 14 }}>{user.name}</div>
                      <div className="muted text-xs truncate">{user.email}</div>
                      {isVendor() && (
                        <span className="chip chip-sm" style={{ marginTop: 6 }}>Vendor</span>
                      )}
                      {isSuperAdmin() && (
                        <span className="chip chip-sm" style={{ marginTop: 6, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: 'var(--danger-border)' }}>Admin</span>
                      )}
                    </div>
                    <div className="account-dropdown-links">
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
                      <Link className="account-dropdown-link" to="/vendor/register" onClick={() => setAccountOpen(false)} role="menuitem" style={{ color: 'var(--primary)' }}>
                        <Store size={15} /> Become a Seller
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---- Category nav bar (desktop) ---- */}
      <nav className="nav-bar hide-sm" aria-label="Category navigation">
        <div className="container nav-bar-inner">
          <NavLink to="/shop" className="nav-link" end>All Products</NavLink>
          <NavLink to="/shop?sort=newest" className="nav-link">New Arrivals</NavLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/shop?category=${c.slug}`} className="nav-link">
              {c.icon && <span style={{ fontSize: 14 }}>{c.icon}</span>}
              {c.name}
            </NavLink>
          ))}
          <NavLink to="/shop?filter=deals" className="nav-link nav-link-deals" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Flame size={14} color="var(--danger)" /> Deals
          </NavLink>
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
              {categories.map((c) => (
                <Link
                  key={c.id}
                  className="dash-nav-link"
                  style={{ color: 'var(--ink)', background: 'none' }}
                  to={`/shop?category=${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {c.icon && <span>{c.icon}</span>} {c.name}
                </Link>
              ))}
            </>
          )}

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 0 4px', letterSpacing: '0.06em' }}>Account</div>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)', background: 'none' }} to="/cart" onClick={() => setMenuOpen(false)}>
            <ShoppingBag size={15} /> Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
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

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', padding: '12px 0 4px', letterSpacing: '0.06em' }}>Sell on GOSIKA</div>
          <Link className="dash-nav-link" style={{ color: 'var(--primary)', background: 'none', fontWeight: 600 }} to="/vendor/register" onClick={() => setMenuOpen(false)}>
            <Store size={15} /> Become a Seller
          </Link>
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
