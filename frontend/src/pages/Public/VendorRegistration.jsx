import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, Store, CheckCircle2, XCircle, Calendar, Upload, Folder, Heart, MapPin, Mail, Phone } from 'lucide-react'
import api from '../../api/client'
import { useToast } from '../../context/ToastContext'

function Step1() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const next = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/apply', { name, email, phone })
      toast.success('Step 1 submitted. Continuing…')
    } catch (e) {
      toast.error('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Step 1: Personal Details</h3>
      <form onSubmit={next}>
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required className="w-full rounded-sm border p-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@domain.com" required className="w-full rounded-sm border p-3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-98XXXXXXXX" required className="w-full rounded-sm border p-3" />
          </div>
        </div>
        <button type="submit" className="w-full btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Submitting…' : 'Next: Business Details'}
        </button>
      </form>
    </div>
  )
}

function Step2() {
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('Retail')
  const [taxId, setTaxId] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const next = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/documents', { business_name: businessName, business_type: businessType, tax_id: taxId })
      toast.success('Step 2 submitted. Continuing…')
    } catch (e) {
      toast.error('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Step 2: Business Details</h3>
      <form onSubmit={next}>
        <div>
          <label className="block text-sm font-medium mb-2">Business Name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" required className="w-full rounded-sm border p-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Business Type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-sm border p-3"
            >
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Service">Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tax ID / VAT</label>
            <input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="123456789" required className="w-full rounded-sm border p-3" />
          </div>
        </div>
        <button type="submit" className="w-full btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Submitting…' : 'Next: Store Information'}
        </button>
      </form>
    </div>
  )
}

function Step3() {
  const [storeName, setStoreName] = useState('')
  const [storeDescription, setStoreDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const next = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/stores', { name: storeName, description: storeDescription })
      toast.success('Step 3 submitted. Continuing…')
    } catch (e) {
      toast.error('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Step 3: Store Information</h3>
      <form onSubmit={next}>
        <div>
          <label className="block text-sm font-medium mb-2">Store Name</label>
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Gosika Organic Farms" required className="w-full rounded-sm border p-3" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Store Description</label>
          <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} placeholder="What do you sell? How many years in business?" rows={4} required className="w-full rounded-sm border p-3" />
        </div>
        <button type="submit" className="w-full btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Submitting…' : 'Next: Store Branding'}
        </button>
      </form>
    </div>
  )
}

function Step4() {
  const [storeLogo, setStoreLogo] = useState('')
  const [storeCover, setStoreCover] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const next = async () => {
    setLoading(true)
    try {
      toast.success('Step 4 submitted. Store branding submitted.')
      setTimeout(() => navigate('/vendor'), 1500)
    } catch (e) {
      toast.error('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file, setter) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setter(e.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="p-6">
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Step 4: Store Branding</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Upload your store logo and cover image files.</p>
      <form onSubmit={next}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Store Logo</label>
            {storeLogo && (
              <div style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', marginBottom: 8, border: '1px solid var(--border)' }}>
                <img src={storeLogo} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0], setStoreLogo)}
              className="w-full rounded-sm border p-2 cursor-pointer"
              style={{ border: '2px dashed var(--border)' }}
            />
            <span className="text-xs text-muted mt-1 block">PNG or JPG logo file</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Store Cover Banner</label>
            {storeCover && (
              <div style={{ height: 64, borderRadius: 8, overflow: 'hidden', marginBottom: 8, border: '1px solid var(--border)' }}>
                <img src={storeCover} alt="Cover preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0], setStoreCover)}
              className="w-full rounded-sm border p-2 cursor-pointer"
              style={{ border: '2px dashed var(--border)' }}
            />
            <span className="text-xs text-muted mt-1 block">Wide store banner photo</span>
          </div>
        </div>
        <button type="submit" className="w-full btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Submitting…' : 'Next: Payout Details'}
        </button>
      </form>
    </div>
  )
}

function Step5() {
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const next = async () => {
    setLoading(true)
    try {
      await api.post('/vendor/bank-accounts', { bank_name: bankName, account_number: accountNumber, account_holder: accountHolder })
      toast.success('Step 5 submitted. Continuing…')
    } catch (e) {
      toast.error('Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>Step 5: Payout Details</h3>
      <form onSubmit={next}>
        <div>
          <label className="block text-sm font-medium mb-2">Bank Name</label>
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nabil Bank" required className="w-full rounded-sm border p-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Account Number</label>
            <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="123456789012" required className="w-full rounded-sm border p-3" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Account Holder</label>
            <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="John Doe" required className="w-full rounded-sm border p-3" />
          </div>
        </div>
        <button type="submit" className="w-full btn btn-primary mt-4" disabled={loading}>
          {loading ? 'Submitting…' : 'Next: Review & Submit'}
        </button>
      </form>
    </div>
  )
}

function Step6() {
  return (
    <div className="p-6 text-center">
      <h3 style={{ fontSize: 24, marginBottom: 12 }}>Step 6: Review & Submit</h3>
      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Your vendor application has been submitted successfully.
      </p>
      <p style={{ fontSize: 16 }}>"Your vendor application is under review."</p>
      <p style={{ fontSize: 14, marginTop: 20, color: 'var(--muted)' }}>
        Our team will review your application within 2 working days.
      </p>
      <div className="mt-6">
        <a href="/vendor" className="btn btn-primary">Go to Vendor Dashboard</a>
        <a href="/login" className="btn btn-outline ml-2">Login</a>
      </div>
    </div>
  )
}

export default function VendorRegistration() {
  const navigate = useNavigate()
  const steps = [
    <Step1 key="1" next={next} />,
    <Step2 key="2" next={next} />,
    <Step3 key="3" next={next} />,
    <Step4 key="4" next={next} />,
    <Step5 key="5" next={next} />,
    <Step6 key="6" />,
  ]

  return <div className="p-6">{steps}</div>