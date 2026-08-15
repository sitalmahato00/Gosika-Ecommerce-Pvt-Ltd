import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Plus, Pencil, Trash2, Send, Search, Eye, MoreVertical } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, errorMessage, getProductImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
]

function ActionMenu({ product, onSubmit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="action-menu">
      <button
        className="icon-btn icon-btn-sm"
        style={{ border: 'none' }}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="action-menu-dropdown" onClick={() => setOpen(false)}>
          <Link className="action-menu-item" to={`/product/${product.id}`} target="_blank">
            <Eye size={14} /> View on Store
          </Link>
          <Link className="action-menu-item" to={`/vendor/products/${product.id}/edit`}>
            <Pencil size={14} /> Edit Product
          </Link>
          {product.status !== 'published' && product.status !== 'pending_review' && (
            <button className="action-menu-item" onClick={() => onSubmit(product)}>
              <Send size={14} /> Submit for Review
            </button>
          )}
          <div className="action-menu-divider" />
          <button className="action-menu-item danger" onClick={() => onDelete(product)}>
            <Trash2 size={14} /> Delete Product
          </button>
        </div>
      )}
    </div>
  )
}

export default function VendorProducts() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetcher = useCallback(
    async (page) => api.get('/vendor/products', {
      params: { page, per_page: 15, status: statusFilter || undefined, search: search || undefined }
    }),
    [statusFilter, search],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search],
    pageSize: 15,
  })

  const submitForReview = async (p) => {
    try {
      await api.post(`/vendor/products/${p.id}/submit`)
      toast.success(`"${p.name}" submitted for review`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vendor/products/${deleteTarget.id}`)
      toast.success('Product deleted')
      setDeleteTarget(null)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>Manage your product catalog</p>
        </div>
        <Link to="/vendor/products/new" className="btn btn-primary">
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* Filters & search */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, width: 220 }}
              placeholder="Search products…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm" aria-label="Search">
            <Search size={14} />
          </button>
        </form>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              className={`pill ${statusFilter === s.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(s.value)}
              aria-pressed={statusFilter === s.value}
            >
              {s.label}
            </button>
          ))}
        </div>

        {meta.total > 0 && (
          <span className="muted text-sm" style={{ marginLeft: 'auto' }}>
            {meta.total} product{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Package}
          title={search ? `No products matching "${search}"` : 'No products yet'}
          message={search ? 'Try a different search term or clear your filters.' : 'Create your first product to start selling on GOSIKA.'}
          action={
            !search ? (
              <Link to="/vendor/products/new" className="btn btn-primary">
                <Plus size={15} /> Add First Product
              </Link>
            ) : (
              <button className="btn btn-outline" onClick={() => { setSearch(''); setSearchInput('') }}>
                Clear Search
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="table-wrap hide-sm">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const img = getProductImage(p)
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className="thumb" style={{ width: 44, height: 44, flexShrink: 0 }}>
                            <img
                              src={img}
                              alt=""
                              className="thumb-img"
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                            />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <Link
                              to={`/vendor/products/${p.id}/edit`}
                              className="font-semibold line-clamp-1"
                              style={{ fontSize: 13.5, color: 'var(--ink)' }}
                            >
                              {p.name}
                            </Link>
                            {p.brand?.name && (
                              <div className="muted text-xs" style={{ marginTop: 2 }}>{p.brand.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="muted text-sm">{p.sku || '—'}</td>
                      <td>
                        <span className="font-semibold">{money(p.price)}</span>
                        {p.compare_at_price > p.price && (
                          <div className="muted" style={{ textDecoration: 'line-through', fontSize: 12 }}>{money(p.compare_at_price)}</div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={p.stock_status} />
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                        {p.status === 'rejected' && p.rejection_reason && (
                          <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3, maxWidth: 140 }} className="truncate" title={p.rejection_reason}>
                            {p.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <Link to={`/vendor/products/${p.id}/edit`} className="icon-btn icon-btn-sm" title="Edit" style={{ border: 'none' }}>
                            <Pencil size={14} />
                          </Link>
                          <ActionMenu
                            product={p}
                            onSubmit={submitForReview}
                            onDelete={setDeleteTarget}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="show-sm" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((p) => {
              const img = getProductImage(p)
              return (
                <div key={p.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 12, alignItems: 'start' }}>
                    <span className="thumb" style={{ width: 52, height: 52 }}>
                      <img
                        src={img}
                        alt=""
                        className="thumb-img"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                      />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="font-semibold line-clamp-2" style={{ fontSize: 13.5 }}>{p.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                        <span className="font-bold" style={{ color: 'var(--primary)' }}>{money(p.price)}</span>
                        <StatusBadge status={p.status} />
                      </div>
                    </div>
                    <ActionMenu product={p} onSubmit={submitForReview} onDelete={setDeleteTarget} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Link to={`/vendor/products/${p.id}/edit`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                      <Pencil size={13} /> Edit
                    </Link>
                    {p.status !== 'published' && p.status !== 'pending_review' && (
                      <button className="btn btn-soft btn-sm" style={{ flex: 1 }} onClick={() => submitForReview(p)}>
                        <Send size={13} /> Submit
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 20 }}>
            <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Delete product?"
        message={`"${deleteTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmText="Delete Product"
      />
    </div>
  )
}
