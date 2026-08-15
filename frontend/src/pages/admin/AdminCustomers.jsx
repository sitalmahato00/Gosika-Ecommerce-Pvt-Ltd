import React, { useState } from 'react'
import {
  Users, Search, Eye, CheckCircle2, Ban, Phone, Mail,
  Download, Trash2, ShieldCheck
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { formatDate, formatDateTime, errorMessage, initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useList } from '../../hooks/useApi'

const STATUS_TABS = [
  { value: '', label: 'All Customers' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

export default function AdminCustomers() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetcher = (page) => {
    const params = { role: 'customer', page, per_page: 15 }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    return api.get('/admin/users', { params })
  }
  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [statusFilter, search],
    pageSize: 15,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const doSuspend = async (cust) => {
    const reason = window.prompt(`Reason for suspending "${cust.full_name}":`)
    if (reason === null) return
    setBusy(true)
    try {
      await api.post(`/admin/users/${cust.id}/suspend`, { reason: reason.trim() || undefined })
      toast.success(`Customer "${cust.full_name}" suspended`)
      setSelectedCustomer((prev) => prev && prev.id === cust.id ? { ...prev, status: 'suspended' } : prev)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const doActivate = async (cust) => {
    setBusy(true)
    try {
      await api.post(`/admin/users/${cust.id}/activate`)
      toast.success(`Customer "${cust.full_name}" activated`)
      setSelectedCustomer((prev) => prev && prev.id === cust.id ? { ...prev, status: 'active' } : prev)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = (cust) => {
    if (cust.status === 'active') doSuspend(cust)
    else doActivate(cust)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`)
      toast.success(`Customer account "${deleteTarget.full_name}" (${deleteTarget.id}) deleted permanently`)
      if (selectedCustomer?.id === deleteTarget.id) {
        setSelectedCustomer(null)
      }
      setDeleteTarget(null)
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Customer ID', 'Full Name', 'Email Address', 'Phone Number', 'Roles', 'Status', 'Registered Date'],
      ...items.map((c) => [c.id, c.full_name, c.email, c.phone, (c.roles || []).join(' | '), c.status, formatDate(c.created_at)])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_customers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Customer directory exported to CSV')
  }

  const totalCustomers = meta.total
  const activeCount = items.filter((c) => c.status === 'active').length
  const verifiedCount = items.filter((c) => c.email_verified_at).length
  const suspendedCount = items.filter((c) => c.status === 'suspended').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Customer Directory & Account Governance
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized directory of registered marketplace shoppers, purchase history, and account moderation across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export Customer CSV
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Registered Buyers</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalCustomers} Customers</div>
          <div className="muted text-xs mt-1">Total registered accounts</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Accounts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{activeCount} Active</div>
          <div className="muted text-xs mt-1">On this page</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Email Verified</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Mail size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{verifiedCount} Verified</div>
          <div className="muted text-xs mt-1">Confirmed email addresses</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Suspended Accounts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Ban size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>
            {suspendedCount} Suspended
          </div>
          <div className="muted text-xs mt-1">Restricted from checkout</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${totalCustomers})` : `(${items.filter((c) => c.status === t.value).length})`}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search by name, phone, or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <span className="muted text-xs font-semibold">
          {items.length} customer{items.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} />)}
        </div>
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !items.length ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          message="No customer accounts match your current search or filter criteria."
          action={
            <button className="btn btn-outline" onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput('') }}>
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Info</th>
                  <th>Account Roles</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="avatar"
                          style={{
                            width: 38,
                            height: 38,
                            background: 'var(--primary-50)',
                            color: 'var(--primary)',
                            fontWeight: 800,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {initials(cust.full_name)}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <span
                            className="font-bold text-sm text-ink hover:text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedCustomer(cust)}
                          >
                            {cust.full_name}
                          </span>
                          <div className="muted text-xs font-mono" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{cust.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-ink">{cust.email}</div>
                      <div className="muted text-xs flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {cust.phone}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center wrap gap-1" style={{ maxWidth: 240 }}>
                        {(cust.roles || []).length ? cust.roles.map((r) => (
                          <span key={r} className="chip chip-sm" style={{ fontSize: 10, textTransform: 'capitalize' }}>{r}</span>
                        )) : <span className="muted text-xs">—</span>}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={cust.status} />
                    </td>
                    <td className="muted text-xs">
                      {formatDate(cust.created_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => setSelectedCustomer(cust)}
                          title="View customer dossier"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => setDeleteTarget(cust)}
                          title="Delete customer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
        </div>
      )}

      {selectedCustomer && (
        <Modal
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Dossier: ${selectedCustomer.full_name}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex items-center gap-3">
                <span className="avatar" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--primary)', color: '#fff' }}>
                  {initials(selectedCustomer.full_name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-ink">{selectedCustomer.full_name}</div>
                  <div className="muted text-xs mt-0.5">{selectedCustomer.email} · {selectedCustomer.phone}</div>
                  <div className="font-mono text-xs text-primary font-bold mt-1">{selectedCustomer.id}</div>
                </div>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold uppercase">Email Verified</div>
                <div className="font-extrabold text-lg mt-1 text-ink">{formatDateTime(selectedCustomer.email_verified_at)}</div>
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold uppercase">Phone Verified</div>
                <div className="font-extrabold text-lg mt-1 text-primary">{formatDateTime(selectedCustomer.phone_verified_at)}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <ShieldCheck size={13} color="var(--primary)" /> Account Roles
              </h4>
              <div className="flex items-center wrap gap-1">
                {(selectedCustomer.roles || []).length ? selectedCustomer.roles.map((r) => (
                  <span key={r} className="chip chip-sm" style={{ textTransform: 'capitalize' }}>{r}</span>
                )) : <span className="muted text-xs m-0">No roles assigned</span>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className={`btn ${selectedCustomer.status === 'active' ? 'btn-danger-outline' : 'btn-primary'} btn-sm`}
                disabled={busy}
                onClick={() => toggleStatus(selectedCustomer)}
              >
                {selectedCustomer.status === 'active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  disabled={busy}
                  onClick={() => {
                    const target = selectedCustomer
                    setSelectedCustomer(null)
                    setDeleteTarget(target)
                  }}
                >
                  <Trash2 size={13} /> Delete Account
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedCustomer(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete Customer Account "${deleteTarget.full_name}"?`}
          message={`Are you sure you want to permanently delete customer account ${deleteTarget.id} (${deleteTarget.email})? This action cannot be undone and will purge their profile from the database.`}
          confirmText="Confirm Delete Customer"
        />
      )}
    </div>
  )
}
