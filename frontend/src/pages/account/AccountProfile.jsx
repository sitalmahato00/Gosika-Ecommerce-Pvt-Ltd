import React, { useEffect, useState, useRef } from 'react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { errorMessage, apiImage } from '../../utils/format'

const GENDERS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export default function AccountProfile() {
  const toast = useToast()
  const { updateUser } = useAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    email: '',
    avatar: null,
  })
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/customer/profile')
      .then((r) => {
        const p = r.data.data || {}
        setForm({
          first_name: p.first_name || '',
          last_name: p.last_name || '',
          phone: p.phone || '',
          gender: p.gender || '',
          date_of_birth: p.date_of_birth || '',
          email: p.user?.email || p.email || '',
          avatar: p.avatar || null,
        })
        if (p.avatar) {
          updateUser({ avatar: p.avatar })
        }
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/customer/profile', {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
      })
      updateUser({
        first_name: form.first_name,
        last_name: form.last_name,
        name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
      })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    setAvatarUploading(true)
    try {
      const res = await api.post('/customer/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newAvatar = res.data?.data?.avatar
      setForm((prev) => ({ ...prev, avatar: newAvatar }))
      updateUser({ avatar: newAvatar })
      toast.success('Profile picture updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('New passwords do not match')
      return
    }
    setPasswordSaving(true)
    try {
      await api.put('/customer/profile/password', passwordForm)
      toast.success('Password updated successfully')
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <Skeleton height={22} width={140} />
        <div className="flex flex-col gap-3 mt-3">
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
          <Skeleton height={40} />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={load} />
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 17, fontWeight: 700 }}>Profile</h2>
      <p className="muted text-sm mb-4">Update your personal information.</p>
      
      {/* Profile Picture Section */}
      <div className="flex items-center gap-4 mb-4" style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleAvatarChange} 
        />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold', overflow: 'hidden', border: '2px solid var(--border)' }}>
          {form.avatar ? (
            <img src={apiImage(form.avatar)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (form.first_name || 'U')[0].toUpperCase()
          )}
        </div>
        <div>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
          >
            {avatarUploading ? 'Uploading…' : 'Change Picture'}
          </button>
          <div className="muted text-xs mt-1">JPG, GIF or PNG. Max size of 2MB.</div>
        </div>
      </div>

      <form onSubmit={save}>
        <div className="form-row">
          <Input label="First name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        
        <div className="form-row">
          <Input label="Email address" type="email" value={form.email || 'customer@gosika.com'} disabled hint="Email cannot be changed." />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
        </div>
        
        <div className="form-row">
          <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </Select>
        </div>
        
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" disabled={saving || loading}>
            {saving && <Spinner size={14} color="#fff" />} Save changes
          </Button>
        </div>
      </form>

      {/* Security Section */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Security</h3>
        <p className="muted text-sm mb-4">Update your password to keep your account secure.</p>
        <form onSubmit={handlePasswordChange}>
          <div className="form-row">
            <Input 
              label="Current Password" 
              type="password" 
              required 
              value={passwordForm.current_password} 
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} 
            />
            <Input 
              label="New Password" 
              type="password" 
              required 
              value={passwordForm.password} 
              onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} 
            />
          </div>
          <div className="form-row">
            <Input 
              label="Confirm New Password" 
              type="password" 
              required 
              value={passwordForm.password_confirmation} 
              onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={passwordSaving}>
            {passwordSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
