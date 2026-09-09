import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Award, Save, ArrowLeft, UploadCloud, ShieldCheck, Link2
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import Input, { Field } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { errorMessage, apiImage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminBrandForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()
  const editing = Boolean(id)
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo: '',
    description: '',
    status: 'active',
  })
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) return
    api
      .get(`/admin/brands/${id}`)
      .then((r) => {
        const d = r.data?.data || {}
        setForm({
          name: d.name || '',
          slug: d.slug || '',
          logo: d.logo || '',
          description: d.description || '',
          status: d.status || 'active',
        })
      })
      .catch((err) => toast.error(errorMessage(err, 'Failed to load brand.')))
      .finally(() => setLoading(false))
  }, [id, editing, toast])

  const slugify = (v) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleName = (e) => {
    const name = e.target.value
    setForm((f) => ({
      ...f,
      name,
      slug: editing ? f.slug : slugify(name),
    }))
  }

  const handleFileUpload = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setForm((prev) => ({ ...prev, logo: e.target.result }))
      toast.success('Logo attached — save to persist it.')
    }
    reader.readAsDataURL(file)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        ...(form.logo ? { logo: form.logo } : {}),
        ...(editing ? { status: form.status } : {}),
      }
      if (editing) {
        await api.put(`/admin/brands/${id}`, payload)
        toast.success(`Brand "${form.name}" updated`)
      } else {
        await api.post('/admin/brands', payload)
        toast.success(`Brand "${form.name}" registered`)
      }
      navigate('/admin/marketplace/brands')
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to save brand.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-3">
        <Skeleton height={30} width="40%" />
        <div className="card" style={{ padding: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} style={{ marginBottom: 12 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-10">
      <PageHeader
        title={editing ? `Edit Brand: ${form.name || ''}` : 'Register New Brand'}
        description="Create or update official marketplace brand profiles used across the catalog."
        breadcrumbs={[
          { label: 'Catalog & Curation' },
          { label: 'Brands & Authorizations', to: '/admin/marketplace/brands' },
          { label: editing ? 'Edit Brand' : 'New Brand' },
        ]}
      />

      <form onSubmit={save}>
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={16} color="var(--primary)" /> Brand Profile
            </div>

            <Input
              label="Brand / Manufacturer Name"
              required
              value={form.name}
              onChange={handleName}
              placeholder="e.g. Koshi Handicrafts"
            />

            <div className="form-row">
              <div className="form-group">
                <label className="label">URL Slug</label>
                <input
                  className="input font-mono"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="koshi-handicrafts"
                />
              </div>
              <div className="form-group">
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active — authorized for catalog</option>
                  <option value="inactive">Inactive — not selectable</option>
                </select>
              </div>
            </div>

            <Field label="Description">
              <textarea
                className="textarea"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of the brand, artisan guild, or manufacturing partner."
              />
            </Field>

            {editing && (
              <div className="flex gap-2 wrap" style={{ marginTop: 6 }}>
                <span className="chip chip-sm"><ShieldCheck size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} /> Often used with authorization requests</span>
                <span className="muted text-xs"><Link2 size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 3 }} />slug: {form.slug || '—'}</span>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UploadCloud size={16} color="var(--primary)" /> Logo Emblem
            </div>

            <div style={{ width: 96, height: 96, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={apiImage(form.logo, form.name)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files[0])}
            />

            <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={14} /> {form.logo ? 'Replace Logo' : 'Upload Logo'}
            </button>
            <p className="helper">Recommended size: 200×200 PNG or JPEG. PNG works best for transparent emblems.</p>

            <div style={{ marginTop: 'auto', display: 'flex', gap: 10, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={() => navigate('/admin/marketplace/brands')}>
                <ArrowLeft size={14} /> Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1" disabled={saving || !form.name.trim()}>
                <Save size={14} /> {saving ? 'Saving…' : editing ? 'Update Brand' : 'Create Brand'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}