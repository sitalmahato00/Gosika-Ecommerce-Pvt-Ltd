import React, { useState } from 'react'
import { Lock, ShieldCheck, LogOut, KeyRound, Mail, Phone } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { AccountPage, AccountSection } from './AccountUI'

export default function AccountSecurity() {
  const { user, logout, login } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.password_confirmation) {
      setError('New passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await api.put('/customer/profile/password', form)
      toast.success('Password updated successfully')
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleLogoutAll = async () => {
    try {
      await api.post('/auth/logout-all')
      toast.success('Signed out everywhere')
      await logout()
      window.location.href = '/login'
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <AccountPage title="Security" subtitle="Keep your account safe — update your password and manage your sessions.">
      <AccountSection title="Change Password" subtitle="Use at least 8 characters with letters & numbers." icon={KeyRound} pad={22} className="account-form-card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 480 }}>
          <Input
            label="Current password"
            type="password"
            required
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min 8 characters"
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <Button type="submit" style={{ marginTop: 8 }} disabled={saving}>
            {saving ? <Spinner size={16} color="#fff" /> : 'Update Password'}
          </Button>
        </form>
      </AccountSection>

      <AccountSection title="Account Sessions" subtitle="Logged in from this device." icon={ShieldCheck} pad={22}>
        <div className="muted text-sm flex items-center gap-2" style={{ marginBottom: 14 }}>
          <Mail size={14} /> {user?.email || '—'}
          {user?.phone && <><Phone size={14} /> {user.phone}</>}
        </div>
        <div className="flex items-center gap-2 wrap">
          <Button variant="outline" onClick={handleLogoutAll}>
            <LogOut size={15} /> Sign Out All Devices
          </Button>
          <Button variant="ghost" onClick={async () => { await logout(); window.location.href = '/login' }}>
            <Lock size={15} /> Sign Out This Device
          </Button>
        </div>
      </AccountSection>
    </AccountPage>
  )
}