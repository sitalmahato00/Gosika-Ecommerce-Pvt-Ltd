import React, { useState, useMemo } from 'react'
import {
  RotateCcw, CheckCircle2, XCircle, Search, Eye, AlertTriangle,
  Download, Clock, ShieldCheck, Banknote, Package, Truck,
  MapPin, Phone, User, Store, FileText
} from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_REFUNDS = [
  {
    id: 'REF-1042',
    orderId: 'ORD-2026-98101',
    customer: {
      name: 'Aarav Shrestha',
      phone: '+977 984-1234567',
      city: 'Kathmandu, Bagmati',
    },
    vendor: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      city: 'Biratnagar',
    },
    product: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    sku: 'PASH-CSH-001',
    amount: 4500,
    reason: 'Color tone difference between digital screen and natural weave. Requested return under 7-day satisfaction guarantee.',
    method: 'eSewa Digital Wallet',
    refund_ref: 'ESEWA-REF-992019',
    return_courier: 'Pathao Return Logistics',
    return_tracking: 'PTH-RET-88219',
    status: 'pending',
    date: '2026-08-15',
  },
  {
    id: 'REF-1041',
    orderId: 'ORD-2026-98074',
    customer: {
      name: 'Sita Kumari Rai',
      phone: '+977 986-2123456',
      city: 'Itahari, Koshi',
    },
    vendor: {
      name: 'Eastern Dhaka Textile Weavers',
      city: 'Tehrathum',
    },
    product: 'Authentic Handwoven Koshi Dhaka Saree',
    sku: 'DHK-SRE-004',
    amount: 6200,
    reason: 'Size exchange requested for blouse unstitched fabric; merchant verified return parcel in original box.',
    method: 'Khalti Wallet',
    refund_ref: 'KHALTI-REF-449102',
    return_courier: 'Pathao Return Logistics',
    return_tracking: 'PTH-RET-77104',
    status: 'approved',
    date: '2026-08-14',
  },
  {
    id: 'REF-1040',
    orderId: 'ORD-2026-98092',
    customer: {
      name: 'Prashant Shrestha',
      phone: '+977 981-2345678',
      city: 'Biratnagar, Koshi',
    },
    vendor: {
      name: 'Himalayan Organic Herbs & Tea',
      city: 'Ilam',
    },
    product: 'Organic Ilam Orthodox Black Tea (500g)',
    sku: 'TEA-ILAM-002',
    amount: 1530,
    reason: 'Outer decorative tin had a shipping dent; merchant dispatched fresh replacement and refunded shipping difference.',
    method: 'Fonepay Direct Bank',
    refund_ref: 'FONEPAY-REF-110293',
    return_courier: 'In-City Courier',
    return_tracking: 'LCL-RET-0912',
    status: 'completed',
    date: '2026-08-13',
  },
  {
    id: 'REF-1039',
    orderId: 'ORD-2026-98085',
    customer: {
      name: 'Anil Thapa',
      phone: '+977 985-1098765',
      city: 'Dharan, Koshi',
    },
    vendor: {
      name: 'Lalitpur Heritage Metal & Bronze',
      city: 'Patan',
    },
    product: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    sku: 'BWL-MET-007',
    amount: 3400,
    reason: 'Customer initiated claim after 16 days of delivery with seal tags broken.',
    rejectionReason: 'Exceeded 7-day return policy window and authentic artisan guarantee tag removed.',
    method: 'Khalti Wallet',
    refund_ref: 'N/A',
    return_courier: 'N/A',
    return_tracking: 'N/A',
    status: 'rejected',
    date: '2026-08-12',
  },
]

