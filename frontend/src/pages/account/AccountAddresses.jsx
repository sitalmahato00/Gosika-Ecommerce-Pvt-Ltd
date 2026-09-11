import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, MapPin, Trash2, Pencil, Phone, Loader2 } from 'lucide-react'
import api from '../../api/client'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { AccountPage } from './AccountUI'

const EMPTY_FORM = {
  address_type: 'shipping',
  label: '',
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  postal_code: '',
  landmark: '',
  province: '',
  district: '',
  municipality: '',
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

  const [apiProvinces, setApiProvinces] = useState([])
  const [apiDistricts, setApiDistricts] = useState([])
  const [apiMunicipalities, setApiMunicipalities] = useState([])
  const [resolvingIds, setResolvingIds] = useState(false)

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
      .then((r) => setApiProvinces(r.data.data || []))
      .catch(() => setApiProvinces([]))
  }, [])

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
      province: a.province?.name || '',
      district: a.district?.name || '',
      municipality: a.municipality?.name || '',
      latitude: a.latitude || '',
      longitude: a.longitude || '',
      is_default: !!a.is_default,
    })
    setModalOpen(true)
  }

  const resolveGeoIds = async (provinceName, districtName, municipalityName) => {
    let provinceId = null
    let districtId = null
    let municipalityId = null
    setResolvingIds(true)
    try {
      const prov = apiProvinces.find((p) => p.name === provinceName || p.name.toLowerCase().includes((provinceName || '').toLowerCase()))
      if (prov) {
        provinceId = prov.uuid
        const dRes = await api.get('/platform/districts', { params: { province_id: prov.id } })
        const dists = dRes.data.data || []
        const dist = dists.find((d) => d.name.toLowerCase() === (districtName || '').toLowerCase() || d.name.toLowerCase().includes((districtName || '').toLowerCase()))
        if (dist) {
          districtId = dist.uuid
          const mRes = await api.get('/platform/municipalities', { params: { district_id: dist.id } })
          const munis = mRes.data.data || []
          const cleanMuni = (municipalityName || '').replace(/\s+(rural municipality|municipality|metropolitan city|sub-metropolitan city)$/i, '').trim().toLowerCase()
          const mun = munis.find((m) => 
            m.name.toLowerCase() === (municipalityName || '').toLowerCase() ||
            m.name.toLowerCase().includes(cleanMuni) ||
            cleanMuni.includes(m.name.toLowerCase())
          )
          if (mun) municipalityId = mun.uuid
        }
      }
    } catch {
    } finally {
      setResolvingIds(false)
    }
    return { provinceId, districtId, municipalityId }
  }

  const save = async (e) => {
    e.preventDefault()
    const geo = await resolveGeoIds(form.province, form.district, form.municipality)
    const payload = {
      address_type: form.address_type || 'shipping',
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      address_line_1: form.address_line_1 || form.street || `${form.municipality}, ${form.district}`,
      address_line_2: form.address_line_2,
      postal_code: form.postal_code,
      landmark: form.landmark,
      province_id: geo.provinceId,
      district_id: geo.districtId,
      municipality_id: geo.municipalityId,
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
    <AccountPage
      title="Saved Delivery Addresses"
      subtitle="Manage your shipping destinations across Nepal."
      actions={<button className="btn btn-primary btn-sm flex items-center gap-1" onClick={openAdd}><Plus size={14} /> Add New Address</button>}
    >
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
            <LocationMapPicker
              compact
              title="Pinpoint Delivery Location"
              description="Click the map or use GPS, then confirm your address below."
              value={{
                province: form.province,
                district: form.district,
                municipality: form.municipality,
                street: form.address_line_1,
                landmark: form.landmark,
                latitude: form.latitude || undefined,
                longitude: form.longitude || undefined,
              }}
              onChange={(loc) => {
                setForm((prev) => ({
                  ...prev,
                  province: loc.province,
                  district: loc.district,
                  municipality: loc.municipality,
                  address_line_1: loc.street !== undefined ? loc.street : prev.address_line_1,
                  landmark: loc.landmark !== undefined ? loc.landmark : prev.landmark,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))
              }}
            />

            <div className="form-row">
              <Input label="Address Line 2 / Apt / Unit (Optional)" value={form.address_line_2} onChange={(e) => setForm({ ...form, address_line_2: e.target.value })} placeholder="e.g. Floor 2, Suite 4B" />
              <Input label="Postal Code (Optional)" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} placeholder="e.g. 44600" />
            </div>

            <label className="checkbox-row mb-2" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              <span className="text-sm">Set as default shipping address</span>
            </label>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving || resolvingIds}>
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
    </AccountPage>
  )
}
