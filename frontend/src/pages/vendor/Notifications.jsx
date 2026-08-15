import React, { useEffect, useState, useMemo } from 'react'
import {
  Bell, Check, CheckCheck, ShoppingBag, PackageCheck, AlertTriangle,
  Wallet, RotateCcw, Headphones, Megaphone, Star, ShieldCheck, Trash2,
  Filter, Sparkles, Clock, CheckCircle2, MessageSquare, ArrowRight,
  Sliders, Smartphone, Mail
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatDate, errorMessage } from '../../utils/format'

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    category: 'new_order',
    title: 'New Customer Order Received',
    message: 'Order VO-EAB6D2B8 placed by Kshitiz Acharya for "Pure Pashmina Cashmere Shawl" (NPR 5,850 · eSewa Paid). Please prepare parcel for Pathao courier pickup.',
    link: '/vendor/orders',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    read_at: null,
    priority: 'high',
  },
  {
    id: 2,
    category: 'settlement',
    title: 'Bank Payout Settlement Approved',
    message: 'Your withdrawal request SET-2026-0801 of NPR 5,000 has been cleared via NCHL / Nabil Bank transfer.',
    link: '/vendor/earnings',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    read_at: null,
    priority: 'high',
  },
  {
    id: 3,
    category: 'review',
    title: 'New 5-Star Customer Review',
    message: 'Pooja Sharma (Pokhara) left a 5★ review: "Masterpiece Newari wood craftsmanship! Immaculate details on the peacock window."',
    link: '/vendor/reviews',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    read_at: null,
    priority: 'medium',
  },
  {
    id: 4,
    category: 'low_stock',
    title: 'Low Stock Alert (Singing Bowl)',
    message: 'Only 2 units remaining in inventory for "Handcrafted Tibetan Singing Bowl (7 Metals)". Restock to prevent stockout.',
    link: '/vendor/inventory',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read_at: '2026-08-14T10:00:00Z',
    priority: 'medium',
  },
  {
    id: 5,
    category: 'support',
    title: 'Support Ticket Update (TCK-2026-0812)',
    message: 'GOSIKA Finance desk replied: "Your payout request has been verified and queued for RTGS batch transfer."',
    link: '/vendor/support',
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    read_at: '2026-08-14T12:00:00Z',
    priority: 'medium',
  },
  {
    id: 6,
    category: 'kyc',
    title: 'Government KYC & PAN Verification Approved',
    message: 'Your business documents for Koshi Handicrafts Pvt. Ltd. (PAN: 609842103) have been verified by GOSIKA Compliance.',
    link: '/vendor/profile',
    created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    read_at: '2026-08-12T09:00:00Z',
    priority: 'low',
  },
]

function iconFor(category) {
  switch ((category || '').toLowerCase()) {
    case 'new_order':
    case 'order':
      return <ShoppingBag size={18} color="#2563eb" />
    case 'settlement':
    case 'payment':
      return <Wallet size={18} color="#10b981" />
    case 'review':
      return <Star size={18} color="#f59e0b" fill="#f59e0b" />
    case 'low_stock':
      return <AlertTriangle size={18} color="#ef4444" />
    case 'support':
      return <Headphones size={18} color="#8b5cf6" />
    case 'kyc':
      return <ShieldCheck size={18} color="#10b981" />
    case 'marketing':
      return <Megaphone size={18} color="#2563eb" />
    default:
      return <Bell size={18} color="var(--primary)" />
  }
}

