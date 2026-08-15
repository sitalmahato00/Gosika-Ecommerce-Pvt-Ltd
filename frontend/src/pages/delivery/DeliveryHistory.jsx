import React, { useMemo, useState } from 'react'
import { RefreshCw, Clock, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useList } from '../../hooks/useApi'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { listFetcher, completionDate } from '../../utils/delivery'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
  { key: 'returned_to_vendor', label: 'Returned' },
]

export default function DeliveryHistory() {
  const [tab, setTab] = useState('all')
  const { items, meta, page, setPage, loading, error, reload } = useList(
    (p, size) => listFetcher('/delivery-partner/history')(p, size),
    { deps: [], pageSize: 12 },
  )

  const filtered = useMemo(() => (tab === 'all' ? items : items.filter((a) => a.status === tab)), [items, tab])

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Delivery History</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {meta.total} completed assignment{meta.total === 1 ? '' : 's'} across your time as a GOSIKA rider.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => reload()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="chip"
            style={{
              whiteSpace: 'nowrap',
              fontWeight: 800,
              fontSize: 11,
              cursor: 'pointer',
              border: tab === t.key ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: tab === t.key ? 'var(--primary-50)' : '#fff',
              color: tab === t.key ? 'var(--primary)' : 'var(--muted)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ padding: 16, margin: 0 }}>
              <Skeleton height={14} width="40%" style={{ marginBottom: 12 }} />
              <Skeleton height={60} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => reload()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No completed deliveries yet"
          message="Deliveries you complete — delivered, failed, or returned — will be recorded here."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View Assigned Deliveries</Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((a) => (
            <DeliveryAssignmentCard
              key={a.id}
              assignment={a}
              to={`/delivery/deliveries/${a.id}`}
              date={formatDateTime(completionDate(a) || a.updated_at)}
              actions={
                a.status === 'failed' ? (
                  <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline btn-xs flex items-center gap-1">
                    Return to Vendor <ChevronRight size={12} />
                  </Link>
                ) : undefined
              }
            />
          ))}
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}
    </div>
  )
}
