import React, { useState } from 'react'
import {
  KeyRound, Shield, ShieldCheck, Smartphone, Laptop, Monitor, Check,
  Eye, EyeOff, Lock, History, Mail, Phone, Clock, Globe, LogOut,
  MessageSquare, AlertTriangle, ShoppingBag, PackageCheck, Wallet,
  Megaphone, CheckCircle2
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage, initials } from '../../utils/format'

const PREFERENCE_META = [
  { key: 'sms_orders', label: 'SMS for New Orders', desc: 'Instant SMS when a buyer places an order', icon: Smartphone, color: '#2563eb' },
  { key: 'whatsapp_payouts', label: 'Payout Clearance Receipts', desc: 'WhatsApp confirmation when a bank transfer completes', icon: MessageSquare, color: '#10b981' },
  { key: 'email_reviews', label: 'Customer Review Alerts', desc: 'Email notification when reviews are posted', icon: Mail, color: '#f59e0b' },
  { key: 'low_stock_push', label: 'Low Inventory Warnings', desc: 'Urgent push when stock drops below threshold', icon: AlertTriangle, color: '#ef4444' },
  { key: 'new_orders', label: 'New Order Alerts', desc: 'Real-time alerts for new customer orders', icon: ShoppingBag, color: '#2563eb' },
  { key: 'order_updates', label: 'Order Status Updates', desc: 'Updates as orders progress and dispatch', icon: PackageCheck, color: '#0284c7' },
  { key: 'low_stock', label: 'Low Stock Alerts', desc: 'Email when inventory is running low', icon: AlertTriangle, color: '#ef4444' },
  { key: 'settlements', label: 'Settlement Reports', desc: 'Summaries of payouts and settlements', icon: Wallet, color: '#10b981' },
  { key: 'product_approval', label: 'Product Approval Updates', desc: 'Notify when product listings are reviewed', icon: ShieldCheck, color: '#8b5cf6' },
  { key: 'marketing', label: 'Marketing & Promotions', desc: 'Campaign and promotional announcements', icon: Megaphone, color: '#d97706' },
]

function sessionIcon(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('mobile') || n.includes('ios') || n.includes('android')) return <Smartphone size={18} />
  if (n.includes('tablet') || n.includes('ipad')) return <Laptop size={18} />
  return <Monitor size={18} />
}

