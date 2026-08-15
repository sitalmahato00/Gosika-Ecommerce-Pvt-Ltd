import React, { useState, useMemo } from 'react'
import {
  Shield, Plus, Search, Edit, Trash2, Key, CheckCircle2,
  Lock, UserCheck, Download, Mail, Phone, Clock, Ban
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const INITIAL_ADMINS = [
  { id: 1, name: 'Admin Administrator', email: 'admin@gosika.com.np', role: 'Super Admin', status: 'active', lastLogin: '2026-08-15 11:20', permissions: 'Full Root Privileges' },
  { id: 2, name: 'Kiran Basnet', email: 'kiran.finance@gosika.com.np', role: 'Finance Admin', status: 'active', lastLogin: '2026-08-15 09:45', permissions: 'Payments, Wallets, Settlements' },
  { id: 3, name: 'Pooja Thapa', email: 'pooja.ops@gosika.com.np', role: 'Operations Admin', status: 'active', lastLogin: '2026-08-14 16:30', permissions: 'Deliveries, Shipping, Partners' },
  { id: 4, name: 'Dipesh Shrestha', email: 'dipesh.catalog@gosika.com.np', role: 'Product Manager', status: 'active', lastLogin: '2026-08-15 10:15', permissions: 'Products, Categories, Brands' },
  { id: 5, name: 'Sunita Gurung', email: 'sunita.support@gosika.com.np', role: 'Support Agent', status: 'active', lastLogin: '2026-08-15 08:30', permissions: 'Support Tickets, Inquiries' },
]

const ROLES = [
  'Super Admin',
  'Operations Admin',
  'Finance Admin',
  'Product Manager',
  'Support Agent',
  'Marketing Manager',
]

const ROLE_COLORS = {
  'Super Admin': { bg: 'rgba(124, 58, 237, 0.12)', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.25)' },
  'Finance Admin': { bg: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.25)' },
  'Operations Admin': { bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.25)' },
  'Product Manager': { bg: 'rgba(217, 119, 6, 0.12)', color: '#d97706', border: 'rgba(217, 119, 6, 0.25)' },
  'Support Agent': { bg: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', border: 'rgba(13, 148, 136, 0.25)' },
  'Marketing Manager': { bg: 'rgba(219, 39, 119, 0.12)', color: '#db2777', border: 'rgba(219, 39, 119, 0.25)' },
}

export default function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState(INITIAL_ADMINS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [resetOpen, setResetOpen] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [form, setForm] = useState({ name: '', email: '', role: 'Operations Admin', password: '' })

  const handleCreate = (e) => {
    e.preventDefault()
    const newUser = {
      id: users.length + 1,
      name: form.name,
      email: form.email,
      role: form.role,
      status: 'active',
      lastLogin: 'Never',
      permissions: `${form.role} standard access`,
    }
    setUsers([...users, newUser])
    setCreateOpen(false)
    setForm({ name: '', email: '', role: 'Operations Admin', password: '' })
    toast.success(`Admin user "${newUser.name}" created successfully`)
  }

  const handleEditSave = (e) => {
    e.preventDefault()
    setUsers(users.map((u) => u.id === editUser.id ? { ...u, role: editUser.role, name: editUser.name } : u))
    toast.success(`Updated role for ${editUser.name}`)
    setEditUser(null)
  }

  const handleResetPassword = (e) => {
    e.preventDefault()
    toast.success(`Password reset successfully for ${resetOpen.email}`)
    setResetOpen(null)
    setNewPassword('')
  }

  const toggleStatus = (id, name, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active'
    setUsers(users.map((u) => u.id === id ? { ...u, status: nextStatus } : u))
    toast.info(`Staff account "${name}" marked as ${nextStatus}`)
  }

  const exportCSV = () => {
    const rows = [
      ['ID', 'Name', 'Email', 'Role', 'Permissions', 'Status', 'Last Active'],
      ...users.map((u) => [u.id, u.name, u.email, u.role, u.permissions, u.status, u.lastLogin])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_admin_staff_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Admin staff list exported to CSV')
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = !roleFilter || u.role === roleFilter
      const matchesSearch = !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, search])

  return (
    <div>
      {/* Page Header */}
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
          <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> Create Admin User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          className={`tab ${roleFilter === '' ? 'active' : ''}`}
          onClick={() => setRoleFilter('')}
        >
          All Staff ({users.length})
        </button>
        {ROLES.slice(0, 5).map((r) => {
          const count = users.filter((u) => u.role === r).length
          if (count === 0) return null
          return (
            <button
              key={r}
              className={`tab ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r} ({count})
            </button>
          )
        })}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-sm">{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Admin Name</th>
              <th>Email</th>
              <th>Assigned Role</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const roleStyle = ROLE_COLORS[u.role] || { bg: 'var(--primary-50)', color: 'var(--primary)', border: 'var(--border)' }
              const isSuspended = u.status === 'suspended'
              return (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        className="avatar"
                        style={{
                          width: 38,
                          height: 38,
                          background: roleStyle.bg,
                          color: roleStyle.color,
                          fontWeight: 800,
                          fontSize: 14,
                          flexShrink: 0
                        }}
                      >
                        {u.name[0]}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="font-bold text-sm text-ink">{u.name}</div>
                        <div className="muted text-xs font-mono">ID: #ADM-{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted text-sm font-medium">{u.email}</td>
                  <td>
                    <span
                      className="chip chip-sm"
                      style={{
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        fontWeight: 700
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="muted text-xs" style={{ maxWidth: 220 }}>
                    {u.permissions}
                  </td>
                  <td>
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="muted text-xs font-mono">{u.lastLogin}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-outline btn-xs"
                        title="Edit User Role"
                        onClick={() => setEditUser({ ...u })}
                      >
                        <Edit size={12} /> Edit
                      </button>
                      <button
                        className="btn btn-outline btn-xs"
                        title="Reset Password"
                        onClick={() => setResetOpen(u)}
                      >
                        <Key size={12} /> Reset
                      </button>
                      <button
                        className={`btn ${!isSuspended ? 'btn-danger-outline' : 'btn-success'} btn-xs`}
                        onClick={() => toggleStatus(u.id, u.name, u.status)}
                      >
                        {!isSuspended ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Admin Staff User">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Adhikari"
            />
            <Input
              label="Official Email Address"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@gosika.com.np"
            />
            <div className="form-group">
              <label className="label">Role Assignment</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <Input
              label="Initial Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Create Staff User</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit Staff: ${editUser.name}`}>
          <form onSubmit={handleEditSave} className="flex flex-col gap-3">
            <Input
              label="Full Name"
              required
              value={editUser.name}
              onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
            />
            <Input
              label="Email Address"
              value={editUser.email}
              readOnly
              disabled
            />
            <div className="form-group">
              <label className="label">Assigned Role</label>
              <select
                className="select"
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditUser(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetOpen && (
        <Modal open={!!resetOpen} onClose={() => setResetOpen(null)} title={`Reset Password: ${resetOpen.name}`}>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <p className="text-sm muted m-0">
              Set a temporary password for <strong>{resetOpen.email}</strong>.
            </p>
            <Input
              label="New Temporary Password"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new secure password"
            />
            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setResetOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Update Password</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
