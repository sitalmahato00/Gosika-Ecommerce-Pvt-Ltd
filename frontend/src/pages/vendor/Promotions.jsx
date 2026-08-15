import React, { useEffect, useState } from 'react'
import { Loader2, Check, Trash, Eye, Edit, XCircle, Calendar, RefreshCw as ArrowPath, Plus } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

export default function VendorPromotions() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/promotions').then((res) => {
      setPromotions(res.data.data?.promotions || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!promotions.length) {
    return (
      <div className="p-8 text-center">
        <div className="es-icon"><Loader2 size={48} /></div>
        <h3 style={{ fontSize: 20, marginBottom: 8 }}>No Promotions</h3>
        <p style={{ color: '#6b7280', marginBottom: 12 }}>Create your first promotion.</p>
        <button className="btn btn-primary">Create Promotion</button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Promotions</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Promotions List */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Active Promotions</h3>

            {promotions.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {promotions && promotions.map((p) => (
                  <div key={p.id} className="p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 500, color: '#2563eb' }}>{p.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626' }}>Up to {p.max_discount}% Off</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>Valid: {p.start_date} - {p.end_date}</p>
                    <p style={{ fontSize: 11, color: '#6b7280' }}>{p.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Loader2} title="No Promotions" message="No active promotions." />
            )}
          </div>

          {/* Create Promotion Form */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Create Promotion</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>Special offers and deals for customers.</p>
            <form>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Promotion Name</label>
                  <input
                    placeholder="Flash Sale"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Discount (%)</label>
                  <input
                    type="number"
                    className="w-full rounded-sm border p-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input type="date" className="w-full rounded-sm border p-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input type="date" className="w-full rounded-sm border p-3" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Promotion Type</label>
                <select className="w-full rounded-sm border p-3">
                  <option value="percentage">Percentage Discount</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="buy_one_get_one">Buy One Get One</option>
                </select>
              </div>

              <div style={{ textAlign: 'right' }}>
                <button className="btn btn-primary mt-3">Create Promotion</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}