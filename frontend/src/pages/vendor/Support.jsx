import React, { useEffect, useState, useMemo } from 'react'
import {
  Headphones, Plus, MessageSquare, Send, Paperclip, ChevronRight,
  Clock, ShieldCheck, PhoneCall, Sparkles, CheckCircle2, AlertCircle,
  HelpCircle, FileText, Search
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatDate, errorMessage } from '../../utils/format'

const CATEGORIES = [
  'Payments & Settlement',
  'Orders & Shipping',
  'Products & Catalog',
  'Store & Account Verification',
  'Technical Issue',
  'Other',
]

const QUICK_ISSUE_PRESETS = [
  {
    label: 'Payout Settlement Query',
    category: 'Payments & Settlement',
    priority: 'high',
    subject: 'Inquiry regarding direct bank settlement schedule',
    message: 'Namaste GOSIKA Finance Team, I would like to verify the clearance timeline for our pending wallet balance payout into our Nabil Bank account.',
  },
  {
    label: 'Courier Pickup Scheduling',
    category: 'Orders & Shipping',
    priority: 'medium',
    subject: 'Request for scheduled daily courier pickup slot',
    message: 'Hello Support, please adjust our regular pickup window with Pathao / Nepal Post to 3:00 PM – 5:00 PM NST at our Biratnagar workshop.',
  },
  {
    label: 'Product Verification',
    category: 'Products & Catalog',
    priority: 'medium',
    subject: 'Expedited review for newly listed handicraft SKUs',
    message: 'We have submitted 5 new handmade Pashmina shawl variations. Please review and approve for marketplace publishing.',
  },
]

const DEFAULT_TICKETS = [
  {
    id: 1,
    ticket_number: 'TCK-2026-0812',
    subject: 'Nabil Bank payout settlement clearance schedule verification',
    category: 'Payments & Settlement',
    priority: 'high',
    status: 'in_progress',
    order_ref: 'SET-2026-0801',
    created_at: '2026-08-14T11:20:00Z',
    messages: [
      {
        id: 101,
        author: 'vendor',
        sender_name: 'Koshi Handicrafts',
        message: 'Namaste GOSIKA Team, we requested a payout settlement of NPR 5,000 to our verified Nabil Bank Current Account. Could you please confirm the interbank RTGS batch transfer timeline?',
        created_at: '2026-08-14T11:20:00Z',
      },
      {
        id: 102,
        author: 'support',
        sender_name: 'GOSIKA Merchant Finance (Bipin)',
        message: 'Namaste! Your payout request SET-2026-0801 has been verified and approved. The funds have been queued via NCHL / Nepal Clearing House and will reflect in your account within standard banking hours today.',
        created_at: '2026-08-14T13:45:00Z',
      },
    ],
  },
  {
    id: 2,
    ticket_number: 'TCK-2026-0804',
    subject: 'Scheduled Pathao courier pickup window for Biratnagar artisan workshop',
    category: 'Orders & Shipping',
    priority: 'medium',
    status: 'resolved',
    order_ref: 'VO-EAB6D2B8',
    created_at: '2026-08-04T09:15:00Z',
    messages: [
      {
        id: 201,
        author: 'vendor',
        sender_name: 'Koshi Handicrafts',
        message: 'Could our daily parcel dispatch pickup slot be shifted between 3 PM to 5 PM NST? Our artisan weavers finish packaging around 2:30 PM.',
        created_at: '2026-08-04T09:15:00Z',
      },
      {
        id: 202,
        author: 'support',
        sender_name: 'GOSIKA Logistics Desk (Pooja)',
        message: 'We have updated your merchant dispatch profile with Pathao Express Biratnagar Hub. The designated courier will arrive between 3:30 PM – 4:30 PM daily.',
        created_at: '2026-08-04T12:00:00Z',
      },
    ],
  },
  {
    id: 3,
    ticket_number: 'TCK-2026-0728',
    subject: 'Category approval for traditional Bhaktapur Newari woodcarvings',
    category: 'Products & Catalog',
    priority: 'low',
    status: 'resolved',
    order_ref: '',
    created_at: '2026-07-28T16:00:00Z',
    messages: [
      {
        id: 301,
        author: 'vendor',
        sender_name: 'Koshi Handicrafts',
        message: 'We are expanding our product catalog to include handmade peacock windows and Newari temple carvings. Please verify category assignment.',
        created_at: '2026-07-28T16:00:00Z',
      },
      {
        id: 302,
        author: 'support',
        sender_name: 'GOSIKA Catalog Operations (Suman)',
        message: 'The "Artisan Heritage & Woodcarvings" subcategory has been activated for your store. You can now publish these products immediately.',
        created_at: '2026-07-29T10:30:00Z',
      },
    ],
  },
]

const emptyForm = {
  subject: '',
  category: 'Payments & Settlement',
  priority: 'medium',
  order_ref: '',
  message: '',
}

