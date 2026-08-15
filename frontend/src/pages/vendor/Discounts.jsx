import React, { useEffect, useState } from 'react'
import { Loader2, Check, Trash, Eye, Edit, XCircle, Calendar, RefreshCw as ArrowPath, Plus } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function VendorDiscounts() {
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/discounts').then((res) => {
      setDiscounts(res.data.data?.discounts || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  const handleOpen = (discount) => {
    setForm({
      name: discount?.name || '',
      percentage: discount?.percentage || 0,
      product_ids: discount?.product_ids || [],
      start_date: discount?.start_date || '',
      end_date: discount?.end_date || '',
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm({ name: '', percentage: 0, product_ids: [], start_date: '', end_date: '' })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/discounts', form)
      toast.success('Discount created successfully')
      handleClose()
    } catch (e) {
      toast.error('Failed to create discount')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Discounts & Promotions</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Discounts List */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Active Discounts</h3>

            {discounts.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {discounts && discounts.map((d) => (
                  <div key={d.id} className="p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 500, color: '#2563eb' }}>{d.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Up to {d.percentage}% OFF</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>Valid: {d.start_date} - {d.end_date}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>Products: {d.product_ids.length}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Loader2} title="No Discounts" message="No active discounts." />
            )}
          </div>

          {/* Create Discount Form */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Create Discount</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Create price promotions for customers.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              <div>
                <label className="block text-sm font-medium mb-2">Discount Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Summer Sale 2024"
                  className="w-full rounded-sm border p-3"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Discount Percentage</label>
                  <input
                    value={form.percentage}
                    onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
                    type="number"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid From</label>
                  <input
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    type="date"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valid To</label>
                <input
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  type="date"
                  className="w-full rounded-sm border p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Apply To Products</label>
                <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>Select products this discount applies to:</p>
                <div className="grid grid-cols-2 gap-2" style={{ flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5].map((id) => (
                    <div key={id} className="p-2 rounded hover:bg-['var(--surface)'] transition-colors cursor-pointer" style={{ border: '1px solid #d1d5db' }}>
                      <span style={{ fontSize: 10, color: '#2563eb' }}>Product {id}</span>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">Create Discount</button>
                <button type="button" className="btn btn-outline ml-2" onClick={handleClose}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}