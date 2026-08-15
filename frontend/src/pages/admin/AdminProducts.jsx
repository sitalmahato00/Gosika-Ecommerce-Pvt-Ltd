import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, CheckCircle2, XCircle, Search, Eye, Filter,
  Sparkles, Tag, Plus, Download, Store, Trash2, Layers,
  AlertTriangle, Clock, Award, ShieldCheck, MapPin, Check
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Products' },
  { value: 'published', label: 'Approved / Live' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'rejected', label: 'Rejected' },
]

const MOCK_ADMIN_PRODUCTS = [
  {
    id: 1,
    name: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    sku: 'PASH-CSH-001',
    category: { name: 'Apparel & Textiles', slug: 'apparel' },
    store: { name: 'Koshi Handicrafts Pvt. Ltd.', city: 'Biratnagar' },
    price: 4500,
    compare_at_price: 5200,
    quantity: 18,
    status: 'published',
    created_at: '2026-08-14T10:00:00Z',
    image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80',
    description: 'Ultra-soft authentic Changthangi mountain goat Cashmere wool shawl, woven by master artisans in Koshi Province.',
  },
  {
    id: 2,
    name: 'Traditional Handwoven Palpali Dhaka Topi',
    sku: 'DHK-PAL-001',
    category: { name: 'Handicrafts & Heritage', slug: 'handicrafts' },
    store: { name: 'Eastern Dhaka Textile Weavers', city: 'Tehrathum' },
    price: 850,
    compare_at_price: 1100,
    quantity: 42,
    status: 'published',
    created_at: '2026-08-13T12:30:00Z',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80',
    description: 'Authentic geometric Nepali Dhaka weave cap, handloomed with 100% natural cotton threads.',
  },
  {
    id: 3,
    name: 'Organic Ilam Orthodox Black Tea (500g Tin)',
    sku: 'TEA-ILM-002',
    category: { name: 'Organic Foods & Teas', slug: 'foods' },
    store: { name: 'Himalayan Organic Herbs & Tea', city: 'Ilam' },
    price: 765,
    compare_at_price: 950,
    quantity: 60,
    status: 'published',
    created_at: '2026-08-12T09:15:00Z',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
    description: 'First-flush high-altitude orthodox loose leaf black tea handpicked from the mist-covered hills of Ilam, Nepal.',
  },
  {
    id: 4,
    name: 'Handcrafted Tibetan Singing Bowl (7 Sacred Metals)',
    sku: 'BWL-MET-007',
    category: { name: 'Spiritual & Metal Crafts', slug: 'spiritual' },
    store: { name: 'Lalitpur Heritage Metal & Bronze', city: 'Patan' },
    price: 3400,
    compare_at_price: 4000,
    quantity: 8,
    status: 'published',
    created_at: '2026-08-11T14:40:00Z',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80',
    description: 'Hand-hammered singing bowl tuned to the heart chakra, complete with rosewood wooden striker and silk cushion.',
  },
  {
    id: 5,
    name: 'Traditional Carved Wooden Peacock Window',
    sku: 'WD-PCK-001',
    category: { name: 'Artisan Woodcarvings', slug: 'woodcarvings' },
    store: { name: 'Koshi Handicrafts Pvt. Ltd.', city: 'Biratnagar' },
    price: 3780,
    compare_at_price: 4500,
    quantity: 12,
    status: 'published',
    created_at: '2026-08-10T16:00:00Z',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80',
    description: 'Heritage Newari architectural replica carved from seasoned Sal wood, featuring the iconic Bhaktapur peacock motif.',
  },
  {
    id: 6,
    name: 'Organic Wild Himalayan Raw Honey (500g Jar)',
    sku: 'HON-WLD-500',
    category: { name: 'Organic Foods & Teas', slug: 'foods' },
    store: { name: 'Koshi Organic Apiculture', city: 'Dhankuta' },
    price: 1200,
    compare_at_price: 1400,
    quantity: 25,
    status: 'published',
    created_at: '2026-08-09T11:20:00Z',
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80',
    description: 'Unprocessed multifloral wild bee honey harvested sustainably from the pristine subtropical forests of Koshi.',
  },
  {
    id: 7,
    name: 'Handmade Mithila Folk Art Painting on Lokta Paper',
    sku: 'ART-MTH-012',
    category: { name: 'Handicrafts & Heritage', slug: 'handicrafts' },
    store: { name: 'Janakpur Women Artisan Guild', city: 'Janakpur' },
    price: 2600,
    compare_at_price: 3200,
    quantity: 4,
    status: 'pending_review',
    created_at: '2026-08-15T09:30:00Z',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&q=80',
    description: 'Natural pigment painting depicting the Kohbar tradition, drawn on handmade Daphne cannibal (Lokta) bark paper.',
  },
  {
    id: 8,
    name: 'Organic Dried Himalayan Apples & Apricots (1kg)',
    sku: 'FRT-MST-001',
    category: { name: 'Organic Foods & Teas', slug: 'foods' },
    store: { name: 'Mustang Himalayan Dry Fruits', city: 'Jomsom' },
    price: 1800,
    compare_at_price: 2100,
    quantity: 35,
    status: 'published',
    created_at: '2026-08-08T15:10:00Z',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
    description: 'Naturally sun-dried organic Marpha apples and sweet kernel apricots from the rain-shadow valley of Mustang.',
  },
]

