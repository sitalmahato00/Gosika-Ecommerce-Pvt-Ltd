import React, { useEffect, useState } from 'react'
import { Lock, Check, XCircle, Eye, EyeSlash, ArrowLeft, Trash, Edit } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function CustomerSecurity() {
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleChangePassword = async () => {
    setLoading(true)
    try {
      await api.post('/customer/security/change-password', { current_password: currentPassword, new_password: password })
      toast.success('Password changed successfully')
      setPassword('')
      setCurrentPassword('')
    } catch (e) {
      toast.error('Failed to change password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Security Settings</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Change Password */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Change Password</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleChangePassword() }}>
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-sm border p-3 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted cursor-pointer"
                  >
                    {showCurrent ? <Eye size={14} /> : <EyeSlash size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
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

              <button type="submit" className="w-full btn btn-primary mt-4">
                {loading ? 'Updating…' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Account Activity */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Account Activity</h3>
            <div className="space-y-3">
              <div className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Last login: {new Date().toLocaleDateString()}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Active sessions: 1</p>
                <button className="btn btn-sm btn-outline mt-2">View Details</button>
              </div>
              <div className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>Two-factor authentication: Disabled</p>
                <button className="btn btn-sm btn-outline mt-2">Enable 2FA</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link to="/customer" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}