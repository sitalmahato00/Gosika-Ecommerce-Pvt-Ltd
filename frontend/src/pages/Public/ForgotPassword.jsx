import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('Password reset instructions sent to your email')
      navigate('/login')
    } catch (e) {
      toast.error('Email not found. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-['var(--navy)'] py-8">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Reset Password</h2>
          <a href="/login" className="text-primary hover:underline">Back to Login</a>
        </div>

        <form onSubmit={handleForgot} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              type="email"
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            />
          </div>

          <button type="submit" className="w-full btn btn-primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>

          <p className="text-center text-sm mt-4">
            <a href="/login" className="text-primary hover:underline">Remember password?</a>
          </p>
        </form>
      </div>
    </div>
  )
}