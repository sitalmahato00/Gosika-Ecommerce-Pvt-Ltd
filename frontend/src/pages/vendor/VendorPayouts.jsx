import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Plus, Banknote } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage } from '../../utils/format'

const MIN_PAYOUT = 1000

export default function VendorPayouts() {
  const toast = useToast()
  const [payouts, setPayouts] = useState([])
  const [wallet, setWallet] = useState(null)
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', bank_account_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.allSettled([api.get('/vendor/wallet/payouts'), api.get('/vendor/wallet'), api.get('/vendor/bank-accounts')]).then(([p, w, b]) => {
      if (p.status === 'fulfilled') setPayouts(p.value.data.data || [])
      else setError('Could not load payouts')
      if (w.status === 'fulfilled') setWallet(w.value.data.data)
      if (b.status === 'fulfilled') setBankAccounts(b.value.data.data || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const request = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return toast.error('Enter a valid amount')
    if (amount < MIN_PAYOUT) return toast.error(`Minimum payout is ${money(MIN_PAYOUT)}`)
    if (amount > Number(wallet?.available_balance || 0)) return toast.error('Amount exceeds available balance')
    setSaving(true)
    try {
      await api.post('/vendor/wallet/payouts', {
        amount,
        bank_account_id: form.bank_account_id || undefined,
      })
      toast.success('Payout requested. Pending approval.')
      setModalOpen(false)
      setForm({ amount: '', bank_account_id: '' })
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const available = Number(wallet?.available_balance || 0)

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={100} />)}
        </div>
        <Skeleton height={300} />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between wrap gap-2">
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 2 }}>Payouts</h2>
          <p className="muted text-sm m-0">Withdraw your available earnings to your bank account.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)} disabled={available < MIN_PAYOUT}>
          Request payout
        </Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-label">Available for withdrawal</div>
          <div className="kpi-value text-success">{money(available)}</div>
          <div className="muted text-xs">Min. {money(MIN_PAYOUT)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total payout requests</div>
          <div className="kpi-value">{payouts.length}</div>
          <div className="muted text-xs">Across all time</div>
        </div>
      </div>

      {payouts.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Payout #</th><th>Bank</th><th>Amount</th><th>Status</th><th>Requested</th><th>Paid</th></tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.payout_number || `#${p.id}`}</td>
                  <td>{p.bank_name ? `${p.bank_name} ••••${p.account_number}` : '—'}</td>
                  <td className="font-semibold">{money(p.amount)}</td>
                  <td>
                    <StatusBadge status={p.status} />
                    {p.rejection_reason && <div className="muted text-xs">{p.rejection_reason}</div>}
                  </td>
                  <td className="muted text-sm">{formatDateTime(p.requested_at)}</td>
                  <td className="muted text-sm">{formatDateTime(p.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={ArrowLeftRight} title="No payouts yet" message="Request your first payout from your available balance." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Request payout</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request a payout">
        <form onSubmit={request}>
          <Input label="Amount (NPR)" type="number" min={MIN_PAYOUT} step="1" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} hint={`Available: ${money(available)}`} />
          <Select label="Bank account" required value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}>
            <option value="">Select bank account</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.bank_name} ••••{b.account_number}</option>
            ))}
          </Select>
          {!bankAccounts.length && (
            <div className="alert alert-warning">No bank accounts found. Add one to your vendor profile before requesting a payout.</div>
          )}
          <Button type="submit" block disabled={saving || !bankAccounts.length}>
            {saving ? <Spinner size={15} color="#fff" /> : <><Banknote size={16} /> Request payout</>}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
