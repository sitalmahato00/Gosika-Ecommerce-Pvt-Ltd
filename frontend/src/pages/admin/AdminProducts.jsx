import React, { useState } from 'react'
import {
  Package, CheckCircle2, XCircle, Search, Eye, Download,
  Clock, Award, Check
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, errorMessage, getProductImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList, useApi } from '../../hooks/useApi'

const TABS = [
  { value: 'all', label: 'All Products' },
  { value: 'pending', label: 'Pending Approval' },
]

export default function AdminProducts() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  const allList = useList(
    (page, perPage) =>
      api.get('/products', {
        params: {
          page,
          per_page: perPage,
          ...(search && { search }),
          ...(categoryFilter && { category: categoryFilter }),
        },
      }),
    { deps: [search, categoryFilter], pageSize: 15 },
  )

  const pendingList = useList(
    (page, perPage) => api.get('/admin/products/pending', { params: { page, per_page: perPage } }),
    { pageSize: 15 },
  )

  const categories = useApi(() => api.get('/categories'))
  const categoryOptions = Array.isArray(categories.data) ? categories.data : []

  const active = activeTab === 'pending' ? pendingList : allList
  const items = active.items
  const loading = active.loading
  const error = active.error

  const avgRating = allList.items.length
    ? (allList.items.reduce((s, p) => s + (Number(p.rating_avg) || 0), 0) / allList.items.length).toFixed(2)
    : '0.00'

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    allList.setPage(1)
    pendingList.setPage(1)
  }

  const doApprove = async (product) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/products/${product.id}/approve`)
      toast.success(`"${product.name}" approved and published to the live marketplace!`)
      pendingList.reload()
      allList.reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve product.'))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/products/${rejectTarget.id}/reject`, { reason: rejectReason || 'Rejected by marketplace administrator.' })
      toast.success(`"${rejectTarget.name}" rejected`)
      setRejectTarget(null)
      setRejectReason('')
      pendingList.reload()
      allList.reload()
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject product.'))
    } finally {
      setActionBusy(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Product Name', 'SKU', 'Category', 'Store / Vendor', 'Price (NPR)', 'Regular Price', 'Stock Qty', 'Status'],
      ...items.map((p) => [
        p.name,
        p.sku || 'N/A',
        p.category?.name || 'General',
        p.store?.name || p.vendor?.company_name || 'GOSIKA Vendor',
        p.price,
        p.compare_at_price || p.price,
        p.quantity || 0,
        p.status,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_catalog_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Catalog products exported to CSV')
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Marketplace Catalog & Product Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized governance, quality review, category curation, and inventory control for all vendor SKUs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export Catalog CSV
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Marketplace SKUs</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Package size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{allList.meta.total} SKUs</div>
          <div className="muted text-xs mt-1">Across vendor catalog</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Review</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>
            {pendingList.meta.total} Pending
          </div>
          <div className="muted text-xs mt-1">Awaiting compliance verification</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Live & Published</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>
            {allList.meta.total} Live
          </div>
          <div className="muted text-xs mt-1">Available in customer store</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Average Rating</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Award size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{avgRating} ★</div>
          <div className="muted text-xs mt-1">Average of loaded SKUs</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {TABS.map((t) => {
          const total = t.value === 'pending' ? pendingList.meta.total : allList.meta.total
          return (
            <button
              key={t.value}
              type="button"
              className={`tab ${activeTab === t.value ? 'active' : ''}`}
              onClick={() => setActiveTab(t.value)}
            >
              {t.label} ({total})
            </button>
          )
        })}
      </div>

      <div className="card flex items-center wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search product title, SKU, store…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160, height: 36 }}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); allList.setPage(1) }}
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.slug || c.id}>{c.name}</option>
          ))}
        </select>

        {(search || categoryFilter) && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger font-bold"
            onClick={() => { setSearch(''); setSearchInput(''); setCategoryFilter(''); allList.setPage(1); pendingList.setPage(1) }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={76} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error, 'Failed to load products.')} onRetry={() => active.reload()} />
      ) : !items.length ? (
        <EmptyState
          icon={Package}
          title={activeTab === 'pending' ? 'No products pending approval' : 'No products found'}
          message={search || categoryFilter ? 'No products match your selected filters.' : 'Products listed by marketplace sellers will appear here.'}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Vendor & Artisan Store</th>
                  <th>Price (NPR)</th>
                  <th>Stock Inventory</th>
                  <th>Review Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const isPending = p.status === 'pending_review' || p.status === 'pending'
                  const inStock = (p.quantity || 0) > 0

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span
                            className="thumb"
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 'var(--radius)',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: '#fff',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <img
                              src={getProductImage(p)}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <span
                              className="font-bold text-sm text-ink hover:text-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedProduct(p)}
                            >
                              {p.name}
                            </span>
                            <div className="muted text-xs font-mono mt-0.5">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted text-xs font-semibold">
                        {p.category?.name || '—'}
                      </td>
                      <td>
                        <div className="font-bold text-xs text-ink">{p.store?.name || '—'}</div>
                        <div className="muted text-xs">{p.vendor?.company_name || p.store?.slug || ''}</div>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{money(p.price)}</div>
                        {p.compare_at_price > p.price && (
                          <div className="muted text-xs line-through" style={{ fontSize: 10 }}>{money(p.compare_at_price)}</div>
                        )}
                      </td>
                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            background: inStock ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: inStock ? '#10b981' : '#ef4444',
                            fontWeight: 800,
                            fontSize: 11,
                          }}
                        >
                          {inStock ? `${p.quantity} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => setSelectedProduct(p)}
                            title="Inspect product dossier"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs flex items-center gap-1"
                                onClick={() => doApprove(p)}
                                disabled={actionBusy}
                                title="Approve & Publish"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-xs flex items-center gap-1"
                                onClick={() => setRejectTarget(p)}
                                disabled={actionBusy}
                                title="Reject"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={active.page} lastPage={active.meta.last_page} total={active.meta.total} onChange={active.setPage} />
        </div>
      )}

      {selectedProduct && (
        <Modal
          open={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Product Dossier: ${selectedProduct.name}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid" style={{ gridTemplateColumns: '180px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
              <div style={{ width: 180, height: 180, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={getProductImage(selectedProduct)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">SKU: {selectedProduct.sku}</span>
                  <StatusBadge status={selectedProduct.status} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>{selectedProduct.name}</h3>
                <p className="muted text-xs" style={{ lineHeight: 1.5, margin: 0 }}>
                  {selectedProduct.description || 'No description provided.'}
                </p>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6, padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span className="muted text-xs block" style={{ fontSize: 10 }}>Market Price</span>
                    <span className="font-bold text-sm text-ink">{money(selectedProduct.price)}</span>
                  </div>
                  <div>
                    <span className="muted text-xs block" style={{ fontSize: 10 }}>Stock Quantity</span>
                    <span className="font-bold text-sm text-ink">{selectedProduct.quantity} units</span>
                  </div>
                  <div>
                    <span className="muted text-xs block" style={{ fontSize: 10 }}>Fulfilling Store</span>
                    <span className="font-bold text-xs text-ink truncate block">{selectedProduct.store?.name || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {(selectedProduct.status === 'pending_review' || selectedProduct.status === 'pending') && (
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-primary btn-sm" disabled={actionBusy} onClick={() => { doApprove(selectedProduct); setSelectedProduct(null) }}>
                    <Check size={14} /> Approve & Publish
                  </button>
                  <button type="button" className="btn btn-danger-outline btn-sm" disabled={actionBusy} onClick={() => { setRejectTarget(selectedProduct); setSelectedProduct(null) }}>
                    Reject Submission
                  </button>
                </div>
              )}
              <button type="button" className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setSelectedProduct(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {rejectTarget && (
        <ConfirmDialog
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={doReject}
          danger
          loading={actionBusy}
          title={`Reject Product "${rejectTarget.name}"?`}
          message="Please state a reason why this product cannot be approved for the marketplace."
          confirmText="Confirm Rejection"
        >
          <div style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Inappropriate images, incorrect pricing, or incomplete specifications."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}
