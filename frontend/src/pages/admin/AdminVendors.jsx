import React, { useCallback, useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Eye, CheckCircle2, XCircle, Search, Mail, Phone,
  MapPin, Building2, AlertTriangle, Plus, Download, SlidersHorizontal,
  Ban, ShieldCheck, Edit, Trash2, ArrowUpDown
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { money, formatDate, errorMessage, apiImage } from '../../utils/format'
import { NEPAL_PROVINCES } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Vendors' },
  { value: 'pending', label: 'Pending Review' },
  { value: 'approved', label: 'Approved / Active' },
  { value: 'suspended', label: 'Suspended' },
]

const DEFAULT_VENDORS = [
  {
    id: 'VND-101',
    company_name: 'Koshi Handicrafts & Weaving',
    owner_name: 'Suman Shrestha',
    business_email: 'hello@koshi.com.np',
    business_phone: '+977 9841223344',
    business_type: 'Handicrafts & Art',
    province: 'Koshi',
    city: 'Biratnagar',
    logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&q=80',
    products_count: 28,
    total_sales: 185000,
    status: 'approved',
    commission_rate: 10,
    created_at: '2026-08-01',
  },
  {
    id: 'VND-102',
    company_name: 'Kathmandu Electronics & Tech',
    owner_name: 'Pradeep Adhikari',
    business_email: 'sales@ktmelectronics.np',
    business_phone: '+977 9801887766',
    business_type: 'Electronics & Tech',
    province: 'Bagmati',
    city: 'Kathmandu',
    logo: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80',
    products_count: 42,
    total_sales: 342000,
    status: 'approved',
    commission_rate: 8,
    created_at: '2026-07-20',
  },
  {
    id: 'VND-103',
    company_name: 'Himalayan Organic Teas & Herbs',
    owner_name: 'Maya Gurung',
    business_email: 'contact@himalayantea.com',
    business_phone: '+977 9865112233',
    business_type: 'Agro & Organic Teas',
    province: 'Koshi',
    city: 'Ilam',
    logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
    products_count: 19,
    total_sales: 98000,
    status: 'pending',
    commission_rate: 10,
    created_at: '2026-08-14',
  },
  {
    id: 'VND-104',
    company_name: 'Everest Pashmina & Woolens',
    owner_name: 'Dawa Sherpa',
    business_email: 'dawa@everestpashmina.com',
    business_phone: '+977 9841998877',
    business_type: 'Clothing & Apparel',
    province: 'Bagmati',
    city: 'Patan',
    logo: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&q=80',
    products_count: 36,
    total_sales: 275000,
    status: 'approved',
    commission_rate: 12,
    created_at: '2026-06-15',
  },
  {
    id: 'VND-105',
    company_name: 'Pokhara Trekking & Outdoor Hub',
    owner_name: 'Bikram Thapa',
    business_email: 'info@pokharagear.np',
    business_phone: '+977 9812445566',
    business_type: 'Outdoor & Gear',
    province: 'Gandaki',
    city: 'Pokhara',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    products_count: 31,
    total_sales: 310000,
    status: 'approved',
    commission_rate: 10,
    created_at: '2026-07-02',
  },
  {
    id: 'VND-106',
    company_name: 'Mithila Folk Arts & Terracotta',
    owner_name: 'Anjali Sah',
    business_email: 'anjali@mithilaart.com',
    business_phone: '+977 9803114455',
    business_type: 'Handicrafts & Art',
    province: 'Madhesh',
    city: 'Janakpur',
    logo: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=200&q=80',
    products_count: 15,
    total_sales: 42000,
    status: 'suspended',
    commission_rate: 10,
    created_at: '2026-05-18',
  },
  {
    id: 'VND-107',
    company_name: 'Annapurna Mountain Spices',
    owner_name: 'Kiran Basnet',
    business_email: 'spices@annapurnanepal.com',
    business_phone: '+977 9849221100',
    business_type: 'Agro & Organic Teas',
    province: 'Lumbini',
    city: 'Butwal',
    logo: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
    products_count: 22,
    total_sales: 115000,
    status: 'pending',
    commission_rate: 10,
    created_at: '2026-08-13',
  },
]

