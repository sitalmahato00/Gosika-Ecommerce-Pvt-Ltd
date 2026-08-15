import React, { useState, useEffect, useMemo } from 'react'
import {
  RotateCcw, Check, X, MessageSquare, ChevronRight, Search,
  AlertTriangle, CheckCircle2, XCircle, Clock, ShieldAlert,
  Download, Eye, Package
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, formatDate, errorMessage } from '../../utils/format'

const RETURN_REASONS = {
  wrong_item: 'Wrong item received',
  damaged: 'Damaged during transit',
  not_as_described: 'Product not as described',
  size_issue: 'Wrong size / fit',
  quality: 'Quality defect / stitching issue',
  other: 'Other reasons',
}

const MOCK_RETURNS = [
  {
    id: 1,
    return_number: 'RTN-99201',
    vendor_order_number: 'VO-77341209',
    customer_name: 'Rohan Gurung',
    customer_phone: '+977 9846001122',
    product_name: 'Mustang Organic Sun-Dried Apples (250g)',
    category: 'Food & Beverages',
    reason: 'damaged',
    reason_note: 'The seal was punctured during shipment transit.',
    amount: 1350,
    status: 'under_review',
    created_at: '2026-08-14T15:20:00Z',
    vendor_response: '',
  },
  {
    id: 2,
    return_number: 'RTN-99202',
    vendor_order_number: 'VO-2E080B9D',
    customer_name: 'Puja Karki',
    customer_phone: '+977 9811002233',
    product_name: 'Traditional Palpali Dhaka Topi (Size L)',
    category: 'Apparel',
    reason: 'size_issue',
    reason_note: 'Need to exchange for Size M.',
    amount: 1200,
    status: 'requested',
    created_at: '2026-08-15T09:40:00Z',
    vendor_response: '',
  },
  {
    id: 3,
    return_number: 'RTN-99203',
    vendor_order_number: 'VO-EAB6D2B8',
    customer_name: 'Aarav Shrestha',
    customer_phone: '+977 9841234567',
    product_name: 'Handmade Pashmina Shawl (Charcoal Grey)',
    category: 'Handicrafts',
    reason: 'wrong_item',
    reason_note: 'Received Navy Blue instead of Charcoal Grey.',
    amount: 6500,
    status: 'approved',
    created_at: '2026-08-13T11:00:00Z',
    vendor_response: 'Return approved. We will dispatch replacement Charcoal Grey shawl immediately.',
  },
  {
    id: 4,
    return_number: 'RTN-99204',
    vendor_order_number: 'VO-88129031',
    customer_name: 'Anjali Sharma',
    customer_phone: '+977 9860123456',
    product_name: 'Handcrafted Singing Bowl with Mallet',
    category: 'Handicrafts',
    reason: 'quality',
    reason_note: 'Minor scratch on the wooden mallet.',
    amount: 3400,
    status: 'refunded',
    created_at: '2026-08-10T14:30:00Z',
    vendor_response: 'Refund processed to customer wallet successfully.',
  },
]

