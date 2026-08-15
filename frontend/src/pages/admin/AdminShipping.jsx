import React, { useState } from 'react'
import {
  MapPin, Truck, Plus, Edit, Trash2, Power, Layers
} from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const EMPTY_ZONE = { name: '', provinces: '', standard_charge: 150, express_charge: 250, estimated_days: 2 }
const EMPTY_COURIER = { name: '', type: 'Primary Fast Delivery Partner', coverage: '', contact_phone: '', endpoint: '' }

export default function AdminShipping() {
  const toast = useToast()
  const [zoneModal, setZoneModal] = useState(null)
  const [courierModal, setCourierModal] = useState(null)
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE)
  const [courierForm, setCourierForm] = useState(EMPTY_COURIER)
  const [busy, setBusy] = useState(false)

  const zonesFetcher = (page) => api.get('/admin/shipping/zones', { params: { page, per_page: 50 } })
  const couriersFetcher = (page) => api.get('/admin/shipping/couriers', { params: { page, per_page: 50 } })

  const {
    items: zones, meta: zonesMeta, page: zonesPage, setPage: setZonesPage,
    loading: zonesLoading, error: zonesError, reload: reloadZones,
  } = useList(zonesFetcher, { pageSize: 50 })

  const {
    items: couriers, meta: couriersMeta, page: couriersPage, setPage: setCouriersPage,
    loading: couriersLoading, error: couriersError, reload: reloadCouriers,
  } = useList(couriersFetcher, { pageSize: 50 })

  const openAddZone = () => {
    setZoneForm(EMPTY_ZONE)
    setZoneModal({ mode: 'add' })
  }

  const openEditZone = (z) => {
    setZoneForm({
      name: z.name || '',
      provinces: (z.provinces || []).join(', '),
      standard_charge: z.standard_charge != null ? Number(z.standard_charge) : 150,
      express_charge: z.express_charge != null ? Number(z.express_charge) : 250,
      estimated_days: z.estimated_days != null ? Number(z.estimated_days) : 2,
    })
    setZoneModal({ mode: 'edit', zone: z })
  }

  const saveZone = async (e) => {
    e.preventDefault()
    setBusy(true)
    const payload = {
      name: zoneForm.name.trim(),
      provinces: zoneForm.provinces.split(',').map((s) => s.trim()).filter(Boolean),
      standard_charge: Number(zoneForm.standard_charge),
      express_charge: Number(zoneForm.express_charge),
      estimated_days: Number(zoneForm.estimated_days),
      is_active: zoneModal?.mode === 'edit' ? zoneModal.zone.is_active : true,
    }
    try {
      if (zoneModal?.mode === 'edit') {
        await api.put(`/admin/shipping/zones/${zoneModal.zone.id}`, payload)
        toast.success(`Shipping rates for "${payload.name}" updated successfully`)
      } else {
        await api.post('/admin/shipping/zones', payload)
        toast.success(`Shipping zone "${payload.name}" created`)
      }
      setZoneModal(null)
      reloadZones()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const deleteZone = (z) => {
    if (!window.confirm(`Delete shipping zone "${z.name}"? This action cannot be undone.`)) return
    api.delete(`/admin/shipping/zones/${z.id}`)
      .then(() => {
        toast.success(`Shipping zone "${z.name}" deleted`)
        reloadZones()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const openAddCourier = () => {
    setCourierForm(EMPTY_COURIER)
    setCourierModal({ mode: 'add' })
  }

  const openEditCourier = (c) => {
    const parts = (c.description || '').split(' · ')
    const type = parts.shift() || 'Primary Fast Delivery Partner'
    setCourierForm({
      name: c.name || '',
      type,
      coverage: parts.join(' · '),
      contact_phone: c.contact_phone || '',
      endpoint: c.tracking_url_pattern || '',
    })
    setCourierModal({ mode: 'edit', courier: c })
  }

  const saveCourier = async (e) => {
    e.preventDefault()
    setBusy(true)
    const description = [courierForm.type, courierForm.coverage].filter(Boolean).join(' · ')
    const payload = {
      name: courierForm.name.trim(),
      contact_phone: courierForm.contact_phone.trim() || undefined,
      tracking_url_pattern: courierForm.endpoint.trim() || undefined,
      description: description || undefined,
      is_active: courierModal?.mode === 'edit' ? courierModal.courier.is_active : true,
    }
    try {
      if (courierModal?.mode === 'edit') {
        await api.put(`/admin/shipping/couriers/${courierModal.courier.id}`, payload)
        toast.success(`Delivery partner "${payload.name}" updated`)
      } else {
        await api.post('/admin/shipping/couriers', payload)
        toast.success(`Delivery partner "${payload.name}" integrated successfully`)
      }
      setCourierModal(null)
      reloadCouriers()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleCourierStatus = (c) => {
    api.put(`/admin/shipping/couriers/${c.id}`, { is_active: !c.is_active })
      .then(() => {
        toast.success(`Courier "${c.name}" ${c.is_active ? 'paused' : 'activated'}`)
        reloadCouriers()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const deleteCourier = (c) => {
    if (!window.confirm(`Remove delivery partner "${c.name}"?`)) return
    api.delete(`/admin/shipping/couriers/${c.id}`)
      .then(() => {
        toast.success(`Delivery partner "${c.name}" removed`)
        reloadCouriers()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const activeZonesCount = zones.filter((z) => z.is_active).length
  const pausedCouriersCount = couriers.filter((c) => !c.is_active).length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Shipping Zones & Logistics Governance
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure nationwide Nepal shipping rates, provincial delivery zones, and courier integrations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1"
            onClick={openAddCourier}
          >
            <Truck size={14} /> Add Delivery Partner
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={openAddZone}
          >
            <Plus size={14} /> Add Shipping Zone
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Delivery Zones</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <MapPin size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{activeZonesCount} Zones</div>
          <div className="muted text-xs mt-1">Live shipping rates</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Courier Partners</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{couriers.length} Partners</div>
          <div className="muted text-xs mt-1">{couriers.filter((c) => c.is_active).length} active</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Shipping Zones</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Layers size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{zones.length} Zones</div>
          <div className="muted text-xs mt-1">All regions configured</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Paused Couriers</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Power size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{pausedCouriersCount} Paused</div>
          <div className="muted text-xs mt-1">Not accepting dispatches</div>
        </div>
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <MapPin size={15} color="var(--primary)" /> Regional Shipping Zones & Rates (Nepal)
          </h3>
        </div>
        {zonesLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 14 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} />)}
          </div>
        ) : zonesError ? (
          <ErrorState onRetry={reloadZones} />
        ) : !zones.length ? (
          <EmptyState icon={MapPin} title="No shipping zones" message="Configure delivery zones and rates to enable nationwide shipping." />
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Covered Districts / Hubs</th>
                    <th>Standard Delivery</th>
                    <th>Express Delivery</th>
                    <th>Est. Delivery Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id}>
                      <td>
                        <span className="font-bold text-ink text-sm">{z.name}</span>
                      </td>
                      <td className="muted text-xs" style={{ maxWidth: 360 }}>
                        {(z.provinces || []).join(', ')}
                      </td>
                      <td>
                        <span className="font-bold text-primary">{money(z.standard_charge)}</span>
                      </td>
                      <td>
                        <span className="font-bold text-ink">{money(z.express_charge)}</span>
                      </td>
                      <td className="text-xs font-semibold text-ink">
                        {z.estimated_days != null ? `${z.estimated_days} day${z.estimated_days !== 1 ? 's' : ''}` : '—'}
                      </td>
                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            background: z.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: z.is_active ? '#10b981' : '#ef4444',
                            fontWeight: 800,
                            fontSize: 10,
                          }}
                        >
                          ● {z.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs flex items-center gap-1"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => openEditZone(z)}
                          >
                            <Edit size={12} /> Edit Rates
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger-outline btn-xs flex items-center gap-1"
                            onClick={() => deleteZone(z)}
                            title="Delete zone"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={zonesPage} lastPage={zonesMeta.last_page} total={zonesMeta.total} onChange={setZonesPage} />
          </>
        )}
      </div>

      <div className="card" style={{ padding: 18, margin: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Truck size={16} color="var(--primary)" /> Integrated Courier Partners (Nepal)
          </h3>
          <button
            type="button"
            className="btn btn-outline btn-xs flex items-center gap-1"
            onClick={openAddCourier}
          >
            <Plus size={12} /> Add Partner
          </button>
        </div>

        {couriersLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={120} />)}
          </div>
        ) : couriersError ? (
          <ErrorState onRetry={reloadCouriers} />
        ) : !couriers.length ? (
          <EmptyState icon={Truck} title="No courier partners" message="Integrate courier partners to enable delivery dispatch." />
        ) : (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {couriers.map((c) => {
                const isActive = c.is_active
                return (
                  <div
                    key={c.id}
                    className="card flex flex-col justify-between"
                    style={{
                      padding: 16,
                      margin: 0,
                      background: 'var(--bg)',
                      border: isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-ink">{c.name}</span>
                        <span
                          className="chip chip-sm"
                          style={{
                            background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#10b981' : '#ef4444',
                            fontWeight: 800,
                            fontSize: 10,
                          }}
                        >
                          ● {isActive ? 'Live' : 'Paused'}
                        </span>
                      </div>
                      <p className="muted text-xs m-0 mb-2">{c.description || '—'}</p>
                      <div className="text-xs muted mb-2">
                        Phone: <strong className="text-ink">{c.contact_phone || '—'}</strong>
                        {c.contact_email ? <> · Email: <strong className="text-ink">{c.contact_email}</strong></> : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                      <span className="font-mono text-primary font-bold text-xs truncate" style={{ maxWidth: 140 }}>
                        {c.tracking_url_pattern || c.code || 'No tracking endpoint'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          title={isActive ? 'Pause Partner' : 'Activate Partner'}
                          onClick={() => toggleCourierStatus(c)}
                        >
                          <Power size={12} color={isActive ? '#10b981' : '#94a3b8'} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => openEditCourier(c)}
                        >
                          <Edit size={11} /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => deleteCourier(c)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pagination page={couriersPage} lastPage={couriersMeta.last_page} total={couriersMeta.total} onChange={setCouriersPage} />
          </>
        )}
      </div>

      {zoneModal && (
        <Modal
          open={!!zoneModal}
          onClose={() => setZoneModal(null)}
          title={zoneModal.mode === 'edit' ? `Edit Shipping Rates: ${zoneModal.zone.name}` : 'Add New Nepal Shipping Zone'}
        >
          <form onSubmit={saveZone} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Zone Title <span className="req">*</span></label>
              <input
                className="input"
                required
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                placeholder="e.g. Terai Central Hub"
              />
            </div>
            <div className="form-group">
              <label className="label">Covered Districts (Comma-separated) <span className="req">*</span></label>
              <input
                className="input"
                required
                value={zoneForm.provinces}
                onChange={(e) => setZoneForm({ ...zoneForm, provinces: e.target.value })}
                placeholder="e.g. Siraha, Saptari, Dhanusha, Mahottari"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Standard Delivery (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  min={0}
                  value={zoneForm.standard_charge}
                  onChange={(e) => setZoneForm({ ...zoneForm, standard_charge: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Express Delivery (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  min={0}
                  value={zoneForm.express_charge}
                  onChange={(e) => setZoneForm({ ...zoneForm, express_charge: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Estimated Days (1-30) <span className="req">*</span></label>
              <input
                type="number"
                className="input"
                required
                min={1}
                max={30}
                value={zoneForm.estimated_days}
                onChange={(e) => setZoneForm({ ...zoneForm, estimated_days: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setZoneModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? 'Saving…' : zoneModal.mode === 'edit' ? 'Save Rates' : 'Create Zone'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {courierModal && (
        <Modal
          open={!!courierModal}
          onClose={() => setCourierModal(null)}
          title={courierModal.mode === 'edit' ? `Configure Partner: ${courierModal.courier.name}` : 'Integrate New Delivery Partner'}
        >
          <form onSubmit={saveCourier} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Courier / Logistics Company Name <span className="req">*</span></label>
              <input
                className="input"
                required
                value={courierForm.name}
                onChange={(e) => setCourierForm({ ...courierForm, name: e.target.value })}
                placeholder="e.g. Nepal Can Move Logistics"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Partner Category</label>
                <select
                  className="select"
                  value={courierForm.type}
                  onChange={(e) => setCourierForm({ ...courierForm, type: e.target.value })}
                >
                  <option value="Primary Fast Delivery Partner">Primary Fast Delivery Partner</option>
                  <option value="Government Registered Postal Network">Government Registered Postal Network</option>
                  <option value="Highway Commercial Freight">Highway Commercial Freight</option>
                  <option value="Same-day Local Dispatch">Same-day Local Dispatch</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Support Contact Phone <span className="req">*</span></label>
                <input
                  className="input"
                  required
                  value={courierForm.contact_phone}
                  onChange={(e) => setCourierForm({ ...courierForm, contact_phone: e.target.value })}
                  placeholder="+977 1-XXXXXXX"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Operational Coverage Districts & Corridors <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={2}
                required
                value={courierForm.coverage}
                onChange={(e) => setCourierForm({ ...courierForm, coverage: e.target.value })}
                placeholder="e.g. Western Corridor (Butwal, Bhairahawa, Nepalgunj, Dhangadhi, Mahendranagar)"
              />
            </div>

            <div className="form-group">
              <label className="label">API Webhook / Tracking Endpoint (Optional)</label>
              <input
                className="input"
                value={courierForm.endpoint}
                onChange={(e) => setCourierForm({ ...courierForm, endpoint: e.target.value })}
                placeholder="https://api.partner.com/v1/shipments"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setCourierModal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? 'Saving…' : courierModal.mode === 'edit' ? 'Save Changes' : 'Integrate Partner'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
