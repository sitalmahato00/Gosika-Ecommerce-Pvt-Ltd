import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, RefreshCw, ChevronRight } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

const RETURN_STATUSES = ['failed', 'returned_to_vendor']

export default function DeliveryReturns() {
  const toast = useToast()
  const assignments = useApi(() => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }))
  const [busyId, setBusyId] = useState(null)
  const [confirmReturn, setConfirmReturn] = useState(null)

  const items = useMemo(
    () => (assignments.data?.data ?? []).filter((a) => RETURN_STATUSES.includes(a.status)),
    [assignments.data],
  )

  const handleReturn = async () => {
    if (!confirmReturn) return
    setBusyId(confirmReturn.id)
    try {
      await api.post(`/delivery-partner/assignments/${confirmReturn.id}/return`)
      toast.success('Parcel marked as returned to vendor.')
      setConfirmReturn(null)
      assignments.reload({ silent: true })
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  const renderActions = (a) => (
    <>
      {a.status === 'failed' && (
        <button
          type="button"
          className="btn btn-primary btn-xs flex items-center gap-1"
          onClick={() => setConfirmReturn(a)}
          disabled={busyId === a.id}
        >
          <RotateCcw size={12} /> {busyId === a.id ? 'Returning…' : 'Return to Vendor'}
        </button>
      )}
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
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Returns</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {items.length} parcel{items.length === 1 ? '' : 's'} that are failed or on their way back to the vendor.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => assignments.reload({ silent: true })}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No returns right now"
          message="Failed deliveries show up here so you can return the parcel to the vendor and restore stock."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <DeliveryAssignmentCard
              key={a.id}
              assignment={a}
              to={`/delivery/deliveries/${a.id}`}
              actions={renderActions(a)}
              date={formatDateTime(a.failed_at || a.updated_at || a.created_at)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmReturn}
        onClose={() => setConfirmReturn(null)}
        onConfirm={handleReturn}
        loading={busyId === confirmReturn?.id}
        title="Return parcel to vendor?"
        confirmText="Confirm Return"
        message="Confirming returns the parcel to the vendor. Vendor stock will be restored automatically."
      >
        {confirmReturn && (
          <div className="card" style={{ background: 'var(--bg)', padding: 12, margin: 0 }}>
            <div className="font-bold text-sm text-ink">{confirmReturn.vendor_order_number}</div>
            <div className="muted text-xs mt-0.5">{confirmReturn.recipient_name} · {money(confirmReturn.delivery_fee)}</div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}