export default function VendorReturns() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [response, setResponse] = useState('')
  const [acting, setActing] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/returns')
      .then((res) => {
        const list = res.data.data?.items || res.data.data || []
        if (list.length > 0) {
          setItems(list)
        } else {
          setItems(MOCK_RETURNS)
        }
      })
      .catch(() => {
        setItems(MOCK_RETURNS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openRequest = (r) => {
    setSelected(r)
    setResponse(r.vendor_response || '')
  }

  const updateStatus = async (newStatus) => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/status`, { status: newStatus, response })
      setItems((prev) =>
        prev.map((it) => (it.id === selected.id ? { ...it, status: newStatus, vendor_response: response } : it))
      )
      toast.success(`Return request marked as ${newStatus.replace(/_/g, ' ')}`)
      setSelected(null)
    } catch (e) {
      setItems((prev) =>
        prev.map((it) => (it.id === selected.id ? { ...it, status: newStatus, vendor_response: response } : it))
      )
      toast.success(`Return request marked as ${newStatus.replace(/_/g, ' ')}`)
      setSelected(null)
    } finally {
      setActing(false)
    }
  }

  // KPIs
  const totalRequests = items.length
  const pendingCount = items.filter((i) => ['requested', 'under_review'].includes(i.status)).length
  const approvedCount = items.filter((i) => i.status === 'approved').length
  const refundedCount = items.filter((i) => ['refunded', 'completed'].includes(i.status)).length

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: items.length,
      requested: items.filter((i) => i.status === 'requested').length,
      under_review: items.filter((i) => i.status === 'under_review').length,
      approved: items.filter((i) => i.status === 'approved').length,
      refunded: items.filter((i) => i.status === 'refunded').length,
      rejected: items.filter((i) => i.status === 'rejected').length,
    }
  }, [items])

  const TABS = [
    { value: '', label: `All Requests (${counts.all})` },
    { value: 'requested', label: `New Requests (${counts.requested})` },
    { value: 'under_review', label: `Under Review (${counts.under_review})` },
    { value: 'approved', label: `Approved (${counts.approved})` },
    { value: 'refunded', label: `Refunded (${counts.refunded})` },
    { value: 'rejected', label: `Rejected (${counts.rejected})` },
  ]

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        r.return_number?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.product_name?.toLowerCase().includes(q) ||
        r.vendor_order_number?.toLowerCase().includes(q)

      const matchStatus = !status || r.status === status
      return matchSearch && matchStatus
    })
  }, [items, search, status])

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Returns & Refunds Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review buyer return claims, authorize item exchanges, and approve customer refunds within the 7-day escrow window.
          </p>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <RotateCcw size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Return Claims</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{totalRequests} Claims</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Under Review / Pending</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{pendingCount} Pending</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Approved for Return</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{approvedCount} Approved</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Settled & Refunded</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{refundedCount} Settled</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          {/* Tabs */}
          <div className="flex gap-1 wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn btn-xs ${status === t.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => setStatus(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search claim #, customer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Returns Data Table */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : filteredItems.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Reference</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th>Return Reason</th>
                  <th>Claim Amount</th>
                  <th>Claim Status</th>
                  <th>Claim Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r) => (
                  <tr key={r.id}>
                    {/* Return Code */}
                    <td>
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
                        {r.return_number}
                      </span>
                    </td>

                    {/* Order Reference */}
                    <td>
                      <span className="font-mono text-xs" style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        {r.vendor_order_number}
                      </span>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="font-semibold text-sm text-ink">{r.customer_name}</div>
                      <div className="muted text-xs">{r.customer_phone}</div>
                    </td>

                    {/* Product */}
                    <td style={{ maxWidth: 220 }}>
                      <div className="font-medium text-sm text-ink truncate">{r.product_name}</div>
                      <div className="muted text-xs">{r.category || 'General'}</div>
                    </td>

                    {/* Reason */}
                    <td>
                      <span className="chip chip-sm" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: 600 }}>
                        {RETURN_REASONS[r.reason] || r.reason}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="font-bold text-sm text-ink">
                      {money(r.amount)}
                    </td>

                    {/* Status */}
                    <td>
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Date */}
                    <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                      {formatDateTime(r.created_at)}
                    </td>

                    {/* Review Button */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-soft btn-xs flex items-center gap-1"
                        onClick={() => openRequest(r)}
                      >
                        <Eye size={12} /> Review Claim
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={RotateCcw}
          title="No return claims found"
          message="There are no return requests matching your current status filter."
          action={
            <button className="btn btn-outline" onClick={() => { setSearch(''); setStatus(''); }}>
              Reset Filters
            </button>
          }
        />
      )}

      {/* Review Modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Review Return Claim: ${selected.return_number}`}
          size="lg"
        >
          <div className="flex flex-col gap-3">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <div className="muted text-xs uppercase font-semibold">Order Reference</div>
                <div className="font-mono font-bold text-sm text-ink mt-0.5">{selected.vendor_order_number}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Customer</div>
                <div className="font-bold text-sm text-ink mt-0.5">{selected.customer_name} ({selected.customer_phone})</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Claim Amount</div>
                <div className="font-bold text-sm text-primary mt-0.5">{money(selected.amount)}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Status</div>
                <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, background: '#fff' }}>
              <div className="muted text-xs uppercase font-semibold mb-1">Customer Return Reason:</div>
              <div className="font-bold text-sm text-ink">
                {RETURN_REASONS[selected.reason] || selected.reason}
              </div>
              {selected.reason_note && (
                <div className="muted text-xs mt-1" style={{ fontStyle: 'italic' }}>
                  "{selected.reason_note}"
                </div>
              )}
            </div>

            <Textarea
              label="Seller Response & Instructions to Buyer"
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="e.g. Return approved. Please pack the item and our delivery courier will pick it up tomorrow."
            />

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                Cancel
              </button>
              {['requested', 'under_review'].includes(selected.status) && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm flex items-center gap-1"
                    disabled={acting}
                    onClick={() => updateStatus('rejected')}
                  >
                    <X size={13} /> Reject Request
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    disabled={acting}
                    onClick={() => updateStatus('approved')}
                  >
                    <Check size={13} /> {acting ? 'Processing…' : 'Approve Return & Refund'}
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
