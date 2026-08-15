import React, { useState } from 'react'
import { Lock, Shield, Plus, Check, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

const INITIAL_ROLES = [
  { id: 1, name: 'Super Admin', desc: 'Full unrestricted platform access across all modules and financial operations.', userCount: 2, modules: ['All Modules'] },
  { id: 2, name: 'Finance Admin', desc: 'Manage vendor payouts, wallet balance adjustments, commissions, and settlements.', userCount: 3, modules: ['Payments', 'Commissions', 'Wallets', 'Settlements', 'Refunds'] },
  { id: 3, name: 'Operations Admin', desc: 'Oversee multi-vendor shipping, deliveries, delivery partners, and customer support.', userCount: 4, modules: ['Orders', 'Shipping', 'Deliveries', 'Support'] },
  { id: 4, name: 'Product Manager', desc: 'Moderate catalog listings, approve product submissions, categories, and brands.', userCount: 2, modules: ['Products', 'Categories', 'Brands', 'Reviews'] },
  { id: 5, name: 'Support Agent', desc: 'Answer customer and seller support inquiries and initiate order resolutions.', userCount: 5, modules: ['Support', 'Orders (View Only)', 'Reviews'] },
]

const ALL_MODULES = [
  'Orders', 'Products', 'Categories', 'Brands', 'Reviews',
  'Customers', 'Vendors', 'Admin Users',
  'Payments', 'Commissions', 'Wallets', 'Settlements', 'Refunds',
  'Shipping', 'Deliveries', 'Support',
  'Coupons', 'Promotions', 'Notifications',
  'Analytics', 'Roles & Permissions', 'Settings', 'Audit Logs'
]

export default function AdminRoles() {
  const toast = useToast()
  const [roles, setRoles] = useState(INITIAL_ROLES)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(INITIAL_ROLES[0])
  const [form, setForm] = useState({ name: '', desc: '', modules: [] })

  const handleCreateRole = (e) => {
    e.preventDefault()
    const newRole = {
      id: roles.length + 1,
      name: form.name,
      desc: form.desc,
      userCount: 0,
      modules: form.modules.length ? form.modules : ['Orders (View Only)'],
    }
    setRoles([...roles, newRole])
    setCreateOpen(false)
    setForm({ name: '', desc: '', modules: [] })
    toast.success(`Role "${newRole.name}" created`)
  }

  const toggleModule = (mod) => {
    if (form.modules.includes(mod)) {
      setForm({ ...form, modules: form.modules.filter((m) => m !== mod) })
    } else {
      setForm({ ...form, modules: [...form.modules, mod] })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Roles & Permissions</h1>
          <p>Configure role-based access control (RBAC), security scopes, and administrative privileges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} /> Create Role
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {roles.map((r) => (
          <div
            key={r.id}
            className={`card ${selectedRole.id === r.id ? 'border-primary' : ''}`}
            style={{
              padding: 16,
              cursor: 'pointer',
              borderColor: selectedRole.id === r.id ? 'var(--primary)' : 'var(--border)',
              background: selectedRole.id === r.id ? 'var(--primary-50)' : '#fff',
            }}
            onClick={() => setSelectedRole(r)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-ink">{r.name}</span>
              <span className="chip chip-sm">{r.userCount} staff</span>
            </div>
            <p className="muted text-xs m-0 mb-3" style={{ lineHeight: 1.5 }}>{r.desc}</p>
            <div className="flex wrap gap-1">
              {r.modules.slice(0, 3).map((m) => (
                <span key={m} className="badge badge-default text-xs">{m}</span>
              ))}
              {r.modules.length > 3 && (
                <span className="badge badge-default text-xs">+{r.modules.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Preview */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 16, margin: 0 }}>Permissions for {selectedRole.name}</h3>
            <p className="muted text-xs m-0 mt-1">{selectedRole.desc}</p>
          </div>
        </div>

        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Module / Feature</th>
                <th style={{ textAlign: 'center' }}>View</th>
                <th style={{ textAlign: 'center' }}>Create</th>
                <th style={{ textAlign: 'center' }}>Edit / Update</th>
                <th style={{ textAlign: 'center' }}>Delete / Actions</th>
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((mod) => {
                const isGranted = selectedRole.modules.includes('All Modules') || selectedRole.modules.includes(mod)
                return (
                  <tr key={mod}>
                    <td>
                      <span className="font-semibold text-sm">{mod}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isGranted ? <Check size={16} color="var(--success)" /> : <span className="muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isGranted ? <Check size={16} color="var(--success)" /> : <span className="muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isGranted ? <Check size={16} color="var(--success)" /> : <span className="muted">—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {isGranted ? <Check size={16} color="var(--success)" /> : <span className="muted">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Administrative Role">
          <form onSubmit={handleCreateRole}>
            <div className="form-group">
              <label className="label">Role Title</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Catalog Auditor"
              />
            </div>
            <div className="form-group">
              <label className="label">Description / Purpose</label>
              <textarea
                className="textarea"
                rows={2}
                required
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                placeholder="Describe what responsibilities this role handles…"
              />
            </div>
            <div className="form-group">
              <label className="label">Accessible Modules</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', padding: 10, borderRadius: 'var(--radius)' }}>
                {ALL_MODULES.map((m) => (
                  <label key={m} className="checkbox-row" style={{ fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={form.modules.includes(m)}
                      onChange={() => toggleModule(m)}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Role</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
