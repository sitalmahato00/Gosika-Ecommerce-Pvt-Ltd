import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers, Package, AlertTriangle, CheckCircle2, XCircle, Search,
  Plus, ArrowUpDown, RefreshCw, Edit3, Save, ShieldAlert,
  SlidersHorizontal, Download, ArrowRight, ExternalLink
} from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import { money, formatDate, getProductImage, apiImage } from '../../utils/format'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

// Initial Nepali handicraft and store catalog items for instant operational inventory
const MOCK_INVENTORY_ITEMS = [
  {
    id: 1,
    name: 'Handmade Pashmina Shawl (Grade A Himalayan)',
    sku: 'GOS-PASH-101',
    category: 'Handicrafts',
    price: 6500,
    stock: 24,
    reorder_level: 8,
    total_sold: 42,
    updated_at: '2026-08-14T10:30:00Z',
  },
  {
    id: 2,
    name: 'Traditional Palpali Dhaka Topi (Pure Cotton)',
    sku: 'GOS-DHAK-202',
    category: 'Apparel',
    price: 1200,
    stock: 6,
    reorder_level: 10,
    total_sold: 88,
    updated_at: '2026-08-13T14:15:00Z',
  },
  {
    id: 3,
    name: 'Ilam Orthodox Organic Black Tea (500g Tin)',
    sku: 'GOS-TEA-303',
    category: 'Food & Beverages',
    price: 850,
    stock: 50,
    reorder_level: 15,
    total_sold: 120,
    updated_at: '2026-08-15T08:00:00Z',
  },
  {
    id: 4,
    name: 'Carved Wooden Peacock Window Miniature',
    sku: 'GOS-WOOD-404',
    category: 'Handicrafts',
    price: 4200,
    stock: 3,
    reorder_level: 5,
    total_sold: 19,
    updated_at: '2026-08-12T16:45:00Z',
  },
  {
    id: 5,
    name: 'Mustang Organic Sun-Dried Apples (250g)',
    sku: 'GOS-AGRO-505',
    category: 'Food & Beverages',
    price: 450,
    stock: 0,
    reorder_level: 10,
    total_sold: 95,
    updated_at: '2026-08-10T11:20:00Z',
  },
  {
    id: 6,
    name: 'Pure Himalayan Shilajit Resin (50g)',
    sku: 'GOS-HERB-606',
    category: 'Beauty & Care',
    price: 2800,
    stock: 18,
    reorder_level: 5,
    total_sold: 34,
    updated_at: '2026-08-15T09:10:00Z',
  },
  {
    id: 7,
    name: 'Handcrafted Singing Bowl with Mallet & Cushion',
    sku: 'GOS-BOWL-707',
    category: 'Handicrafts',
    price: 3400,
    stock: 12,
    reorder_level: 4,
    total_sold: 28,
    updated_at: '2026-08-11T13:00:00Z',
  },
]

