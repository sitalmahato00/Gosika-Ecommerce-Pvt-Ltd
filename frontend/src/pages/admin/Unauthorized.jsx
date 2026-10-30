import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh', padding: '0 1rem' }}>
      <div className="text-center" style={{ maxWidth: '28rem' }}>
        <div 
          className="inline-flex items-center justify-center mb-6" 
          style={{ 
            width: '4rem', 
            height: '4rem', 
            borderRadius: '50%', 
            backgroundColor: '#fee2e2' 
          }}
        >
          <ShieldAlert style={{ width: '2rem', height: '2rem', color: '#dc2626' }} />
        </div>
        
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          Access Denied
        </h1>
        
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
          You don't have permission to access this page.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <Button
            onClick={() => navigate('/admin')}
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '500' }}
          >
            Go to Dashboard
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/admin/system/users')}
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '500' }}
          >
            Contact Administrator
          </Button>
        </div>
      </div>
    </div>
  )
}
