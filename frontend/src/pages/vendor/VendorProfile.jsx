import React, { useEffect, useState } from 'react'
import { Building2, ShieldCheck } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function VendorProfile() {
  const toast = useToast()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [basic, setBasic] = useState({ company_name: '', business_email: '', business_phone: '', pan_vat: '', registration_number: '', description: '' })
  const [kyc, setKyc] = useState({ owner_full_name: '', owner_citizenship_number: '', owner_email: '', owner_phone: '', business_type: '', address: '' })
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    api.get('/vendor/me').then((r) => {
      const v = r.data.data
      setVendor(v)
      setBasic({
        company_name: v.company_name || '',
        business_email: v.business_email || '',
        business_phone: v.business_phone || '',
        pan_vat: v.pan_vat || '',
        registration_number: v.registration_number || '',
        description: v.description || '',
      })
      const k = v.kyc || {}
      setKyc({
        owner_full_name: k.owner_full_name || '',
        owner_citizenship_number: k.owner_citizenship_number || '',
        owner_email: k.owner_email || '',
        owner_phone: k.owner_phone || '',
        business_type: k.business_type || '',
        address: k.address || '',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saveBasic = async (e) => {
    e.preventDefault()
    setSaving('basic')
    try {
      await api.put('/vendor/me', basic)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const saveKyc = async (e) => {
    e.preventDefault()
    setSaving('kyc')
    try {
      await api.post('/vendor/kyc', kyc)
      toast.success('KYC submitted for verification')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton height={60} />
        <Skeleton height={280} />
        <Skeleton height={280} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex items-center gap-3" style={{ padding: 18 }}>
        <span className="thumb" style={{ width: 52, height: 52 }}><Building2 size={24} /></span>
        <div className="flex-1">
          <div className="font-bold" style={{ fontSize: 18 }}>{vendor?.company_name}</div>
          <div className="muted text-sm">{vendor?.business_email} · {vendor?.business_phone}</div>
        </div>
        <StatusBadge status={vendor?.status?.value || vendor?.status} />
      </div>

      <form className="card" onSubmit={saveBasic}>
        <h3 style={{ fontSize: 16 }} className="mb-2">Business information</h3>
        <div className="form-row">
          <Input label="Company name" required value={basic.company_name} onChange={(e) => setBasic({ ...basic, company_name: e.target.value })} />
          <Input label="Business email" type="email" required value={basic.business_email} onChange={(e) => setBasic({ ...basic, business_email: e.target.value })} />
          <Input label="Business phone" required value={basic.business_phone} onChange={(e) => setBasic({ ...basic, business_phone: e.target.value })} />
          <Input label="PAN / VAT" value={basic.pan_vat} onChange={(e) => setBasic({ ...basic, pan_vat: e.target.value })} />
          <Input label="Registration number" value={basic.registration_number} onChange={(e) => setBasic({ ...basic, registration_number: e.target.value })} />
        </div>
        <Textarea label="About your business" rows={3} value={basic.description} onChange={(e) => setBasic({ ...basic, description: e.target.value })} />
        <Button type="submit" disabled={saving === 'basic'}>{saving === 'basic' ? <Spinner size={15} color="#fff" /> : 'Save profile'}</Button>
      </form>

      <form className="card" onSubmit={saveKyc}>
        <h3 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><ShieldCheck size={16} color="var(--primary)" /> KYC / owner verification</h3>
        <div className="form-row">
          <Input label="Owner full name" required value={kyc.owner_full_name} onChange={(e) => setKyc({ ...kyc, owner_full_name: e.target.value })} />
          <Input label="Citizenship number" required value={kyc.owner_citizenship_number} onChange={(e) => setKyc({ ...kyc, owner_citizenship_number: e.target.value })} />
          <Input label="Owner email" type="email" required value={kyc.owner_email} onChange={(e) => setKyc({ ...kyc, owner_email: e.target.value })} />
          <Input label="Owner phone" required value={kyc.owner_phone} onChange={(e) => setKyc({ ...kyc, owner_phone: e.target.value })} />
          <Input label="Business type" required value={kyc.business_type} onChange={(e) => setKyc({ ...kyc, business_type: e.target.value })} placeholder="e.g. Retail / Sole proprietorship" />
        </div>
        <Textarea label="Business address" required rows={2} value={kyc.address} onChange={(e) => setKyc({ ...kyc, address: e.target.value })} />
        <Button type="submit" disabled={saving === 'kyc'}>{saving === 'kyc' ? <Spinner size={15} color="#fff" /> : 'Submit KYC'}</Button>
      </form>
    </div>
  )
}
