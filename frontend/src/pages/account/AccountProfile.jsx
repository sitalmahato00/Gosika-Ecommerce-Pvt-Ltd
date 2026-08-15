import React, { useEffect, useState } from 'react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function AccountProfile() {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/customer/profile').then((r) => {
      const p = r.data.data
      setForm({ name: p.name || '', email: p.email || '', phone: p.phone || '' })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/customer/profile', form)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 17 }}>Profile</h2>
      <p className="muted text-sm">Update your personal information.</p>
      <form onSubmit={save}>
        <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" disabled={saving || loading}>
          {saving && <Spinner size={14} color="#fff" />} Save changes
        </Button>
      </form>
    </div>
  )
}
