import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/login', { identifier: email, password })
      toast.success('Login successful')
      navigate('/')
    } catch (e) {
      toast.error('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-['var(--navy)'] py-8">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Welcome Back</h2>
          <a href="/register" className="text-primary hover:underline">Create Account</a>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted cursor-pointer"
              >
                {showPassword ? <Eye size={14} /> : <EyeSlash size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full btn btn-primary">
            {loading ? 'Logging in…' : 'Sign In'}
          </button>

          <div className="text-center text-sm mt-4">
            <a href="/forgot-password" className="text-primary hover:underline">Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  )
}