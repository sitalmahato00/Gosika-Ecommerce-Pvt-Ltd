import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Users, Truck, Folder, Tag, Wallet, AlertCircle, Clock, Check, Trash, Eye, Edit, CheckCircle, XCircle, X } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminBrandRequests() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')

  const fetcher = async (page) => api.get('/admin/brand-requests', { params: { page, per_page: perPage, status: statusFilter || undefined } })
  const { items, meta, setPage: ps, loading: l, error, reload } = useList(fetcher, { deps: [statusFilter], pageSize: perPage })

  const doApprove = async (id) => {
    try {
      await api.post(`/admin/brand-requests/${id}/approve`)
      toast.success('Brand request approved')
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }
  const doReject = async (id) => {
    const reason = window.prompt('Enter rejection reason (required):')
    if (!reason) return
    try {
      await api.post(`/admin/brand-requests/${id}/reject`, { reason })
      toast.success('Brand request rejected')
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  useEffect(load, [])

  if (loading) {
    return <div className="card"><Skeleton height={180} /></div>
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!requests.length) return <EmptyState icon={Tag} title="No brand requests" message="No brand requests found." />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Brand requests</h2>
        <div className="flex gap-2 wrap">
          {['', 'approved', 'rejected'].map((s) => (
            <button key={s} className={`pill ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s || 'All'}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((r) => (
          <div key={r.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <div className="flex items-center gap-2">
              <span className="thumb"><Tag size={16} /></span>
              <div>
                <div className="font-medium">{r.brand_name}</div>
                <div className="muted text-xs">{formatDate(r.created_at)}</div>
              </div>
            </div>
            <StatusBadge status={r.status} />
            {r.review_notes && <div className="muted text-sm mt-1">Review: {r.review_notes}</div>}
            <div className="flex items-center gap-2 mt-1">
              {r.status !== 'approved' && <button className="btn btn-success btn-sm" onClick={() => doApprove(r.id)}><CheckCircle size={13} /> Approve</button>}
              {r.status !== 'rejected' && <button className="btn btn-danger btn-sm" onClick={() => doReject(r.id)}><XCircle size={13} /> Reject</button>}
            </div>
          </div>
        ))}
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={ps} />
    </div>
  )
}