import React, { useCallback, useState } from 'react'
import { FileSpreadsheet, Banknote } from 'lucide-react'
import api from '../../api/client'
import { useApi, useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'

const OPEN_PAYOUT_STATUSES = ['pending', 'approved', 'processing']

const STATUSES = ['all', 'processing', 'eligible', 'hold', 'paid']

const isRequestable = (s) =>
  s.status === 'eligible' &&
  Number(s.net_payable || 0) > 0 &&
  !(s.payout_requests || []).some(p => OPEN_PAYOUT_STATUSES.includes(p.status))

export default function VendorSettlements() {
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [requestable, setRequestable] = useState([])
  const [settlementId, setSettlementId] = useState('')
  const [requesting, setRequesting] = useState(false)

  const fetcher = useCallback(
    (page, pageSize) => api.get('/vendor/wallet/settlements', {
      params: {
        page,
        per_page: pageSize,
        status: status === 'all' ? undefined : status,
      },
    }),
    [status],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [status],
    pageSize: 15,
  })

  const netPayable = items.reduce((s, p) => s + Number(p.net_payable || 0), 0)
  const requestableOnPage = items.filter(isRequestable)
  const requestableTotal = requestableOnPage.reduce((s, p) => s + Number(p.net_payable || 0), 0)

  const openPayoutModal = async () => {
    setPayoutOpen(true)
    setSettlementId('')
    try {
      const res = await api.get('/vendor/wallet/settlements', { params: { status: 'eligible', per_page: 100 } })
      setRequestable((res.data?.data || []).filter(isRequestable))
    } catch {
      setRequestable([])
    }
  }

  const requestPayout = async (e) => {
    e.preventDefault()
    if (!settlementId) return toast.error('Select a settlement to request payout for')
    setRequesting(true)
    try {
      await api.post('/vendor/wallet/payouts', { settlement_id: settlementId })
      toast.success('Payout requested')
      setPayoutOpen(false)
      reload()
      setRequestable(prev => prev.filter(s => s.id !== settlementId))
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={90} />)}
        </div>
        <Skeleton height={260} />
      </div>
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  const selected = requestable.find(s => s.id === settlementId)

  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settlements</h1>
          <p>Your payout cycles — every amount is tracked and transparent</p>
        </div>
        <Button variant="primary" icon={Banknote} onClick={openPayoutModal}>Request payout</Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-label">Requestable (eligible settlements)</div>
          <div className="kpi-value text-success">{money(requestableTotal)}</div>
          <div className="muted text-xs">On this page, awaiting payout request</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Net payable</div>
          <div className="kpi-value">{money(netPayable)}</div>
          <div className="muted text-xs">Listed on this page</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Settlements</div>
          <div className="kpi-value">{meta.total}</div>
          <div className="muted text-xs">Across all time</div>
        </div>
      </div>

      <div className="card">
        <div className="tabs" style={{ marginBottom: 12 }}>
          {STATUSES.map((s) => (
            <button key={s} className={`tab ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1) }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {items.length ? (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Settlement #</th>
                    <th>Period</th>
                    <th style={{ textAlign: 'right' }}>Gross sales</th>
                    <th style={{ textAlign: 'right' }}>Commission</th>
                    <th style={{ textAlign: 'right' }}>Refunds</th>
                    <th style={{ textAlign: 'right' }}>Net payable</th>
                    <th>Status</th>
                    <th>Paid on</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.settlement_number || `#${p.id}`}</td>
                      <td className="muted text-sm">{formatDate(p.period_start)} — {formatDate(p.period_end)}</td>
                      <td className="text-sm" style={{ textAlign: 'right' }}>{money(p.gross_sales)}</td>
                      <td className="muted text-sm" style={{ textAlign: 'right' }}>{money(p.commission_total)}</td>
                      <td className="muted text-sm" style={{ textAlign: 'right' }}>{money(p.refunds_total)}</td>
                      <td className="font-semibold" style={{ textAlign: 'right' }}>{money(p.net_payable)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                        {isRequestable(p) && <div className="muted text-xs">Awaiting payout request</div>}
                      </td>
                      <td className="muted text-sm">{formatDate(p.paid_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </>
        ) : (
          <EmptyState icon={FileSpreadsheet} title={status === 'all' ? 'No settlements yet' : `No ${status} settlements`} message="Completed payout cycles will be listed here with a full breakdown." />
        )}
      </div>

      <Modal open={payoutOpen} onClose={() => setPayoutOpen(false)} title="Request payout">
        <form onSubmit={requestPayout} className="flex flex-col gap-2">
          <p className="muted text-sm" style={{ marginTop: 0 }}>
            Request payout for an eligible settlement. The amount is locked to the settlement net payable.
          </p>
          <Select label="Eligible settlement" required value={settlementId} onChange={(e) => setSettlementId(e.target.value)}>
            <option value="">Select a settlement</option>
            {requestable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.settlement_number} · {formatDate(s.period_start)} — {formatDate(s.period_end)} · {money(s.net_payable)}
              </option>
            ))}
          </Select>
          {!requestable.length && !loading && (
            <div className="alert alert-warning">No eligible settlements to request right now. A settlement must have a completed cycle and no already-pending payout request.</div>
          )}
          {selected && (
            <div className="alert" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10 }}>
              Payout amount is locked to the settlement net payable: <strong>{money(selected.net_payable)}</strong>
            </div>
          )}
          <Button type="submit" block disabled={requesting || !settlementId}>
            {requesting ? <Spinner size={15} color="#fff" /> : `Request ${selected ? money(selected.net_payable) : 'payout'}`}
          </Button>
        </form>
      </Modal>
    </div>
  )
}