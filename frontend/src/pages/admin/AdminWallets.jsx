import React, { useEffect, useState } from 'react'
import { Wallet, ArrowDownLeft, ArrowUpRight, Calendar, Check, XCircle, AlertCircle, Clock, Plus } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminWallets() {
  const toast = useToast()
  const { vendorId } = useParams() || {}
  const [vendorWallet, setVendorWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [commissions, setCommissions] = useState({ total: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', vendor_id: vendorId || '' })
  const [saving, setSaving] = useState(false)

  // Load per-vendor data
  useEffect(() => {
    if (!vendorId) return
    Promise.allSettled([
      api.get(`/admin/wallet/vendors/${vendorId}/wallet`),
      api.get(`/admin/wallet/vendors/${vendorId}/transactions`),
      api.get(`/admin/wallet/vendors/${vendorId}/commissions`),
    ]).then(([w, t, c]) => {
      if (w.status === 'fulfilled') setVendorWallet(w.value.data.data)
      if (t.status === 'fulfilled') setTransactions(t.value.data.data || [])
      if (c.status === 'fulfilled') {
        const cc = c.value.data.data || {}
        setCommissions({ total: Number(cc.total_commission || 0), thisMonth: Number(cc.this_month_commission || 0) }
        )
      }
      setLoading(false)
    })
  }, [vendorId])

  // Payout requests list
  const [payouts, setPayouts] = useState([])
  useEffect(() => {
    if (!vendorId) return
    api.get(`/admin/wallet/vendors/${vendorId}/payouts`, { params: { per_page: 20 } }).then((r) => setPayouts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [vendorId])

  const doAdjust = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/admin/wallet/vendors/${vendorId}/wallet/adjust`, { amount: Number(form.amount) })
      toast.success('Balance adjusted')
      setForm({ amount: '' })
      setModalOpen(false)
      if (vendorId) useEffect(() => {}, [vendorId]) // refetch
    } catch (e) { toast.error(errorMessage(e)) } finally { setSaving(false) }
  }

  const doGenerate = async () => {
    try {
      await api.post(`/admin/wallet/settings/generate`)
      toast.success('Settlement generated')
    } catch (e) { toast.error(errorMessage(e)) }
  }

  const doApprovePayout = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/approve`); toast.success('Payout approved'); reload() } catch (e) { toast.error(errorMessage(e)) }
  }
  const doRejectPayout = async (id) => {
    const reason = window.prompt('Rejection reason:')
    if (!reason) return
    try { await api.post(`/admin/wallet/payouts/${id}/reject`, { reason }); toast.success('Payout rejected'); reload() } catch (e) { toast.error(errorMessage(e)) }
  }
  const doMarkPaid = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/mark-paid`); toast.success('Marked as paid'); reload() } catch (e) { toast.error(errorMessage(e)) }
  }
  const doCancelPayout = async (id) => {
    try { await api.post(`/admin/wallet/payouts/${id}/cancel`); toast.success('Payout cancelled'); reload() } catch (e) { toast.error(errorMessage(e)) }
  }

  if (loading || !vendorId) {
    return <div className="card"><p className="muted">Select a vendor from the list to view wallet details.</p></div>
  }

  if (!vendorWallet) return <div>No wallet data</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <div className="kpi-card"><div className="kpi-label">Current Balance</div><div className="kpi-value text-success">{money(vendorWallet.balance)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Available</div><div className="kpi-value">{money(vendorWallet.available_balance)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Pending</div><div className="kpi-value">{money(vendorWallet.pending_balance)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Total Commissions</div><div className="kpi-value">{money(commissions.total)}</div></div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16 }} className="mb-2">Recent Transactions</h3>
        {transactions.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Type</th><th>Description</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td><span className={`capitalize ${Number(t.amount) > 0 ? 'text-success' : 'text-danger'}`}>{t.transaction_type.replace(/_/g, ' ')}</span></td>
                    <td className="muted">{t.description || '—'}</td>
                    <td className={Number(t.amount) > 0 ? 'text-success' : 'text-danger'}>{Number(t.amount) > 0 ? '+' : '-'}{money(Math.abs(t.amount))}</td>
                    <td className="muted text-sm">{formatDateTime(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Clock} title="No transactions" message="Transactions appear here as orders are completed." />
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16 }} className="mb-2">Payout Requests</h3>
        {payouts.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Payout #</th><th>Amount</th><th>Status</th><th>Requested</th><th>Paid</th><th>Actions</th></tr></thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.payout_number}</td>
                    <td className="font-semibold">{money(p.amount)}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="muted text-sm">{formatDateTime(p.requested_at)}</td>
                    <td className="muted text-sm">{formatDateTime(p.paid_at)}</td>
                    <td>
                      {p.status === 'pending' && (<button className="btn btn-success btn-xs" onClick={() => doApprovePayout(p.id)}>Approve</button>)}
                      {p.status === 'pending' && (<button className="btn btn-danger btn-xs" onClick={() => doRejectPayout(p.id)}>Reject</button>)}
                      {p.status === 'approved' && (<button className="btn btn-primary btn-xs" onClick={() => doMarkPaid(p.id)}>Mark Paid</button>)}
                      {p.status !== 'cancelled' && (<button className="btn btn-outline btn-xs" onClick={() => doCancelPayout(p.id)}>Cancel</button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Plus} title="No payouts" message="No payout requests yet. Request from vendor wallet." />
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 16 }} className="mb-2">Adjust Balance / Generate Settlement</h3>
        <form onSubmit={(e) => { e.preventDefault(); doAdjust(e) }} className="flex flex-col gap-2">
          <Input label="Adjust balance (NPR)" type="number" min="100" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <button type="submit" block disabled={saving}>{saving ? <Spinner size={15} color="#fff" /> : 'Adjust balance'}</button>
        </form>
        <button variant="soft" size="sm" onClick={doGenerate} style={{ marginTop: 8 }}>Generate settlement</button>
      </div>
    </div>
  )
}