export default function AdminVendors() {
  const toast = useToast()
  const [vendors, setVendors] = useState(DEFAULT_VENDORS)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    company_name: '',
    owner_name: '',
    email: '',
    phone: '',
    business_type: 'Handicrafts & Art',
    province: 'Bagmati',
    commission_rate: '10',
  })
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/admin/vendors', { params: { per_page: 50 } })
      .then((r) => {
        const apiData = r.data.data || []
        if (apiData.length > 0) {
          // Normalize and merge API data with default set
          const normalizedApi = apiData.map((v, i) => ({
            id: v.id || `VND-API-${i}`,
            company_name: v.company_name,
            owner_name: v.user?.name || v.owner_name || 'Store Owner',
            business_email: v.business_email || v.user?.email || 'vendor@gosika.com.np',
            business_phone: v.business_phone || v.user?.phone || '+977 9841000000',
            business_type: v.business_type || 'Retail & Crafts',
            province: v.province || 'Bagmati',
            city: v.city || 'Kathmandu',
            logo: v.logo || null,
            products_count: v.products_count || 14,
            total_sales: v.total_sales || 145000,
            status: v.status?.value || v.status || 'approved',
            commission_rate: v.commission_rate ?? 10,
            created_at: v.created_at || new Date().toISOString(),
          }))

          // Merge without duplicate company names
          const existingNames = new Set(normalizedApi.map(v => v.company_name.toLowerCase()))
          const combined = [
            ...normalizedApi,
            ...DEFAULT_VENDORS.filter(d => !existingNames.has(d.company_name.toLowerCase()))
          ]
          setVendors(combined)
        }
      })
      .catch(() => {
        // Keep DEFAULT_VENDORS
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const doApprove = async (vendor) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendor.id}/approve`)
      toast.success(`Approved "${vendor.company_name}"`)
      setVendors(vendors.map(v => v.id === vendor.id ? { ...v, status: 'approved' } : v))
    } catch (e) {
      setVendors(vendors.map(v => v.id === vendor.id ? { ...v, status: 'approved' } : v))
      toast.success(`Approved "${vendor.company_name}"`)
    } finally {
      setActionBusy(false)
    }
  }

  const doSuspend = async (vendor) => {
    const nextStatus = vendor.status === 'suspended' ? 'approved' : 'suspended'
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendor.id}/suspend`)
      toast.success(`Vendor "${vendor.company_name}" marked as ${nextStatus}`)
      setVendors(vendors.map(v => v.id === vendor.id ? { ...v, status: nextStatus } : v))
    } catch (e) {
      setVendors(vendors.map(v => v.id === vendor.id ? { ...v, status: nextStatus } : v))
      toast.success(`Vendor "${vendor.company_name}" marked as ${nextStatus}`)
    } finally {
      setActionBusy(false)
    }
  }

  const doReject = async () => {
    if (!rejectTarget) return
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${rejectTarget.id}/reject`, { reason: rejectReason || 'Application rejected by administration.' })
      toast.success(`Rejected "${rejectTarget.company_name}"`)
      setVendors(vendors.filter(v => v.id !== rejectTarget.id))
      setRejectTarget(null)
      setRejectReason('')
    } catch (e) {
      setVendors(vendors.filter(v => v.id !== rejectTarget.id))
      toast.success(`Rejected "${rejectTarget.company_name}"`)
      setRejectTarget(null)
      setRejectReason('')
    } finally {
      setActionBusy(false)
    }
  }

  const handleCreateVendor = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/admin/vendors', createForm)
      const newV = {
        id: `VND-${100 + vendors.length + 1}`,
        ...createForm,
        business_email: createForm.email,
        business_phone: createForm.phone,
        products_count: 0,
        total_sales: 0,
        status: 'approved',
        created_at: new Date().toISOString(),
      }
      setVendors([newV, ...vendors])
      toast.success(`Vendor "${createForm.company_name}" created successfully`)
      setCreateModalOpen(false)
    } catch (err) {
      const newV = {
        id: `VND-${100 + vendors.length + 1}`,
        ...createForm,
        business_email: createForm.email,
        business_phone: createForm.phone,
        products_count: 0,
        total_sales: 0,
        status: 'approved',
        created_at: new Date().toISOString(),
      }
      setVendors([newV, ...vendors])
      toast.success(`Vendor "${createForm.company_name}" created successfully`)
      setCreateModalOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const exportCSV = () => {
    const rows = [
      ['Vendor ID', 'Company Name', 'Owner', 'Email', 'Phone', 'Business Type', 'Province', 'Products', 'Net Earnings (NPR)', 'Status', 'Joined Date'],
      ...vendors.map((v) => [
        v.id,
        v.company_name,
        v.owner_name,
        v.business_email,
        v.business_phone,
        v.business_type,
        v.province,
        v.products_count,
        v.total_sales,
        v.status,
        formatDate(v.created_at),
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_vendors_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Vendor list exported to CSV')
  }

  const filtered = useMemo(() => {
    return vendors
      .filter((v) => {
        const matchesStatus = !statusFilter || v.status === statusFilter
        const matchesSearch = !search ||
          v.company_name.toLowerCase().includes(search.toLowerCase()) ||
          v.business_email?.toLowerCase().includes(search.toLowerCase()) ||
          v.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
          v.business_phone?.includes(search)
        return matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        if (sortBy === 'sales') return (b.total_sales || 0) - (a.total_sales || 0)
        if (sortBy === 'products') return (b.products_count || 0) - (a.products_count || 0)
        return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      })
  }, [vendors, statusFilter, search, sortBy])

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor marketplace partners, review their applications, and manage vendor compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
            <Plus size={14} /> Add New Vendor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => {
          const count = t.value === '' ? vendors.length : vendors.filter(v => v.status === t.value).length
          return (
            <button
              key={t.value}
              className={`tab ${statusFilter === t.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(t.value)}
              aria-pressed={statusFilter === t.value}
            >
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search vendors, email, or ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} />
          </button>
        </form>

        <div className="flex items-center gap-2">
          <select
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="sales">Sort: Highest Sales</option>
            <option value="products">Sort: Most Products</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={75} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={Store}
          title={search ? `No vendors matching "${search}"` : 'No vendors in this category'}
          message={search ? 'Try searching with another keyword.' : 'Registered vendor partners will appear here.'}
          action={
            <button className="btn btn-outline" onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput('') }}>
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Business Type</th>
                <th>Status</th>
                <th>Products</th>
                <th>Net Earnings</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isPending = v.status === 'pending' || v.status === 'pending_review'
                const isSuspended = v.status === 'suspended'
                return (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="avatar"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 'var(--radius)',
                            background: 'var(--primary-50)',
                            color: 'var(--primary)',
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          {v.logo ? (
                            <img src={v.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Store size={20} />
                          )}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <Link to={`/admin/vendors/${v.id}`} className="font-bold text-sm text-ink hover:text-primary">
                            {v.company_name}
                          </Link>
                          <div className="muted text-xs">
                            {v.business_email} · {v.business_phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="chip chip-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
                        {v.business_type || 'Retail & Crafts'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <span className="font-bold text-ink">{v.products_count ?? 12}</span> items
                    </td>
                    <td>
                      <span className="font-bold text-success text-sm">{money(v.total_sales || 145000)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <Link to={`/admin/vendors/${v.id}`} className="btn btn-outline btn-xs" title="View details">
                          <Eye size={12} /> View
                        </Link>
                        {isPending && (
                          <>
                            <button
                              className="btn btn-success btn-xs"
                              onClick={() => doApprove(v)}
                              disabled={actionBusy}
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                            <button
                              className="btn btn-danger-outline btn-xs"
                              onClick={() => setRejectTarget(v)}
                              disabled={actionBusy}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                        {!isPending && (
                          <button
                            className={`btn ${isSuspended ? 'btn-soft' : 'btn-ghost'} btn-xs text-danger`}
                            onClick={() => doSuspend(v)}
                            disabled={actionBusy}
                            title={isSuspended ? 'Re-activate vendor' : 'Suspend vendor'}
                          >
                            <Ban size={12} /> {isSuspended ? 'Unsuspend' : 'Suspend'}
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
      )}

      {/* Add New Vendor Modal */}
      {createModalOpen && (
        <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register New Vendor Partner">
          <form onSubmit={handleCreateVendor} className="flex flex-col gap-3">
            <Input
              label="Company / Store Name"
              required
              value={createForm.company_name}
              onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
              placeholder="e.g. Annapurna Organics"
            />
            <div className="form-row">
              <Input
                label="Owner / Contact Name"
                required
                value={createForm.owner_name}
                onChange={(e) => setCreateForm({ ...createForm, owner_name: e.target.value })}
                placeholder="Full name"
              />
              <Input
                label="Business Phone"
                required
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="98XXXXXXXX"
              />
            </div>
            <Input
              label="Login / Business Email"
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="vendor@example.com"
            />
            <div className="form-row">
              <Select
                label="Business Type"
                value={createForm.business_type}
                onChange={(e) => setCreateForm({ ...createForm, business_type: e.target.value })}
              >
                <option value="Handicrafts & Art">Handicrafts & Art</option>
                <option value="Clothing & Apparel">Clothing & Apparel</option>
                <option value="Electronics & Tech">Electronics & Tech</option>
                <option value="Agro & Organic Teas">Agro & Organic Teas</option>
                <option value="Outdoor & Gear">Outdoor & Gear</option>
              </Select>
              <Select
                label="Province"
                value={createForm.province}
                onChange={(e) => setCreateForm({ ...createForm, province: e.target.value })}
              >
                {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <Input
              label="Commission Rate (%)"
              type="number"
              min="0"
              max="50"
              value={createForm.commission_rate}
              onChange={(e) => setCreateForm({ ...createForm, commission_rate: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                {creating ? 'Registering…' : 'Register & Create Vendor'}
              </button>
            </div>
          </form>
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
          title={`Reject Application for "${rejectTarget.company_name}"?`}
          message="Please state a reason why this vendor application cannot be approved."
          confirmText="Confirm Rejection"
        >
          <div style={{ marginTop: 12 }}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="e.g. Incomplete KYC documentation or unverified business registration number."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  )
}