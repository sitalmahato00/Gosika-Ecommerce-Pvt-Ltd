import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Plus, Pencil, Send, Trash2, Globe, Eye, Mail, Phone, MapPin } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import { money, apiImage, formatDate, errorMessage } from '../../utils/format'

const emptyForm = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  logo: '',
  cover_image: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  province: '',
  district: '',
  municipality: '',
  website: '',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
}

function SocialIcon({ kind }) {
  const size = 15
  const common = { width: size, height: size, 'aria-hidden': true }
  if (kind === 'facebook') return <svg viewBox="0 0 24 24" fill="currentColor" {...common}><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" /></svg>
  if (kind === 'instagram') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...common}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
  if (kind === 'twitter') return <svg viewBox="0 0 24 24" fill="currentColor" {...common}><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg>
  return null
}

export default function VendorStores() {
  const toast = useToast()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/stores').then((r) => setStores(r.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openModal = (store) => {
    setEditing(store || null)
    setForm(store
      ? {
          name: store.name || '',
          slug: store.slug || '',
          tagline: store.tagline || '',
          description: store.description || '',
          logo: store.logo || '',
          cover_image: store.cover_image || '',
          contact_email: store.contact_email || '',
          contact_phone: store.contact_phone || '',
          address: store.address || '',
          province: store.province || '',
          district: store.district || '',
          municipality: store.municipality || '',
          website: store.website || '',
          facebook_url: store.facebook_url || store.socials?.facebook || '',
          instagram_url: store.instagram_url || store.socials?.instagram || '',
          twitter_url: store.twitter_url || store.socials?.twitter || '',
        }
      : emptyForm)
    setModalOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        socials: { facebook: form.facebook_url, instagram: form.instagram_url, twitter: form.twitter_url },
      }
      if (editing) {
        await api.put(`/vendor/stores/${editing.id}`, payload)
        toast.success('Store updated')
      } else {
        await api.post('/vendor/stores', payload)
        toast.success('Store created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const submitStore = async (s) => {
    try {
      await api.post(`/vendor/stores/${s.id}/submit`)
      toast.success('Store submitted for review')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/vendor/stores/${deleteTarget.id}`)
      toast.success('Store deleted')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Store Profile</h1>
          <p>Manage your public store — name, branding, contact and social links</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => openModal(null)}>Edit store</Button>
      </div>

      {loading ? (
        <div className="card"><Spinner size={20} color="var(--primary)" /></div>
      ) : stores.length ? (
        <div className="flex flex-col gap-3">
          {stores.map((s) => (
            <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cover */}
              <div style={{ height: 120, background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #60a5fa 100%)', position: 'relative' }}>
                {s.cover_image && (
                  <img src={apiImage(s.cover_image)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <StatusBadge status={s.status} />
                <span style={{ position: 'absolute', top: 10, right: 10 }}>
                  <StatusBadge status={s.status} />
                </span>
              </div>

              <div className="flex items-center gap-4" style={{ padding: 18 }}>
                <span className="thumb" style={{ width: 72, height: 72, border: '3px solid #fff', marginTop: -36, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative' }}>
                  {s.logo ? <img src={apiImage(s.logo)} alt="" className="thumb-img" /> : <Store size={28} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 wrap">
                    <h2 style={{ fontSize: 18, margin: 0 }}>{s.name}</h2>
                  </div>
                  {s.tagline && <div className="muted text-sm">{s.tagline}</div>}
                  <div className="muted text-sm mt-1" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {s.contact_email && <span className="flex items-center gap-1"><Mail size={13} /> {s.contact_email}</span>}
                    {s.contact_phone && <span className="flex items-center gap-1"><Phone size={13} /> {s.contact_phone}</span>}
                    {(s.province || s.district) && (
                      <span className="flex items-center gap-1"><MapPin size={13} /> {[s.municipality, s.district, s.province].filter(Boolean).join(', ')}</span>
                    )}
                  </div>
                  <div className="muted text-xs mt-1">{s.slug && <span className="font-mono">/{s.slug}</span>} {s.approved_at && <>· Approved {formatDate(s.approved_at)}</>}</div>
                </div>
                <div className="flex items-center gap-1 wrap">
                  <a href={`/store/${s.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-soft btn-sm">
                    <Eye size={13} /> Preview
                  </a>
                  <button className="btn btn-outline btn-sm" onClick={() => openModal(s)}><Pencil size={13} /> Edit</button>
                  {s.status !== 'approved' && s.status !== 'pending' && (
                    <button className="btn btn-soft btn-sm" onClick={() => submitStore(s)}><Send size={13} /> Submit</button>
                  )}
                  <button className="btn btn-danger-outline btn-sm" onClick={() => setDeleteTarget(s)}><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Social + website row */}
              {(s.website || s.facebook_url || s.instagram_url || s.twitter_url || s.socials) && (
                <div className="flex items-center gap-3" style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="chip" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Globe size={13} /> {s.website}
                    </a>
                  )}
                  {[['facebook', s.facebook_url || s.socials?.facebook], ['instagram', s.instagram_url || s.socials?.instagram], ['twitter', s.twitter_url || s.socials?.twitter]]
                    .filter(([, url]) => url)
                    .map(([kind, url]) => (
                      <a key={kind} href={url} target="_blank" rel="noopener noreferrer" className="chip" aria-label={`${kind} link`}>
                        <SocialIcon kind={kind} /> {kind}
                      </a>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No stores yet"
          message="Create a store to start selling across Nepal."
          action={<Button variant="primary" icon={Plus} onClick={() => openModal(null)}>Add store</Button>}
        />
      )}

      {/* Create / edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit store' : 'New store'} size="lg">
        <form onSubmit={save} className="flex flex-col gap-2">
          <div className="form-row">
            <Input label="Store name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} hint="used in store URL" />
            <Input label="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="e.g. Kathmandu's electronics store" />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <h4 className="muted text-xs uppercase mb-1" style={{ letterSpacing: '0.06em' }}>Branding</h4>
          <div className="form-row">
            <Input label="Logo URL" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} hint="Image URL or uploaded path" />
            <Input label="Cover image URL" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} />
          </div>

          <h4 className="muted text-xs uppercase mb-1" style={{ letterSpacing: '0.06em' }}>Contact</h4>
          <div className="form-row">
            <Input label="Contact email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <Input label="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
            <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="Municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
          </div>

          <h4 className="muted text-xs uppercase mb-1" style={{ letterSpacing: '0.06em' }}>Social & Website</h4>
          <div className="form-row">
            <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Facebook URL" value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} />
            <Input label="Instagram URL" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} />
            <Input label="Twitter / X URL" value={form.twitter_url} onChange={(e) => setForm({ ...form, twitter_url: e.target.value })} />
          </div>

          <Button type="submit" block disabled={saving}>{saving ? <Spinner size={15} color="#fff" /> : editing ? 'Update store' : 'Create store'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Delete store?"
        message={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
