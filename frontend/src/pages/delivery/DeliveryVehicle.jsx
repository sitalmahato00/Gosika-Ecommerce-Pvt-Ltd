import React, { useEffect, useRef, useState } from 'react'
import {
  Bike,
  Save,
  UploadCloud,
  Trash2,
  ShieldCheck,
  FileText,
  Truck,
  CalendarClock,
  Palette,
  Info,
  Plus,
} from 'lucide-react'
import api from '../../api/client'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import Spinner from '../../components/ui/Spinner'

const VEHICLE_TYPES = ['motorcycle', 'scooter', 'bicycle', 'e-bike', 'car', 'van', 'truck']
const VEHICLE_COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'silver', 'grey', 'brown', 'maroon']

const DOCUMENT_TYPES = [
  { value: 'driving_license', label: 'Driving License' },
  { value: 'vehicle_registration', label: 'Vehicle Registration' },
  { value: 'blue_book', label: 'Blue Book' },
  { value: 'insurance', label: 'Insurance Policy' },
  { value: 'nid', label: 'Citizenship / NID' },
  { value: 'pan', label: 'PAN / VAT' },
  { value: 'profile_photo', label: 'Profile Photo' },
  { value: 'vehicle_permit', label: 'Route / Permit' },
  { value: 'other', label: 'Other…' },
]

