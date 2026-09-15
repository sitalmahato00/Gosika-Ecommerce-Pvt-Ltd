import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store, ShieldCheck, MapPin, CheckCircle2,
  User, Building2, ClipboardCheck, Check, AlertCircle, Landmark,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const EMAIL_RE = /^\S+@\S+\.\S+$/

function validateAccount(acc) {
  const e = {}
  if (!acc.first_name.trim()) e.first_name = 'First name is required.'
  if (!acc.last_name.trim()) e.last_name = 'Last name is required.'
  if (!acc.email.trim()) e.email = 'Email is required.'
  else if (!EMAIL_RE.test(acc.email.trim())) e.email = 'Enter a valid email address.'
  if (!acc.password) e.password = 'Password is required.'
  else if (acc.password.length < 8) e.password = 'Password must be at least 8 characters.'
  if (acc.password !== acc.password_confirmation) e.password_confirmation = 'Passwords do not match.'
  return e
}

function validateBusiness(biz) {
  const e = {}
  if (!biz.company_name.trim()) e.company_name = 'Company / business name is required.'
  else if (biz.company_name.length > 180) e.company_name = 'Must be 180 characters or fewer.'
  if (!biz.business_email.trim()) e.business_email = 'Business email is required.'
  else if (!EMAIL_RE.test(biz.business_email.trim())) e.business_email = 'Enter a valid email address.'
  else if (biz.business_email.length > 255) e.business_email = 'Must be 255 characters or fewer.'
  if (biz.business_phone.trim() && biz.business_phone.length > 20) e.business_phone = 'Must be 20 characters or fewer.'
  if (biz.pan_vat.trim() && biz.pan_vat.length > 30) e.pan_vat = 'Must be 30 characters or fewer.'
  if (biz.registration_number.trim() && biz.registration_number.length > 60) e.registration_number = 'Must be 60 characters or fewer.'
  return e
}

function validateKyc(k) {
  const e = {}
  if (!k.owner_full_name.trim()) e.owner_full_name = 'Legal owner / proprietor full name is required.'
  else if (k.owner_full_name.length > 180) e.owner_full_name = 'Must be 180 characters or fewer.'
  if (k.owner_citizenship_number.trim() && k.owner_citizenship_number.length > 40) e.owner_citizenship_number = 'Must be 40 characters or fewer.'
  if (k.owner_email.trim() && !EMAIL_RE.test(k.owner_email.trim())) e.owner_email = 'Enter a valid email address.'
  if (k.owner_phone.trim() && k.owner_phone.length > 20) e.owner_phone = 'Must be 20 characters or fewer.'
  if (k.business_type.trim() && k.business_type.length > 60) e.business_type = 'Must be 60 characters or fewer.'
  if (k.address.trim() && k.address.length > 255) e.address = 'Must be 255 characters or fewer.'
  return e
}

function validateBank(b) {
  const e = {}
  if (!b.bank_name.trim()) e.bank_name = 'Bank name is required.'
  else if (b.bank_name.length > 120) e.bank_name = 'Must be 120 characters or fewer.'
  if (b.branch_name.trim() && b.branch_name.length > 120) e.branch_name = 'Must be 120 characters or fewer.'
  if (!b.account_name.trim()) e.account_name = 'Account holder name is required.'
  else if (b.account_name.length > 180) e.account_name = 'Must be 180 characters or fewer.'
  if (!b.account_number.trim()) e.account_number = 'Account number is required.'
  else if (!/^[0-9][0-9 -]*$/.test(b.account_number.trim())) e.account_number = 'Account number must be numeric.'
  else if (b.account_number.replace(/[^0-9]/g, '').length < 6) e.account_number = 'Account number must be at least 6 digits.'
  else if (b.account_number.length > 60) e.account_number = 'Must be 60 characters or fewer.'
  return e
}

const VALIDATORS = {
  account: validateAccount,
  business: validateBusiness,
  kyc: validateKyc,
  bank: validateBank,
}

