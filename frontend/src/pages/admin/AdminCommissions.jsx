import React, { useState, useEffect } from 'react'
import {
  Edit, RefreshCw, FolderTree, RotateCcw, Tag
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import FilterBar from '../../components/admin/FilterBar'
import { useToast } from '../../context/ToastContext'

export default function AdminCommissions() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [defaultRate, setDefaultRate] = useState(10)
  const [search, setSearch] = useState('')
  const [editTarget, setEditTarget] = useState(null)
  const [newRate, setNewRate] = useState('')
  const [saving, setSaving] = useState(false)

  const loadCommissions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/commissions')
      setCategories(api.unwrapList(res.data))
      setDefaultRate(Number(res.data?.meta?.defaults?.default_rate ?? 10))
    } catch (err) {
      toast.error('Failed to load commission configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommissions()
  }, [])

  const handleUpdateRate = async (e) => {
    e.preventDefault()
    if (!editTarget || newRate === '') return

    setSaving(true)
    try {
      await api.put(`/admin/commissions/categories/${editTarget.id}`, {
        commission_rate: Number(newRate)
      })
      toast.success(`Commission for "${editTarget.name}" set to ${newRate}%`)
      setEditTarget(null)
      setNewRate('')
      loadCommissions()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission rate.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (item) => {
    if (!window.confirm(`Reset commission rate for "${item.name}" to the platform default?`)) return
    try {
      await api.delete(`/admin/commissions/categories/${item.id}`)
      toast.success(`"${item.name}" now uses the default rate.`)
      loadCommissions()
    } catch (err) {
      toast.error('Failed to reset commission rate.')
    }
  }

  const filterCategories = (roots) => {
    const q = search.trim().toLowerCase()
    if (!q) return roots
    const matches = (cat) => cat.name.toLowerCase().includes(q)
    const filterRoot = (root) => {
      const kids = (root.children || []).filter(matches)
      return matches(root) || kids.length > 0
        ? { ...root, children: kids }
        : null
    }
    return roots.map(filterRoot).filter(Boolean)
  }

  const visible = filterCategories(categories)

  const renderRow = (item, depth = 0, isLast = false) => (
    <div key={`${item.id}-${depth}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '11px 16px',
          borderBottom: '1px solid var(--border)',
          background: depth === 0 ? '#fafcff' : '#ffffff'
        }}
      >
        <div style={{ width: depth * 26 + 2 }} />
        <div style={{ width: 30, height: 30, borderRadius: 8, background: depth === 0 ? '#fff0e6' : '#f1f5f9', color: depth === 0 ? '#ff5500' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FolderTree size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: depth === 0 ? 700 : 600, fontSize: 13.5, color: 'var(--ink)' }}>
            {item.name}
            {depth === 0 && (
              <span className="chip chip-sm" style={{ marginLeft: 10, background: '#eff6ff', color: '#2563eb', fontSize: 10, fontWeight: 700 }}>
                Category
              </span>
            )}
            {depth > 0 && (
              <span className="chip chip-sm" style={{ marginLeft: 10, background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 700 }}>
                Subcategory
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={11} /> Tax {item.tax_rate ?? 0}%
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: item.commission_rate !== null ? '#c2410c' : 'var(--ink)' }}>
            {item.commission_rate !== null ? `${item.commission_rate}%` : `${item.effective_rate}%`}
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginLeft: 6 }}>
              (effective)
            </span>
          </div>
          {item.commission_rate !== null && (
            <div style={{ fontSize: 10.5, color: '#d97706', fontWeight: 700 }}>
              Custom rule · default {defaultRate}%
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.commission_rate !== null && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => handleReset(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => {
              setEditTarget(item)
              setNewRate(item.commission_rate !== null ? String(item.commission_rate) : String(item.effective_rate))
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ff5500', borderColor: 'rgba(255,85,0,0.35)', background: 'rgba(255,85,0,0.04)' }}
          >
            <Edit size={12} /> Set Rate
          </button>
        </div>
      </div>
      {(item.children || []).map(child => renderRow(child, depth + 1))}
    </div>
  )

  const totalRules = categories.reduce((n, c) => n + (c.commission_rate !== null ? 1 : 0) + (c.children || []).filter(ch => ch.commission_rate !== null).length, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Commission Rules by Category"
        description="Take-rate schedules configured per category and subcategory — products inherit the nearest rule up the tree."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Commission Rules' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadCommissions}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
        <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform Default Rate</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginTop: 4 }}>{defaultRate}%</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Applied when no category rule matches</div>
        </div>
        <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Configured Rules</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#ff5500', marginTop: 4 }}>{totalRules}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Custom category / subcategory rates</div>
        </div>
        <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top-level Categories</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)', marginTop: 4 }}>{categories.length}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>Available for rate configuration</div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search category or subcategory..."
        onReset={() => setSearch('')}
      />

      <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: '#161d2b',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}
        >
          <span style={{ flex: 1 }}>CATEGORY STRUCTURE</span>
          <span style={{ width: 130, textAlign: 'right' }}>COMMISSION RATE</span>
          <span style={{ width: 150, textAlign: 'right' }}>ACTIONS</span>
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Loading commission rules…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>No categories found.</div>
        ) : (
          visible.map(root => renderRow(root, 0))
        )}
      </div>

      {/* Set Rate Modal */}
      {editTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setEditTarget(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  Commission Rate
                </h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{editTarget.name}</div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateRate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Commission Rate (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 14, fontWeight: 700 }}
                  value={newRate}
                  onChange={e => setNewRate(e.target.value)}
                  placeholder={`Default ${defaultRate}%`}
                  required
                />
                <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '6px 0 0' }}>
                  If unset for a subcategory, the nearest parent rule (or the {defaultRate}% default) applies.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}