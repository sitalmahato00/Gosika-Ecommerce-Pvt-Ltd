import React, { useState, useMemo } from 'react'
import {
  Headphones, Search, MessageSquare, Clock, CheckCircle2, AlertTriangle,
  Eye, Send, Lock, Plus, Download, User, Store, ShieldCheck,
  Star, Zap, MessageCircle, RefreshCw, FileText
} from 'lucide-react'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_TICKETS = [
  {
    id: 'TKT-1042',
    subject: 'Refund inquiry for cancelled Pashmina order via Khalti',
    customer: 'Ramesh Shrestha',
    phone: '+977 984-1234567',
    type: 'Customer',
    orderId: 'ORD-2026-98101',
    priority: 'High',
    status: 'open',
    date: '2026-08-15 10:30',
    messages: [
      { sender: 'Ramesh Shrestha', time: '10:30 AM', text: 'I cancelled my order 2 days ago but haven’t received the Khalti wallet refund yet. Can you please check the payment reference?' }
    ]
  },
  {
    id: 'TKT-1041',
    subject: 'Nabil Bank settlement account verification and ConnectIPS setup',
    customer: 'Koshi Handicrafts Pvt. Ltd.',
    phone: '+977 21-524901',
    type: 'Vendor',
    priority: 'Medium',
    status: 'in_progress',
    date: '2026-08-15 09:15',
    messages: [
      { sender: 'Koshi Handicrafts', time: '09:15 AM', text: 'We submitted our updated Nabil Bank Ltd account document and PAN certificate for the upcoming bi-weekly settlement cycle. Please verify.' },
      { sender: 'GOSIKA Financial Desk', time: '09:40 AM', text: 'Documents received. Our accounts team is verifying the bank account title match. We will approve by 2 PM.' }
    ]
  },
  {
    id: 'TKT-1040',
    subject: 'Request size exchange for handwoven Palpali Dhaka Saree',
    customer: 'Pooja Thapa',
    phone: '+977 986-2123456',
    type: 'Customer',
    orderId: 'ORD-2026-98074',
    priority: 'Urgent',
    status: 'waiting',
    date: '2026-08-14 16:40',
    messages: [
      { sender: 'Pooja Thapa', time: '04:40 PM', text: 'I received the Dhaka Saree but need an exchange for the blouse piece size. Can Pathao courier pick it up from Pokhara?' }
    ]
  },
  {
    id: 'TKT-1039',
    subject: 'Organic Orthodox Black Tea product listing review & approval',
    customer: 'Himalayan Organic Herbs & Tea',
    phone: '+977 27-520112',
    type: 'Vendor',
    priority: 'Low',
    status: 'resolved',
    date: '2026-08-14 11:20',
    messages: [
      { sender: 'Himalayan Organic Herbs', time: '11:20 AM', text: 'Our fresh orthodox tea batch from Ilam has been uploaded for listing review. Please approve the organic certificate tag.' },
      { sender: 'GOSIKA Catalog Team', time: '12:05 PM', text: 'Verified and approved! The organic tea listing is now live in the Food & Beverage category.' }
    ]
  },
  {
    id: 'TKT-1038',
    subject: 'Artisan VAT / PAN certificate renewal update',
    customer: 'Lalitpur Heritage Metal & Bronze',
    phone: '+977 1-5521980',
    type: 'Vendor',
    priority: 'Medium',
    status: 'resolved',
    date: '2026-08-13 15:10',
    messages: [
      { sender: 'Lalitpur Heritage', time: '03:10 PM', text: 'Uploaded fiscal year 2083/84 renewed tax clearance document.' },
      { sender: 'GOSIKA Compliance', time: '04:00 PM', text: 'Thank you Babu Ratna ji. Verified and active.' }
    ]
  },
]

const CANNED_RESPONSES = [
  'Namaste! We have verified your request and initiated the resolution.',
  'Your payment refund has been disbursed to your digital wallet with reference.',
  'Pathao courier logistics has been notified for parcel pickup.',
  'Your merchant catalog listing and documents have been verified and approved.',
]

