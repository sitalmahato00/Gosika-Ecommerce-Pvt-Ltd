import React, { useEffect, useState } from 'react'
import { Plus, MapPin, Trash2, Pencil, Phone } from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { NEPAL_PROVINCES } from '../../utils/constants'

const EMPTY = { label: '', name: '', phone: '', province: '', district: '', municipality: '', street: '', is_default: false }

export default function AccountAddresses() {
  const toast = useToast()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/customer/addresses').then((r) => setAddresses(r.data.data || r.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      label: a.label || '',
      name: a.name || '',
      phone: a.phone || '',
      province: a.province || '',
      district: a.district || '',
      municipality: a.municipality || '',
      street: a.street || '',
      is_default: !!a.is_default,
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) await api.put(`/customer/addresses/${editing.id}`, form)
      else await api.post('/customer/addresses', form)
      toast.success(editing ? 'Address updated' : 'Address added')
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await api.delete(`/customer/addresses/${deleteTarget.id}`)
      toast.success('Address removed')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const setDefault = async (a) => {
    try {
      await api.put(`/customer/addresses/${a.id}/default`)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 style={{ fontSize: 17 }}>Addresses</h2>
        <Button variant="soft" size="sm" icon={Plus} onClick={openAdd}>Add address</Button>
      </div>
      {loading ? (
        <div className="card"><Spinner size={20} color="var(--primary)" /></div>
      ) : addresses.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {addresses.map((a) => (
            <div key={a.id} className="card flex flex-col gap-2" style={{ padding: 16 }}>
              <div className="flex items-center gap-2">
                <MapPin size={16} color="var(--primary)" />
                <span className="font-semibold text-sm flex-1">{a.label || 'Address'}</span>
                {a.is_default && <span className="badge badge-primary">Default</span>}
              </div>
              <div className="text-sm">
                <div className="font-medium">{a.name}</div>
                <div className="muted">{a.street}, {a.municipality}, {a.district}</div>
                <div className="muted">{a.province}</div>
                <div className="muted flex items-center gap-1 mt-1"><Phone size={12} /> {a.phone}</div>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEdit(a)}>Edit</Button>
                {!a.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => setDefault(a)}>Set default</Button>
                )}
                <Button variant="danger-outline" size="sm" icon={Trash2} style={{ marginLeft: 'auto' }} onClick={() => setDeleteTarget(a)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={MapPin} title="No addresses" message="Add a delivery address to start ordering." action={<Button variant="primary" icon={Plus} onClick={openAdd}>Add address</Button>} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit address' : 'Add address'}>
        <form onSubmit={save}>
          <div className="form-row">
            <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Home / Office" />
          <Select label="Province" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value, district: '', municipality: '' })}>
            <option value="">Select province</option>
            {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
          <div className="form-row">
            <Input label="District" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="Municipality / City" required value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
          </div>
          <Input label="Street / Tole" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <label className="checkbox-row mb-2">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            <span>Set as default address</span>
          </label>
          <Button type="submit" block disabled={saving}>{saving ? 'Saving…' : 'Save address'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        danger
        loading={deleting}
        title="Delete address?"
        message="This address will be permanently removed."
        confirmText="Delete"
      />
    </div>
  )
}
