import React, { useEffect, useState } from 'react'
import { UserCircle, Save, Phone, MapPin } from 'lucide-react'
import api from '../../api/client'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

const VEHICLE_TYPES = ['motorcycle', 'scooter', 'bicycle', 'e-bike', 'car', 'van', 'truck']

const label = (s) => (s || '')
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')

export default function DeliveryProfile() {
  const { rider, loading, error, reload } = useDelivery()
  const toast = useToast()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (rider) {
      setForm({
        name: rider.name || '',
        email: rider.email || '',
        phone: rider.phone || '',
        vehicle_type: rider.vehicle_type || '',
        vehicle_number: rider.vehicle_number || '',
        service_areas: Array.isArray(rider.service_areas) ? rider.service_areas.join(', ') : (rider.service_areas || ''),
        latitude: rider.latitude != null ? String(rider.latitude) : '',
        longitude: rider.longitude != null ? String(rider.longitude) : '',
      })
    }
  }, [rider])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    const lat = parseFloat(form.latitude)
    const lng = parseFloat(form.longitude)
    if (form.latitude !== '' && (isNaN(lat) || lat < -90 || lat > 90)) {
      toast.error('Latitude must be between -90 and 90.')
      return
    }
    if (form.longitude !== '' && (isNaN(lng) || lng < -180 || lng > 180)) {
      toast.error('Longitude must be between -180 and 180.')
      return
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      vehicle_type: form.vehicle_type,
      vehicle_number: form.vehicle_number.trim(),
      service_areas: form.service_areas
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      latitude: form.latitude === '' ? null : lat,
      longitude: form.longitude === '' ? null : lng,
    }
    setSaving(true)
    try {
      await api.post('/delivery-partner/profile', payload)
      await reload({ silent: true })
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={220} />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={() => reload()} />
  }

  if (!rider) return null

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Rider & Vehicle Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Update your personal and vehicle details.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card flex flex-col" style={{ padding: 20, margin: 0, gap: 16 }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="avatar" style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#16a34a,#0d9488)', color: '#fff' }}>
            <UserCircle size={24} />
          </span>
          <div>
            <div className="font-bold text-ink">{rider.name || 'Delivery Partner'}</div>
            <div className="muted text-xs">{rider.email || '—'}</div>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="form-group">
            <label className="label">Full Name <span className="req">*</span></label>
            <input className="input" required value={form.name || ''} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="label">Email <span className="req">*</span></label>
            <input className="input" type="email" required value={form.email || ''} onChange={set('email')} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Phone</label>
          <div className="flex items-center gap-2">
            <input className="input" value={form.phone || ''} disabled />
            <span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>
              Managed by hub
            </span>
          </div>
          <span className="muted text-xs mt-1 block flex items-center gap-1">
            <Phone size={11} /> Your phone number is verified and cannot be changed online — contact the dispatch hub.
          </span>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="form-group">
            <label className="label">Vehicle Type</label>
            <select className="select" value={form.vehicle_type || ''} onChange={set('vehicle_type')}>
              <option value="">Not specified</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>{label(v)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Vehicle Number</label>
            <input className="input" maxLength={30} placeholder="e.g. BA 4 KHA 1234" value={form.vehicle_number || ''} onChange={set('vehicle_number')} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Service Areas</label>
          <input
            className="input"
            placeholder="e.g. Kathmandu, Lalitpur, Bhaktapur"
            value={form.service_areas || ''}
            onChange={set('service_areas')}
          />
          <span className="muted text-xs mt-1 block">Separate areas with a comma.</span>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="form-group">
            <label className="label">Latitude</label>
            <input className="input" inputMode="decimal" placeholder="27.7172" value={form.latitude || ''} onChange={set('latitude')} />
          </div>
          <div className="form-group">
            <label className="label">Longitude</label>
            <input className="input" inputMode="decimal" placeholder="85.3240" value={form.longitude || ''} onChange={set('longitude')} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="submit" className="btn btn-primary flex items-center gap-1.5" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
