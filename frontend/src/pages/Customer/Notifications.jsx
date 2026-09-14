import React, { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import api from '../../api/client'
import AccountNotifications from '../account/Notifications'
import { useList } from '../../hooks/useApi'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime } from '../../utils/format'

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    let alive = true
    api.get('/customer/notifications', { skipCache: true })
      .then((res) => { if (alive) setNotifications(res.data?.data?.data ?? []) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (notifications.length === 0) {
    return <AccountNotifications />
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Notifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 12 }}>
              <div className="flex items-center gap-3 mb-2">
                <div style={{ width: 24, height: 24, borderRadius: 50, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={12} className="text-white" />
                </div>
                <div>
                  <p style={{ fontSize: 14, marginBottom: 2 }}>{n.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{n.message}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>{formatDateTime(n.created_at)}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>{n.read_at ? 'Read' : 'Unread'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}