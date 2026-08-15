import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Store, CheckCircle2, XCircle, Eye, Edit, Trash, Calendar, Upload, Folder, Heart, MapPin, Mail, Phone } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorStoreManagement() {
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendor/store').then((res) => {
      setStore(res.data.data)
    }).catch(() => {}).finally(() => setLoading(false))

    api.get('/vendor/products', { params: { per_page: 10 } }).then((res) => {
      setProducts(res.data.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8"><Skeleton height={200} /></div>
  }

  if (!store) return <EmptyState icon={Building2} title="No Store" message="Set up your store first." />

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Store Information */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Store Information</h3>
            <div className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>VS</span>
                </div>
                <div>
                  <p style={{ fontSize: 14, marginBottom: 2 }}>{store.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{store.description || 'Your Gosika storefront'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Business Type:</span>
                <span style={{ fontWeight: 500 }}>{store.business_type || 'Retail'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Tax ID:</span>
                <span style={{ fontWeight: 500 }}>{store.tax_id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Store Stats */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 12 }}>Store Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {store && Object.entries(store.stats).map(([key, value]) => (
                <div key={key} className="p-3 rounded text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
                  <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)' }}>{key}</div>
                </div>
              )) || (
                <div className="p-3 rounded text-center" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <Skeleton height={30} /><Skeleton height={16} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Products ({products.length})</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(products && products.map((p) => (
              <ProductCard key={p.id} product={p} showRating small />
            ))}
          ]}

          {(!products || products.length === 0) && (
            <EmptyState icon={Folder} title="No Products" message="Add your first product to start selling." />
          )}
        </div>
      </div>
    </div>
  )
}