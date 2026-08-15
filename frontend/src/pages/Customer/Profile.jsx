import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, Trash, Eye, Edit, XCircle, Check, Clock, Calendar, Mail, Phone } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'

export default function CustomerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    api.get('/customer/profile').then((res) => {
      setProfile(res.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!profile) return <div className="p-8 text-center"><h3>Profile not found</h3></div>

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Profile Image & Details */}
          <div>
            <div className="text-center mb-4">
              <img
                src={profile.avatar || '/placeholder-avatar.jpg'}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-['var(--border)']"
              />
              <h3 style={{ fontSize: 20, marginBottom: 4 }}>{profile.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{profile.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <p style={{ fontSize: 14, color: 'var(--primary)' }}>{profile.phone || '—'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Member Since</label>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>{formatDate(profile.created_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Orders</label>
                <p style={{ fontSize: 14, color: 'var(--primary)' }}>{profile.total_orders || 0}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Spent</label>
                <p style={{ fontSize: 14, color: 'var(--primary)' }}>${(profile.total_spent || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Account Settings</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Security Settings</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Manage passwords, 2FA, and login history</div>
              </button>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Notification Preferences</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Email and SMS notification settings</div>
              </button>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Privacy Settings</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Control your data visibility</div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--danger)'] text-danger transition-colors">
                <div style={{ fontWeight: 500 }}>Delete Account</div>
                <div style={{ fontSize: 12, color: 'var(--danger)' }}>Permanently delete your account and data</div>
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link to="/customer/orders" style={{ marginRight: 16 }} className="text-primary hover:underline">View Orders</Link>
          <Link to="/customer/returns" style={{ marginLeft: 16 }} className="text-primary hover:underline">Returns & Refunds</Link>
        </div>
      </div>
    </div>
  )
}