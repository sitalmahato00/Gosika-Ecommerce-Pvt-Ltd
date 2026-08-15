import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, CheckCircle2, XCircle, Search, Eye, Filter,
  Sparkles, Tag, Plus, Download, Store, Trash2
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate, getProductImage, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Products' },
  { value: 'published', label: 'Approved / Live' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminProducts() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(() => {})
    api.get('/admin/vendors', { params: { per_page: 50 } }).then((r) => setVendors(r.data.data || [])).catch(() => {})
  }, [])

  const fetcher = useCallback(
    async (page) => {
      if (statusFilter === 'pending_review') {
        return api.get('/admin/products/pending', {
          params: { page, per_page: 15, search: search || undefined, category: categoryFilter || undefined, vendor: vendorFilter || undefined }
        })
      }
      return api.get('/products', {
        params: {
          page,
          per_page: 15,
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          search: search || undefined,
          load: 'brand,store,images',
        }
      })
    },
    [statusFilter, categoryFilter, vendorFilter, search]
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, categoryFilter, vendorFilter, search],
    pageSize: 15,
  })

  const doApprove = async (product) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/products/${product.id}/approve`)
      toast.success(`"${product.name}" approved and published`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/products/${rejectTarget.id}/reject`, { reason: rejectReason || 'Product submission does not meet quality standards.' })
      toast.success(`"${rejectTarget.name}" rejected`)
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Product Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized view and control for all marketplace products.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meta.total > 0 && (
            <span className="muted text-sm">{meta.total} product{meta.total !== 1 ? 's' : ''} total</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
            aria-pressed={statusFilter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 360 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by name, SKU…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} />
          </button>
        </form>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 150 }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.company_name}</option>
          ))}
        </select>

        {(search || categoryFilter || vendorFilter) && (
          <button
            className="btn btn-ghost btn-xs text-danger"
            onClick={() => { setSearch(''); setSearchInput(''); setCategoryFilter(''); setVendorFilter('') }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={76} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Package}
          title="No products found"
          message={search || categoryFilter ? 'No products match your selected filters.' : 'Products listed by marketplace sellers will appear here.'}
        />
      ) : (
        <>
          <div className="table-wrap hide-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Vendor / Store</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const img = getProductImage(p)
                  const isPending = p.status === 'pending_review' || p.status === 'pending' || p.status === 'draft'
                  const inStock = p.quantity > 0 || p.stock_status === 'in_stock'
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="thumb" style={{ width: 48, height: 48, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0 }}>
                            <img
                              src={img}
                              alt={p.name}
                              className="thumb-img"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                            />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <Link to={`/product/${p.id}`} target="_blank" className="font-semibold text-sm text-ink hover:text-primary line-clamp-1">
                              {p.name}
                            </Link>
                            <div className="muted text-xs font-mono">{p.sku || 'SKU-001'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted text-sm">{p.category?.name || 'Handicrafts'}</td>
                      <td>
                        <span className="font-medium text-ink text-sm">
                          {p.store?.name || p.brand?.name || 'GOSIKA Partner'}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-ink">{money(p.price)}</span>
                        {p.compare_at_price > p.price && (
                          <div className="muted text-xs line-through">{money(p.compare_at_price)}</div>
                        )}
                      </td>
                      <td>
                        <span className={`chip chip-sm ${inStock ? 'chip-green' : 'chip-red'}`} style={{ background: inStock ? 'var(--success-bg)' : 'var(--danger-bg)', color: inStock ? 'var(--success)' : 'var(--danger)' }}>
                          {inStock ? `${p.quantity || 24} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <Link to={`/product/${p.id}`} target="_blank" className="btn btn-outline btn-xs" title="View product page">
                            <Eye size={12} /> View
                          </Link>
                          {isPending && (
                            <>
                              <button
                                className="btn btn-success btn-xs"
                                onClick={() => doApprove(p)}
                                disabled={actionBusy}
                                title="Approve & Publish"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                className="btn btn-danger-outline btn-xs"
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

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Reject Modal */}
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