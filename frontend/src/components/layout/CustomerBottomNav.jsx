import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, ShoppingBag, User, LayoutGrid } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

/**
 * CustomerBottomNav — Mobile bottom navigation for the customer marketplace.
 * Visible only on screens ≤ 768px (controlled via .customer-bottom-nav CSS class).
 * Provides: Home | Categories | Search | Cart (with badge) | Account
 */
export default function CustomerBottomNav({ onSearchClick }) {
  const { itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearchClick) {
      onSearchClick()
    } else {
      navigate('/shop')
    }
  }

  return (
    <nav className="customer-bottom-nav" aria-label="Mobile marketplace navigation" role="navigation">
      {/* Home */}
      <NavLink
        to="/"
        end
        aria-label="Home"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <Home size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Home</span>
      </NavLink>

      {/* Categories */}
      <NavLink
        to="/shop"
        aria-label="Browse categories"
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <LayoutGrid size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Categories</span>
      </NavLink>

      {/* Search */}
      <button
        type="button"
        onClick={handleSearch}
        aria-label="Search products"
      >
        <Search size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Search</span>
      </button>

      {/* Cart */}
      <NavLink
        to="/cart"
        aria-label={`Cart, ${itemCount} items`}
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <ShoppingBag size={22} strokeWidth={1.8} aria-hidden="true" />
          {itemCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -6,
                right: -8,
                background: '#ff5500',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
                borderRadius: '50%',
                minWidth: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
                border: '1.5px solid #fff',
              }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </span>
        <span>Cart</span>
      </NavLink>

      {/* Account */}
      <NavLink
        to={user ? '/account' : '/login'}
        aria-label={user ? 'My account' : 'Login'}
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <User size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>{user ? 'Account' : 'Login'}</span>
      </NavLink>
    </nav>
  )
}
