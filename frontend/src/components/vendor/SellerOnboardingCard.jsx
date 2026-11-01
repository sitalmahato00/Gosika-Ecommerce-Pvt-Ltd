import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  CreditCard,
  ShieldCheck,
  Clock,
  ExternalLink,
  FileText,
} from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'
import Spinner from '../ui/Spinner'
import LocationMapPicker from '../common/LocationMapPicker'

export default function SellerOnboardingCard({ onboarding, onRefresh, user }) {
  const toast = useToast()

  // Steps state
  const isEmailVerified = onboarding?.email_verified || !!user?.email_verified_at
  const hasAddress = onboarding?.has_address
  const kycStatus = onboarding?.kyc_status || 'draft'
  const isKycApproved = onboarding?.is_kyc_approved || kycStatus === 'approved' || kycStatus === 'verified'
  const isKycSubmitted = kycStatus === 'submitted' || kycStatus === 'under_review'
  // Determine initial active step based on progress:
  // If email not verified -> 1
  // If address not filled -> 2
  // If KYC not approved -> 3
  const defaultStep = !isEmailVerified ? 1 : !hasAddress ? 2 : 3
  const [activeStep, setActiveStep] = useState(defaultStep)

  // Update active step if onboarding props change
  useEffect(() => {
    if (!isEmailVerified) setActiveStep(1)
    else if (!hasAddress) setActiveStep(2)
    else setActiveStep(3)
  }, [isEmailVerified, hasAddress, isKycApproved])

  // Email verification state
  const [emailCode, setEmailCode] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState(null)

  // Address state
  const [addressForm, setAddressForm] = useState({
    province: onboarding?.province || 'Bagmati Province',
    district: onboarding?.district || 'Kathmandu',
    municipality: onboarding?.municipality || 'Kathmandu',
    address: onboarding?.address || '',
    landmark: onboarding?.landmark || '',
    coordinates: onboarding?.latitude && onboarding?.longitude
      ? { lat: Number(onboarding.latitude), lng: Number(onboarding.longitude) }
      : null,
  })
  const [editingAddress, setEditingAddress] = useState(!hasAddress)
  const [savingAddress, setSavingAddress] = useState(false)

  useEffect(() => {
    if (hasAddress) {
      setEditingAddress(false)
      setAddressForm((prev) => ({
        ...prev,
        province: onboarding?.province || prev.province,
        district: onboarding?.district || prev.district,
        municipality: onboarding?.municipality || prev.municipality,
        address: onboarding?.address || prev.address,
        landmark: onboarding?.landmark || prev.landmark,
        coordinates: onboarding?.latitude && onboarding?.longitude
          ? { lat: Number(onboarding.latitude), lng: Number(onboarding.longitude) }
          : prev.coordinates,
      }))
    }
  }, [
    hasAddress,
    onboarding?.province,
    onboarding?.district,
    onboarding?.municipality,
    onboarding?.address,
    onboarding?.landmark,
    onboarding?.latitude,
    onboarding?.longitude,
  ])

  // Handle email verification send
  const handleSendEmailCode = async () => {
    setEmailError(null)
    setEmailSending(true)
    try {
      await api.post('/auth/email/resend', { email: user?.email })
      setEmailSent(true)
      toast.success(`Verification code sent to ${user?.email}. Valid for 60 seconds.`)
    } catch (err) {
      setEmailError(err.response?.data?.message || err.message || 'Failed to send code.')
    } finally {
      setEmailSending(false)
    }
  }

  // Handle email verification submit
  const handleVerifyEmail = async (e) => {
    e.preventDefault()
    setEmailError(null)
    if (!/^\d{6}$/.test(emailCode)) {
      setEmailError('Please enter the 6-digit code received on your email.')
      return
    }
    setEmailVerifying(true)
    try {
      await api.post('/auth/email/verify', { email: user?.email, code: emailCode })
      toast.success('Email verified successfully!')
      if (onRefresh) onRefresh()
      setActiveStep(2)
    } catch (err) {
      setEmailError(err.response?.data?.message || err.message || 'Invalid or expired code.')
    } finally {
      setEmailVerifying(false)
    }
  }

  // Handle saving address
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    if (!addressForm.address.trim() || !addressForm.province || !addressForm.district || !addressForm.municipality) {
      toast.error('Please enter your street or warehouse address.')
      return
    }
    setSavingAddress(true)
    try {
      await api.post('/vendor/kyc', {
        owner_full_name: user?.name || user?.first_name || 'Vendor Owner',
        address: addressForm.address.trim(),
        landmark: addressForm.landmark.trim() || null,
        province: addressForm.province,
        district: addressForm.district,
        municipality: addressForm.municipality,
        latitude: addressForm.coordinates?.lat?.toString(),
        longitude: addressForm.coordinates?.lng?.toString(),
      })
      toast.success('Business address saved!')
      if (onRefresh) await onRefresh()
      setEditingAddress(false)
      setActiveStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save address.')
    } finally {
      setSavingAddress(false)
    }
  }

  const steps = [
    { id: 1, name: 'Email', completed: isEmailVerified },
    { id: 2, name: 'Address', completed: hasAddress },
    { id: 3, name: 'Registration & KYC', completed: isKycApproved },
  ]

  return (
    <div
      className="seller-onboarding-card"
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
        border: '1px solid #EAECEF',
        background: '#FFFFFF',
        marginBottom: 20,
      }}
    >
      {/* ── Orange Header Strip with Stepper (Matches Daraz Seller Center) ── */}
      <div
        style={{
          background: '#FF5500',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, color: '#FFFFFF', fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>
            To Do
          </h2>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
            Complete these onboarding tasks to start selling
          </span>
        </div>

        {/* Stepper bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {steps.map((s, idx) => {
            const isActive = activeStep === s.id
            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <div
                    style={{
                      width: 28,
                      height: 2,
                      background: 'rgba(255,255,255,0.4)',
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setActiveStep(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 6px',
                    borderRadius: 8,
                    outline: 'none',
                  }}
                  title={`Go to ${s.name} step`}
                >
                  {/* Step circle */}
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      background: s.completed
                        ? '#FFFFFF'
                        : isActive
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.3)',
                      color: s.completed ? '#10B981' : isActive ? '#FF5500' : '#FFFFFF',
                      boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                    }}
                  >
                    {s.completed ? <Check size={14} strokeWidth={3} /> : s.id}
                  </span>
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: isActive ? 800 : s.completed ? 650 : 500,
                      opacity: isActive || s.completed ? 1 : 0.85,
                      textDecoration: isActive ? 'underline' : 'none',
                      textUnderlineOffset: 3,
                    }}
                  >
                    {s.name}
                  </span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* ── Active Step Card Body ────────────────────────────────────────── */}
      <div style={{ padding: '28px 32px' }}>
        {/* ── STEP 1: Email Verification ─────────────────────────────────── */}
        {activeStep === 1 && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: isEmailVerified ? '#E6F9F0' : '#FFF4ED',
                  color: isEmailVerified ? '#10B981' : '#FF5500',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Mail size={20} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: '#172033' }}>
                  {isEmailVerified ? 'Email Address Verified' : 'Verify Your Email Address'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                  {user?.email || 'Your account email address'}
                </p>
              </div>
            </div>

            {isEmailVerified ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  borderRadius: 10,
                  color: '#166534',
                  fontSize: 13,
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" />
                <span>Your email address is verified. You will receive real-time order and payout notifications.</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
                  A 6-digit verification code is required to confirm your email address. Click below to receive or enter the code.
                </p>

                {emailError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#FEF2F2',
                      border: '1px solid #FEE2E2',
                      borderRadius: 8,
                      color: '#DC2626',
                      fontSize: 13,
                      marginBottom: 14,
                    }}
                  >
                    {emailError}
                  </div>
                )}

                <form onSubmit={handleVerifyEmail} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                    style={{
                      height: 42,
                      width: 180,
                      padding: '0 14px',
                      fontSize: 14,
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={emailVerifying || !emailCode}
                    style={{
                      height: 42,
                      padding: '0 20px',
                      background: '#FF5500',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {emailVerifying ? <Spinner size={14} color="#fff" /> : <ShieldCheck size={15} />}
                    <span>Verify Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailCode}
                    disabled={emailSending}
                    style={{
                      height: 42,
                      padding: '0 16px',
                      background: '#F8FAFC',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {emailSending ? 'Sending…' : emailSent ? 'Resend Code' : 'Send Code'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Address Setup ───────────────────────────────────────── */}
        {activeStep === 2 && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: hasAddress ? '#E6F9F0' : '#FFF4ED',
                  color: hasAddress ? '#10B981' : '#FF5500',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <MapPin size={20} />
              </span>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 750, color: '#172033' }}>
                  {hasAddress ? 'Warehouse & Pickup Address Configured' : 'Add Warehouse & Pickup Address'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                  Couriers will collect packed parcels from this location
                </p>
              </div>
            </div>

            {hasAddress && !editingAddress ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>
                    {onboarding?.address || 'Pickup address saved'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Ready for courier dispatch across Nepal
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingAddress(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FF5500',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit Address
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <LocationMapPicker
                  title="Delivery & Map Pinpoint Location"
                  description="Pinpoint your warehouse or pickup point, then confirm the address details."
                  province={addressForm.province}
                  district={addressForm.district}
                  municipality={addressForm.municipality}
                  address={addressForm.address}
                  landmark={addressForm.landmark}
                  coordinates={addressForm.coordinates}
                  onChange={(location) => setAddressForm((prev) => ({
                    ...prev,
                    province: location.province,
                    district: location.district,
                    municipality: location.municipality,
                    address: location.street,
                    landmark: location.landmark,
                    coordinates: location.coordinates,
                  }))}
                />

                <div>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    style={{
                      height: 40,
                      padding: '0 24px',
                      background: '#FF5500',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {savingAddress ? <Spinner size={14} color="#fff" /> : <Check size={15} />}
                    <span>Save Address & Continue</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── STEP 3: ID Bank / KYC Verification (Matches Daraz Screenshot) ── */}
        {activeStep === 3 && (
          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
            {/* Corporate box container matching Daraz Image 2 */}
            <div
              style={{
                border: '1.5px solid #FFD9C2',
                borderRadius: 12,
                padding: '24px 20px',
                background: '#FFFDFB',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 16,
                  letterSpacing: '0.02em',
                }}
              >
                Corporate / Seller Verification
              </div>

              {/* Two illustrated badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: '#EFF6FF',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#2563EB',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.12)',
                    }}
                  >
                    <FileText size={28} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 650, color: '#334155' }}>Company Certificate</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: '50%',
                      background: '#EFF6FF',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#2563EB',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.12)',
                    }}
                  >
                    <CreditCard size={28} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 650, color: '#334155' }}>Bank Document</span>
                </div>
              </div>
            </div>

            {/* Heading and details */}
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#172033' }}>
              Add a Valid Government ID and Bank document
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748B' }}>
              Your valid government ID and Bank documents will be used to process your payments and verify your store.
            </p>

            {/* KYC Status conditional UI */}
            {isKycApproved ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 9999,
                  color: '#16A34A',
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={18} />
                <span>KYC & Bank Verified by Gosika Admin</span>
              </div>
            ) : isKycSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 20px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 9999,
                    color: '#D97706',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Clock size={16} />
                  <span>Under Review — Pending Admin Approval</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748B', maxWidth: 440, margin: 0 }}>
                  Your government ID and bank documents have been submitted and are being reviewed by the Gosika marketplace team.
                </p>
                <Link
                  to="/vendor/verification"
                  style={{
                    color: '#FF5500',
                    fontSize: 13,
                    fontWeight: 650,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <span>View Submitted Verification</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <p style={{ maxWidth: 420, margin: '0 0 12px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                  Complete your business, store branding, owner verification and payout bank details in the KYC form.
                </p>
                {/* Daraz-style callout tooltip bubble on the left */}
                <div
                  style={{
                    position: 'absolute',
                    right: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginRight: 16,
                    padding: '8px 14px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#334155',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Complete your seller registration and KYC to start selling.</span>
                  {/* Arrow pointer */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 0,
                      height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: '6px solid #FFFFFF',
                    }}
                  />
                </div>

                <Link
                  to="/vendor/verification"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 44,
                    padding: '0 44px',
                    background: '#FF5500',
                    color: '#FFFFFF',
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(255,85,0,0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Complete Registration &amp; KYC
                </Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
