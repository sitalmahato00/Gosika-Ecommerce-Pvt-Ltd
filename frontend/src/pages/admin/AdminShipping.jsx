import React, { useState } from 'react'
import {
  MapPin, Truck, Plus, Edit, CheckCircle2, DollarSign, Layers,
  Globe, ShieldCheck, Clock, Settings, ArrowRight, Zap, RefreshCw,
  SlidersHorizontal, Trash2, Power, Check, ExternalLink
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const INITIAL_ZONES = [
  { id: 1, name: 'Kathmandu Valley (Inner)', provinces: ['Bagmati (Kathmandu, Lalitpur, Bhaktapur)'], standardCharge: 100, expressCharge: 200, estimatedDays: '1–2 Days', status: 'active' },
  { id: 2, name: 'Bagmati Province (Outer)', provinces: ['Chitwan, Kavre, Nuwakot, Makwanpur, Sindhupalchok'], standardCharge: 150, expressCharge: 250, estimatedDays: '2–3 Days', status: 'active' },
  { id: 3, name: 'Koshi & Madhesh Provinces', provinces: ['Morang (Biratnagar), Sunsari (Dharan/Itahari), Jhapa, Dhanusha, Parsa'], standardCharge: 180, expressCharge: 300, estimatedDays: '2–4 Days', status: 'active' },
  { id: 4, name: 'Gandaki & Lumbini Provinces', provinces: ['Kaski (Pokhara), Rupandehi (Butwal), Chitwan, Palpa'], standardCharge: 180, expressCharge: 300, estimatedDays: '2–4 Days', status: 'active' },
  { id: 5, name: 'Karnali & Sudurpashchim', provinces: ['Surkhet, Kailali (Dhangadhi), Kanchanpur, Jumla, Doti'], standardCharge: 220, expressCharge: 380, estimatedDays: '3–6 Days', status: 'active' },
]

const INITIAL_COURIERS = [
  {
    id: 1,
    name: 'Pathao Logistics Express',
    type: 'Primary Fast Delivery Partner',
    coverage: 'Kathmandu Valley, Pokhara, Biratnagar, Butwal, Chitwan',
    status: 'active',
    api_status: 'Connected & Synced',
    endpoint: 'https://api.pathao.com/v2/gosika',
    contact_phone: '+977 1-4422334',
  },
  {
    id: 2,
    name: 'Nepal Post EMS (Dak Sewa)',
    type: 'Government Registered Postal Network',
    coverage: 'Remote & Mountain Districts (Karnali, Mustang, Solukhumbu)',
    status: 'active',
    api_status: 'Connected & Synced',
    endpoint: 'https://api.nepalpost.gov.np/ems',
    contact_phone: '+977 1-4221144',
  },
  {
    id: 3,
    name: 'Sundar Courier Express',
    type: 'Highway Commercial Freight',
    coverage: 'East-West Mahendra Highway Corridor (Jhapa to Banke)',
    status: 'active',
    api_status: 'Connected & Synced',
    endpoint: 'https://api.sundarcourier.com/dispatch',
    contact_phone: '+977 21-523456',
  },
  {
    id: 4,
    name: 'GOSIKA In-City Rapid Fleet',
    type: 'Same-day Local Dispatch',
    coverage: 'Biratnagar Central & Kathmandu Urban Core',
    status: 'active',
    api_status: 'Direct Internal Fleet',
    endpoint: 'Internal Telemetry API',
    contact_phone: '+977 980-1234560',
  },
]

export default function AdminShipping() {
  const toast = useToast()
  const [zones, setZones] = useState(INITIAL_ZONES)
  const [couriers, setCouriers] = useState(INITIAL_COURIERS)
  const [freeThreshold, setFreeThreshold] = useState(2000)
  const [editZone, setEditZone] = useState(null)
  const [addZoneOpen, setAddZoneOpen] = useState(false)
  const [addPartnerOpen, setAddPartnerOpen] = useState(false)
  const [editPartner, setEditPartner] = useState(null)
  const [chargeForm, setChargeForm] = useState({ name: '', provinces: '', standardCharge: 150, expressCharge: 250, estimatedDays: '2–3 Days' })
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    type: 'Primary Fast Delivery Partner',
    coverage: '',
    endpoint: '',
    contact_phone: '',
  })

  const handleUpdateZone = (e) => {
    e.preventDefault()
    setZones(zones.map((z) => z.id === editZone.id ? { ...z, ...chargeForm } : z))
    toast.success(`Shipping rates for "${editZone.name}" updated successfully`)
    setEditZone(null)
  }

  const handleAddZone = (e) => {
    e.preventDefault()
    const newZ = {
      id: Date.now(),
      name: chargeForm.name,
      provinces: chargeForm.provinces.split(',').map(s => s.trim()),
      standardCharge: Number(chargeForm.standardCharge),
      expressCharge: Number(chargeForm.expressCharge),
      estimatedDays: chargeForm.estimatedDays,
      status: 'active',
    }
    setZones([...zones, newZ])
    toast.success(`Shipping zone "${chargeForm.name}" created`)
    setAddZoneOpen(false)
  }

  const handleSavePartner = (e) => {
    e.preventDefault()
    if (editPartner) {
      setCouriers(couriers.map((c) => c.id === editPartner.id ? { ...c, ...partnerForm } : c))
      toast.success(`Delivery partner "${partnerForm.name}" updated`)
      setEditPartner(null)
    } else {
      const newP = {
        id: Date.now(),
        ...partnerForm,
        status: 'active',
        api_status: 'Connected & Synced',
      }
      setCouriers([...couriers, newP])
      toast.success(`Delivery partner "${partnerForm.name}" integrated successfully`)
      setAddPartnerOpen(false)
    }
  }

  const togglePartnerStatus = (id) => {
    setCouriers(couriers.map((c) => c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    toast.success('Courier partner status updated')
  }

  const deletePartner = (id, name) => {
    if (!window.confirm(`Remove delivery partner "${name}"?`)) return
    setCouriers(couriers.filter((c) => c.id !== id))
    toast.success(`Delivery partner "${name}" removed`)
  }

  const saveThreshold = (e) => {
    e.preventDefault()
    toast.success(`Free delivery threshold updated to ${money(freeThreshold)}`)
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Shipping Zones & Logistics Governance
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure nationwide Nepal shipping rates, provincial delivery zones, courier API syncs, and free shipping thresholds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm flex items-center gap-1"
            onClick={() => {
              setPartnerForm({ name: '', type: 'Primary Fast Delivery Partner', coverage: '', endpoint: '', contact_phone: '' })
              setAddPartnerOpen(true)
            }}
          >
            <Truck size={14} /> Add Delivery Partner
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => {
              setChargeForm({ name: '', provinces: '', standardCharge: 150, expressCharge: 250, estimatedDays: '2–3 Days' })
              setAddZoneOpen(true)
            }}
          >
            <Plus size={14} /> Add Shipping Zone
          </button>
        </div>
      </div>

      {/* 4 Logistics KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Delivery Zones</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <MapPin size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{zones.length} Zones</div>
          <div className="muted text-xs mt-1">77 districts covered</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Courier Partners</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{couriers.length} Active Partners</div>
          <div className="muted text-xs mt-1">Live webhook telemetry</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Free Delivery Threshold</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(freeThreshold)}</div>
          <div className="muted text-xs mt-1">Orders qualify for free freight</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Avg Delivery Speed</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Zap size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>2.4 Days SLA</div>
          <div className="muted text-xs mt-1">98.4% on-time fulfillment</div>
        </div>
      </div>

      {/* Free Shipping Configuration Card */}
      <div className="card" style={{ background: 'var(--bg)', padding: '16px 20px', margin: 0 }}>
        <form onSubmit={saveThreshold} className="flex items-center justify-between wrap gap-3">
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px', color: 'var(--ink)' }}>
              Nationwide Free Delivery Threshold
            </h3>
            <p className="text-xs muted m-0">Orders above this cart value qualify automatically for free standard shipping across Nepal</p>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="input"
                style={{ width: 140, fontWeight: 800, height: 36 }}
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Update Threshold</button>
          </div>
        </form>
      </div>

      {/* Delivery Zones Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <MapPin size={15} color="var(--primary)" /> Regional Shipping Zones & Rates (Nepal)
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Covered Districts / Hubs</th>
                <th>Standard Delivery</th>
                <th>Express Delivery</th>
                <th>Est. Delivery Time</th>
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
                    {z.provinces.join(', ')}
                  </td>
                  <td>
                    <span className="font-bold text-primary">{money(z.standardCharge)}</span>
                  </td>
                  <td>
                    <span className="font-bold text-ink">{money(z.expressCharge)}</span>
                  </td>
                  <td className="text-xs font-semibold text-ink">
                    {z.estimatedDays}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => {
                        setEditZone(z)
                        setChargeForm({
                          name: z.name,
                          provinces: z.provinces.join(', '),
                          standardCharge: z.standardCharge,
                          expressCharge: z.expressCharge,
                          estimatedDays: z.estimatedDays,
                        })
                      }}
                    >
                      <Edit size={12} /> Edit Rates
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integrated Courier Partners Grid with Add / Edit Partner Controls */}
      <div className="card" style={{ padding: 18, margin: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Truck size={16} color="var(--primary)" /> Integrated Courier Partners (Nepal)
          </h3>
          <button
            type="button"
            className="btn btn-outline btn-xs flex items-center gap-1"
            onClick={() => {
              setPartnerForm({ name: '', type: 'Primary Fast Delivery Partner', coverage: '', endpoint: '', contact_phone: '' })
              setAddPartnerOpen(true)
            }}
          >
            <Plus size={12} /> Add Partner
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {couriers.map((c) => {
            const isActive = c.status === 'active'
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
                  <p className="muted text-xs m-0 mb-2">{c.coverage}</p>
                  <div className="text-xs muted mb-2">
                    Phone: <strong className="text-ink">{c.contact_phone || '+977 1-4000000'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="font-mono text-primary font-bold text-xs truncate" style={{ maxWidth: 140 }}>
                    {c.api_status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      title={isActive ? 'Pause Partner' : 'Activate Partner'}
                      onClick={() => togglePartnerStatus(c.id)}
                    >
                      <Power size={12} color={isActive ? '#10b981' : '#94a3b8'} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        setEditPartner(c)
                        setPartnerForm({
                          name: c.name,
                          type: c.type,
                          coverage: c.coverage,
                          endpoint: c.endpoint || '',
                          contact_phone: c.contact_phone || '',
                        })
                      }}
                    >
                      <Edit size={11} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-xs"
                      onClick={() => deletePartner(c.id, c.name)}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Edit Rates Modal */}
      {editZone && (
        <Modal open={!!editZone} onClose={() => setEditZone(null)} title={`Edit Shipping Rates: ${editZone.name}`}>
          <form onSubmit={handleUpdateZone} className="flex flex-col gap-3">
            <div className="form-row">
              <div className="form-group">
                <label className="label">Standard Shipping Rate (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={chargeForm.standardCharge}
                  onChange={(e) => setChargeForm({ ...chargeForm, standardCharge: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Express Shipping Rate (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  className="input"
                  required
                  value={chargeForm.expressCharge}
                  onChange={(e) => setChargeForm({ ...chargeForm, expressCharge: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Estimated Delivery Timeline <span className="req">*</span></label>
              <input
                className="input"
                required
                value={chargeForm.estimatedDays}
                onChange={(e) => setChargeForm({ ...chargeForm, estimatedDays: e.target.value })}
                placeholder="e.g. 2–3 Days"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditZone(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Save Rates</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Zone Modal */}
      {addZoneOpen && (
        <Modal open={addZoneOpen} onClose={() => setAddZoneOpen(false)} title="Add New Nepal Shipping Zone">
          <form onSubmit={handleAddZone} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Zone Title <span className="req">*</span></label>
              <input
                className="input"
                required
                value={chargeForm.name}
                onChange={(e) => setChargeForm({ ...chargeForm, name: e.target.value })}
                placeholder="e.g. Terai Central Hub"
              />
            </div>
            <div className="form-group">
              <label className="label">Covered Districts (Comma-separated) <span className="req">*</span></label>
              <input
                className="input"
                required
                value={chargeForm.provinces}
                onChange={(e) => setChargeForm({ ...chargeForm, provinces: e.target.value })}
                placeholder="e.g. Siraha, Saptari, Dhanusha, Mahottari"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Standard Delivery (NPR)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={chargeForm.standardCharge}
                  onChange={(e) => setChargeForm({ ...chargeForm, standardCharge: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Express Delivery (NPR)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={chargeForm.expressCharge}
                  onChange={(e) => setChargeForm({ ...chargeForm, expressCharge: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Estimated Days</label>
              <input
                className="input"
                required
                value={chargeForm.estimatedDays}
                onChange={(e) => setChargeForm({ ...chargeForm, estimatedDays: e.target.value })}
                placeholder="e.g. 2–4 Days"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAddZoneOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Create Zone</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add / Edit Delivery Partner Modal */}
      {(addPartnerOpen || editPartner) && (
        <Modal
          open={addPartnerOpen || !!editPartner}
          onClose={() => { setAddPartnerOpen(false); setEditPartner(null); }}
          title={editPartner ? `Configure Partner: ${editPartner.name}` : 'Integrate New Delivery Partner'}
        >
          <form onSubmit={handleSavePartner} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Courier / Logistics Company Name <span className="req">*</span></label>
              <input
                className="input"
                required
                value={partnerForm.name}
                onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                placeholder="e.g. Nepal Can Move Logistics"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Partner Category</label>
                <select
                  className="select"
                  value={partnerForm.type}
                  onChange={(e) => setPartnerForm({ ...partnerForm, type: e.target.value })}
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
                  value={partnerForm.contact_phone}
                  onChange={(e) => setPartnerForm({ ...partnerForm, contact_phone: e.target.value })}
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
                value={partnerForm.coverage}
                onChange={(e) => setPartnerForm({ ...partnerForm, coverage: e.target.value })}
                placeholder="e.g. Western Corridor (Butwal, Bhairahawa, Nepalgunj, Dhangadhi, Mahendranagar)"
              />
            </div>

            <div className="form-group">
              <label className="label">API Webhook / Tracking Endpoint (Optional)</label>
              <input
                className="input"
                value={partnerForm.endpoint}
                onChange={(e) => setPartnerForm({ ...partnerForm, endpoint: e.target.value })}
                placeholder="https://api.partner.com/v1/shipments"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => { setAddPartnerOpen(false); setEditPartner(null); }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                {editPartner ? 'Save Changes' : 'Integrate Partner'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
