import React, { useEffect, useState } from 'react'
import { Bell, Check, XCircle, Clock, Eye, Edit, Trash } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/customer/notifications').then((res) => {
      setNotifications(res.data.data?.notifications || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!notifications.length) {
    return (
      <div className="p-8 text-center">
        <div className="es-icon"><Bell size={48} /></div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Notifications</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 12 }}>You haven't received any notifications yet.</p>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Notifications</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(notifications && notifications.map((n) => (
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
                <span style={{ color: 'var(--muted)' }}>{formatDate(n.created_at)}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}{{ n.read ? 'Read' : 'Unread' }}</span>
              </div>
            </div>
          ))}
        ]}

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <a href="/customer" className="text-primary hover:underline">Mark All as Read</a>
        </div>
      </div>
    </div>
  )
}