import React, { useEffect, useState } from 'react'
import {
  ShieldCheck, Building2, Check, CheckCircle2, UploadCloud, FileText,
  MapPin, Phone, Mail, Award, XCircle, Clock, FileUp, Hash
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useToast } from '../../context/ToastContext'
import { errorMessage, apiImage, formatDate } from '../../utils/format'

function InfoCard({ icon: Icon, color, label, value }) {
  return (
    <div className="card flex items-start gap-3" style={{ padding: '16px 18px' }}>
      <span className="avatar" style={{ width: 42, height: 42, background: `${color}1a`, color, flexShrink: 0 }}>
        <Icon size={20} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>{label}</div>
        <div className="text-sm" style={{ fontWeight: 700, color: 'var(--ink)', marginTop: 3, wordBreak: 'break-word' }}>{value || '—'}</div>
      </div>
    </div>
  )
}

const DOC_CARDS = [
  { type: 'citizenship_front', label: 'Citizenship (Front)' },
  { type: 'citizenship_back', label: 'Citizenship (Back)' },
  { type: 'pan_vat', label: 'PAN / VAT Certificate' },
  { type: 'business_registration', label: 'Company Darta Certificate' },
]

export default function VendorVerification() {
  const toast = useToast()
  const [vendor, setVendor] = useState(null)
  const [basic, setBasic] = useState({
    company_name: '',
    business_email: '',
    business_phone: '',
    pan_vat: '',
    registration_number: '',
  })
  const [kyc, setKyc] = useState({
    owner_full_name: '',
    owner_citizenship_number: '',
    owner_email: '',
    owner_phone: '',
    business_type: '',
    address: '',
    province: '',
    district: '',
    city: '',
    coordinates: null,
  })
  const [previews, setPreviews] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState('')
  const [uploading, setUploading] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/vendor/me')
      .then((r) => {
        const v = r.data.data || {}
        setVendor(v)
        setBasic({
          company_name: v.company_name || '',
          business_email: v.business_email || '',
          business_phone: v.business_phone || '',
          pan_vat: v.pan_vat || '',
          registration_number: v.registration_number || '',
        })
        const k = v.kyc || {}
        setKyc({
          owner_full_name: k.owner_full_name || '',
          owner_citizenship_number: k.owner_citizenship_number || '',
          owner_email: k.owner_email || '',
          owner_phone: k.owner_phone || '',
          business_type: k.business_type || '',
          address: k.address || '',
          province: k.province || '',
          district: k.district || '',
          city: k.municipality || '',
          coordinates: k.latitude && k.longitude ? { lat: Number(k.latitude), lng: Number(k.longitude) } : null,
        })
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const saveBasic = async (e) => {
    e.preventDefault()
    setSaving('basic')
    try {
      await api.put('/vendor/me', basic)
      toast.success('Business profile updated successfully')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveKyc = async (e) => {
    e.preventDefault()
    setSaving('kyc')
    try {
      await api.post('/vendor/kyc', {
        owner_full_name: kyc.owner_full_name,
        owner_citizenship_number: kyc.owner_citizenship_number,
        owner_email: kyc.owner_email,
        owner_phone: kyc.owner_phone,
        business_type: kyc.business_type,
        address: kyc.address,
        province: kyc.province,
        district: kyc.district,
        municipality: kyc.city,
        latitude: kyc.coordinates?.lat,
        longitude: kyc.coordinates?.lng,
      })
      toast.success('KYC verification submitted successfully for review')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const uploadDocument = async (type, file) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPreviews((prev) => ({ ...prev, [type]: preview }))
    setUploading(type)
    const fd = new FormData()
    fd.append('document_type', type)
    fd.append('file', file)
    try {
      await api.post('/vendor/documents', fd)
      toast.success('Document uploaded and sent for review')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading('')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" style={{ paddingBottom: 40 }}>
        <Skeleton height={120} />
        <Skeleton height={260} />
        <Skeleton height={320} />
      </div>
    )
  }

  if (error) {
    return <ErrorState onRetry={load} />
  }

  const v = vendor || {}
  const k = v.kyc || {}
  const kycPending = ['pending', 'submitted', 'under_review'].includes(k.status)
  const kycApproved = k.status === 'approved' || k.status === 'verified'
  const docs = v.documents || []
  const uploadedTypes = docs.map((d) => d.document_type)

  return (
    <div style={{ width: '100%', paddingBottom: 50 }}>
      {/* Top Header Card */}
      <div className="card" style={{ padding: 22, marginBottom: 20, background: '#fff' }}>
        <div className="flex items-center justify-between wrap gap-4">
          <div className="flex items-center gap-4">
            <span
              className="avatar"
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Building2 size={32} />
            </span>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>KYC Verification</h1>
              <p className="muted text-sm" style={{ marginTop: 4 }}>
                Business &amp; legal owner details captured at registration, editable below.
              </p>
            </div>
          </div>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            {kycApproved ? <CheckCircle2 size={15} color="#10b981" /> : kycPending ? <Clock size={15} color="#f59e0b" /> : <XCircle size={15} color="#ef4444" />}
            <span className="text-sm font-semibold text-ink">KYC Status: </span>
            <StatusBadge status={k.status || 'not_submitted'} />
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <InfoCard icon={Hash} color="#2563eb" label="PAN / VAT" value={v.pan_vat} />
        <InfoCard icon={FileText} color="#f59e0b" label="Registration No." value={v.registration_number} />
        <InfoCard icon={Mail} color="#10b981" label="Business Email" value={v.business_email} />
        <InfoCard icon={Phone} color="#ef4444" label="Business Phone" value={v.business_phone} />
      </div>

      {/* Section 1: Business Information */}
      <form className="card" onSubmit={saveBasic} style={{ padding: 24, marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
            <Building2 size={18} color="var(--primary)" /> Business &amp; Enterprise Information
          </h3>
          <span className="muted text-xs">Public company information shown on store receipts</span>
        </div>

        <div className="form-row">
          <Input
            label="Registered Company Name *"
            required
            value={basic.company_name}
            onChange={(e) => setBasic({ ...basic, company_name: e.target.value })}
            placeholder="e.g. Koshi Handicrafts Pvt. Ltd."
          />
          <Input
            label="Official Business Email *"
            type="email"
            required
            value={basic.business_email}
            onChange={(e) => setBasic({ ...basic, business_email: e.target.value })}
            placeholder="hello@koshi.com.np"
          />
        </div>

        <div className="form-row">
          <Input
            label="Business Phone Number"
            value={basic.business_phone}
            onChange={(e) => setBasic({ ...basic, business_phone: e.target.value })}
            placeholder="+977 98XXXXXXXX"
          />
          <Input
            label="PAN / VAT Registration Number"
            value={basic.pan_vat}
            onChange={(e) => setBasic({ ...basic, pan_vat: e.target.value })}
            placeholder="e.g. 609842103"
          />
          <Input
            label="Company Registration (Darta) Number"
            value={basic.registration_number}
            onChange={(e) => setBasic({ ...basic, registration_number: e.target.value })}
            placeholder="e.g. REG-KOSHI-2024-8841"
          />
        </div>

        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'basic'}>
            {saving === 'basic' ? <Spinner size={14} color="#fff" /> : <><Check size={14} /> Save Business Profile</>}
          </Button>
        </div>
      </form>

      {/* Section 2: KYC & Owner Verification */}
      <form className="card" onSubmit={saveKyc} style={{ padding: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
            <ShieldCheck size={18} color="var(--primary)" /> KYC &amp; Legal Owner Verification
          </h3>
          <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
            <Award size={11} /> Government of Nepal Compliant
          </span>
        </div>

        {k.review_notes && (
          <div className="muted text-sm mb-4" style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <strong>Review notes:</strong> {k.review_notes}
          </div>
        )}
        {k.reviewed_at && (
          <div className="muted text-xs mb-4">Reviewed {formatDate(k.reviewed_at)}</div>
        )}

        <div className="form-row">
          <Input
            label="Legal Owner / Proprietor Full Name *"
            required
            value={kyc.owner_full_name}
            onChange={(e) => setKyc({ ...kyc, owner_full_name: e.target.value })}
            placeholder="e.g. Suman Pokhrel"
          />
          <Input
            label="Citizenship Certificate Number (Nagarikta)"
            value={kyc.owner_citizenship_number}
            onChange={(e) => setKyc({ ...kyc, owner_citizenship_number: e.target.value })}
            placeholder="e.g. 12-01-76-04891 (Morang)"
          />
        </div>

        <div className="form-row">
          <Input
            label="Owner Email Address"
            type="email"
            value={kyc.owner_email}
            onChange={(e) => setKyc({ ...kyc, owner_email: e.target.value })}
            placeholder="suman.pokhrel@koshi.com.np"
          />
          <Input
            label="Owner Direct Mobile / WhatsApp"
            value={kyc.owner_phone}
            onChange={(e) => setKyc({ ...kyc, owner_phone: e.target.value })}
            placeholder="+977 98XXXXXXXX"
          />
          <Select
            label="Legal Business Entity Type"
            value={kyc.business_type}
            onChange={(e) => setKyc({ ...kyc, business_type: e.target.value })}
          >
            <option value="">Select entity type</option>
            <option value="Private Limited (Pvt. Ltd.)">Private Limited (Pvt. Ltd.)</option>
            <option value="Sole Proprietorship">Sole Proprietorship (Ekala Swamittwa)</option>
            <option value="Partnership Firm">Partnership Firm (Sajhedari)</option>
            <option value="Public Limited">Public Limited</option>
            <option value="Cooperative (Sahakari)">Cooperative (Sahakari)</option>
          </Select>
        </div>

        {/* Nepal Cascading OpenStreetMap Location Picker */}
        <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
            <MapPin size={15} color="var(--primary)" /> Registered Merchant Business Location (Nepal Map)
          </h4>
          <LocationMapPicker
            province={kyc.province}
            district={kyc.district}
            city={kyc.city}
            address={kyc.address}
            coordinates={kyc.coordinates}
            onChange={(loc) => {
              setKyc((prev) => ({
                ...prev,
                province: loc.province,
                district: loc.district,
                city: loc.city,
                address: loc.address,
                coordinates: loc.coordinates,
              }))
            }}
          />
        </div>

        {/* Verification Documents & ID Proofs */}
        <div style={{ margin: '20px 0', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }} className="flex items-center gap-1.5">
            <FileText size={15} color="var(--primary)" /> Verification Documents &amp; ID Proofs (Real File Uploads)
          </h4>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {DOC_CARDS.map((doc) => {
              const uploaded = uploadedTypes.includes(doc.type)
              const existing = docs.find((d) => d.document_type === doc.type)
              return (
                <div key={doc.type} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, background: 'var(--bg)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-ink">{doc.label}</span>
                    {uploaded && <StatusBadge status="approved" />}
                  </div>
                  <div
                    style={{
                      height: 110,
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      marginBottom: 8,
                      background: '#fff',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--muted)',
                    }}
                  >
                    {previews[doc.type] ? (
                      <img src={previews[doc.type]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : existing?.file_path ? (
                      <a href={apiImage(existing.file_path)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <FileText size={28} color="var(--primary)" />
                      </a>
                    ) : (
                      <span className="muted text-xs flex items-center gap-1"><UploadCloud size={18} /> Not uploaded</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    id={`doc-${doc.type}`}
                    onChange={(e) => uploadDocument(doc.type, e.target.files?.[0])}
                  />
                  <label
                    htmlFor={`doc-${doc.type}`}
                    className="btn btn-outline btn-xs w-full"
                    style={{
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {uploading === doc.type ? <Spinner size={11} /> : <UploadCloud size={11} />} {uploaded ? 'Re-upload' : 'Upload'}
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'kyc'}>
            {saving === 'kyc' ? <Spinner size={14} color="#fff" /> : <><ShieldCheck size={14} /> Send for KYC Verification</>}
          </Button>
        </div>
      </form>
    </div>
  )
}