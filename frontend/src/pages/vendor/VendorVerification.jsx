import React, { useEffect, useState } from 'react'
import {
  ShieldCheck, IdCard, Building2, FileUp, Landmark, CheckCircle2,
  XCircle, Clock, Upload, Mail, Phone, Hash, FileText, MapPin, User
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { formatDate, errorMessage } from '../../utils/format'

const DOC_TYPES = [
  { value: 'citizenship_front', label: 'Citizenship (Front)' },
  { value: 'citizenship_back', label: 'Citizenship (Back)' },
  { value: 'business_registration', label: 'Business Registration' },
  { value: 'pan_vat', label: 'PAN / VAT Certificate' },
  { value: 'tax_clearance', label: 'Tax Clearance' },
  { value: 'profile', label: 'Profile Photo' },
]

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

export default function VendorVerification() {
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [docType, setDocType] = useState(DOC_TYPES[0].value)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/vendor/me')
      .then((r) => setProfile(r.data.data || null))
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const uploadDoc = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please choose a document file first')
    setUploading(true)
    const fd = new FormData()
    fd.append('document_type', docType)
    fd.append('file', file)
    try {
      await api.post('/vendor/documents', fd)
      toast.success('Document uploaded and sent for review')
      setFile(null)
      if (e.target?.reset) e.target.reset()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ padding: 60, textAlign: 'center' }}>
        <Spinner size={26} color="var(--primary)" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Could not load verification status"
        message="Something went wrong while loading your business verification details."
        action={<Button variant="outline" size="sm" onClick={load}>Try again</Button>}
      />
    )
  }

  const v = profile || {}
  const kyc = v.kyc || {}
  const kycPending = ['pending', 'submitted', 'under_review'].includes(kyc.status)
  const kycApproved = kyc.status === 'approved' || kyc.status === 'verified'

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Business Verification</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Complete your KYC and business documents to keep your seller account verified.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
            {kycApproved ? <CheckCircle2 size={15} color="#10b981" /> : kycPending ? <Clock size={15} color="#f59e0b" /> : <XCircle size={15} color="#ef4444" />}
            <span className="text-sm font-semibold text-ink">KYC Status: </span>
            <StatusBadge status={kyc.status || 'not_submitted'} />
          </span>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <InfoCard icon={IdCard} color="#8b5cf6" label="Company Name" value={v.company_name} />
        <InfoCard icon={Hash} color="#2563eb" label="PAN / VAT" value={v.pan_vat} />
        <InfoCard icon={FileText} color="#f59e0b" label="Registration No." value={v.registration_number} />
        <InfoCard icon={Mail} color="#10b981" label="Business Email" value={v.business_email} />
        <InfoCard icon={Phone} color="#ef4444" label="Business Phone" value={v.business_phone} />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 18 }}>
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={17} color="var(--primary)" />
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>KYC Details</h2>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
          <InfoCard icon={User} color="#8b5cf6" label="Owner Full Name" value={kyc.owner_full_name} />
          <InfoCard icon={IdCard} color="#2563eb" label="Citizenship Number" value={kyc.owner_citizenship_number} />
          <InfoCard icon={Mail} color="#10b981" label="Owner Email" value={kyc.owner_email} />
          <InfoCard icon={Phone} color="#ef4444" label="Owner Phone" value={kyc.owner_phone} />
          <InfoCard icon={Landmark} color="#f59e0b" label="Business Type" value={kyc.business_type} />
          <InfoCard icon={MapPin} color="#0ea5e9" label="Address" value={kyc.address} />
        </div>
        {kyc.review_notes && (
          <div className="muted text-sm mt-3" style={{ background: 'var(--bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <strong>Review notes:</strong> {kyc.review_notes}
          </div>
        )}
        {kyc.reviewed_at && (
          <div className="muted text-xs mt-2">Reviewed {formatDate(kyc.reviewed_at)}</div>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div className="flex items-center gap-2 mb-1">
          <Upload size={17} color="var(--primary)" />
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>Submit Documents</h2>
        </div>
        <p className="muted text-sm m-0 mb-4">
          Upload ownership and tax documents to support your verification. Accepted formats: JPG, PNG, PDF (max 5 MB each).
        </p>
        <form onSubmit={uploadDoc} className="flex items-end gap-3 wrap">
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label className="muted text-xs font-semibold uppercase" style={{ display: 'block', marginBottom: 6 }}>Document type</label>
            <select
              className="input"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{ height: 40 }}
            >
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label className="muted text-xs font-semibold uppercase" style={{ display: 'block', marginBottom: 6 }}>File</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              name="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input"
              style={{ height: 40, paddingTop: 8 }}
            />
          </div>
          <Button type="submit" variant="primary" icon={FileUp} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload Document'}
          </Button>
        </form>
      </div>
    </div>
  )
}