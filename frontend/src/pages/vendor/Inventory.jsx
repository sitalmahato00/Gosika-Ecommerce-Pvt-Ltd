import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Package, AlertTriangle, CheckCircle2, XCircle, Search,
  Plus, RefreshCw, Edit3, SlidersHorizontal, Save
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, getProductImage, apiImage, errorMessage } from '../../utils/format'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'

const STATUS_TABS = [
  { id: '', label: 'All Items' },
  { id: 'in_stock', label: 'In Stock' },
  { id: 'low_stock', label: 'Low Stock Alert' },
  { id: 'out_of_stock', label: 'Out of Stock' },
]

const VIEW_META = {
  inventory: { title: 'Inventory & Stock Management', subtitle: '' },
  low: { title: 'Low Stock', subtitle: 'Items that are at or below their reorder level need restocking.' },
}

export default function VendorInventory({ view = 'inventory' }) {
  const viewMeta = VIEW_META[view] || VIEW_META.inventory
  const toast = useToast()
  const [tab, setTab] = useState(view === 'low' ? 'low_stock' : '')
  const [lowOnly, setLowOnly] = useState(view === 'low')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [editingItem, setEditingItem] = useState(null)
  const [editQty, setEditQty] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [saving, setSaving] = useState(false)

  const fetcher = useCallback(
    async (page) =>
      api.get('/vendor/inventory', {
        params: {
          page,
          per_page: 15,
          search: search || undefined,
          stock_status: tab || undefined,
          low_only: lowOnly ? '1' : undefined,
        },
      }),
    [search, tab, lowOnly],
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [search, tab, lowOnly],
    pageSize: 15,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const resetFilters = () => {
    setSearch('')
    setSearchInput('')
    setTab('')
    setLowOnly(false)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setEditQty(String(item.stock ?? 0))
    setEditThreshold(String(item.reorder_level ?? 0))
  }

  const saveItem = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)
    const body = {}
    const qty = editQty === '' ? undefined : Number(editQty)
    const threshold = editThreshold === '' ? undefined : Number(editThreshold)
    if (qty !== undefined && Number.isFinite(qty)) body.quantity = qty
    if (threshold !== undefined && Number.isFinite(threshold)) body.low_stock_threshold = threshold
    try {
      await api.put(`/vendor/inventory/${editingItem.id}`, body)
      toast.success('Inventory updated')
      setEditingItem(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const totalSKUs = meta.total
  const inStockCount = items.filter((i) => Number(i.stock) > Number(i.reorder_level || 5)).length
  const lowStockCount = items.filter((i) => Number(i.stock) > 0 && Number(i.stock) <= Number(i.reorder_level || 5)).length
  const outOfStockCount = items.filter((i) => Number(i.stock) === 0).length

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{viewMeta.title}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            {viewMeta.subtitle || 'Monitor real-time warehouse stock levels, low-stock threshold alerts, and perform quick restocks.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={reload} disabled={loading}>
            Refresh
          </Button>
          <Link to="/vendor/products/new" className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={14} /> Add New Product
          </Link>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <Layers size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Catalog SKUs</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{totalSKUs}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Healthy In-Stock</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{inStockCount}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <AlertTriangle size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Low Stock Warnings</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{lowStockCount}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', flexShrink: 0 }}>
            <XCircle size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Out of Stock</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>{outOfStockCount}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          <div className="flex gap-1 wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-xs ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              className={`btn btn-xs flex items-center gap-1 ${lowOnly ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
              onClick={() => setLowOnly((v) => !v)}
            >
              <SlidersHorizontal size={12} /> Low Stock Only
            </button>
          </div>

          <div className="flex items-center gap-2 wrap" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="text"
                  className="input"
                  style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
                  placeholder="Search SKU or product…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-outline btn-sm" aria-label="Search">
                <Search size={14} />
              </button>
            </form>
            {(search || tab || lowOnly) && (
              <button type="button" className="btn btn-ghost btn-xs" onClick={resetFilters}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={56} />)}
          </div>
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length ? (
        <>
          <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: 260 }}>Product Details</th>
                    <th>SKU Code</th>
                    <th>Unit Price</th>
                    <th>Available Stock</th>
                    <th>Stock Status</th>
                    <th>Units Sold</th>
                    <th>Last Restocked</th>
                    <th style={{ textAlign: 'right' }}>Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const img = item.cover_image ? apiImage(item.cover_image) : getProductImage(item)
                    const stock = Number(item.stock || 0)
                    const threshold = Number(item.reorder_level || 5)
                    const isOutOfStock = stock === 0
                    const isLowStock = stock > 0 && stock <= threshold

                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 'var(--radius-sm)',
                                overflow: 'hidden',
                                border: '1px solid var(--border)',
                                background: '#fff',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={img}
                                alt={item.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-ink">{item.name}</div>
                              <div className="muted text-xs">{item.category || '—'}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="font-mono text-xs" style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                            {item.sku || '—'}
                          </span>
                        </td>

                        <td className="font-semibold text-sm">
                          {money(item.price || 0)}
                        </td>

                        <td>
                          <span
                            style={{
                              minWidth: 32,
                              display: 'inline-block',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                              color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : 'var(--ink)'
                            }}
                          >
                            {stock}
                          </span>
                          <span className="muted text-xs"> / threshold {threshold}</span>
                        </td>

                        <td>
                          {isOutOfStock ? (
                            <span className="chip chip-sm" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 700 }}>
                              <XCircle size={11} /> Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="chip chip-sm" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: 700 }}>
                              <AlertTriangle size={11} /> Low Stock ({stock} left)
                            </span>
                          ) : (
                            <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
                              <CheckCircle2 size={11} /> In Stock
                            </span>
                          )}
                        </td>

                        <td className="muted text-sm font-medium">
                          {item.total_sold || 0} units
                        </td>

                        <td className="muted text-xs">
                          {formatDate(item.updated_at)}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              className="btn btn-outline btn-xs flex items-center gap-1"
                              onClick={() => openEdit(item)}
                            >
                              <Edit3 size={12} /> Edit Stock
                            </button>
                            <Link
                              to={`/vendor/products/${item.id}/edit`}
                              className="btn btn-ghost btn-xs"
                              title="Edit Product"
                            >
                              <Edit3 size={12} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title="No inventory items match"
          message="Try adjusting your search query or status filter."
          action={
            <button className="btn btn-outline" onClick={resetFilters}>
              Reset Filters
            </button>
          }
        />
      )}

      {editingItem && (
        <Modal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Edit Stock: ${editingItem.name}`}
          size="sm"
        >
          <form onSubmit={saveItem} className="flex flex-col gap-3">
            <div className="p-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div className="muted text-xs">SKU: <span className="font-mono">{editingItem.sku || '—'}</span></div>
              <div className="muted text-xs mt-1">Units sold: <strong>{editingItem.total_sold || 0}</strong></div>
            </div>

            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              required
              value={editQty}
              onChange={(e) => setEditQty(e.target.value)}
              placeholder="e.g. 25"
            />

            <Input
              label="Low Stock Threshold (reorder level)"
              type="number"
              min="0"
              required
              value={editThreshold}
              onChange={(e) => setEditThreshold(e.target.value)}
              placeholder="e.g. 5"
            />

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingItem(null)}>
                Cancel
              </button>
              <Button type="submit" size="sm" icon={Save} disabled={saving}>
                {saving ? <Spinner size={14} color="#fff" /> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
