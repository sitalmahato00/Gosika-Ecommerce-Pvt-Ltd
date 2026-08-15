import React, { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PackageOpen } from 'lucide-react'
import api from '../api/client'
import { useList } from '../hooks/useApi'
import StatusBadge from '../components/commerce/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import Pagination from '../components/ui/Pagination'
import { ProductCardSkeletonMini } from '../components/ui/Skeleton'
import { money, formatDateTime, apiImage, getProductImage } from '../utils/format'
import { PAYMENT_METHOD_LABELS, PAYMENT_BRAND_LOGOS } from '../utils/constants'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function OrderList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || ''

  const fetcher = useCallback(
    async (page) => {
      const res = await api.get('/orders', { params: { page, per_page: 10, ...(status ? { status } : {}) } })
      const payload = res.data
      const raw = payload?.data?.data ?? payload?.data ?? payload
      const pag = payload?.meta?.pagination ?? payload?.data?.meta?.pagination ?? payload?.meta ?? {}
      return {
        data: {
          data: Array.isArray(raw) ? raw : [],
          meta: {
            total: pag.total ?? pag.current ?? 0,
            current_page: pag.current_page ?? page,
            last_page: pag.last_page ?? pag.lastPage ?? 1,
            per_page: pag.per_page ?? 10,
          },
        },
      }
    },
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { pageSize: 10, deps: [status] })

  const changeStatus = (value) => {
    setSearchParams(value ? { status: value } : {}, { replace: true })
    setPage(1)
  }

  if (loading) {
    return (
      <div className="page-shell container">
        <h1 style={{ fontSize: 24 }}>My Orders</h1>
        <div className="flex flex-col gap-3 mt-2">
          {Array.from({ length: 3 }).map((_, i) => <ProductCardSkeletonMini key={i} />)}
        </div>
      </div>
    )
  }

  if (error) return <div className="page-shell container"><ErrorState onRetry={reload} /></div>

  if (!items.length) {
    return (
      <div className="page-shell container">
        <h1 style={{ fontSize: 24 }}>My Orders</h1>
        <div className="tabs" style={{ marginBottom: 8 }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`tab ${status === t.value ? 'active' : ''}`}
              onClick={() => changeStatus(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <EmptyState
          icon={PackageOpen}
          title={status ? 'No orders with this status' : 'No orders yet'}
          message="When you place an order, it will appear here with live tracking."
          action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>}
        />
      </div>
    )
  }

  return (
    <div className="page-shell container">
      <div className="flex items-center justify-between wrap gap-2">
        <h1 style={{ fontSize: 24 }}>My Orders</h1>
      </div>
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${status === t.value ? 'active' : ''}`}
            onClick={() => changeStatus(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 mt-2">
        {items.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card card-hover" style={{ display: 'block' }}>
            <div className="flex items-center justify-between wrap gap-2">
              <div>
                <div className="flex items-center gap-2 wrap">
                  <span className="font-bold">#{o.order_number}</span>
                  <StatusBadge status={o.status} />
                  {o.payment_status && <StatusBadge status={o.payment_status} />}
                </div>
                <div className="muted text-sm mt-1">{formatDateTime(o.placed_at)} · {o.items?.length} item(s)</div>
              </div>
              <div className="text-right">
                <div className="price-current" style={{ fontSize: 17 }}>{money(o.grand_total)}</div>
                <div className="muted text-xs flex items-center justify-end gap-1">{o.payment_method === 'esewa' && <img src={PAYMENT_BRAND_LOGOS.esewa} alt="eSewa" style={{ height: 12, width: 'auto' }} />}{PAYMENT_METHOD_LABELS[o.payment_method] || o.payment_method}</div>
              </div>
            </div>
              <div className="flex gap-2 mt-2" style={{ overflow: 'hidden' }}>
                {o.items.slice(0, 4).map((it) => (
                  <span key={it.id} className="thumb" style={{ width: 44, height: 44 }}>
                    <img
                      src={it.image ? apiImage(it.image) : getProductImage(it)}
                      alt=""
                      className="thumb-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                    />
                  </span>
                ))}
              </div>
          </Link>
        ))}
      </div>
      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
    </div>
  )
}
