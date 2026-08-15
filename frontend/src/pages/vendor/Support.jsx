import React, { useEffect, useState } from 'react'
import { Headphones, Plus, MessageSquare, Send, Paperclip, ChevronRight, Clock } from 'lucide-react'
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
import { formatDateTime, errorMessage } from '../../utils/format'

const CATEGORIES = [
  'Payments & Settlement',
  'Orders & Shipping',
  'Products',
  'Store & Account',
  'Technical Issue',
  'Other',
]

const emptyForm = { subject: '', category: 'Payments & Settlement', priority: 'medium', message: '' }

export default function VendorSupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/vendor/support/tickets').then((r) => {
      setTickets(r.data.data || [])
    }).catch(() => setTickets([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const createTicket = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const t = await api.post('/vendor/support/tickets', form)
      toast.success('Ticket created')
      setModalOpen(false)
      setForm(emptyForm)
      setSelected(t.data.data || null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    try {
      await api.post(`/vendor/support/tickets/${selected.id}/messages`, { message: reply })
      toast.success('Reply sent')
      setReply('')
      const t = await api.get(`/vendor/support/tickets/${selected.id}`)
      setSelected(t.data.data)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const openTicket = async (t) => {
    setSelected(t)
    try {
      const r = await api.get(`/vendor/support/tickets/${t.id}`)
      setSelected(r.data.data || t)
    } catch {
      /* fall back to list item */
    }
  }

  const closeTicket = async () => {
    try {
      await api.post(`/vendor/support/tickets/${selected.id}/close`)
      toast.success('Ticket closed')
      setSelected(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Support Center</h1>
          <p>Get help from the GOSIKA team</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>New Ticket</Button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : !tickets.length ? (
        <EmptyState
          icon={Headphones}
          title="No tickets yet"
          message="Contact our support team whenever you need help with your store."
          action={<Button variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Open a ticket</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tickets.map((t) => (
            <div key={t.id} className="card flex items-center gap-3" style={{ padding: 14 }}>
              <span className="thumb" style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(37,99,235,0.1)' }}>
                <MessageSquare size={18} color="var(--primary)" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 wrap">
                  <span className="font-medium" style={{ fontSize: 14 }}>{t.subject}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="muted text-xs">
                  {t.ticket_number || `#${String(t.id).slice(0, 6)}`} · {t.category} · {t.priority} priority · {formatDateTime(t.created_at)}
                </div>
              </div>
              <button className="btn btn-soft btn-sm" onClick={() => openTicket(t)}>
                View <ChevronRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create ticket modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New support ticket" size="lg">
        <form onSubmit={createTicket} className="flex flex-col gap-2">
          <Input label="Subject" required placeholder="Brief summary of your issue" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="form-row">
            <Select label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input label="Order reference (optional)" placeholder="e.g. GOS-123456" value={form.order_ref || ''} onChange={(e) => setForm({ ...form, order_ref: e.target.value })} />
          </div>
          <Textarea label="Describe your issue" required rows={4} placeholder="Share as much detail as possible…" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <Button type="submit" block disabled={saving}>
            {saving ? <Spinner size={15} color="#fff" /> : 'Submit ticket'}
          </Button>
        </form>
      </Modal>

      {/* Ticket detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.ticket_number ? `${selected.ticket_number} · ${selected.subject}` : 'Ticket'}
        size="lg"
        footer={
          selected && ['open', 'in_progress', 'waiting'].includes(selected.status) ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={closeTicket}>Close ticket</Button>
              <Button variant="primary" icon={Send} onClick={sendReply} disabled={!reply.trim()}>Send reply</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          )
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="flex items-center gap-2 wrap">
              <StatusBadge status={selected.status} />
              <span className="chip" style={{ fontSize: 11 }}>{selected.category}</span>
              <span className="chip" style={{ fontSize: 11 }}>{selected.priority} priority</span>
              <span className="muted text-xs flex items-center gap-1" style={{ marginLeft: 'auto' }}>
                <Clock size={13} /> {formatDateTime(selected.created_at)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(selected.messages || [selected]).map((m, i) => (
                <div
                  key={m.id || i}
                  className="card"
                  style={{
                    padding: 12,
                    alignSelf: m.author === 'vendor' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.author === 'vendor' ? 'rgba(37,99,235,0.08)' : 'var(--surface)',
                  }}
                >
                  <div className="muted text-xs mb-1">
                    {m.author === 'vendor' ? 'You' : 'GOSIKA Support'} · {formatDateTime(m.created_at)}
                  </div>
                  <div className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{m.message || m.body || selected.message}</div>
                </div>
              ))}
            </div>

            {['open', 'in_progress', 'waiting'].includes(selected.status) && (
              <>
                <Textarea label="Reply" rows={3} placeholder="Type your reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
                <label className="muted text-xs flex items-center gap-1" style={{ cursor: 'pointer' }}>
                  <Paperclip size={13} /> Attach a file (optional)
                </label>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
