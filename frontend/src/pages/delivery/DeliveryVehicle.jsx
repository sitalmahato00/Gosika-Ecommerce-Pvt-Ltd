import React from 'react'
import { Bike, ShieldCheck, Info } from 'lucide-react'
import api from '../../api/client'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'

const label = (s) => (s || '')
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')

const Row = ({ labelText, value }) => (
  <div className="flex items-center justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
    <span className="muted text-sm">{labelText}</span>
    <span className="font-bold text-sm text-ink text-right">{value || '—'}</span>
  </div>
)

export default function DeliveryVehicle() {
  const { rider, loading, error, reload } = useDelivery()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = {
      name: rider?.name || '',
      email: rider?.email || '',
      vehicle_type: fd.get('vehicle_type') || null,
      vehicle_number: fd.get('vehicle_number') || null,
      service_areas: rider?.service_areas || [],
    }
    try {
      await api.post('/delivery-partner/profile', payload)
      await reload({ silent: true })
      toast.success('Vehicle details updated.')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={160} />
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Vehicle Details</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Vehicle information shown to the hub while dispatching.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, margin: 0 }}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 pb-3 mb-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="avatar" style={{ width: 40, height: 40, background: '#eef2ff', color: '#4f46e5' }}>
              <Bike size={20} />
            </span>
            <div>
              <div className="font-bold text-ink">{label(rider.vehicle_type) || 'Vehicle not set'}</div>
              <div className="muted text-xs">{rider.vehicle_number || 'No number plate recorded'}</div>
            </div>
          </div>

          <div>
            <Row labelText="Vehicle Type" value={label(rider.vehicle_type)} />
            <Row labelText="Vehicle Number" value={rider.vehicle_number} />
            <Row labelText="Service Areas" value={Array.isArray(rider.service_areas) && rider.service_areas.length ? rider.service_areas.join(', ') : '—'} />
            <Row labelText="Current Location" value={rider.latitude != null && rider.longitude != null ? `${Number(rider.latitude).toFixed(4)}, ${Number(rider.longitude).toFixed(4)}` : 'Not shared'} />
          </div>

          <div className="flex items-center gap-2 pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="muted text-xs flex items-center gap-1">
              <Info size={12} /> Vehicle type and number plate are managed from your profile.
            </span>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 18, margin: 0, background: '#f0fdf4', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="font-bold text-sm" style={{ color: '#15803d' }}>Insurance & permits</div>
            <p className="muted text-xs mt-1" style={{ margin: 0, color: '#166534' }}>
              All GOSIKA delivery partners ride insured and compliant vehicles. Update your insurance or permit details with the dispatch hub.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
