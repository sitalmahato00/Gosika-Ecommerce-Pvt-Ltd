import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Plus, Banknote } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, formatDate, errorMessage } from '../../utils/format'

const OPEN_PAYOUT_STATUSES = ['pending', 'approved', 'processing']

export default function VendorPayouts() {
  const toast = useToast()
  const [payouts, setPayouts] = useState([])
  const [settlements, setSettlements] = useState([])
  const [bankAccounts, setBankAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ settlement_id: '', bank_account_id: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.allSettled([
      api.get('/vendor/wallet/payouts'),
      api.get('/vendor/wallet/settlements', { params: { status: 'eligible', per_page: 100 } }),
      api.get('/vendor/bank-accounts'),
    ]).then(([p, s, b]) => {
      if (p.status === 'fulfilled') setPayouts(p.value.data.data || [])
      else setError('Could not load payouts')
      if (s.status === 'fulfilled') setSettlements(s.value.data.data || [])
      if (b.status === 'fulfilled') setBankAccounts(b.value.data.data || [])
      setLoading(false)
    })
  }
  useEffect(load, [])

  const requestable = settlements.filter(s =>
    s.status === 'eligible' &&
    Number(s.net_payable || 0) > 0 &&
    !(s.payout_requests || []).some(p => OPEN_PAYOUT_STATUSES.includes(p.status)),
  )

  const request = async (e) => {
    e.preventDefault()
    if (!form.settlement_id) return toast.error('Select a settlement to request payout for')
    setSaving(true)
    try {
      await api.post('/vendor/wallet/payouts', {
        settlement_id: form.settlement_id,
        bank_account_id: form.bank_account_id || undefined,
      })
      toast.success('Payout requested. Pending approval.')
      setModalOpen(false)
      setForm({ settlement_id: '', bank_account_id: '' })
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const selected = requestable.find(s => s.id === form.settlement_id)
  const requestableTotal = requestable.reduce((sum, s) => sum + Number(s.net_payable || 0), 0)

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
          <p className="muted text-sm m-0">Request payout for an eligible settlement to your bank account.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => { setForm({ settlement_id: '', bank_account_id: '' }); setModalOpen(true) }} disabled={!requestable.length}>
          Request payout
        </Button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card">
          <div className="kpi-label">Requestable (eligible settlements)</div>
          <div className="kpi-value text-success">{money(requestableTotal)}</div>
          <div className="muted text-xs">Complete payout cycles awaiting request</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total payout requests</div>
          <div className="kpi-value">{payouts.length}</div>
          <div className="muted text-xs">Across all time</div>
        </div>
      </div>

      {!requestable.length && (
        <div className="alert" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', borderRadius: 10 }}>
          There are no settlements available to request right now. New payouts can only be requested once a payout cycle
          is completed and no payout is already pending for it.
        </div>
      )}

      {payouts.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Payout #</th><th>Settlement</th><th>Bank</th><th>Amount</th><th>Status</th><th>Requested</th><th>Paid</th></tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.payout_number || `#${p.id}`}</td>
                  <td className="muted text-sm">{p.settlement?.settlement_number || '—'}</td>
                  <td>{p.bank_account?.bank_name ? `${p.bank_account.bank_name} ••••${p.bank_account.account_number}` : '—'}</td>
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
        <EmptyState icon={ArrowLeftRight} title="No payouts yet" message="Request a payout for an eligible settlement once your payout cycle is completed." action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Request payout</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request a payout">
        <form onSubmit={request}>
          <Select label="Eligible settlement" required value={form.settlement_id} onChange={(e) => setForm({ ...form, settlement_id: e.target.value })}>
            <option value="">Select a settlement</option>
            {requestable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.settlement_number} · {formatDate(s.period_start)} — {formatDate(s.period_end)} · {money(s.net_payable)}
              </option>
            ))}
          </Select>
          {selected && (
            <div className="alert" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 10 }}>
              Payout amount is locked to the settlement net payable: <strong>{money(selected.net_payable)}</strong>
            </div>
          )}
          <Select label="Bank account" required value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}>
            <option value="">Select bank account</option>
            {bankAccounts.map((b) => (
              <option key={b.id} value={b.id}>{b.bank_name} ••••{b.account_number}</option>
            ))}
          </Select>
          {!bankAccounts.length && (
            <div className="alert alert-warning">No bank accounts found. Add one to your vendor profile before requesting a payout.</div>
          )}
          <Button type="submit" block disabled={saving || !form.settlement_id || !bankAccounts.length}>
            {saving ? <Spinner size={15} color="#fff" /> : <><Banknote size={16} /> Request payout</>}
          </Button>
        </form>
      </Modal>
    </div>
  )
}