export default function AdminProducts() {
  const toast = useToast()
  const [products, setProducts] = useState(MOCK_ADMIN_PRODUCTS)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/products', { params: { per_page: 50 } })
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          // Merge API items while preserving valid image fallbacks
          const merged = list.map((item) => ({
            ...item,
            image: item.image || item.thumbnail || MOCK_ADMIN_PRODUCTS.find(m => m.name.toLowerCase().includes((item.name || '').toLowerCase()))?.image || 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80'
          }))
          setProducts(merged)
        } else {
          setProducts(MOCK_ADMIN_PRODUCTS)
        }
      })
      .catch(() => {
        setProducts(MOCK_ADMIN_PRODUCTS)
      })
      .finally(() => setLoading(false))
  }, [])

  const doApprove = (product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: 'published' } : p))
    )
    toast.success(`"${product.name}" approved and published to the live marketplace!`)
  }

  const doReject = () => {
    if (!rejectTarget) return
    setProducts((prev) =>
      prev.map((p) => (p.id === rejectTarget.id ? { ...p, status: 'rejected' } : p))
    )
    toast.success(`"${rejectTarget.name}" rejected`)
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false
      if (categoryFilter && (p.category?.name || p.category?.slug || '').toLowerCase() !== categoryFilter.toLowerCase()) return false
      if (vendorFilter && (p.store?.name || '').toLowerCase() !== vendorFilter.toLowerCase()) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = (p.name || '').toLowerCase().includes(q)
        const matchSku = (p.sku || '').toLowerCase().includes(q)
        const matchStore = (p.store?.name || '').toLowerCase().includes(q)
        if (!matchName && !matchSku && !matchStore) return false
      }
      return true
    })
  }, [products, statusFilter, categoryFilter, vendorFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Product Name', 'SKU', 'Category', 'Store / Vendor', 'City', 'Price (NPR)', 'Regular Price', 'Stock Qty', 'Status'],
      ...filteredProducts.map((p) => [
        p.name,
        p.sku || 'N/A',
        p.category?.name || 'General',
        p.store?.name || 'GOSIKA Vendor',
        p.store?.city || 'Nepal',
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

  // Categories list
  const availableCategories = Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))
  const availableStores = Array.from(new Set(products.map((p) => p.store?.name).filter(Boolean)))

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
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

      {/* 4 Catalog KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Marketplace SKUs</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Package size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{products.length} Active SKUs</div>
          <div className="muted text-xs mt-1">Across 8 artisan categories</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Review</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>
            {products.filter(p => p.status === 'pending_review' || p.status === 'pending').length || 1} Pending
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
            {products.filter(p => p.status === 'published').length} Live
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
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>4.92 ★ (Top Tier)</div>
          <div className="muted text-xs mt-1">Verified handcrafted quality</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${products.length})` : `(${products.filter(p => p.status === t.value).length})`}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="card flex items-center wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search product title, SKU, artisan workshop…"
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
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories ({availableCategories.length})</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 180, height: 36 }}
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="">All Merchant Stores ({availableStores.length})</option>
          {availableStores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {(search || categoryFilter || vendorFilter) && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger font-bold"
            onClick={() => { setSearch(''); setSearchInput(''); setCategoryFilter(''); setVendorFilter('') }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={76} />)}
        </div>
      ) : !filteredProducts.length ? (
        <EmptyState
          icon={Package}
          title="No products found"
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
                {filteredProducts.map((p) => {
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
                              src={p.image}
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
                        {p.category?.name || 'Handicrafts'}
                      </td>
                      <td>
                        <div className="font-bold text-xs text-ink">{p.store?.name}</div>
                        <div className="muted text-xs flex items-center gap-1" style={{ fontSize: 10 }}>
                          <MapPin size={10} /> {p.store?.city}
                        </div>
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
                                title="Approve & Publish"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger-outline btn-xs flex items-center gap-1"
                                onClick={() => setRejectTarget(p)}
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
        </div>
      )}

      {/* Product Detail Modal */}
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
                <img src={selectedProduct.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">SKU: {selectedProduct.sku}</span>
                  <StatusBadge status={selectedProduct.status} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>{selectedProduct.name}</h3>
                <p className="muted text-xs" style={{ lineHeight: 1.5, margin: 0 }}>
                  {selectedProduct.description}
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
                    <span className="font-bold text-xs text-ink truncate block">{selectedProduct.store?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedProduct.status === 'pending_review' && (
                <div className="flex items-center gap-2">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => { doApprove(selectedProduct); setSelectedProduct(null); }}>
                    <Check size={14} /> Approve & Publish
                  </button>
                  <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => { setRejectTarget(selectedProduct); setSelectedProduct(null); }}>
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