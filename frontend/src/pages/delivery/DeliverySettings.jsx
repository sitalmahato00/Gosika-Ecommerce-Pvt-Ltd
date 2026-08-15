import React from 'react'
import { Power, LogOut, Bell, Globe, ShieldCheck, Info, Moon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const SettingRow = ({ icon: Icon, title, desc, badge }) => (
  <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
    <div className="flex items-start gap-3">
      <span className="avatar" style={{ width: 34, height: 34, background: '#f1f5f9', color: '#64748b', flexShrink: 0 }}>
        <Icon size={16} />
      </span>
      <div>
        <div className="font-bold text-sm text-ink">{title}</div>
        <div className="muted text-xs mt-0.5">{desc}</div>
      </div>
    </div>
    {badge}
  </div>
)

export default function DeliverySettings() {
  const { logout } = useAuth()
  const { rider, online, toggleOnline, toggling } = useDelivery()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const handleToggle = async () => {
    try {
      await toggleOnline()
      toast.success('Duty status updated.')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Manage your duty, notifications and session.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 18, margin: 0 }}>
        <div className="flex items-center gap-3 pb-3 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="avatar" style={{ width: 40, height: 40, background: online ? 'rgba(16,185,129,0.12)' : '#f1f5f9', color: online ? '#10b981' : '#64748b' }}>
            <Power size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="font-bold text-ink">Available for deliveries</div>
            <div className="muted text-xs mt-0.5">{online ? 'You are online — the hub can dispatch orders to you.' : 'Go online to receive dispatch.'}</div>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            style={{
              position: 'relative',
              width: 44,
              height: 24,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
              background: online ? '#16a34a' : '#cbd5e1',
              flexShrink: 0,
            }}
            aria-label="Toggle duty"
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: online ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: 999,
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        <SettingRow
          icon={Bell}
          title="Push notifications"
          desc="Delivery dispatch alerts are sent by the GOSIKA hub."
          badge={<span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>Hub managed</span>}
        />
        <SettingRow
          icon={Globe}
          title="Language"
          desc="The rider app currently supports English."
          badge={<span className="chip chip-sm" style={{ background: 'var(--primary-50)', color: 'var(--primary)', whiteSpace: 'nowrap' }}>English</span>}
        />
        <SettingRow
          icon={Moon}
          title="Dark mode"
          desc="Coming soon — the portal currently renders in light theme."
          badge={<span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#94a3b8', whiteSpace: 'nowrap' }}>Soon</span>}
        />
        <SettingRow
          icon={ShieldCheck}
          title="Account security"
          desc={`Logged in as ${rider?.email || '—'}. Your account is secured with session authentication.`}
          badge={<span className="chip chip-sm" style={{ background: '#ecfdf5', color: '#059669', whiteSpace: 'nowrap' }}>Protected</span>}
        />
      </div>

      <div className="card" style={{ padding: 18, margin: 0 }}>
        <div className="flex items-start gap-3">
          <Info size={16} style={{ color: '#4f46e5', flexShrink: 0, marginTop: 2 }} />
          <p className="muted text-xs m-0">
            Duty status, availability and notifications are shared in real time with the GOSIKA dispatch hub. For account or payout changes, contact the hub directly.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="btn btn-danger-outline flex items-center justify-center gap-1.5"
        style={{ width: '100%' }}
      >
        <LogOut size={15} /> Log Out
      </button>
    </div>
  )
}
