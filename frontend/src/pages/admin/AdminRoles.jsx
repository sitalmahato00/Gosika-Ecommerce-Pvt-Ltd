import React, { useMemo, useState } from 'react'
import { Lock, Shield, Plus, Edit, Trash2 } from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminRoles() {
  const toast = useToast()
  const rolesApi = useApi(() => api.get('/admin/roles'))
  const permsApi = useApi(() => api.get('/admin/permissions'))
  const roles = rolesApi.data || []
  const perms = permsApi.data || {}

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState({ name: '', permissions: [] })
  const [saving, setSaving] = useState(false)

  const sections = useMemo(() => {
    return Object.entries(perms).sort((a, b) => a[0].localeCompare(b[0]))
  }, [perms])

  const selected = useMemo(() => {
    if (!roles.length) return null
    return roles.find((r) => r.id === selectedId) || roles[0]
  }, [roles, selectedId])

  const selectedPermissions = useMemo(() => {
    if (!selected) return []
    const grouped = {}
    ;(selected.permissions || []).forEach((p) => {
      const prefix = p.split('.')[0]
      if (!grouped[prefix]) grouped[prefix] = []
      grouped[prefix].push(p)
    })
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))
  }, [selected])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', permissions: [] })
    setCreateOpen(true)
  }

  const openEdit = (role) => {
    setEditing(role)
    setForm({ name: role.name, permissions: role.permissions || [] })
    setCreateOpen(true)
  }

  const togglePermission = (perm) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const payload = { name: form.name.trim(), permissions: form.permissions }
    const req = editing
      ? api.put(`/admin/roles/${editing.id}`, payload)
      : api.post('/admin/roles', payload)
    req
      .then(() => {
        toast.success(editing ? 'Role updated' : 'Role created')
        setCreateOpen(false)
        rolesApi.reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSaving(false))
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    api.delete(`/admin/roles/${deleteTarget.id}`)
      .then(() => {
        toast.success('Role deleted')
        setDeleteTarget(null)
        rolesApi.reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
  }

  if (rolesApi.error) return <ErrorState message={errorMessage(rolesApi.error)} onRetry={rolesApi.reload} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Roles & Permissions</h1>
          <p>Configure role-based access control (RBAC), security scopes, and administrative privileges</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Create Role
        </button>
      </div>

      {rolesApi.loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </div>
      ) : roles.length === 0 ? (
        <EmptyState icon={Shield} title="No roles yet" message="Create your first role to get started." />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Staff</th>
                  <th>Permissions</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td>
                      <div className="font-bold text-sm text-ink">{r.label || humanizeEnum(r.name)}</div>
                      <div className="muted text-xs font-mono">{r.name}</div>
                    </td>
                    <td>
                      <span className="chip chip-sm">{r.users_count} staff</span>
                    </td>
                    <td>
                      <span className="muted text-xs">{r.permissions.length} permission{r.permissions.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      {r.is_system ? (
                        <span className="chip chip-sm font-bold flex items-center gap-1" style={{ width: 'fit-content' }}>
                          <Lock size={11} /> System
                        </span>
                      ) : (
                        <span className="chip chip-sm">Custom</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => openEdit(r)}>
                          <Edit size={11} /> Edit
                        </button>
                        <button
                          className="btn btn-danger-outline btn-xs"
                          disabled={r.is_system}
                          title={r.is_system ? 'System roles cannot be deleted' : 'Delete role'}
                          onClick={() => setDeleteTarget(r)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 style={{ fontSize: 16, margin: 0 }}>Permissions for {selected.label || humanizeEnum(selected.name)}</h3>
              <p className="muted text-xs m-0 mt-1">{selected.permissions.length} assigned permission{selected.permissions.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {selectedPermissions.length === 0 ? (
            <EmptyState icon={Shield} title="No permissions assigned" message="Edit this role to assign permissions." />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {selectedPermissions.map(([prefix, permsList]) => (
                <div key={prefix} className="card" style={{ padding: 12, margin: 0, background: 'var(--bg)' }}>
                  <div className="font-bold text-xs uppercase muted mb-2" style={{ letterSpacing: '0.04em' }}>
                    {humanizeEnum(prefix)}
                  </div>
                  <div className="flex wrap gap-1">
                    {permsList.map((p) => (
                      <span key={p} className="badge badge-default text-xs font-mono">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {createOpen && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title={editing ? `Edit Role: ${editing.name}` : 'Create New Administrative Role'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="label">Role Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Catalog Auditor"
              />
              <p className="helper">Stored as a snake_case slug (e.g. "Catalog Auditor" → catalog_auditor)</p>
            </div>

            <div className="form-group">
              <label className="label">Permissions</label>
              {permsApi.loading ? (
                <Skeleton height={120} />
              ) : sections.length === 0 ? (
                <EmptyState icon={Shield} title="No permissions available" message="The permissions endpoint returned no data." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border)', padding: 12, borderRadius: 'var(--radius)' }}>
                  {sections.map(([prefix, permsList]) => (
                    <div key={prefix}>
                      <div className="font-bold text-xs uppercase muted mb-1" style={{ letterSpacing: '0.04em' }}>
                        {humanizeEnum(prefix)}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        {permsList.map((perm) => (
                          <label key={perm} className="checkbox-row" style={{ fontSize: 13 }}>
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm)}
                              onChange={() => togglePermission(perm)}
                            />
                            <span className="font-mono" style={{ fontSize: 12 }}>{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {editing ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete Role ${deleteTarget.name}?`}
          message={deleteTarget.is_system
            ? 'System roles cannot be deleted.'
            : `Are you sure you want to permanently delete the "${deleteTarget.name}" role?`}
          confirmText="Delete Role"
        />
      )}
    </div>
  )
}
