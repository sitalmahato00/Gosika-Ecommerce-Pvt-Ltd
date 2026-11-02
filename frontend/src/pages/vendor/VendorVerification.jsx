import React, { useEffect, useState } from 'react'
import {
  ShieldCheck, Building2, Check, CheckCircle2, UploadCloud, FileText,
  MapPin, Phone, Mail, Award, XCircle, Clock, FileUp, Hash, User, Store, CreditCard
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import ImageUpload from '../../components/ui/ImageUpload'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage, formatDate } from '../../utils/format'
import { downloadVendorDocument } from '../../utils/vendorDocuments'

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
  const { user, updateUser } = useAuth()
  const [vendor, setVendor] = useState(null)
  const [account, setAccount] = useState({ first_name: '', last_name: '', phone: '' })
  const [basic, setBasic] = useState({
    company_name: '',
    business_email: '',
    business_phone: '',
    pan_vat: '',
    registration_number: '',
  })
  const [storeForm, setStoreForm] = useState({
    id: '',
    name: '',
    description: '',
    logo: '',
    banner: '',
  })
  const [bankForm, setBankForm] = useState({
    id: '',
    bank_name: '',
    branch_name: '',
    account_name: '',
    account_number: '',
    account_type: 'savings',
  })
  const [kyc, setKyc] = useState({
    owner_full_name: '',
    owner_citizenship_number: '',
    owner_email: '',
    owner_phone: '',
    business_type: '',
    address: '',
    landmark: '',
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

  useEffect(() => {
    setAccount({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
    })
  }, [user])

  const load = () => {
    setLoading(true)
    setError(null)
    return api.get('/vendor/me')
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
        const store = v.stores?.[0] || {}
        setStoreForm({
          id: store.id || '',
          name: store.name || '',
          description: store.description || '',
          logo: store.logo || '',
          banner: store.banner || '',
        })
        const bank = v.bank_accounts?.[0] || {}
        setBankForm({
          id: bank.id || '',
          bank_name: bank.bank_name || '',
          branch_name: bank.branch_name || '',
          account_name: bank.account_name || '',
          account_number: bank.account_number || '',
          account_type: bank.account_type || 'savings',
        })
        const k = v.kyc || {}
        setKyc({
          owner_full_name: k.owner_full_name || '',
          owner_citizenship_number: k.owner_citizenship_number || '',
          owner_email: k.owner_email || '',
          owner_phone: k.owner_phone || '',
          business_type: k.business_type || '',
          address: k.address || '',
          landmark: k.landmark || '',
          province: k.province || '',
          district: k.district || '',
          city: k.municipality || '',
          coordinates: k.latitude && k.longitude ? { lat: Number(k.latitude), lng: Number(k.longitude) } : null,
        })
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
  }, [])

  const persistAccount = async () => {
    await api.put('/vendor/profile', account)
    updateUser({
      first_name: account.first_name,
      last_name: account.last_name,
      name: `${account.first_name} ${account.last_name}`.trim(),
      phone: account.phone,
    })
  }

  const persistBasic = async () => {
    await api.put('/vendor/me', basic)
  }

  const persistStore = async () => {
    const payload = {
      name: storeForm.name,
      description: storeForm.description,
      logo: storeForm.logo,
      banner: storeForm.banner,
      contact_email: basic.business_email,
      contact_phone: basic.business_phone,
    }
    const response = storeForm.id
      ? await api.put(`/vendor/stores/${storeForm.id}`, payload)
      : await api.post('/vendor/stores', payload)
    const savedStore = response.data?.data
    if (savedStore?.id) {
      setStoreForm((prev) => ({ ...prev, id: savedStore.id }))
    }
  }

  const persistBank = async () => {
    if (bankForm.id) {
      await api.put(`/vendor/bank-accounts/${bankForm.id}`, bankForm)
    } else {
      const response = await api.post('/vendor/bank-accounts', bankForm)
      const savedBank = response.data?.data
      if (savedBank?.id) {
        setBankForm((prev) => ({ ...prev, id: savedBank.id }))
      }
    }
  }

  const saveBasic = async (e) => {
    e.preventDefault()
    setSaving('basic')
    try {
      await persistBasic()
      toast.success('Business profile updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveAccount = async (e) => {
    e.preventDefault()
    setSaving('account')
    try {
      await persistAccount()
      toast.success('Account details updated successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveStore = async (e) => {
    e.preventDefault()
    setSaving('store')
    try {
      await persistStore()
      toast.success('Store information saved successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveBank = async (e) => {
    e.preventDefault()
    setSaving('bank')
    try {
      await persistBank()
      toast.success('Payout bank details saved successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveKyc = async (e) => {
    e.preventDefault()
    const requiredRegistrationFields = [
      [account.first_name, 'First name'],
      [account.last_name, 'Last name'],
      [user?.email, 'Account email'],
      [account.phone, 'Account phone'],
      [basic.company_name, 'Business name'],
      [basic.business_email, 'Business email'],
      [basic.pan_vat, 'Tax ID / VAT number'],
      [kyc.business_type, 'Business type'],
      [storeForm.name, 'Store name'],
      [storeForm.description, 'Store description'],
      [storeForm.logo, 'Store logo'],
      [storeForm.banner, 'Store cover image'],
      [bankForm.bank_name, 'Bank name'],
      [bankForm.account_number, 'Bank account number'],
      [bankForm.account_name, 'Bank account holder'],
      [kyc.owner_full_name, 'Legal owner name'],
    ]
    const missingField = requiredRegistrationFields.find(([value]) => !String(value || '').trim())
    if (missingField) {
      toast.error(`Complete and save the ${missingField[1]} before submitting KYC.`)
      return
    }
    const missingDocument = DOC_CARDS.find((doc) => !uploadedTypes.includes(doc.type))
    if (missingDocument) {
      toast.error(`Upload the ${missingDocument.label} before submitting KYC.`)
      return
    }
    setSaving('kyc')
    try {
      await persistAccount()
      await persistBasic()
      await persistStore()
      await persistBank()
      await api.post('/vendor/kyc', {
        owner_full_name: kyc.owner_full_name,
        owner_citizenship_number: kyc.owner_citizenship_number,
        owner_email: kyc.owner_email,
        owner_phone: kyc.owner_phone,
        business_type: kyc.business_type,
        address: kyc.address,
        landmark: kyc.landmark,
        province: kyc.province,
        district: kyc.district,
        municipality: kyc.city,
        latitude: kyc.coordinates?.lat,
        longitude: kyc.coordinates?.lng,
      })
      toast.success('KYC verification submitted successfully for review')
      await load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const uploadDocument = async (type, file) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setUploading(type)
    const fd = new FormData()
    fd.append('document_type', type)
    fd.append('file', file)
    try {
      const response = await api.post('/vendor/documents', fd)
      const uploadedDocument = response.data?.data
      if (!uploadedDocument?.id) {
        throw new Error('Upload succeeded, but the server did not return the saved document.')
      }
      setVendor((prev) => prev ? {
        ...prev,
        documents: [
          ...(prev.documents || []).filter((document) => document.document_type !== type),
          uploadedDocument,
        ],
      } : prev)
      setPreviews((prev) => {
        if (prev[type]) URL.revokeObjectURL(prev[type])
        return { ...prev, [type]: preview }
      })
      toast.success('Document uploaded and sent for review')
    } catch (err) {
      URL.revokeObjectURL(preview)
      toast.error(errorMessage(err))
    } finally {
      setUploading('')
    }

    const downloadDocument = async (document) => {
      try {
        const extension = document.file_path?.split('.').pop() || 'file'
        await downloadVendorDocument(
          `/vendor/documents/${document.id}/download`,
          `${document.document_type || 'verification-document'}.${extension}`
        )
      } catch (err) {
        toast.error(errorMessage(err, 'Could not download this verification document.'))
      }
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

      <form className="card" onSubmit={saveAccount} style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }} className="flex items-center gap-2">
          <User size={18} color="var(--primary)" /> Account Details
        </h3>
        <p className="muted text-sm" style={{ margin: '0 0 16px' }}>
          These are the personal details used when the seller account was registered. Email is fixed to the verified account; update your password under Security.
        </p>
        <div className="form-row">
          <Input
            label="First Name *"
            required
            value={account.first_name}
            onChange={(e) => setAccount({ ...account, first_name: e.target.value })}
          />
          <Input
            label="Last Name *"
            required
            value={account.last_name}
            onChange={(e) => setAccount({ ...account, last_name: e.target.value })}
          />
        </div>
        <div className="form-row">
          <Input label="Account Email" type="email" value={user?.email || ''} readOnly />
          <Input
            label="Account Phone *"
            required
            value={account.phone}
            onChange={(e) => setAccount({ ...account, phone: e.target.value })}
          />
        </div>
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'account'}>
            {saving === 'account' ? <Spinner size={14} color="#fff" /> : <><Check size={14} /> Save Account Details</>}
          </Button>
        </div>
      </form>

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
            <Building2 size={18} color="var(--primary)" /> Business Details
          </h3>
          <span className="muted text-xs">Registration and tax information</span>
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
            required
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
          <Select
            label="Business Type *"
            required
            value={kyc.business_type}
            onChange={(e) => setKyc({ ...kyc, business_type: e.target.value })}
            hint="This is submitted with your final KYC application."
          >
            <option value="">Select business type</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Service">Service</option>
            <option value="Private Limited (Pvt. Ltd.)">Private Limited (Pvt. Ltd.)</option>
            <option value="Sole Proprietorship">Sole Proprietorship (Ekala Swamittwa)</option>
            <option value="Partnership Firm">Partnership Firm (Sajhedari)</option>
            <option value="Public Limited">Public Limited</option>
            <option value="Cooperative (Sahakari)">Cooperative (Sahakari)</option>
          </Select>
        </div>

        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'basic'}>
            {saving === 'basic' ? <Spinner size={14} color="#fff" /> : <><Check size={14} /> Save Business Profile</>}
          </Button>
        </div>
      </form>

      <form className="card" onSubmit={saveStore} style={{ padding: 24, marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
            <Store size={18} color="var(--primary)" /> Store Information &amp; Branding
          </h3>
          <span className="muted text-xs">Name, description, logo and cover image</span>
        </div>
        <div className="form-row">
          <Input
            label="Store Name *"
            required
            value={storeForm.name}
            onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
            placeholder="e.g. Gosika Organic Farms"
          />
        </div>
        <div className="form-row">
          <Textarea
            label="Store Description *"
            required
            value={storeForm.description}
            onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
            placeholder="Describe your store and products"
            rows={4}
          />
        </div>
        <div className="form-row">
          <ImageUpload
            label="Store Logo *"
            value={storeForm.logo}
            onChange={(logo) => setStoreForm((prev) => ({ ...prev, logo }))}
            folder="stores"
            required
            aspectRatio="1/1"
          />
          <ImageUpload
            label="Store Cover Image *"
            value={storeForm.banner}
            onChange={(banner) => setStoreForm((prev) => ({ ...prev, banner }))}
            folder="stores"
            required
            aspectRatio="16/9"
          />
        </div>
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'store'}>
            {saving === 'store' ? <Spinner size={14} color="#fff" /> : <><Check size={14} /> Save Store Details</>}
          </Button>
        </div>
      </form>

      <form className="card" onSubmit={saveBank} style={{ padding: 24, marginBottom: 24 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
            <CreditCard size={18} color="var(--primary)" /> Bank Details
          </h3>
          <span className="muted text-xs">Used for seller payouts</span>
        </div>
        <div className="form-row">
          <Input
            label="Bank Name *"
            required
            value={bankForm.bank_name}
            onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}
            placeholder="e.g. Nabil Bank"
          />
          <Input
            label="Branch Name"
            value={bankForm.branch_name}
            onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}
            placeholder="Branch"
          />
        </div>
        <div className="form-row">
          <Input
            label="Account Number *"
            required
            value={bankForm.account_number}
            onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
            placeholder="Bank account number"
          />
          <Input
            label="Account Holder Name *"
            required
            value={bankForm.account_name}
            onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
            placeholder="Name on the bank account"
          />
          <Select
            label="Account Type"
            value={bankForm.account_type}
            onChange={(e) => setBankForm({ ...bankForm, account_type: e.target.value })}
          >
            <option value="savings">Savings</option>
            <option value="current">Current</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'bank'}>
            {saving === 'bank' ? <Spinner size={14} color="#fff" /> : <><Check size={14} /> Save Bank Details</>}
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
            landmark={kyc.landmark}
            coordinates={kyc.coordinates}
            onChange={(loc) => {
              setKyc((prev) => ({
                ...prev,
                province: loc.province,
                district: loc.district,
                city: loc.city,
                address: loc.address,
                landmark: loc.landmark,
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
                    {uploaded && <StatusBadge status={existing?.status || 'pending'} />}
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
                      <button type="button" onClick={() => downloadDocument(existing)} aria-label={`Download ${doc.label}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'transparent', border: 0, cursor: 'pointer' }}>
                        <FileText size={28} color="var(--primary)" />
                      </button>
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

        <div style={{ margin: '20px 0', padding: 16, background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 10px' }}>Review &amp; Submit Registration</h4>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            {[
              ['Account', `${account.first_name} ${account.last_name} · ${user?.email || ''} · ${account.phone}`],
              ['Business', `${basic.company_name} · ${kyc.business_type} · Tax ID ${basic.pan_vat}`],
              ['Store', `${storeForm.name} · ${storeForm.description}`],
              ['Store Logo', storeForm.logo ? 'Uploaded' : 'Not completed'],
              ['Store Cover', storeForm.banner ? 'Uploaded' : 'Not completed'],
              ['Owner KYC', kyc.owner_full_name],
              ['Payout Bank', `${bankForm.bank_name} · ${bankForm.account_name} · ${bankForm.account_number}`],
            ].map(([label, value]) => (
              <div key={label} style={{ fontSize: 12, color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--ink)' }}>{label}:</strong> {value || 'Not completed'}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="submit" size="sm" disabled={saving === 'kyc'}>
            {saving === 'kyc' ? <Spinner size={14} color="#fff" /> : <><ShieldCheck size={14} /> Review &amp; Submit KYC</>}
          </Button>
        </div>
      </form>
    </div>
  )
}