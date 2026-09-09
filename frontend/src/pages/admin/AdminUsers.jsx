import React, { useState } from 'react'
import {
  Users, Search, Trash2, Ban, UserCheck, Download
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDate, initials, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const ROLE_FILTERS = [
  { value: '', label: 'All Users' },
  { value: 'customer', label: 'Customers' },
  { value: 'vendor_admin', label: 'Vendors' },
  { value: 'delivery_partner', label: 'Delivery Partners' },
  { value: 'super_admin', label: 'Admins' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

export default function AdminUsers() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const fetchUsers = (page, perPage) =>
    api.get('/admin/users', {
      params: { search, status: statusFilter, role: roleFilter, page, per_page: perPage },
    })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchUsers, {
    pageSize: 10,
    deps: [search, statusFilter, roleFilter],
    cacheKey: 'admin_users_list',
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleSuspend = (u) => {
    const reason = window.prompt(`Suspend ${u.full_name || u.email}? Enter a reason (optional):`, '')
    if (reason === null) return
    setBusyId(u.id)
    api.post(`/admin/users/${u.id}/suspend`, { reason })
      .then(() => {
        toast.success('User suspended')
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setBusyId(null))
  }

  const handleActivate = (u) => {
    setBusyId(u.id)
    api.post(`/admin/users/${u.id}/activate`)
      .then(() => {
        toast.success('User activated')
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setBusyId(null))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/users/${deleteTarget.id}`)
      .then(() => {
        toast.success('User deleted')
        setDeleteTarget(null)
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Name' },
        { label: 'Email' },
        { label: 'Phone' },
        { label: 'Roles' },
        { label: 'Status' },
        { label: 'Created' },
      ],
      rows: items.map((u) => [
        u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' '),
        u.email,
        u.phone || '',
        (u.roles || []).join(', '),
        u.status,
        u.created_at || '',
      ]),
      title: 'Admin Staff Register Report',
      subtitle: 'Internal administrative staff, roles and account statuses.',
      sectionLabel: 'Admin Staff',
      fileName: `gosika_admin_staff_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Admin staff list exported as branded report.')
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Admin Users & Staff</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage internal operational roles, administrative users, and account permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {ROLE_FILTERS.map((r) => (
          <button
            key={r.value}
            className={`tab ${roleFilter === r.value ? 'active' : ''}`}
            onClick={() => {
              setPage(1)
              setRoleFilter(r.value)
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={applySearch} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by name, email, or phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-2">
          <select
            className="select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value)
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <span className="muted text-sm">{meta.total} staff member{meta.total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7}><Skeleton height={22} /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={Users} title="No users found" message="Try adjusting your search or filters." />
                  </td>
                </tr>
              ) : (
                items.map((u) => {
                  const name = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
                  const isSuspended = u.status === 'suspended'
                  const busy = busyId === u.id
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>
                            {initials(name)}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="font-bold text-sm text-ink">{name}</div>
                            <div className="muted text-xs font-mono">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted text-sm font-medium">{u.email}</td>
                      <td className="muted text-sm">{u.phone || '—'}</td>
                      <td>
                        <div className="flex wrap gap-1">
                          {(u.roles || []).map((r) => (
                            <span key={r} className="chip chip-sm font-bold" style={{ fontSize: 11 }}>
                              {humanizeEnum(r)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="muted text-xs">{formatDate(u.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {isSuspended ? (
                            <button
                              className="btn btn-success btn-xs"
                              disabled={busy}
                              onClick={() => handleActivate(u)}
                            >
                              <UserCheck size={12} /> Activate
                            </button>
                          ) : (
                            <button
                              className="btn btn-danger-outline btn-xs"
                              disabled={busy}
                              onClick={() => handleSuspend(u)}
                            >
                              <Ban size={12} /> Suspend
                            </button>
                          )}
                          <button
                            className="btn btn-danger-outline btn-xs"
                            disabled={busy}
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete ${deleteTarget.full_name || deleteTarget.email}?`}
          message="Are you sure you want to permanently delete this user account?"
          confirmText="Delete User"
        />
      )}
    </div>
  )
}
