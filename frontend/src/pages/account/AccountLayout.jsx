import React from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Heart, MapPin, CreditCard,
  User, Star, Headphones, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { initials } from '../../utils/format'

const NAV_ITEMS = [
  { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/orders', label: 'My Orders', icon: Package },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/payments', label: 'Payment Methods', icon: CreditCard },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/help', label: 'Support', icon: Headphones },
  { to: '/account/settings', label: 'Settings', icon: Settings },
]

export default function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userInitials = initials(user?.name || user?.email || 'U')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>My Account</span>
      </nav>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 24,
          alignItems: 'start',
        }}
        id="account-layout"
      >
        <style>{`
          @media (min-width: 768px) {
            #account-layout { grid-template-columns: 240px 1fr !important; }
          }
        `}</style>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
          {/* User card */}
          {user && (
            <div className="card" style={{ marginBottom: 12, padding: 16 }}>
              <div className="flex items-center gap-3">
                <span
                  className="avatar"
                  style={{ width: 48, height: 48, fontSize: 18, background: 'var(--primary)', color: '#fff' }}
                >
                  {userInitials}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="font-semibold truncate" style={{ fontSize: 14 }}>{user.name}</div>
                  <div className="muted text-xs truncate">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="card card-pad-none" style={{ overflow: 'hidden' }} aria-label="Account navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3
                  ${isActive
                    ? 'text-primary font-semibold'
                    : 'text-ink'
                  }
                `}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--ink)',
                  background: isActive ? 'var(--primary-50)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
                aria-label={item.label}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={16} color={isActive ? 'var(--primary)' : 'var(--muted)'} aria-hidden="true" />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
            <button
              className="flex items-center gap-3"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '11px 16px',
                fontSize: 13.5,
                fontWeight: 400,
                color: 'var(--danger)',
                background: 'transparent',
                border: 'none',
                borderLeft: '3px solid transparent',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
              onClick={handleLogout}
              aria-label="Logout"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-bg)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
