import React, { useEffect, useState } from 'react'
import { Plus, MapPin, Trash2, Pencil, Phone } from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const EMPTY_FORM = {
  address_type: 'shipping',
  label: '',
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  postal_code: '',
  landmark: '',
  province_id: '',
  district_id: '',
  municipality_id: '',
  latitude: '',
  longitude: '',
  is_default: false,
}

export default function AccountAddresses() {
  const toast = useToast()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [defaultBusy, setDefaultBusy] = useState(null)

  const [provinces, setProvinces] = useState([])
  const [districts, setDistricts] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/customer/addresses')
      .then((r) => setAddresses(r.data.data || []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    api.get('/platform/provinces')
      .then((r) => setProvinces(r.data.data || []))
      .catch(() => setProvinces([]))
  }, [])

  useEffect(() => {
    if (!form.province_id) {
      setDistricts([])
      setMunicipalities([])
      return
    }
    const province = provinces.find((p) => p.uuid === form.province_id)
    if (!province) return
    let active = true
    setGeoLoading(true)
    api.get('/platform/districts', { params: { province_id: province.id } })
      .then((r) => { if (active) setDistricts(r.data.data || []) })
      .catch(() => { if (active) setDistricts([]) })
      .finally(() => { if (active) setGeoLoading(false) })
    return () => { active = false }
  }, [form.province_id, provinces])

  useEffect(() => {
    if (!form.district_id) {
      setMunicipalities([])
      return
    }
    const district = districts.find((d) => d.uuid === form.district_id)
    if (!district) return
    let active = true
    setGeoLoading(true)
    api.get('/platform/municipalities', { params: { district_id: district.id } })
      .then((r) => { if (active) setMunicipalities(r.data.data || []) })
      .catch(() => { if (active) setMunicipalities([]) })
      .finally(() => { if (active) setGeoLoading(false) })
    return () => { active = false }
  }, [form.district_id, districts])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      address_type: a.address_type || 'shipping',
      label: a.label || '',
      full_name: a.full_name || '',
      phone: a.phone || '',
      address_line_1: a.address_line_1 || '',
      address_line_2: a.address_line_2 || '',
      postal_code: a.postal_code || '',
      landmark: a.landmark || '',
      province_id: a.province?.id || '',
      district_id: a.district?.id || '',
      municipality_id: a.municipality?.id || '',
      latitude: a.latitude || '',
      longitude: a.longitude || '',
      is_default: !!a.is_default,
    })
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    const payload = {
      address_type: form.address_type || 'shipping',
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      address_line_1: form.address_line_1,
      address_line_2: form.address_line_2,
      postal_code: form.postal_code,
      landmark: form.landmark,
      province_id: form.province_id || null,
      district_id: form.district_id || null,
      municipality_id: form.municipality_id || null,
      is_default: form.is_default,
    }
    if (form.latitude) payload.latitude = String(form.latitude)
    if (form.longitude) payload.longitude = String(form.longitude)
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/customer/addresses/${editing.id}`, payload)
      } else {
        await api.post('/customer/addresses', payload)
      }
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
    if (!deleteTarget) return
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
    if (defaultBusy) return
    setDefaultBusy(a.id)
    try {
      await api.put(`/customer/addresses/${a.id}/default`)
      toast.success('Default address updated')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDefaultBusy(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Saved Delivery Addresses</h2>
          <p className="muted text-xs mt-0.5">Manage your shipping destinations across Nepal.</p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={openAdd}>
          <Plus size={14} /> Add New Address
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <Spinner size={20} color="var(--primary)" />
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={load} />
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
                <div className="font-bold text-ink">{a.full_name || '—'}</div>
                <div className="text-ink font-medium mt-0.5">{a.address_line_1}{a.address_line_2 ? `, ${a.address_line_2}` : ''}</div>
                <div className="muted text-xs">{a.municipality?.name}{a.district?.name ? `, ${a.district.name}` : ''}</div>
                <div className="muted text-xs">{a.province?.name}</div>
                {a.postal_code && <div className="muted text-xs">{a.postal_code}</div>}
                <div className="muted text-xs flex items-center gap-1 mt-2">
                  <Phone size={11} /> {a.phone}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-outline btn-xs flex items-center gap-1" onClick={() => openEdit(a)}>
                  <Pencil size={11} /> Edit
                </button>
                {!a.is_default && (
                  <button className="btn btn-ghost btn-xs" onClick={() => setDefault(a)} disabled={defaultBusy === a.id}>
                    {defaultBusy === a.id ? 'Setting…' : 'Set Default'}
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

      {/* Add / Edit Address Modal */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Delivery Address' : 'Add Delivery Address'} size="lg">
          <form onSubmit={save} className="flex flex-col gap-3">
            <div className="form-row">
              <Input label="Recipient Full Name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" />
              <Input label="Mobile Phone (Nepal)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            </div>
            <div className="form-row">
              <Select label="Address Type" value={form.address_type} onChange={(e) => setForm({ ...form, address_type: e.target.value })}>
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
              </Select>
              <Input label="Address Label (e.g. Home, Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Home" />
            </div>
            <Input label="Address Line 1" required value={form.address_line_1} onChange={(e) => setForm({ ...form, address_line_1: e.target.value })} placeholder="Street, Ward, Area" />
            <Input label="Address Line 2 (Optional)" value={form.address_line_2} onChange={(e) => setForm({ ...form, address_line_2: e.target.value })} />

            <div className="form-row">
              <Select label="Province" value={form.province_id} onChange={(e) => setForm({ ...form, province_id: e.target.value, district_id: '', municipality_id: '' })}>
                <option value="">Select province</option>
                {provinces.map((p) => (
                  <option key={p.uuid} value={p.uuid}>{p.name}</option>
                ))}
              </Select>
              <Select label="District" value={form.district_id} disabled={!form.province_id} onChange={(e) => setForm({ ...form, district_id: e.target.value, municipality_id: '' })}>
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.uuid} value={d.uuid}>{d.name}</option>
                ))}
              </Select>
              <Select label="Municipality" value={form.municipality_id} disabled={!form.district_id} onChange={(e) => setForm({ ...form, municipality_id: e.target.value })}>
                <option value="">Select municipality</option>
                {municipalities.map((m) => (
                  <option key={m.uuid} value={m.uuid}>{m.name}</option>
                ))}
              </Select>
            </div>

            {geoLoading && <p className="muted text-xs m-0">Loading locations…</p>}

            <div className="form-row">
              <Input label="Postal Code (Optional)" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
              <Input label="Landmark (Optional)" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            </div>

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
        message={`"${deleteTarget?.label || deleteTarget?.full_name || 'This address'}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
