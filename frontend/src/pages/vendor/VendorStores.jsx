import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Plus, Pencil, Send, Trash2, Globe, Eye, Mail, Phone,
  MapPin, CheckCircle2, SlidersHorizontal, Image as ImageIcon
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../context/ToastContext'
import {
  money, apiImage, formatDate, errorMessage,
  getStoreImage, getStoreBanner
} from '../../utils/format'

function SocialIcon({ kind }) {
  const size = 14
  const common = { width: size, height: size, 'aria-hidden': true }
  if (kind === 'facebook') return <svg viewBox="0 0 24 24" fill="currentColor" {...common}><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" /></svg>
  if (kind === 'instagram') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...common}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
  if (kind === 'twitter') return <svg viewBox="0 0 24 24" fill="currentColor" {...common}><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" /></svg>
  return null
}

const DEFAULT_STORE = {
  id: 1,
  name: 'Koshi Handicrafts Store',
  slug: 'koshi-handicrafts-store-1',
  tagline: 'Authentic Nepali Dhaka & Handmade Artisan Goods',
  description: 'Specialized in traditional hand-woven Dhaka textiles, authentic pashmina shawls, and handmade woodcrafts directly from artisans in Nepal.',
  logo: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&q=80',
  cover_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
  contact_email: 'hello@koshi.com.np',
  contact_phone: '+977 9841223344',
  province: 'Koshi',
  district: 'Morang',
  municipality: 'Biratnagar',
  status: 'active',
  website: 'https://koshihandicrafts.com.np',
  facebook_url: 'https://facebook.com/koshihandicrafts',
  instagram_url: 'https://instagram.com/koshihandicrafts',
}

export default function VendorStores() {
  const toast = useToast()
  const [stores, setStores] = useState([DEFAULT_STORE])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/vendor/stores')
      .then((r) => {
        const data = r.data.data || []
        if (data.length > 0) {
          setStores(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

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
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Store Profile</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage your public storefront — name, branding pictures, contact and social links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/stores/edit" className="btn btn-primary btn-sm flex items-center gap-1">
            <Pencil size={14} /> Edit Store Details & Pictures
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : stores.length ? (
        <div className="flex flex-col gap-4">
          {stores.map((s) => {
            const banner = getStoreBanner(s)
            const logo = getStoreImage(s)
            return (
              <div key={s.id} className="card card-pad-none" style={{ overflow: 'hidden' }}>
                {/* Store Cover Banner Picture */}
                <div style={{ height: 160, position: 'relative', overflow: 'hidden', background: 'var(--navy)' }}>
                  <img
                    src={banner}
                    alt={`${s.name} Cover Banner`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.7) 0%, rgba(15,23,42,0.1) 60%)'
                  }} />
                  <span style={{ position: 'absolute', top: 12, right: 12 }}>
                    <StatusBadge status={s.status || 'active'} />
                  </span>
                </div>

                {/* Store Info & Logo Row */}
                <div style={{ padding: '0 20px 20px', position: 'relative' }}>
                  <div className="flex items-end justify-between wrap gap-3" style={{ marginTop: -36, marginBottom: 14 }}>
                    <div className="flex items-end gap-3">
                      <div
                        style={{
                          width: 76,
                          height: 76,
                          borderRadius: 'var(--radius-lg)',
                          border: '4px solid #fff',
                          boxShadow: 'var(--shadow-md)',
                          overflow: 'hidden',
                          background: '#fff',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={logo}
                          alt={s.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{s.name}</h2>
                        <div className="muted text-xs flex items-center gap-2 mt-1">
                          {s.slug && <span className="font-mono">/{s.slug}</span>}
                          {s.province && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1"><MapPin size={11} color="var(--primary)" /> {s.municipality || s.city || s.district}, {s.province}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 wrap">
                      <a href={`/store/${s.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        <Eye size={13} /> Preview Storefront
                      </a>
                      <Link to={`/vendor/stores/${s.id}/edit`} className="btn btn-primary btn-sm">
                        <Pencil size={13} /> Edit Store
                      </Link>
                      {s.status !== 'approved' && s.status !== 'active' && (
                        <button className="btn btn-success btn-sm" onClick={() => submitStore(s)}>
                          <Send size={13} /> Submit for Review
                        </button>
                      )}
                    </div>
                  </div>

                  {s.tagline && <p className="font-medium text-sm text-ink mb-1">{s.tagline}</p>}
                  {s.description && <p className="muted text-sm m-0 mb-3" style={{ lineHeight: 1.5, maxWidth: 780 }}>{s.description}</p>}

                  <div className="muted text-xs flex items-center gap-4 wrap pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    {s.contact_email && <span className="flex items-center gap-1"><Mail size={12} /> {s.contact_email}</span>}
                    {s.contact_phone && <span className="flex items-center gap-1"><Phone size={12} /> {s.contact_phone}</span>}
                    {s.website && (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <Globe size={12} /> {s.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                {/* Social links row */}
                {(s.facebook_url || s.instagram_url || s.twitter_url || s.socials) && (
                  <div className="flex items-center gap-2" style={{ padding: '8px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                    <span className="muted text-xs font-semibold uppercase">Socials:</span>
                    {[['facebook', s.facebook_url || s.socials?.facebook], ['instagram', s.instagram_url || s.socials?.instagram], ['twitter', s.twitter_url || s.socials?.twitter]]
                      .filter(([, url]) => url)
                      .map(([kind, url]) => (
                        <a key={kind} href={url} target="_blank" rel="noopener noreferrer" className="chip chip-sm" style={{ textTransform: 'capitalize' }}>
                          <SocialIcon kind={kind} /> {kind}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No store profile created"
          message="Create your store to start selling across Nepal."
          action={
            <Link to="/vendor/stores/edit" className="btn btn-primary">
              <Plus size={14} /> Create Store
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={doDelete}
        danger
        loading={deleting}
        title="Delete store profile?"
        message={`"${deleteTarget?.name}" will be removed.`}
        confirmText="Delete"
      />
    </div>
  )
}