export default function AdminRefunds() {
  const toast = useToast()
  const [refunds, setRefunds] = useState(SAMPLE_REFUNDS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const handleApprove = (refId) => {
    setActionBusy(true)
    setTimeout(() => {
      setRefunds(prev => prev.map((r) => r.id === refId ? { ...r, status: 'approved' } : r))
      if (selectedRefund?.id === refId) {
        setSelectedRefund(prev => (prev ? { ...prev, status: 'approved' } : null))
      }
      setActionBusy(false)
      toast.success(`Refund claim ${refId} approved: Gateway reversal initiated`)
    }, 500)
  }

  const handleReject = (e) => {
    e.preventDefault()
    if (!selectedRefund) return
    setRefunds(prev => prev.map((r) => r.id === selectedRefund.id ? { ...r, status: 'rejected', rejectionReason: rejectReason } : r))
    toast.success(`Refund claim ${selectedRefund.id} rejected`)
    setRejectOpen(false)
    setSelectedRefund(null)
    setRejectReason('')
  }

  const filtered = useMemo(() => {
    return refunds.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchId = (r.id || '').toLowerCase().includes(q)
        const matchOrder = (r.orderId || '').toLowerCase().includes(q)
        const matchCust = (r.customer?.name || '').toLowerCase().includes(q)
        const matchVendor = (r.vendor?.name || '').toLowerCase().includes(q)
        const matchProd = (r.product || '').toLowerCase().includes(q)
        if (!matchId && !matchOrder && !matchCust && !matchVendor && !matchProd) return false
      }
      return true
    })
  }, [refunds, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Refund ID', 'Order Reference', 'Customer', 'Phone', 'Fulfilling Merchant', 'Product', 'Refund Amount (NPR)', 'Payment Gateway', 'Status', 'Date Filed'],
      ...filtered.map((r) => [
        r.id,
        r.orderId,
        r.customer?.name,
        r.customer?.phone,
        r.vendor?.name,
        r.product,
        r.amount,
        r.method,
        r.status,
        r.date,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_refunds_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Refunds ledger exported to CSV')
  }

  // Aggregate Metrics
  const totalClaims = refunds.length
  const pendingCount = refunds.filter(r => r.status === 'pending').length
  const totalRefunded = refunds.filter(r => r.status === 'completed' || r.status === 'approved').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Refunds, Returns & Dispute Moderation
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review customer return requests, 7-day buyer guarantee compliance, merchant dispute statements, and gateway refund dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Dispute KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Return Claims</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <RotateCcw size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalClaims} Total Filed</div>
          <div className="muted text-xs mt-1">0.31% of marketplace GMV</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: pendingCount > 0 ? '2px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Review</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{pendingCount} Pending</div>
          <div className="muted text-xs mt-1">Awaiting merchant parcel intake</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Disbursed Reversals</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(totalRefunded)}</div>
          <div className="muted text-xs mt-1">Returned to customer wallets</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Resolution SLA</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <ShieldCheck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>24 Hours Avg</div>
          <div className="muted text-xs mt-1">Fast dispute mediation</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Requests (${refunds.length})` },
          { value: 'pending', label: `Pending (${refunds.filter(r => r.status === 'pending').length})` },
          { value: 'approved', label: `Approved (${refunds.filter(r => r.status === 'approved').length})` },
          { value: 'completed', label: `Completed (${refunds.filter(r => r.status === 'completed').length})` },
          { value: 'rejected', label: `Rejected (${refunds.filter(r => r.status === 'rejected').length})` },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search by refund ID, order #, buyer, or vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} return claim{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Order Reference</th>
                <th>Buyer Customer</th>
                <th>Fulfilling Merchant</th>
                <th>Product Item</th>
                <th>Refund Amount</th>
                <th>Gateway Destination</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span
                      className="font-mono font-bold text-primary text-xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedRefund(r)}
                    >
                      {r.id}
                    </span>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{r.date}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-ink" style={{ whiteSpace: 'nowrap' }}>
                      #{r.orderId}
                    </span>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-ink">{r.customer?.name}</div>
                    <div className="muted text-xs flex items-center gap-1" style={{ fontSize: 10 }}>
                      <MapPin size={10} /> {r.customer?.city}
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-xs text-ink">{r.vendor?.name}</div>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{r.vendor?.city}</div>
                  </td>
                  <td>
                    <div className="text-xs font-semibold text-ink line-clamp-1" title={r.product}>{r.product}</div>
                    <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>SKU: {r.sku}</div>
                  </td>
                  <td>
                    <span className="font-bold text-sm text-ink">{money(r.amount)}</span>
                  </td>
                  <td>
                    <span className="chip chip-sm font-semibold" style={{ fontSize: 11 }}>
                      {r.method}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => setSelectedRefund(r)}
                      title="Inspect dispute dossier"
                    >
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRefund && !rejectOpen && (
        <Modal
          open={!!selectedRefund}
          onClose={() => setSelectedRefund(null)}
          title={`Return Claim Dossier: ${selectedRefund.id}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Top Overview */}
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-ink">Requested Refund Amount</span>
                <StatusBadge status={selectedRefund.status} />
              </div>
              <div className="font-black text-3xl text-primary">{money(selectedRefund.amount)}</div>
              <div className="muted text-xs mt-1">Payment Method: <strong>{selectedRefund.method}</strong> · Gateway Ref: <span className="font-mono font-bold text-primary">{selectedRefund.refund_ref}</span></div>
            </div>

            {/* 2-Col Buyer & Return Shipment Details */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <User size={13} color="var(--primary)" /> Buyer Information
                </h4>
                <div className="text-xs">
                  <div className="font-bold text-ink text-sm">{selectedRefund.customer?.name}</div>
                  <div className="muted mt-0.5">Phone: {selectedRefund.customer?.phone}</div>
                  <div className="muted mt-0.5">Location: {selectedRefund.customer?.city}</div>
                  <div className="muted mt-0.5">Order Ref: <span className="font-mono font-bold">#{selectedRefund.orderId}</span></div>
                </div>
              </div>

              <div className="card" style={{ padding: 14, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                  <Truck size={13} color="var(--primary)" /> Return Courier Pickup
                </h4>
                <div className="text-xs">
                  <div className="font-bold text-ink text-sm">{selectedRefund.return_courier}</div>
                  <div className="muted mt-0.5">Tracking Number: <span className="font-mono font-bold text-primary">{selectedRefund.return_tracking}</span></div>
                  <div className="muted mt-0.5">Fulfilling Store: {selectedRefund.vendor?.name}</div>
                </div>
              </div>
            </div>

            {/* Product & Reason */}
            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <FileText size={13} color="var(--primary)" /> Return Justification & Customer Statement
              </h4>
              <div className="text-xs text-ink mb-2">
                <strong>Product:</strong> {selectedRefund.product} (<span className="font-mono">{selectedRefund.sku}</span>)
              </div>
              <p className="text-xs text-ink m-0 p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', lineHeight: 1.5 }}>
                "{selectedRefund.reason}"
              </p>
              {selectedRefund.rejectionReason && (
                <div className="alert alert-error mt-2" style={{ padding: '8px 12px', fontSize: 12 }}>
                  <strong>Admin Rejection Note:</strong> {selectedRefund.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedRefund.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    onClick={() => handleApprove(selectedRefund.id)}
                    disabled={actionBusy}
                  >
                    <CheckCircle2 size={14} /> Approve & Refund to {selectedRefund.method}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm flex items-center gap-1"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle size={14} /> Reject Claim
                  </button>
                </div>
              )}
              <button type="button" className="btn btn-outline btn-sm ml-auto" onClick={() => setSelectedRefund(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectOpen && selectedRefund && (
        <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title={`Reject Refund Claim: ${selectedRefund.id}`}>
          <form onSubmit={handleReject} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Rejection Reason for Customer & Vendor Notification <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Exceeded 7-day return policy window or item tags removed."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRejectOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger btn-sm">Confirm Rejection</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
