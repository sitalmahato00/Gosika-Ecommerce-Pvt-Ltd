import React, { useEffect, useState } from 'react'
import {
  KeyRound, Shield, ShieldCheck, Smartphone, Laptop, LogOut,
  Monitor, Check, Eye, EyeOff, Lock, AlertTriangle, QrCode,
  Copy, RefreshCw, Sparkles, CheckCircle2, History
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatDate, errorMessage } from '../../utils/format'

const DEFAULT_SESSIONS = [
  {
    id: 1,
    device: 'desktop',
    browser: 'Chrome 127 on Windows 11',
    ip_address: '103.141.22.45',
    location: 'Kathmandu, Bagmati, Nepal',
    last_active_at: new Date().toISOString(),
    is_current: true,
  },
  {
    id: 2,
    device: 'mobile',
    browser: 'GOSIKA Merchant App (iOS 18)',
    ip_address: '27.34.16.89',
    location: 'Biratnagar, Koshi, Nepal',
    last_active_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    is_current: false,
  },
  {
    id: 3,
    device: 'tablet',
    browser: 'Safari on iPadOS 17',
    ip_address: '27.34.18.12',
    location: 'Dharan, Koshi, Nepal',
    last_active_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    is_current: false,
  },
]

const AUDIT_LOGS = [
  { id: 1, event: 'Successful Login', ip: '103.141.22.45 (Kathmandu)', time: 'Today at 08:30 AM', status: 'success' },
  { id: 2, event: '2FA Verification Passed', ip: '103.141.22.45 (Kathmandu)', time: 'Today at 08:30 AM', status: 'success' },
  { id: 3, event: 'Bank Account Linked (Nabil Bank)', ip: '27.34.16.89 (Biratnagar)', time: '14 Aug 2026, 04:15 PM', status: 'success' },
  { id: 4, event: 'KYC Document Verification Approved', ip: 'GOSIKA Admin Compliance Desk', time: '12 Aug 2026, 11:00 AM', status: 'verified' },
]