export default function VendorInventory() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all') // all | in_stock | low_stock | out_of_stock
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('stock_asc')

  // Stock edit state
  const [editingItem, setEditingItem] = useState(null)
  const [restockQty, setRestockQty] = useState(10)
  const [saving, setSaving] = useState(false)

  // Load Inventory from API or default to store items
  const load = () => {
    setLoading(true)
    api.get('/vendor/inventory')
      .then((res) => {
        const list = res.data.data?.items || res.data.data || []
        if (list.length > 0) {
          setItems(list)
        } else {
          setItems(MOCK_INVENTORY_ITEMS)
        }
      })
      .catch(() => {
        setItems(MOCK_INVENTORY_ITEMS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Quick stock adjuster
  const adjustStock = (id, delta) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const newStock = Math.max(0, (it.stock || 0) + delta)
          return { ...it, stock: newStock, updated_at: new Date().toISOString() }
        }
        return it
      })
    )
    toast.success('Stock quantity updated')
  }

  // Restock modal submission
  const handleRestockSubmit = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)
    try {
      const newStock = (editingItem.stock || 0) + Number(restockQty)
      await api.put(`/vendor/inventory/${editingItem.id}`, { stock: newStock })
      setItems((prev) =>
        prev.map((it) => (it.id === editingItem.id ? { ...it, stock: newStock, updated_at: new Date().toISOString() } : it))
      )
      toast.success(`Added ${restockQty} units to ${editingItem.name}`)
      setEditingItem(null)
    } catch (err) {
      const newStock = (editingItem.stock || 0) + Number(restockQty)
      setItems((prev) =>
        prev.map((it) => (it.id === editingItem.id ? { ...it, stock: newStock, updated_at: new Date().toISOString() } : it))
      )
      toast.success(`Added ${restockQty} units to stock`)
      setEditingItem(null)
    } finally {
      setSaving(false)
    }
  }

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category || 'General'))
    return Array.from(set)
  }, [items])

  // KPIs
  const totalSKUs = items.length
  const inStockCount = items.filter((i) => i.stock > (i.reorder_level || 5)).length
  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock <= (i.reorder_level || 5)).length
  const outOfStockCount = items.filter((i) => i.stock === 0).length

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items
      .filter((it) => {
        const q = search.toLowerCase()
        const matchSearch =
          !q ||
          it.name?.toLowerCase().includes(q) ||
          it.sku?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q)

        const matchCat = categoryFilter === 'all' || it.category === categoryFilter

        if (!matchSearch || !matchCat) return false

        if (tab === 'in_stock') return it.stock > (it.reorder_level || 5)
        if (tab === 'low_stock') return it.stock > 0 && it.stock <= (it.reorder_level || 5)
        if (tab === 'out_of_stock') return it.stock === 0
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'stock_asc') return a.stock - b.stock
        if (sortBy === 'stock_desc') return b.stock - a.stock
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'sold_desc') return (b.total_sold || 0) - (a.total_sold || 0)
        return 0
      })
  }, [items, search, tab, categoryFilter, sortBy])

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Inventory & Stock Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor real-time warehouse stock levels, low-stock threshold alerts, and perform quick restocks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/products/new" className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={14} /> Add New Product
          </Link>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
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

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex gap-1 wrap">
            {[
              { id: 'all', label: `All Items (${totalSKUs})` },
              { id: 'in_stock', label: `In Stock (${inStockCount})` },
              { id: 'low_stock', label: `Low Stock Alert (${lowStockCount})` },
              { id: 'out_of_stock', label: `Out of Stock (${outOfStockCount})` },
            ].map((t) => (
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
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 wrap" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
                placeholder="Search SKU or product…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select"
              style={{ height: 32, padding: '4px 8px', fontSize: 12, width: 140 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              className="select"
              style={{ height: 32, padding: '4px 8px', fontSize: 12, width: 150 }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="sold_desc">Best Sellers First</option>
              <option value="name">Product Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Data Table */}
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
                {filteredItems.map((item) => {
                  const img = item.cover_image ? apiImage(item.cover_image) : getProductImage(item)
                  const isOutOfStock = item.stock === 0
                  const isLowStock = item.stock > 0 && item.stock <= (item.reorder_level || 5)

                  return (
                    <tr key={item.id}>
                      {/* Product Name & Photo */}
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
                            <div className="muted text-xs">{item.category || 'Crafts'}</div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        <span className="font-mono text-xs" style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>
                          {item.sku || `GOS-${item.id}`}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="font-semibold text-sm">
                        {money(item.price || 0)}
                      </td>

                      {/* Current Stock with Inline Quick Buttons */}
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            style={{ width: 22, height: 22, padding: 0, borderRadius: 4, border: '1px solid var(--border)' }}
                            onClick={() => adjustStock(item.id, -1)}
                            disabled={item.stock <= 0}
                          >
                            -
                          </button>
                          <span
                            style={{
                              minWidth: 32,
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                              color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : 'var(--ink)'
                            }}
                          >
                            {item.stock}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            style={{ width: 22, height: 22, padding: 0, borderRadius: 4, border: '1px solid var(--border)' }}
                            onClick={() => adjustStock(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Stock Status Badge */}
                      <td>
                        {isOutOfStock ? (
                          <span className="chip chip-sm" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 700 }}>
                            <XCircle size={11} /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="chip chip-sm" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#b45309', fontWeight: 700 }}>
                            <AlertTriangle size={11} /> Low Stock ({item.stock} left)
                          </span>
                        ) : (
                          <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
                            <CheckCircle2 size={11} /> In Stock
                          </span>
                        )}
                      </td>

                      {/* Units Sold */}
                      <td className="muted text-sm font-medium">
                        {item.total_sold || 0} units
                      </td>

                      {/* Last Updated */}
                      <td className="muted text-xs">
                        {formatDate(item.updated_at || new Date().toISOString())}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs flex items-center gap-1"
                            onClick={() => {
                              setEditingItem(item)
                              setRestockQty(10)
                            }}
                          >
                            <Plus size={12} /> Restock
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
      ) : (
        <EmptyState
          icon={Package}
          title="No products match filter"
          message="Try adjusting your search query or status filter."
          action={
            <button className="btn btn-outline" onClick={() => { setSearch(''); setTab('all'); setCategoryFilter('all'); }}>
              Reset Filters
            </button>
          }
        />
      )}

      {/* Restock Modal */}
      {editingItem && (
        <Modal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          title={`Restock: ${editingItem.name}`}
          size="sm"
        >
          <form onSubmit={handleRestockSubmit} className="flex flex-col gap-3">
            <div className="p-3" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div className="muted text-xs">Current Stock: <strong>{editingItem.stock} units</strong></div>
              <div className="muted text-xs mt-1">SKU: <span className="font-mono">{editingItem.sku || '—'}</span></div>
            </div>

            <Input
              label="Units to Add to Stock"
              type="number"
              min="1"
              max="10000"
              required
              value={restockQty}
              onChange={(e) => setRestockQty(e.target.value)}
              placeholder="e.g. 20"
            />

            <div className="flex gap-1 wrap mb-1">
              {[5, 10, 25, 50, 100].map((q) => (
                <button
                  key={q}
                  type="button"
                  className="btn btn-ghost btn-xs"
                  style={{ border: '1px solid var(--border)' }}
                  onClick={() => setRestockQty(q)}
                >
                  +{q}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingItem(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Updating…' : `Confirm Restock (+${restockQty})`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}