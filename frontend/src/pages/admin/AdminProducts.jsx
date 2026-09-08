import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Package, Check, X, Eye, RefreshCw, Download,
  CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, getProductImage, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminProducts() {
  const toast = useToast()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'suspend'
    product: null,
    loading: false
  })

  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(api.unwrapList(res.data)))
      .catch(() => {})
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (categoryFilter) {
        params.category_id = categoryFilter
      }
      if (search.trim()) {
        params.search = search.trim()
      }

      const res = await api.get('/admin/products', { params })
      const data = api.unwrapList(res.data)
      setProducts(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load products from catalog.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [page, statusFilter, categoryFilter])

  const handleAction = (action, product) => {
    setDialogState({
      isOpen: true,
      action,
      product,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, product } = dialogState
    if (!product) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = product.uuid || product.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/products/${targetId}/approve`)
        toast.success(`Product "${product.name}" approved and published!`)
      } else if (action === 'reject') {
        await api.post(`/admin/products/${targetId}/reject`, { reason })
        toast.success(`Product "${product.name}" rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/products/${targetId}/suspend`, { reason })
        toast.success(`Product "${product.name}" suspended.`)
      }

      setDialogState({ isOpen: false, action: null, product: null, loading: false })
      loadProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Product ID', 'Name', 'SKU', 'Category', 'Store', 'Vendor', 'Price', 'Stock', 'Status'],
      ...products.map(p => [
        p.id,
        `"${p.name || ''}"`,
        p.sku || '',
        p.category?.name || '',
        p.store?.name || '',
        p.vendor?.company_name || '',
        p.price || 0,
        p.quantity || 0,
        p.status || ''
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', `gosika_products_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Catalog exported to CSV.')
  }

  const columns = [
    {
      header: 'Product',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              overflow: 'hidden',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              flexShrink: 0
            }}
          >
            <img
              src={getProductImage(item)}
              alt={item.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div>
            <Link
              to={`/admin/marketplace/products/${item.uuid || item.id}`}
              style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              className="hover:text-primary"
            >
              {item.name}
            </Link>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>
              SKU: {item.sku || '—'}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: item => item.category?.name || '—',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          {item.category?.name || '—'}
        </span>
      )
    },
    {
      header: 'Store / Vendor',
      render: item => (
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
            {item.store?.name || '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {item.vendor?.company_name || '—'}
          </div>
        </div>
      )
    },
    {
      header: 'Price (NPR)',
      align: 'right',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--ink)' }}>
            {money(item.price)}
          </div>
          {item.compare_at_price > item.price && (
            <div style={{ fontSize: 10.5, color: 'var(--muted)', textDecoration: 'line-through' }}>
              {money(item.compare_at_price)}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Inventory',
      align: 'right',
      render: item => {
        const inStock = (item.quantity || 0) > 0
        return (
          <span
            className="chip chip-sm"
            style={{
              fontSize: 11,
              fontWeight: 800,
              background: inStock ? '#dcfce7' : '#fee2e2',
              color: inStock ? '#16a34a' : '#dc2626'
            }}
          >
            {inStock ? `${item.quantity} in stock` : 'Out of stock'}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isPending = item.status === 'pending_review' || item.status === 'pending'
        const isApproved = item.status === 'approved'

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Link
              to={`/admin/marketplace/products/${item.uuid || item.id}`}
              className="btn btn-outline btn-xs"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={12} /> Inspect
            </Link>

            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve & Publish"
                >
                  <Check size={12} /> Approve
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                  title="Reject"
                >
                  <X size={12} /> Reject
                </button>
              </>
            )}

            {isApproved && (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => handleAction('suspend', item)}
                title="Suspend"
              >
                Suspend
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Product Moderation & Catalog"
        description="Review seller listings, verify product quality and specifications, manage status, and monitor inventory."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Products' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadProducts}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product by title, SKU..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'pending_review', label: 'Pending Moderation' },
          { value: 'approved', label: 'Approved / Live' },
          { value: 'draft', label: 'Draft' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        extraFilters={
          categories.length > 0 && (
            <div style={{ minWidth: 160 }}>
              <select
                className="input"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                style={{ height: 36, fontSize: 13, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c.id || c.uuid} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
        onReset={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('') }}
      />

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={item => navigate(`/admin/marketplace/products/${item.uuid || item.id}`)}
        emptyTitle="No products found"
        emptyDescription="There are no catalog products matching your filter conditions."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, product: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Product "${dialogState.product?.name}"?`
            : dialogState.action === 'reject'
            ? `Reject Submission "${dialogState.product?.name}"?`
            : `Suspend Product "${dialogState.product?.name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will immediately publish this product on the marketplace for customer purchasing.'
            : 'Please specify the reason for rejecting or suspending this listing.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve & Publish' : dialogState.action === 'reject' ? 'Reject Submission' : 'Suspend Listing'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Specify reason (e.g. prohibited item, incorrect image quality, misleading price)..."
      />
    </div>
  )
}
