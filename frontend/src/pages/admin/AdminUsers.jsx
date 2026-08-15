import React, { useState } from 'react'
import { Shield, Plus, Search, Edit, Trash2, Key, CheckCircle2, Lock, UserCheck } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const INITIAL_ADMINS = [
  { id: 1, name: 'Admin Administrator', email: 'admin@gosika.com.np', role: 'Super Admin', status: 'active', lastLogin: '2026-08-15 11:20', permissions: 'All Permissions' },
  { id: 2, name: 'Kiran Basnet', email: 'kiran.finance@gosika.com.np', role: 'Finance Admin', status: 'active', lastLogin: '2026-08-15 09:45', permissions: 'Payments, Wallets, Settlements' },
  { id: 3, name: 'Pooja Thapa', email: 'pooja.ops@gosika.com.np', role: 'Operations Admin', status: 'active', lastLogin: '2026-08-14 16:30', permissions: 'Deliveries, Shipping, Partners' },
  { id: 4, name: 'Dipesh Shrestha', email: 'dipesh.catalog@gosika.com.np', role: 'Product Manager', status: 'active', lastLogin: '2026-08-15 10:15', permissions: 'Products, Categories, Brands' },
  { id: 5, name: 'Sunita Gurung', email: 'sunita.support@gosika.com.np', role: 'Support Agent', status: 'active', lastLogin: '2026-08-15 08:30', permissions: 'Support Tickets, Customer Inquiries' },
]

const ROLES = [
  'Super Admin',
  'Operations Admin',
  'Finance Admin',
  'Product Manager',
  'Support Agent',
  'Marketing Manager',
  'Delivery Manager',
]

export default function AdminUsers() {
  const toast = useToast()
  const [users, setUsers] = useState(INITIAL_ADMINS)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
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
    toast.success(`Admin user ${newUser.name} created successfully`)
  }

  const handleResetPassword = (e) => {
    e.preventDefault()
    toast.success(`Password reset link sent to ${resetOpen.email}`)
    setResetOpen(null)
    setNewPassword('')
  }

  const toggleStatus = (id) => {
    setUsers(users.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u))
    toast.info('User status updated')
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Admin Users & Staff</h1>
          <p>Manage internal operational roles, administrative users, and account permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Create Admin User
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search admin users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="avatar" style={{ width: 34, height: 34, background: 'var(--navy)', color: '#fff' }}>
                      {u.name[0]}
                    </span>
                    <span className="font-semibold text-sm">{u.name}</span>
                  </div>
                </td>
                <td className="muted text-sm">{u.email}</td>
                <td>
                  <span className="chip chip-sm" style={{ fontWeight: 600 }}>{u.role}</span>
                </td>
                <td className="muted text-xs">{u.permissions}</td>
                <td>
                  <StatusBadge status={u.status} />
                </td>
                <td className="muted text-xs">{u.lastLogin}</td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-xs"
                      title="Reset Password"
                      onClick={() => setResetOpen(u)}
                    >
                      <Key size={12} /> Reset
                    </button>
                    <button
                      className={`btn ${u.status === 'active' ? 'btn-danger-outline' : 'btn-success'} btn-xs`}
                      onClick={() => toggleStatus(u.id)}
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Admin User">
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Ramesh Adhikari"
              />
            </div>
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@gosika.com.np"
              />
            </div>
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
            <div className="form-group">
              <label className="label">Initial Password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create User</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetOpen && (
        <Modal open={!!resetOpen} onClose={() => setResetOpen(null)} title={`Reset Password: ${resetOpen.name}`}>
          <form onSubmit={handleResetPassword}>
            <p className="text-sm muted mb-3">
              Set a temporary password or generate an automatic password reset email link for <strong>{resetOpen.email}</strong>.
            </p>
            <div className="form-group">
              <label className="label">New Temporary Password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setResetOpen(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Update Password</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
