import React, { useState } from 'react'
import {
  Wallet, Banknote, CheckCircle2, Clock, Upload,
  Download, Building2, Store, Search, ShieldCheck, AlertTriangle
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const COD_TRANSACTIONS = [
  { id: 'COD-TX-9901', orderId: 'ORD-2026-98074', customer: 'Sita Kumari Rai', item: 'Palpali Dhaka Saree', amount: 6200, collectedAt: '15 Aug 2026 09:45 AM', status: 'in_hand' },
  { id: 'COD-TX-9892', orderId: 'ORD-2026-98112', customer: 'Deepak KC', item: 'Ilam Orthodox Tea', amount: 2400, collectedAt: '15 Aug 2026 10:30 AM', status: 'in_hand' },
  { id: 'COD-TX-9885', orderId: 'ORD-2026-98085', customer: 'Anil Thapa', item: 'Tibetan Singing Bowl', amount: 3400, collectedAt: '14 Aug 2026 06:15 PM', status: 'deposited', depositRef: 'DEP-HUB-KT-1104', depositedAt: '14 Aug 2026 07:30 PM' },
  { id: 'COD-TX-9870', orderId: 'ORD-2026-98070', customer: 'Suman Shrestha', item: 'Dhaka Topi Set', amount: 1800, collectedAt: '14 Aug 2026 03:00 PM', status: 'deposited', depositRef: 'DEP-HUB-KT-1104', depositedAt: '14 Aug 2026 07:30 PM' },
]

export default function DeliveryCodLedger() {
  const toast = useToast()
  const [txns, setTxns] = useState(COD_TRANSACTIONS)
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositBusy, setDepositBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [depositMethod, setDepositMethod] = useState('Hub Counter Deposit')
  const [depositSlip, setDepositSlip] = useState(null)

  const inHandTotal = txns.filter(t => t.status === 'in_hand').reduce((s, t) => s + t.amount, 0)
  const settledTotal = txns.filter(t => t.status === 'deposited').reduce((s, t) => s + t.amount, 0)

  const handleDeposit = (e) => {
    e.preventDefault()
    setDepositBusy(true)
    setTimeout(() => {
      const ref = `DEP-HUB-${Math.floor(1000 + Math.random() * 9000)}`
      setTxns(txns.map(t => t.status === 'in_hand' ? {
        ...t,
        status: 'deposited',
        depositRef: ref,
        depositedAt: 'Just now',
      } : t))
      setDepositBusy(false)
      setDepositOpen(false)
      toast.success(`COD Cash remittance of ${money(inHandTotal)} recorded with Ref: ${ref}!`)
    }, 600)
  }

  const filtered = txns.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.id.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q) || t.customer.toLowerCase().includes(q)
  })

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Cash on Delivery (COD) Ledger
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor cash collections from doorstep deliveries and submit end-of-shift remittance deposits to GOSIKA Central Hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {inHandTotal > 0 && (
            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={() => setDepositOpen(true)}
            >
              <Banknote size={14} /> Deposit COD Cash ({money(inHandTotal)})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: inHandTotal > 0 ? '2px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ color: '#92400e' }}>COD Cash in Hand</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(inHandTotal)}</div>
          <div className="muted text-xs mt-1">Pending deposit to hub</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Total Settled Cash</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(settledTotal)}</div>
          <div className="muted text-xs mt-1">Remittance verified by finance</div>
        </div>
      </div>

      {/* Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <Wallet size={16} color="var(--primary)" /> COD Cash Collection Logs
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 840 }}>
            <thead>
              <tr>
                <th>Collection ID</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Delivered Item</th>
                <th>Cash Collected</th>
                <th>Collection Time</th>
                <th>Deposit Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs">{t.id}</span>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-ink">#{t.orderId}</span>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-ink">{t.customer}</span>
                  </td>
                  <td>
                    <span className="muted text-xs">{t.item}</span>
                  </td>
                  <td>
                    <span className="font-bold text-sm" style={{ color: '#d97706' }}>{money(t.amount)}</span>
                  </td>
                  <td className="muted text-xs">
                    {t.collectedAt}
                  </td>
                  <td>
                    {t.status === 'in_hand' ? (
                      <span className="badge badge-warning">In Hand (Unsettled)</span>
                    ) : (
                      <div>
                        <span className="badge badge-success">Deposited</span>
                        <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>{t.depositRef}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Modal */}
      {depositOpen && (
        <Modal open={depositOpen} onClose={() => setDepositOpen(false)} title="Submit COD Cash Remittance">
          <form onSubmit={handleDeposit} className="flex flex-col gap-3">
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <span className="muted text-xs uppercase font-bold">Total Cash in Hand to Deposit</span>
              <div className="font-black text-3xl text-warning mt-1" style={{ color: '#d97706' }}>{money(inHandTotal)}</div>
              <div className="muted text-xs mt-1">Designated Hub: <strong>Kathmandu Central Logistics Hub (Thamel)</strong></div>
            </div>

            <div className="form-group">
              <label className="label">Remittance Method <span className="req">*</span></label>
              <select
                className="select"
                value={depositMethod}
                onChange={(e) => setDepositMethod(e.target.value)}
              >
                <option value="Hub Counter Deposit">Direct Hub Counter Cash Handover</option>
                <option value="Bank Direct Deposit">Bank Cash Deposit (Nabil Bank Ltd)</option>
                <option value="Fonepay Digital Deposit">Fonepay QR Direct Settlement</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Attach Deposit Receipt / Stamp (Optional)</label>
              <input
                type="file"
                className="input"
                style={{ fontSize: 12, padding: 5 }}
                onChange={(e) => setDepositSlip(e.target.files?.[0])}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setDepositOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={depositBusy}>
                {depositBusy ? 'Recording Deposit…' : `Confirm Remittance (${money(inHandTotal)})`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
