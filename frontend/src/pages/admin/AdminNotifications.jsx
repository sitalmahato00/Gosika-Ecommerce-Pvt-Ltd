import React, { useState, useMemo } from 'react'
import {
  Bell, Send, Users, Store, ShieldAlert, CheckCircle2, MessageSquare,
  Clock, Download, Eye, Plus, Radio, Smartphone, Mail, AlertTriangle,
  RefreshCw, Check, Zap, Layers, Filter, Search
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_LOGS = [
  {
    id: 1,
    title: 'Dashain Festival Delivery Schedule & Cutoff Update',
    target: 'All Customers',
    target_type: 'customers',
    channel: 'In-App + Email',
    priority: 'High',
    reach: '12,800 Buyers',
    date: '2026-08-15 09:00',
    sentBy: 'Operations Admin',
    message: 'Namaste! Please note that all orders placed before 10th Ashwin (Bada Dashain) will be guaranteed for delivery before Ghatasthapana. Express shipping options available across Kathmandu Valley, Pokhara, and Biratnagar.',
  },
  {
    id: 2,
    title: 'New Commission Policy & Automated Settlement Cycle',
    target: 'All Vendors',
    target_type: 'vendors',
    channel: 'In-App + SMS',
    priority: 'Important',
    reach: '84 Merchants',
    date: '2026-08-14 14:30',
    sentBy: 'Finance Admin',
    message: 'Standard marketplace commission rate is now set to 10%. Bi-weekly payouts will be automatically credited to your verified bank account via ConnectIPS NCHL on the 1st and 16th of each month.',
  },
  {
    id: 3,
    title: 'Monsoon Delivery Advisory for Highway & Hill Districts',
    target: 'Delivery Partners',
    target_type: 'couriers',
    channel: 'Push Notification',
    priority: 'Urgent',
    reach: '142 Couriers',
    date: '2026-08-13 11:15',
    sentBy: 'Logistics Desk',
    message: 'Please exercise caution and maintain weather monitoring along the Narayanghat-Mugling road and BP Highway corridors. Deliveries may experience minor transit delays due to rainfall.',
  },
  {
    id: 4,
    title: 'ConnectIPS & eSewa Payment Gateway Upgrade Complete',
    target: 'All Users',
    target_type: 'all',
    channel: 'System Broadcast',
    priority: 'Normal',
    reach: '14,250 Users',
    date: '2026-08-12 04:00',
    sentBy: 'Super Admin',
    message: 'Scheduled maintenance on core payment infrastructure has been completed successfully. All instant wallet and banking checkouts are operational with enhanced speed.',
  },
  {
    id: 5,
    title: 'Artisan Quality Packaging Guidelines 2026',
    target: 'All Vendors',
    target_type: 'vendors',
    channel: 'In-App Notification',
    priority: 'Normal',
    reach: '84 Merchants',
    date: '2026-08-10 16:00',
    sentBy: 'Quality Assurance',
    message: 'Ensure all fragile ceramic pottery, wooden sculptures, and delicate pashmina shawls are dispatched with GOSIKA official tamper-evident seals and bubble wrap.',
  },
]

export default function AdminNotifications() {
  const toast = useToast()
  const [logs, setLogs] = useState(SAMPLE_LOGS)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    title: '',
    target: 'All Customers',
    target_type: 'customers',
    channel: 'In-App + Email',
    priority: 'Normal',
    message: '',
  })

  const handleBroadcast = (e) => {
    e.preventDefault()
    const targetCounts = {
      'All Customers': '12,800 Buyers',
      'All Vendors': '84 Merchants',
      'Delivery Partners': '142 Couriers',
      'All Users': '14,250 Users',
    }
    const newLog = {
      id: Date.now(),
      title: form.title,
      target: form.target,
      target_type: form.target === 'All Customers' ? 'customers' : form.target === 'All Vendors' ? 'vendors' : form.target === 'Delivery Partners' ? 'couriers' : 'all',
      channel: form.channel,
      priority: form.priority,
      reach: targetCounts[form.target] || '1,000+ Users',
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sentBy: 'Super Admin',
      message: form.message,
    }
    setLogs([newLog, ...logs])
    setBroadcastOpen(false)
    setForm({ title: '', target: 'All Customers', target_type: 'customers', channel: 'In-App + Email', priority: 'Normal', message: '' })
    toast.success(`Broadcast dispatched successfully to ${newLog.reach}!`)
  }

  const resendBroadcast = (log) => {
    toast.success(`Broadcast "${log.title}" re-dispatched to ${log.target}`)
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter && l.target_type !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchTitle = l.title.toLowerCase().includes(q)
        const matchTarget = l.target.toLowerCase().includes(q)
        const matchMsg = (l.message || '').toLowerCase().includes(q)
        if (!matchTitle && !matchTarget && !matchMsg) return false
      }
      return true
    })
  }, [logs, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Broadcast Headline', 'Target Group', 'Delivery Channel', 'Priority', 'Audience Reach', 'Dispatched At', 'Sender Admin', 'Message Content'],
      ...filtered.map((l) => [
        l.title,
        l.target,
        l.channel,
        l.priority,
        l.reach,
        l.date,
        l.sentBy,
        l.message,
      ])
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

  // Summary Metrics
  const totalBroadcasts = logs.length
  const totalAudience = '14,250+'

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
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
            onClick={() => setBroadcastOpen(true)}
          >
            <Send size={14} /> Send Broadcast Notification
          </button>
        </div>
      </div>

      {/* 4 Notification KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Dispatched Broadcasts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Bell size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalBroadcasts} Dispatches</div>
          <div className="muted text-xs mt-1">Multi-channel campaigns</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Audience Reach</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{totalAudience} Users</div>
          <div className="muted text-xs mt-1">Registered buyers & artisans</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivery Success</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>99.4% Rate</div>
          <div className="muted text-xs mt-1">SMS, Email & In-App push</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>In-App Open Rate</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Zap size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>68.2% Opened</div>
          <div className="muted text-xs mt-1">High notification engagement</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Broadcasts (${logs.length})` },
          { value: 'customers', label: `Customer Alerts (${logs.filter(l => l.target_type === 'customers').length})` },
          { value: 'vendors', label: `Vendor Notices (${logs.filter(l => l.target_type === 'vendors').length})` },
          { value: 'couriers', label: `Courier Bulletins (${logs.filter(l => l.target_type === 'couriers').length})` },
          { value: 'all', label: `System Broadcasts (${logs.filter(l => l.target_type === 'all').length})` },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search notifications by title or target audience…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} broadcast{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Broadcast History Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Notification Headline</th>
                <th>Target Audience</th>
                <th>Channel</th>
                <th>Sender Admin</th>
                <th>Dispatched At</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div
                      className="font-bold text-sm text-ink cursor-pointer hover:text-primary"
                      onClick={() => setSelectedLog(l)}
                    >
                      {l.title}
                    </div>
                    <div className="muted text-xs line-clamp-1" style={{ fontSize: 11, maxWidth: 420 }}>
                      {l.message}
                    </div>
                  </td>
                  <td>
                    <span className="chip chip-sm font-bold" style={{ fontSize: 11 }}>
                      {l.target}
                    </span>
                    <div className="muted text-xs mt-0.5" style={{ fontSize: 10 }}>{l.reach}</div>
                  </td>
                  <td>
                    <span className="muted text-xs font-semibold">{l.channel}</span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-ink">{l.sentBy}</span>
                  </td>
                  <td className="muted text-xs">
                    {l.date}
                  </td>
                  <td>
                    <span className="badge badge-success flex items-center gap-1" style={{ width: 'fit-content' }}>
                      <CheckCircle2 size={11} /> Delivered
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs flex items-center gap-1"
                        onClick={() => setSelectedLog(l)}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        title="Re-dispatch notification"
                        onClick={() => resendBroadcast(l)}
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Notification Modal */}
      {selectedLog && (
        <Modal
          open={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Broadcast Announcement Dossier"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="chip chip-sm font-bold">{selectedLog.target}</span>
                <span className="badge badge-success">Delivered to {selectedLog.reach}</span>
              </div>
              <div className="font-bold text-base text-ink mb-1">{selectedLog.title}</div>
              <div className="muted text-xs">Dispatched: <strong>{selectedLog.date}</strong> by <strong>{selectedLog.sentBy}</strong> via <strong>{selectedLog.channel}</strong></div>
            </div>

            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                <MessageSquare size={14} color="var(--primary)" /> Message Broadcast Body
              </h4>
              <p style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, margin: 0 }}>
                {selectedLog.message}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm flex items-center gap-1"
                onClick={() => {
                  resendBroadcast(selectedLog)
                  setSelectedLog(null)
                }}
              >
                <RefreshCw size={13} /> Re-send Broadcast
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Send Broadcast Modal */}
      {broadcastOpen && (
        <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Dispatch Broadcast Notification" size="md">
          <form onSubmit={handleBroadcast} className="flex flex-col gap-3">
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
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                >
                  <option value="All Customers">All Registered Customers (12,800+)</option>
                  <option value="All Vendors">All Active Artisan Vendors (84+)</option>
                  <option value="Delivery Partners">Courier & Rider Partners (142+)</option>
                  <option value="All Users">All Platform Users (14,250+)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Delivery Channel</label>
                <select
                  className="select"
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                >
                  <option value="In-App + Email">In-App + Email Broadcast</option>
                  <option value="In-App Notification">In-App Notification Bell</option>
                  <option value="Push Notification">Mobile Push Notification</option>
                  <option value="In-App + SMS">In-App + SMS Alert</option>
                  <option value="System Broadcast">System Modal Broadcast</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Priority Level</label>
              <select
                className="select"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Normal">Normal Announcement</option>
                <option value="Important">Important Policy / Operational Notice</option>
                <option value="Urgent">Urgent Critical Alert</option>
              </select>
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
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setBroadcastOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
                <Send size={14} /> Send Broadcast Now
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
