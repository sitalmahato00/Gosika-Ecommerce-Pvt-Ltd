import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Lock, Check, ArrowLeft } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, phone, password, role })
      toast.success('Account created successfully. Please verify your email.')
      navigate('/login')
    } catch (e) {
      toast.error('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-['var(--navy)'] py-8">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Create Account</h2>
          <a href="/login" className="text-primary hover:underline">Already have an account?</a>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977-98XXXXXXXX"
                required
                className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              type="password"
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              type="password"
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Become a Vendor</option>
            </select>
          </div>

          <button type="submit" className="w-full btn btn-primary">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm mt-4">
            By registering you agree to our <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  )
}