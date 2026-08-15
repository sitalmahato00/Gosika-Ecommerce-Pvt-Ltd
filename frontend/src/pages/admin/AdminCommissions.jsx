import React, { useState } from 'react'
import { Percent, Edit, Save, Plus, ArrowRight, DollarSign, Store, Tag, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_VENDOR_COMMISSIONS = [
  { id: 1, vendor: 'Kathmandu Handicrafts', category: 'Handicrafts & Art', rate: 8.5, totalSales: 320000, platformEarned: 27200, vendorEarned: 292800 },
  { id: 2, vendor: 'Himalaya Organics', category: 'Groceries & Organic', rate: 7.0, totalSales: 185000, platformEarned: 12950, vendorEarned: 172050 },
  { id: 3, vendor: 'Pokhara Tech Hub', category: 'Electronics & Gadgets', rate: 10.0, totalSales: 540000, platformEarned: 54000, vendorEarned: 486000 },
  { id: 4, vendor: 'Everest Apparel', category: 'Fashion & Clothing', rate: 12.0, totalSales: 210000, platformEarned: 25200, vendorEarned: 184800 },
  { id: 5, vendor: 'Koshi Spices', category: 'Food & Spices', rate: 8.0, totalSales: 95000, platformEarned: 7600, vendorEarned: 87400 },
]

const CATEGORY_RATES = [
  { category: 'Electronics & Mobiles', defaultRate: 10.0 },
  { category: 'Fashion & Clothing', defaultRate: 12.0 },
  { category: 'Groceries & Foods', defaultRate: 7.0 },
  { category: 'Handicrafts & Traditional', defaultRate: 8.5 },
  { category: 'Home & Kitchen', defaultRate: 10.0 },
]

export default function AdminCommissions() {
  const toast = useToast()
  const [defaultRate, setDefaultRate] = useState(10.0)
  const [vendorList, setVendorList] = useState(SAMPLE_VENDOR_COMMISSIONS)
  const [editTarget, setEditTarget] = useState(null)
  const [newRate, setNewRate] = useState(10.0)
  const [categoryRates, setCategoryRates] = useState(CATEGORY_RATES)

  const handleUpdateVendorRate = (e) => {
    e.preventDefault()
    setVendorList(vendorList.map((v) => v.id === editTarget.id ? { ...v, rate: parseFloat(newRate) } : v))
    toast.success(`Commission rate for ${editTarget.vendor} updated to ${newRate}%`)
    setEditTarget(null)
  }

  const totalPlatformEarned = vendorList.reduce((s, v) => s + v.platformEarned, 0)
  const totalVendorEarned = vendorList.reduce((s, v) => s + v.vendorEarned, 0)

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Commission Management</h1>
          <p>Configure platform commission rules, vendor overrides, and track platform earnings</p>
        </div>
      </div>

      {/* KPI Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon"><DollarSign size={20} /></div>
          <div className="kpi-value">{money(totalPlatformEarned)}</div>
          <div className="kpi-label">Platform Earnings</div>
          <div className="kpi-sub">From marketplace commissions</div>
        </div>

        <div className="kpi-card kpi-blue">
          <div className="kpi-icon"><Store size={20} /></div>
          <div className="kpi-value">{money(totalVendorEarned)}</div>
          <div className="kpi-label">Vendor Earnings</div>
          <div className="kpi-sub">Net payable to sellers</div>
        </div>

        <div className="kpi-card kpi-amber">
          <div className="kpi-icon"><Percent size={20} /></div>
          <div className="kpi-value">{defaultRate}%</div>
          <div className="kpi-label">Default Platform Rate</div>
          <div className="kpi-sub">Applied when no override exists</div>
        </div>
      </div>

      {/* Commission Calculation Example Box */}
      <div className="card" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, margin: '0 0 8px', color: 'var(--primary-darker)' }}>
          Commission Calculation Example
        </h3>
        <p className="text-sm flex items-center gap-1 wrap" style={{ margin: 0, color: 'var(--ink)' }}>
          Order Amount: <strong>Rs. 10,000</strong> · Commission Rate: <strong>10%</strong>
          <ArrowRight size={13} style={{ margin: '0 4px', color: 'var(--primary)' }} />
          Platform Fee: <strong style={{ color: 'var(--success)' }}>Rs. 1,000</strong> · Vendor Payable: <strong>Rs. 9,000</strong>
        </p>
      </div>

      {/* Category Standard Rates */}
      <div className="card mb-4" style={{ padding: 18 }}>
        <h3 style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag size={16} color="var(--primary)" /> Category-Specific Base Rates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {categoryRates.map((cr) => (
            <div key={cr.category} className="card" style={{ background: 'var(--bg)', padding: 12 }}>
              <div className="muted text-xs font-semibold">{cr.category}</div>
              <div className="font-extrabold text-lg mt-1 text-primary">{cr.defaultRate}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Overrides Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0 }}>Vendor Commission Overrides & Performance</h3>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Vendor / Store</th>
                <th>Primary Category</th>
                <th>Commission Rate</th>
                <th>Total GMV</th>
                <th>Platform Commission</th>
                <th>Vendor Net</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendorList.map((v) => (
                <tr key={v.id}>
                  <td>
                    <div className="font-semibold text-sm">{v.vendor}</div>
                  </td>
                  <td className="muted text-sm">{v.category}</td>
                  <td>
                    <span className="badge badge-primary font-bold">{v.rate}%</span>
                  </td>
                  <td>
                    <span className="font-semibold">{money(v.totalSales)}</span>
                  </td>
                  <td>
                    <span className="font-bold text-success">+{money(v.platformEarned)}</span>
                  </td>
                  <td>
                    <span className="font-medium text-ink">{money(v.vendorEarned)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => { setEditTarget(v); setNewRate(v.rate) }}
                    >
                      <Edit size={12} /> Edit Rate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rate Modal */}
      {editTarget && (
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit Commission: ${editTarget.vendor}`}>
          <form onSubmit={handleUpdateVendorRate}>
            <div className="form-group">
              <label className="label">Custom Commission Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                className="input"
                required
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
              />
              <span className="muted text-xs mt-1 block">Standard category default is {defaultRate}%.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setEditTarget(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Commission Rate</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
