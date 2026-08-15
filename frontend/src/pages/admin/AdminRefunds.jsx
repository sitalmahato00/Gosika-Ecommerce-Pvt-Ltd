import React, { useState } from 'react'
import { RotateCcw, CheckCircle2, XCircle, Search, Eye, AlertTriangle } from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { money, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_REFUNDS = [
  { id: 'REF-1042', orderId: 'ORD-8942', customer: 'Aarav Shrestha', vendor: 'Kathmandu Handicrafts', product: 'Pashmina Shawl - Pure Cashmere', amount: 4500, reason: 'Size and color mismatch from description', method: 'Khalti', status: 'pending', date: '2026-08-15' },
  { id: 'REF-1041', orderId: 'ORD-8931', customer: 'Deepak KC', vendor: 'Pokhara Tech Hub', product: 'Wireless ANC Earbuds', amount: 3200, reason: 'Right earbud not charging upon arrival', method: 'eSewa', status: 'approved', date: '2026-08-14' },
  { id: 'REF-1040', orderId: 'ORD-8919', customer: 'Sita Sharma', vendor: 'Himalaya Organics', product: 'Organic Green Tea (500g)', amount: 1200, reason: 'Package seal damaged during shipping', method: 'Bank Transfer', status: 'completed', date: '2026-08-13' },
  { id: 'REF-1039', orderId: 'ORD-8890', customer: 'Rohan Thapa', vendor: 'Everest Apparel', product: 'Down Jacket (XL)', amount: 6800, reason: 'Changed mind after delivery', method: 'Khalti', status: 'rejected', date: '2026-08-12', rejectionReason: 'Item returned without original tags and packaging.' },
]

export default function AdminRefunds() {
  const toast = useToast()
  const [refunds, setRefunds] = useState(SAMPLE_REFUNDS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleApprove = (refId) => {
    setRefunds(refunds.map((r) => r.id === refId ? { ...r, status: 'approved' } : r))
    toast.success(`Refund ${refId} approved successfully`)
    setSelectedRefund(null)
  }

  const handleReject = (e) => {
    e.preventDefault()
    setRefunds(refunds.map((r) => r.id === selectedRefund.id ? { ...r, status: 'rejected', rejectionReason: rejectReason } : r))
    toast.success(`Refund ${selectedRefund.id} rejected`)
    setRejectOpen(false)
    setSelectedRefund(null)
    setRejectReason('')
  }

  const filtered = refunds.filter((r) => {
    const matchesStatus = !statusFilter || r.status === statusFilter
    const matchesSearch = !search ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.orderId.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.toLowerCase().includes(search.toLowerCase()) ||
      r.vendor.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Refunds & Returns Management</h1>
          <p>Review customer return requests, vendor responses, and approve refund dispatches</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {['', 'pending', 'approved', 'completed', 'rejected'].map((st) => (
          <button
            key={st}
            className={`tab ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === '' ? 'All Requests' : st.charAt(0).toUpperCase() + st.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by refund ID, order, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Refund ID</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vendor</th>
              <th>Product</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td><span className="font-semibold">{r.id}</span></td>
                <td><span className="text-primary font-medium">#{r.orderId}</span></td>
                <td className="text-sm font-medium">{r.customer}</td>
                <td className="muted text-sm">{r.vendor}</td>
                <td className="text-sm">{r.product}</td>
                <td><span className="font-bold">{money(r.amount)}</span></td>
                <td><span className="chip chip-sm">{r.method}</span></td>
                <td><StatusBadge status={r.status} /></td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => setSelectedRefund(r)}
                  >
                    <Eye size={12} /> Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedRefund && !rejectOpen && (
        <Modal open={!!selectedRefund} onClose={() => setSelectedRefund(null)} title={`Review Return: ${selectedRefund.id}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 14 }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm">Requested Refund Amount</span>
                <StatusBadge status={selectedRefund.status} />
              </div>
              <div className="font-extrabold text-2xl text-primary">{money(selectedRefund.amount)}</div>
            </div>

            <div style={{ fontSize: 13 }}>
              <div className="mb-2"><strong>Product:</strong> {selectedRefund.product}</div>
              <div className="mb-2"><strong>Order ID:</strong> #{selectedRefund.orderId}</div>
              <div className="mb-2"><strong>Customer:</strong> {selectedRefund.customer}</div>
              <div className="mb-2"><strong>Vendor:</strong> {selectedRefund.vendor}</div>
              <div className="mb-2"><strong>Customer's Reason:</strong> <span className="muted">{selectedRefund.reason}</span></div>
              {selectedRefund.rejectionReason && (
                <div className="alert alert-error mt-2">
                  <strong>Rejection Note:</strong> {selectedRefund.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedRefund.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(selectedRefund.id)}>
                    <CheckCircle2 size={14} /> Approve Refund
                  </button>
                  <button className="btn btn-danger-outline btn-sm" onClick={() => setRejectOpen(true)}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              )}
              <button className="btn btn-outline btn-sm ml-auto" onClick={() => setSelectedRefund(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectOpen && selectedRefund && (
        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={`Reject Refund: ${selectedRefund.id}`}>
          <form onSubmit={handleReject}>
            <div className="form-group">
              <label className="label">Rejection Reason for Customer & Vendor</label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Return window expired or items used/damaged by customer."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger">Confirm Rejection</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
