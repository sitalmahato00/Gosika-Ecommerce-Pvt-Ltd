import React, { useCallback } from 'react'
import { Users, Mail, Phone, ShoppingBag, Clock } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { money, formatDate, initials } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'

export default function VendorCustomers() {
  const fetcher = useCallback(
    async (page) => api.get('/vendor/customers', { params: { page, per_page: 15 } }),
    [],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { pageSize: 15 })

  if (loading) {
    return (
      <div className="py-8">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={170} />)}
          </div>
        </div>
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  return (
    <div className="py-8">
      <div className="container">
        <div className="page-header" style={{ marginBottom: 20 }}>
          <div className="page-header-left">
            <h1>Customers</h1>
            <p>People who have purchased from your store</p>
          </div>
        </div>

        {items.length ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {items.map((c) => (
                <div key={c.id} className="card" style={{ padding: 18 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="avatar" style={{ width: 48, height: 48, flexShrink: 0 }}>
                      {initials(c.name)}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semibold line-clamp-1" style={{ fontSize: 14 }}>{c.name}</div>
                      <div className="muted text-xs flex items-center gap-1">
                        <Mail size={11} /> {c.email || '—'}
                      </div>
                      {c.phone && (
                        <div className="muted text-xs flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {c.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="kpi-card" style={{ padding: '12px 14px' }}>
                      <div className="muted text-xs flex items-center gap-1">
                        <ShoppingBag size={11} /> Orders
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{c.orders_count || 0}</div>
                    </div>
                    <div className="kpi-card" style={{ padding: '12px 14px' }}>
                      <div className="muted text-xs">Total Spent</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{money(c.total_spent)}</div>
                    </div>
                  </div>

                  <div className="muted text-xs flex items-center gap-1 mt-3" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <Clock size={11} /> Last order: {formatDate(c.last_order_at)}
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={Users} title="No Customers" message="No customers found yet. They will appear here once orders are placed." />
        )}
      </div>
    </div>
  )
}
