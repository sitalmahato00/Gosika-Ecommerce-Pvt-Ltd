import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Package, CheckCircle2, RotateCcw, ChevronRight, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { listFetcher, completionDate } from '../../utils/delivery'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

const TABS = [
  { key: '', label: 'All' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'failed', label: 'Failed' },
  { key: 'returned_to_vendor', label: 'Returned' },
]

export default function DeliveryDeliveries() {
  const toast = useToast()
  const [tab, setTab] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const { items, meta, page, setPage, loading, error, reload } = useList(
    (p, size) => listFetcher('/delivery-partner/assignments', tab ? { status: tab } : {})(p, size),
    { deps: [tab], pageSize: 10 },
  )

  const doAction = async (type, a) => {
    setBusyId(a.id)
    try {
      await api.post(`/delivery-partner/assignments/${a.id}/${type}`)
      toast.success(type === 'accept' ? 'Delivery accepted. Proceed to pickup.' : 'Delivery marked as returned to vendor.')
      setConfirm(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const renderActions = (a) => {
    switch (a.status) {
      case 'assigned':
        return (
          <>
            <button
              type="button"
              className="btn btn-primary btn-xs flex items-center gap-1"
              onClick={() => setConfirm({ type: 'accept', assignment: a })}
              disabled={busyId === a.id}
            >
              <Package size={12} /> {busyId === a.id ? 'Accepting…' : 'Accept'}
            </button>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </>
        )
      case 'accepted':
        return (
          <>
            <Link to={`/delivery/deliveries/${a.id}/pickup`} className="btn btn-primary btn-xs flex items-center gap-1">
              <Package size={12} /> Pick Up
            </Link>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </>
        )
      case 'picked_up':
        return (
          <>
            <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-primary btn-xs flex items-center gap-1">
              Start Delivery
            </Link>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </>
        )
      case 'out_for_delivery':
        return (
          <>
            <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-success btn-xs flex items-center gap-1">
              <CheckCircle2 size={12} /> Confirm Delivery
            </Link>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </>
        )
      case 'failed':
        return (
          <>
            <button
              type="button"
              className="btn btn-outline btn-xs flex items-center gap-1"
              onClick={() => setConfirm({ type: 'return', assignment: a })}
              disabled={busyId === a.id}
            >
              <RotateCcw size={12} /> {busyId === a.id ? 'Returning…' : 'Return to Vendor'}
            </button>
            <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
              View <ChevronRight size={12} />
            </Link>
          </>
        )
      default:
        return (
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
            View <ChevronRight size={12} />
          </Link>
        )
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Assigned Deliveries</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {meta.total} assignment{meta.total === 1 ? '' : 's'} · Filter by status to focus your queue.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => reload()}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.key || 'all'}
            type="button"
            onClick={() => setTab(t.key)}
            className={`chip ${tab === t.key ? 'chip-primary' : ''}`}
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
      ) : items.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={tab ? `No ${TABS.find((t) => t.key === tab)?.label || ''} deliveries` : 'No deliveries yet'}
          message="When the dispatch hub assigns a delivery to you, it will appear here with a status you can act on."
          action={
            tab !== '' ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setTab('')}>
                Show All Deliveries
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <DeliveryAssignmentCard
              key={a.id}
              assignment={a}
              to={`/delivery/deliveries/${a.id}`}
              actions={renderActions(a)}
              showPhone
              date={formatDateTime(completionDate(a) || a.created_at)}
            />
          ))}
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doAction(confirm.type, confirm.assignment)}
        loading={busyId === confirm?.assignment?.id}
        title={confirm?.type === 'accept' ? 'Accept this delivery?' : 'Return parcel to vendor?'}
        confirmText={confirm?.type === 'accept' ? 'Accept Delivery' : 'Confirm Return'}
        message={
          confirm?.type === 'accept'
            ? 'Accepting confirms you will pick up this parcel from the vendor and deliver it to the customer.'
            : 'Confirm the parcel is being returned to the vendor. Stock will be restored automatically.'
        }
      >
        {confirm && (
          <div className="card" style={{ background: 'var(--bg)', padding: 12, margin: 0 }}>
            <div className="font-bold text-sm text-ink">{confirm.assignment.vendor_order_number}</div>
            <div className="muted text-xs mt-0.5">
              {confirm.assignment.recipient_name} · {money(confirm.assignment.delivery_fee)}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}
