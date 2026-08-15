import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, Briefcase, CreditCard, Calendar, Check, XCircle, Clock, Eye, Edit, Trash, ArrowPath } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorDashboard() {
  const [kpis, setKpis] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/dashboard'),
      api.get('/vendor/orders', { params: { per_page: 5 } }),
      api.get('/vendor/products', { params: { per_page: 4 } }),
    ]).then(([d, o, p]) => {
      setKpis({
        totalSales: d.data?.total_sales || '0',
        totalOrders: d.data?.total_orders || '0',
        totalProducts: d.data?.total_products || '0',
        pendingOrders: d.data?.pending_orders || '0',
        revenueThisMonth: d.data?.revenue_this_month || '0',
        activeCustomers: d.data?.active_customers || '0',
      })
      setRecentOrders(o.data?.orders || [])
      setRecentProducts(p.data?.products || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        {[1,2,3,4].map((i) => <Skeleton height={120} key={i} />)}
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* KPI Cards */}
          {kpis && Object.entries(kpis).map(([key, value]) => (
            <div key={key} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{key}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
            </div>
          )) || (
            <div className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <Skeleton height={80} />
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent Orders</h3>
          <div className="grid grid-cols-2 gap-4">
            {(recentOrders && recentOrders.map((o) => (
              <div key={o.id} className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="flex items-center gap-2">
                  <img src={o.product_cover || '/placeholder-product.jpg'} alt={o.product_name} className="w-12 h-12 object-cover rounded-sm" />
                  <div>
                    <span style={{ fontWeight: 500 }}>{o.product_name}</span>
                    <span className="text-xs text-muted ml-2">×{o.quantity}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{o.status}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(o.created_at)}</p>
              </div>
            ))}
          )}
        </div>

        {/* Recent Products */}
        <div className="mt-6">
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent Products</h3>
          <div className="grid grid-cols-2 gap-4">
            {(recentProducts && recentProducts.map((p) => (
              <div key={p.id} className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <img
                  src={p.cover_image || p.images?.[0] || '/placeholder-product.jpg'}
                  alt={p.name}
                  className="w-12 h-12 object-cover rounded-sm"
                />
                <div>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>Rs. {p.price}</p>
                </div>
              </div>
            ))}
          )}
        </div>
      </div>
    </div>
  )
}