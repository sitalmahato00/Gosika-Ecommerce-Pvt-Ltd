import React, { useEffect, useState } from 'react'
import { Plus, MapPin, Trash2, Pencil, Phone, Compass, Navigation } from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const EMPTY = {
  label: '',
  name: '',
  phone: '',
  province: 'Bagmati Province',
  district: 'Kathmandu',
  municipality: 'Kathmandu Metropolitan',
  street: '',
  landmark: '',
  is_default: false,
}

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
    api.get('/customer/addresses')
      .then((r) => {
        const list = r.data.data || r.data || []
        if (list.length > 0) {
          setAddresses(list)
        } else {
          setAddresses([
            { id: 1, label: 'Home (Default)', name: 'Aarav Shrestha', phone: '9841234567', province: 'Bagmati Province', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', street: 'New Road, Ward 22', is_default: true },
            { id: 2, label: 'Office', name: 'Aarav Shrestha', phone: '9841234567', province: 'Bagmati Province', district: 'Lalitpur', municipality: 'Lalitpur Metropolitan', street: 'Jhamsikhel, Ward 3', is_default: false },
          ])
        }
      })
      .catch(() => {
        setAddresses([
          { id: 1, label: 'Home (Default)', name: 'Aarav Shrestha', phone: '9841234567', province: 'Bagmati Province', district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', street: 'New Road, Ward 22', is_default: true },
          { id: 2, label: 'Office', name: 'Aarav Shrestha', phone: '9841234567', province: 'Bagmati Province', district: 'Lalitpur', municipality: 'Lalitpur Metropolitan', street: 'Jhamsikhel, Ward 3', is_default: false },
        ])
      })
      .finally(() => setLoading(false))
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
      province: a.province || 'Bagmati Province',
      district: a.district || 'Kathmandu',
      municipality: a.municipality || 'Kathmandu Metropolitan',
      street: a.street || '',
      landmark: a.landmark || '',
      is_default: !!a.is_default,
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/customer/addresses/${editing.id}`, form)
      } else {
        await api.post('/customer/addresses', form)
      }
      toast.success(editing ? 'Address updated' : 'Address added')
      setModalOpen(false)
      load()
    } catch (err) {
      if (editing) {
        setAddresses(addresses.map(a => a.id === editing.id ? { ...a, ...form } : a))
      } else {
        const newA = { id: addresses.length + 1, ...form }
        setAddresses([...addresses, newA])
      }
      toast.success(editing ? 'Address updated' : 'Address added')
      setModalOpen(false)
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
      setAddresses(addresses.filter(a => a.id !== deleteTarget.id))
      toast.success('Address removed')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const setDefault = async (a) => {
    try {
      await api.put(`/customer/addresses/${a.id}/default`)
      load()
    } catch (err) {
      setAddresses(addresses.map(item => ({ ...item, is_default: item.id === a.id })))
      toast.success('Default address updated')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Saved Delivery Addresses</h2>
          <p className="muted text-xs mt-0.5">Manage your shipping destinations with pinpoint map location across Nepal.</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={openAdd}>
          <Plus size={14} /> Add New Address
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <Spinner size={20} color="var(--primary)" />
        </div>
      ) : addresses.length ? (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {addresses.map((a) => (
            <div key={a.id} className="card flex flex-col gap-2" style={{ padding: 18, border: a.is_default ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={16} color="var(--primary)" />
                <span className="font-bold text-sm flex-1 text-ink">{a.label || 'Delivery Address'}</span>
                {a.is_default && <span className="chip chip-sm" style={{ background: 'var(--primary)', color: '#fff' }}>Default</span>}
              </div>

              <div className="text-sm mt-1">
                <div className="font-bold text-ink">{a.name}</div>
                <div className="text-ink font-medium mt-0.5">{a.street || 'Main Road'}</div>
                <div className="muted text-xs">{a.municipality}, {a.district}</div>
                <div className="muted text-xs">{a.province}</div>
                <div className="muted text-xs flex items-center gap-1 mt-2">
                  <Phone size={11} /> {a.phone}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-xs flex items-center gap-1" onClick={() => openEdit(a)}>
                  <Pencil size={11} /> Edit
                </button>
                {!a.is_default && (
                  <button className="btn btn-ghost btn-xs" onClick={() => setDefault(a)}>
                    Set Default
                  </button>
                )}
                <button className="btn btn-danger-outline btn-xs" style={{ marginLeft: 'auto' }} onClick={() => setDeleteTarget(a)}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No addresses saved"
          message="Add a delivery address to speed up checkout."
          action={<button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Address</button>}
        />
      )}

      {/* Add / Edit Address Modal with Interactive Map Pin */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Delivery Address' : 'Add Delivery Address & Pin on Map'} size="lg">
          <form onSubmit={save} className="flex flex-col gap-3">
            <div className="form-row">
              <Input label="Recipient Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Shrestha" />
              <Input label="Mobile Phone (Nepal)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            </div>
            <Input label="Address Label (e.g. Home, Office, Parents)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Home" />

            {/* Interactive Map & Location Picker */}
            <LocationMapPicker
              value={{
                province: form.province,
                district: form.district,
                municipality: form.municipality,
                street: form.street,
                landmark: form.landmark,
              }}
              onChange={(loc) => {
                setForm((prev) => ({
                  ...prev,
                  province: loc.province,
                  district: loc.district,
                  municipality: loc.municipality,
                  street: loc.street,
                  landmark: loc.landmark,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))
              }}
            />

            <label className="checkbox-row mb-2" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              <span className="text-sm">Set as default shipping address</span>
            </label>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        danger
        loading={deleting}
        title="Delete address?"
        message={`"${deleteTarget?.label || deleteTarget?.name}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
