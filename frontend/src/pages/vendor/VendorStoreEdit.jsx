import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Store, Upload, Image as ImageIcon, ArrowLeft, Eye, Send, Mail, Phone
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function VendorStoreEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [storeId, setStoreId] = useState(id || null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    banner: '',
    logo: '',
    contact_email: '',
    contact_phone: '',
  })

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/vendor/stores')
      .then((r) => {
        const list = r.data.data || []
        const s = id ? list.find((item) => String(item.id) === String(id)) : list[0]
        if (s) {
          setStoreId(s.id)
          setForm({
            name: s.name || '',
            slug: s.slug || '',
            description: s.description || '',
            banner: s.banner || '',
            logo: s.logo || '',
            contact_email: s.contact_email || '',
            contact_phone: s.contact_phone || '',
          })
        } else {
          setStoreId(null)
        }
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    const fd = new FormData()
    fd.append('image', file)
    fd.append('folder', 'stores')
    setUploadingLogo(true)
    try {
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url || res.data?.url
      setForm((prev) => ({ ...prev, logo: url }))
      toast.success('Logo uploaded!')
    } catch {
      const reader = new FileReader()
      reader.onload = (evt) => setForm((prev) => ({ ...prev, logo: evt.target.result }))
      reader.readAsDataURL(file)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    const fd = new FormData()
    fd.append('image', file)
    fd.append('folder', 'stores')
    setUploadingBanner(true)
    try {
      const res = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data?.data?.url || res.data?.url
      setForm((prev) => ({ ...prev, banner: url }))
      toast.success('Banner uploaded!')
    } catch {
      const reader = new FileReader()
      reader.onload = (evt) => setForm((prev) => ({ ...prev, banner: evt.target.result }))
      reader.readAsDataURL(file)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        logo: form.logo || undefined,
        banner: form.banner || undefined,
      }
      if (storeId) {
        await api.put(`/vendor/stores/${storeId}`, payload)
      } else {
        await api.post('/vendor/stores', payload)
      }
      toast.success('Store details saved successfully!')
      navigate('/vendor/stores')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const submitForApproval = async () => {
    if (!storeId) return
    setSubmitting(true)
    try {
      await api.post(`/vendor/stores/${storeId}/submit`)
      toast.success('Store submitted for approval')
      navigate('/vendor/stores')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 40 }}>
        <Skeleton height={48} width={180} />
        <Skeleton height={120} />
        <Skeleton height={220} />
        <Skeleton height={160} />
      </div>
    )
  }

  if (error) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Link to="/vendor/stores" className="btn btn-outline btn-sm flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Store Profile
        </Link>

        {storeId && (
          <a href={`/store/${storeId}`} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm flex items-center gap-1">
            <Eye size={14} /> View Public Storefront
          </a>
        )}
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{storeId ? 'Edit Store Details & Branding' : 'Create Store'}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Set up your storefront identity, contact details and description.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Visual Branding Section: Banner & Logo Upload Inputs */}
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <ImageIcon size={18} color="var(--primary)" /> Store Visual Identity & Image Uploads
            </h3>
            <p className="muted text-xs m-0 mt-1">Upload real image files from your computer for your store banner and logo.</p>
          </div>

          <div style={{ padding: 20 }}>
            {/* 1. Cover Banner Input */}
            <div className="form-group mb-4">
              <label className="label font-bold text-sm">Store Cover Banner Image</label>

              {/* Live Banner Preview Box */}
              <div
                style={{
                  height: 180,
                  borderRadius: 'var(--radius)',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'var(--navy)',
                  marginBottom: 12,
                  border: '1px solid var(--border)',
                }}
              >
                {form.banner ? (
                  <img
                    src={form.banner}
                    alt="Store Banner Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: 6 }}>
                    <ImageIcon size={28} />
                    <span className="text-xs">No banner uploaded</span>
                  </div>
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.1) 60%)',
                  display: 'flex', alignItems: 'flex-end', padding: 16
                }}>
                  <div style={{ color: '#fff' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{form.name || 'Store Name'}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>Store banner preview</div>
                  </div>
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ position: 'absolute', top: 12, right: 12, boxShadow: 'var(--shadow-md)' }}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload size={14} /> Upload Banner Image
                </button>
              </div>

              {/* Hidden Banner File Input */}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleBannerFileChange}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

            {/* 2. Store Logo Input */}
            <div className="form-group">
              <label className="label font-bold text-sm">Store Profile Picture / Logo</label>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                {/* Live Logo Preview Box */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '3px solid var(--border)',
                    background: '#fff',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--muted)',
                  }}
                >
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Store Logo Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Store size={28} />
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload size={14} /> Upload Logo Image File
                  </button>
                  <div className="muted text-xs mt-1">Recommended 300x300px square (PNG, JPG, WebP)</div>
                </div>

                {/* Hidden Logo File Input */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleLogoFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* General Store Details */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }} className="flex items-center gap-2">
            <Store size={18} color="var(--primary)" /> Store Profile Information
          </h3>

          <div className="flex flex-col gap-3">
            <Input
              label="Store Display Name"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                }))
              }}
              placeholder="e.g. Koshi Handicrafts Store"
            />

            <div className="form-row">
              <Input
                label="Store URL Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="koshi-handicrafts-store"
                hint="Used as /store/your-slug on the marketplace"
              />
            </div>

            <Textarea
              label="Full Store Bio & Description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell buyers about your craftsmanship, origins, mission, and products."
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }} className="flex items-center gap-2">
            <Phone size={18} color="var(--primary)" /> Store Contact Information
          </h3>

          <div className="form-row">
            <Input
              label="Store Contact Email"
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="store@example.com"
            />
            <Input
              label="Customer Service Phone (Nepal)"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="+977 98XXXXXXXX"
            />
          </div>
          <p className="muted text-xs m-0 mt-2" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Mail size={11} /> Buyers use these details to reach your store.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <Link to="/vendor/stores" className="btn btn-outline">
            Cancel
          </Link>
          {storeId && (
            <button type="button" className="btn btn-soft" onClick={submitForApproval} disabled={submitting}>
              {submitting ? <Spinner size={16} color="#fff" /> : <><Send size={14} /> Submit for Approval</>}
            </button>
          )}
          <button type="submit" className="btn btn-primary" style={{ minWidth: 160 }} disabled={saving}>
            {saving ? <Spinner size={16} color="#fff" /> : 'Save Store Details'}
          </button>
        </div>
      </form>
    </div>
  )
}
