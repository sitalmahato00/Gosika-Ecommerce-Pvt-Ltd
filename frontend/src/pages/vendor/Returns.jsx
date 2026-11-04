import React, { useState } from 'react'
import {
  RotateCcw, Check, X, Eye, Search, Clock,
  CheckCircle2, Package, Truck, Upload, AlertCircle, FileText, Video, Image as ImageIcon
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, errorMessage, apiImage } from '../../utils/format'

const RETURN_REASONS = {
  wrong_item: 'Wrong item received',
  damaged: 'Damaged during transit',
  not_as_described: 'Product not as described',
  size_fit: 'Wrong size / fit',
  quality_issue: 'Quality defect / stitching issue',
  changed_mind: 'Customer changed mind',
  other: 'Other reasons',
}

const TABS = [
  { value: '', label: 'All Requests' },
  { value: 'requested', label: 'New Claims' },
  { value: 'approved', label: 'Approved' },
  { value: 'pickup_arranged', label: 'Pickup Arranged' },
  { value: 'collected', label: 'Collected' },
  { value: 'inspected', label: 'Inspected' },
  { value: 'replacement_dispatched', label: 'Replacement Sent' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'completed', label: 'Completed' },
]

export default function VendorReturns() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [acting, setActing] = useState(false)

  // Sub-actions in modal
  const [actionTab, setActionTab] = useState('review') // 'review' | 'inspect' | 'dispatch' | 'status'
  const [reviewNotes, setReviewNotes] = useState('')
  const [returnMethod, setReturnMethod] = useState('pickup')
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  // Inspection form
  const [inspectionCondition, setInspectionCondition] = useState('good')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [inspectionPhotos, setInspectionPhotos] = useState([])

  // Dispatch form
  const [dispatchNotes, setDispatchNotes] = useState('')

  // General status update
  const [nextStatus, setNextStatus] = useState('')

  const fetchReturns = (page, pageSize) =>
    api.get('/vendor/returns', { params: { status, search, page, per_page: pageSize } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchReturns, {
    pageSize: 10,
    deps: [status, search],
  })

  const changeStatus = (value) => {
    setPage(1)
    setStatus(value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const openRequest = async (r) => {
    setSelected(r)
    setReviewNotes(r.review_notes || '')
    setReturnMethod(r.return_method || 'pickup')
    setPickupInstructions(r.pickup_instructions || 'Package will be collected by courier within 24-48 business hours.')
    setInspectionCondition(r.inspection_condition || 'good')
    setInspectionNotes(r.inspection_notes || '')
    setDispatchNotes('')
    setNextStatus(r.status)

    if (['requested', 'under_review'].includes(r.status)) {
      setActionTab('review')
    } else if (r.status === 'collected') {
      setActionTab('inspect')
    } else if (r.status === 'inspected' && r.request_type === 'replacement') {
      setActionTab('dispatch')
    } else {
      setActionTab('review')
    }

    try {
      const res = await api.get(`/vendor/returns/${r.id}`)
      if (res.data?.data) {
        setSelected(res.data.data)
      }
    } catch {
      // Keep existing data
    }
  }

  // Action 1: Approve return
  const handleApprove = async () => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/approve`, {
        notes: reviewNotes || 'Approved by seller',
        return_method: returnMethod,
        pickup_instructions: pickupInstructions,
      })
      toast.success('Return claim approved. Return logistics communicated to buyer.')
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  // Action 2: Reject return
  const handleReject = async () => {
    if (!selected) return
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason.')
      return
    }
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/reject`, {
        reason: rejectReason.trim(),
      })
      toast.success('Return claim rejected.')
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  // Action 3: Mark product collected
  const handleMarkCollected = async () => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/collect`, {
        notes: 'Product safely received by seller',
      })
      toast.success('Product marked as collected. You can now perform inspection.')
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  // Action 4: Submit inspection
  const handleInspect = async (e) => {
    e.preventDefault()
    if (!selected) return
    if (!inspectionNotes.trim()) {
      toast.error('Please add inspection observation notes.')
      return
    }

    setActing(true)
    try {
      const formData = new FormData()
      formData.append('condition', inspectionCondition)
      formData.append('notes', inspectionNotes.trim())
      inspectionPhotos.forEach((p) => formData.append('inspection_photos[]', p))

      await api.post(`/vendor/returns/${selected.id}/inspect`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Inspection record saved successfully.')
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  // Action 5: Dispatch replacement
  const handleDispatchReplacement = async () => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/replacement/dispatch`, {
        notes: dispatchNotes || 'Replacement product dispatched via express courier',
      })
      toast.success('Replacement product marked as dispatched.')
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  // Fallback: Generic status update
  const handleUpdateStatus = async () => {
    if (!selected) return
    setActing(true)
    try {
      await api.post(`/vendor/returns/${selected.id}/status`, {
        status: nextStatus,
        response: reviewNotes,
      })
      toast.success(`Return status updated to ${nextStatus.replace(/_/g, ' ')}.`)
      setSelected(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setActing(false)
    }
  }

  const totalRequests = meta.total
  const pendingCount = items.filter((i) => ['requested', 'under_review'].includes(i.status)).length
  const collectedCount = items.filter((i) => i.status === 'collected').length
  const inspectedCount = items.filter((i) => i.status === 'inspected').length

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Returns & Exchanges Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review buyer return claims, arrange pickups, record product inspections, and dispatch replacements.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
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
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>New / Under Review</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{pendingCount} Pending</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <Package size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Awaiting Inspection</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{collectedCount} Items</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Inspected / Ready</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{inspectedCount} Items</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn btn-xs ${status === t.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => changeStatus(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={applySearch} style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search claim #, product…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Reference</th>
                  <th>Type</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8}><Skeleton height={28} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : items.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Claim Reference</th>
                  <th>Type</th>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Item Details</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
                        {r.return_number}
                      </span>
                    </td>

                    <td>
                      <span className="chip chip-sm" style={{ fontWeight: 700, fontSize: 11 }}>
                        {r.request_type_label || r.request_type?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-xs" style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                        #{r.order_number || '—'}
                      </span>
                    </td>

                    <td>
                      <div className="font-semibold text-sm text-ink">{r.customer?.full_name || '—'}</div>
                      <div className="muted text-xs">{r.customer?.phone || r.customer?.email || ''}</div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <div className="flex items-center gap-2">
                        {r.product_image && (
                          <img
                            src={apiImage(r.product_image)}
                            alt={r.product_name || 'Product'}
                            style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div className="truncate">
                          <div className="font-medium text-sm text-ink truncate">{r.product_name || '—'}</div>
                          <div className="muted text-xs">Qty: {r.quantity}</div>
                        </div>
                      </div>
                    </td>

                    <td className="font-bold text-sm text-ink">
                      {money(r.refund_amount)}
                    </td>

                    <td>
                      <StatusBadge status={r.status} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-soft btn-xs flex items-center gap-1"
                        onClick={() => openRequest(r)}
                      >
                        <Eye size={12} /> Process Claim
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
            <button
              className="btn btn-outline"
              onClick={() => {
                setSearchInput('')
                setSearch('')
                changeStatus('')
              }}
            >
              Reset Filters
            </button>
          }
        />
      )}

      {items.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SELLER ACTION MODAL                                                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`Process Return / Exchange Claim: ${selected.return_number}`}
          size="lg"
        >
          <div className="flex flex-col gap-3">
            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div>
                <div className="muted text-xs uppercase font-semibold">Request Type</div>
                <div className="font-bold text-sm text-ink mt-0.5">
                  {selected.request_type_label || selected.request_type}
                </div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Order / Customer</div>
                <div className="font-bold text-sm text-ink mt-0.5">#{selected.order_number}</div>
                <div className="muted text-xs">{selected.customer?.full_name}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Amount</div>
                <div className="font-bold text-sm text-primary mt-0.5">{money(selected.refund_amount)}</div>
              </div>
              <div>
                <div className="muted text-xs uppercase font-semibold">Current Status</div>
                <div className="mt-0.5"><StatusBadge status={selected.status} /></div>
              </div>
            </div>

            {/* Product & Claim */}
            <div className="card" style={{ padding: 14 }}>
              <div className="flex items-center gap-3">
                {selected.product_image && (
                  <img
                    src={apiImage(selected.product_image)}
                    alt={selected.product_name}
                    style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                  />
                )}
                <div>
                  <div className="font-bold text-sm text-ink">{selected.product_name}</div>
                  <div className="muted text-xs">Quantity: {selected.quantity}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)' }}>
                <div><strong>Reason:</strong> {RETURN_REASONS[selected.reason_type] || selected.reason_type}</div>
                <div className="mt-1"><strong>Buyer's Problem Description:</strong> "{selected.reason}"</div>
                {selected.preferred_resolution && (
                  <div className="mt-1"><strong>Buyer's Preferred Resolution:</strong> {selected.preferred_resolution}</div>
                )}
              </div>

              {/* Media Proof Preview */}
              {selected.media?.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="muted text-xs uppercase font-bold mb-1.5">Buyer Uploaded Evidence:</div>
                  <div className="flex gap-2 wrap">
                    {selected.media.map((m) => (
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}
                      >
                        {m.type === 'video' ? (
                          <div style={{ width: 60, height: 60, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={18} />
                          </div>
                        ) : (
                          <img src={m.url} alt="Proof" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Action Steps */}
            <div className="card" style={{ padding: 14, background: '#fafafa', border: '1.5px solid var(--border)' }}>
              <div className="flex gap-2 mb-3 wrap">
                {['requested', 'under_review'].includes(selected.status) && (
                  <button
                    type="button"
                    className={`btn btn-xs ${actionTab === 'review' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActionTab('review')}
                  >
                    1. Review & Approve / Reject
                  </button>
                )}

                {['approved', 'pickup_arranged'].includes(selected.status) && (
                  <button
                    type="button"
                    className="btn btn-primary btn-xs flex items-center gap-1"
                    disabled={acting}
                    onClick={handleMarkCollected}
                  >
                    <Package size={13} /> Mark Received by Seller
                  </button>
                )}

                {selected.status === 'collected' && (
                  <button
                    type="button"
                    className={`btn btn-xs ${actionTab === 'inspect' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActionTab('inspect')}
                  >
                    2. Record Product Inspection
                  </button>
                )}

                {selected.status === 'inspected' && selected.request_type === 'replacement' && (
                  <button
                    type="button"
                    className={`btn btn-xs ${actionTab === 'dispatch' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActionTab('dispatch')}
                  >
                    3. Dispatch Replacement Product
                  </button>
                )}

                <button
                  type="button"
                  className={`btn btn-xs ${actionTab === 'status' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setActionTab('status')}
                >
                  Manual Status
                </button>
              </div>

              {/* Tab: Review */}
              {actionTab === 'review' && ['requested', 'under_review'].includes(selected.status) && (
                <div className="flex flex-col gap-3">
                  <div className="form-row">
                    <Select
                      label="Return Method"
                      value={returnMethod}
                      onChange={(e) => setReturnMethod(e.target.value)}
                    >
                      <option value="pickup">Courier Pickup (Courier collects from customer)</option>
                      <option value="drop_off">Self Drop-off (Customer drops at hub)</option>
                    </Select>
                  </div>

                  <Textarea
                    label="Instructions & Next Steps for Buyer"
                    rows={2}
                    value={pickupInstructions}
                    onChange={(e) => setPickupInstructions(e.target.value)}
                    placeholder="Instructions for packing and pickup schedule…"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input"
                        style={{ height: 32, fontSize: 12, width: 220 }}
                        placeholder="Rejection reason (if rejecting)…"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-danger-outline btn-sm flex items-center gap-1"
                        disabled={acting || !rejectReason.trim()}
                        onClick={handleReject}
                      >
                        <X size={13} /> Reject Claim
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      icon={Check}
                      disabled={acting}
                      onClick={handleApprove}
                    >
                      Approve & Arrange Pickup
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab: Inspect */}
              {actionTab === 'inspect' && selected.status === 'collected' && (
                <form onSubmit={handleInspect} className="flex flex-col gap-3">
                  <div className="muted text-xs uppercase font-bold" style={{ color: 'var(--primary)' }}>
                    Record Inspection Findings
                  </div>

                  <div className="form-row">
                    <Select
                      label="Product Received Condition *"
                      value={inspectionCondition}
                      onChange={(e) => setInspectionCondition(e.target.value)}
                    >
                      <option value="good">Good Condition (Unused, all tags/box intact)</option>
                      <option value="defective">Defective / Manufacturing Fault confirmed</option>
                      <option value="damaged">Damaged / Broken by shipping or handling</option>
                      <option value="missing_parts">Missing Parts / Incomplete accessories</option>
                    </Select>
                  </div>

                  <Textarea
                    label="Inspection Observations & Notes *"
                    required
                    rows={3}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    placeholder="Describe condition of packaging, seal status, and test observations…"
                  />

                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>
                      Inspection Photos (Optional)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setInspectionPhotos(Array.from(e.target.files || []))}
                      style={{ fontSize: 12 }}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" icon={Check} disabled={acting}>
                      Complete Inspection
                    </Button>
                  </div>
                </form>
              )}

              {/* Tab: Dispatch Replacement */}
              {actionTab === 'dispatch' && selected.status === 'inspected' && selected.request_type === 'replacement' && (
                <div className="flex flex-col gap-3">
                  <div className="muted text-xs uppercase font-bold" style={{ color: 'var(--primary)' }}>
                    Dispatch Replacement Product
                  </div>
                  <Textarea
                    label="Dispatch Notes & Tracking Info"
                    rows={2}
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    placeholder="Enter courier name, tracking number, or dispatch date…"
                  />
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      icon={Truck}
                      disabled={acting}
                      onClick={handleDispatchReplacement}
                    >
                      Confirm Replacement Dispatched
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab: Manual Status */}
              {actionTab === 'status' && (
                <div className="flex flex-col gap-3">
                  <Select
                    label="Override Status"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                  >
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="pickup_arranged">Pickup Arranged</option>
                    <option value="collected">Collected</option>
                    <option value="inspected">Inspected</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </Select>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="primary"
                      disabled={acting || nextStatus === selected.status}
                      onClick={handleUpdateStatus}
                    >
                      Save Status
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
