import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store, Eye, Check, X, ShieldAlert, CheckCircle2,
  RefreshCw, Download, Store as StoreIcon, ShieldCheck,
  UserPlus, Mail, Phone, Lock, Building2, EyeOff, AlertCircle
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

/* ─── Add Seller Modal ────────────────────────────────────────────────────── */
const EMPTY_SELLER = {
  first_name: '', last_name: '', email: '', phone: '',
  password: '', company_name: '', business_email: '', business_phone: ''
}

function AddSellerModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_SELLER)
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const firstRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY_SELLER)
      setErrors({})
      setLoading(false)
      setTimeout(() => firstRef.current?.focus(), 80)
    }
  }, [open])

  if (!open) return null

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.phone.trim()) errs.phone = 'Phone number is required'
    if (!form.company_name.trim()) errs.company_name = 'Company / business name is required'
    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
        company_name: form.company_name.trim(),
        business_email: form.business_email.trim() || undefined,
        business_phone: form.business_phone.trim() || undefined,
      }
      await api.post('/admin/vendors/create-seller', payload)
      toast.success(`Seller account for "${form.company_name}" created successfully.`)
      onCreated()
      onClose()
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        const mapped = {}
        Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      } else {
        toast.error(data?.message || 'Failed to create seller account.')
      }
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ label, name, type = 'text', placeholder, icon: Icon, required }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
        {label}{required && <span style={{ color: '#FF5500', marginLeft: 2 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
        )}
        {name === 'password' ? (
          <>
            <input
              type={showPw ? 'text' : 'password'}
              value={form[name]}
              onChange={set(name)}
              placeholder={placeholder}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: Icon ? '8px 36px 8px 30px' : '8px 12px',
                border: `1px solid ${errors[name] ? '#fca5a5' : '#E5E7EB'}`,
                borderRadius: 8, fontSize: 13, outline: 'none',
                background: errors[name] ? '#fff5f5' : '#fff',
                color: '#111827'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </>
        ) : (
          <input
            ref={name === 'first_name' ? firstRef : undefined}
            type={type}
            value={form[name]}
            onChange={set(name)}
            placeholder={placeholder}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: Icon ? '8px 12px 8px 30px' : '8px 12px',
              border: `1px solid ${errors[name] ? '#fca5a5' : '#E5E7EB'}`,
              borderRadius: 8, fontSize: 13, outline: 'none',
              background: errors[name] ? '#fff5f5' : '#fff',
              color: '#111827'
            }}
          />
        )}
      </div>
      {errors[name] && (
        <span style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
          <AlertCircle size={10} />{errors[name]}
        </span>
      )}
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)', overflow: 'hidden',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF3EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={18} style={{ color: '#FF5500' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Create Seller Account</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Add a new seller — they can log in and complete KYC verification</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#9CA3AF', borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <form id="add-seller-form" onSubmit={handleSubmit} noValidate>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Personal details */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FF5500', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Personal Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="First Name" name="first_name" placeholder="e.g. Suman" required />
                  <Field label="Last Name" name="last_name" placeholder="e.g. Pokhrel" required />
                </div>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Email Address" name="email" type="email" placeholder="seller@example.com" icon={Mail} required />
                  <Field label="Phone" name="phone" placeholder="98XXXXXXXX" icon={Phone} required />
                </div>
                <div style={{ marginTop: 10 }}>
                  <Field label="Password" name="password" placeholder="Min. 8 characters" icon={Lock} required />
                </div>
              </div>

              {/* Business details */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FF5500', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Business Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Field label="Company / Business Name" name="company_name" placeholder="e.g. Himalayan Handicrafts Pvt. Ltd." icon={Building2} required />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Business Email" name="business_email" type="email" placeholder="hello@business.com.np" icon={Mail} />
                    <Field label="Business Phone" name="business_phone" placeholder="98XXXXXXXX" icon={Phone} />
                  </div>
                </div>
              </div>

              {/* Info note */}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8 }}>
                <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
                  The seller will be created with <strong>Pending</strong> status. They must log in and complete email verification and KYC before selling.
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#FAFAFA' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-seller-form"
            disabled={loading}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: loading ? '#FDA580' : '#FF5500', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Creating…
              </>
            ) : (
              <><UserPlus size={14} /> Create Seller Account</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminVendors() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const navigate = useNavigate()

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'suspend' | 'activate'
    vendor: null,
    loading: false
  })

  const [addSellerOpen, setAddSellerOpen] = useState(false)

  const loadVendors = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/vendors', { params })
      const data = api.unwrapList(res.data)
      setVendors(data)
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
      toast.error('Failed to load vendors.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVendors()
  }, [page, statusFilter])

  const handleAction = (action, vendor) => {
    setDialogState({
      isOpen: true,
      action,
      vendor,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, vendor } = dialogState
    if (!vendor) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = vendor.uuid || vendor.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/vendors/${targetId}/approve`)
        toast.success(`Vendor "${vendor.company_name}" approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/vendors/${targetId}/reject`, { reason })
        toast.success(`Vendor "${vendor.company_name}" application rejected.`)
      } else if (action === 'suspend') {
        await api.post(`/admin/vendors/${targetId}/suspend`, { reason })
        toast.success(`Vendor "${vendor.company_name}" suspended.`)
      } else if (action === 'activate') {
        await api.post(`/admin/vendors/${targetId}/activate`)
        toast.success(`Vendor "${vendor.company_name}" activated.`)
      }

      setDialogState({ isOpen: false, action: null, vendor: null, loading: false })
      loadVendors()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Vendor ID', align: 'right' },
        { label: 'Company Name' },
        { label: 'Email' },
        { label: 'Phone' },
        { label: 'PAN/VAT' },
        { label: 'Commission Rate (%)', align: 'right' },
        { label: 'Status' },
        { label: 'Registered At' },
      ],
      rows: vendors.map((v) => [
        v.id,
        v.company_name || '',
        v.business_email || '',
        v.business_phone || '',
        v.pan_vat || '',
        v.commission_rate ?? '',
        v.status || '',
        formatDate(v.created_at),
      ]),
      title: 'Vendor Register Report',
      subtitle: 'Merchant vendors registered on the marketplace with compliance and commission details.',
      sectionLabel: 'Vendor Register',
      fileName: `gosika_vendors_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Vendors exported as branded report.')
  }

  const columns = [
    {
      header: 'Vendor & Store',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#eff6ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <Link
              to={`/admin/marketplace/vendors/${item.uuid || item.id}`}
              style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: 'none' }}
              className="hover:text-primary"
            >
              {item.company_name}
            </Link>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {item.business_email} {item.business_phone ? `· ${item.business_phone}` : ''}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'PAN / VAT',
      render: item => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
          {item.pan_vat || '—'}
        </span>
      )
    },
    {
      header: 'KYC Status',
      render: item => {
        const kycStatus = item.kyc?.status || 'draft'
        return <StatusBadge status={kycStatus} />
      }
    },
    {
      header: 'Storefronts',
      render: item => {
        const count = item.stores?.length || 0
        return (
          <span className="chip chip-sm" style={{ fontSize: 11, fontWeight: 700, background: '#f8fafc' }}>
            {count} {count === 1 ? 'store' : 'stores'}
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
      header: 'Commission',
      render: item => (
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
          {item.commission_rate !== null && item.commission_rate !== undefined ? `${item.commission_rate}%` : 'Default'}
        </span>
      )
    },
    {
      header: 'Joined',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isPending = item.status === 'pending' || item.status === 'under_review'
        const isActive = item.status === 'approved' || item.status === 'active'
        const isSuspended = item.status === 'suspended'

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <Link
              to={`/admin/marketplace/vendors/${item.uuid || item.id}`}
              className="btn btn-outline btn-xs"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Eye size={12} /> Detail
            </Link>

            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                >
                  <Check size={12} /> Approve
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                >
                  <X size={12} /> Reject
                </button>
              </>
            )}

            {isActive && (
              <button
                type="button"
                className="btn btn-outline btn-xs"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => handleAction('suspend', item)}
              >
                Suspend
              </button>
            )}

            {isSuspended && (
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => handleAction('activate', item)}
              >
                Reactivate
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
        title="Vendor Management"
        description="Monitor merchant applications, verify KYC, regulate commission agreements, and control selling status."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Vendors' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadVendors}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setAddSellerOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, background: '#FF5500', color: '#fff', border: 'none', fontWeight: 700 }}
            >
              <UserPlus size={14} />
              Add Seller
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by vendor name, email, phone..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'approved', label: 'Approved & Active' },
          { value: 'pending', label: 'Pending Review' },
          { value: 'under_review', label: 'Under Review' },
          { value: 'suspended', label: 'Suspended' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        onRowClick={item => navigate(`/admin/marketplace/vendors/${item.uuid || item.id}`)}
        emptyTitle="No vendors found"
        emptyDescription="No registered merchant accounts match your selected filter criteria."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, vendor: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Merchant "${dialogState.vendor?.company_name}"?`
            : dialogState.action === 'reject'
            ? `Reject Application for "${dialogState.vendor?.company_name}"?`
            : dialogState.action === 'suspend'
            ? `Suspend Vendor "${dialogState.vendor?.company_name}"?`
            : `Reactivate Vendor "${dialogState.vendor?.company_name}"?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving will grant this merchant active selling status and create their default store.'
            : dialogState.action === 'reject'
            ? 'Rejecting will decline this application. Please specify the reason.'
            : dialogState.action === 'suspend'
            ? 'Suspending will disable all stores and products associated with this vendor immediately.'
            : 'Reactivating will restore the vendor and their active storefronts.'
        }
        variant={dialogState.action === 'approve' || dialogState.action === 'activate' ? 'success' : 'danger'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve Vendor' : dialogState.action === 'reject' ? 'Reject Application' : dialogState.action === 'suspend' ? 'Suspend Vendor' : 'Reactivate Vendor'
        }
        requireReason={dialogState.action === 'reject' || dialogState.action === 'suspend'}
        reasonPlaceholder="Provide the administrative reason for this action..."
      />

      {/* Add Seller Modal */}
      <AddSellerModal
        open={addSellerOpen}
        onClose={() => setAddSellerOpen(false)}
        onCreated={loadVendors}
      />
    </div>
  )
}
