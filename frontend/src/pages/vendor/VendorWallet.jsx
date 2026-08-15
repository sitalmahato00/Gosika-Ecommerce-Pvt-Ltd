import React, { useEffect, useState } from 'react'
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, AlertCircle, Banknote } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'

const MIN_PAYOUT = 1000

export default function VendorWallet() {
  const toast = useToast()
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [payoutOpen, setPayoutOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [requesting, setRequesting] = useState(false)

  const load = () => {
    Promise.allSettled([api.get('/vendor/wallet'), api.get('/vendor/wallet/transactions')]).then(([w, t]) => {
      if (w.status === 'fulfilled') setWallet(w.value.data.data)
      if (t.status === 'fulfilled') setTransactions(t.value.data.data || [])
      else setError('Could not load wallet data')
      setLoading(false)
    })
  }
  useEffect(load, [])

  const requestPayout = async (e) => {
    e.preventDefault()
    const amount = Number(payoutAmount)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    if (amount < MIN_PAYOUT) return toast.error(`Minimum payout is ${money(MIN_PAYOUT)}`)
    if (amount > Number(wallet?.available_balance || 0)) return toast.error('Amount exceeds available balance')
    setRequesting(true)
    try {
      await api.post('/vendor/wallet/payouts', { amount })
      toast.success('Payout requested. We will process it shortly.')
      setPayoutOpen(false)
      setPayoutAmount('')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setRequesting(false)
    }
  }

  const filtered = typeFilter === 'all'
    ? transactions
    : transactions.filter((t) => t.transaction_type === typeFilter)

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
        <Skeleton height={300} />
      </div>
    )
  }

  if (error) return <div className="alert alert-error">{error}</div>

  const available = Number(wallet?.available_balance || 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wallet</h1>
          <p>Your earnings, balances and payout requests</p>
        </div>
        <Button variant="primary" icon={Banknote} onClick={() => setPayoutOpen(true)} disabled={available < MIN_PAYOUT}>
          Withdraw funds
        </Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Available balance', value: money(wallet?.available_balance), hint: 'Ready to withdraw', tone: 'var(--success)' },
          { label: 'Pending balance', value: money(wallet?.pending_balance), hint: 'Clearing / awaiting delivery' },
          { label: 'Total balance', value: money(wallet?.balance), hint: 'Available + pending' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.tone }}>{k.value}</div>
            <div className="muted text-xs">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between wrap mb-2">
          <h3 style={{ fontSize: 16 }}>Transactions</h3>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {['all', 'credit', 'debit'].map((f) => (
              <button key={f} className={`tab ${typeFilter === f ? 'active' : ''}`} onClick={() => setTypeFilter(f)}>
                {f === 'all' ? 'All' : f === 'credit' ? 'Income' : 'Withdrawals'}
              </button>
            ))}
          </div>
        </div>
        {filtered.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Type</th><th>Description</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'right' }}>Balance</th></tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isCredit = t.transaction_type === 'credit' || t.transaction_type === 'sale' || t.transaction_type === 'refund' && Number(t.amount) > 0 || Number(t.amount) > 0
                  return (
                    <tr key={t.id}>
                      <td>
                        <span className="flex items-center gap-2">
                          {isCredit ? <ArrowDownLeft size={15} color="var(--success)" /> : <ArrowUpRight size={15} color="var(--danger)" />}
                          <span className="capitalize font-medium">{t.transaction_type.replace(/_/g, ' ')}</span>
                        </span>
                      </td>
                      <td className="muted">{t.description || '—'}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="muted text-sm">{formatDateTime(t.created_at)}</td>
                      <td className="font-semibold" style={{ textAlign: 'right' }}>
                        <span className={isCredit ? 'text-success' : 'text-danger'}>{isCredit ? '+' : '-'}{money(Math.abs(t.amount))}</span>
                      </td>
                      <td className="muted text-sm" style={{ textAlign: 'right' }}>{t.balance_after != null ? money(t.balance_after) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 32 }}>
            <div className="es-icon"><WalletIcon size={32} /></div>
            <p className="muted">No transactions yet. Your earnings will appear here as orders are completed.</p>
          </div>
        )}
      </div>

      <div className="alert alert-info" style={{ marginBottom: 0 }}>
        <AlertCircle size={18} />
        <span>Balances update automatically after successful deliveries. Minimum payout amount is {money(MIN_PAYOUT)}.</span>
      </div>

      <Modal open={payoutOpen} onClose={() => setPayoutOpen(false)} title="Withdraw funds">
        <form onSubmit={requestPayout} className="flex flex-col gap-2">
          <p className="muted text-sm" style={{ marginTop: 0 }}>Request a payout to your registered bank account. Transfers are processed within 2-3 business days.</p>
          <Input
            label="Amount (NPR)"
            type="number"
            min={MIN_PAYOUT}
            max={available}
            step="1"
            required
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            hint={`Available: ${money(available)}`}
          />
          <div className="muted text-xs">Minimum: {money(MIN_PAYOUT)}</div>
          <Button type="submit" block disabled={requesting}>
            {requesting ? <Spinner size={15} color="#fff" /> : 'Request payout'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
