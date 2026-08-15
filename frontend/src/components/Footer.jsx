import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: '#fff', marginTop: 64 }}>
      <div className="container" style={{ padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>GOSIKA Commerce</div>
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          Marketplace of Koshi, Nepal. Local products, delivered.
        </p>
        <div className="flex justify-center gap-3 mt-2" style={{ fontSize: 13 }}>
          <Link to="/products" className="muted">Shop</Link>
          <Link to="/login" className="muted">Login</Link>
          <Link to="/register" className="muted">Register</Link>
        </div>
      </div>
    </footer>
  )
}
