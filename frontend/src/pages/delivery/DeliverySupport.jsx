import React, { useState } from 'react'
import {
  Headphones, Phone, MessageSquare, AlertTriangle, Send,
  CheckCircle2, Clock, ShieldCheck, MapPin, Plus
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

const SUPPORT_TICKETS = [
  { id: 'TKT-RD-401', subject: 'Customer phone unreachable in Lazimpat area', status: 'resolved', date: '15 Aug 2026 10:00', resolution: 'Customer contacted via alternate WhatsApp number and parcel delivered.' },
  { id: 'TKT-RD-388', subject: 'Fragile ceramic pottery packaging verified', status: 'closed', date: '14 Aug 2026 14:20', resolution: 'Double-layer bubble wrap confirmed at pickup.' },
]

export default function DeliverySupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState(SUPPORT_TICKETS)
  const [reportOpen, setReportOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [orderId, setOrderId] = useState('')
  const [priority, setPriority] = useState('Medium')

  const handleCreateReport = (e) => {
    e.preventDefault()
    const newT = {
      id: `TKT-RD-${Math.floor(400 + Math.random() * 100)}`,
      subject,
      status: 'open',
      date: 'Just now',
      resolution: 'Dispatched to Kathmandu Central Hub Manager.',
    }
    setTickets([newT, ...tickets])
    setReportOpen(false)
    setSubject('')
    setDetails('')
    setOrderId('')
    toast.success('Incident / Dispatch ticket submitted to Central Hub!')
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Dispatch Hub Support & Roadside Help
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Direct helpline to Central Logistics Hub, roadside assistance, and delivery incident reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setReportOpen(true)}
          >
            <Plus size={14} /> Report Delivery Issue
          </button>
        </div>
      </div>

      {/* Emergency Hotline Banner */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <div className="card flex items-center justify-between" style={{ padding: 18, margin: 0, background: '#fef2f2', border: '1px solid #fecaca' }}>
          <div>
            <span className="muted text-xs font-bold uppercase" style={{ color: '#dc2626' }}>Dispatch Emergency Hotline</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#991b1b', marginTop: 2 }}>+977 1-4400991</div>
            <div className="muted text-xs mt-0.5" style={{ color: '#b91c1c' }}>Live Support: 7:00 AM – 9:00 PM</div>
          </div>
          <a href="tel:+97714400991" className="btn btn-danger btn-sm flex items-center gap-1">
            <Phone size={13} /> Call Dispatch
          </a>
        </div>

        <div className="card flex items-center justify-between" style={{ padding: 18, margin: 0, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div>
            <span className="muted text-xs font-bold uppercase" style={{ color: '#2563eb' }}>Roadside & Bike Assistance</span>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#1e40af', marginTop: 2 }}>+977 980-1122334</div>
            <div className="muted text-xs mt-0.5" style={{ color: '#1d4ed8' }}>Breakdown & Fuel Emergency</div>
          </div>
          <a href="tel:+9779801122334" className="btn btn-primary btn-sm flex items-center gap-1">
            <Phone size={13} /> Call Rescue
          </a>
        </div>
      </div>

      {/* Recent Support Cases */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
            <MessageSquare size={16} color="var(--primary)" /> Incident & Inquiry Tickets
          </h3>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Ticket Ref</th>
                <th>Subject / Issue</th>
                <th>Status</th>
                <th>Logged At</th>
                <th>Resolution Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs">{t.id}</span>
                  </td>
                  <td>
                    <div className="font-bold text-sm text-ink">{t.subject}</div>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'open' ? 'badge-warning' : 'badge-success'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="muted text-xs">{t.date}</td>
                  <td className="text-xs muted">{t.resolution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Issue Modal */}
      {reportOpen && (
        <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Delivery Incident / Issue">
          <form onSubmit={handleCreateReport} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Issue Subject <span className="req">*</span></label>
              <input
                className="input font-bold"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Customer not answering phone at delivery address"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Associated Order # (Optional)</label>
                <input
                  className="input"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-2026-98101"
                />
              </div>
              <div className="form-group">
                <label className="label">Urgency Priority</label>
                <select
                  className="select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">Urgent / Need Immediate Callback</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Detailed Explanation <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what happened at the delivery location or on the road…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setReportOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
                <Send size={13} /> Submit Incident Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
