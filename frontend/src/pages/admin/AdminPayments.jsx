import React, { useState, useMemo } from 'react'
import {
  CreditCard, Search, CheckCircle2, XCircle, Clock, RotateCcw,
  AlertTriangle, Eye, ShieldCheck, Download, DollarSign, Wallet, ArrowUpRight
} from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { money, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_PAYMENTS = [
  { id: 'TXN-90281', orderId: 'ORD-8942', customer: 'Aarav Shrestha', provider: 'Khalti', amount: 4500, fee: 90, status: 'paid', reference: 'KHL-98234190', date: '2026-08-15 11:15' },
  { id: 'TXN-90280', orderId: 'ORD-8941', customer: 'Bikash Tamang', provider: 'Cash on Delivery', amount: 2800, fee: 0, status: 'pending', reference: 'COD-N/A', date: '2026-08-15 10:48' },
  { id: 'TXN-90279', orderId: 'ORD-8940', customer: 'Suman Rai', provider: 'eSewa', amount: 12500, fee: 250, status: 'paid', reference: 'ESW-84729104', date: '2026-08-15 09:30' },
  { id: 'TXN-90278', orderId: 'ORD-8939', customer: 'Anita Adhikari', provider: 'Khalti', amount: 6200, fee: 0, status: 'failed', reference: 'KHL-ERR-301', date: '2026-08-15 08:20', failureReason: 'Insufficient wallet balance' },
  { id: 'TXN-90277', orderId: 'ORD-8938', customer: 'Deepak KC', provider: 'Fonepay', amount: 8900, fee: 178, status: 'paid', reference: 'FP-74829104', date: '2026-08-14 18:10' },
  { id: 'TXN-90276', orderId: 'ORD-8937', customer: 'Pooja Thapa', provider: 'Khalti', amount: 3400, fee: 68, status: 'refunded', reference: 'KHL-REF-1092', date: '2026-08-14 15:45' },
  { id: 'TXN-90275', orderId: 'ORD-8936', customer: 'Rohan Sharma', provider: 'eSewa', amount: 9600, fee: 192, status: 'paid', reference: 'ESW-84729088', date: '2026-08-14 12:20' },
  { id: 'TXN-90274', orderId: 'ORD-8935', customer: 'Sunita Gurung', provider: 'Cash on Delivery', amount: 3100, fee: 0, status: 'paid', reference: 'COD-SETTLED', date: '2026-08-14 09:15' },
]

const GATEWAY_STYLES = {
  'Khalti': { bg: 'rgba(92, 45, 145, 0.12)', color: '#5c2d91', border: 'rgba(92, 45, 145, 0.3)' },
  'eSewa': { bg: 'rgba(96, 187, 70, 0.12)', color: '#2e7d32', border: 'rgba(96, 187, 70, 0.3)' },
  'Fonepay': { bg: 'rgba(211, 47, 47, 0.12)', color: '#d32f2f', border: 'rgba(211, 47, 47, 0.3)' },
  'Cash on Delivery': { bg: 'rgba(30, 41, 59, 0.08)', color: '#1e293b', border: 'rgba(30, 41, 59, 0.2)' },
}

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

  const exportCSV = () => {
    const rows = [
      ['Transaction ID', 'Order ID', 'Customer', 'Gateway', 'Amount (NPR)', 'Fee (NPR)', 'Gateway Reference', 'Status', 'Date & Time'],
      ...payments.map((p) => [p.id, p.orderId, p.customer, p.provider, p.amount, p.fee, p.reference, p.status, p.date])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_payments_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Payment transactions exported to CSV')
  }

  const totals = useMemo(() => {
    const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0)
    const paidVolume = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
    const pendingVolume = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    const refundVolume = payments.filter(p => p.status === 'refunded').reduce((sum, p) => sum + p.amount, 0)
    return { totalVolume, paidVolume, pendingVolume, refundVolume }
  }, [payments])

  const filtered = payments.filter((p) => {
    const matchesProvider = !providerFilter || p.provider.toLowerCase() === providerFilter.toLowerCase()
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
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Payment & Gateway Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor transactions, settlements, and refunds across Cash on Delivery, Khalti, eSewa, and Fonepay.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Volume</span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-ink">{money(totals.totalVolume)}</div>
          <span className="muted text-xs mt-1 block">{payments.length} transactions processed</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Settled / Paid</span>
            <CheckCircle2 size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-success">{money(totals.paidVolume)}</div>
          <span className="muted text-xs mt-1 block">Successfully captured</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Pending COD</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-warning">{money(totals.pendingVolume)}</div>
          <span className="muted text-xs mt-1 block">Awaiting delivery handover</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Refunds</span>
            <RotateCcw size={16} color="var(--danger)" />
          </div>
          <div className="font-extrabold text-xl mt-1 text-danger">{money(totals.refundVolume)}</div>
          <span className="muted text-xs mt-1 block">Returned to buyer wallets</span>
        </div>
      </div>

      {/* Gateway Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={`tab ${providerFilter === '' ? 'active' : ''}`}
          onClick={() => setProviderFilter('')}
        >
          All Gateways ({payments.length})
        </button>
        {['Khalti', 'Cash on Delivery', 'eSewa', 'Fonepay'].map((g) => {
          const count = payments.filter(p => p.provider.toLowerCase() === g.toLowerCase()).length
          return (
            <button
              key={g}
              className={`tab ${providerFilter.toLowerCase() === g.toLowerCase() ? 'active' : ''}`}
              onClick={() => setProviderFilter(g)}
            >
              {g} ({count})
            </button>
          )
        })}
      </div>

      {/* Search & Filter Row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
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
            {filtered.map((p) => {
              const gwStyle = GATEWAY_STYLES[p.provider] || { bg: 'var(--bg)', color: 'var(--ink)', border: 'var(--border)' }
              return (
                <tr key={p.id}>
                  <td>
                    <span className="font-bold text-sm text-ink">{p.id}</span>
                  </td>
                  <td>
                    <span className="font-semibold text-primary">#{p.orderId}</span>
                  </td>
                  <td className="text-sm font-medium text-ink">{p.customer}</td>
                  <td>
                    <span
                      className="chip chip-sm"
                      style={{
                        background: gwStyle.bg,
                        color: gwStyle.color,
                        border: `1px solid ${gwStyle.border}`,
                        fontWeight: 700
                      }}
                    >
                      {p.provider}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-ink text-sm">{money(p.amount)}</span>
                  </td>
                  <td className="muted text-xs font-mono">{p.reference}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="muted text-xs font-mono">{p.date}</td>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <Modal open={!!selectedTxn} onClose={() => setSelectedTxn(null)} title={`Transaction: ${selectedTxn.id}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="muted text-xs uppercase font-semibold">Payment Status</span>
                <StatusBadge status={selectedTxn.status} />
              </div>
              <div className="font-extrabold text-2xl text-primary">{money(selectedTxn.amount)}</div>
              <div className="muted text-xs mt-1">Platform Processing Fee: {money(selectedTxn.fee || 0)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span className="muted text-xs block">Order ID</span>
                <span className="font-semibold text-primary">#{selectedTxn.orderId}</span>
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

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedTxn(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundOpen && (
        <Modal open={!!refundOpen} onClose={() => setRefundOpen(null)} title={`Process Refund: ${refundOpen.id}`}>
          <form onSubmit={handleRefund} className="flex flex-col gap-3">
            <p className="text-sm muted m-0">
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
                placeholder="e.g. Order cancelled by customer or defective item returned."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRefundOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-danger btn-sm">Confirm & Process Refund</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
