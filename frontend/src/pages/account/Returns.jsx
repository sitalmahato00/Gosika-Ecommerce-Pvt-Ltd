import React, { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RotateCcw, Plus, Search, X } from 'lucide-react'
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
import { money, formatDate, errorMessage, apiImage, humanizeEnum } from '../../utils/format'

const RETURN_REASON_OPTIONS = ['damaged', 'wrong_item', 'not_as_described', 'quality_issue', 'other']

const RETURN_REASON_LABELS = {
  damaged: 'Damaged during transit',
  wrong_item: 'Wrong item received',
  not_as_described: 'Product not as described',
  quality_issue: 'Quality issue / defect',
  other: 'Other reason',
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
]

const EMPTY_RETURN_FORM = {
  order_id: '',
  order_item_id: '',
  quantity: 1,
  reason_type: '',
  reason: '',
}

export default function Returns() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [requestOpen, setRequestOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [returnForm, setReturnForm] = useState(EMPTY_RETURN_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const fetcher = useCallback(
    (page, pageSize) => api.get('/customer/returns', { params: { status, search, page, per_page: pageSize } }),
    [status, search],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, { pageSize: 10, deps: [status, search] })

  const changeStatus = (value) => {
    setPage(1)
    setStatus(value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const openRequestModal = () => {
    setReturnForm(EMPTY_RETURN_FORM)
    setOrdersLoading(true)
    api.get('/orders', { params: { per_page: 50 } })
      .then((r) => setOrders(r.data?.data?.data || []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false))
    setRequestOpen(true)
  }

  const selectedOrder = orders.find((o) => o.id === returnForm.order_id)
  const selectedItem = selectedOrder?.items?.find((i) => i.id === returnForm.order_item_id)

  const submitReturn = async (e) => {
    e.preventDefault()
    const item = selectedItem
    const qty = Number(returnForm.quantity)
    if (!returnForm.order_id || !returnForm.order_item_id) {
      toast.error('Select an order and an item')
      return
    }
    if (!returnForm.reason_type) {
      toast.error('Select a reason type')
      return
    }
    if (!returnForm.reason.trim()) {
      toast.error('Please describe the reason')
      return
    }
    if (!item || !Number.isFinite(qty) || qty < 1 || qty > item.quantity) {
      toast.error('Quantity exceeds the purchased quantity')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/customer/returns', {
        order_id: returnForm.order_id,
        order_item_id: returnForm.order_item_id,
        reason_type: returnForm.reason_type,
        reason: returnForm.reason.trim(),
        quantity: qty,
      })
      toast.success('Return request submitted')
      setRequestOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const cancelReturn = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api.post(`/customer/returns/${cancelTarget.id}/cancel`)
      toast.success('Return request cancelled')
      setCancelTarget(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCancelling(false)
    }
  }

  const visibleItems = search
    ? items.filter((r) =>
        [r.return_number, r.order_number, r.product_name].some((v) => (v || '').toLowerCase().includes(search.toLowerCase()))
      )
    : items

  return (
    <AccountPage
      title="My Returns"
      subtitle="Track and request returns for your orders."
      actions={<button className="btn btn-primary btn-sm flex items-center gap-1" onClick={openRequestModal}><Plus size={14} /> Request a return</button>}
    >

      <div className="card" style={{ padding: '12px 16px' }}>
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

          <form onSubmit={applySearch} style={{ position: 'relative', width: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
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

      {loading ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Return</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>Qty</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Response</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9}><Skeleton height={26} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : visibleItems.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Return</th>
                  <th>Product</th>
                  <th>Order</th>
                  <th>Qty</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Response</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>
                        {r.return_number}
                      </span>
                    </td>

                    <td style={{ maxWidth: 240 }}>
                      <div className="flex items-center gap-2">
                        {r.product_image && (
                          <img
                            src={apiImage(r.product_image)}
                            alt={r.product_name || 'Product'}
                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <span className="font-medium text-sm text-ink truncate">{r.product_name || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <Link
                        to={`/account/orders/${r.order_id}`}
                        className="font-mono text-xs"
                        style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--ink)' }}
                      >
                        #{r.order_number || '—'}
                      </Link>
                    </td>

                    <td>{r.quantity}</td>

                    <td className="font-bold text-sm text-ink">{money(r.refund_amount)}</td>

                    <td><StatusBadge status={r.status} /></td>

                    <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>

                    <td style={{ maxWidth: 200 }}>
                      {r.response
                        ? <div className="muted text-xs truncate" title={r.response}>{r.response}</div>
                        : <span className="muted text-xs">—</span>}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {['requested', 'under_review'].includes(r.status) ? (
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs flex items-center gap-1"
                          onClick={() => setCancelTarget(r)}
                        >
                          <X size={11} /> Cancel request
                        </button>
                      ) : (
                        <span className="muted text-xs">—</span>
                      )}
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
          title="No return requests"
          message="You haven't requested any returns yet. If something's wrong with an order, request a return here."
          action={
            <button className="btn btn-primary" onClick={openRequestModal}>
              <Plus size={14} /> Request a return
            </button>
          }
        />
      )}

      {items.length > 0 && <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />}

      {requestOpen && (
        <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request a return" size="lg">
          <form onSubmit={submitReturn} className="flex flex-col gap-3">
            {ordersLoading ? (
              <div className="flex flex-col gap-2"><Skeleton height={40} /><Skeleton height={40} /></div>
            ) : orders.length === 0 ? (
              <p className="muted text-sm">No orders yet to return.</p>
            ) : (
              <>
                <Select label="Order" required value={returnForm.order_id} onChange={(e) => setReturnForm({ ...returnForm, order_id: e.target.value, order_item_id: '', quantity: 1 })}>
                  <option value="">Select an order</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>#{o.order_number} · {formatDate(o.placed_at || o.created_at)}</option>
                  ))}
                </Select>

                <Select label="Item" required value={returnForm.order_item_id} disabled={!returnForm.order_id} onChange={(e) => {
                  const item = selectedOrder?.items?.find((i) => i.id === e.target.value)
                  setReturnForm({ ...returnForm, order_item_id: e.target.value, quantity: item?.quantity || 1 })
                }}>
                  <option value="">Select an item</option>
                  {selectedOrder?.items?.map((i) => (
                    <option key={i.id} value={i.id}>{i.product_name} (Qty: {i.quantity})</option>
                  ))}
                </Select>

                <div className="form-row">
                  <Select label="Reason Type" required value={returnForm.reason_type} onChange={(e) => setReturnForm({ ...returnForm, reason_type: e.target.value })}>
                    <option value="">Select a reason</option>
                    {RETURN_REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>{RETURN_REASON_LABELS[r] || humanizeEnum(r)}</option>
                    ))}
                  </Select>
                  <Input
                    label={`Quantity (max ${selectedItem?.quantity || '—'})`}
                    type="number"
                    min={1}
                    max={selectedItem?.quantity || 1}
                    required
                    value={returnForm.quantity}
                    onChange={(e) => setReturnForm({ ...returnForm, quantity: Number(e.target.value) })}
                  />
                </div>

                <Textarea
                  label="Reason Details"
                  required
                  rows={3}
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  placeholder="Describe the issue with this item…"
                />
              </>
            )}

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setRequestOpen(false)}>Cancel</button>
              <Button type="submit" variant="primary" disabled={submitting || ordersLoading}>
                {submitting ? 'Submitting…' : 'Submit return request'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={cancelReturn}
        danger
        loading={cancelling}
        title="Cancel return request?"
        message={`Return ${cancelTarget?.return_number || ''} will be cancelled.`}
        confirmText="Cancel request"
      />
    </AccountPage>
  )
}
