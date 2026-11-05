import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'

export default function PortalAccessDenied() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <main
      role="alert"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: '#f8fafc',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 440 }}>
        <ShieldAlert size={48} color="#dc2626" aria-hidden="true" />
        <h1 style={{ margin: '16px 0 8px', color: '#111827' }}>Portal access unavailable</h1>
        <p style={{ margin: '0 0 20px', color: '#64748b' }}>
          This account is not assigned to a customer, vendor, delivery, or staff portal. Contact an administrator for access.
        </p>
        <Button onClick={signOut}>Sign out and try another account</Button>
      </div>
    </main>
  )
}