export default function VendorRegister() {
  const { user, saveSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const steps = [
    ...(user ? [] : [{ id: 'account', label: 'Account', icon: User, blurb: 'Your login details' }]),
    { id: 'business', label: 'Business', icon: Building2, blurb: 'Vendors table details' },
    { id: 'kyc', label: 'Owner KYC', icon: ShieldCheck, blurb: 'Owner verification' },
    { id: 'bank', label: 'Bank Details', icon: Landmark, blurb: 'Settlement payouts' },
    { id: 'review', label: 'Review', icon: ClipboardCheck, blurb: 'Confirm & submit' },
  ]

  const [activeIndex, setActiveIndex] = useState(0)
  const [validated, setValidated] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [account, setAccount] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', password_confirmation: '',
  })
  const [business, setBusiness] = useState({
    company_name: '', business_email: '', business_phone: '', pan_vat: '', registration_number: '',
  })
  const [kyc, setKyc] = useState({
    owner_full_name: '', owner_citizenship_number: '', owner_email: '', owner_phone: '', business_type: '',
    address: '', province: '', district: '', municipality: '', latitude: '', longitude: '',
  })
  const [bank, setBank] = useState({
    bank_name: '', branch_name: '', account_name: '', account_number: '', account_type: 'savings',
  })

  const stepIndex = Math.min(activeIndex, steps.length - 1)
  const activeStep = steps[stepIndex]
  const hasAccountTab = steps.some((s) => s.id === 'account')

  const [pendingStepId, setPendingStepId] = useState(null)

  useEffect(() => {
    if (!pendingStepId) return
    const i = steps.findIndex((s) => s.id === pendingStepId)
    const current = activeIndex >= 0 && activeIndex < steps.length ? steps[activeIndex] : undefined
    if (!current || current.id !== pendingStepId) setActiveIndex(i === -1 ? 0 : i)
    setPendingStepId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingStepId])

  const setField = (group, key) => (e) => {
    const updater = { ...group, [key]: e.target.value }
    const setter = group === account ? setAccount : group === business ? setBusiness : group === bank ? setBank : setKyc
    setter(updater)
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validateStep = (stepId) => {
    const group = stepId === 'account' ? account : stepId === 'business' ? business : stepId === 'bank' ? bank : kyc
    const errors = VALIDATORS[stepId](group)
    const hasErrors = Object.keys(errors).length > 0
    setFieldErrors((prev) => {
      const clean = { ...prev }
      if (hasErrors) Object.assign(clean, errors)
      return clean
    })
    return { errors, hasErrors }
  }

  const stepStatus = (idx) => {
    const s = steps[idx]
    if (s.id === 'review') return null
    const group = s.id === 'account' ? account : s.id === 'business' ? business : s.id === 'bank' ? bank : kyc
    const hasErrors = Object.keys(VALIDATORS[s.id](group)).length > 0
    if (validated[s.id] && !hasErrors) return 'done'
    if (hasErrors) return 'error'
    return 'todo'
  }

  const goToStep = (idx) => {
    if (idx === stepIndex) return
    if (idx < stepIndex) {
      setFieldErrors({})
      setActiveIndex(idx)
      return
    }
    const { hasErrors } = validateStep(activeStep.id)
    if (hasErrors) {
      toast.error('Please fix the highlighted fields to continue.')
      return
    }
    setValidated((prev) => ({ ...prev, [activeStep.id]: true }))
    setActiveIndex(idx)
  }

  const continueStep = () => {
    const { hasErrors } = validateStep(activeStep.id)
    if (hasErrors) {
      toast.error('Please fix the highlighted fields to continue.')
      return
    }
    setValidated((prev) => ({ ...prev, [activeStep.id]: true }))
    setActiveIndex((i) => Math.min(i + 1, steps.length - 1))
  }

  const backStep = () => {
    setFieldErrors({})
    setActiveIndex((i) => Math.max(i - 1, 0))
  }

  const submit = async (e) => {
    e.preventDefault()
    const checks = steps
      .filter((s) => s.id !== 'review')
      .map((s) => ({ step: s, ...validateStep(s.id) }))
    const failed = checks.find((c) => c.hasErrors)
    if (failed) {
      setActiveIndex(steps.findIndex((s) => s.id === failed.step.id))
      toast.error('Please fix the highlighted fields to continue.')
      return
    }
    setSubmitting(true)
    setFieldErrors({})
    const FIELD_STEP = {
      first_name: 'account', last_name: 'account', email: 'account', phone: 'account',
      password: 'account', password_confirmation: 'account',
      company_name: 'business', business_email: 'business', business_phone: 'business',
      pan_vat: 'business', registration_number: 'business',
      owner_full_name: 'kyc', owner_citizenship_number: 'kyc', owner_email: 'kyc', owner_phone: 'kyc',
      business_type: 'kyc', address: 'kyc', province: 'kyc', district: 'kyc', municipality: 'kyc',
      bank_name: 'bank', branch_name: 'bank', account_name: 'bank', account_number: 'bank', account_type: 'bank',
    }
    let stage = 'account'
    try {
      if (!user) {
        await api.post('/auth/register', account)
        await api.post('/auth/login', { identifier: account.email, password: account.password })
          .then((loginRes) => {
            const { token, user: u } = loginRes.data.data
            saveSession(token, u)
          })
        stage = 'apply'
      }

      await api.post('/vendor/apply', {
        company_name: business.company_name.trim(),
        business_email: business.business_email.trim(),
        business_phone: business.business_phone.trim() || null,
        pan_vat: business.pan_vat.trim() || null,
        registration_number: business.registration_number.trim() || null,
      })
      stage = 'kyc'

      await api.post('/vendor/kyc', {
        owner_full_name: kyc.owner_full_name.trim(),
        owner_citizenship_number: kyc.owner_citizenship_number.trim() || null,
        owner_email: kyc.owner_email.trim() || null,
        owner_phone: kyc.owner_phone.trim() || null,
        business_type: kyc.business_type.trim() || null,
        address: kyc.address.trim() || null,
        province: kyc.province,
        district: kyc.district,
        municipality: kyc.municipality,
      })
      stage = 'bank'

      await api.post('/vendor/bank-accounts', {
        bank_name: bank.bank_name.trim(),
        branch_name: bank.branch_name.trim() || null,
        account_name: bank.account_name.trim(),
        account_number: bank.account_number.trim(),
        account_type: bank.account_type,
      })

      setDone(true)
      toast.success('Application submitted!')
    } catch (err) {
      const d = err.response?.data
      const errors = d?.errors
      if (errors && Object.keys(errors).length) {
        setFieldErrors(errors)
        const firstKey = Object.keys(errors)[0]
        const target = FIELD_STEP[firstKey] || (stage === 'apply' ? 'business' : stage)
        if (target) setPendingStepId(target)
        const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey]
        if (firstMsg) toast.error(String(firstMsg))
      } else {
        toast.error(errorMessage(err))
        if (stage === 'kyc' || stage === 'bank') setPendingStepId(stage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card text-center" style={{ padding: '40px 24px' }}>
          <span className="avatar" style={{ width: 72, height: 72, background: 'var(--success-bg)', color: 'var(--success)', marginBottom: 14 }}>
            <CheckCircle2 size={36} />
          </span>
          <h1 style={{ fontSize: 22 }}>Application submitted!</h1>
          <p className="muted" style={{ maxWidth: 460, margin: '0 auto 18px' }}>
            Thank you for choosing to sell on Gosika. Our team will review your application within 2 working days.
            You'll be able to access your vendor dashboard once approved.
          </p>
          <Button variant="primary" onClick={() => navigate('/vendor')}>Go to vendor dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="text-center mb-3">
        <span className="avatar" style={{ width: 56, height: 56, marginBottom: 10, marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={26} /></span>
        <h1 style={{ fontSize: 22, margin: 0 }}>Become a Seller on Gosika</h1>
        <p className="muted text-sm m-0">Reach customers across all 7 provinces of Nepal.</p>
      </div>

      {/* Step tabs */}
      <div className="card" style={{ padding: '20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {steps.map((s, idx) => {
            const status = stepStatus(idx)
            const isActive = idx === stepIndex
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goToStep(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 168,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid',
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isActive ? 'var(--primary)' : '#fff',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                  color: isActive ? '#fff' : 'var(--ink)',
                  boxShadow: isActive ? '0 6px 16px rgba(255,85,0,0.25)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 12,
                    fontWeight: 800,
                    background: isActive ? 'rgba(255,255,255,0.25)' : status === 'done' ? 'var(--success)' : status === 'error' ? '#ef4444' : '#f1f5f9',
                    color: isActive ? '#fff' : status === 'done' || status === 'error' ? '#fff' : '#64748b',
                  }}
                >
                  {status === 'done' ? <Check size={14} /> : status === 'error' ? <AlertCircle size={14} /> : idx + 1}
                </span>
                <span style={{ lineHeight: 1.15 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13 }}>{s.label}</span>
                  <span style={{ display: 'block', fontSize: 11, opacity: isActive ? 0.85 : 0.65 }}>{s.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <form className="card" onSubmit={submit} style={{ padding: '26px 24px' }}>
        {activeStep.icon && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <activeStep.icon size={18} color="var(--primary)" />
            <h2 style={{ fontSize: 16, margin: 0, fontWeight: 800 }}>{activeStep.label}</h2>
          </div>
        )}

        {/* ========== TAB: ACCOUNT ========== */}
        {activeStep.id === 'account' && (
          <>
            <div className="form-row">
              <Input
                label="First name" required maxLength={255}
                value={account.first_name} onChange={setField(account, 'first_name')}
                error={fieldErrors.first_name} placeholder="e.g. Suman"
              />
              <Input
                label="Last name" required maxLength={255}
                value={account.last_name} onChange={setField(account, 'last_name')}
                error={fieldErrors.last_name} placeholder="e.g. Pokhrel"
              />
            </div>
            <Input
              label="Email" type="email" required maxLength={255}
              value={account.email} onChange={setField(account, 'email')}
              error={fieldErrors.email} placeholder="you@example.com"
            />
            <div className="form-row">
              <Input
                label="Phone" maxLength={20}
                value={account.phone} onChange={setField(account, 'phone')}
                error={fieldErrors.phone} placeholder="98XXXXXXXX"
              />
              <Input
                label="Password" type="password" required maxLength={255}
                value={account.password} onChange={setField(account, 'password')}
                error={fieldErrors.password} placeholder="Min 8 characters"
              />
            </div>
            <Input
              label="Confirm password" type="password" required maxLength={255}
              value={account.password_confirmation} onChange={setField(account, 'password_confirmation')}
              error={fieldErrors.password_confirmation} placeholder="Repeat password"
            />
          </>
        )}

        {/* ========== TAB: BUSINESS ========== */}
        {activeStep.id === 'business' && (
          <>
            <p className="muted text-xs" style={{ marginTop: 0, marginBottom: 14 }}>
              These fields are saved to the <code>vendors</code> table and must match the stored column rules (max lengths, unique email).
            </p>
            <Input
              label="Company / business name" required maxLength={180}
              value={business.company_name} onChange={setField(business, 'company_name')}
              error={fieldErrors.company_name} placeholder="e.g. Himalayan Handicrafts Pvt. Ltd."
            />
            <div className="form-row">
              <Input
                label="Business email" type="email" required maxLength={255}
                value={business.business_email} onChange={setField(business, 'business_email')}
                error={fieldErrors.business_email} placeholder="hello@business.com.np"
              />
              <Input
                label="Business phone" maxLength={20}
                value={business.business_phone} onChange={setField(business, 'business_phone')}
                error={fieldErrors.business_phone} placeholder="98XXXXXXXX"
              />
            </div>
            <div className="form-row">
              <Input
                label="PAN / VAT number" maxLength={30}
                value={business.pan_vat} onChange={setField(business, 'pan_vat')}
                error={fieldErrors.pan_vat} placeholder="e.g. 609842103"
              />
              <Input
                label="Registration number" maxLength={60}
                value={business.registration_number} onChange={setField(business, 'registration_number')}
                error={fieldErrors.registration_number} placeholder="e.g. REG-2024-8841"
              />
            </div>
          </>
        )}

        {/* ========== TAB: OWNER KYC ========== */}
        {activeStep.id === 'kyc' && (
          <>
            <p className="muted text-xs" style={{ marginTop: 0, marginBottom: 14 }}>
              Required by the Government of Nepal for vendor registration.
            </p>
            <Input
              label="Legal owner / proprietor full name" required maxLength={180}
              value={kyc.owner_full_name} onChange={setField(kyc, 'owner_full_name')}
              error={fieldErrors.owner_full_name} placeholder="e.g. Suman Pokhrel"
            />
            <div className="form-row">
              <Input
                label="Citizenship certificate number" maxLength={40}
                value={kyc.owner_citizenship_number} onChange={setField(kyc, 'owner_citizenship_number')}
                error={fieldErrors.owner_citizenship_number} placeholder="e.g. 12-01-76-04891"
              />
              <Input
                label="Business entity type" maxLength={60}
                value={kyc.business_type} onChange={setField(kyc, 'business_type')}
                error={fieldErrors.business_type} placeholder="e.g. Pvt. Ltd., Proprietorship"
              />
            </div>
            <div className="form-row">
              <Input
                label="Owner email" type="email" maxLength={255}
                value={kyc.owner_email} onChange={setField(kyc, 'owner_email')}
                error={fieldErrors.owner_email} placeholder="owner@example.com"
              />
              <Input
                label="Owner phone / WhatsApp" maxLength={20}
                value={kyc.owner_phone} onChange={setField(kyc, 'owner_phone')}
                error={fieldErrors.owner_phone} placeholder="+977 98XXXXXXXX"
              />
            </div>

            <div style={{ margin: '16px 0' }}>
              <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <MapPin size={14} color="var(--primary)" /> Business Location (Nepal Map)
              </label>
              <LocationMapPicker
                compact
                title="Store / Workshop Location"
                description="Pinpoint your business location on the Nepal map."
                value={{
                  province: kyc.province || 'Bagmati Province',
                  district: kyc.district || 'Kathmandu',
                  municipality: kyc.municipality || 'Kathmandu',
                  street: kyc.address || '',
                  latitude: kyc.latitude,
                  longitude: kyc.longitude,
                }}
                onChange={(loc) => {
                  setKyc((prev) => ({
                    ...prev,
                    province: loc.province,
                    district: loc.district,
                    municipality: loc.municipality,
                    address: loc.street,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  }))
                }}
              />
            </div>

            <Textarea
              label="About your business" rows={3}
              value={kyc.address} onChange={(e) => { setKyc({ ...kyc, address: e.target.value }); if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: undefined })) }}
              error={fieldErrors.address}
              placeholder="What do you sell? Where are you based?"
            />
          </>
        )}

        {/* ========== TAB: BANK DETAILS ========== */}
        {activeStep.id === 'bank' && (
          <>
            <p className="muted text-xs" style={{ marginTop: 0, marginBottom: 14 }}>
              Your payouts and settlements will be made to this account.
            </p>
            <Input
              label="Bank name" required maxLength={120}
              value={bank.bank_name} onChange={setField(bank, 'bank_name')}
              error={fieldErrors.bank_name} placeholder="e.g. Nabil Bank, NIC Asia Bank"
            />
            <div className="form-row">
              <Input
                label="Branch name" maxLength={120}
                value={bank.branch_name} onChange={setField(bank, 'branch_name')}
                error={fieldErrors.branch_name} placeholder="e.g. New Road, Kathmandu"
              />
              <div>
                <label className="label">Account type</label>
                <select
                  className="input"
                  value={bank.account_type}
                  onChange={(e) => setBank({ ...bank, account_type: e.target.value })}
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.account_type && <span className="field-error" style={{ color: 'var(--danger)' }}>{fieldErrors.account_type}</span>}
              </div>
            </div>
            <Input
              label="Account holder name" required maxLength={180}
              value={bank.account_name} onChange={setField(bank, 'account_name')}
              error={fieldErrors.account_name} placeholder="Exactly as it appears on the bank record"
            />
            <Input
              label="Account number" required maxLength={60}
              value={bank.account_number} onChange={setField(bank, 'account_number')}
              error={fieldErrors.account_number} placeholder="Digits only"
            />
          </>
        )}

        {/* ========== TAB: REVIEW ========== */}
        {activeStep.id === 'review' && (
          <>
            <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Information</h3>
              {[
                ['Company / business name', business.company_name],
                ['Business email', business.business_email],
                ['Business phone', business.business_phone],
                ['PAN / VAT number', business.pan_vat],
                ['Registration number', business.registration_number],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span className="muted">{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border)', marginTop: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Verification</h3>
              {[
                ['Owner full name', kyc.owner_full_name],
                ['Citizenship number', kyc.owner_citizenship_number],
                ['Owner email', kyc.owner_email],
                ['Owner phone', kyc.owner_phone],
                ['Business entity type', kyc.business_type],
                ['Location', [kyc.municipality, kyc.district, kyc.province].filter(Boolean).join(', ')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span className="muted">{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '18px 20px', border: '1px solid var(--border)', marginTop: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Details</h3>
              {[
                ['Bank name', bank.bank_name],
                ['Branch name', bank.branch_name],
                ['Account holder name', bank.account_name],
                ['Account number', bank.account_number],
                ['Account type', bank.account_type ? bank.account_type.charAt(0).toUpperCase() + bank.account_type.slice(1) : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span className="muted">{label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            <p className="muted text-xs mt-2">
              By submitting, your details are validated against the stored rules — no field may exceed its column length or violate the unique email constraint.
            </p>
          </>
        )}

        {/* ========== NAV FOOTER ========== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 24, paddingTop: 18, borderTop: '2px solid var(--border)' }}>
          <Button variant="outline" type="button" onClick={backStep} disabled={stepIndex === 0 || submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ChevronLeft size={16} /> Back
          </Button>

          {stepIndex < steps.length - 1 ? (
            <Button variant="primary" type="button" onClick={continueStep} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Continue <ChevronRight size={16} />
            </Button>
          ) : (
            <Button variant="primary" type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {submitting ? <Spinner size={16} color="#fff" /> : <><CheckCircle2 size={16} /> Submit application</>}
            </Button>
          )}
        </div>

        {!hasAccountTab && (
          <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login" state={{ from: '/vendor/register' }} className="text-primary font-semibold">Login</Link>
          </p>
        )}
      </form>
    </div>
  )
}