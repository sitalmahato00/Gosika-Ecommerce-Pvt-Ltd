import React, { useState } from 'react'
import {
  Bell, Send, Users, CheckCircle2, Download, Eye, Search
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDateTime, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Platform Users' },
  { value: 'customers', label: 'Customers' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'delivery', label: 'Delivery Partners' },
]

const CHANNEL_OPTIONS = [
  { value: 'in_app', label: 'In-App Notification' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push Notification' },
]

const emptyForm = () => ({
  title: '',
  message: '',
  channel: 'in_app',
  target_type: 'all',
  target_ids: '',
})

export default function AdminNotifications() {
  const toast = useToast()
  const [targetFilter, setTargetFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState(emptyForm())

  const fetchBroadcasts = (page, perPage) =>
    api.get('/admin/notifications', { params: { search, page, per_page: perPage } })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchBroadcasts, {
    pageSize: 10,
    deps: [search],
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const filtered = items.filter((l) => !targetFilter || l.target_type === targetFilter)

  const handleSend = (e) => {
    e.preventDefault()
    setSending(true)
    const payload = {
      title: form.title,
      message: form.message,
      channel: form.channel,
      target_type: form.target_type,
      target_ids: form.target_ids ? form.target_ids.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }
    api.post('/admin/notifications/send', payload)
      .then(() => {
        toast.success('Broadcast dispatched successfully')
        setComposeOpen(false)
        setForm(emptyForm())
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSending(false))
  }

  const exportCSV = () => {
    const rows = [
      ['Broadcast Headline', 'Target Type', 'Channel', 'Reach', 'Status', 'Dispatched At', 'Message Content'],
      ...filtered.map((l) => [
        l.title,
        l.target_type,
        l.channel,
        l.reach,
        l.status,
        l.sent_at || '',
        l.message,
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_notifications_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Notification ledger exported to CSV')
  }

  const totalReach = items.reduce((sum, l) => sum + (Number(l.reach) || 0), 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Notification Center & Broadcasts
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Send instant announcements, SMS push alerts, and monitor automatic system broadcasts to customers, vendors, and couriers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setComposeOpen(true)}
          >
            <Send size={14} /> Send Broadcast Notification
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Dispatched Broadcasts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Bell size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total} Dispatches</div>
          <div className="muted text-xs mt-1">Multi-channel campaigns</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Audience Reach (page)</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{totalReach.toLocaleString()} Users</div>
          <div className="muted text-xs mt-1">Current page reach</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: 'All Broadcasts' },
          { value: 'customers', label: 'Customer Alerts' },
          { value: 'vendors', label: 'Vendor Notices' },
          { value: 'delivery', label: 'Delivery Bulletins' },
          { value: 'all', label: 'System Broadcasts' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${targetFilter === t.value ? 'active' : ''}`}
            onClick={() => setTargetFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={applySearch} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search notifications by title…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <span className="muted text-xs font-semibold">
          {filtered.length} broadcast{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Notification Headline</th>
                  <th>Target Audience</th>
                  <th>Channel</th>
                  <th>Dispatched At</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6}><Skeleton height={22} /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState icon={Bell} title="No broadcasts found" message="No notifications match the current filters." />
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="font-bold text-sm text-ink cursor-pointer hover:text-primary" onClick={() => setSelected(l)}>
                          {l.title}
                        </div>
                        <div className="muted text-xs line-clamp-1" style={{ fontSize: 11, maxWidth: 420 }}>
                          {l.message}
                        </div>
                      </td>
                      <td>
                        <span className="chip chip-sm font-bold" style={{ fontSize: 11 }}>
                          {humanizeEnum(l.target_type)}
                        </span>
                        <div className="muted text-xs mt-0.5" style={{ fontSize: 10 }}>
                          {Number(l.reach) || 0} recipients
                        </div>
                      </td>
                      <td>
                        <span className="muted text-xs font-semibold">{humanizeEnum(l.channel)}</span>
                      </td>
                      <td className="muted text-xs">{formatDateTime(l.sent_at)}</td>
                      <td>
                        <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                          <CheckCircle2 size={11} /> {humanizeEnum(l.status)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" onClick={() => setSelected(l)}>
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />

      {selected && (
        <Modal open={!!selected} onClose={() => setSelected(null)} title="Broadcast Announcement Dossier" size="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="chip chip-sm font-bold">{humanizeEnum(selected.target_type)}</span>
                <span className="badge badge-success">Reach: {Number(selected.reach) || 0}</span>
              </div>
              <div className="font-bold text-base text-ink mb-1">{selected.title}</div>
              <div className="muted text-xs">
                Dispatched: <strong>{formatDateTime(selected.sent_at)}</strong> via <strong>{humanizeEnum(selected.channel)}</strong>
              </div>
            </div>

            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>Message Broadcast Body</h4>
              <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                {selected.message}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {composeOpen && (
        <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Dispatch Broadcast Notification" size="md">
          <form onSubmit={handleSend} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Notification Headline / Subject <span className="req">*</span></label>
              <input
                className="input font-bold"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Special Festive Delivery Cutoff Notice"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Target Audience Group</label>
                <select
                  className="select"
                  value={form.target_type}
                  onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                >
                  {TARGET_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Delivery Channel</label>
                <select
                  className="select"
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Target User IDs (comma-separated UUIDs, optional)</label>
              <input
                className="input font-mono"
                value={form.target_ids}
                onChange={(e) => setForm({ ...form, target_ids: e.target.value })}
                placeholder="e.g. 5e9f... , a1b2..."
              />
              <p className="helper">Leave empty to target every user in the selected group.</p>
            </div>

            <div className="form-group">
              <label className="label">Broadcast Message Content <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Type your official announcement that will be dispatched to the selected group…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setComposeOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1" disabled={sending}>
                <Send size={14} /> Send Broadcast Now
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
