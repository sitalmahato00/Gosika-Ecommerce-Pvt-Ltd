import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Store, CheckCircle2 } from 'lucide-react'
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
  const { user, booted } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState({ company_name: '', business_email: '', business_phone: '', pan_vat: '', registration_number: '', description: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})
    try {
      await api.post('/vendor/apply', form)
      toast.success('Application submitted! We will review it shortly.')
      setDone(true)
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setFieldErrors(d.errors)
      else toast.error(errorMessage(err))
    } finally {
      setLoading(false)
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

  if (!booted) return null

  if (!user) {
    return (
      <div className="page-shell container container-narrow">
        <div className="card text-center" style={{ padding: '32px 24px' }}>
          <h1 style={{ fontSize: 22 }}>Become a seller</h1>
          <p className="muted">Please create an account or login to apply as a vendor.</p>
          <div className="flex items-center justify-center gap-2 wrap">
            <Link to="/register" className="btn btn-primary">Create account</Link>
            <Link to="/login" state={{ from: '/vendor/register' }} className="btn btn-outline">Login</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell container container-narrow">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="text-center mb-2">
          <span className="avatar" style={{ width: 56, height: 56, marginBottom: 10 }}><Store size={26} /></span>
          <h1 style={{ fontSize: 22 }}>Apply to sell on Gosika</h1>
          <p className="muted text-sm m-0">Reach customers across all 7 provinces of Nepal.</p>
        </div>
        <form onSubmit={submit}>
          <Input label="Company / Business name" required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} error={fieldErrors.company_name?.[0]} />
          <div className="form-row">
            <Input label="Business email" type="email" required value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} error={fieldErrors.business_email?.[0]} />
            <Input label="Business phone" value={form.business_phone} onChange={(e) => setForm({ ...form, business_phone: e.target.value })} placeholder="98XXXXXXXX" />
          </div>
          <div className="form-row">
            <Input label="PAN / VAT number" value={form.pan_vat} onChange={(e) => setForm({ ...form, pan_vat: e.target.value })} />
            <Input label="Registration number" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
          </div>

          <div style={{ margin: '14px 0' }}>
            <LocationMapPicker
              compact
              title="Store / Workshop Location"
              description="Pinpoint your business location on the Nepal map."
              value={{
                province: form.province || 'Bagmati Province',
                district: form.district || 'Kathmandu',
                municipality: form.municipality || 'Kathmandu',
                street: form.address || '',
              }}
              onChange={(loc) => {
                setForm((prev) => ({
                  ...prev,
                  province: loc.province,
                  district: loc.district,
                  municipality: loc.municipality,
                  address: loc.street,
                }))
              }}
            />
          </div>

          <Textarea label="About your business" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What do you sell?" />
          <Button type="submit" block size="lg" disabled={loading}>
            {loading ? <Spinner size={16} color="#fff" /> : 'Submit application'}
          </Button>
          <p className="muted text-xs mt-2 text-center">
            By applying you agree to Gosika's seller terms. Standard commission applies per sale.
          </p>
        </form>
      </div>
    </div>
  )
}
