import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  RotateCcw, Plus, Search, X, CheckCircle2, AlertCircle,
  Truck, ArrowRight, ShieldCheck, RefreshCw, Upload, FileText,
  Clock, Package, Image as ImageIcon, Video, HelpCircle, ChevronRight
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, formatDateTime, errorMessage, apiImage } from '../../utils/format'
import { AccountPage } from './AccountUI'

const REQUEST_TYPES = [
  {
    id: 'return_refund',
    title: 'Return & Refund',
    desc: 'Return the product and receive a full money refund.',
    badge: 'Refund',
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    id: 'exchange',
    title: 'Exchange for Another Product',
    desc: 'Exchange for a different size, color, or alternative item.',
    badge: 'Exchange',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    id: 'replacement',
    title: 'Replacement for Damaged / Defective',
    desc: 'Receive a brand new replacement unit for damaged or broken items.',
    badge: 'Replacement',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fed7aa',
  },
]

const RETURN_REASON_OPTIONS = [
  { value: 'damaged', label: 'Damaged or broken during transit' },
  { value: 'quality_issue', label: 'Defective / Not functioning / Quality issue' },
  { value: 'wrong_item', label: 'Received wrong product or wrong variant' },
  { value: 'not_as_described', label: 'Product does not match photos or description' },
  { value: 'size_fit', label: 'Size or fit does not match (Apparel / Footwear)' },
  { value: 'changed_mind', label: 'Changed my mind / No longer needed' },
  { value: 'other', label: 'Other problem (explain below)' },
]

