import React, { useState } from 'react'
import { CreditCard, Search, CheckCircle2, XCircle, Clock, RotateCcw, AlertTriangle, Eye, ShieldCheck, Download } from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { money, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_PAYMENTS = [
  { id: 'TXN-90281', orderId: 'ORD-8942', customer: 'Aarav Shrestha', provider: 'Khalti', amount: 4500, status: 'paid', reference: 'KHL-98234190', date: '2026-08-15 11:15' },
  { id: 'TXN-90280', orderId: 'ORD-8941', customer: 'Bikash Tamang', provider: 'Cash on Delivery', amount: 2800, status: 'pending', reference: 'COD-N/A', date: '2026-08-15 10:48' },
  { id: 'TXN-90279', orderId: 'ORD-8940', customer: 'Suman Rai', provider: 'eSewa', amount: 12500, status: 'paid', reference: 'ESW-84729104', date: '2026-08-15 09:30' },
  { id: 'TXN-90278', orderId: 'ORD-8939', customer: 'Anita Adhikari', provider: 'Khalti', amount: 6200, status: 'failed', reference: 'KHL-ERR-301', date: '2026-08-15 08:20', failureReason: 'Insufficient wallet balance' },
  { id: 'TXN-90277', orderId: 'ORD-8938', customer: 'Deepak KC', provider: 'Fonepay', amount: 8900, status: 'paid', reference: 'FP-74829104', date: '2026-08-14 18:10' },
  { id: 'TXN-90276', orderId: 'ORD-8937', customer: 'Pooja Thapa', provider: 'Khalti', amount: 3400, status: 'refunded', reference: 'KHL-REF-1092', date: '2026-08-14 15:45' },
]

export default function AdminPayments() {
  const toast = useToast()
  const [payments, setPayments] = useState(SAMPLE_PAYMENTS)
  const [providerFilter, setProviderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTxn, setSelectedTxn] = useState(null)
  const [refundOpen, setRefundOpen] = useState(null)
  const [refundReason, setRefundReason] = useState('')

  const handleRefund = (e) => {
    e.preventDefault()
    setPayments(payments.map((p) => p.id === refundOpen.id ? { ...p, status: 'refunded' } : p))
    toast.success(`Refund of ${money(refundOpen.amount)} processed via ${refundOpen.provider}`)
    setRefundOpen(null)
    setRefundReason('')
  }

  const filtered = payments.filter((p) => {
    const matchesProvider = !providerFilter || p.provider.toLowerCase().includes(providerFilter.toLowerCase())
    const matchesStatus = !statusFilter || p.status === statusFilter
    const matchesSearch = !search ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase())
    return matchesProvider && matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payment & Gateway Management</h1>
          <p>Monitor transactions across Cash on Delivery, Khalti, eSewa, and Fonepay</p>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by Txn ID, Order, or Reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
        >
          <option value="">All Gateways</option>
          <option value="Cash on Delivery">Cash on Delivery (COD)</option>
          <option value="Khalti">Khalti</option>
          <option value="eSewa">eSewa</option>
          <option value="Fonepay">Fonepay</option>
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Gateway</th>
              <th>Amount</th>
              <th>Gateway Ref</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="font-semibold text-ink">{p.id}</span>
                </td>
                <td>
                  <span className="font-medium text-primary">#{p.orderId}</span>
                </td>
                <td className="text-sm font-medium">{p.customer}</td>
                <td>
                  <span className="chip chip-sm">{p.provider}</span>
                </td>
                <td>
                  <span className="font-bold text-ink">{money(p.amount)}</span>
                </td>
                <td className="muted text-xs font-mono">{p.reference}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="muted text-xs">{p.date}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setSelectedTxn(p)}
                    >
                      <Eye size={12} /> Details
                    </button>
                    {p.status === 'paid' && (
                      <button
                        className="btn btn-danger-outline btn-xs"
                        onClick={() => setRefundOpen(p)}
                      >
                        <RotateCcw size={12} /> Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal open={!!selectedTxn} onClose={() => setSelectedTxn(null)} title={`Transaction: ${selectedTxn.id}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 14 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="muted text-xs uppercase font-semibold">Payment Status</span>
                <StatusBadge status={selectedTxn.status} />
              </div>
              <div className="font-extrabold text-2xl text-primary">{money(selectedTxn.amount)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span className="muted text-xs block">Order ID</span>
                <span className="font-semibold">#{selectedTxn.orderId}</span>
              </div>
              <div>
                <span className="muted text-xs block">Payment Method</span>
                <span className="font-semibold">{selectedTxn.provider}</span>
              </div>
              <div>
                <span className="muted text-xs block">Customer Name</span>
                <span className="font-semibold">{selectedTxn.customer}</span>
              </div>
              <div>
                <span className="muted text-xs block">Gateway Reference</span>
                <span className="font-mono text-xs">{selectedTxn.reference}</span>
              </div>
            </div>

            {selectedTxn.failureReason && (
              <div className="alert alert-error" style={{ margin: 0, fontSize: 13 }}>
                <strong>Failure Reason:</strong> {selectedTxn.failureReason}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedTxn(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundOpen && (
        <Modal open={!!refundOpen} onClose={() => setRefundOpen(null)} title={`Refund Payment ${refundOpen.id}`}>
          <form onSubmit={handleRefund}>
            <p className="text-sm muted mb-3">
              You are about to issue a refund of <strong>{money(refundOpen.amount)}</strong> to customer <strong>{refundOpen.customer}</strong> via {refundOpen.provider}.
            </p>
            <div className="form-group">
              <label className="label">Refund Reason</label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Order cancelled by customer or product unavailable."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setRefundOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-danger">Confirm & Process Refund</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
