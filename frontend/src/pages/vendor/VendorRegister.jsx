import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function VendorRegister() {
  const { user, saveSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState('form')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const [account, setAccount] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', password_confirmation: '',
  })
  const [business, setBusiness] = useState({
    company_name: '', business_email: '', business_phone: '', pan_vat: '', registration_number: '',
  })
  const [kyc, setKyc] = useState({
    owner_full_name: '', owner_citizenship_number: '', owner_email: '', owner_phone: '', business_type: '',
    address: '', province: '', district: '', municipality: '', description: '',
  })

  const setAcc = (k) => (e) => setAccount({ ...account, [k]: e.target.value })
  const setBiz = (k) => (e) => setBusiness({ ...business, [k]: e.target.value })
  const setKycF = (k) => (e) => setKyc({ ...kyc, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    try {
      if (!user) {
        await api.post('/auth/register', account)
        const loginRes = await api.post('/auth/login', { identifier: account.email, password: account.password })
        const { token, user: u } = loginRes.data.data
        saveSession(token, u)
      }

      setStep('applying')
      await api.post('/vendor/apply', {
        company_name: business.company_name,
        business_email: business.business_email || (user ? '' : account.email),
        business_phone: business.business_phone,
        pan_vat: business.pan_vat,
        registration_number: business.registration_number,
      })

      setStep('kyc')
      await api.post('/vendor/kyc', {
        owner_full_name: kyc.owner_full_name,
        owner_citizenship_number: kyc.owner_citizenship_number,
        owner_email: kyc.owner_email || (user ? '' : account.email),
        owner_phone: kyc.owner_phone || (user ? '' : account.phone),
        business_type: kyc.business_type,
        address: kyc.address,
      })

      setStep('done')
      toast.success('Application submitted!')
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setFieldErrors(d.errors)
      else toast.error(errorMessage(err))
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
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
      <div className="card" style={{ maxWidth: 560, margin: '0 auto', padding: '28px 24px' }}>
        <div className="text-center mb-2">
          <span className="avatar" style={{ width: 56, height: 56, marginBottom: 10 }}><Store size={26} /></span>
          <h1 style={{ fontSize: 22 }}>Become a Seller on Gosika</h1>
          <p className="muted text-sm m-0">Reach customers across all 7 provinces of Nepal.</p>
        </div>

        {step === 'applying' && <div className="alert alert-info">Submitting vendor application...</div>}
        {step === 'kyc' && <div className="alert alert-info">Submitting KYC information...</div>}

        <form onSubmit={submit}>
          {!user && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                Account Details
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">First name *</label>
                  <input className="input" required value={account.first_name} onChange={setAcc('first_name')} />
                  {fieldErrors.first_name && <div className="field-error">{fieldErrors.first_name[0]}</div>}
                </div>
                <div className="form-group">
                  <label className="label">Last name *</label>
                  <input className="input" required value={account.last_name} onChange={setAcc('last_name')} />
                </div>
              </div>
              <Input label="Email *" type="email" required value={account.email} onChange={setAcc('email')} placeholder="you@example.com" error={fieldErrors.email?.[0]} />
              <Input label="Phone (optional)" value={account.phone} onChange={setAcc('phone')} placeholder="98XXXXXXXX" />
              <Input label="Password *" type="password" required value={account.password} onChange={setAcc('password')} placeholder="Min 8 characters" error={fieldErrors.password?.[0]} />
              <Input label="Confirm password *" type="password" required value={account.password_confirmation} onChange={setAcc('password_confirmation')} />
              <div style={{ borderTop: '2px solid var(--border)', margin: '20px 0', paddingTop: 20 }} />
            </>
          )}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={15} color="var(--primary)" /> Business Information
          </h3>
          <Input label="Company / Business name *" required value={business.company_name} onChange={setBiz('company_name')} error={fieldErrors.company_name?.[0]} placeholder="e.g. Himalayan Handicrafts Pvt. Ltd." />
          <div className="form-row">
            <Input label="Business email *" type="email" required value={business.business_email} onChange={setBiz('business_email')} error={fieldErrors.business_email?.[0]} placeholder="hello@business.com.np" />
            <Input label="Business phone" value={business.business_phone} onChange={setBiz('business_phone')} placeholder="98XXXXXXXX" />
          </div>
          <div className="form-row">
            <Input label="PAN / VAT number *" required value={business.pan_vat} onChange={setBiz('pan_vat')} placeholder="e.g. 609842103" />
            <Input label="Registration number" value={business.registration_number} onChange={setBiz('registration_number')} placeholder="e.g. REG-2024-8841" />
          </div>

          <div style={{ borderTop: '2px solid var(--border)', margin: '20px 0', paddingTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="var(--primary)" /> KYC & Owner Verification
            </h3>
            <p className="muted text-xs" style={{ marginBottom: 12 }}>Required by the Government of Nepal for vendor registration.</p>

            <Input label="Legal Owner / Proprietor Full Name *" required value={kyc.owner_full_name} onChange={setKycF('owner_full_name')} placeholder="e.g. Suman Pokhrel" />
            <div className="form-row">
              <Input label="Citizenship Certificate Number *" required value={kyc.owner_citizenship_number} onChange={setKycF('owner_citizenship_number')} placeholder="e.g. 12-01-76-04891 (Morang)" />
              <Input label="Business Entity Type *" required value={kyc.business_type} onChange={setKycF('business_type')} error={fieldErrors.business_type?.[0]} />
            </div>
            <div className="form-row">
              <Input label="Owner Email *" type="email" required value={kyc.owner_email} onChange={setKycF('owner_email')} placeholder="owner@example.com" />
              <Input label="Owner Phone / WhatsApp *" required value={kyc.owner_phone} onChange={setKycF('owner_phone')} placeholder="+977 98XXXXXXXX" />
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
                  municipality: kyc.municipality || kyc.city || 'Kathmandu',
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
                    city: loc.municipality,
                    address: loc.street,
                    landmark: loc.landmark,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  }))
                }}
              />
            </div>

            <Textarea label="About your business" rows={3} value={kyc.description} onChange={(e) => setKyc({ ...kyc, description: e.target.value })} placeholder="What do you sell? Where are you based?" />
          </div>

          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Create account & apply as seller'}
          </Button>
          <p className="muted text-xs mt-2 text-center">
            By applying you agree to Gosika's seller terms. Standard commission applies per sale.
          </p>
        </form>

        <p className="muted text-sm mt-2" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login" state={{ from: '/vendor/register' }} className="text-primary font-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}
