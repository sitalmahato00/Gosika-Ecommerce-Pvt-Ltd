import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navigation, CheckCircle2, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'

const DELIVERY_STATUSES = ['picked_up', 'out_for_delivery']

export default function DeliveryTasks() {
  const toast = useToast()
  const assignments = useApi(() => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }))

  const items = useMemo(
    () => (assignments.data ?? []).filter((a) => DELIVERY_STATUSES.includes(a.status)),
    [assignments.data],
  )

  const renderActions = (a) => (
    <>
      <Link
        to={`/delivery/deliveries/${a.id}/deliver`}
        className={`btn btn-${a.status === 'out_for_delivery' ? 'success' : 'primary'} btn-xs flex items-center gap-1`}
      >
        {a.status === 'out_for_delivery' ? <CheckCircle2 size={12} /> : <Navigation size={12} />}
        {a.status === 'out_for_delivery' ? 'Confirm Delivery' : 'Start Delivery'}
      </Link>
      <Link to={`/delivery/deliveries/${a.id}/failure`} className="btn btn-outline btn-xs flex items-center gap-1">
        <AlertTriangle size={12} /> Mark Failed
      </Link>
      <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
        View <ChevronRight size={12} />
      </Link>
    </>
  )

  if (assignments.loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={220} height={28} />
        </div>
        <div className="card" style={{ padding: 16, margin: 0 }}>
          <Skeleton height={90} />
        </div>
      </div>
    )
  }

  if (assignments.error) {
    return <ErrorState message={errorMessage(assignments.error)} onRetry={() => assignments.reload()} />
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Delivery Tasks</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {items.length} parcel{items.length === 1 ? '' : 's'} in transit that need to be handed over to customers.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => assignments.reload({ silent: true })}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="No deliveries in transit"
          message="Once you pick up a parcel you can start delivering it straight from here, or confirm the delivery once you are at the customer's door."
          action={<Link to="/delivery/pickups" className="btn btn-outline btn-sm">View Pickup Tasks</Link>}
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
              date={formatDateTime(a.out_for_delivery_at || a.picked_up_at || a.created_at)}
            />
          ))}
        </div>
      )}
    </div>
  )
}