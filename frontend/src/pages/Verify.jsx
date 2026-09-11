import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import api from '../api/client'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../utils/format'
import AuthBrand from '../components/layout/AuthBrand'

export default function Verify() {
  const toast = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const verify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/email/verify', { email, code })
      toast.success('Email verified! You can now login.')
      navigate('/login')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    try {
      await api.post('/auth/email/resend', { email })
      setSent(true)
      toast.info('Verification code resent')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 440, margin: '0 auto' }}>
        <div className="text-center mb-2">
          <AuthBrand />
          <h1 style={{ fontSize: 20, marginTop: 14 }}>Verify your email</h1>
          <p className="muted text-sm m-0">Enter the verification code we sent to your email.</p>
        </div>
        <form onSubmit={verify}>
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Verification code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" />
          <Button type="submit" block disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Verify email'}
          </Button>
        </form>
        <div className="flex items-center justify-between mt-2 text-sm">
          <button className="btn btn-ghost btn-sm" onClick={resend} disabled={sent}>Resend code</button>
          <Link to="/login" className="text-primary">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
