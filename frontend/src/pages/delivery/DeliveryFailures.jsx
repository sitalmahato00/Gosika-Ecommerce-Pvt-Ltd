import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, ChevronRight, RotateCcw } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { listFetcher } from '../../utils/delivery'
import DeliveryAssignmentCard from '../../components/delivery/DeliveryAssignmentCard'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryFailures() {
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [confirmReturn, setConfirmReturn] = useState(null)

  const { items, meta, page, setPage, loading, error, reload } = useList(
    (p, size) => listFetcher('/delivery-partner/assignments', { status: 'failed' })(p, size),
    { deps: [], pageSize: 10 },
  )

  const handleReturn = async () => {
    if (!confirmReturn) return
    setBusyId(confirmReturn.id)
    try {
      await api.post(`/delivery-partner/assignments/${confirmReturn.id}/return`)
      toast.success('Parcel marked as returned to vendor.')
      setConfirmReturn(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Failed Deliveries</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {meta.total} failed delivery{meta.total === 1 ? '' : 's'} · Mark them as returned to close the loop.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => reload()}>
          <RefreshCw size={14} /> Refresh
        </button>
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
          icon={AlertTriangle}
          title="No failed deliveries"
          message="Deliveries you could not complete are collected here with the failure reason so nothing slips through."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DeliveryAssignmentCard
                assignment={a}
                to={`/delivery/deliveries/${a.id}`}
                actions={
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-xs flex items-center gap-1"
                      onClick={() => setConfirmReturn(a)}
                      disabled={busyId === a.id}
                    >
                      <RotateCcw size={12} /> {busyId === a.id ? 'Returning…' : 'Return to Vendor'}
                    </button>
                    <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-xs flex items-center gap-1">
                      View <ChevronRight size={12} />
                    </Link>
                  </>
                }
                date={formatDateTime(a.failed_at || a.created_at)}
              />
              {a.failure_reason && (
                <div className="card" style={{ padding: '10px 14px', margin: 0, background: '#fef2f2', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <span className="text-xs flex items-center gap-1.5" style={{ color: '#b91c1c' }}>
                    <AlertTriangle size={13} /> Failure reason: <strong>{a.failure_reason}</strong>
                  </span>
                </div>
              )}
            </div>
          ))}
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
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
            <div className="font-bold text-sm text-ink">
              {confirmReturn.vendor_order_number} · {money(confirmReturn.delivery_fee)}
            </div>
            <div className="muted text-xs mt-0.5">{confirmReturn.recipient_name}</div>
          </div>
        )}
      </ConfirmDialog>
    </div>
  )
}