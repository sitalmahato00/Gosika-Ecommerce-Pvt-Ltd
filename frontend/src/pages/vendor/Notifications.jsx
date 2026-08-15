import React, { useCallback, useState } from 'react'
import {
  Bell, Check, CheckCheck, ShoppingBag, PackageCheck, AlertTriangle,
  Wallet, Headphones, Megaphone, Star, ShieldCheck, Trash2,
  Clock, CheckCircle2, MessageSquare, ArrowRight, Sliders, Smartphone, Mail
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useList, useApi } from '../../hooks/useApi'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage } from '../../utils/format'

const TAB_FILTERS = {
  all: {},
  unread: { unread: 1 },
  orders: { category: 'new_order' },
  finance: { category: 'settlement' },
  reviews: { category: 'review' },
}

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
  const [tab, setTab] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)
  const [actingId, setActingId] = useState(null)
  const [clearing, setClearing] = useState(false)

  const fetcher = useCallback(
    (page, pageSize) => api.get('/vendor/notifications', {
      params: { page, per_page: pageSize, ...TAB_FILTERS[tab] },
    }),
    [tab],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [tab],
    pageSize: 10,
  })

  const settings = useApi(() => api.get('/vendor/notification-settings'))
  const preferences = settings.data?.preferences || {}

  const unreadCount = items.filter((n) => !n.read_at).length
  const tabCounts = {
    orders: items.filter((n) => (n.category || '').includes('order')).length,
    finance: items.filter((n) => n.category === 'settlement').length,
    reviews: items.filter((n) => n.category === 'review').length,
  }

  const markRead = async (n) => {
    setActingId(n.id)
    try {
      await api.post(`/vendor/notifications/${n.id}/read`)
      toast.success('Notification marked as read')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActingId(null)
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/vendor/notifications/read-all')
      toast.success('All notifications marked as read')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const clearRead = async () => {
    setClearing(true)
    try {
      await api.delete('/vendor/notifications/read')
      toast.success('Cleared read notification history')
      setConfirmClear(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setClearing(false)
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

  const tabs = [
    { id: 'all', label: `All Alerts (${items.length})` },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'orders', label: `Orders (${tabCounts.orders})` },
    { id: 'finance', label: `Payouts (${tabCounts.finance})` },
    { id: 'reviews', label: `Reviews (${tabCounts.reviews})` },
  ]

  return (
    <div style={{ width: '100%', paddingBottom: 50 }}>
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
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => setConfirmClear(true)}>
            <Trash2 size={13} /> Clear Read History
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 24, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
            <div className="flex gap-1 wrap">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn btn-xs ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 'var(--radius-sm)' }}
                  onClick={() => { setTab(t.id); setPage(1) }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={76} />)}
            </div>
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={reload} />
          ) : items.length ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((n) => {
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
                            <Clock size={11} /> {formatDateTime(n.created_at)}
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
                              onClick={() => markRead(n)}
                              disabled={actingId === n.id}
                            >
                              {actingId === n.id ? <Spinner size={11} color="var(--muted)" /> : <Check size={11} />} Mark as Read
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
              <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
            </>
          ) : (
            <EmptyState
              icon={Bell}
              title="No alerts in this category"
              message="You have no notifications matching this filter."
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-2">
              <Sliders size={16} color="var(--primary)" /> Alert Delivery Preferences
            </h3>
            <p className="muted text-xs mb-4">
              Configure which communication channels receive real-time merchant alerts.
            </p>

            {settings.loading ? (
              <Skeleton height={140} />
            ) : settings.error ? (
              <ErrorState message={errorMessage(settings.error)} onRetry={settings.reload} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PREFERENCE_META.map((p) => {
                  if (preferences[p.key] === undefined) return null
                  return (
                    <div key={p.key} className="flex items-center justify-between">
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
                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Merchant Mobile App</h4>
            <p className="text-xs" style={{ color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
              Download the GOSIKA Vendor app for Android and iOS to receive push notifications for order dispatches anywhere in Nepal.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearRead}
        title="Clear read notifications?"
        message="This will permanently delete all notifications you have already read. Unread notifications are kept."
        confirmText="Clear Read History"
        danger
        loading={clearing}
      />
    </div>
  )
}
