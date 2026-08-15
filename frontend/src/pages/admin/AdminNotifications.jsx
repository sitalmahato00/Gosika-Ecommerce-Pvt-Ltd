import React, { useState } from 'react'
import { Bell, Send, Users, Store, ShieldAlert, CheckCircle2, MessageSquare, Clock } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_LOGS = [
  { id: 1, title: 'Dashain Festival Delivery Schedule Update', target: 'All Customers', channel: 'In-App + Email', date: '2026-08-15 09:00', sentBy: 'Admin (System)' },
  { id: 2, title: 'New Commission Policy Effective Next Month', target: 'All Vendors', channel: 'In-App + SMS', date: '2026-08-14 14:30', sentBy: 'Finance Admin' },
  { id: 3, title: 'Monsoon Delivery Advisory for Hill Districts', target: 'Delivery Partners', channel: 'Push Notification', date: '2026-08-13 11:15', sentBy: 'Operations Admin' },
  { id: 4, title: 'Payment Gateway Maintenance Complete', target: 'All Users', channel: 'System Broadcast', date: '2026-08-12 04:00', sentBy: 'Super Admin' },
]

export default function AdminNotifications() {
  const toast = useToast()
  const [logs, setLogs] = useState(SAMPLE_LOGS)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    target: 'All Customers',
    channel: 'In-App Notification',
    message: '',
  })

  const handleBroadcast = (e) => {
    e.preventDefault()
    const newLog = {
      id: logs.length + 1,
      title: form.title,
      target: form.target,
      channel: form.channel,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      sentBy: 'Super Admin',
    }
    setLogs([newLog, ...logs])
    setBroadcastOpen(false)
    setForm({ title: '', target: 'All Customers', channel: 'In-App Notification', message: '' })
    toast.success(`Broadcast notification sent to ${form.target}`)
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Notification Center & Broadcasts</h1>
          <p>Send instant announcements and monitor automatic system alerts to customers, vendors, and partners</p>
        </div>
        <button className="btn btn-primary" onClick={() => setBroadcastOpen(true)}>
          <Send size={15} /> Send Broadcast Notification
        </button>
      </div>

      {/* Broadcast Logs Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={16} color="var(--primary)" /> Broadcast & Notification History
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Notification Headline</th>
                <th>Target Audience</th>
                <th>Channel</th>
                <th>Sender</th>
                <th>Dispatched At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>
                    <span className="font-semibold text-sm text-ink">{l.title}</span>
                  </td>
                  <td>
                    <span className="chip chip-sm">{l.target}</span>
                  </td>
                  <td className="muted text-sm">{l.channel}</td>
                  <td className="muted text-sm">{l.sentBy}</td>
                  <td className="muted text-xs">{l.date}</td>
                  <td>
                    <span className="badge badge-success">Delivered</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Modal */}
      {broadcastOpen && (
        <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Dispatch Broadcast Notification">
          <form onSubmit={handleBroadcast}>
            <div className="form-group">
              <label className="label">Notification Title / Subject</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Special Holiday Delivery Notice"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="label">Target Audience</label>
                <select className="select" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
                  <option value="All Customers">All Registered Customers</option>
                  <option value="All Vendors">All Active Vendors</option>
                  <option value="Delivery Partners">Delivery & Rider Partners</option>
                  <option value="All Users">All Platform Users</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Delivery Channel</label>
                <select className="select" value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                  <option value="In-App Notification">In-App Notification Feed</option>
                  <option value="In-App + Email">In-App + Email Broadcast</option>
                  <option value="Push Notification">Mobile Push Notification</option>
                  <option value="SMS Alert">SMS Text Message</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Message Body</label>
              <textarea
                className="textarea"
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Enter message text that will be received by the target group…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setBroadcastOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><Send size={14} /> Send Broadcast Now</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
