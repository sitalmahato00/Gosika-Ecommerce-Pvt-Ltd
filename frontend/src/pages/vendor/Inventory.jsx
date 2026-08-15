import React, { useEffect, useState } from 'react'
import { Box, Check, Trash, Eye, Edit, XCircle, Clock, Calendar, RefreshCw as ArrowPath, Plus } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/inventory').then((res) => {
      setItems(res.data.data?.items || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}><Skeleton height={200} /><Skeleton height={200} /></div>
  }

  if (!items.length) return <EmptyState icon={Box} title="No Inventory Items" message="Add products to track inventory." />

  return (
    <div className="py-8">
      <div className="container">
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>Inventory</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items && items.map((item) => (
            <div key={item.id} className="p-4 rounded" style={{ border: '1px solid #d1d5db', background: '#1f2937' }}>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={item.cover_image || '/placeholder-product.jpg'}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-sm"
                />
                <div>
                  <h4 style={{ fontSize: 14, marginBottom: 2 }}>{item.name}</h4>
                  <p style={{ fontSize: 12, color: '#6b7280' }}>SKU: {item.sku || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Stock</span>
                  <span style={{ fontWeight: 500, color: item.stock <= 10 ? '#dc2626' : '#2563eb' }}>{item.stock}</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Sold</span>
                  <span style={{ fontWeight: 500 }}>{item.total_sold || 0}</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Low Stock Alert</span>
                  <span style={{ fontWeight: 500, color: item.stock <= 5 ? '#dc2626' : '#6b7280' }}>{item.stock <= 5 ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>Reorder Level</span>
                  <span style={{ fontWeight: 500 }}>{item.reorder_level || 10}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#d1d5db' }}>
                <span style={{ fontSize: 10, color: '#6b7280' }}>Last Updated: {formatDate(item.updated_at)}</span>
              </div>
            </div>
          ))}

          {!items.length && (
            <EmptyState icon={Plus} title="No Inventory Items" message="Add products to start tracking inventory." />
          )}
        </div>
      </div>
    </div>
  )
}