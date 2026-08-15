import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck, Users, Calendar, Check, XCircle, Plus } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDeliveries() {
  const toast = useToast()
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [search, setSearch] = useState('')

  const fetcher = async (page) => api.get('/admin/deliveries', { params: { page, per_page: perPage, search: search || undefined } })
  const { items, meta, setPage: ps, loading: l, error, reload } = useList(fetcher, { deps: [search], pageSize: perPage })

  const doReassign = async (id, newPartnerId) => {
    try {
      await api.post(`/admin/deliveries/${id}/reassign`, { delivery_partner_id: newPartnerId })
      toast.success('Delivery reassigned')
      reload()
    } catch (e) { toast.error(errorMessage(e)) }
  }

  useEffect(load, [])

  if (loading) {
    return <div className="card"><Skeleton height={180} /></div>
  }

  if (error) return <ErrorState onRetry={reload} />

  if (!deliveries.length) return <EmptyState icon={Truck} title="No deliveries" message="No delivery assignments yet." />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Deliveries</h2>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search deliveries…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3">
        {items.map((d) => (
          <div key={d.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <div className="flex items-center gap-2">
              <span className="thumb"><Truck size={16} /></span>
              <div>
                <div className="font-medium">{d.vendor_order?.vendor_order_number}</div>
                <div className="muted text-sm">Partner: {d.delivery_partner_name || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="muted text-sm">{formatDate(d.created_at)}</div>
              {d.status && <StatusBadge status={d.status} />}
            </div>
            {d.delivery_partner_id && (
              <div className="mt-2">
                <button className="btn btn-outline btn-sm" onClick={() => setPage(1)}>Reassign</button>
                <select className="select" style={{ marginLeft: 8 }}>
                  <option value="">— select partner —</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={ps} />
    </div>
  )
}