import React, { useState } from 'react'
import {
  TrendingUp, DollarSign, Calendar, Clock, CheckCircle2,
  ArrowUpRight, Building2, CreditCard, Download, Zap, Award
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PAYOUT_HISTORY = [
  { id: 'PAY-RD-2026-0810', period: '01 Aug 2026 – 07 Aug 2026', deliveries: 42, base: 7560, bonus: 1200, tips: 690, total: 9450, status: 'paid', date: '08 Aug 2026', method: 'Nabil Bank Direct' },
  { id: 'PAY-RD-2026-0803', period: '25 Jul 2026 – 31 Jul 2026', deliveries: 38, base: 6840, bonus: 950, tips: 510, total: 8300, status: 'paid', date: '01 Aug 2026', method: 'Nabil Bank Direct' },
  { id: 'PAY-RD-2026-0727', period: '18 Jul 2026 – 24 Jul 2026', deliveries: 45, base: 8100, bonus: 1400, tips: 780, total: 10280, status: 'paid', date: '25 Jul 2026', method: 'Nabil Bank Direct' },
]

export default function DeliveryEarnings() {
  const toast = useToast()
  const [history, setHistory] = useState(PAYOUT_HISTORY)
  const [requestOpen, setRequestOpen] = useState(false)
  const [payoutBusy, setPayoutBusy] = useState(false)

  const handleRequestPayout = (e) => {
    e.preventDefault()
    setPayoutBusy(true)
    setTimeout(() => {
      setPayoutBusy(false)
      setRequestOpen(false)
      toast.success('Instant early payout request of Rs. 3,850 submitted to finance desk!')
    }, 600)
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Rider Earnings & Payout Ledger
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track completed parcel delivery fees, distance bonuses, customer tips, and bank disbursements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setRequestOpen(true)}
          >
            <DollarSign size={14} /> Request Instant Payout
          </button>
        </div>
      </div>

      {/* Top 4 Earnings KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Current Week Unpaid</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <TrendingUp size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(3850)}</div>
          <div className="muted text-xs mt-1">18 deliveries · Disbursing on Monday</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">This Month Earnings</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(28030)}</div>
          <div className="muted text-xs mt-1">125 total completed trips</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Distance & Peak Bonus</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Zap size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{money(3550)}</div>
          <div className="muted text-xs mt-1">Highway & festival multipliers</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Customer Tips</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Award size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(1980)}</div>
          <div className="muted text-xs mt-1">100% passed directly to rider</div>
        </div>
      </div>

      {/* Bank Account Details Card */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '16px 20px', margin: 0, background: 'var(--bg)' }}>
        <div className="flex items-center gap-3">
          <span className="avatar" style={{ width: 42, height: 42, background: '#ffffff', color: 'var(--primary)', border: '1px solid var(--border)' }}>
            <Building2 size={20} />
          </span>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              Primary Payout Account (Nepal)
            </h4>
            <div className="muted text-xs mt-0.5">
              Nabil Bank Limited · Account Name: <strong>Bikash Shrestha</strong> · A/C: <span className="font-mono font-bold text-ink">•••• 4912</span> (Kathmandu Main)
            </div>
          </div>
        </div>
        <span className="badge badge-success font-bold">● Verified for ConnectIPS Instant Payout</span>
      </div>

      {/* Weekly Payouts Ledger Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Clock size={16} color="var(--primary)" /> Weekly Disbursed Payout History
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 840 }}>
            <thead>
              <tr>
                <th>Payout Batch ID</th>
                <th>Billing Cycle Period</th>
                <th>Completed Trips</th>
                <th>Base Fare</th>
                <th>Distance/Peak Bonus</th>
                <th>Tips</th>
                <th>Net Disbursed</th>
                <th>Disbursed Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs">{p.id}</span>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-ink">{p.period}</span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold">{p.deliveries} deliveries</span>
                  </td>
                  <td>
                    <span className="text-xs">{money(p.base)}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: '#4f46e5', fontWeight: 700 }}>+{money(p.bonus)}</span>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: '#d97706', fontWeight: 700 }}>+{money(p.tips)}</span>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-success">{money(p.total)}</span>
                  </td>
                  <td className="muted text-xs">
                    {p.date}
                  </td>
                  <td>
                    <span className="badge badge-success">Paid via IPS</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Early Payout Modal */}
      {requestOpen && (
        <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Instant Early Payout">
          <form onSubmit={handleRequestPayout} className="flex flex-col gap-3">
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <span className="muted text-xs uppercase font-bold">Available Unpaid Balance</span>
              <div className="font-black text-3xl text-success mt-1">{money(3850)}</div>
              <div className="muted text-xs mt-1">Disbursement Destination: <strong>Nabil Bank Limited (•••• 4912)</strong></div>
            </div>

            <p className="muted text-xs m-0">
              Early instant payouts are processed directly into your verified bank account via ConnectIPS within 15 minutes.
            </p>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRequestOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={payoutBusy}>
                {payoutBusy ? 'Processing Payout…' : 'Confirm & Withdraw Rs. 3,850'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
