import React, { useState } from 'react'
import { Headphones, Search, MessageSquare, Clock, CheckCircle2, AlertTriangle, Eye, Send, Lock } from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_TICKETS = [
  { id: 'TKT-1042', subject: 'Refund delay for cancelled order #ORD-8910', customer: 'Ramesh Shrestha', type: 'Customer', orderId: 'ORD-8910', priority: 'High', status: 'open', date: '2026-08-15 10:30', messages: [{ sender: 'Ramesh Shrestha', time: '10:30 AM', text: 'I cancelled my order 3 days ago but haven’t received the Khalti refund yet.' }] },
  { id: 'TKT-1041', subject: 'Payout account verification query', customer: 'Kathmandu Handicrafts', type: 'Vendor', priority: 'Medium', status: 'in_progress', date: '2026-08-15 09:15', messages: [{ sender: 'Kathmandu Handicrafts', time: '09:15 AM', text: 'We submitted our updated NIC Asia bank document. Please check.' }] },
  { id: 'TKT-1040', subject: 'Wrong product variant received', customer: 'Pooja Thapa', type: 'Customer', orderId: 'ORD-8892', priority: 'Urgent', status: 'waiting', date: '2026-08-14 16:40', messages: [{ sender: 'Pooja Thapa', time: '04:40 PM', text: 'I ordered size M but received XL. Please help arrange an exchange.' }] },
  { id: 'TKT-1039', subject: 'Product listing approval delay', customer: 'Himalaya Organics', type: 'Vendor', priority: 'Low', status: 'resolved', date: '2026-08-14 11:20', messages: [{ sender: 'Himalaya Organics', time: '11:20 AM', text: 'Our herbal tea product has been pending review for 48 hours.' }] },
]

export default function AdminSupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState(SAMPLE_TICKETS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    const updated = {
      ...selectedTicket,
      status: 'waiting',
      messages: [...selectedTicket.messages, { sender: 'GOSIKA Support Team', time: 'Just now', text: replyText }]
    }
    setTickets(tickets.map((t) => t.id === selectedTicket.id ? updated : t))
    setSelectedTicket(updated)
    setReplyText('')
    toast.success('Reply sent to customer')
  }

  const changeStatus = (tId, newStatus) => {
    const updated = { ...selectedTicket, status: newStatus }
    setTickets(tickets.map((t) => t.id === tId ? updated : t))
    setSelectedTicket(updated)
    toast.success(`Ticket status marked as ${newStatus}`)
  }

  const filtered = tickets.filter((t) => {
    const matchesStatus = !statusFilter || t.status === statusFilter
    const matchesSearch = !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Support Desk & Helpdesk</h1>
          <p>Manage incoming customer and vendor inquiries, resolutions, and escalations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {['', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map((st) => (
          <button
            key={st}
            className={`tab ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === '' ? 'All Tickets' : st.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search tickets by subject, ID, or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Subject</th>
              <th>Requester</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td><span className="font-semibold">{t.id}</span></td>
                <td>
                  <div className="font-medium text-sm text-ink">{t.subject}</div>
                  {t.orderId && <div className="muted text-xs">Ref: #{t.orderId}</div>}
                </td>
                <td className="text-sm">{t.customer}</td>
                <td>
                  <span className={`chip chip-sm ${t.type === 'Vendor' ? 'chip-navy' : ''}`}>{t.type}</span>
                </td>
                <td>
                  <span className={`badge ${t.priority === 'Urgent' ? 'badge-danger' : t.priority === 'High' ? 'badge-warning' : 'badge-default'}`}>
                    {t.priority}
                  </span>
                </td>
                <td><StatusBadge status={t.status} /></td>
                <td className="muted text-xs">{t.date}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => setSelectedTicket(t)}
                  >
                    <Eye size={12} /> Respond
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ticket Details & Chat Modal */}
      {selectedTicket && (
        <Modal open={!!selectedTicket} onClose={() => setSelectedTicket(null)} title={`${selectedTicket.id}: ${selectedTicket.subject}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded" style={{ background: 'var(--bg)', padding: 12 }}>
              <div className="text-xs muted">
                Requester: <strong>{selectedTicket.customer}</strong> ({selectedTicket.type})
                {selectedTicket.orderId && <> · Order: <strong>#{selectedTicket.orderId}</strong></>}
              </div>
              <div className="flex gap-1">
                {['open', 'in_progress', 'resolved', 'closed'].map((st) => (
                  <button
                    key={st}
                    className={`btn ${selectedTicket.status === st ? 'btn-primary' : 'btn-ghost'} btn-xs`}
                    onClick={() => changeStatus(selectedTicket.id, st)}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', padding: 8, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {selectedTicket.messages.map((m, i) => (
                <div key={i} style={{ padding: 10, background: m.sender.includes('Support') ? 'var(--primary-50)' : 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{m.sender}</span>
                    <span className="muted">{m.time}</span>
                  </div>
                  <p className="text-sm m-0" style={{ lineHeight: 1.5 }}>{m.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply}>
              <div className="form-group mb-2">
                <label className="label">Send Response to Customer</label>
                <textarea
                  className="textarea"
                  rows={3}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official reply here…"
                />
              </div>
              <div className="flex justify-between items-center">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedTicket(null)}>Close</button>
                <button type="submit" className="btn btn-primary btn-sm"><Send size={13} /> Send Reply</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}
