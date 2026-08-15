import React, { useEffect, useState } from 'react'
import {
  Building2, ShieldCheck, CheckCircle2, UploadCloud, FileText,
  MapPin, Phone, Mail, Award, Check, Percent, CalendarDays
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
import { errorMessage, formatDate } from '../../utils/format'

const DOC_CARDS = [
  { type: 'citizenship_front', label: 'Citizenship (Front)' },
  { type: 'citizenship_back', label: 'Citizenship (Back)' },
  { type: 'pan_vat', label: 'PAN / VAT Certificate' },
  { type: 'business_registration', label: 'Company Darta Certificate' },
]

export default function VendorProfile() {
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
          province: '',
          district: '',
          city: '',
          coordinates: null,
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
      toast.success('Document uploaded successfully')
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
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: 'var(--ink)' }}>
                  {vendor?.company_name || 'Vendor profile'}
                </h1>
                {vendor?.status === 'approved' && (
                  <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 800 }}>
                    <CheckCircle2 size={12} /> Verified Merchant
                  </span>
                )}
              </div>
              <div className="muted text-xs flex items-center gap-3 mt-1 wrap">
                {vendor?.business_email && (
                  <span className="flex items-center gap-1"><Mail size={12} /> {vendor.business_email}</span>
                )}
                {vendor?.business_phone && (
                  <span className="flex items-center gap-1"><Phone size={12} /> {vendor.business_phone}</span>
                )}
                {vendor?.pan_vat && (
                  <span className="flex items-center gap-1"><ShieldCheck size={12} color="var(--primary)" /> PAN: {vendor.pan_vat}</span>
                )}
              </div>
              <div className="muted text-xs flex items-center gap-3 mt-1 wrap">
                {vendor?.commission_rate != null && (
                  <span className="flex items-center gap-1"><Percent size={12} color="var(--primary)" /> Commission: {vendor.commission_rate}%</span>
                )}
                {vendor?.approved_at && (
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> Approved: {formatDate(vendor.approved_at)}</span>
                )}
                {vendor?.kyc?.status && (
                  <span className="flex items-center gap-1"><Award size={12} /> KYC <StatusBadge status={vendor.kyc.status} /></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={vendor?.status} />
          </div>
        </div>
      </div>

      {/* Section 1: Business Information */}
      <form className="card" onSubmit={saveBasic} style={{ padding: 24, marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
            <Building2 size={18} color="var(--primary)" /> Business & Enterprise Information
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
            <ShieldCheck size={18} color="var(--primary)" /> KYC & Legal Owner Verification
          </h3>
          <span className="chip chip-sm" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 700 }}>
            <Award size={11} /> Government of Nepal Compliant
          </span>
        </div>

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
            <FileText size={15} color="var(--primary)" /> Verification Documents & ID Proofs (Real File Uploads)
          </h4>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {DOC_CARDS.map((doc) => (
              <div key={doc.type} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12, background: 'var(--bg)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-ink">{doc.label}</span>
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
                  ) : (
                    <FileText size={28} />
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
                  {uploading === doc.type ? <Spinner size={11} /> : <UploadCloud size={11} />} Upload
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'kyc'}>
            {saving === 'kyc' ? <Spinner size={14} color="#fff" /> : <><ShieldCheck size={14} /> Submit KYC Information</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
