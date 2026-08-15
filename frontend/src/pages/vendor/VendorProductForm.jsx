import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Image as ImageIcon, Upload, CheckCircle2, Sparkles } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { errorMessage, apiImage, FALLBACK_PRODUCT_IMAGES } from '../../utils/format'

const PRESET_PRODUCT_IMAGES = [
  { label: 'Pashmina Shawl', url: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' },
  { label: 'Organic Herbal Tea', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80' },
  { label: 'Electronics & Audio', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80' },
  { label: 'Smartphone & Gadget', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80' },
  { label: 'Handicrafts & Art', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80' },
  { label: 'Apparel & Fashion', url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80' },
  { label: 'Shoes & Footwear', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80' },
  { label: 'Trekking Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80' },
  { label: 'Spices & Herbs', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80' },
]

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  price: '',
  compare_at_price: '',
  quantity: '0',
  low_stock_threshold: '5',
  description: '',
  short_description: '',
  category_id: '',
  brand_id: '',
  weight_grams: '0',
  dimensions: '',
  primary_image: '',
  images: [],
  is_negotiable: false,
  is_featured: false,
  variants: [],
}

export default function VendorProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [customImageUrl, setCustomImageUrl] = useState('')

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(() => {})
    api.get('/brands').then((r) => setBrands(r.data.data || [])).catch(() => {})

    if (isEdit) {
      setLoading(true)
      api
        .get(`/vendor/products/${id}`)
        .then((r) => {
          const p = r.data.data
          setForm({
            name: p.name,
            slug: p.slug || '',
            sku: p.sku,
            price: String(p.price ?? ''),
            compare_at_price: String(p.compare_at_price ?? ''),
            quantity: String(p.quantity ?? '0'),
            low_stock_threshold: String(p.low_stock_threshold ?? '5'),
            description: p.description || '',
            short_description: p.short_description || '',
            category_id: p.category?.id || '',
            brand_id: p.brand?.id || '',
            weight_grams: String(p.weight_grams ?? '0'),
            dimensions: p.dimensions || '',
            primary_image: p.primary_image?.url || p.primary_image || p.image || '',
            images: (p.images || []).map((img) => img.url || img),
            is_negotiable: !!p.is_negotiable,
            is_featured: !!p.is_featured,
            variants: (p.variants || []).map((v) => ({
              sku: v.sku,
              name: v.name || '',
              price: String(v.price ?? ''),
              compare_at_price: String(v.compare_at_price ?? ''),
              quantity: String(v.quantity ?? '0'),
              options: Object.entries(v.options || {}).map(([k, val]) => `${k}=${val}`).join(', '),
            })),
          })
        })
        .catch(() => setLoadFailed(true))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      if (!form.primary_image) {
        setForm({ ...form, primary_image: dataUrl, images: [...form.images, dataUrl] })
      } else {
        setForm({ ...form, images: [...form.images, dataUrl] })
      }
      toast.success('Image uploaded')
    }
    reader.readAsDataURL(file)
  }

  const addCustomImage = () => {
    if (!customImageUrl.trim()) return
    const url = customImageUrl.trim()
    if (!form.primary_image) {
      setForm({ ...form, primary_image: url, images: [...form.images, url] })
    } else {
      setForm({ ...form, images: [...form.images, url] })
    }
    setCustomImageUrl('')
    toast.success('Image added to gallery')
  }

  const setCoverImage = (url) => {
    setForm({ ...form, primary_image: url })
    toast.info('Cover image updated')
  }

  const removeImage = (indexToRemove) => {
    const updated = form.images.filter((_, idx) => idx !== indexToRemove)
    setForm({
      ...form,
      images: updated,
      primary_image: form.primary_image === form.images[indexToRemove] ? (updated[0] || '') : form.primary_image
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})
    setSaving(true)
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      sku: form.sku,
      price: form.price ? Number(form.price) : undefined,
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : undefined,
      quantity: Number(form.quantity || 0),
      low_stock_threshold: Number(form.low_stock_threshold || 5),
      description: form.description || null,
      short_description: form.short_description || null,
      category_id: form.category_id || undefined,
      brand_id: form.brand_id || undefined,
      weight_grams: Number(form.weight_grams || 0),
      dimensions: form.dimensions || undefined,
      primary_image: form.primary_image || undefined,
      images: form.images.length ? form.images : undefined,
      is_negotiable: form.is_negotiable,
      is_featured: form.is_featured,
      variants: form.variants
        .filter((v) => v.sku.trim() && v.price !== '')
        .map((v) => ({
          sku: v.sku,
          name: v.name || null,
          price: Number(v.price),
          compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : undefined,
          quantity: Number(v.quantity || 0),
          options: v.options
            ? Object.fromEntries(v.options.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.split('=').map((x) => x.trim())))
            : {},
        })),
    }
    try {
      if (isEdit) {
        await api.put(`/vendor/products/${id}`, payload)
        toast.success('Product updated successfully')
      } else {
        await api.post('/vendor/products', payload)
        toast.success('Product created successfully')
      }
      navigate('/vendor/products')
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setFieldErrors(d.errors)
      else toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const submitForReview = async () => {
    try {
      await api.post(`/vendor/products/${id}/submit`)
      toast.success('Product submitted for administrative review')
      navigate('/vendor/products')
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const setVariant = (idx, key, value) => {
    const variants = [...form.variants]
    variants[idx] = { ...variants[idx], [key]: value }
    setForm({ ...form, variants })
  }
  const addVariant = () => setForm({ ...form, variants: [...form.variants, { sku: '', name: '', price: '', compare_at_price: '', quantity: '0', options: '' }] })
  const removeVariant = (idx) => setForm({ ...form, variants: form.variants.filter((_, i) => i !== idx) })

  if (isEdit && loadFailed) {
    return <div className="alert alert-error">Product not found.</div>
  }

  if (isEdit && loading) {
    return <div className="flex items-center gap-2 muted"><Spinner size={18} color="var(--primary)" /> Loading product details…</div>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Link to="/vendor/products" className="icon-btn"><ArrowLeft size={16} /></Link>
        <h1 style={{ fontSize: 22, margin: 0 }}>{isEdit ? 'Edit Product' : 'Create New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="card mb-3">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Basic Information</h3>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="label">Product Name <span className="req">*</span></label>
              <input className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Handwoven Himalayan Cashmere Shawl" />
              {fieldErrors.name && <div className="field-error">{fieldErrors.name[0]}</div>}
            </div>
            <Input label="SKU (Stock Keeping Unit)" required value={form.sku} onChange={set('sku')} placeholder="GOS-PRD-001" error={fieldErrors.sku?.[0]} />
            <Input label="Slug / URL Key (optional)" value={form.slug} onChange={set('slug')} hint="auto-generated if left blank" error={fieldErrors.slug?.[0]} />
            <Input label="Regular Price (NPR)" type="number" step="0.01" required value={form.price} onChange={set('price')} placeholder="1500" error={fieldErrors.price?.[0]} />
            <Input label="Compare-At / Strike-Through Price" type="number" step="0.01" value={form.compare_at_price} onChange={set('compare_at_price')} placeholder="2000" />
            <Input label="Stock Quantity Available" type="number" min="0" value={form.quantity} onChange={set('quantity')} />
            <Input label="Low Stock Warning Threshold" type="number" min="0" value={form.low_stock_threshold} onChange={set('low_stock_threshold')} />
            <Select label="Product Category" value={form.category_id} onChange={set('category_id')}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select label="Brand" value={form.brand_id} onChange={set('brand_id')}>
              <option value="">Select / Unbranded</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input label="Shipping Weight (grams)" type="number" min="0" value={form.weight_grams} onChange={set('weight_grams')} placeholder="500" />
            <Input label="Dimensions (LxWxH cm)" value={form.dimensions} onChange={set('dimensions')} placeholder="e.g. 25x15x8 cm" />
          </div>

          <Textarea label="Short Summary (shown at top of product detail)" rows={2} value={form.short_description} onChange={set('short_description')} placeholder="Brief 1-2 sentence highlight of the product…" />
          <Textarea label="Full Detailed Description" rows={5} value={form.description} onChange={set('description')} placeholder="Detail the materials, care instructions, origin, and features…" />

          <div className="flex items-center gap-4 wrap mt-2">
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_negotiable} onChange={(e) => setForm({ ...form, is_negotiable: e.target.checked })} />
              <span>Allow price negotiation / inquiries</span>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
              <span>Feature this product in store showcase</span>
            </label>
          </div>
        </div>

        {/* Product Media & Cover Images */}
        <div className="card mb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={18} color="var(--primary)" /> Product Images & Cover Photo
              </h3>
              <p className="muted text-xs m-0 mt-1">Set a primary cover image and multiple gallery photos for buyers</p>
            </div>
          </div>

          {/* Primary Cover Image Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 1fr', gap: 20, alignItems: 'start', marginBottom: 20 }}>
            <div>
              <span className="label">Primary Cover Image</span>
              <div
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 'var(--radius)',
                  border: '2px dashed var(--border)',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {form.primary_image ? (
                  <img
                    src={apiImage(form.primary_image)}
                    alt="Cover preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="text-center p-3">
                    <ImageIcon size={32} className="muted mb-1" />
                    <div className="muted text-xs">No cover selected</div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="label">Upload Image or Add Image URL</span>
              <div className="flex gap-2 mb-2">
                <input
                  className="input flex-1"
                  placeholder="Paste image URL (https://…)"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={addCustomImage}>
                  Add URL
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <label className="btn btn-soft btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} /> Upload Local Image
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                <span className="muted text-xs">Supports JPG, PNG, WEBP up to 5MB</span>
              </div>

              {/* Presets Quick Pick */}
              <span className="label flex items-center gap-1"><Sparkles size={13} color="var(--primary)" /> Or Pick a High-Quality Category Photo</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_PRODUCT_IMAGES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg)' }}
                    onClick={() => {
                      if (!form.primary_image) {
                        setForm({ ...form, primary_image: p.url, images: [...form.images, p.url] })
                      } else {
                        setForm({ ...form, images: [...form.images, p.url] })
                      }
                      toast.success(`Selected ${p.label}`)
                    }}
                  >
                    + {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gallery Images Strip */}
          {form.images.length > 0 && (
            <div>
              <span className="label">Gallery Images ({form.images.length})</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                {form.images.map((imgUrl, idx) => {
                  const isPrimary = form.primary_image === imgUrl
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden',
                        height: 100,
                        border: isPrimary ? '3px solid var(--primary)' : '1px solid var(--border)',
                      }}
                    >
                      <img src={apiImage(imgUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isPrimary && (
                        <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--primary)', color: '#fff', fontSize: 9, padding: '2px 4px', borderRadius: 4, fontWeight: 700 }}>
                          COVER
                        </span>
                      )}
                      <div style={{ position: 'absolute', bottom: 4, right: 4, display: 'flex', gap: 2 }}>
                          <button
                            type="button"
                            className="icon-btn icon-btn-sm"
                            style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', width: 22, height: 22 }}
                            title="Set as cover"
                            onClick={() => setCoverImage(imgUrl)}
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-sm"
                          style={{ background: 'rgba(220,38,38,0.85)', color: '#fff', width: 22, height: 22 }}
                          title="Remove image"
                          onClick={() => removeImage(idx)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Variants Section */}
        <div className="card mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 style={{ fontSize: 16, margin: 0 }}>Product Variants <span className="muted text-xs font-normal">(Sizes, Colors, Options)</span></h3>
            <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addVariant}>Add Variant</Button>
          </div>

          {form.variants.map((v, idx) => (
            <div key={idx} className="card" style={{ padding: 14, marginBottom: 10, background: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">Variant #{idx + 1}</span>
                <button type="button" className="btn btn-ghost btn-xs text-danger" onClick={() => removeVariant(idx)}><Trash2 size={13} /> Remove</button>
              </div>
              <div className="form-row">
                <Input label="Variant SKU" required value={v.sku} onChange={(e) => setVariant(idx, 'sku', e.target.value)} placeholder="VAR-RED-M" />
                <Input label="Variant Title" value={v.name} onChange={(e) => setVariant(idx, 'name', e.target.value)} placeholder="e.g. Red / Medium" />
                <Input label="Price (NPR)" type="number" step="0.01" value={v.price} onChange={(e) => setVariant(idx, 'price', e.target.value)} />
                <Input label="Stock Quantity" type="number" min="0" value={v.quantity} onChange={(e) => setVariant(idx, 'quantity', e.target.value)} />
              </div>
              <Input label="Options (key=value, separated by comma)" value={v.options} onChange={(e) => setVariant(idx, 'options', e.target.value)} placeholder="color=Red, size=M" />
            </div>
          ))}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center gap-3 mt-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Spinner size={16} color="#fff" /> : isEdit ? 'Update Product' : 'Save Product'}
          </Button>
          {isEdit && (
            <Button type="button" variant="soft" size="lg" onClick={submitForReview}>
              Submit for Admin Review
            </Button>
          )}
          <Link to="/vendor/products" className="btn btn-outline btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
