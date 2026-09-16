import React, { useState, useEffect, useRef } from 'react'
import {
  User, Shield, Bell, Settings as SettingsIcon, Save,
  Mail, Phone, MapPin, Calendar, Check, Eye, EyeOff,
  Smartphone, Lock, Key, AlertTriangle, CheckCircle2, Camera
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage, formatDate, apiImage } from '../../utils/format'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
]

export default function AdminProfile() {
  const { user, reloadUser } = useAuth()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Profile form
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: null,
  })

  // Security form
  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Notifications form
  const [notifications, setNotifications] = useState({
    email_orders: true,
    email_vendors: true,
    email_system: true,
    push_orders: true,
    push_vendors: false,
    push_system: true,
  })

  // Preferences form
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Asia/Kathmandu',
    date_format: 'Y-m-d',
    items_per_page: '25',
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        avatar: user.avatar || null,
      })
    }
  }, [user])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)
    setAvatarUploading(true)

    try {
      const res = await api.post('/admin/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newAvatar = res.data?.data?.avatar
      setProfile((prev) => ({ ...prev, avatar: newAvatar }))
      await reloadUser()
      toast.success('Profile picture updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/profile', profile)
      await reloadUser()
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleSecuritySave = async (e) => {
    e.preventDefault()
    if (security.new_password !== security.confirm_password) {
      toast.error('New password and confirmation do not match')
      return
    }
    if (security.new_password.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      await api.put('/admin/password', {
        current_password: security.current_password,
        password: security.new_password,
        password_confirmation: security.confirm_password,
      })
      setSecurity({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      toast.success('Password changed successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/notifications/preferences', notifications)
      toast.success('Notification preferences saved')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/admin/preferences', preferences)
      toast.success('Preferences saved successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <form onSubmit={handleProfileSave} className="card" style={{ padding: 24 }}>
            <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div style={{ position: 'relative' }}>
                <span
                  className="avatar"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: profile.avatar ? 'transparent' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                    overflow: 'hidden',
                    border: '3px solid var(--border)',
                  }}
                >
                  {profile.avatar ? (
                    <img
                      src={apiImage(profile.avatar)}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </span>
                {avatarUploading && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                    }}
                  >
                    <Spinner size={20} color="#fff" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    border: '2px solid #fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!avatarUploading) e.currentTarget.style.transform = 'scale(1.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <Camera size={14} color="#fff" />
                </button>
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {user?.name || 'Admin User'}
                </h2>
                <div className="muted text-xs flex items-center gap-2 mt-1">
                  <Mail size={12} /> {user?.email || 'admin@gosika.com.np'}
                </div>
                {user?.created_at && (
                  <div className="muted text-xs flex items-center gap-2 mt-1">
                    <Calendar size={12} /> Member since {formatDate(user.created_at)}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <Input
                label="Full Name"
                required
                icon={User}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
              />
              <Input
                label="Email Address"
                type="email"
                required
                icon={Mail}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="admin@gosika.com.np"
              />
            </div>

            <div className="form-row">
              <Input
                label="Phone Number"
                icon={Phone}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
              <Input
                label="Address"
                icon={MapPin}
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Kathmandu, Nepal"
              />
            </div>

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <><Save size={14} /> Save Profile</>}
              </Button>
            </div>
          </form>
        )

      case 'security':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <form onSubmit={handleSecuritySave} className="card" style={{ padding: 24 }}>
              <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <Lock size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Change Password</h3>
              </div>

              <div className="form-group">
                <label className="label">Current Password <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPasswords.current ? 'text' : 'password'}
                    required
                    value={security.current_password}
                    onChange={(e) => setSecurity({ ...security, current_password: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--muted)',
                    }}
                  >
                    {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">New Password <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={security.new_password}
                      onChange={(e) => setSecurity({ ...security, new_password: e.target.value })}
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                      }}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password <span className="req">*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      value={security.confirm_password}
                      onChange={(e) => setSecurity({ ...security, confirm_password: e.target.value })}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--muted)',
                      }}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {security.new_password && security.confirm_password && (
                <div
                  className="flex items-center gap-2 p-3 mb-3"
                  style={{
                    background: security.new_password === security.confirm_password ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${security.new_password === security.confirm_password ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: security.new_password === security.confirm_password ? '#16a34a' : '#dc2626',
                  }}
                >
                  {security.new_password === security.confirm_password ? (
                    <><CheckCircle2 size={14} /> Passwords match</>
                  ) : (
                    <><AlertTriangle size={14} /> Passwords do not match</>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? <Spinner size={14} color="#fff" /> : <><Key size={14} /> Change Password</>}
                </Button>
              </div>
            </form>

            <div className="card" style={{ padding: 24 }}>
              <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <Smartphone size={18} color="var(--primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Two-Factor Authentication</h3>
              </div>

              <div className="flex items-center justify-between p-4" style={{ background: 'var(--bg)', borderRadius: 8 }}>
                <div>
                  <div className="font-bold text-sm">Enable 2FA</div>
                  <div className="muted text-xs mt-1">Add an extra layer of security to your account</div>
                </div>
                <span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <form onSubmit={handleNotificationsSave} className="card" style={{ padding: 24 }}>
            <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <Bell size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Notification Preferences</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Email Notifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'email_orders', label: 'Order Updates', desc: 'Get notified about new orders and status changes' },
                    { key: 'email_vendors', label: 'Vendor Activity', desc: 'Notifications about vendor approvals, products, and KYC' },
                    { key: 'email_system', label: 'System Alerts', desc: 'Critical system notifications and security alerts' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3"
                      style={{ background: 'var(--bg)', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <div>
                        <div className="font-bold text-sm">{item.label}</div>
                        <div className="muted text-xs mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Push Notifications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { key: 'push_orders', label: 'Order Alerts', desc: 'Real-time alerts for urgent order events' },
                    { key: 'push_vendors', label: 'Vendor Alerts', desc: 'Instant notifications for vendor actions requiring attention' },
                    { key: 'push_system', label: 'System Notifications', desc: 'Critical system messages and warnings' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3"
                      style={{ background: 'var(--bg)', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <div>
                        <div className="font-bold text-sm">{item.label}</div>
                        <div className="muted text-xs mt-0.5">{item.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <><Save size={14} /> Save Preferences</>}
              </Button>
            </div>
          </form>
        )

      case 'preferences':
        return (
          <form onSubmit={handlePreferencesSave} className="card" style={{ padding: 24 }}>
            <div className="flex items-center gap-2 pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <SettingsIcon size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Application Preferences</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Language</label>
                <select
                  className="select"
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="ne">नेपाली (Nepali)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Timezone</label>
                <select
                  className="select"
                  value={preferences.timezone}
                  onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu (NPT +05:45)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                  <option value="UTC">UTC (+00:00)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Date Format</label>
                <select
                  className="select"
                  value={preferences.date_format}
                  onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })}
                >
                  <option value="Y-m-d">YYYY-MM-DD (2024-12-24)</option>
                  <option value="d/m/Y">DD/MM/YYYY (24/12/2024)</option>
                  <option value="m/d/Y">MM/DD/YYYY (12/24/2024)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Items Per Page</label>
                <select
                  className="select"
                  value={preferences.items_per_page}
                  onChange={(e) => setPreferences({ ...preferences, items_per_page: e.target.value })}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <><Save size={14} /> Save Preferences</>}
              </Button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
            Profile Settings
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Manage your account settings, security, and preferences
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#fff',
          padding: 6,
          borderRadius: 12,
          border: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--ink)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}
