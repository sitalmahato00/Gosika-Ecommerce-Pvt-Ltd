import React, { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Phone, Lock, Bell, Globe,
  Camera, Save, Eye, EyeOff, Shield
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { apiImage, errorMessage } from '../../utils/format'

const TABS = [
  { id: 'profile', label: 'Profile Information', icon: User },
  { id: 'security', label: 'Security & Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

export default function VendorProfileSettings() {
  const toast = useToast()
  const { user, updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    avatar: null,
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    order_notifications: true,
    product_notifications: true,
    payment_notifications: true,
    marketing_emails: false,
  })

  const [appPrefs, setAppPrefs] = useState({
    language: 'en',
    timezone: 'Asia/Kathmandu',
    date_format: 'YYYY-MM-DD',
    currency: 'NPR',
  })

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company_name: user?.company_name || '',
      avatar: user?.avatar || null,
    })
  }, [user])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)
    setAvatarUploading(true)

    try {
      const res = await api.post('/vendor/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newAvatar = res.data?.data?.avatar
      setProfileForm((prev) => ({ ...prev, avatar: newAvatar }))
      updateUser({ avatar: newAvatar })
      toast.success('Profile picture updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setAvatarUploading(false)
    }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile', {
        name: profileForm.name,
        phone: profileForm.phone,
        company_name: profileForm.company_name,
      })
      updateUser({
        name: profileForm.name,
        phone: profileForm.phone,
        company_name: profileForm.company_name,
      })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordForm.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    try {
      await api.put('/vendor/profile/password', passwordForm)
      toast.success('Password updated successfully')
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile/notifications', notificationPrefs)
      toast.success('Notification preferences saved')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/vendor/profile/preferences', appPrefs)
      toast.success('Preferences saved successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'V'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', paddingBottom: 50 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
          Profile Settings
        </h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Manage your vendor account settings and preferences
        </p>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', overflowX: 'auto' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: '1 1 auto',
                  minWidth: 'fit-content',
                  padding: '16px 24px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {activeTab === 'profile' && (
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Personal Information
              </h3>
              <p className="muted text-sm">
                Update your personal details and profile picture
              </p>
            </div>

            <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid var(--border)' }}>
              <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 12 }}>
                Profile Picture
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: profileForm.avatar ? 'transparent' : 'linear-gradient(135deg, #ff5500 0%, #ff8800 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                    overflow: 'hidden',
                    border: '3px solid var(--border)',
                    position: 'relative',
                  }}
                >
                  {profileForm.avatar ? (
                    <img
                      src={apiImage(profileForm.avatar)}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(profileForm.name || profileForm.company_name)
                  )}
                  {avatarUploading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Spinner size={20} color="#fff" />
                    </div>
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    <Camera size={14} />
                    {avatarUploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                  <p className="muted text-xs" style={{ marginTop: 6 }}>
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="form-row">
              <Input
                label="Full Name"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
              <Input
                label="Company Name"
                value={profileForm.company_name}
                onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                placeholder="Your business name"
              />
            </div>

            <div className="form-row">
              <Input
                label="Email Address"
                type="email"
                value={profileForm.email}
                disabled
                hint="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <Save size={14} />}
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={savePassword}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Change Password
              </h3>
              <p className="muted text-sm">
                Update your password to keep your account secure
              </p>
            </div>

            <div className="form-row">
              <div style={{ position: 'relative' }}>
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 38,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-row">
              <div style={{ position: 'relative' }}>
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="Enter new password"
                  hint="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 38,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 38,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Shield size={16} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Password Requirements</span>
              </div>
              <ul style={{ fontSize: 13, color: 'var(--muted)', margin: 0, paddingLeft: 20 }}>
                <li>At least 8 characters long</li>
                <li>Include uppercase and lowercase letters</li>
                <li>Include at least one number</li>
              </ul>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <Lock size={14} />}
                Update Password
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <form onSubmit={saveNotifications}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Notification Preferences
              </h3>
              <p className="muted text-sm">
                Choose what notifications you want to receive
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'email_notifications', label: 'Email Notifications', description: 'Receive email notifications for important updates' },
                { key: 'order_notifications', label: 'Order Notifications', description: 'Get notified about new orders and order status changes' },
                { key: 'product_notifications', label: 'Product Notifications', description: 'Updates about product approvals and inventory alerts' },
                { key: 'payment_notifications', label: 'Payment Notifications', description: 'Notifications about payments, payouts, and settlements' },
                { key: 'marketing_emails', label: 'Marketing Emails', description: 'Promotional content and platform updates' },
              ].map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div className="muted text-xs">{item.description}</div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={notificationPrefs[item.key]}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          [item.key]: e.target.checked,
                        })
                      }
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </label>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <Bell size={14} />}
                Save Preferences
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'preferences' && (
          <form onSubmit={savePreferences}>
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                Application Preferences
              </h3>
              <p className="muted text-sm">
                Customize your application experience
              </p>
            </div>

            <div className="form-row">
              <div>
                <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 8 }}>
                  Language
                </label>
                <select
                  value={appPrefs.language}
                  onChange={(e) => setAppPrefs({ ...appPrefs, language: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14,
                  }}
                >
                  <option value="en">English</option>
                  <option value="ne">Nepali (नेपाली)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 8 }}>
                  Timezone
                </label>
                <select
                  value={appPrefs.timezone}
                  onChange={(e) => setAppPrefs({ ...appPrefs, timezone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14,
                  }}
                >
                  <option value="Asia/Kathmandu">Asia/Kathmandu (NPT +5:45)</option>
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 8 }}>
                  Date Format
                </label>
                <select
                  value={appPrefs.date_format}
                  onChange={(e) => setAppPrefs({ ...appPrefs, date_format: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14,
                  }}
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2024-03-15)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (15/03/2024)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (03/15/2024)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-bold" style={{ display: 'block', marginBottom: 8 }}>
                  Currency
                </label>
                <select
                  value={appPrefs.currency}
                  onChange={(e) => setAppPrefs({ ...appPrefs, currency: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14,
                  }}
                >
                  <option value="NPR">NPR (रु)</option>
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <Button type="submit" disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : <Globe size={14} />}
                Save Preferences
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
