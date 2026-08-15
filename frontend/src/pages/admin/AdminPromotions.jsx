import React, { useState } from 'react'
import { Megaphone, Plus, Search, Edit, Trash2, Image, Calendar, Tag } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_PROMOTIONS = [
  { id: 1, title: 'Dashain Mega Mela 2026', type: 'Seasonal Campaign', placement: 'Homepage Hero Banner', discount: 'Up to 50% Off', startDate: '2026-09-15', endDate: '2026-10-30', status: 'upcoming' },
  { id: 2, title: 'Tihar Electronics Flash Sale', type: 'Category Promo', placement: 'Electronics Strip', discount: 'Flat 20% Off Gadgets', startDate: '2026-11-01', endDate: '2026-11-10', status: 'upcoming' },
  { id: 3, title: 'Monsoon Monsoon Deals', type: 'Flash Deal', placement: 'Deals Carousel', discount: 'Free Shipping + 15% Off', startDate: '2026-08-01', endDate: '2026-08-31', status: 'active' },
]

export default function AdminPromotions() {
  const toast = useToast()
  const [promotions, setPromotions] = useState(SAMPLE_PROMOTIONS)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'Seasonal Campaign',
    placement: 'Homepage Hero Banner',
    discount: '',
    startDate: '',
    endDate: '',
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const newPromo = {
      id: promotions.length + 1,
      ...form,
      status: 'active',
    }
    setPromotions([newPromo, ...promotions])
    setCreateOpen(false)
    setForm({ title: '', type: 'Seasonal Campaign', placement: 'Homepage Hero Banner', discount: '', startDate: '', endDate: '' })
    toast.success('Campaign banner added')
  }

  const toggleStatus = (id) => {
    setPromotions(promotions.map((p) => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p))
    toast.info('Promotion status toggled')
  }

  const deletePromo = (id) => {
    setPromotions(promotions.filter((p) => p.id !== id))
    toast.success('Promotion deleted')
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Promotions & Campaign Banners</h1>
          <p>Manage marketplace featured marketing banners, seasonal festival promotions, and deal slots</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Create New Campaign
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Campaign Title</th>
              <th>Type</th>
              <th>Placement Area</th>
              <th>Discount Hook</th>
              <th>Run Duration</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="font-semibold text-sm text-ink">{p.title}</span>
                </td>
                <td className="muted text-sm">{p.type}</td>
                <td>
                  <span className="chip chip-sm">{p.placement}</span>
                </td>
                <td>
                  <span className="font-bold text-primary">{p.discount}</span>
                </td>
                <td className="muted text-xs">
                  {p.startDate} to {p.endDate}
                </td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-active' : p.status === 'upcoming' ? 'badge-info' : 'badge-draft'}`}>
                    {p.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className={`btn ${p.status === 'active' ? 'btn-outline' : 'btn-success'} btn-xs`}
                      onClick={() => toggleStatus(p.id)}
                    >
                      {p.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      className="btn btn-danger-outline btn-xs"
                      onClick={() => deletePromo(p.id)}
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

      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Campaign Promotion">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Campaign Title</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Tihar Grand Festive Sale"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Campaign Type</label>
                <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="Seasonal Campaign">Seasonal Festival Campaign</option>
                  <option value="Category Promo">Category Flash Promo</option>
                  <option value="Flash Deal">24-Hour Flash Deal</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Placement Slot</label>
                <select className="select" value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                  <option value="Homepage Hero Banner">Homepage Hero Banner</option>
                  <option value="Electronics Strip">Category Header Banner</option>
                  <option value="Deals Carousel">Flash Deals Carousel</option>
                  <option value="Checkout Promo Box">Checkout Promotional Strip</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Discount Headline</label>
              <input
                className="input"
                required
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="e.g. Flat 30% Off on Ethnic Wears"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Start Date</label>
                <input type="date" className="input" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">End Date</label>
                <input type="date" className="input" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Campaign</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
