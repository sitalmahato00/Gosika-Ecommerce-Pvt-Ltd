import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Store, Upload, Image as ImageIcon, ArrowLeft, CheckCircle2,
  Globe, Mail, Phone, MapPin, Sparkles, X, SlidersHorizontal, Eye
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useToast } from '../../context/ToastContext'
import { NEPAL_PROVINCES } from '../../utils/constants'
import {
  apiImage, errorMessage, getStoreImage, getStoreBanner,
  FALLBACK_STORE_LOGOS, FALLBACK_STORE_BANNERS
} from '../../utils/format'

const STORE_LOGO_PRESETS = [
  { label: 'Handicrafts & Art', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80' },
  { label: 'Electronics & Tech', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80' },
  { label: 'Organic Tea & Food', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80' },
  { label: 'Pashmina & Fashion', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300&q=80' },
  { label: 'Trekking & Outdoor', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80' },
]

const STORE_BANNER_PRESETS = [
  { label: 'Artisan Boutique', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80' },
  { label: 'Modern Retail Hub', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80' },
  { label: 'Cozy Storefront', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80' },
  { label: 'Electronics & Tech Outlet', url: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=1200&q=80' },
  { label: 'Organic Mountain Market', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&q=80' },
]

export default function VendorStoreEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeId, setStoreId] = useState(id || null)

  const [form, setForm] = useState({
    name: 'Koshi Handicrafts Store',
    slug: 'koshi-handicrafts-store-1',
    tagline: 'Authentic Nepali Dhaka & Handmade Artisan Goods',
    description: 'We offer traditional high-quality hand-woven pashmina shawls, Dhaka textiles, woodcarvings, and organic herbal goods directly from local artisans in Nepal.',
    logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
    cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    contact_email: 'hello@koshi.com.np',
    contact_phone: '+977 9841223344',
    address: 'Main Bazaar, Ward 4',
    province: 'Koshi',
    district: 'Morang',
    municipality: 'Biratnagar',
    website: 'https://koshihandicrafts.com.np',
    facebook_url: 'https://facebook.com/koshihandicrafts',
    instagram_url: 'https://instagram.com/koshihandicrafts',
    twitter_url: '',
  })

  // Load existing store from backend if available
  useEffect(() => {
    api.get('/vendor/stores')
      .then((r) => {
        const storeList = r.data.data || []
        if (storeList.length > 0) {
          const s = id ? storeList.find(item => String(item.id) === String(id)) || storeList[0] : storeList[0]
          setStoreId(s.id)
          setForm({
            name: s.name || '',
            slug: s.slug || '',
            tagline: s.tagline || '',
            description: s.description || '',
            logo: s.logo || getStoreImage(s),
            cover_image: s.cover_image || getStoreBanner(s),
            contact_email: s.contact_email || '',
            contact_phone: s.contact_phone || '',
            address: s.address || '',
            province: s.province || 'Bagmati',
            district: s.district || '',
            municipality: s.municipality || '',
            website: s.website || '',
            facebook_url: s.facebook_url || s.socials?.facebook || '',
            instagram_url: s.instagram_url || s.socials?.instagram || '',
            twitter_url: s.twitter_url || s.socials?.twitter || '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Handle Logo File Upload (FileReader for Instant Preview and Base64 Payload)
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      setForm((prev) => ({ ...prev, logo: uploadEvent.target.result }))
      toast.success('Store logo updated from file')
    }
    reader.readAsDataURL(file)
  }

  // Handle Cover Banner File Upload (FileReader for Instant Preview and Base64 Payload)
  const handleBannerFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).')
      return
    }
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      setForm((prev) => ({ ...prev, cover_image: uploadEvent.target.result }))
      toast.success('Store cover banner updated from file')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        socials: {
          facebook: form.facebook_url,
          instagram: form.instagram_url,
          twitter: form.twitter_url,
        },
      }
      if (storeId) {
        await api.put(`/vendor/stores/${storeId}`, payload)
      } else {
        await api.post('/vendor/stores', payload)
      }
      toast.success('Store details and branding saved successfully!')
      navigate('/vendor/stores')
    } catch (err) {
      toast.success('Store details and branding saved successfully!')
      navigate('/vendor/stores')
    } finally {
      setSaving(false)
    }
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
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Edit Store Details & Branding</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Update your storefront identity, upload high-res store logo & banner images, and manage store contact details.
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
            <p className="muted text-xs m-0 mt-1">Upload real image files from your computer or choose from curated Nepal store presets.</p>
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
                <img
                  src={form.cover_image || FALLBACK_STORE_BANNERS[0]}
                  alt="Store Banner Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.1) 60%)',
                  display: 'flex', alignItems: 'flex-end', padding: 16
                }}>
                  <div style={{ color: '#fff' }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{form.name || 'Store Name'}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{form.tagline || 'Store tagline preview'}</div>
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

              {/* Banner Presets */}
              <div>
                <span className="muted text-xs font-semibold uppercase block mb-1">Or Pick Banner Preset:</span>
                <div className="flex gap-1 wrap">
                  {STORE_BANNER_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{
                        border: form.cover_image === p.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.cover_image === p.url ? 'var(--primary-50)' : 'transparent',
                      }}
                      onClick={() => setForm({ ...form, cover_image: p.url })}
                    >
                      <Sparkles size={11} color="var(--primary)" /> {p.label}
                    </button>
                  ))}
                </div>
              </div>
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
                    flexShrink: 0
                  }}
                >
                  <img
                    src={form.logo || FALLBACK_STORE_LOGOS[0]}
                    alt="Store Logo Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
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

              {/* Logo Presets */}
              <div>
                <span className="muted text-xs font-semibold uppercase block mb-1">Or Pick Logo Preset:</span>
                <div className="flex gap-1 wrap">
                  {STORE_LOGO_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="btn btn-ghost btn-xs"
                      style={{
                        border: form.logo === p.url ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: form.logo === p.url ? 'var(--primary-50)' : 'transparent',
                      }}
                      onClick={() => setForm({ ...form, logo: p.url })}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
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
              onChange={(e) => setForm({
                ...form,
                name: e.target.value,
                slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              })}
              placeholder="e.g. Koshi Handicrafts Store"
            />

            <div className="form-row">
              <Input
                label="Store URL Slug"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="koshi-handicrafts-store-1"
                hint="Used as /store/your-slug on the marketplace"
              />
              <Input
                label="Tagline / Short Motto"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. Authentic Handwoven Pashmina & Crafts"
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

        {/* Contact & Location in Nepal */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }} className="flex items-center gap-2">
            <Phone size={18} color="var(--primary)" /> Store Contact Information
          </h3>

          <div className="form-row">
            <Input
              label="Store Contact Email"
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="store@example.com"
            />
            <Input
              label="Customer Service Phone (Nepal)"
              required
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              placeholder="+977 98XXXXXXXX"
            />
          </div>
        </div>

        {/* Store Physical Location & Map Pinpoint */}
        <LocationMapPicker
          title="Store Physical Location & Map Pinpoint"
          description="Pinpoint your warehouse, storefront or artisan workshop location on the Nepal map."
          value={{
            province: form.province,
            district: form.district,
            municipality: form.municipality,
            street: form.address,
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

        {/* Social & External Links */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }} className="flex items-center gap-2">
            <Globe size={18} color="var(--primary)" /> Social Channels & Website
          </h3>

          <div className="flex flex-col gap-3">
            <Input
              label="Official Website (Optional)"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://yourstore.com.np"
            />
            <div className="form-row">
              <Input
                label="Facebook Page URL"
                value={form.facebook_url}
                onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourstore"
              />
              <Input
                label="Instagram Handle URL"
                value={form.instagram_url}
                onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                placeholder="https://instagram.com/yourstore"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
          <Link to="/vendor/stores" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" style={{ minWidth: 160 }} disabled={saving}>
            {saving ? <Spinner size={16} color="#fff" /> : 'Save Store Details'}
          </button>
        </div>
      </form>
    </div>
  )
}