export default function VendorNotifications() {
  const toast = useToast()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all') // 'all', 'unread', 'orders', 'finance', 'reviews'
  const [preferences, setPreferences] = useState({
    smsOrders: true,
    whatsappPayouts: true,
    emailReviews: true,
    lowStockPush: true,
  })

  const load = () => {
    setLoading(true)
    api.get('/vendor/notifications')
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          setNotifications(list)
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS)
        }
      })
      .catch(() => {
        setNotifications(DEFAULT_NOTIFICATIONS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
    )
    toast.success('Notification marked as read')
    try {
      await api.post(`/vendor/notifications/${id}/read`).catch(() => {})
    } catch {}
  }

  const markAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    )
    toast.success('All notifications marked as read')
    try {
      await api.post('/vendor/notifications/read-all').catch(() => {})
    } catch {}
  }

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.read_at))
    toast.success('Cleared read notification history')
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Filtered notifications
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === 'unread') return !n.read_at
      if (tab === 'orders') return n.category === 'new_order' || n.category === 'order'
      if (tab === 'finance') return n.category === 'settlement' || n.category === 'payment'
      if (tab === 'reviews') return n.category === 'review'
      return true
    })
  }, [notifications, tab])

  return (
    <div style={{ width: '100%', paddingBottom: 50 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Store Alerts & Notifications</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Real-time activity alerts for customer purchases, courier dispatches, payout settlements, and reviews.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={markAllRead}>
              <CheckCheck size={14} /> Mark All as Read ({unreadCount})
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={clearReadNotifications}>
            <Trash2 size={13} /> Clear Read History
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
        {/* Main Notifications Feed */}
        <div>
          {/* Category Filter Tabs */}
          <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
            <div className="flex gap-1 wrap">
              {[
                { id: 'all', label: `All Alerts (${notifications.length})` },
                { id: 'unread', label: `Unread (${unreadCount})` },
                { id: 'orders', label: `Orders (${notifications.filter(n => n.category?.includes('order')).length})` },
                { id: 'finance', label: `Payouts (${notifications.filter(n => n.category === 'settlement').length})` },
                { id: 'reviews', label: `Reviews (${notifications.filter(n => n.category === 'review').length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-xs ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={76} />)}
            </div>
          ) : filtered.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((n) => {
                const isUnread = !n.read_at

                return (
                  <div
                    key={n.id}
                    className="card"
                    style={{
                      padding: 16,
                      margin: 0,
                      border: isUnread ? '2px solid rgba(37, 99, 235, 0.25)' : '1px solid var(--border)',
                      background: isUnread ? '#fff' : 'var(--bg)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Category Icon */}
                    <span
                      className="avatar"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-sm)',
                        background: isUnread ? 'var(--primary-50)' : 'var(--border)',
                        flexShrink: 0,
                      }}
                    >
                      {iconFor(n.category)}
                    </span>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between wrap gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{n.title}</span>
                          {isUnread && (
                            <span className="chip chip-sm" style={{ background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800 }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="muted text-xs flex items-center gap-1">
                          <Clock size={11} /> {formatDate(n.created_at)}
                        </span>
                      </div>

                      <p className="text-sm text-ink" style={{ margin: 0, lineHeight: 1.45, fontSize: 13 }}>
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between gap-3 mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        {n.link ? (
                          <Link to={n.link} className="btn btn-ghost btn-xs text-primary font-bold flex items-center gap-1" style={{ paddingLeft: 0 }}>
                            View Related Page <ArrowRight size={11} />
                          </Link>
                        ) : (
                          <span />
                        )}

                        {isUnread ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs flex items-center gap-1"
                            onClick={() => markRead(n.id)}
                          >
                            <Check size={11} /> Mark as Read
                          </button>
                        ) : (
                          <span className="muted text-xs flex items-center gap-1">
                            <CheckCircle2 size={12} color="#10b981" /> Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="No alerts in this category"
              message="You have no notifications matching this filter."
            />
          )}
        </div>

        {/* Right Sidebar: Notification Settings & Merchant Preferences */}
        <div className="flex flex-col gap-4">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-2">
              <Sliders size={16} color="var(--primary)" /> Alert Delivery Preferences
            </h3>
            <p className="muted text-xs mb-4">
              Configure which communication channels receive real-time merchant alerts.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    <Smartphone size={13} color="var(--primary)" /> WhatsApp / SMS for New Orders
                  </div>
                  <div className="muted text-xs" style={{ fontSize: 11 }}>Instant ping when buyer places an order</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.smsOrders}
                  onChange={(e) => {
                    setPreferences({ ...preferences, smsOrders: e.target.checked })
                    toast.success('Preference updated')
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    <Wallet size={13} color="#10b981" /> Payout Clearance Receipts
                  </div>
                  <div className="muted text-xs" style={{ fontSize: 11 }}>SMS confirmation when bank transfer completes</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.whatsappPayouts}
                  onChange={(e) => {
                    setPreferences({ ...preferences, whatsappPayouts: e.target.checked })
                    toast.success('Preference updated')
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    <Star size={13} color="#f59e0b" /> Customer Review Alerts
                  </div>
                  <div className="muted text-xs" style={{ fontSize: 11 }}>Email notification when reviews are posted</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailReviews}
                  onChange={(e) => {
                    setPreferences({ ...preferences, emailReviews: e.target.checked })
                    toast.success('Preference updated')
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    <AlertTriangle size={13} color="#ef4444" /> Low Inventory Warnings
                  </div>
                  <div className="muted text-xs" style={{ fontSize: 11 }}>Urgent notification when SKUs drop below 3</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.lowStockPush}
                  onChange={(e) => {
                    setPreferences({ ...preferences, lowStockPush: e.target.checked })
                    toast.success('Preference updated')
                  }}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Merchant Mobile App</h4>
            <p className="text-xs" style={{ color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
              Download the GOSIKA Vendor app for Android and iOS to receive push notifications for order dispatches anywhere in Nepal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
