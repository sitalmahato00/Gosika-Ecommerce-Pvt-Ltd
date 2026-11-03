import React, { useEffect, useState } from 'react'
import { Banknote, CheckCircle2, Clock, RefreshCw, Search } from 'lucide-react'
import api from '../../api/client'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminCodReconciliation() {
  const toast = useToast()
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({})
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('pending')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [collectingId, setCollectingId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/deliveries/cod-reconciliation', {
        params: { page, per_page: 15, status, search },
      })
      setRecords(response.data?.data || [])
      setSummary(response.data?.meta?.summary || {})
      setPagination(response.data?.meta?.pagination || { current_page: 1, last_page: 1, total: 0 })
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page, status, search])

  const applySearch = (event) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const recordCashReceived = async (record) => {
    setCollectingId(record.id)
    try {
      await api.post(`/admin/deliveries/cod-reconciliation/${record.id}/collect`)
      toast.success(`Recorded ${money(record.cod_amount)} received from ${record.delivery_partner_name || 'delivery partner'}.`)
      await load()
    } catch (collectError) {
      toast.error(errorMessage(collectError))
    } finally {
      setCollectingId(null)
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="page-header"><Skeleton width={260} height={28} /></div>
        <div className="card"><Skeleton height={180} /></div>
      </div>
    )
  }

  if (error && records.length === 0) {
    return <ErrorState message={errorMessage(error)} onRetry={load} />
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>COD Reconciliation</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Track cash collected by delivery partners and record cash handed over to the hub.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <SummaryCard
          label="Cash to collect"
          amount={summary.pending_amount}
          count={summary.pending_count}
          Icon={Clock}
          color="#d97706"
          background="#fffbeb"
        />
        <SummaryCard
          label="Cash received"
          amount={summary.collected_amount}
          count={summary.collected_count}
          Icon={CheckCircle2}
          color="#059669"
          background="#ecfdf5"
        />
      </div>

      <div className="card" style={{ padding: 14, margin: 0 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-2">
            {[
              ['pending', 'Pending collection'],
              ['collected', 'Received'],
              ['all', 'All records'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`btn btn-sm ${status === value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => { setPage(1); setStatus(value) }}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={applySearch} style={{ position: 'relative', width: 'min(100%, 300px)' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              className="input"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search rider or order…"
              style={{ paddingLeft: 32, height: 36 }}
            />
          </form>
        </div>
      </div>

      {error && <div className="alert alert-error">{errorMessage(error)}</div>}

      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-responsive">
          <table className="table" style={{ width: '100%', margin: 0 }}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Delivery partner</th>
                <th>Delivered</th>
                <th>COD collected</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Skeleton height={36} /></td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--muted)' }}>
                    {status === 'pending' ? 'No COD cash is waiting for collection.' : 'No COD reconciliation records found.'}
                  </td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="font-bold">#{record.order_number || record.vendor_order_number}</div>
                    {record.vendor_order_number && <div className="muted text-xs">{record.vendor_order_number}</div>}
                  </td>
                  <td>{record.customer_name || '—'}</td>
                  <td>
                    <div className="font-semibold">{record.delivery_partner_name || '—'}</div>
                    <div className="muted text-xs">{record.delivery_partner_phone || ''}</div>
                  </td>
                  <td className="text-sm">{formatDateTime(record.delivered_at)}</td>
                  <td className="font-bold" style={{ color: '#b45309' }}>{money(record.cod_amount)}</td>
                  <td>
                    {record.status === 'collected' ? (
                      <div>
                        <span className="badge badge-success">Received</span>
                        <div className="muted text-xs mt-1">
                          {record.cod_reconciled_by ? `By ${record.cod_reconciled_by} · ` : ''}
                          {formatDateTime(record.cod_reconciled_at)}
                        </div>
                      </div>
                    ) : <span className="badge badge-warning">Awaiting handover</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {record.status === 'pending' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => recordCashReceived(record)}
                        disabled={collectingId === record.id}
                      >
                        <Banknote size={14} /> {collectingId === record.id ? 'Saving…' : 'Record received'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <span className="muted text-xs">{pagination.total || 0} records</span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-outline btn-xs" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <span className="muted text-xs">{pagination.current_page || page} / {pagination.last_page || 1}</span>
            <button type="button" className="btn btn-outline btn-xs" disabled={page >= (pagination.last_page || 1) || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, amount, count, Icon, color, background }) {
  return (
    <div className="card" style={{ padding: '16px 18px', margin: 0 }}>
      <div className="flex items-center justify-between mb-2">
        <span className="muted text-xs font-bold uppercase">{label}</span>
        <span className="avatar" style={{ width: 34, height: 34, background, color }}><Icon size={17} /></span>
      </div>
      <div style={{ fontSize: 23, fontWeight: 900, color }}>{money(amount || 0)}</div>
      <div className="muted text-xs mt-1">{count || 0} delivered COD order{count === 1 ? '' : 's'}</div>
    </div>
  )
}
