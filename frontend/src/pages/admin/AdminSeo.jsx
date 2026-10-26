import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Globe, BarChart2, FileText, Tag, ArrowRight,
  ShieldCheck, Map, Terminal, RefreshCw, Save, Trash2,
  Plus, Edit2, CheckCircle2, AlertTriangle, XCircle,
  ExternalLink, Copy, Check, ChevronRight, Info
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import { useToast } from '../../context/ToastContext'

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function Badge({ color = 'blue', children }) {
  const colors = {
    blue:   { bg: '#eff6ff', color: '#2563eb' },
    green:  { bg: '#f0fdf4', color: '#16a34a' },
    red:    { bg: '#fef2f2', color: '#dc2626' },
    yellow: { bg: '#fffbeb', color: '#d97706' },
    gray:   { bg: '#f1f5f9', color: '#475569' },
    purple: { bg: '#f5f3ff', color: '#7c3aed' },
  }
  const c = colors[color] || colors.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {children}
    </span>
  )
}

function Card({ children, style = {} }) {
  return (
    <div className="card" style={{
      background: '#fff', borderRadius: 12, padding: 20,
      border: '1px solid var(--border)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color = '#2563eb' }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: color + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{label}</div>
      </div>
    </Card>
  )
}

function SeverityBadge({ severity }) {
  if (severity === 'error')   return <Badge color="red">Error</Badge>
  if (severity === 'warning') return <Badge color="yellow">Warning</Badge>
  return <Badge color="blue">Info</Badge>
}

function Modal({ open, onClose, title, children, width = 600 }) {
  if (!open) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflow: 'auto', padding: 28,
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <XCircle size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, margin: 0 }}>{hint}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 13, color: 'var(--ink)', background: '#fff',
  outline: 'none',
}

function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
      <span>Page {meta.current_page} of {meta.last_page} ({meta.total} total)</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-outline btn-sm" disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>
          Previous
        </button>
        <button className="btn btn-outline btn-sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}

