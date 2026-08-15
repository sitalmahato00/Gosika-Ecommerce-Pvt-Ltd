import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isVendor } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
      <div className="container flex justify-between align-center" style={{ height: 64 }}>
        <div className="flex gap-3 align-center">
          <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>
            GOSIKA
          </Link>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              end
              style={({ isActive }) => ({ padding: '8px 12px', fontWeight: isActive ? 700 : 500 })}
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              style={({ isActive }) => ({ padding: '8px 12px', fontWeight: isActive ? 700 : 500 })}
            >
              Shop
            </NavLink>
            {isVendor() && (
              <NavLink
                to="/vendor"
                style={({ isActive }) => ({ padding: '8px 12px', fontWeight: isActive ? 700 : 500 })}
              >
                Vendor
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex gap-3 align-center">
          <Link to="/cart" className="btn btn-outline btn-sm">
            Cart ({count})
          </Link>
          {user ? (
            <>
              <span className="muted" style={{ fontSize: 14 }}>
                {user.full_name}
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
