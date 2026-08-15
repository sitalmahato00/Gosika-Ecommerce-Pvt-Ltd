import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Tag, CheckCircle2, XCircle, Search, Store, Clock, Eye, AlertTriangle
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Requests' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminBrandRequests() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const fetcher = useCallback(
    async (page) => api.get('/admin/brand-requests', {
      params: {
        page,
        per_page: 15,
        status: statusFilter || undefined,
        search: search || undefined,
      },
    }),
    [statusFilter, search]
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search],
    pageSize: 15,
  })

  const doApprove = async (id, name) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/brand-requests/${id}/approve`)
      toast.success(`Brand request for "${name}" approved`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/brand-requests/${rejectTarget.id}/reject`, { reason: rejectReason || 'Brand ownership verification failed.' })
      toast.success(`Brand request for "${rejectTarget.brand_name}" rejected`)
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Brand Requests</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review and authorize official brand authorization requests submitted by marketplace sellers.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Tag}
          title={statusFilter ? `No ${statusFilter} brand requests` : 'No brand requests'}
          message="Vendor authorization requests to sell branded merchandise will appear here."
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Requested Brand</th>
                  <th>Requesting Vendor</th>
                  <th>Documentation / Notes</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const isPending = r.status === 'pending'
                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="thumb" style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tag size={16} />
                          </span>
                          <div className="font-bold text-sm text-ink">{r.brand_name}</div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm font-semibold text-ink">{r.vendor?.company_name || r.vendor_name || 'Vendor Partner'}</div>
                        <div className="muted text-xs">{r.vendor?.business_email || 'Verified Seller'}</div>
                      </td>
                      <td className="muted text-xs" style={{ maxWidth: 260 }}>
                        {r.review_notes || r.notes || 'Manufacturer authorization letter attached.'}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="muted text-xs">
                        {formatDate(r.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {isPending && (
                            <>
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => doApprove(r.id, r.brand_name)}
                                disabled={actionBusy}
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                className="btn btn-danger-outline btn-xs"
                                onClick={() => setRejectTarget(r)}
                                disabled={actionBusy}
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <ConfirmDialog
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={doReject}
          danger
          loading={actionBusy}
          title={`Reject Brand Request for "${rejectTarget.brand_name}"?`}
          message="Please state a reason for the seller."
          confirmText="Confirm Rejection"
        >
          <div style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Missing official trademark authorization or unverifiable distributorship license."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}