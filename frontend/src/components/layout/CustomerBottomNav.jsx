import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, MessageCircle, ShoppingBag, User, LayoutGrid } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'

/**
 * CustomerBottomNav — Mobile bottom navigation for the customer marketplace.
 * Visible only on screens ≤ 768px (controlled via .customer-bottom-nav CSS class).
 * Provides: Home | Categories | Messages | Cart (with badge) | Account
 */
export default function CustomerBottomNav() {
  const { itemCount } = useCart()
  const { user } = useAuth()
  const { pathname, search } = useLocation()
  const query = new URLSearchParams(search)
  const categoriesActive = pathname.startsWith('/category/') ||
    (pathname === '/shop' && !query.has('search'))

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
        className={() => categoriesActive ? 'active' : ''}
      >
        <LayoutGrid size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Categories</span>
      </NavLink>

      {/* Messages */}
      <NavLink
        to={user ? '/account/messages' : '/login'}
        state={user ? undefined : { from: '/account/messages' }}
        aria-label={user ? 'Messages' : 'Sign in to view messages'}
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <MessageCircle size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Messages</span>
      </NavLink>

      {/* Cart */}
      <NavLink
        to="/cart"
        aria-label={`Cart, ${itemCount} items`}
        className={({ isActive }) => isActive || ['/checkout', '/order-success'].includes(pathname) ? 'active' : ''}
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
        aria-label={user ? 'My account' : 'Account, sign in'}
        className={({ isActive }) => isActive ? 'active' : ''}
      >
        <User size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>Account</span>
      </NavLink>
    </nav>
  )
}
