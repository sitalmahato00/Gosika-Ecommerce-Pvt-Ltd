import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Mail, MailOpen, PackageSearch, RotateCcw, ShoppingBag } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const CATEGORY_ICONS = {
  order: { icon: ShoppingBag, bg: 'rgba(255,85,0,0.12)', fg: '#ff5500' },
  delivery: { icon: PackageSearch, bg: 'rgba(14,165,233,0.12)', fg: '#0ea5e9' },
  return: { icon: RotateCcw, bg: 'rgba(99,102,241,0.12)', fg: '#6366f1' },
  wallet: { icon: Bell, bg: 'rgba(16,185,129,0.12)', fg: '#10b981' },
  general: { icon: Bell, bg: 'rgba(100,116,139,0.12)', fg: '#64748b' },
}

export default function AccountNotifications() {
  const toast = useToast()
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = (page, perPage) =>
    api.get('/customer/notifications', { params: { page, per_page: perPage, category: category || undefined } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchNotifications, {
    pageSize: 10,
    deps: [category],
  })

  const markRead = (n) => {
    if (n.read_at) {
      go(n)
      return
    }
    api.post(`/customer/notifications/${n.id}/read`).catch(() => {})
    if (n.link) go(n)
    reload()
  }

  const go = (n) => {
    if (n.link) {
      const target = n.link.startsWith('/') ? n.link : `/${n.link}`
      navigate(target)
    }
  }

  const markAllRead = () => {
    setMarkingAll(true)
    api.post('/customer/notifications/read-all')
      .then(() => {
        toast.success('All notifications marked as read.')
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setMarkingAll(false))
  }

  const unread = Number(meta.unread_count) || 0

  return (
    <AccountPage
      title="Notifications"
      subtitle={unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'You are all caught up.'}
      actions={
        meta.total > 0 ? (
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <CheckCheck size={14} /> Mark all as read
          </button>
        ) : undefined
      }
    >
      <div className="tabs" style={{ marginBottom: 0 }}>
        {[
          { value: '', label: 'All' },
          { value: 'order', label: 'Orders' },
          { value: 'delivery', label: 'Delivery' },
          { value: 'return', label: 'Returns' },
          { value: 'wallet', label: 'Wallet' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${category === t.value ? 'active' : ''}`}
            onClick={() => { setPage(1); setCategory(t.value) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <AccountSkeleton rows={5} height={54} />
      ) : error ? (
        <AccountError message={errorMessage(error)} onRetry={reload} />
      ) : items.length === 0 ? (
        <AccountEmpty
          icon={Bell}
          title="No notifications"
          message="When your orders, deliveries or returns change, you will see the latest updates here."
          action={<Link to="/shop" className="btn btn-primary btn-sm">Continue Shopping</Link>}
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((n) => {
            const cat = CATEGORY_ICONS[n.category] || CATEGORY_ICONS.general
            const Icon = cat.icon
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  background: n.read_at ? '#ffffff' : '#fff7f2',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span className="avatar" style={{ width: 36, height: 36, background: cat.bg, color: cat.fg, flexShrink: 0 }}>
                  <Icon size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-sm text-ink" style={{ fontSize: 13.5 }}>
                    {n.title}
                  </div>
                  <div className="muted text-xs mt-0.5" style={{ lineHeight: 1.5 }}>{n.message}</div>
                  <div className="muted text-xs mt-1" style={{ fontSize: 11 }}>{formatDateTime(n.created_at)}</div>
                </div>
                {n.read_at ? (
                  <Check size={14} color="#94a3b8" style={{ marginTop: 4, flexShrink: 0 }} />
                ) : (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#ff5500',
                      marginTop: 8,
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {meta.last_page > 1 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}
    </AccountPage>
  )
}