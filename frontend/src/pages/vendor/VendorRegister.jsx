import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Store,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import api from '../../api/client'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const EMAIL_RE = /^\S+@\S+\.\S+$/
const PHONE_RE = /^[0-9+ -]{7,20}$/

export default function VendorRegister({ hideHeader = false, embedded = false }) {
  const { user, saveSession } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company_name: '',
    password: '',
    password_confirmation: '',
    agreed: true,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)

  const validate = () => {
    const errs = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required.'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
    
    if (!form.email.trim()) errs.email = 'Email address is required.'
    else if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.'

    if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) errs.phone = 'Enter a valid phone number.'

    if (!form.company_name.trim()) errs.company_name = 'Shop / business name is required.'
    else if (form.company_name.length > 180) errs.company_name = 'Must be 180 characters or fewer.'

    if (!user) {
      if (!form.password) errs.password = 'Password is required.'
      else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
      
      if (form.password !== form.password_confirmation) {
        errs.password_confirmation = 'Passwords do not match.'
      }
    }

    if (!form.agreed) {
      errs.agreed = 'You must agree to the Seller Terms of Service.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError(null)

    if (!validate()) {
      toast.error('Please complete all required fields.')
      return
    }

    setSubmitting(true)

    try {
      let activeUser = user
      let activeToken = localStorage.getItem('gosika_token')

      // 1. Create account if not already logged in
      if (!activeUser) {
        const registerPayload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
        }

        await api.post('/auth/register', registerPayload)

        // Login to get token & session
        const loginRes = await api.post('/auth/login', {
          identifier: form.email.trim().toLowerCase(),
          password: form.password,
          device_name: 'web-seller',
        })

        const { token, user: u } = loginRes.data.data
        activeToken = token
        activeUser = u
        saveSession(token, u)
      }

      // 2. Initialize vendor record with shop name and business contact
      try {
        await api.post(
          '/vendor/apply',
          {
            company_name: form.company_name.trim(),
            business_email: form.email.trim().toLowerCase(),
            business_phone: form.phone.trim(),
          },
          {
            headers: { Authorization: `Bearer ${activeToken}` },
          }
        )
      } catch (applyErr) {
        // If vendor already applied or created, proceed
        console.warn('Vendor apply warning:', applyErr.response?.data?.message)
      }

      toast.success(`Welcome to GOSIKA, ${form.first_name || 'Seller'}! Your seller account is ready.`)

      // Redirect directly to seller dashboard
      window.location.href = '/vendor'
    } catch (err) {
      console.error('Seller registration failed:', err)
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your inputs.'
      setGeneralError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="card"
      style={{
        maxWidth: embedded ? 'none' : 620,
        margin: embedded ? '22px 0 0' : '0 auto',
        padding: embedded ? 0 : '36px 38px',
        background: embedded ? 'transparent' : '#FFFFFF',
        borderRadius: embedded ? 0 : 18,
        border: embedded ? 0 : '1px solid #EAECEF',
        boxShadow: embedded ? 'none' : '0 16px 45px rgba(23, 32, 51, 0.08)',
      }}
    >
      {!hideHeader && (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#172033', margin: '0 0 6px' }}>
            Create your Seller Account
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Enter your basic details to start selling on GOSIKA marketplace
          </p>
        </div>
      )}

      {generalError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '12px 14px',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: 10,
            color: '#DC2626',
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Row 1: First Name & Last Name */}
        <div className="vendor-register__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              First Name *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
              <input
                type="text"
                required
                placeholder="e.g. Suman"
                value={form.first_name}
                onChange={(e) => {
                  setForm({ ...form, first_name: e.target.value })
                  if (errors.first_name) setErrors({ ...errors, first_name: null })
                }}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px 0 38px',
                  border: errors.first_name ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            {errors.first_name && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.first_name}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Last Name *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
              <input
                type="text"
                required
                placeholder="e.g. Pokhrel"
                value={form.last_name}
                onChange={(e) => {
                  setForm({ ...form, last_name: e.target.value })
                  if (errors.last_name) setErrors({ ...errors, last_name: null })
                }}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px 0 38px',
                  border: errors.last_name ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            {errors.last_name && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.last_name}</p>}
          </div>
        </div>

        {/* Row 2: Email Address */}
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
            Email Address *
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
            <input
              type="email"
              required
              placeholder="e.g. seller@store.com"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value })
                if (errors.email) setErrors({ ...errors, email: null })
              }}
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px 0 38px',
                border: errors.email ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                borderRadius: 10,
                fontSize: 14,
                outline: 'none',
              }}
              autoComplete="email"
            />
          </div>
          {errors.email && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.email}</p>}
        </div>

        {/* Row 3: Phone Number & Shop Name */}
        <div className="vendor-register__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Mobile Phone *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
              <input
                type="tel"
                required
                placeholder="98XXXXXXXX"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value })
                  if (errors.phone) setErrors({ ...errors, phone: null })
                }}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px 0 38px',
                  border: errors.phone ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            {errors.phone && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.phone}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Shop / Business Name *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Store size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
              <input
                type="text"
                required
                placeholder="e.g. Kathmandu Crafts"
                value={form.company_name}
                onChange={(e) => {
                  setForm({ ...form, company_name: e.target.value })
                  if (errors.company_name) setErrors({ ...errors, company_name: null })
                }}
                style={{
                  width: '100%',
                  height: 44,
                  padding: '0 14px 0 38px',
                  border: errors.company_name ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
            {errors.company_name && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.company_name}</p>}
          </div>
        </div>

        {/* Row 4: Password & Confirm Password (if not logged in) */}
        {!user && (
          <div className="vendor-register__row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Password *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: null })
                  }}
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 40px 0 38px',
                    border: errors.password ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.password}</p>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, color: '#94A3B8' }} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={form.password_confirmation}
                  onChange={(e) => {
                    setForm({ ...form, password_confirmation: e.target.value })
                    if (errors.password_confirmation) setErrors({ ...errors, password_confirmation: null })
                  }}
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 40px 0 38px',
                    border: errors.password_confirmation ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: 10,
                    fontSize: 14,
                    outline: 'none',
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.password_confirmation}</p>
              )}
            </div>
          </div>
        )}

        {/* Row 5: Agreement checkbox */}
        <div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={form.agreed}
              onChange={(e) => setForm({ ...form, agreed: e.target.checked })}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#FF5500', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5 }}>
              I agree to the <Link to="/help" style={{ color: '#FF5500', fontWeight: 600 }}>GOSIKA Seller Terms of Service</Link> and{' '}
              <Link to="/help" style={{ color: '#FF5500', fontWeight: 600 }}>Privacy Policy</Link>.
            </span>
          </label>
          {errors.agreed && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.agreed}</p>}
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            height: 48,
            width: '100%',
            background: '#FF5500',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(255, 85, 0, 0.28)',
            marginTop: 6,
          }}
        >
          {submitting ? (
            <>
              <Spinner size={16} color="#ffffff" />
              <span>Creating your seller account…</span>
            </>
          ) : (
            <>
              <span>Create Seller Account</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>

        {/* Footer Link */}
        <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          Already have a seller account?{' '}
          <Link to="/seller/login" style={{ color: '#FF5500', fontWeight: 700, textDecoration: 'none' }}>
            Login as Seller
          </Link>
        </p>
      </form>
    </div>
  )
}