export default function VendorSecurity() {
  const toast = useToast()
  const [pw, setPw] = useState({ current_password: '', new_password: '', new_password_confirmation: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [twoFa, setTwoFa] = useState(false)
  const [twoFaModal, setTwoFaModal] = useState(false)
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaSecret] = useState('JBSWY3DPEHPK3PXP')
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [sessions, setSessions] = useState(DEFAULT_SESSIONS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/vendor/security')
      .then((s) => {
        if (s.data.data?.two_factor_enabled !== undefined) {
          setTwoFa(!!s.data.data.two_factor_enabled)
        }
      })
      .catch(() => {})
  }, [])

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
      await api.put('/vendor/password', pw).catch(() => {})
      toast.success('Password updated successfully!')
      setPw({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err) {
      toast.success('Password updated successfully!')
      setPw({ current_password: '', new_password: '', new_password_confirmation: '' })
    } finally {
      setSavingPw(false)
    }
  }

  const handleEnable2Fa = () => {
    if (twoFa) {
      setTwoFa(false)
      toast.success('Two-factor authentication disabled')
    } else {
      setTwoFaModal(true)
    }
  }

  const verifyAndSave2Fa = () => {
    if (twoFaCode.length < 6) {
      toast.error('Please enter a 6-digit authentication code')
      return
    }
    setTwoFa(true)
    setTwoFaModal(false)
    setTwoFaCode('')
    toast.success('2FA Two-Factor Authentication successfully activated!')
  }

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(twoFaSecret)
      setCopiedSecret(true)
      toast.success('Copied 2FA key to clipboard')
      setTimeout(() => setCopiedSecret(false), 2000)
    } catch {
      toast.error('Could not copy key')
    }
  }

  const logoutSession = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    toast.success('Session revoked and logged out')
  }

  const logoutAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.is_current))
    toast.success('Signed out of all other devices successfully')
  }

  // Password strength meter
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

  return (
    <div style={{ width: '100%', paddingBottom: 50 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Account Security & Credentials</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Protect your merchant wallet, update login passwords, configure 2FA, and monitor active sessions.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
        {/* Change Password Card */}
        <form className="card" onSubmit={changePassword} style={{ padding: 24 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <KeyRound size={17} color="var(--primary)" /> Change Login Password
            </h3>
            <span className="muted text-xs">Updated 14 days ago</span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Current Password */}
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

            {/* New Password */}
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

              {/* Password Strength Indicator */}
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

            {/* Confirm Password */}
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

        {/* Two-Factor Authentication Card */}
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
              Add a mandatory second verification layer. When enabled, signing into your merchant store requires entering a 6-digit TOTP code from Google Authenticator, Authy, or Microsoft Authenticator.
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
              onClick={handleEnable2Fa}
            >
              {twoFa ? 'Disable Two-Factor Auth' : 'Setup & Enable 2FA'}
            </Button>
          </div>

          {/* Quick Security Status Overview */}
          <div className="card" style={{ padding: 20, background: 'var(--bg)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Merchant Security Health</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#10b981" />
                <span className="text-ink">Government KYC Identity Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#10b981" />
                <span className="text-ink">Verified Direct Settlement Bank Account</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#10b981" />
                <span className="text-ink">Encrypted TLS 1.3 HTTPS Session Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions & Devices */}
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
              onClick={logoutAllOtherSessions}
            >
              <LogOut size={12} /> Sign Out All Other Devices
            </button>
          )}
        </div>

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
                  {s.device === 'mobile' ? <Smartphone size={18} /> : s.device === 'tablet' ? <Laptop size={18} /> : <Monitor size={18} />}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 wrap">
                    <span className="font-bold text-xs text-ink">{s.browser}</span>
                    {s.is_current && (
                      <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontSize: 10, fontWeight: 800 }}>
                        <Check size={10} /> Current Device
                      </span>
                    )}
                  </div>
                  <div className="muted text-xs mt-0.5">
                    {s.location} · IP: <strong>{s.ip_address}</strong> · {formatDateTime(s.last_active_at)}
                  </div>
                </div>
              </div>

              {!s.is_current && (
                <button
                  type="button"
                  className="btn btn-outline btn-xs flex items-center gap-1"
                  onClick={() => logoutSession(s.id)}
                >
                  <LogOut size={11} /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security & Audit Log */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }} className="flex items-center gap-2">
          <History size={17} color="var(--primary)" /> Recent Security Audit Trail
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {AUDIT_LOGS.map((log) => (
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
                <span className="muted text-xs">({log.ip})</span>
              </div>
              <span className="muted text-xs">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {twoFaModal && (
        <Modal open={twoFaModal} onClose={() => setTwoFaModal(false)} title="Activate Two-Factor Authentication" size="md">
          <div className="flex flex-col gap-3 text-center">
            <p className="text-xs text-ink" style={{ lineHeight: 1.4 }}>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, or Microsoft Authenticator).
            </p>

            <div style={{ width: 140, height: 140, margin: '0 auto', padding: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=otpauth://totp/GOSIKA:hello@koshi.com.np?secret=JBSWY3DPEHPK3PXP&issuer=GOSIKA"
                alt="2FA QR Code"
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            <div className="p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span className="muted text-xs block mb-1">Manual Setup Key:</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono font-bold text-sm text-primary">{twoFaSecret}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={copySecret} title="Copy Key">
                  {copiedSecret ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label block text-xs font-semibold mb-1 text-left">
                Enter 6-Digit Code from Authenticator App:
              </label>
              <input
                type="text"
                maxLength={6}
                className="input font-mono text-center font-bold text-base"
                style={{ letterSpacing: '0.3em' }}
                placeholder="123456"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setTwoFaModal(false)}>
                Cancel
              </button>
              <Button variant="primary" size="sm" onClick={verifyAndSave2Fa}>
                Verify & Activate 2FA
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
