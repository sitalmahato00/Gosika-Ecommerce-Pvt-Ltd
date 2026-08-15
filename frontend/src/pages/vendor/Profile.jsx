import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Settings, Trash, Eye, EyeSlash, ArrowLeft, Check, XCircle, Clock, Calendar, Mail, Phone, Shield, Layout } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function VendorProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    api.get('/vendor/profile').then((res) => {
      setProfile(res.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!profile) return <div className="p-8 text-center">Profile not found</div>

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Vendor Profile */}
          <div>
            <div className="text-center mb-4">
              <img
                src={profile.avatar || '/placeholder-vendor.jpg'}
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-['var(--border)']"
              />
              <h3 style={{ fontSize: 20, marginBottom: 4 }}>{profile.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{profile.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name</label>
                <p style={{ fontSize: 14, color: 'var(--primary)' }}>{profile.business_name || '—'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>{profile.business_type || 'Retail'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Registered On</label>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>{formatDate(profile.created_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Verification Status</label>
                <p style={{ fontSize: 14, color: profile.is_verified ? 'var(--success)' : 'var(--danger)' }}>
                  {profile.is_verified ? 'Verified' : 'Pending Review'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Account Settings</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Store Settings</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Manage store details, opening hours, and contact info</div>
              </button>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Payout Settings</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Bank accounts, withdrawal history, and thresholds</div>
              </button>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Notification Preferences</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Email and SMS notification settings for your store</div>
              </button>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--surface)'] transition-colors">
                <div style={{ fontWeight: 500 }}>Security Settings</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Password, 2FA, and login activity</div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="w-full text-left p-3 rounded hover:bg-['var(--danger)'] text-danger transition-colors">
                <div style={{ fontWeight: 500 }}>Delete Account</div>
                <div style={{ fontSize: 12, color: 'var(--danger)' }}>Permanently delete your vendor account and data</div>
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link to="/vendor" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  )
}