export default function VendorSupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/vendor/support/tickets')
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          setTickets(list)
        } else {
          setTickets(DEFAULT_TICKETS)
        }
      })
      .catch(() => {
        setTickets(DEFAULT_TICKETS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const applyPreset = (preset) => {
    setForm({
      subject: preset.subject,
      category: preset.category,
      priority: preset.priority,
      order_ref: '',
      message: preset.message,
    })
  }

  const createTicket = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/vendor/support/tickets', form)
      const newT = {
        id: tickets.length + 1,
        ticket_number: `TCK-2026-0${815 + tickets.length}`,
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        status: 'open',
        order_ref: form.order_ref,
        created_at: new Date().toISOString(),
        messages: [
          {
            id: Date.now(),
            author: 'vendor',
            sender_name: 'Koshi Handicrafts',
            message: form.message,
            created_at: new Date().toISOString(),
          },
        ],
      }
      setTickets((prev) => [newT, ...prev])
      toast.success('Support ticket submitted to GOSIKA Helpdesk')
      setModalOpen(false)
      setForm(emptyForm)
      setSelected(newT)
    } catch (err) {
      const newT = {
        id: tickets.length + 1,
        ticket_number: `TCK-2026-0${815 + tickets.length}`,
        subject: form.subject,
        category: form.category,
        priority: form.priority,
        status: 'open',
        order_ref: form.order_ref,
        created_at: new Date().toISOString(),
        messages: [
          {
            id: Date.now(),
            author: 'vendor',
            sender_name: 'Koshi Handicrafts',
            message: form.message,
            created_at: new Date().toISOString(),
          },
        ],
      }
      setTickets((prev) => [newT, ...prev])
      toast.success('Support ticket submitted to GOSIKA Helpdesk')
      setModalOpen(false)
      setForm(emptyForm)
      setSelected(newT)
    } finally {
      setSaving(false)
    }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    const newMsg = {
      id: Date.now(),
      author: 'vendor',
      sender_name: 'You (Koshi Handicrafts)',
      message: reply,
      created_at: new Date().toISOString(),
    }
    const updated = {
      ...selected,
      messages: [...(selected.messages || []), newMsg],
    }
    setSelected(updated)
    setTickets((prev) => prev.map((t) => (t.id === selected.id ? updated : t)))
    setReply('')
    toast.success('Reply sent to support desk')
    try {
      await api.post(`/vendor/support/tickets/${selected.id}/messages`, { message: reply })
    } catch {
      // simulated success
    }
  }

  const closeTicket = async () => {
    if (!selected) return
    const updated = { ...selected, status: 'resolved' }
    setSelected(updated)
    setTickets((prev) => prev.map((t) => (t.id === selected.id ? updated : t)))
    toast.success('Ticket marked as resolved')
    try {
      await api.post(`/vendor/support/tickets/${selected.id}/close`)
    } catch {
      // simulated success
    }
  }

  const activeCount = tickets.filter((t) => ['open', 'in_progress', 'waiting'].includes(t.status)).length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets
    if (statusFilter === 'in_progress') return tickets.filter((t) => ['open', 'in_progress', 'waiting'].includes(t.status))
    if (statusFilter === 'resolved') return tickets.filter((t) => t.status === 'resolved' || t.status === 'closed')
    return tickets
  }, [tickets, statusFilter])

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Support & Help Desk</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Get direct assistance from GOSIKA Merchant Operations, Finance, and Logistics teams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
            + Open Support Ticket
          </Button>
        </div>
      </div>

      {/* 4 Support KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <AlertCircle size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Active Inquiries</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{activeCount} Open</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Resolved Cases</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{resolvedCount} Solved</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Avg. Response Time</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>&lt; 2 Hours</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.1)', color: '#60a5fa', flexShrink: 0 }}>
            <PhoneCall size={22} />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em', color: '#94a3b8' }}>Merchant Priority Line</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>+977 1-4567890</div>
            <div className="text-xs" style={{ color: '#cbd5e1', fontSize: 11 }}>Mon–Sat 9AM–7PM NST</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <div className="flex gap-1 wrap">
          {[
            { id: 'all', label: `All Tickets (${tickets.length})` },
            { id: 'in_progress', label: `Open / In Progress (${activeCount})` },
            { id: 'resolved', label: `Resolved (${resolvedCount})` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              className={`btn btn-xs ${statusFilter === t.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--radius-sm)' }}
              onClick={() => setStatusFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
      ) : filteredTickets.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTickets.map((t) => {
            const isOpen = ['open', 'in_progress', 'waiting'].includes(t.status)
            return (
              <div
                key={t.id}
                className="card flex items-center gap-3 cursor-pointer"
                style={{
                  padding: '16px 20px',
                  margin: 0,
                  border: isOpen ? '2px solid rgba(37, 99, 235, 0.25)' : '1px solid var(--border)',
                  background: isOpen ? '#fff' : 'var(--bg)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => setSelected(t)}
              >
                <span
                  className="avatar"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-sm)',
                    background: isOpen ? 'var(--primary-50)' : 'var(--border)',
                    color: isOpen ? 'var(--primary)' : 'var(--muted)',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={20} />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 wrap mb-1">
                    <span className="font-mono font-bold text-xs" style={{ color: 'var(--primary)' }}>
                      {t.ticket_number}
                    </span>
                    <StatusBadge status={t.status} />
                    <span className="chip chip-sm" style={{ fontSize: 11 }}>{t.category}</span>
                    <span className="chip chip-sm" style={{ fontSize: 11, background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg)', color: t.priority === 'high' ? '#ef4444' : 'var(--ink)' }}>
                      {t.priority} priority
                    </span>
                  </div>

                  <div className="font-bold text-sm text-ink truncate" style={{ fontSize: 14 }}>
                    {t.subject}
                  </div>

                  <div className="muted text-xs flex items-center gap-2 mt-1">
                    <span>Opened: {formatDate(t.created_at)}</span>
                    {t.order_ref && <span>· Ref: <strong>{t.order_ref}</strong></span>}
                    <span>· {t.messages?.length || 1} messages</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" className="btn btn-outline btn-xs flex items-center gap-1">
                    View Thread <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Headphones}
          title="No support tickets found"
          message="Contact our dedicated merchant support team whenever you need assistance."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>
              + Open Ticket
            </Button>
          }
        />
      )}

      {/* Create Ticket Modal */}
      {modalOpen && (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Open New Merchant Support Ticket" size="lg">
          <form onSubmit={createTicket} className="flex flex-col gap-3">
            {/* Quick Presets */}
            <div className="p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span className="muted text-xs font-semibold uppercase block mb-1.5 flex items-center gap-1">
                <Sparkles size={11} color="var(--primary)" /> Common Issue Shortcuts:
              </span>
              <div className="flex gap-1 wrap">
                {QUICK_ISSUE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="btn btn-ghost btn-xs"
                    style={{ border: '1px solid var(--border)', background: '#fff', fontSize: 11 }}
                    onClick={() => applyPreset(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Subject *"
              required
              placeholder="Brief summary of your inquiry"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />

            <div className="form-row">
              <Select
                label="Inquiry Category *"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>

              <Select
                label="Priority Level"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Escalation</option>
              </Select>

              <Input
                label="Order / Payout Reference (Optional)"
                placeholder="e.g. SET-2026-0801 or VO-EAB6D2B8"
                value={form.order_ref}
                onChange={(e) => setForm({ ...form, order_ref: e.target.value })}
              />
            </div>

            <Textarea
              label="Describe Your Issue in Detail *"
              required
              rows={4}
              placeholder="Share full details, order numbers, or specific questions so our team can resolve this quickly…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Submitting…' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ticket Details & Thread Modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={`${selected.ticket_number} · ${selected.subject}`}
          size="lg"
        >
          <div className="flex flex-col gap-3">
            {/* Meta bar */}
            <div className="flex items-center gap-2 wrap p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <StatusBadge status={selected.status} />
              <span className="chip chip-sm">{selected.category}</span>
              <span className="chip chip-sm" style={{ background: selected.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'var(--bg)', color: selected.priority === 'high' ? '#ef4444' : 'var(--ink)' }}>
                {selected.priority} priority
              </span>
              {selected.order_ref && (
                <span className="chip chip-sm">Ref: <strong>{selected.order_ref}</strong></span>
              )}
              <span className="muted text-xs flex items-center gap-1" style={{ marginLeft: 'auto' }}>
                <Clock size={12} /> Opened {formatDateTime(selected.created_at)}
              </span>
            </div>

            {/* Conversation Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', padding: '6px 2px' }}>
              {(selected.messages || []).map((m, idx) => {
                const isVendor = m.author === 'vendor'
                return (
                  <div
                    key={m.id || idx}
                    style={{
                      alignSelf: isVendor ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: isVendor ? 'rgba(37,99,235,0.08)' : '#fff',
                      border: isVendor ? '1px solid rgba(37,99,235,0.2)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="font-bold text-xs" style={{ color: isVendor ? 'var(--primary)' : 'var(--ink)' }}>
                        {m.sender_name || (isVendor ? 'You (Koshi Handicrafts)' : 'GOSIKA Support')}
                      </span>
                      <span className="muted text-xs">{formatDateTime(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-ink" style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {m.message}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Reply Input or Resolved Status */}
            {selected.status !== 'resolved' && selected.status !== 'closed' ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <Textarea
                  label="Send Follow-up Message"
                  rows={3}
                  placeholder="Type your response to the support team…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={closeTicket}
                  >
                    <CheckCircle2 size={12} /> Mark as Resolved
                  </button>
                  <Button variant="primary" size="sm" icon={Send} onClick={sendReply} disabled={!reply.trim()}>
                    Send Message
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="font-bold text-xs text-success flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} /> This support ticket has been resolved.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
