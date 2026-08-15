import React, { useEffect, useState } from 'react'
import { FileSpreadsheet, Calendar, Check, XCircle } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminSettlements() {
  const toast = useToast()
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [vendorId, setVendorId] = useState('')

  // Load settlements, optionally filtered by vendor
  useEffect(() => {
    let params = { per_page: perPage }
    if (vendorId) params.vendor_id = vendorId
    api.get('/admin/wallet/settlements', { params }).then((r) => setSettlements(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [vendorId, perPage])

  const doGenerate = async () => {
    try {
      await api.post('/admin/wallet/settings/generate')
      toast.success('Settlement generated')
    } catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading) {
    return <div className="card"><p className="muted">Loading settlements…</p></div>
  }

  if (!settlements.length) {
    return vendorId ? (
      <EmptyState icon={FileSpreadsheet} title="No settlements" message="No settlement cycles found for this vendor." />
    ) : (
      <div className="flex flex-col gap-2">
        <p className="muted">All settlements will appear here. Filter by vendor to narrow.</p>
        <select className="select" onChange={(e) => setVendorId(e.target.value)}> <option value="">— Filter by vendor —</option> </select>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between wrap mb-2">
        <h2 style={{ fontSize: 20 }}>Settlements</h2>
        {vendorId ? (
          <button className="btn btn-soft btn-sm" onClick={() => setVendorId('')}>Show all</button>
        ) : (
          <select className="select" onChange={(e) => setVendorId(e.target.value)}> <option value="">— Filter by vendor —</option> </select>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {settlements.map((s) => (
          <div key={s.id} className="card flex items-center gap-3" style={{ padding: 16 }}>
            <div>
              <div className="font-medium">{s.payout_number}</div>
              <div className="muted text-sm">Payout: {s.payout_number}</div>
            </div>
            <div className="flex items-center gap-2">
              <div>{money(s.amount)}</div>
              <StatusBadge status={s.status} />
            </div>
            <div className="muted text-sm">Requested: {formatDate(s.requested_at)}</div>
            <div className="muted text-sm">Paid: {formatDate(s.paid_at)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}