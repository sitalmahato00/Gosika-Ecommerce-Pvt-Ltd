import React, { useEffect, useState } from 'react'
import { KeyRound, Shield, ShieldCheck, Smartphone, Laptop, LogOut, Monitor, Check } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage } from '../../utils/format'

const emptyPw = { current_password: '', new_password: '', new_password_confirmation: '' }

export default function VendorSecurity() {
  const toast = useToast()
  const [pw, setPw] = useState(emptyPw)
  const [savingPw, setSavingPw] = useState(false)
  const [twoFa, setTwoFa] = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/security'),
      api.get('/vendor/sessions'),
    ]).then(([s, se]) => {
      if (s.status === 'fulfilled') setTwoFa(!!s.value.data.data?.two_factor_enabled)
      if (se.status === 'fulfilled') setSessions(se.value.data.data || [])
      setLoading(false)
    })
  }, [])

  const changePassword = async (e) => {
    e.preventDefault()
    if (pw.new_password !== pw.new_password_confirmation) {
      toast.error('New passwords do not match')
      return
    }
    setSavingPw(true)
    try {
      await api.put('/vendor/password', {
        current_password: pw.current_password,
        new_password: pw.new_password,
        new_password_confirmation: pw.new_password_confirmation,
      })
      toast.success('Password changed')
      setPw(emptyPw)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSavingPw(false)
    }
  }

  const toggleTwoFa = async () => {
    try {
      if (twoFa) {
        await api.post('/vendor/security/two-factor/disable')
        toast.success('Two-factor authentication disabled')
      } else {
        const r = await api.post('/vendor/security/two-factor/enable')
        toast.success('Two-factor authentication enabled')
        if (r.data.data?.secret) {
          toast.info('Scan the QR code shown in your authenticator app')
        }
      }
      setTwoFa(!twoFa)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const logoutSession = async (id) => {
    try {
      await api.post(`/vendor/sessions/${id}/revoke`)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      toast.success('Session ended')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Skeleton height={160} />
        <Skeleton height={180} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Security</h1>
          <p>Manage your password, two-factor authentication and active sessions</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start' }}>
        {/* Change password */}
        <form className="card" onSubmit={changePassword}>
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <KeyRound size={16} color="var(--primary)" /> Change Password
          </h3>
          <div className="flex flex-col gap-2">
            <Input label="Current password" type="password" required autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
            <Input label="New password" type="password" required minLength={8} autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} hint="At least 8 characters with a mix of letters and numbers." />
            <Input label="Confirm new password" type="password" required autoComplete="new-password" value={pw.new_password_confirmation} onChange={(e) => setPw({ ...pw, new_password_confirmation: e.target.value })} />
          </div>
          <Button type="submit" variant="primary" disabled={savingPw} className="mt-2">
            {savingPw ? <Spinner size={15} color="#fff" /> : 'Update password'}
          </Button>
        </form>

        {/* Two-factor auth */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Shield size={16} color="var(--primary)" /> Two-Factor Authentication
          </h3>
          <div className="flex items-center justify-between gap-3" style={{ marginBottom: 10 }}>
            <div className="flex items-center gap-3">
              <span className="thumb" style={{ width: 40, height: 40, borderRadius: '50%', background: twoFa ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)' }}>
                <ShieldCheck size={18} color={twoFa ? 'var(--success)' : 'var(--muted)'} />
              </span>
              <div>
                <div className="font-medium text-sm">{twoFa ? 'Enabled' : 'Disabled'}</div>
                <div className="muted text-xs" style={{ maxWidth: 260 }}>
                  {twoFa
                    ? 'Your account requires a verification code from your authenticator app at login.'
                    : 'Add an extra layer of security to your account with an authenticator app.'}
                </div>
              </div>
            </div>
            <StatusBadge status={twoFa ? 'enabled' : 'disabled'} />
          </div>
          <Button variant={twoFa ? 'danger-outline' : 'primary'} onClick={toggleTwoFa}>
            {twoFa ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </div>
      </div>

      {/* Active sessions */}
      <div className="card mt-3">
        <h3 className="flex items-center gap-2 mb-2" style={{ fontSize: 16 }}>
          <Monitor size={16} color="var(--primary)" /> Active Sessions
        </h3>
        <p className="muted text-sm mb-3">Devices where you are currently signed in.</p>
        {!sessions.length ? (
          <div className="muted text-sm" style={{ padding: '12px 0' }}>No other active sessions found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sessions.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="thumb" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(37,99,235,0.1)' }}>
                  {s.device === 'mobile' ? <Smartphone size={17} color="var(--primary)" /> : s.device === 'tablet' ? <Laptop size={17} color="var(--primary)" /> : <Monitor size={17} color="var(--primary)" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm capitalize">{s.device || 'Web'}</span>
                    {s.is_current && <StatusBadge status="this_device" />}
                  </div>
                  <div className="muted text-xs">
                    {s.browser || 'Browser'} · {s.ip_address || ''} · Last active {formatDateTime(s.last_active_at || s.created_at)}
                  </div>
                </div>
                {!s.is_current && (
                  <button className="btn btn-outline btn-sm" onClick={() => logoutSession(s.id)}>
                    <LogOut size={13} /> Sign out
                  </button>
                )}
                {s.is_current && (
                  <span className="muted text-xs flex items-center gap-1"><Check size={13} color="var(--success)" /> Current</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
