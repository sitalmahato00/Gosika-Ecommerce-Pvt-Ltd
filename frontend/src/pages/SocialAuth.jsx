import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/client'
import AuthBrand from '../components/layout/AuthBrand'

export default function SocialAuth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { saveSession } = useAuth()
  const toast = useToast()

  useEffect(() => {
    const token = searchParams.get('token')
    const name = searchParams.get('name') || 'there'
    const email = searchParams.get('email') || ''
    const error = searchParams.get('error')

    if (error) {
      toast.error('Social login was cancelled or failed.')
      navigate('/login', { replace: true })
      return
    }

    if (token) {
      saveSession(token, { name, email })

      api.get('/auth/me').then((res) => {
        const user = res.data.data
        saveSession(token, user)
        toast.success(`Welcome, ${user.name?.split(' ')[0] || name.split(' ')[0]}!`)
        if (user.roles?.includes('super_admin')) navigate('/admin', { replace: true })
        else if (user.roles?.includes('vendor_admin')) navigate('/vendor', { replace: true })
        else navigate('/account', { replace: true })
      }).catch(() => {
        toast.success(`Welcome, ${name.split(' ')[0]}!`)
        navigate('/account', { replace: true })
      })
    } else {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center', padding: '48px 24px' }}>
        <AuthBrand />
        <Loader2 size={36} className="spin" color="var(--primary)" style={{ marginTop: 24 }} />
        <h1 style={{ fontSize: 18, marginTop: 16 }}>Signing you in...</h1>
        <p className="muted text-sm">Please wait while we complete your login.</p>
      </div>
    </div>
  )
}
