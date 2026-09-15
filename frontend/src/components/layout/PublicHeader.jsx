import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Phone, Mail, MapPin, Search, Menu, X, Heart, LogOut } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { apiImage } from '../../utils/format'
import Drawer from '../ui/Drawer'
import api from '../../api/client'

function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Gosika Commerce home">
      <span className="brand-mark"><ShoppingBag size={18} /></span>
      GOSIKA
    </Link>
  )
}

function HeaderCart() {
  const { itemCount } = useCart()
  return (
    <Link to="/cart" className="header-action">
      <span className="h-icon"><ShoppingBag size={22} /></span>
      Cart
      {itemCount > 0 && <span className="cart-count-bubble">{itemCount > 99 ? '99+' : itemCount}</span>}
    </Link>
  )
}

function HeaderWishlist() {
  return (
    <Link to="/wishlist" className="header-action">
      <span className="h-icon"><Heart size={22} /></span>
      Wishlist
    </Link>
  )
}

export default function PublicHeader() {
  const { user, isVendor } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/categories', { params: { per_page: 10 } }).then((res) => setCategories(res.data.data || [])).catch(() => {})
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/shop?search=${encodeURIComponent(q)}`)
    setMenuOpen(false)
  }

  const userInitial = user?.name?.[0]?.toUpperCase() || 'U'

  return (
    <header className="customer-header">
      <div className="header-top">
        <div className="container flex items-center justify-between gap-3" style={{ padding: '6px 16px' }}>
          <span className="flex items-center gap-1">
            <Truck size={13} /> Free delivery over Rs. 2,000 — nationwide across Nepal
          </span>
          <span className="flex items-center gap-4 hide-sm">
            <Link to="/vendor/register" className="flex items-center gap-1" style={{ fontWeight: 600 }}>
              <Store size={13} /> Sell on Gosika
            </Link>
          </span>
        </div>
      </div>

      <div className="container header-main">
        <button className="icon-btn" style={{ border: 'none' }} onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Logo />
        <form className="search-bar hide-sm" onSubmit={submitSearch} role="search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands and stores across Nepal…"
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">
            <Search size={16} />
          </button>
        </div>
        <div className="header-actions">
          <HeaderCart />
          <HeaderWishlist />
          {user ? (
            <div style={{ position: 'relative' }}>
              <button className="header-action" onClick={() => setAccountOpen((o) => !o)} aria-expanded={accountOpen}>
                {user ? (
                  <span className="avatar" style={{ width: 26, height: 26, fontSize: 12 }}>{userInitial}</span>
                ) : (
                  <span className="h-icon"><User size={22} /></span>
                )}
                {user ? user.name?.split(' ')[0] : 'Login'}
                <ChevronDown size={14} />
              </button>
              {accountOpen && (
                <div
                  className="card"
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 210, padding: 8, zIndex: 60, boxShadow: 'var(--shadow-lg)' }}
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  {user ? (
                    <>
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                        <div className="font-semibold truncate">{user.name}</div>
                        <div className="muted text-xs truncate">{user.email}</div>
                      </div>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/account">My Account</Link>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/orders">My Orders</Link>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/wishlist">Wishlist</Link>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/account/addresses">Addresses</Link>
                      {isVendor() && (
                        <Link className="dash-nav-link" style={{ color: 'var(--primary)' }} to="/vendor">Vendor Dashboard</Link>
                      )}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                        <LogoutButton />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/login">Login</Link>
                      <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/register">Create Account</Link>
                      <Link className="dash-nav-link" style={{ color: 'var(--primary)' }} to="/vendor/register">Become a Seller</Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="nav-bar hide-sm" aria-label="Primary">
        <div className="container flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: 0 }}>
          <nav-link to="/shop" className="nav-link" end>
            All Products
          </nav-link>
          <nav-link to="/shop?sort=newest" className="nav-link">New Arrivals</navLink>
          {categories.map((c) => (
            <NavLink key={c.id} to={`/shop?category=${c.slug}`} className="nav-link">
              {c.icon && <span style={{ fontSize: 14 }}>{c.icon}</span>} {c.name}
            </nav-link>
          ))}
          <nav-link to="/shop?filter=deals" className="nav-link" style={{ color: 'var(--danger)', fontWeight: 700 }}>Deals</nav-link>
        </div>
      </nav>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <form className="search-bar" onSubmit={submitSearch} role="search" style={{ marginBottom: 16 }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" />
          <button type="submit" aria-label="Search"><Search size={16} /></button>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/shop" onClick={() => setMenuOpen(false)}>All Products</Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              className="dash-nav-link"
              style={{ color: 'var(--ink)' }}
              to={`/shop?category=${c.slug}`}
              onClick={() => setMenuOpen(false)}
            >
              {c.icon && <span>{c.icon}</span>} {c.name}
            </Link>
          ))}
          <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/cart" onClick={() => setMenuOpen(false)}>Cart ({itemCount})</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
          <Link className="dash-nav-link" style={{ color: 'var(--ink)' }} to="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
          {isVendor() && <Link className="dash-nav-link" style={{ color: 'var(--primary)' }} to="/vendor" onClick={() => setMenuOpen(false)}>Vendor Dashboard</Link>}
        </div>
      </Drawer>
    </header>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return (
    <button
      className="dash-nav-link"
      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', width: '100%', textAlign: 'left' }}
      onClick={async () => {
        await logout()
        navigate('/')
      }}
    >
      Logout
    </button>
  )
}