// ─── TABS definition ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: BarChart2 },
  { id: 'settings',   label: 'Global Settings',  icon: Globe },
  { id: 'meta',       label: 'Meta Management',  icon: FileText },
  { id: 'templates',  label: 'SEO Templates',    icon: Tag },
  { id: 'keywords',   label: 'Keywords',         icon: Search },
  { id: 'redirects',  label: 'Redirects',        icon: ArrowRight },
  { id: 'audit',      label: 'Audit',            icon: ShieldCheck },
  { id: 'sitemap',    label: 'Sitemap',          icon: Map },
  { id: 'robots',     label: 'Robots.txt',       icon: Terminal },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminSeo() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
      <PageHeader
        title="SEO Management"
        description="Manage meta tags, redirects, sitemaps, audit results, and global SEO settings for GOSIKA."
        breadcrumbs={[
          { label: 'SEO', to: '/admin/seo' },
          { label: 'Management' },
        ]}
      />

      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: '#fff', padding: 6, borderRadius: 12,
        border: '1px solid var(--border)', overflowX: 'auto', flexWrap: 'nowrap',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 8, border: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--ink)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard'  && <DashboardTab toast={toast} />}
      {activeTab === 'settings'   && <GlobalSettingsTab toast={toast} />}
      {activeTab === 'meta'       && <MetaManagementTab toast={toast} />}
      {activeTab === 'templates'  && <TemplatesTab toast={toast} />}
      {activeTab === 'keywords'   && <KeywordsTab toast={toast} />}
      {activeTab === 'redirects'  && <RedirectsTab toast={toast} />}
      {activeTab === 'audit'      && <AuditTab toast={toast} />}
      {activeTab === 'sitemap'    && <SitemapTab toast={toast} />}
      {activeTab === 'robots'     && <RobotsTxtTab toast={toast} />}
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ toast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/dashboard', { skipCache: true })
      setData(res.data?.data)
    } catch {
      toast.error('Failed to load SEO dashboard.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading dashboard...</div>
  if (!data) return null

  const { meta_total, redirect_count, template_count, keyword_count, audit_summary, meta_counts } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <SummaryCard icon={FileText}    label="Configured Meta"     value={meta_total}      color="#2563eb" />
        <SummaryCard icon={ArrowRight}  label="Active Redirects"    value={redirect_count}  color="#7c3aed" />
        <SummaryCard icon={Tag}         label="Active Templates"     value={template_count}  color="#0891b2" />
        <SummaryCard icon={Search}      label="Active Keywords"      value={keyword_count}   color="#16a34a" />
        <SummaryCard icon={XCircle}     label="Audit Errors"        value={audit_summary?.error}   color="#dc2626" />
        <SummaryCard icon={AlertTriangle} label="Audit Warnings"    value={audit_summary?.warning} color="#d97706" />
        <SummaryCard icon={Info}        label="Audit Info"          value={audit_summary?.info}    color="#64748b" />
        <SummaryCard icon={CheckCircle2} label="Resolved Issues"    value={audit_summary?.resolved} color="#16a34a" />
      </div>

      {Object.keys(meta_counts || {}).length > 0 && (
        <Card>
          <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Meta Records by Entity Type</h4>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(meta_counts).map(([type, count]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#f8fafc', borderRadius: 8, padding: '8px 14px',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>{type}</span>
                <Badge color="blue">{count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Global Settings Tab ──────────────────────────────────────────────────────

function GlobalSettingsTab({ toast }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/settings', { skipCache: true })
      setForm(res.data?.data || {})
    } catch {
      toast.error('Failed to load SEO settings.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/seo/settings', form)
      toast.success('SEO settings saved.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>

  return (
    <Card>
      <h4 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 800 }}>Global SEO Settings</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <FormField label="Default Title Suffix" hint='e.g. " | GOSIKA"'>
          <input style={inputStyle} value={form['seo.default_title_suffix'] ?? ''} onChange={e => set('seo.default_title_suffix', e.target.value)} placeholder=" | GOSIKA" />
        </FormField>
        <FormField label="Title Separator" hint='e.g. " | "'>
          <input style={inputStyle} value={form['seo.title_separator'] ?? ''} onChange={e => set('seo.title_separator', e.target.value)} placeholder=" | " />
        </FormField>
        <FormField label="Default Robots">
          <select style={inputStyle} value={form['seo.default_robots'] ?? 'index,follow'} onChange={e => set('seo.default_robots', e.target.value)}>
            <option value="index,follow">index, follow</option>
            <option value="noindex,nofollow">noindex, nofollow</option>
            <option value="index,nofollow">index, nofollow</option>
            <option value="noindex,follow">noindex, follow</option>
          </select>
        </FormField>
        <FormField label="Twitter Card Type">
          <select style={inputStyle} value={form['seo.twitter_card'] ?? 'summary_large_image'} onChange={e => set('seo.twitter_card', e.target.value)}>
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
          </select>
        </FormField>
        <FormField label="Product Title Template" hint="Placeholders: {product_name}, {title_suffix}, {category_name}">
          <input style={inputStyle} value={form['seo.product_title_template'] ?? ''} onChange={e => set('seo.product_title_template', e.target.value)} />
        </FormField>
        <FormField label="Category Title Template" hint="Placeholders: {category_name}, {title_suffix}">
          <input style={inputStyle} value={form['seo.category_title_template'] ?? ''} onChange={e => set('seo.category_title_template', e.target.value)} />
        </FormField>
        <FormField label="Store Title Template" hint="Placeholders: {store_name}, {title_suffix}">
          <input style={inputStyle} value={form['seo.store_title_template'] ?? ''} onChange={e => set('seo.store_title_template', e.target.value)} />
        </FormField>
      </div>

      <h5 style={{ margin: '24px 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Search Engine Verification Tokens</h5>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <FormField label="Google Verification">
          <input style={inputStyle} value={form['seo.google_verification'] ?? ''} onChange={e => set('seo.google_verification', e.target.value)} placeholder="google-site-verification=..." />
        </FormField>
        <FormField label="Bing Verification">
          <input style={inputStyle} value={form['seo.bing_verification'] ?? ''} onChange={e => set('seo.bing_verification', e.target.value)} placeholder="msvalidate.01=..." />
        </FormField>
        <FormField label="Yandex Verification">
          <input style={inputStyle} value={form['seo.yandex_verification'] ?? ''} onChange={e => set('seo.yandex_verification', e.target.value)} placeholder="yandex-verification=..." />
        </FormField>
      </div>

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </Card>
  )
}

// ─── Meta Management Tab ──────────────────────────────────────────────────────

function MetaManagementTab({ toast }) {
  const [items, setItems]     = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ entity_type: '', search: '', page: 1 })
  const [modal, setModal]     = useState(null) // null | 'edit'
  const [editing, setEditing] = useState({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/meta', {
        params: { entity_type: f.entity_type || undefined, search: f.search || undefined, page: f.page },
        skipCache: true,
      })
      setItems(res.data?.data || [])
      setPagination(res.data?.meta?.pagination || null)
    } catch {
      toast.error('Failed to load meta records.')
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing({ entity_type: 'product', robots: 'index,follow', twitter_card: 'summary_large_image', is_noindex: false, is_nofollow: false })
    setModal('edit')
  }

  const openEdit = (item) => {
    setEditing({ ...item })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/admin/seo/meta', editing)
      toast.success('Meta record saved.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save meta.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meta record?')) return
    try {
      await api.delete('/admin/seo/meta/' + id)
      toast.success('Meta record deleted.')
      load()
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const e = editing
  const set = (k, v) => setEditing(p => ({ ...p, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <select
              style={{ ...inputStyle, maxWidth: 160 }}
              value={filter.entity_type}
              onChange={ev => { const f = { ...filter, entity_type: ev.target.value, page: 1 }; setFilter(f); load(f) }}
            >
              <option value="">All Types</option>
              {['product','category','store','cms_page','homepage'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, maxWidth: 240 }}
              placeholder="Search meta title..."
              value={filter.search}
              onChange={ev => setFilter(p => ({ ...p, search: ev.target.value }))}
              onKeyDown={ev => { if (ev.key === 'Enter') { const f = { ...filter, page: 1 }; load(f) } }}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Meta
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Entity Type','Entity ID','Meta Title','Robots','noindex','Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No records found.</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px' }}><Badge color="blue">{item.entity_type}</Badge></td>
                    <td style={{ padding: '10px', color: 'var(--muted)' }}>{item.entity_id ?? 'global'}</td>
                    <td style={{ padding: '10px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.meta_title || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                    <td style={{ padding: '10px' }}><code style={{ fontSize: 11 }}>{item.robots}</code></td>
                    <td style={{ padding: '10px' }}>{item.is_noindex ? <Badge color="red">noindex</Badge> : <Badge color="green">index</Badge>}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Edit2 size={12} /> Edit
                        </button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item.id)} style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={pagination} onPage={p => { const f = { ...filter, page: p }; setFilter(f); load(f) }} />
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={e.id ? 'Edit Meta' : 'Add Meta'} width={680}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Entity Type *">
            <select style={inputStyle} value={e.entity_type || ''} onChange={ev => set('entity_type', ev.target.value)}>
              {['product','category','store','cms_page','homepage'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Entity ID" hint="Leave blank for homepage/global">
            <input style={inputStyle} type="number" value={e.entity_id || ''} onChange={ev => set('entity_id', ev.target.value ? parseInt(ev.target.value) : null)} placeholder="e.g. 42" />
          </FormField>
          <FormField label="Meta Title">
            <input style={inputStyle} value={e.meta_title || ''} onChange={ev => set('meta_title', ev.target.value)} maxLength={200} />
            <div style={{ fontSize: 10, color: (e.meta_title?.length || 0) > 60 ? '#d97706' : 'var(--muted)', marginTop: 2 }}>{e.meta_title?.length || 0}/200 (ideal: 50–60)</div>
          </FormField>
          <FormField label="Meta Keywords">
            <input style={inputStyle} value={e.meta_keywords || ''} onChange={ev => set('meta_keywords', ev.target.value)} maxLength={500} />
          </FormField>
        </div>
        <FormField label="Meta Description">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} value={e.meta_description || ''} onChange={ev => set('meta_description', ev.target.value)} maxLength={500} />
          <div style={{ fontSize: 10, color: (e.meta_description?.length || 0) > 160 ? '#d97706' : 'var(--muted)', marginTop: 2 }}>{e.meta_description?.length || 0}/500 (ideal: 120–160)</div>
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Canonical URL">
            <input style={inputStyle} value={e.canonical_url || ''} onChange={ev => set('canonical_url', ev.target.value)} />
          </FormField>
          <FormField label="Robots">
            <select style={inputStyle} value={e.robots || 'index,follow'} onChange={ev => set('robots', ev.target.value)}>
              <option value="index,follow">index, follow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,follow">noindex, follow</option>
            </select>
          </FormField>
          <FormField label="OG Image URL">
            <input style={inputStyle} value={e.og_image || ''} onChange={ev => set('og_image', ev.target.value)} />
          </FormField>
          <FormField label="Twitter Card">
            <select style={inputStyle} value={e.twitter_card || 'summary_large_image'} onChange={ev => set('twitter_card', ev.target.value)}>
              <option value="summary">Summary</option>
              <option value="summary_large_image">Summary Large Image</option>
            </select>
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!e.is_noindex} onChange={ev => set('is_noindex', ev.target.checked)} />
            No Index
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!e.is_nofollow} onChange={ev => set('is_nofollow', ev.target.checked)} />
            No Follow
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Meta'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

const PLACEHOLDERS = {
  product:  ['{product_name}', '{title_suffix}', '{category_name}', '{brand_name}', '{price}', '{app_name}'],
  category: ['{category_name}', '{title_suffix}', '{app_name}'],
  store:    ['{store_name}', '{title_suffix}', '{app_name}'],
  page:     ['{page_title}', '{title_suffix}', '{app_name}'],
}

function TemplatesTab({ toast }) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/templates', { skipCache: true })
      setItems(res.data?.data || [])
    } catch {
      toast.error('Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing({ entity_type: 'product', is_default: false, is_active: true })
    setModal('edit')
  }

  const openEdit = (item) => { setEditing({ ...item }); setModal('edit') }

  const handleSave = async () => {
    if (!editing.name || !editing.title_template) {
      toast.error('Name and title template are required.')
      return
    }
    setSaving(true)
    try {
      await api.post('/admin/seo/templates', editing)
      toast.success('Template saved.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await api.delete('/admin/seo/templates/' + id)
      toast.success('Template deleted.')
      load()
    } catch {
      toast.error('Failed to delete template.')
    }
  }

  const e = editing
  const set = (k, v) => setEditing(p => ({ ...p, [k]: v }))
  const insertPlaceholder = (ph) => set('title_template', (e.title_template || '') + ph)
  const hints = PLACEHOLDERS[e.entity_type] || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>SEO Templates</h4>
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> New Template
          </button>
        </div>

        {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>No templates yet.</div>}
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: '#fafafa', gap: 12, flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{item.name}</span>
                    <Badge color="blue">{item.entity_type}</Badge>
                    {item.is_default && <Badge color="green">Default</Badge>}
                    {!item.is_active && <Badge color="gray">Inactive</Badge>}
                  </div>
                  <code style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>{item.title_template}</code>
                  {item.description_template && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{item.description_template.slice(0, 80)}{item.description_template.length > 80 ? '...' : ''}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}>
                    <Edit2 size={12} />
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item.id)} style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={e.id ? 'Edit Template' : 'New Template'} width={640}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Template Name *">
            <input style={inputStyle} value={e.name || ''} onChange={ev => set('name', ev.target.value)} />
          </FormField>
          <FormField label="Entity Type *">
            <select style={inputStyle} value={e.entity_type || 'product'} onChange={ev => set('entity_type', ev.target.value)}>
              {['product','category','store','page'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>Available placeholders (click to insert):</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {hints.map(ph => (
              <button key={ph} type="button" onClick={() => insertPlaceholder(ph)} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
                background: '#f8fafc', cursor: 'pointer', fontFamily: 'monospace',
              }}>{ph}</button>
            ))}
          </div>
        </div>

        <FormField label="Title Template *" hint={`Preview: ${(e.title_template || '').replace(/{(\w+)}/g, m => m)} (${(e.title_template || '').length} chars)`}>
          <input style={inputStyle} value={e.title_template || ''} onChange={ev => set('title_template', ev.target.value)} maxLength={300} />
        </FormField>

        <FormField label="Description Template" hint="Optional — leave blank to use entity description">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} value={e.description_template || ''} onChange={ev => set('description_template', ev.target.value)} maxLength={600} />
        </FormField>

        <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!e.is_default} onChange={ev => set('is_default', ev.target.checked)} />
            Default for entity type
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={e.is_active !== false} onChange={ev => set('is_active', ev.target.checked)} />
            Active
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Keywords Tab ─────────────────────────────────────────────────────────────

function KeywordsTab({ toast }) {
  const [items, setItems]     = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ search: '', search_intent: '', language: '', page: 1 })
  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/keywords', {
        params: {
          search: f.search || undefined,
          search_intent: f.search_intent || undefined,
          language: f.language || undefined,
          page: f.page,
        },
        skipCache: true,
      })
      setItems(res.data?.data || [])
      setPagination(res.data?.meta?.pagination || null)
    } catch {
      toast.error('Failed to load keywords.')
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing({ language: 'en', priority: 5, is_active: true })
    setModal('edit')
  }

  const openEdit = (item) => { setEditing({ ...item }); setModal('edit') }

  const handleSave = async () => {
    if (!editing.keyword) { toast.error('Keyword is required.'); return }
    setSaving(true)
    try {
      await api.post('/admin/seo/keywords', editing)
      toast.success('Keyword saved.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save keyword.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this keyword?')) return
    try {
      await api.delete('/admin/seo/keywords/' + id)
      toast.success('Keyword deleted.')
      load()
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const e = editing
  const set = (k, v) => setEditing(p => ({ ...p, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <input
              style={{ ...inputStyle, maxWidth: 200 }}
              placeholder="Search keyword..."
              value={filter.search}
              onChange={ev => setFilter(p => ({ ...p, search: ev.target.value }))}
              onKeyDown={ev => { if (ev.key === 'Enter') { const f = { ...filter, page: 1 }; setFilter(f); load(f) } }}
            />
            <select style={{ ...inputStyle, maxWidth: 160 }} value={filter.search_intent} onChange={ev => { const f = { ...filter, search_intent: ev.target.value, page: 1 }; setFilter(f); load(f) }}>
              <option value="">All Intents</option>
              {['informational','navigational','transactional','commercial'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <select style={{ ...inputStyle, maxWidth: 100 }} value={filter.language} onChange={ev => { const f = { ...filter, language: ev.target.value, page: 1 }; setFilter(f); load(f) }}>
              <option value="">All Languages</option>
              <option value="en">EN</option>
              <option value="ne">NE</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Keyword
          </button>
        </div>

        {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Keyword','Language','Intent','Entity Type','Priority','Status','Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No keywords found.</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{item.keyword}</td>
                    <td style={{ padding: '10px' }}><Badge color="gray">{item.language}</Badge></td>
                    <td style={{ padding: '10px' }}>{item.search_intent ? <Badge color="purple">{item.search_intent}</Badge> : '—'}</td>
                    <td style={{ padding: '10px', color: 'var(--muted)' }}>{item.entity_type || '—'}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5,6,7,8,9,10].slice(0, item.priority).map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>{item.is_active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item.id)} style={{ color: '#dc2626', borderColor: '#fca5a5' }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={pagination} onPage={p => { const f = { ...filter, page: p }; setFilter(f); load(f) }} />
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={e.id ? 'Edit Keyword' : 'Add Keyword'} width={540}>
        <FormField label="Keyword *">
          <input style={inputStyle} value={e.keyword || ''} onChange={ev => set('keyword', ev.target.value)} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Language">
            <select style={inputStyle} value={e.language || 'en'} onChange={ev => set('language', ev.target.value)}>
              <option value="en">English</option>
              <option value="ne">Nepali</option>
            </select>
          </FormField>
          <FormField label="Search Intent">
            <select style={inputStyle} value={e.search_intent || ''} onChange={ev => set('search_intent', ev.target.value)}>
              <option value="">None</option>
              {['informational','navigational','transactional','commercial'].map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </FormField>
          <FormField label="Entity Type">
            <select style={inputStyle} value={e.entity_type || ''} onChange={ev => set('entity_type', ev.target.value)}>
              <option value="">General</option>
              {['product','category','store','cms_page'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Priority (1–10)">
            <input style={inputStyle} type="number" min="1" max="10" value={e.priority ?? 5} onChange={ev => set('priority', parseInt(ev.target.value))} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} value={e.notes || ''} onChange={ev => set('notes', ev.target.value)} />
        </FormField>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={e.is_active !== false} onChange={ev => set('is_active', ev.target.checked)} />
          Active
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Redirects Tab ────────────────────────────────────────────────────────────

function RedirectsTab({ toast }) {
  const [items, setItems]     = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState({ search: '', page: 1 })
  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState({})
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await api.get('/admin/seo/redirects', {
        params: { search: f.search || undefined, page: f.page },
        skipCache: true,
      })
      setItems(res.data?.data || [])
      setPagination(res.data?.meta?.pagination || null)
    } catch {
      toast.error('Failed to load redirects.')
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditing({ redirect_type: 301, is_active: true }); setModal('edit') }
  const openEdit   = (item) => { setEditing({ ...item }); setModal('edit') }

  const handleSave = async () => {
    if (!editing.source_path || !editing.target_path) { toast.error('Source and target paths are required.'); return }
    setSaving(true)
    try {
      await api.post('/admin/seo/redirects', editing)
      toast.success('Redirect saved.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save redirect.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this redirect?')) return
    try {
      await api.delete('/admin/seo/redirects/' + id)
      toast.success('Redirect deleted.')
      load()
    } catch { toast.error('Failed to delete.') }
  }

  const e   = editing
  const set = (k, v) => setEditing(p => ({ ...p, [k]: v }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...inputStyle, maxWidth: 280 }}
            placeholder="Search source or target..."
            value={filter.search}
            onChange={ev => setFilter(p => ({ ...p, search: ev.target.value }))}
            onKeyDown={ev => { if (ev.key === 'Enter') { const f = { ...filter, page: 1 }; setFilter(f); load(f) } }}
          />
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add Redirect
          </button>
        </div>

        {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Source Path','Target Path','Type','Hits','Status','Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>No redirects found.</td></tr>
                )}
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.source_path}</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: 12, color: '#16a34a', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.target_path}</td>
                    <td style={{ padding: '10px' }}><Badge color={item.redirect_type === 301 ? 'blue' : 'yellow'}>{item.redirect_type}</Badge></td>
                    <td style={{ padding: '10px', color: 'var(--muted)' }}>{item.hit_count?.toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{item.is_active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDelete(item.id)} style={{ color: '#dc2626', borderColor: '#fca5a5' }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={pagination} onPage={p => { const f = { ...filter, page: p }; setFilter(f); load(f) }} />
      </Card>

      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title={e.id ? 'Edit Redirect' : 'Add Redirect'} width={560}>
        <FormField label="Source Path *" hint="e.g. /old-product-url">
          <input style={inputStyle} value={e.source_path || ''} onChange={ev => set('source_path', ev.target.value)} placeholder="/old-url" />
        </FormField>
        <FormField label="Target Path *" hint="e.g. /products/new-slug">
          <input style={inputStyle} value={e.target_path || ''} onChange={ev => set('target_path', ev.target.value)} placeholder="/products/new-slug" />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Redirect Type">
            <select style={inputStyle} value={e.redirect_type || 301} onChange={ev => set('redirect_type', parseInt(ev.target.value))}>
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </FormField>
          <FormField label="Notes">
            <input style={inputStyle} value={e.notes || ''} onChange={ev => set('notes', ev.target.value)} maxLength={255} />
          </FormField>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={e.is_active !== false} onChange={ev => set('is_active', ev.target.checked)} />
          Active
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Redirect'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ toast }) {
  const [items, setItems]     = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [filter, setFilter]   = useState({ severity: '', entity_type: '', is_resolved: 'false', page: 1 })

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const params = {
        page: f.page,
        severity: f.severity || undefined,
        entity_type: f.entity_type || undefined,
        is_resolved: f.is_resolved !== '' ? f.is_resolved : undefined,
      }
      const res = await api.get('/admin/seo/audit', { params, skipCache: true })
      setItems(res.data?.data || [])
      setPagination(res.data?.meta?.pagination || null)
    } catch {
      toast.error('Failed to load audit results.')
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { load() }, [load])

  const handleRunAudit = async () => {
    setRunning(true)
    try {
      const res = await api.post('/admin/seo/audit/run', {})
      toast.success(`Audit complete. ${res.data?.data?.run_result?.created || 0} new issues found.`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Audit failed.')
    } finally {
      setRunning(false)
    }
  }

  const handleResolve = async (id) => {
    try {
      await api.post('/admin/seo/audit/' + id + '/resolve', {})
      toast.success('Marked as resolved.')
      load()
    } catch { toast.error('Failed to resolve.') }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <select style={{ ...inputStyle, maxWidth: 140 }} value={filter.severity} onChange={ev => { const f = { ...filter, severity: ev.target.value, page: 1 }; setFilter(f); load(f) }}>
              <option value="">All Severities</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <select style={{ ...inputStyle, maxWidth: 150 }} value={filter.entity_type} onChange={ev => { const f = { ...filter, entity_type: ev.target.value, page: 1 }; setFilter(f); load(f) }}>
              <option value="">All Entities</option>
              {['product','category','store','cms_page'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select style={{ ...inputStyle, maxWidth: 140 }} value={filter.is_resolved} onChange={ev => { const f = { ...filter, is_resolved: ev.target.value, page: 1 }; setFilter(f); load(f) }}>
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
              <option value="">All</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleRunAudit} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={running ? 'spin' : ''} /> {running ? 'Running...' : 'Run Audit'}
          </button>
        </div>

        {loading ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                <CheckCircle2 size={40} color="#16a34a" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                No issues found.
              </div>
            )}
            {items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: item.is_resolved ? '#f8fafc' : '#fff',
              }}>
                <div style={{ paddingTop: 2 }}><SeverityBadge severity={item.severity} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Badge color="gray">{item.entity_type}</Badge>
                    {item.entity_id && <span style={{ fontSize: 11, color: 'var(--muted)' }}>#{item.entity_id}</span>}
                    <code style={{ fontSize: 10, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{item.issue_type}</code>
                    {item.is_resolved && <Badge color="green">Resolved</Badge>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{item.description}</div>
                  {item.recommendation && (
                    <div style={{ fontSize: 12, color: '#2563eb', fontStyle: 'italic' }}>→ {item.recommendation}</div>
                  )}
                  {item.entity_url && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}><code>{item.entity_url}</code></div>
                  )}
                </div>
                {!item.is_resolved && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleResolve(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Check size={12} /> Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination meta={pagination} onPage={p => { const f = { ...filter, page: p }; setFilter(f); load(f) }} />
      </Card>
    </div>
  )
}

// ─── Sitemap Tab ──────────────────────────────────────────────────────────────

function SitemapTab({ toast }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await api.get('/admin/seo/sitemap', { skipCache: true })
        setData(res.data?.data)
      } catch {
        toast.error('Failed to load sitemap data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  const copyToClipboard = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Failed to copy.')
    }
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>
  if (!data) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Sitemap Index</h4>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0',
          marginBottom: 20,
        }}>
          <Globe size={18} color="#16a34a" />
          <code style={{ fontSize: 13, flex: 1 }}>{data.sitemap_index_url}</code>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => copyToClipboard(data.sitemap_index_url, 'index')}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {copied === 'index' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            {copied === 'index' ? 'Copied!' : 'Copy'}
          </button>
          <a href={data.sitemap_index_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExternalLink size={12} /> Open
          </a>
        </div>

        <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>Individual Sitemaps</h5>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(data.sitemaps || []).map((sitemap) => (
            <div key={sitemap.type} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: '#fafafa',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Map size={16} color="#2563eb" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize', color: 'var(--ink)' }}>{sitemap.type}</div>
                <code style={{ fontSize: 11, color: 'var(--muted)' }}>{sitemap.url}</code>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => copyToClipboard(sitemap.url, sitemap.type)}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {copied === sitemap.type ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                {copied === sitemap.type ? 'Copied!' : 'Copy'}
              </button>
              <a href={sitemap.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={12} /> Open
              </a>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Submitting to Search Engines</h4>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 8px' }}>1. Submit your sitemap index URL to <strong>Google Search Console</strong> under Indexing → Sitemaps.</p>
          <p style={{ margin: '0 0 8px' }}>2. Submit to <strong>Bing Webmaster Tools</strong> under Sitemaps.</p>
          <p style={{ margin: 0 }}>3. Include the sitemap reference in your <strong>robots.txt</strong> (already configured).</p>
        </div>
      </Card>
    </div>
  )
}

// ─── Robots.txt Tab ───────────────────────────────────────────────────────────

function RobotsTxtTab({ toast }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await api.get('/admin/seo/robots', { skipCache: true })
        setContent(res.data?.data?.content || '')
      } catch {
        toast.error('Failed to load robots.txt.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/admin/seo/robots', { content })
      toast.success('Robots.txt saved.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save robots.txt.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>robots.txt Editor</h4>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>Controls which pages search engine crawlers can access. Use {'{app_url}'} as a placeholder for the site URL.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)',
            fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7,
            color: 'var(--ink)', background: '#1e293b', color: '#e2e8f0',
            resize: 'vertical', minHeight: 320, outline: 'none',
          }}
        />

        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>
            <AlertTriangle size={14} /> Important
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#78350f' }}>
            Changes are served live. Avoid blocking key pages or the sitemap. The Disallow directives are case-sensitive.
          </p>
        </div>
      </Card>
    </div>
  )
}
