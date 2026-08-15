import React, { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { money } from '../../utils/format'
import { useList } from '../../hooks/useApi'

export default function AdminPayouts() {
  const toast = useToast()
  const [search, setSearch] = useState('')

  const fetcher = (page) => {
    const params = { page, per_page: 20 }
    if (search) params.search = search
    return api.get('/admin/wallet/payouts', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { deps: [search] })

  const run = async (id, verb, success) => {
    try {
      await api.post(`/admin/wallet/payouts/${id}/${verb}`)
      toast.success(success)
      reload()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed')
    }
  }

  const doApprove = (id) => run(id, 'approve', 'Payout approved')
  const doReject = (id) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    run(id, 'reject', 'Payout rejected')
  }
  const doMarkPaid = (id) => run(id, 'mark-paid', 'Marked as paid')
  const doCancel = (id) => run(id, 'cancel', 'Payout cancelled')

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
      </div>
    )
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!items.length) {
    return <EmptyState icon={ArrowLeftRight} title="No payouts" message="No payout requests found." />
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Payout Requests</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Approve, reject, and track vendor payout requests.
          </p>
        </div>
        <input className="input" style={{ maxWidth: 260 }} placeholder="Search payouts…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Payout</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Paid</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-xs">{p.payout_number}</td>
                  <td className="text-sm font-medium">{p.vendor_name || '—'}</td>
                  <td className="font-bold text-sm">{money(p.amount)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="muted text-xs">{p.requested_at ? new Date(p.requested_at).toLocaleDateString() : '—'}</td>
                  <td className="muted text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      {p.status === 'pending' && (
                        <>
                          <button className="btn btn-success btn-xs" onClick={() => doApprove(p.id)}>Approve</button>
                          <button className="btn btn-danger btn-xs" onClick={() => doReject(p.id)}>Reject</button>
                        </>
                      )}
                      {p.status === 'approved' && (
                        <button className="btn btn-primary btn-xs" onClick={() => doMarkPaid(p.id)}>Mark Paid</button>
                      )}
                      {p.status !== 'cancelled' && (
                        <button className="btn btn-outline btn-xs" onClick={() => doCancel(p.id)}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
    </div>
  )
}
