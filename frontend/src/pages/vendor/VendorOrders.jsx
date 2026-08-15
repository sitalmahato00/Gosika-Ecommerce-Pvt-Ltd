import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime } from '../../utils/format'

const STATUS_FILTERS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup', color: 'warning' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'purple' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'danger' },
]

export default function VendorOrders() {
  const [status, setStatus] = useState('')

  const fetcher = useCallback(
    async (page) => api.get('/vendor/orders', {
      params: { page, per_page: 15, status: status || undefined }
    }),
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [status],
    pageSize: 15,
  })

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Orders</h1>
          <p>Manage customer orders from your stores</p>
        </div>
        {meta.total > 0 && (
          <span className="muted text-sm">{meta.total} order{meta.total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Status tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.value}
            className={`tab ${status === s.value ? 'active' : ''}`}
            onClick={() => setStatus(s.value)}
            aria-pressed={status === s.value}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={68} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={ShoppingBag}
          title={status ? `No ${status.replace(/_/g, ' ')} orders` : 'No orders yet'}
          message={status ? 'Try a different filter to find orders.' : 'Customer orders from your stores will appear here.'}
          action={
            status ? (
              <button className="btn btn-outline" onClick={() => setStatus('')}>View All Orders</button>
            ) : null
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap hide-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Store</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/vendor/orders/${o.id}`}
                        style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}
                      >
                        {o.vendor_order_number}
                      </Link>
                    </td>
                    <td className="muted text-sm">{o.store_name || '—'}</td>
                    <td className="muted text-sm">{o.items?.length || 0} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="font-semibold">{money(o.grand_total)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><StatusBadge status={o.delivery_status} /></td>
                    <td className="muted text-sm">{formatDateTime(o.created_at)}</td>
                    <td>
                      <Link to={`/vendor/orders/${o.id}`} className="btn btn-soft btn-sm">
                        Manage <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="show-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((o) => (
              <Link
                key={o.id}
                to={`/vendor/orders/${o.id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit', padding: 14, display: 'block' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 14, color: 'var(--primary)' }}>
                      {o.vendor_order_number}
                    </div>
                    {o.store_name && (
                      <div className="muted text-xs" style={{ marginTop: 2 }}>{o.store_name}</div>
                    )}
                  </div>
                  <span className="font-bold" style={{ fontSize: 15 }}>{money(o.grand_total)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusBadge status={o.status} />
                  {o.delivery_status && <StatusBadge status={o.delivery_status} />}
                  <span className="muted text-xs" style={{ marginLeft: 'auto' }}>{formatDateTime(o.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
