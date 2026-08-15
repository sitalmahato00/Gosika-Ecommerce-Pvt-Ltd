import React, { useEffect, useState } from 'react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const GENDERS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export default function AccountProfile() {
  const toast = useToast()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    preferencesText: '{}',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

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
          preferencesText: JSON.stringify(p.preferences ?? {}, null, 2),
        })
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const save = async (e) => {
    e.preventDefault()
    let preferences
    if (form.preferencesText.trim()) {
      try {
        preferences = JSON.parse(form.preferencesText)
      } catch {
        toast.error('Preferences must be valid JSON')
        return
      }
    }
    setSaving(true)
    try {
      await api.put('/customer/profile', {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        preferences,
      })
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
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
      <h2 style={{ fontSize: 17 }}>Profile</h2>
      <p className="muted text-sm">Update your personal information.</p>
      <form onSubmit={save}>
        <div className="form-row">
          <Input label="First name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <Input label="Last name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
        <div className="form-row">
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
          <Input label="Date of birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
        </div>
        <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </Select>
        <Textarea
          label="Preferences"
          rows={3}
          value={form.preferencesText}
          onChange={(e) => setForm({ ...form, preferencesText: e.target.value })}
          hint="Optional JSON object. Leave as {} if not used."
        />
        <Button type="submit" disabled={saving || loading}>
          {saving && <Spinner size={14} color="#fff" />} Save changes
        </Button>
      </form>
    </div>
  )
}
