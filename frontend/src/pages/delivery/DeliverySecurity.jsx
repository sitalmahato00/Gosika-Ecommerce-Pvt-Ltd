import React, { useState } from 'react'
import { Lock, ShieldCheck, Eye, EyeOff, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function DeliverySecurity() {
  const toast = useToast()
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState({ current: false, next: false, confirm: false })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (form.password !== form.password_confirmation) {
      toast.error('New password and confirmation do not match.')
      return
    }
    setSaving(true)
    try {
      await api.put('/customer/profile/password', {
        current_password: form.current_password,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      toast.success('Password updated successfully.')
      setForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const input = (key, group, placeholder) => (
    <div style={{ position: 'relative' }}>
      <input
        className="input"
        type={show[group] ? 'text' : 'password'}
        required
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        autoComplete={group === 'current' ? 'current-password' : group === 'next' ? 'new-password' : 'new-password'}
      />
      <button
        type="button"
        onClick={() => setShow({ ...show, [group]: !show[group] })}
        className="btn btn-ghost btn-xs"
        style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 6, color: 'var(--muted)' }}
        aria-label="Toggle password visibility"
      >
        {show[group] ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Security</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Keep your delivery account safe — update your password and review your habits.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: '20px 22px', margin: 0, maxWidth: 560 }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="avatar" style={{ width: 36, height: 36, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
            <Lock size={17} />
          </span>
          <h3 className="font-bold text-ink m-0" style={{ fontSize: 15 }}>Change Password</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="muted text-xs font-bold" style={{ marginBottom: 6, display: 'block' }}>Current password *</label>
            {input('current_password', 'current', 'Enter your current password')}
          </div>
          <div>
            <label className="muted text-xs font-bold" style={{ marginBottom: 6, display: 'block' }}>New password *</label>
            {input('password', 'next', 'At least 8 characters')}
          </div>
          <div>
            <label className="muted text-xs font-bold" style={{ marginBottom: 6, display: 'block' }}>Confirm new password *</label>
            {input('password_confirmation', 'confirm', 'Repeat the new password')}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5" disabled={saving}>
            <ShieldCheck size={14} /> {saving ? 'Saving…' : 'Update Password'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setForm({ current_password: '', password: '', password_confirmation: '' })}
          >
            Clear
          </button>
        </div>
      </form>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={16} color="#4f46e5" />
            <h4 className="font-bold text-ink m-0" style={{ fontSize: 13 }}>Device & notification</h4>
          </div>
          <p className="muted text-xs m-0" style={{ lineHeight: 1.6 }}>
            Prefer to manage the app you’re signed in with. Log out of shared devices before leaving them, and keep the
            phone you use for deliveries with you.
          </p>
        </div>
        <div className="card" style={{ padding: '16px 18px', margin: 0, background: '#fffbeb', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} color="#d97706" />
            <h4 className="font-bold text-ink m-0" style={{ fontSize: 13 }}>Stay alert to scams</h4>
          </div>
          <p className="m-0 text-xs" style={{ color: '#92400e', lineHeight: 1.6 }}>
            GOSIKA will never ask for your password or OTP. Report suspicious calls or messages to support immediately.
          </p>
        </div>
        <div className="card" style={{ padding: '16px 18px', margin: 0, background: '#ecfdf5', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} color="#10b981" />
            <h4 className="font-bold text-ink m-0" style={{ fontSize: 13 }}>Password tips</h4>
          </div>
          <p className="m-0 text-xs" style={{ color: '#065f46', lineHeight: 1.6 }}>
            Use a unique password you don’t reuse elsewhere, at least 8 characters mixing letters, numbers and symbols.
          </p>
        </div>
      </div>
    </div>
  )
}