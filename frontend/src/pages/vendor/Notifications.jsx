import React, { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, ShoppingBag, PackageCheck, AlertTriangle, Wallet, RotateCcw, Headphones, Megaphone } from 'lucide-react'
import api from '../../api/client'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage } from '../../utils/format'

function iconFor(category) {
  switch ((category || '').toLowerCase()) {
    case 'new_order': return <ShoppingBag size={16} color="var(--primary)" />
    case 'order': return <PackageCheck size={16} color="var(--primary)" />
    case 'product': return <PackageCheck size={16} color="var(--primary)" />
    case 'low_stock': return <AlertTriangle size={16} color="var(--danger)" />
    case 'payment':
    case 'settlement': return <Wallet size={16} color="var(--success)" />
    case 'return': return <RotateCcw size={16} color="var(--danger)" />
    case 'support': return <Headphones size={16} color="var(--primary)" />
    case 'marketing': return <Megaphone size={16} color="var(--primary)" />
    default: return <Bell size={16} color="var(--primary)" />
  }
}

export default function VendorNotifications() {
  const toast = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/vendor/notifications').then((r) => {
      setNotifications(r.data.data || [])
    }).catch(() => setNotifications([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n)))
    try {
      await api.post(`/vendor/notifications/${id}/read`)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    try {
      await api.post('/vendor/notifications/read-all')
      toast.success('All notifications marked as read')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const unread = notifications.filter((n) => !n.read_at).length
  const filtered = tab === 'unread' ? notifications.filter((n) => !n.read_at) : notifications

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notifications</h1>
          <p>Stay on top of orders, products, payments and support</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-outline" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All ({notifications.length})</button>
        <button className={`tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>Unread ({unread})</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={Bell}
          title={tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          message="New orders, product updates, payments and support replies will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read_at && markRead(n.id)}
              className="card"
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                textAlign: 'left',
                width: '100%',
                marginBottom: 8,
                padding: 14,
                cursor: n.read_at ? 'default' : 'pointer',
                borderColor: n.read_at ? 'var(--border)' : 'var(--primary)',
              }}
            >
              <span className="thumb" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'rgba(37,99,235,0.1)' }}>
                {iconFor(n.category || n.type)}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="flex items-center gap-2 mb-1">
                  <span className="font-medium" style={{ fontSize: 13.5 }}>{n.title || n.type?.replace(/_/g, ' ')}</span>
                  {!n.read_at && <span className="dot" style={{ background: 'var(--primary)' }} />}
                </span>
                {n.message && <span className="muted text-sm" style={{ display: 'block' }}>{n.message}</span>}
                <span className="muted text-xs">{formatDateTime(n.created_at)}</span>
              </span>
              {n.read_at && <Check size={14} color="var(--muted)" style={{ flexShrink: 0, marginTop: 4 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
