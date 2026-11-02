import React, { useEffect, useState } from 'react'
import {
  ShieldCheck, Building2, Check, CheckCircle2, UploadCloud, FileText,
  MapPin, Phone, Mail, Award, XCircle, Clock, Hash, User, Store, CreditCard,
  ChevronLeft, ChevronRight
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
import { apiImage, errorMessage, formatDate } from '../../utils/format'
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

const isImageDocument = (document) => (
  document.mime_type?.startsWith('image/')
  || /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(document.file_path || '')
)

const VERIFICATION_STEPS = [
  'Account',
  'Business',
  'Store',
  'Bank',
  'Owner & Documents',
  'Review & Submit',
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
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState('')
  const [uploading, setUploading] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState([])

  const invalidateFrom = (step) => {
    setCompletedSteps((current) => current.filter((completedStep) => completedStep < step))
  }

  const completeStep = (step) => {
    setCompletedSteps((current) => (
      current.includes(step) ? current : [...current, step].sort((a, b) => a - b)
    ))
    setActiveStep(step + 1)
  }

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
        const storeAddress = store.addresses?.find((address) => address.address_type === 'business') || {}
        const documentTypes = (v.documents || []).map((document) => document.document_type)
        const savedSteps = []
        if (user?.first_name?.trim() && user?.last_name?.trim() && user?.phone?.trim()) savedSteps.push(0)
        if (v.company_name?.trim() && v.business_email?.trim() && v.pan_vat?.trim()) savedSteps.push(1)
        if (store.name?.trim() && store.description?.trim() && store.logo?.trim() && store.banner?.trim()) savedSteps.push(2)
        if (bank.bank_name?.trim() && bank.account_number?.trim() && bank.account_name?.trim()) savedSteps.push(3)
        if (
          k.business_type?.trim()
          && k.owner_full_name?.trim()
          && (k.address || storeAddress.address_line_1)?.trim()
          && (k.province || storeAddress.province)?.trim()
          && (k.district || storeAddress.district)?.trim()
          && (k.municipality || storeAddress.municipality)?.trim()
          && DOC_CARDS.every((document) => documentTypes.includes(document.type))
        ) savedSteps.push(4)
        setCompletedSteps(savedSteps)
        setKyc({
          owner_full_name: k.owner_full_name || '',
          owner_citizenship_number: k.owner_citizenship_number || '',
          owner_email: k.owner_email || '',
          owner_phone: k.owner_phone || '',
          business_type: k.business_type || '',
          address: k.address || storeAddress.address_line_1 || '',
          landmark: k.landmark || storeAddress.landmark || '',
          province: k.province || storeAddress.province || '',
          district: k.district || storeAddress.district || '',
          city: k.municipality || storeAddress.municipality || '',
          coordinates: k.latitude && k.longitude
            ? { lat: Number(k.latitude), lng: Number(k.longitude) }
            : storeAddress.latitude && storeAddress.longitude
              ? { lat: Number(storeAddress.latitude), lng: Number(storeAddress.longitude) }
              : null,
        })
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (![4, 5].includes(activeStep)) return undefined

    let cancelled = false
    const objectUrls = []
    const imageDocuments = (vendor?.documents || []).filter(isImageDocument)

    setDocumentPreviewUrls({})
    Promise.all(imageDocuments.map(async (document) => {
      try {
        const response = await api.get(`/vendor/documents/${document.id}/download`, {
          responseType: 'blob',
          skipCache: true,
        })
        if (cancelled) return null
        const objectUrl = URL.createObjectURL(response.data)
        objectUrls.push(objectUrl)
        return [document.document_type, objectUrl]
      } catch (err) {
        if (!cancelled) {
          toast.error(errorMessage(err, `Could not load preview for ${document.document_type}.`))
        }
        return null
      }
    })).then((entries) => {
      if (!cancelled) {
        setDocumentPreviewUrls(Object.fromEntries(entries.filter(Boolean)))
      }
    })

    return () => {
      cancelled = true
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
    }
  }, [activeStep, vendor?.documents])

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
      completeStep(1)
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
      completeStep(0)
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
      completeStep(2)
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
      completeStep(3)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const continueKyc = (e) => {
    e.preventDefault()
    const requiredFields = [
      [kyc.business_type, 'Business type'],
      [kyc.owner_full_name, 'Legal owner name'],
      [kyc.address, 'Business address'],
      [kyc.province, 'Province'],
      [kyc.district, 'District'],
      [kyc.city, 'Municipality'],
    ]
    const missingField = requiredFields.find(([value]) => !String(value || '').trim())
    if (missingField) {
      toast.error(`Complete the ${missingField[1]} before continuing.`)
      return
    }
    const missingDocument = DOC_CARDS.find((doc) => !uploadedTypes.includes(doc.type))
    if (missingDocument) {
      toast.error(`Upload the ${missingDocument.label} before continuing.`)
      return
    }
    completeStep(4)
  }

  const saveKyc = async (e) => {
    e.preventDefault()
    if (![0, 1, 2, 3, 4].every((step) => completedSteps.includes(step))) {
      toast.error('Complete each verification section before submitting.')
      return
    }
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
      [kyc.address, 'Business address'],
      [kyc.province, 'Province'],
      [kyc.district, 'District'],
      [kyc.city, 'Municipality'],
    ]
    const missingField = requiredRegistrationFields.find(([value]) => !String(value || '').trim())
    if (missingField) {
      toast.error(`Complete the ${missingField[1]} before submitting KYC.`)
      return
    }
    const missingDocument = DOC_CARDS.find((doc) => !uploadedTypes.includes(doc.type))
    if (missingDocument) {
      toast.error(`Upload the ${missingDocument.label} before submitting KYC.`)
      setActiveStep(4)
      return
    }
    setSaving('kyc')
    try {
      await api.post('/vendor/verification/submit', {
        first_name: account.first_name,
        last_name: account.last_name,
        phone: account.phone,
        company_name: basic.company_name,
        business_email: basic.business_email,
        business_phone: basic.business_phone || null,
        pan_vat: basic.pan_vat,
        registration_number: basic.registration_number || null,
        store_id: storeForm.id || null,
        store_name: storeForm.name,
        store_description: storeForm.description,
        store_logo: storeForm.logo,
        store_banner: storeForm.banner,
        bank_account_id: bankForm.id || null,
        bank_name: bankForm.bank_name,
        branch_name: bankForm.branch_name || null,
        account_name: bankForm.account_name,
        account_number: bankForm.account_number,
        account_type: bankForm.account_type,
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
      updateUser({
        first_name: account.first_name,
        last_name: account.last_name,
        name: `${account.first_name} ${account.last_name}`.trim(),
        phone: account.phone,
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
                Complete each section in order, then review and submit your registration.
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

      <div role="tablist" aria-label="Seller verification sections" className="flex wrap gap-2" style={{ marginBottom: 20 }}>
        {VERIFICATION_STEPS.map((step, index) => {
          const canOpen = index === 0
            || VERIFICATION_STEPS.slice(0, index).every((_, previousStep) => completedSteps.includes(previousStep))
          const isComplete = completedSteps.includes(index)
          return (
            <button
              key={step}
              type="button"
              id={`verification-tab-${index}`}
              role="tab"
              aria-selected={activeStep === index}
              aria-controls={`verification-panel-${index}`}
              disabled={!canOpen || Boolean(saving)}
              onClick={() => setActiveStep(index)}
              className={`btn btn-sm ${activeStep === index ? 'btn-primary' : 'btn-outline'}`}
              style={{ opacity: canOpen ? 1 : 0.55 }}
            >
              {isComplete ? <CheckCircle2 size={14} /> : <span>{index + 1}.</span>} {step}
            </button>
          )
        })}
      </div>

      {activeStep === 0 && <form id="verification-panel-0" role="tabpanel" aria-labelledby="verification-tab-0" className="card" onChange={() => invalidateFrom(0)} onSubmit={saveAccount} style={{ padding: 24, marginBottom: 20 }}>
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
          <Button type="submit" size="sm" disabled={Boolean(saving)}>
            {saving === 'account' ? <Spinner size={14} color="#fff" /> : <>Save &amp; Continue <ChevronRight size={14} /></>}
          </Button>
        </div>
      </form>}

      {/* Section 1: Business Information */}
      {activeStep === 1 && <div id="verification-panel-1" role="tabpanel" aria-labelledby="verification-tab-1">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
          <InfoCard icon={Hash} color="#2563eb" label="PAN / VAT" value={v.pan_vat} />
          <InfoCard icon={FileText} color="#f59e0b" label="Registration No." value={v.registration_number} />
          <InfoCard icon={Mail} color="#10b981" label="Business Email" value={v.business_email} />
          <InfoCard icon={Phone} color="#ef4444" label="Business Phone" value={v.business_phone} />
        </div>
      <form className="card" onChange={() => invalidateFrom(1)} onSubmit={saveBasic} style={{ padding: 24, marginBottom: 24 }}>
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
        </div>

        <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(0)} disabled={Boolean(saving)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <Button type="submit" size="sm" disabled={Boolean(saving)}>
            {saving === 'basic' ? <Spinner size={14} color="#fff" /> : <>Save &amp; Continue <ChevronRight size={14} /></>}
          </Button>
        </div>
      </form>
      </div>}

      {activeStep === 2 && <form id="verification-panel-2" role="tabpanel" aria-labelledby="verification-tab-2" className="card" onChange={() => invalidateFrom(2)} onSubmit={saveStore} style={{ padding: 24, marginBottom: 24 }}>
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
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(1)} disabled={Boolean(saving)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <Button type="submit" size="sm" disabled={Boolean(saving)}>
            {saving === 'store' ? <Spinner size={14} color="#fff" /> : <>Save &amp; Continue <ChevronRight size={14} /></>}
          </Button>
        </div>
      </form>}

      {activeStep === 3 && <form id="verification-panel-3" role="tabpanel" aria-labelledby="verification-tab-3" className="card" onChange={() => invalidateFrom(3)} onSubmit={saveBank} style={{ padding: 24, marginBottom: 24 }}>
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
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(2)} disabled={Boolean(saving)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <Button type="submit" size="sm" disabled={Boolean(saving)}>
            {saving === 'bank' ? <Spinner size={14} color="#fff" /> : <>Save &amp; Continue <ChevronRight size={14} /></>}
          </Button>
        </div>
      </form>}

      {/* Section 2: KYC & Owner Verification */}
      {activeStep === 4 && <form id="verification-panel-4" role="tabpanel" aria-labelledby="verification-tab-4" className="card" onChange={() => invalidateFrom(4)} onSubmit={continueKyc} style={{ padding: 24 }}>
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

        <Select
          label="Business Type *"
          required
          value={kyc.business_type}
          onChange={(e) => setKyc({ ...kyc, business_type: e.target.value })}
          hint="Choose the legal structure or activity that best describes your business."
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
              invalidateFrom(4)
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
                    {previews[doc.type] || documentPreviewUrls[doc.type] ? (
                      <img
                        src={previews[doc.type] || documentPreviewUrls[doc.type]}
                        alt={`${doc.label} preview`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
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

        <div className="flex justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(3)} disabled={Boolean(saving)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <Button type="submit" size="sm" disabled={Boolean(saving) || Boolean(uploading)}>
            <Check size={14} /> Continue to review <ChevronRight size={14} />
          </Button>
        </div>
      </form>}

      {activeStep === 5 && <form id="verification-panel-5" role="tabpanel" aria-labelledby="verification-tab-5" className="card" onSubmit={saveKyc} style={{ padding: 24 }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={20} color="var(--primary)" />
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Review Your Registration</h3>
        </div>
        <p className="muted text-sm" style={{ margin: '0 0 18px' }}>
          Check every section before submitting. Use the tabs above to make changes.
        </p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {[
            ['Account', `${account.first_name} ${account.last_name} · ${user?.email || ''} · ${account.phone}`],
            ['Business', `${basic.company_name} · ${kyc.business_type} · Tax ID ${basic.pan_vat} · Registration ${basic.registration_number || 'Not provided'}`],
            ['Business contact', `${basic.business_email} · ${basic.business_phone || 'No business phone'}`],
            ['Business location', [kyc.address, kyc.landmark, kyc.city, kyc.district, kyc.province].filter(Boolean).join(', ')],
            ['Store', `${storeForm.name} · ${storeForm.description}`],
            ['Store branding', `Logo: ${storeForm.logo ? 'Uploaded' : 'Missing'} · Cover: ${storeForm.banner ? 'Uploaded' : 'Missing'}`],
            ['Owner', `${kyc.owner_full_name} · ${kyc.owner_citizenship_number || 'No citizenship number'} · ${kyc.owner_email || ''} · ${kyc.owner_phone || ''}`],
            ['Payout bank', `${bankForm.bank_name} · ${bankForm.branch_name || 'No branch'} · ${bankForm.account_name} · ${bankForm.account_number} · ${bankForm.account_type}`],
          ].map(([label, value]) => (
            <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 12 }}>
              <div className="muted text-xs font-semibold uppercase" style={{ marginBottom: 4 }}>{label}</div>
              <div className="text-sm" style={{ color: 'var(--ink)', wordBreak: 'break-word' }}>{value || 'Not completed'}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <strong className="text-sm">Verification documents</strong>
          <div className="flex wrap gap-2" style={{ marginTop: 8 }}>
            {DOC_CARDS.map((document) => {
              const isUploaded = uploadedTypes.includes(document.type)
              return (
                <span key={document.type} className="chip chip-sm" style={{ color: isUploaded ? '#059669' : '#dc2626' }}>
                  {isUploaded ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {document.label}
                </span>
              )
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
            {DOC_CARDS.map((document) => {
              const uploadedDocument = docs.find((item) => item.document_type === document.type)
              const imageUrl = previews[document.type] || documentPreviewUrls[document.type]
              return (
                <div key={document.type} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10, background: '#fff' }}>
                  <div className="text-xs font-semibold" style={{ marginBottom: 8 }}>{document.label}</div>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${document.label} preview`}
                      style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}
                    />
                  ) : uploadedDocument ? (
                    <button
                      type="button"
                      onClick={() => downloadDocument(uploadedDocument)}
                      aria-label={`Download ${document.label}`}
                      style={{ width: '100%', height: 150, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)', color: 'var(--primary)', cursor: 'pointer' }}
                    >
                      <FileText size={32} />
                      <span className="muted text-xs" style={{ display: 'block', marginTop: 6 }}>
                        {uploadedDocument.mime_type === 'application/pdf' ? 'PDF document — click to download' : 'Preview loading — click to download'}
                      </span>
                    </button>
                  ) : (
                    <div className="muted text-xs" style={{ height: 150, display: 'grid', placeItems: 'center', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                      No document uploaded
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
          {[
            ['Store logo', storeForm.logo, 'contain'],
            ['Store cover image', storeForm.banner, 'cover'],
          ].map(([label, image, fit]) => (
            <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
              <div className="text-xs font-semibold" style={{ marginBottom: 8 }}>{label}</div>
              {image ? (
                <img
                  src={apiImage(image)}
                  alt={`${label} preview`}
                  style={{ width: '100%', height: 150, objectFit: fit, borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}
                />
              ) : (
                <div className="muted text-xs" style={{ height: 150, display: 'grid', placeItems: 'center', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                  No image uploaded
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-3" style={{ borderTop: '1px solid var(--border)', marginTop: 18 }}>
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveStep(4)} disabled={Boolean(saving)}>
            <ChevronLeft size={14} /> Back
          </Button>
          <Button type="submit" size="sm" disabled={Boolean(saving)}>
            {saving === 'kyc' ? <Spinner size={14} color="#fff" /> : <><ShieldCheck size={14} /> Submit Registration</>}
          </Button>
        </div>
      </form>}
    </div>
  )
}