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
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, errorMessage } from '../../utils/format'

const MIN_PAYOUT = 1000

const STATUSES = ['all', 'pending', 'eligible', 'processing', 'paid', 'failed', 'on_hold', 'reversed']

export default function VendorSettlements() {
  const toast = useToast()
  const [status, setStatus] = useState('all')
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [requesting, setRequesting] = useState(false)

  const walletApi = useApi(() => api.get('/vendor/wallet'))

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
  const available = Number(walletApi.data?.available_balance || 0)

  const requestPayout = async (e) => {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')
    if (amt < MIN_PAYOUT) return toast.error(`Minimum payout is ${money(MIN_PAYOUT)}`)
    setRequesting(true)
    try {
      await api.post('/vendor/wallet/payouts', { amount: amt })
      toast.success('Payout requested')
      setPayoutOpen(false)
      setAmount('')
      walletApi.reload()
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

  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settlements</h1>
          <p>Your payout cycles — every amount is tracked and transparent</p>
        </div>
        <Button variant="primary" icon={Banknote} onClick={() => setPayoutOpen(true)}>Request payout</Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-label">Available for withdrawal</div>
          <div className="kpi-value text-success">{money(available)}</div>
          <div className="muted text-xs">Min. {money(MIN_PAYOUT)}</div>
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
                      <td><StatusBadge status={p.status} /></td>
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
          <p className="muted text-sm" style={{ marginTop: 0 }}>Minimum payout is {money(MIN_PAYOUT)}. Amounts are sent to your registered bank account.</p>
          <Input label="Amount (NPR)" type="number" min={MIN_PAYOUT} step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} hint={`Available: ${money(available)}`} />
          <Button type="submit" block disabled={requesting}>
            {requesting ? <Spinner size={15} color="#fff" /> : 'Request payout'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