export default function AdminSupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState(SAMPLE_TICKETS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: '',
    customer: '',
    phone: '',
    type: 'Customer',
    priority: 'Medium',
    message: '',
  })

  const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return
    const updated = {
      ...selectedTicket,
      status: 'waiting',
      messages: [
        ...selectedTicket.messages,
        { sender: 'GOSIKA Support Desk', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: replyText }
      ]
    }
    setTickets(tickets.map((t) => t.id === selectedTicket.id ? updated : t))
    setSelectedTicket(updated)
    setReplyText('')
    toast.success('Official reply dispatched to requester')
  }

  const handleCreateTicket = (e) => {
    e.preventDefault()
    const id = `TKT-${Math.floor(1043 + Math.random() * 100)}`
    const created = {
      id,
      subject: newTicket.subject,
      customer: newTicket.customer,
      phone: newTicket.phone || '+977 980-0000000',
      type: newTicket.type,
      priority: newTicket.priority,
      status: 'open',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      messages: [
        { sender: newTicket.customer, time: 'Just now', text: newTicket.message }
      ]
    }
    setTickets([created, ...tickets])
    toast.success(`Support ticket ${id} created successfully`)
    setCreateOpen(false)
    setNewTicket({ subject: '', customer: '', phone: '', type: 'Customer', priority: 'Medium', message: '' })
  }

  const changeStatus = (tId, newStatus) => {
    const updated = { ...selectedTicket, status: newStatus }
    setTickets(tickets.map((t) => t.id === tId ? updated : t))
    setSelectedTicket(updated)
    toast.success(`Ticket status updated to ${newStatus}`)
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchId = (t.id || '').toLowerCase().includes(q)
        const matchSub = (t.subject || '').toLowerCase().includes(q)
        const matchCust = (t.customer || '').toLowerCase().includes(q)
        const matchType = (t.type || '').toLowerCase().includes(q)
        if (!matchId && !matchSub && !matchCust && !matchType) return false
      }
      return true
    })
  }, [tickets, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Ticket ID', 'Subject', 'Requester Name', 'Phone', 'Type', 'Priority', 'Status', 'Date Created'],
      ...filtered.map((t) => [
        t.id,
        t.subject,
        t.customer,
        t.phone,
        t.type,
        t.priority,
        t.status,
        t.date,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_support_tickets_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Support tickets ledger exported to CSV')
  }

  // Aggregate Metrics
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const urgentCount = tickets.filter(t => t.priority === 'Urgent' && t.status !== 'resolved' && t.status !== 'closed').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Support Desk & Helpdesk Operations
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage incoming customer and artisan vendor inquiries, dispute mediations, and resolution escalations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={14} /> Create Ticket
          </button>
        </div>
      </div>

      {/* 4 Support KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Tickets</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Headphones size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{openCount} Open Cases</div>
          <div className="muted text-xs mt-1">Inquiries in active resolution</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: urgentCount > 0 ? '2px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#991b1b' }}>Urgent Escalations</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{urgentCount} High Priority</div>
          <div className="muted text-xs mt-1">Requires immediate response</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>First Response SLA</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>18 Minutes Avg</div>
          <div className="muted text-xs mt-1">Target: &lt; 30 mins</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Customer CSAT</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Star size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>4.9 / 5.0 ★</div>
          <div className="muted text-xs mt-1">98.2% positive resolution</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Tickets (${tickets.length})` },
          { value: 'open', label: `Open (${tickets.filter(t => t.status === 'open').length})` },
          { value: 'in_progress', label: `In Progress (${tickets.filter(t => t.status === 'in_progress').length})` },
          { value: 'waiting', label: `Waiting (${tickets.filter(t => t.status === 'waiting').length})` },
          { value: 'resolved', label: `Resolved (${tickets.filter(t => t.status === 'resolved').length})` },
          { value: 'closed', label: `Closed (${tickets.filter(t => t.status === 'closed').length})` },
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
            placeholder="Search tickets by subject, ID, or requester…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject & Case Context</th>
                <th>Requester</th>
                <th>Party Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span
                      className="font-mono font-bold text-primary text-xs"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTicket(t)}
                    >
                      {t.id}
                    </span>
                  </td>
                  <td>
                    <div
                      className="font-bold text-sm text-ink line-clamp-1"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTicket(t)}
                    >
                      {t.subject}
                    </div>
                    {t.orderId && (
                      <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>
                        Order Ref: #{t.orderId}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="font-semibold text-sm text-ink">{t.customer}</div>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{t.phone}</div>
                  </td>
                  <td>
                    <span className={`chip chip-sm font-bold ${t.type === 'Vendor' ? 'chip-navy' : ''}`} style={{ fontSize: 11 }}>
                      {t.type === 'Vendor' ? <Store size={11} style={{ display: 'inline', marginRight: 3 }} /> : <User size={11} style={{ display: 'inline', marginRight: 3 }} />}
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge font-bold"
                      style={{
                        background: t.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'High' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg)',
                        color: t.priority === 'Urgent' ? '#dc2626' : t.priority === 'High' ? '#d97706' : 'var(--ink)',
                      }}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="muted text-xs">
                    {t.date}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
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
      </div>

      {/* Ticket Details & Helpdesk Chat Modal */}
      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Support Case: ${selectedTicket.id}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Context Box */}
            <div className="card" style={{ background: 'var(--bg)', padding: 14, margin: 0 }}>
              <div className="flex justify-between items-center wrap gap-2 mb-2">
                <div className="font-bold text-sm text-ink">{selectedTicket.subject}</div>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <div className="flex justify-between items-center wrap gap-2 text-xs muted pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div>
                  Requester: <strong className="text-ink">{selectedTicket.customer}</strong> ({selectedTicket.type}) · {selectedTicket.phone}
                  {selectedTicket.orderId && <> · Order: <strong className="font-mono text-primary">#{selectedTicket.orderId}</strong></>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="muted">Status:</span>
                  {['open', 'in_progress', 'resolved', 'closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn ${selectedTicket.status === st ? 'btn-primary' : 'btn-ghost'} btn-xs`}
                      onClick={() => changeStatus(selectedTicket.id, st)}
                      style={{ fontSize: 10, padding: '2px 6px' }}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', padding: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              {selectedTicket.messages.map((m, i) => {
                const isStaff = m.sender.includes('GOSIKA') || m.sender.includes('Support') || m.sender.includes('Desk') || m.sender.includes('Team')
                return (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      background: isStaff ? 'var(--primary-50)' : 'var(--bg)',
                      borderLeft: isStaff ? '3px solid var(--primary)' : '3px solid #cbd5e1',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span style={{ color: isStaff ? 'var(--primary)' : 'var(--ink)' }}>{m.sender}</span>
                      <span className="muted font-normal">{m.time}</span>
                    </div>
                    <p className="text-xs text-ink m-0" style={{ lineHeight: 1.5 }}>{m.text}</p>
                  </div>
                )
              })}
            </div>

            {/* Canned Presets */}
            <div>
              <span className="muted text-xs font-semibold block mb-1">Quick Canned Responses:</span>
              <div className="flex flex-wrap gap-1">
                {CANNED_RESPONSES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-ghost btn-xs text-xs truncate"
                    style={{ maxWidth: 280, background: 'var(--bg)', fontSize: 11 }}
                    onClick={() => setReplyText(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="flex flex-col gap-2">
              <textarea
                className="textarea"
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your official helpdesk response here…"
              />
              <div className="flex justify-between items-center pt-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedTicket(null)}>Close</button>
                <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
                  <Send size={13} /> Dispatch Reply
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Create Ticket Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Support / Internal Ticket">
          <form onSubmit={handleCreateTicket} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Subject / Issue Title <span className="req">*</span></label>
              <input
                className="input"
                required
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="e.g. Courier delivery delay inquiry for Kathmandu Hub"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Requester Name <span className="req">*</span></label>
                <input
                  className="input"
                  required
                  value={newTicket.customer}
                  onChange={(e) => setNewTicket({ ...newTicket, customer: e.target.value })}
                  placeholder="e.g. Sunita Shakya"
                />
              </div>
              <div className="form-group">
                <label className="label">Contact Phone</label>
                <input
                  className="input"
                  value={newTicket.phone}
                  onChange={(e) => setNewTicket({ ...newTicket, phone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Party Type</label>
                <select
                  className="select"
                  value={newTicket.type}
                  onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value })}
                >
                  <option value="Customer">Buyer / Customer</option>
                  <option value="Vendor">Artisan Merchant / Vendor</option>
                  <option value="Courier">Logistics / Courier Partner</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority Level</label>
                <select
                  className="select"
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent Escalation</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Case Description & Details <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={3}
                required
                value={newTicket.message}
                onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                placeholder="Explain the inquiry or dispute in detail…"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm">Create Ticket</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
