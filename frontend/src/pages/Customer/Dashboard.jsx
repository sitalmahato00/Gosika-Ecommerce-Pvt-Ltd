import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, Briefcase, CreditCard, Calendar, Check, XCircle, Clock, Eye, Edit, Trash, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate } from '../../utils/format'
import ProductCard from '../../components/commerce/ProductCard'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function CustomerDashboard() {
  const [kpis, setKpis] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentCustomers, setRecentCustomers] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/vendor/me'),
      api.get('/vendor/orders', { params: { per_page: 5 } }),
      api.get('/vendor/customers', { params: { per_page: 5 } }),
      api.get('/vendor/reviews', { params: { per_page: 3 } }),
    ]).then(([v, o, c, r]) => {
      setKpis({
        totalSales: '1,254,367',
        totalOrders: '3,421',
        totalProducts: '1,247',
        totalCustomers: '892',
        pendingOrders: '24',
        lowStock: '12',
      })
      setRecentOrders(o.data.data?.orders || [])
      setRecentCustomers(c.data.data?.customers || [])
      setRecentReviews(r.data.data?.reviews || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-6">
        <Skeleton height={120} /><Skeleton height={120} />
        <Skeleton height={120} /><Skeleton height={120} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* KPI Cards */}
          {kpis && Object.entries(kpis).map(([key, value]) => (
            <div key={key} className="p-4 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{key}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
            </div>
          )) || (
            <Skeleton height={80} />
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
                    <span className="text-xs text-muted">×{o.quantity}</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{o.status}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(o.created_at)}</p>
              </div>
            ))}
          )}
        </div>

        {/* Recent Customers */}
        <div className="mt-6">
          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent Customers</h3>
          <div className="grid grid-cols-2 gap-4">
            {(recentCustomers && recentCustomers.map((c) => (
              <div key={c.id} className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <img src="/placeholder-avatar.jpg" alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span className="text-xs text-muted">Orders: {c.orders}</span>
                </div>
              </div>
            ))}
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="mt-6">
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent Reviews</h3>
        <div className="grid grid-cols-2 gap-4">
          {(recentReviews && recentReviews.map((r) => (
            <div key={r.id} className="p-3 rounded" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <div className="flex items-center gap-2">
                <img src="/placeholder-avatar.jpg" alt={r.customer_name} className="w-10 h-10 rounded-full object-cover" />
                <span style={{ fontWeight: 500 }}>{r.customer_name}</span>
              </div>
              <p style={{ fontSize: 12, marginBottom: 4, color: 'var(--muted)' }}>{r.rating > 0 ? Array(r.rating).fill(1).map((_, i) => <i className="text-primary text-xs" key={i} />) : ''}</p>
              <p style={{ fontSize: 12, marginBottom: 4, color: 'var(--muted)' }}>{r.review_text?.substring(0, 50)}...</p>
              <p style={{ fontSize: 10, color: 'var(--muted)' }}>{formatDate(r.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}