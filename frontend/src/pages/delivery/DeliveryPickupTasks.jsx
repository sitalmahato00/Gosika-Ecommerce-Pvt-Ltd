import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, PackageCheck, ChevronRight, RefreshCw } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

const PICKUP_STATUSES = ['assigned', 'accepted']

export default function DeliveryPickupTasks() {
  const toast = useToast()
  const assignments = useApi(() => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }))
  const [busyId, setBusyId] = useState(null)
  const [confirmAccept, setConfirmAccept] = useState(null)

  const items = useMemo(
    () => (assignments.data ?? []).filter((a) => PICKUP_STATUSES.includes(a.status)),
    [assignments.data],
  )

  const handleAccept = async () => {
    if (!confirmAccept) return
    setBusyId(confirmAccept.id)
    try {
      await api.post(`/delivery-partner/assignments/${confirmAccept.id}/accept`)
      toast.success('Delivery accepted. Proceed to pickup.')
      setConfirmAccept(null)
      assignments.reload({ silent: true })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const renderActions = (a) => {
    if (a.status === 'assigned') {
      return (
        <>
          <button
            type="button"
            className="btn btn-primary btn-xs flex items-center gap-1"
            onClick={() => setConfirmAccept(a)}
            disabled={busyId === a.id}
          >
            <Package size={12} /> {busyId === a.id ? 'Accepting…' : 'Accept'}
          </button>
          <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
            View <ChevronRight size={12} />
          </Link>
        </>
      )
    }
    return (
      <>
        <Link to={`/delivery/deliveries/${a.id}/pickup`} className="btn btn-primary btn-xs flex items-center gap-1">
          <PackageCheck size={12} /> Pick Up
        </Link>
        <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
          View <ChevronRight size={12} />
        </Link>
      </>
    )
  }

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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Pickup Tasks</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {items.length} assignment{items.length === 1 ? '' : 's'} waiting to be accepted and picked up from the vendor.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => assignments.reload({ silent: true })}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nothing to pick up right now"
          message="New assignments appear here first — accept one, then scan in at the pickup point to begin the route."
          action={<Link to="/delivery/deliveries" className="btn btn-outline btn-sm">View All Deliveries</Link>}
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
              date={formatDateTime(a.assigned_at || a.created_at)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAccept}
        onClose={() => setConfirmAccept(null)}
        onConfirm={handleAccept}
        loading={busyId === confirmAccept?.id}
        title="Accept this pickup?"
        confirmText="Accept Delivery"
        message="Accepting confirms you will collect this parcel from the vendor and deliver it to the customer."
      >
        {confirmAccept && (
          <div className="card" style={{ background: 'var(--bg)', padding: 12, margin: 0 }}>
            <div className="font-bold text-sm text-ink">{confirmAccept.vendor_order_number}</div>
            <div className="muted text-xs mt-0.5">
              {confirmAccept.recipient_name} · {money(confirmAccept.delivery_fee)}
            </div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}