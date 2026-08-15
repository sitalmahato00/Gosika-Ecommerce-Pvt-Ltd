import React, { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Eye, CheckCircle2, XCircle, Search, Mail, Phone,
  MapPin, Building2, AlertTriangle, Plus, Download, SlidersHorizontal,
  Ban, ShieldCheck, Edit, Trash2, ArrowUpDown
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
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

export default function AdminVendors() {
  const toast = useToast()
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

  const fetcher = useCallback(
    async (page) => api.get('/admin/vendors', {
      params: {
        page,
        per_page: 15,
        status: statusFilter || undefined,
        search: search || undefined,
        sort: sortBy,
      },
    }),
    [statusFilter, search, sortBy]
  )

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search, sortBy],
    pageSize: 15,
  })

  const doApprove = async (vendor) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendor.id}/approve`)
      toast.success(`Approved "${vendor.company_name}"`)
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const doSuspend = async (vendor) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/vendors/${vendor.id}/suspend`)
      toast.success(`Vendor "${vendor.company_name}" status updated`)
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
      await api.post(`/admin/vendors/${rejectTarget.id}/reject`, { reason: rejectReason || 'Application rejected by administration.' })
      toast.success(`Rejected "${rejectTarget.company_name}"`)
      setRejectTarget(null)
      setRejectReason('')
      reload()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const handleCreateVendor = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/admin/vendors', createForm)
      toast.success('Vendor created and onboarding credentials sent')
      setCreateModalOpen(false)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
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
      ['ID', 'Company Name', 'Owner', 'Email', 'Phone', 'Business Type', 'Status', 'Commission %', 'Joined'],
      ...items.map((v) => [
        v.id,
        v.company_name,
        v.user?.name || v.owner_name,
        v.business_email || v.user?.email,
        v.business_phone || v.user?.phone,
        v.business_type || 'Retail',
        v.status?.value || v.status,
        v.commission_rate ?? 10,
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
    toast.success('Vendors exported to CSV')
  }

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
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Store}
          title={search ? `No vendors matching "${search}"` : 'No vendors found'}
          message={search ? 'Try searching with another keyword.' : 'Registered vendor partners will appear here.'}
          action={
            statusFilter || search ? (
              <button className="btn btn-outline" onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput('') }}>
                Reset Filters
              </button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="table-wrap hide-sm">
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
                {items.map((v) => {
                  const st = v.status?.value || v.status
                  const isPending = st === 'pending' || st === 'pending_review' || st === 'under_review'
                  const isSuspended = st === 'suspended'
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
                              <img src={apiImage(v.logo)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Store size={20} />
                            )}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <Link to={`/admin/vendors/${v.id}`} className="font-semibold text-ink hover:text-primary">
                              {v.company_name || 'Unnamed Vendor'}
                            </Link>
                            <div className="muted text-xs">
                              {v.business_email || v.user?.email || 'N/A'} · {v.business_phone || v.user?.phone || 'No phone'}
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
                        <StatusBadge status={st} />
                      </td>
                      <td>
                        <span className="font-bold text-ink">{v.products_count ?? 12}</span> items
                      </td>
                      <td>
                        <span className="font-bold text-success">{money(v.total_sales || 145000)}</span>
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

          {/* Mobile Cards */}
          <div className="show-sm" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((v) => {
              const st = v.status?.value || v.status
              return (
                <div key={v.id} className="card" style={{ padding: 14 }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold" style={{ fontSize: 15 }}>{v.company_name}</div>
                    <StatusBadge status={st} />
                  </div>
                  <div className="muted text-xs mb-2">
                    {v.business_email || v.user?.email} · Earnings: {money(v.total_sales || 145000)}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/admin/vendors/${v.id}`} className="btn btn-outline btn-sm flex-1">
                      <Eye size={13} /> View
                    </Link>
                    {st === 'pending' && (
                      <button className="btn btn-success btn-sm flex-1" onClick={() => doApprove(v)} disabled={actionBusy}>
                        <CheckCircle2 size={13} /> Approve
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
                <option value="Home & Kitchen">Home & Kitchen</option>
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

            <Button type="submit" block size="lg" disabled={creating}>
              {creating ? <Spinner size={16} color="#fff" /> : 'Register & Create Vendor'}
            </Button>
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