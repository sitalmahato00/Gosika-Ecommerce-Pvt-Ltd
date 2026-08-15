import React, { useState } from 'react'
import { MapPin, Truck, Plus, Edit, CheckCircle2, DollarSign, Layers } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const INITIAL_ZONES = [
  { id: 1, name: 'Kathmandu Valley (Inner)', provinces: ['Bagmati (Kathmandu, Lalitpur, Bhaktapur)'], standardCharge: 100, expressCharge: 200, estimatedDays: '1–2 Days', status: 'active' },
  { id: 2, name: 'Bagmati Province (Outer)', provinces: ['Chitwan, Kavre, Nuwakot, Makwanpur, Sindhupalchok'], standardCharge: 150, expressCharge: 250, estimatedDays: '2–3 Days', status: 'active' },
  { id: 3, name: 'Koshi & Madhesh Provinces', provinces: ['Morang, Sunsari, Jhapa, Dhanusha, Parsa'], standardCharge: 180, expressCharge: 300, estimatedDays: '2–4 Days', status: 'active' },
  { id: 4, name: 'Gandaki & Lumbini Provinces', provinces: ['Kaski (Pokhara), Rupandehi (Butwal), Chitwan, Palpa'], standardCharge: 180, expressCharge: 300, estimatedDays: '2–4 Days', status: 'active' },
  { id: 5, name: 'Karnali & Sudurpashchim', provinces: ['Surkhet, Kailali, Kanchanpur, Jumla, Doti'], standardCharge: 220, expressCharge: 380, estimatedDays: '3–6 Days', status: 'active' },
]

export default function AdminShipping() {
  const toast = useToast()
  const [zones, setZones] = useState(INITIAL_ZONES)
  const [freeThreshold, setFreeThreshold] = useState(2000)
  const [editZone, setEditZone] = useState(null)
  const [chargeForm, setChargeForm] = useState({ standardCharge: 100, expressCharge: 200, estimatedDays: '1-2 Days' })

  const handleUpdate = (e) => {
    e.preventDefault()
    setZones(zones.map((z) => z.id === editZone.id ? { ...z, ...chargeForm } : z))
    toast.success(`Shipping rates for ${editZone.name} updated`)
    setEditZone(null)
  }

  const saveThreshold = (e) => {
    e.preventDefault()
    toast.success(`Free delivery threshold set to ${money(freeThreshold)}`)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Shipping & Delivery Settings</h1>
          <p>Configure province-wise shipping rates, courier zones, and nationwide delivery thresholds</p>
        </div>
      </div>

      {/* Free Shipping Configuration Card */}
      <div className="card mb-4" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)' }}>
        <form onSubmit={saveThreshold} className="flex items-center justify-between wrap gap-3">
          <div>
            <h3 style={{ fontSize: 16, margin: '0 0 4px', color: 'var(--primary-darker)' }}>
              Nationwide Free Delivery Threshold
            </h3>
            <p className="text-sm muted m-0">Orders above this subtotal qualify for free standard shipping across Nepal</p>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="input"
                style={{ width: 140, fontWeight: 700 }}
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(Number(e.target.value))}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Update Threshold</button>
          </div>
        </form>
      </div>

      {/* Delivery Zones Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color="var(--primary)" /> Nepal Regional Shipping Zones & Rates
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Covered Districts / Areas</th>
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
                    <span className="font-semibold text-ink text-sm">{z.name}</span>
                  </td>
                  <td className="muted text-xs" style={{ maxWidth: 300 }}>
                    {z.provinces.join(', ')}
                  </td>
                  <td>
                    <span className="font-bold text-primary">{money(z.standardCharge)}</span>
                  </td>
                  <td>
                    <span className="font-medium text-ink">{money(z.expressCharge)}</span>
                  </td>
                  <td className="text-sm muted">
                    {z.estimatedDays}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        setEditZone(z)
                        setChargeForm({
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

      {/* Edit Rates Modal */}
      {editZone && (
        <Modal open={!!editZone} onClose={() => setEditZone(null)} title={`Edit Shipping Rates: ${editZone.name}`}>
          <form onSubmit={handleUpdate}>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Standard Shipping Rate (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  required
                  value={chargeForm.standardCharge}
                  onChange={(e) => setChargeForm({ ...chargeForm, standardCharge: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="label">Express Shipping Rate (Rs.)</label>
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
              <label className="label">Estimated Delivery Timeline</label>
              <input
                className="input"
                required
                value={chargeForm.estimatedDays}
                onChange={(e) => setChargeForm({ ...chargeForm, estimatedDays: e.target.value })}
                placeholder="e.g. 2–3 Days"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setEditZone(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Rates</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