const label = (s) =>
  (s || '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

const DOC_STATUS = {
  pending: { bg: '#fffbeb', color: '#d97706', text: 'Pending review' },
  completed: { bg: '#f0fdf4', color: '#16a34a', text: 'Verified' },
  approved: { bg: '#f0fdf4', color: '#16a34a', text: 'Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', text: 'Rejected' },
}

const CURRENT_YEAR = new Date().getFullYear()

export default function DeliveryVehicle() {
  const { rider, loading, error, reload } = useDelivery()
  const toast = useToast()

  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const [uploadType, setUploadType] = useState('driving_license')
  const [customType, setCustomType] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [previews, setPreviews] = useState({})
  const fileRef = useRef(null)

  useEffect(() => {
    if (rider) {
      setForm({
        vehicle_type: rider.vehicle_type || '',
        vehicle_number: rider.vehicle_number || '',
        vehicle_model: rider.vehicle_model || '',
        vehicle_color: rider.vehicle_color || '',
        vehicle_year: rider.vehicle_year != null ? String(rider.vehicle_year) : '',
        insurance_expiry: rider.insurance_expiry || '',
      })
    }
  }, [rider])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const resolveDocType = () => (uploadType === 'other' ? customType.trim() : uploadType)

  const handleSave = async (e) => {
    e.preventDefault()
    const year = form.vehicle_year === '' ? null : parseInt(form.vehicle_year, 10)
    setSaving(true)
    try {
      const payload = {
        vehicle_type: form.vehicle_type,
        vehicle_number: form.vehicle_number.trim(),
        vehicle_model: form.vehicle_model.trim(),
        vehicle_color: form.vehicle_color.trim(),
        vehicle_year: year,
        insurance_expiry: form.insurance_expiry || null,
      }
      await api.put('/delivery-partner/me', payload)
      await reload({ silent: true })
      toast.success('Vehicle details updated.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    setFile(selected || null)
    if (selected) {
      setPreviews((p) => ({ ...p, pending: URL.createObjectURL(selected) }))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    const docType = resolveDocType()
    if (!docType) {
      toast.error('Enter a label for this document.')
      return
    }
    if (!file) {
      toast.error('Choose an image or PDF first.')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('document_type', docType)
    fd.append('file', file)
    try {
      await api.post('/delivery-partner/documents', fd)
      await reload({ silent: true })
      toast.success('Document uploaded for review.')
      setFile(null)
      setPreviews({})
      setCustomType('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove "${label(doc.document_type)}"? This cannot be undone.`)) return
    setDeleting(doc.id)
    try {
      await api.delete(`/delivery-partner/documents/${doc.id}`)
      await reload({ silent: true })
      toast.success('Document removed.')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting('')
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={200} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={220} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={180} />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={errorMessage(error)} onRetry={() => reload()} />
  }

  if (!rider) return null

  const documents = Array.isArray(rider.documents) ? rider.documents : []
  const coverage = Array.isArray(rider.service_areas) ? rider.service_areas : []

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Vehicle & Documents</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Vehicle information shown to the hub while dispatching.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card" style={{ padding: 20, margin: 0 }}>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: '#eef2ff', color: '#4f46e5' }}>
            <Truck size={22} />
          </span>
          <div>
            <div className="font-bold text-ink">{label(form.vehicle_type) || 'Vehicle not set'}</div>
            <div className="muted text-xs">{form.vehicle_number || 'No number plate recorded'}</div>
          </div>
          <span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>
            {coverage.length ? `${coverage.length} service ${coverage.length === 1 ? 'area' : 'areas'}` : 'No areas set'}
          </span>
        </div>

        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="form-group">
            <label className="label">Vehicle Type</label>
            <select className="select" value={form.vehicle_type || ''} onChange={set('vehicle_type')}>
              <option value="">Not specified</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v} value={v}>{label(v)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Vehicle Number</label>
            <input className="input" maxLength={30} placeholder="e.g. BA 4 KHA 1234" value={form.vehicle_number || ''} onChange={set('vehicle_number')} />
          </div>
          <div className="form-group">
            <label className="label">Vehicle Model</label>
            <input className="input" maxLength={60} placeholder="e.g. Yamaha FZS-FI V3" value={form.vehicle_model || ''} onChange={set('vehicle_model')} />
          </div>
        </div>

        <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
          <div className="form-group">
            <label className="label flex items-center gap-1"><Palette size={12} /> Color</label>
            <input className="input" list="delivery-vehicle-colors" maxLength={30} placeholder="e.g. Black" value={form.vehicle_color || ''} onChange={set('vehicle_color')} />
            <datalist id="delivery-vehicle-colors">
              {VEHICLE_COLORS.map((c) => (
                <option key={c} value={label(c)} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label className="label">Year</label>
            <input
              className="input"
              type="number"
              min={1980}
              max={CURRENT_YEAR + 1}
              placeholder={String(CURRENT_YEAR)}
              value={form.vehicle_year || ''}
              onChange={set('vehicle_year')}
            />
          </div>
          <div className="form-group">
            <label className="label flex items-center gap-1"><CalendarClock size={12} /> Insurance Expiry</label>
            <input className="input" type="date" value={form.insurance_expiry || ''} onChange={set('insurance_expiry')} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="muted text-xs flex items-center gap-1">
            <Info size={12} /> Service areas and contact details are managed from your profile.
          </span>
          <button type="submit" className="btn btn-primary flex items-center gap-1.5" disabled={saving}>
            {saving ? <Spinner size={14} color="#fff" /> : <Save size={15} />} {saving ? 'Saving…' : 'Save Details'}
          </button>
        </div>
      </form>

      <div className="card" style={{ padding: 20, margin: 0 }}>
        <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <FileText size={17} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Documents</h2>
          <span className="muted text-xs">{documents.length} {documents.length === 1 ? 'file' : 'files'}</span>
        </div>

        {documents.length > 0 && (
          <div className="grid mt-4 gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {documents.map((doc) => {
              const st = DOC_STATUS[doc.status] || { bg: '#f8fafc', color: '#64748b', text: doc.status }
              const isPdf = String(doc.file_url || '').endsWith('.pdf') || String(doc.mime_type || '').includes('pdf')
              return (
                <div key={doc.id} className="relative" style={{ borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}>
                  <div style={{ aspectRatio: '4 / 3', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {isPdf ? (
                      <div className="flex flex-col items-center gap-1 muted">
                        <FileText size={26} />
                        <span className="text-xs">PDF</span>
                      </div>
                    ) : (
                      <img
                        src={doc.file_url}
                        alt={label(doc.document_type)}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                  <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
                    <div className="font-bold text-ink" style={{ fontSize: 13 }}>{label(doc.document_type)}</div>
                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <span className="chip chip-sm" style={{ background: st.bg, color: st.color, fontSize: 10 }}>
                        {st.text}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', minHeight: 0, fontSize: 11 }}
                        title="Remove document"
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? <Spinner size={11} /> : <Trash2 size={12} />}
                      </button>
                    </div>
                    {doc.rejection_reason && (
                      <div className="muted text-xs mt-1.5" style={{ color: '#dc2626' }}>{doc.rejection_reason}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-4" style={{ padding: 16, borderRadius: 'var(--radius)', border: '1px dashed var(--border)', background: '#fafafa' }}>
          <div className="font-bold text-sm text-ink flex items-center gap-1.5 mb-3">
            <Plus size={14} style={{ color: 'var(--primary)' }} /> Add a document
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', alignItems: 'end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Document Type</label>
              {uploadType === 'other' ? (
                <div className="flex gap-2">
                  <input className="input" maxLength={40} placeholder="e.g. Road permit" value={customType} onChange={(e) => setCustomType(e.target.value)} autoFocus />
                  <button type="button" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }} onClick={() => setUploadType('driving_license')}>Back</button>
                </div>
              ) : (
                <select className="select" value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
                  {DOCUMENT_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">File</label>
              <input ref={fileRef} type="file" className="input" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
            </div>
            <button type="submit" className="btn btn-primary flex items-center justify-center gap-1.5" disabled={uploading}>
              {uploading ? <Spinner size={14} color="#fff" /> : <UploadCloud size={15} />} {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          {previews.pending && (
            <div className="flex items-center gap-3 mt-3">
              <img src={previews.pending} alt="preview" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} />
              <span className="muted text-xs">Ready to upload: {file?.name} ({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          )}
          <div className="muted text-xs mt-2 flex items-center gap-1" style={{ marginTop: '8px', marginBottom: 0 }}>
            <Info size={11} /> JPG, PNG or PDF up to 5 MB. Files are sent to the hub for verification.
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 18, margin: 0, background: '#f0fdf4', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="font-bold text-sm" style={{ color: '#15803d' }}>
              {rider.insurance_expiry ? `Insurance valid up to ${rider.insurance_expiry}` : 'Insurance & permits'}
            </div>
            <p className="muted text-xs mt-1" style={{ margin: 0, color: '#166534' }}>
              {rider.insurance_expiry
                ? 'Keep your insurance and permit documents up to date. Renewals are reflected after hub verification.'
                : 'All GOSIKA delivery partners ride insured and compliant vehicles. Add your insurance document above so the hub can verify it.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}