const STATUS_TABS = [
  { value: '', label: 'All Requests' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'pickup_arranged', label: 'Pickup Arranged' },
  { value: 'collected', label: 'Collected' },
  { value: 'inspected', label: 'Inspected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const RESOLUTION_PRESETS = {
  return_refund: [
    'Refund to original payment method (eSewa / Khalti / Bank)',
    'Refund to Gosika Customer Wallet / Store Credit',
  ],
  exchange: [
    'Exchange for a different size (specify size in notes)',
    'Exchange for a different color (specify color in notes)',
    'Exchange for another product of equal value',
  ],
  replacement: [
    'Dispatch identical new replacement unit immediately after inspection',
    'Replace damaged parts / missing accessories only',
  ],
}

const EMPTY_RETURN_FORM = {
  order_id: '',
  order_item_id: '',
  request_type: 'return_refund',
  quantity: 1,
  reason_type: 'damaged',
  reason: '',
  preferred_resolution: 'Refund to original payment method (eSewa / Khalti / Bank)',
  return_method: 'pickup',
}

export default function Returns() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const addMediaInputRef = useRef(null)

  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  // Modals & Drawers
  const [requestOpen, setRequestOpen] = useState(false)
  const [selectedReturn, setSelectedReturn] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  // Orders for creation
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM)
  const [mediaFiles, setMediaFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [uploadingMore, setUploadingMore] = useState(false)

  // List fetcher
  const fetcher = useCallback(
    (page, pageSize) => api.get('/customer/returns', { params: { status, search, page, per_page: pageSize } }),
    [status, search],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { pageSize: 10, deps: [status, search] })

  // Auto-open modal if URL has ?order_id=...
  useEffect(() => {
    const urlOrderId = searchParams.get('order_id')
    const urlItemId = searchParams.get('item_id')
    if (urlOrderId) {
      openRequestModal(urlOrderId, urlItemId)
    }
  }, [searchParams])

  const changeStatus = (value) => {
    setPage(1)
    setStatus(value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const openRequestModal = (prefillOrderId = '', prefillItemId = '') => {
    setReturnForm({
      ...EMPTY_RETURN_FORM,
      order_id: prefillOrderId || '',
      order_item_id: prefillItemId || '',
    })
    setMediaFiles([])
    setOrdersLoading(true)

    api.get('/orders', { params: { per_page: 50 }, skipCache: true })
      .then((r) => {
        const list = api.unwrapList(r.data)
        setOrders(list)
        if (prefillOrderId) {
          const matched = list.find((o) => o.id === prefillOrderId || o.order_number === prefillOrderId)
          if (matched) {
            const firstItem = prefillItemId
              ? matched.items?.find((i) => i.id === prefillItemId)
              : matched.items?.[0]
            setReturnForm((prev) => ({
              ...prev,
              order_id: matched.id,
              order_item_id: firstItem?.id || '',
              quantity: firstItem?.quantity || 1,
            }))
          }
        }
      })
      .catch((err) => {
        setOrders([])
        toast.error(errorMessage(err))
      })
      .finally(() => setOrdersLoading(false))

    setRequestOpen(true)
  }

  // Filter eligible orders
  const eligibleOrders = orders.filter((o) => o.can_request_return || ['delivered', 'completed'].includes(o.status))
  const selectedOrder = eligibleOrders.find((o) => o.id === returnForm.order_id)
  const selectedItem = selectedOrder?.items?.find((i) => i.id === returnForm.order_item_id)

  const handleRequestTypeChange = (typeId) => {
    const presets = RESOLUTION_PRESETS[typeId] || []
    setReturnForm((prev) => ({
      ...prev,
      request_type: typeId,
      preferred_resolution: presets[0] || '',
    }))
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length + mediaFiles.length > 8) {
      toast.error('You can upload at most 8 photos/videos.')
      return
    }
    setMediaFiles((prev) => [...prev, ...files])
  }

  const removeFile = (idx) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  // Submit request
  const submitReturn = async (e) => {
    e.preventDefault()
    if (!returnForm.order_id || !returnForm.order_item_id) {
      toast.error('Please select an order and a product item.')
      return
    }
    if (!returnForm.reason.trim()) {
      toast.error('Please describe the problem or reason for return.')
      return
    }

    const qty = Number(returnForm.quantity)
    if (!Number.isFinite(qty) || qty < 1 || (selectedItem && qty > selectedItem.quantity)) {
      toast.error(`Quantity must be between 1 and ${selectedItem?.quantity || 1}.`)
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('order_id', returnForm.order_id)
      formData.append('order_item_id', returnForm.order_item_id)
      formData.append('request_type', returnForm.request_type)
      formData.append('reason_type', returnForm.reason_type)
      formData.append('reason', returnForm.reason.trim())
      formData.append('quantity', String(qty))
      if (returnForm.preferred_resolution) {
        formData.append('preferred_resolution', returnForm.preferred_resolution)
      }
      if (returnForm.return_method) {
        formData.append('return_method', returnForm.return_method)
      }

      mediaFiles.forEach((file) => {
        formData.append('media[]', file)
      })

      const res = await api.post('/customer/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Return / Exchange request submitted successfully!')
      setRequestOpen(false)
      reload()

      // If returned data contains return details, open detail drawer
      const created = res.data?.data
      if (created) {
        viewDetail(created)
      }
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  // View return detail
  const viewDetail = async (r) => {
    setSelectedReturn(r)
    setDetailLoading(true)
    try {
      const res = await api.get(`/customer/returns/${r.id}`)
      setSelectedReturn(res.data?.data || r)
    } catch {
      // Keep existing data if detail fetch fails
    } finally {
      setDetailLoading(false)
    }
  }

  // Upload more media in detail view
  const handleUploadAdditionalMedia = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !selectedReturn) return

    setUploadingMore(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append('media[]', f))
      const res = await api.post(`/customer/returns/${selectedReturn.id}/media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Additional media uploaded successfully.')
      if (res.data?.data) {
        setSelectedReturn(res.data.data)
      }
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploadingMore(false)
    }
  }

  // Cancel return
  const cancelReturn = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.post(`/customer/returns/${cancelTarget.id}/cancel`, {
        reason: 'Cancelled by customer',
      })
      toast.success('Return request cancelled.')
      setCancelTarget(null)
      if (selectedReturn?.id === cancelTarget.id) {
        setSelectedReturn(null)
      }
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <AccountPage
      title="Returns, Exchanges & Refunds"
      subtitle="Manage product returns, request replacements for damaged items, or exchange products."
      actions={
        <button
          className="btn btn-primary btn-sm flex items-center gap-1.5"
          onClick={() => openRequestModal()}
        >
          <Plus size={15} /> Request Return / Exchange
        </button>
      }
    >
      {/* Policy Guarantee Banner */}
      <div
        className="card mb-4"
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
          border: '1.5px solid #fed7aa',
          padding: '14px 18px',
        }}
      >
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255, 85, 0, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                Gosika 7-Day Hassle-Free Return & Buyer Protection
              </div>
              <div className="muted text-xs" style={{ marginTop: 2 }}>
                Delivered orders can be returned, exchanged, or replaced within 7 days. Return pickup is arranged free of charge.
              </div>
            </div>
          </div>
          <Link to="/help" className="btn btn-outline btn-xs flex items-center gap-1">
            <HelpCircle size={13} /> Return Policy
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {STATUS_TABS.map((t) => (
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
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
              placeholder="Search return #, order…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Return #</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
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
                  <th>Return #</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const reqType = REQUEST_TYPES.find((t) => t.id === r.request_type) || REQUEST_TYPES[0]
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
                          {r.return_number}
                        </span>
                      </td>

                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            background: reqType.bg,
                            color: reqType.color,
                            border: `1px solid ${reqType.border}`,
                            fontWeight: 700,
                          }}
                        >
                          {r.request_type_label || reqType.title}
                        </span>
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
                            <span className="font-medium text-sm text-ink truncate block">{r.product_name || '—'}</span>
                            <span className="muted text-xs">Qty: {r.quantity}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <Link
                          to={`/account/orders/${r.order_id}`}
                          className="font-mono text-xs"
                          style={{
                            background: 'var(--bg)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            color: 'var(--ink)',
                          }}
                        >
                          #{r.order_number || '—'}
                        </Link>
                      </td>

                      <td className="font-bold text-sm text-ink">{money(r.refund_amount)}</td>

                      <td><StatusBadge status={r.status} /></td>

                      <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(r.created_at)}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => viewDetail(r)}
                          >
                            View Details
                          </button>
                          {['requested', 'under_review'].includes(r.status) && (
                            <button
                              type="button"
                              className="btn btn-danger-outline btn-xs"
                              title="Cancel request"
                              onClick={() => setCancelTarget(r)}
                            >
                              <X size={12} />
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
        </div>
      ) : (
        <EmptyState
          icon={RotateCcw}
          title="No return requests"
          message="You haven't requested any returns or exchanges yet. If you have an issue with a delivered order, click below."
          action={
            <button className="btn btn-primary" onClick={() => openRequestModal()}>
              <Plus size={14} /> Request a return / exchange
            </button>
          }
        />
      )}

      {items.length > 0 && <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CREATE RETURN / EXCHANGE MODAL                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {requestOpen && (
        <Modal
          open={requestOpen}
          onClose={() => setRequestOpen(false)}
          title="Submit Return, Exchange, or Replacement"
          size="lg"
        >
          <form onSubmit={submitReturn} className="flex flex-col gap-4">
            {ordersLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton height={40} />
                <Skeleton height={80} />
                <Skeleton height={60} />
              </div>
            ) : eligibleOrders.length === 0 ? (
              <div className="p-4 text-center">
                <AlertCircle size={36} color="var(--muted)" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700 }}>No Eligible Delivered Orders Found</h4>
                <p className="muted text-xs mt-1" style={{ maxWidth: 360, margin: '4px auto 14px' }}>
                  Returns and exchanges can only be initiated for orders that have been successfully delivered and are within the 7-day return window.
                </p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setRequestOpen(false)}>
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Step 1: Select Order & Item */}
                <div className="card" style={{ padding: 14, background: '#fafafa', border: '1px solid var(--border)' }}>
                  <div className="muted text-xs uppercase font-bold mb-2" style={{ letterSpacing: '0.04em' }}>
                    1. Select Delivered Order & Product
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      label="Delivered Order *"
                      required
                      value={returnForm.order_id}
                      onChange={(e) => {
                        const oid = e.target.value
                        const order = eligibleOrders.find((o) => o.id === oid)
                        const firstItem = order?.items?.[0]
                        setReturnForm({
                          ...returnForm,
                          order_id: oid,
                          order_item_id: firstItem?.id || '',
                          quantity: firstItem?.quantity || 1,
                        })
                      }}
                    >
                      <option value="">Select an order</option>
                      {eligibleOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order #{o.order_number} · Delivered · {formatDate(o.completed_at || o.placed_at)}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Product to Return / Exchange *"
                      required
                      value={returnForm.order_item_id}
                      disabled={!returnForm.order_id}
                      onChange={(e) => {
                        const item = selectedOrder?.items?.find((i) => i.id === e.target.value)
                        setReturnForm({
                          ...returnForm,
                          order_item_id: e.target.value,
                          quantity: item?.quantity || 1,
                        })
                      }}
                    >
                      <option value="">Select a product</option>
                      {selectedOrder?.items?.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.product_name} (Qty: {i.quantity})
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Selected Item Preview & Return Window notice */}
                  {selectedItem && (
                    <div
                      className="flex items-center justify-between wrap gap-2 mt-3 p-2.5 rounded"
                      style={{ background: '#ffffff', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-center gap-2.5">
                        {selectedItem.image && (
                          <img
                            src={apiImage(selectedItem.image)}
                            alt={selectedItem.product_name}
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div className="font-semibold text-sm text-ink">{selectedItem.product_name}</div>
                          <div className="muted text-xs">
                            Unit Price: {money(selectedItem.unit_price)} · Max Returnable Qty: {selectedItem.quantity}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold">Qty:</label>
                        <input
                          type="number"
                          className="input"
                          style={{ width: 64, height: 32, fontSize: 13, textAlign: 'center' }}
                          min={1}
                          max={selectedItem.quantity || 1}
                          value={returnForm.quantity}
                          onChange={(e) => setReturnForm({ ...returnForm, quantity: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrder && (
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: '#047857' }}>
                      <CheckCircle2 size={14} />
                      <span>
                        Return window active until {formatDateTime(selectedOrder.return_window_expires_at || new Date(Date.now() + 7 * 86400000))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Step 2: Select Request Type */}
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'block' }}>
                    2. Select Request Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {REQUEST_TYPES.map((t) => {
                      const active = returnForm.request_type === t.id
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleRequestTypeChange(t.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            border: active ? `2px solid var(--primary)` : '1.5px solid var(--border)',
                            background: active ? '#fff7ed' : '#ffffff',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="chip chip-sm"
                              style={{ background: t.bg, color: t.color, fontWeight: 700, fontSize: 11 }}
                            >
                              {t.badge}
                            </span>
                            <input
                              type="radio"
                              name="request_type"
                              checked={active}
                              onChange={() => handleRequestTypeChange(t.id)}
                            />
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)', marginTop: 4 }}>
                            {t.title}
                          </div>
                          <div className="muted text-xs" style={{ marginTop: 2, lineHeight: 1.35 }}>
                            {t.desc}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Step 3: Reason & Explanation */}
                <div className="form-row">
                  <Select
                    label="Reason for Return / Issue *"
                    required
                    value={returnForm.reason_type}
                    onChange={(e) => setReturnForm({ ...returnForm, reason_type: e.target.value })}
                  >
                    {RETURN_REASON_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>

                  <Select
                    label="Preferred Resolution *"
                    required
                    value={returnForm.preferred_resolution}
                    onChange={(e) => setReturnForm({ ...returnForm, preferred_resolution: e.target.value })}
                  >
                    {(RESOLUTION_PRESETS[returnForm.request_type] || []).map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                    <option value="Custom resolution">Other / Custom specification</option>
                  </Select>
                </div>

                <Textarea
                  label="Detailed Explanation *"
                  required
                  rows={3}
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  placeholder="Explain the problem in detail (e.g. describe how it arrived damaged, what part is missing, or what replacement size is needed)…"
                />

                {/* Step 4: Photo / Video Uploads */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label" style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>
                      Upload Photos / Video Proof (Recommended)
                    </label>
                    <span className="muted text-xs">Max 8 files (JPG, PNG, MP4 up to 50MB)</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 8,
                      padding: '16px 20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#fafafa',
                    }}
                  >
                    <Upload size={24} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                      Click to upload photos or videos of the product & packaging
                    </div>
                    <div className="muted text-xs mt-0.5">
                      Photos of shipping label, damaged parts, or wrong items ensure faster approval
                    </div>
                  </div>

                  {mediaFiles.length > 0 && (
                    <div className="flex gap-2 wrap mt-2.5">
                      {mediaFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 p-1.5 rounded"
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            fontSize: 11,
                          }}
                        >
                          {file.type.startsWith('video/') ? <Video size={13} /> : <ImageIcon size={13} />}
                          <span className="truncate" style={{ maxWidth: 120 }}>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 5: Return Method */}
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, display: 'block' }}>
                    Preferred Return Method
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <label
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: returnForm.return_method === 'pickup' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: returnForm.return_method === 'pickup' ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <input
                        type="radio"
                        name="return_method"
                        value="pickup"
                        checked={returnForm.return_method === 'pickup'}
                        onChange={(e) => setReturnForm({ ...returnForm, return_method: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Free Courier Pickup</div>
                        <div className="muted text-xs">A courier rider will collect the package from your delivery address</div>
                      </div>
                    </label>

                    <label
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: returnForm.return_method === 'drop_off' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: returnForm.return_method === 'drop_off' ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <input
                        type="radio"
                        name="return_method"
                        value="drop_off"
                        checked={returnForm.return_method === 'drop_off'}
                        onChange={(e) => setReturnForm({ ...returnForm, return_method: e.target.value })}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Self Drop-off</div>
                        <div className="muted text-xs">Drop off package at the nearest Gosika logistics hub</div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setRequestOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || ordersLoading || eligibleOrders.length === 0}
              >
                {submitting ? 'Submitting request…' : 'Submit Return / Exchange Request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RETURN DETAIL DRAWER / MODAL                                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedReturn && (
        <Modal
          open={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title={`Return Request: ${selectedReturn.return_number}`}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            {detailLoading ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton height={60} />
                <Skeleton height={120} />
                <Skeleton height={80} />
              </div>
            ) : (
              <>
                {/* Header Summary */}
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <div className="muted text-xs uppercase font-bold">Request Type</div>
                    <div className="font-bold text-sm text-ink mt-0.5">
                      {selectedReturn.request_type_label || selectedReturn.request_type}
                    </div>
                  </div>
                  <div>
                    <div className="muted text-xs uppercase font-bold">Status</div>
                    <div className="mt-0.5"><StatusBadge status={selectedReturn.status} /></div>
                  </div>
                  <div>
                    <div className="muted text-xs uppercase font-bold">Claimed Amount</div>
                    <div className="font-bold text-sm text-primary mt-0.5">
                      {money(selectedReturn.refund_amount)}
                    </div>
                  </div>
                  <div>
                    <div className="muted text-xs uppercase font-bold">Submitted</div>
                    <div className="text-xs text-ink mt-0.5">
                      {formatDateTime(selectedReturn.created_at)}
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="card" style={{ padding: 14 }}>
                  <div className="muted text-xs uppercase font-bold mb-2">Item Details</div>
                  <div className="flex items-center gap-3">
                    {selectedReturn.product_image && (
                      <img
                        src={apiImage(selectedReturn.product_image)}
                        alt={selectedReturn.product_name || 'Product'}
                        style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-sm text-ink">{selectedReturn.product_name || '—'}</div>
                      <div className="muted text-xs mt-0.5">
                        Quantity: {selectedReturn.quantity} · Order #{selectedReturn.order_number || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Claim Details */}
                <div className="card" style={{ padding: 14 }}>
                  <div className="muted text-xs uppercase font-bold mb-2">Customer Claim Details</div>
                  <div className="text-sm">
                    <div><strong>Reason:</strong> {selectedReturn.reason_type?.replace(/_/g, ' ')}</div>
                    <div className="mt-1"><strong>Explanation:</strong> {selectedReturn.reason}</div>
                    {selectedReturn.preferred_resolution && (
                      <div className="mt-1"><strong>Preferred Resolution:</strong> {selectedReturn.preferred_resolution}</div>
                    )}
                    {selectedReturn.return_method && (
                      <div className="mt-1">
                        <strong>Return Method:</strong> {selectedReturn.return_method === 'pickup' ? 'Courier Pickup' : 'Drop-off'}
                      </div>
                    )}
                  </div>

                  {/* Customer Uploaded Media Evidence */}
                  {selectedReturn.media?.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="muted text-xs uppercase font-bold mb-2">Attached Proof & Media</div>
                      <div className="flex gap-2 wrap">
                        {selectedReturn.media.map((m) => (
                          <a
                            key={m.id}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              border: '1px solid var(--border)',
                              borderRadius: 6,
                              overflow: 'hidden',
                            }}
                          >
                            {m.type === 'video' ? (
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  background: '#0f172a',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Video size={20} />
                              </div>
                            ) : (
                              <img
                                src={m.url}
                                alt={m.original_name || 'Evidence'}
                                style={{ width: 64, height: 64, objectFit: 'cover' }}
                              />
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload More Media if not terminal */}
                  {!['refunded', 'completed', 'cancelled', 'rejected'].includes(selectedReturn.status) && (
                    <div className="mt-3">
                      <input
                        ref={addMediaInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleUploadAdditionalMedia}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline btn-xs flex items-center gap-1"
                        disabled={uploadingMore}
                        onClick={() => addMediaInputRef.current?.click()}
                      >
                        <Upload size={12} />
                        {uploadingMore ? 'Uploading…' : 'Attach additional photos/video'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Seller Review / Logistics Instructions */}
                {(selectedReturn.response || selectedReturn.pickup_instructions) && (
                  <div
                    className="card"
                    style={{
                      padding: 14,
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <div className="text-xs uppercase font-bold" style={{ color: '#15803d', marginBottom: 4 }}>
                      Seller Response & Return Instructions
                    </div>
                    {selectedReturn.response && (
                      <p className="text-sm" style={{ color: '#166534', margin: 0 }}>
                        {selectedReturn.response}
                      </p>
                    )}
                    {selectedReturn.pickup_instructions && (
                      <div className="text-xs mt-2" style={{ color: '#166534' }}>
                        <strong>Pickup Instructions:</strong> {selectedReturn.pickup_instructions}
                      </div>
                    )}
                  </div>
                )}

                {/* Inspection Record (if inspected) */}
                {selectedReturn.inspected_at && (
                  <div
                    className="card"
                    style={{
                      padding: 14,
                      background: '#faf5ff',
                      border: '1px solid #e9d5ff',
                    }}
                  >
                    <div className="text-xs uppercase font-bold" style={{ color: '#7e22ce', marginBottom: 4 }}>
                      Seller Product Inspection Result
                    </div>
                    <div className="text-xs">
                      <div>
                        <strong>Condition:</strong>{' '}
                        <span className="font-bold uppercase">{selectedReturn.inspection_condition_label || selectedReturn.inspection_condition}</span>
                      </div>
                      {selectedReturn.inspection_notes && (
                        <div className="mt-1">
                          <strong>Inspection Notes:</strong> {selectedReturn.inspection_notes}
                        </div>
                      )}
                      <div className="muted mt-1">
                        Inspected on {formatDateTime(selectedReturn.inspected_at)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Exchange / Replacement Resolution Tracking */}
                {selectedReturn.exchange_dispatched_at && (
                  <div className="alert alert-info">
                    <Truck size={16} />
                    <span>
                      <strong>Exchange Dispatched:</strong> Replacement product was dispatched on{' '}
                      {formatDateTime(selectedReturn.exchange_dispatched_at)}.
                    </span>
                  </div>
                )}
                {selectedReturn.replacement_dispatched_at && (
                  <div className="alert alert-info">
                    <Truck size={16} />
                    <span>
                      <strong>Replacement Dispatched:</strong> New replacement unit dispatched on{' '}
                      {formatDateTime(selectedReturn.replacement_dispatched_at)}.
                    </span>
                  </div>
                )}

                {/* Status Timeline History */}
                {selectedReturn.status_history?.length > 0 && (
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted text-xs uppercase font-bold mb-2">Request History Timeline</div>
                    <div className="timeline">
                      {selectedReturn.status_history.map((h, i) => (
                        <div key={i} className="timeline-item active">
                          <div className="font-semibold text-xs text-ink capitalize">
                            Status changed to {h.to?.replace(/_/g, ' ')}
                          </div>
                          {h.notes && <div className="muted text-xs">{h.notes}</div>}
                          <div className="muted text-xs mt-0.5">{formatDateTime(h.at)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div>
                {selectedReturn && ['requested', 'under_review'].includes(selectedReturn.status) && (
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setCancelTarget(selectedReturn)}
                  >
                    Cancel this request
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedReturn(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelReturn}
        danger
        loading={cancelling}
        title="Cancel return request?"
        message={`Return ${cancelTarget?.return_number || ''} will be cancelled immediately.`}
        confirmText="Yes, cancel request"
      />
    </AccountPage>
  )
}