export default function VendorSecurity() {
  const toast = useToast()
  const [pw, setPw] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toggling2fa, setToggling2fa] = useState(false)
  const [revoking, setRevoking] = useState(null)

  const security = useApi(() => api.get('/vendor/security'))
  const settings = useApi(() => api.get('/vendor/notification-settings'))

  const sec = security.data || {}
  const user = sec.user || {}
  const sessions = sec.sessions || []
  const auditLogs = sec.audit_logs || []
  const twoFa = !!sec.two_factor_enabled
  const preferences = settings.data?.preferences || {}

  const changePassword = async (e) => {
    e.preventDefault()
    if (!pw.current_password) {
      toast.error('Please enter your current password')
      return
    }
    if (pw.new_password.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }
    if (pw.new_password !== pw.new_password_confirmation) {
      toast.error('New passwords do not match')
      return
    }

    setSavingPw(true)
    try {
      await api.put('/vendor/password', {
        current_password: pw.current_password,
        password: pw.new_password,
        password_confirmation: pw.new_password_confirmation,
      })
      toast.success('Password updated successfully!')
      setPw({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingPw(false)
    }
  }

  const toggle2fa = async () => {
    setToggling2fa(true)
    try {
      await api.put('/vendor/2fa', { enabled: !twoFa })
      toast.success(twoFa ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled')
      security.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setToggling2fa(false)
    }
  }

  const revokeSession = async (tokenId) => {
    setRevoking(tokenId)
    try {
      await api.delete(`/vendor/sessions/${tokenId}`)
      toast.success('Session revoked and logged out')
      security.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRevoking(null)
    }
  }

  const revokeAllSessions = async () => {
    setRevoking('all')
    try {
      await api.delete('/vendor/sessions')
      toast.success('Signed out of all other devices successfully')
      security.reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRevoking(null)
    }
  }

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] }
    try {
      await api.put('/vendor/notification-settings', next)
      settings.setData({ preferences: next })
      toast.success('Preference updated')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const getPasswordStrength = () => {
    const p = pw.new_password
    if (!p) return { score: 0, text: 'Enter password', color: 'var(--muted)' }
    let score = 0
    if (p.length >= 8) score += 1
    if (/[A-Z]/.test(p)) score += 1
    if (/[0-9]/.test(p)) score += 1
    if (/[^A-Za-z0-9]/.test(p)) score += 1

    if (score <= 1) return { score: 25, text: 'Weak', color: '#ef4444' }
    if (score === 2) return { score: 50, text: 'Fair', color: '#f59e0b' }
    if (score === 3) return { score: 75, text: 'Good', color: '#3b82f6' }
    return { score: 100, text: 'Strong & Secure', color: '#10b981' }
  }

  const strength = getPasswordStrength()

  if (security.loading) {
    return (
      <div className="flex flex-col gap-4" style={{ paddingBottom: 50 }}>
        <Skeleton height={120} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20 }}>
          <Skeleton height={380} />
          <Skeleton height={380} />
        </div>
        <Skeleton height={200} />
        <Skeleton height={240} />
      </div>
    )
  }

  if (security.error) {
    return <ErrorState message={errorMessage(security.error)} onRetry={security.reload} />
  }

  return (
    <div style={{ width: '100%', paddingBottom: 50 }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Account Security & Credentials</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Protect your merchant wallet, update login passwords, configure 2FA, and monitor active sessions.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        <form className="card" onSubmit={changePassword} style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <KeyRound size={17} color="var(--primary)" /> Change Login Password
            </h3>
            <span className="muted text-xs">Minimum 8 characters</span>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Current Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input"
                  style={{ width: '100%', paddingRight: 38 }}
                  value={pw.current_password}
                  onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  style={{ width: '100%', paddingRight: 38 }}
                  value={pw.new_password}
                  onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                  placeholder="Min. 8 chars (letters, numbers, symbols)"
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {pw.new_password && (
                <div style={{ marginTop: 6 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="muted text-xs" style={{ fontSize: 11 }}>Password Strength:</span>
                    <span className="font-bold text-xs" style={{ color: strength.color, fontSize: 11 }}>{strength.text}</span>
                  </div>
                  <div className="progress" style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                    <div style={{ width: `${strength.score}%`, height: '100%', background: strength.color, borderRadius: 2 }} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label" style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                Confirm New Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  className="input"
                  style={{ width: '100%', paddingRight: 38 }}
                  value={pw.new_password_confirmation}
                  onChange={(e) => setPw({ ...pw, new_password_confirmation: e.target.value })}
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                disabled={savingPw}
              >
                <Lock size={14} /> {savingPw ? 'Updating Password…' : 'Update Password'}
              </button>
            </div>
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                <Shield size={17} color="var(--primary)" /> Two-Factor Authentication (2FA)
              </h3>
              <span
                className="chip chip-sm"
                style={{
                  background: twoFa ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg)',
                  color: twoFa ? '#10b981' : 'var(--muted)',
                  fontWeight: 700,
                }}
              >
                {twoFa ? 'Active & Protected' : 'Disabled'}
              </span>
            </div>

            <p className="muted text-xs mb-3" style={{ lineHeight: 1.5 }}>
              Add a mandatory second verification layer. When enabled, signing into your merchant store requires an additional verification step.
            </p>

            <div className="p-3 mb-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} color={twoFa ? '#10b981' : 'var(--primary)'} />
                <span className="font-bold text-xs text-ink">
                  {twoFa ? 'Two-Factor Protection is ON' : 'Recommended for all merchants with payout wallets'}
                </span>
              </div>
            </div>

            <Button
              variant={twoFa ? 'danger-outline' : 'primary'}
              size="sm"
              onClick={toggle2fa}
              disabled={toggling2fa}
            >
              {toggling2fa && <Spinner size={13} color={twoFa ? '#ef4444' : '#fff'} />}
              {twoFa ? 'Disable Two-Factor Auth' : 'Setup & Enable 2FA'}
            </Button>
          </div>

          <div className="card" style={{ padding: 20, background: 'var(--bg)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Account & Last Activity</h4>
            <div className="flex items-center gap-3 mb-3">
              <span className="avatar" style={{ width: 40, height: 40, background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 800 }}>
                {initials(user.full_name)}
              </span>
              <div className="min-w-0">
                <div className="font-bold text-sm text-ink truncate">{user.full_name || '—'}</div>
                <div className="muted text-xs flex items-center gap-1"><Mail size={11} /> {user.email || '—'}</div>
                <div className="muted text-xs flex items-center gap-1"><Phone size={11} /> {user.phone || '—'}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={13} color="#2563eb" />
                <span className="text-ink">Last login: {formatDateTime(user.last_login_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={13} color="#2563eb" />
                <span className="text-ink">Last login IP: {user.last_login_ip || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-2">
          <ShieldCheck size={17} color="var(--primary)" /> Notification Preferences
        </h3>
        <span className="muted text-xs">Choose which merchant alerts you receive and through which channels.</span>

        {settings.loading ? (
          <div style={{ marginTop: 16 }}>
            <Skeleton height={120} />
          </div>
        ) : settings.error ? (
          <div style={{ marginTop: 16 }}>
            <ErrorState message={errorMessage(settings.error)} onRetry={settings.reload} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
            {PREFERENCE_META.map((p) => {
              if (preferences[p.key] === undefined) return null
              return (
                <div key={p.key} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-ink flex items-center gap-1">
                      <p.icon size={13} color={p.color} /> {p.label}
                    </div>
                    <div className="muted text-xs" style={{ fontSize: 11 }}>{p.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!preferences[p.key]}
                    onChange={() => togglePreference(p.key)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <div className="flex items-center justify-between wrap gap-2 mb-3">
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Monitor size={17} color="var(--primary)" /> Active Devices & Sessions
            </h3>
            <span className="muted text-xs">Manage active browser logins and mobile app devices currently authorized</span>
          </div>

          {sessions.length > 1 && (
            <button
              type="button"
              className="btn btn-danger-outline btn-xs flex items-center gap-1"
              onClick={revokeAllSessions}
              disabled={revoking === 'all'}
            >
              {revoking === 'all' ? <Spinner size={12} color="#ef4444" /> : <LogOut size={12} />} Sign Out All Other Devices
            </button>
          )}
        </div>

        {sessions.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: s.is_current ? '2px solid rgba(37, 99, 235, 0.3)' : '1px solid var(--border)',
                  background: s.is_current ? 'rgba(37, 99, 235, 0.02)' : 'var(--bg)',
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="avatar"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      background: s.is_current ? 'var(--primary-50)' : '#fff',
                      color: s.is_current ? 'var(--primary)' : 'var(--muted)',
                      border: '1px solid var(--border)',
                      flexShrink: 0,
                    }}
                  >
                    {sessionIcon(s.name)}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 wrap">
                      <span className="font-bold text-xs text-ink">{s.name || 'Mobile'}</span>
                      {s.is_current && (
                        <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                          <Check size={10} /> Current Device
                        </span>
                      )}
                    </div>
                    <div className="muted text-xs mt-0.5">
                      Created {formatDateTime(s.created_at)} · Last active {formatDateTime(s.last_active_at)}
                    </div>
                  </div>
                </div>

                {!s.is_current && (
                  <button
                    type="button"
                    className="btn btn-outline btn-xs flex items-center gap-1"
                    onClick={() => revokeSession(s.id)}
                    disabled={revoking === s.id}
                  >
                    {revoking === s.id ? <Spinner size={11} color="var(--muted)" /> : <LogOut size={11} />} Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Monitor} title="No active sessions" message="You have no active sessions other than this one." />
        )}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }} className="flex items-center gap-2">
          <History size={17} color="var(--primary)" /> Recent Security Audit Trail
        </h3>
        {auditLogs.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} color="#10b981" />
                  <span className="font-bold text-ink text-xs">{log.event}</span>
                  {log.ip && <span className="muted text-xs">({log.ip})</span>}
                </div>
                <span className="muted text-xs">{formatDateTime(log.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={History} title="No audit events" message="Security events will be recorded here as they happen." />
        )}
      </div>
    </div>
  )
}
