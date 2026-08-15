import React, { useEffect, useState } from 'react'
import { Users, CheckCircle, XCircle, AlertCircle, Clock, Eye, Edit, Trash } from 'lucide-react'
import api from '../../api/client'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminDeliveryPartners() {
  const toast = useToast()
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/admin/delivery-partners', { params: { search: search || undefined } }).then((r) => setPartners(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [search])

  const doAction = async (id, action) => {
    try {
      await api.post(`/admin/delivery-partners/${id}/${action}`)
      toast.success(`Partner ${action === 'activate' ? 'activated' : action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : 'approved'}`)
      setTimeout(() => reload(), 800)
    } catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading) {
    return <div className="card"><Skeleton height={120} /></div>
  }

  if (!partners.length) return <EmptyState icon={Users} title="No delivery partners" message="No delivery partners found." />

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Delivery partners</h2>
        <input className="input" style={{ maxWidth: 240 }} placeholder="Search partners…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3">
        {partners.map((p) => (
          <div key={p.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <span className="thumb" style={{ width: 32, height: 32 }}><Users size={16} /></span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{p.name || '—'}</div>
              <div className="muted text-xs">{p.email || '—'}</div>
            </div>
            <div className="flex items-center gap-1">
              {p.status !== 'active' && (
                <button className="btn btn-success btn-sm" onClick={() => doAction(p.id, 'activate')}>Activate</button>
              )}
              {p.status === 'active' && (
                <>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => doAction(p.id, 'reject')}>Reject</button>
                  <button className="btn btn-warning-outline btn-sm" onClick={() => doAction(p.id, 'suspend')}>Suspend</button>
                </>
              )}
              {p.status !== 'active' && (
                <button className="btn btn-success-outline btn-sm" onClick={() => doAction(p.id, 'approve')}>Approve</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}