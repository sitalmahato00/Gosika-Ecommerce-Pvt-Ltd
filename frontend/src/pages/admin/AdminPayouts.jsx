import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Check, XCircle, Calendar, Trash, Eye, Edit } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { money } from '../../utils/format'

export default function AdminPayouts() {
  const toast = useToast()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')

  const fetcher = async (page) => {
    const params = new URLSearchParams()
    params.append('page', String(page))
    params.append('per_page', String(perPage))
    if (search) params.append('search', search)
    return api.get('/admin/wallet/payouts', { params })
  }
  const { items, meta, setPage: ps, loading: l, error, reload } = useList(fetcher, { deps: [search], pageSize: perPage })

  const doApprove = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/approve`); toast.success('Payout approved'); reload() } catch (e) { toast.error('Error') }
  }
  const doReject = async (id) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    try { await api.post(`/admin/wallet/payouts/${id}/reject`, { reason }); toast.success('Payout rejected'); reload() } catch (e) { toast.error('Error') }
  }
  const doMarkPaid = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/mark-paid`); toast.success('Marked as paid'); reload() } catch (e) { toast.error('Error') }
  }
  const doCancel = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/cancel`); toast.success('Payout cancelled'); reload() } catch (e) { toast.error('Error') }
  }

  useEffect(load, [])

  if (loading) {
    return <div className="card"><p className="muted">Loading payouts…</p></div>
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!payouts.length) return <EmptyState icon={ArrowLeftRight} title="No payouts" message="No payout requests found." />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Payout requests</h2>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search payouts…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3">
        {items.map((p) => (
          <div key={p.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <div>
              <div className="font-medium">{p.payout_number}</div>
              <div className="muted text-sm">Vendor: {p.vendor_name || '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <div>{money(p.amount)}</div>
              <StatusBadge status={p.status} />
            </div>
            <div className="muted text-sm">{p.requested_at || '—'}</div>
            <div className="muted text-sm">{p.paid_at || '—'}</div>
            <div className="flex gap-1">
              {p.status === 'pending' && <button className="btn btn-success btn-xs" onClick={() => doApprove(p.id)}>Approve</button>}
              {p.status === 'pending' && <button className="btn btn-danger btn-xs" onClick={() => doReject(p.id)}>Reject</button>}
              {p.status === 'approved' && <button className="btn btn-primary btn-xs" onClick={() => doMarkPaid(p.id)}>Mark Paid</button>}
              {p.status !== 'cancelled' && <button className="btn btn-outline btn-xs" onClick={() => doCancel(p.id)}>Cancel</button>}
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={ps} />
    </div>
  )
}