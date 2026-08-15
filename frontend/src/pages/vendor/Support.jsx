import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Headphones, Plus, MessageSquare, Send, ChevronRight,
  Clock, CheckCircle2, AlertCircle, PhoneCall, Search
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import Pagination from '../../components/ui/Pagination'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatDate, humanizeEnum, errorMessage } from '../../utils/format'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
]

export default function VendorSupport() {
  const toast = useToast()
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = (page, pageSize) =>
    api.get('/vendor/support/tickets', {
      params: { status: statusFilter, priority: priorityFilter, search, page, per_page: pageSize },
    })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchTickets, {
    pageSize: 10,
    deps: [statusFilter, priorityFilter, search],
  })

  const changeStatus = (value) => {
    setPage(1)
    setStatusFilter(value)
  }

  const changePriority = (e) => {
    setPage(1)
    setPriorityFilter(e.target.value)
  }

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const loadDetail = (ticket) => {
    setSelectedTicket(ticket)
    setDetail(null)
    setDetailLoading(true)
    setReply('')
    api.get(`/vendor/support/tickets/${ticket.id}`)
      .then((r) => setDetail(r.data.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setDetailLoading(false))
  }

  const refreshDetail = () => {
    if (!selectedTicket) return
    api.get(`/vendor/support/tickets/${selectedTicket.id}`)
      .then((r) => setDetail(r.data.data))
      .catch((err) => toast.error(errorMessage(err)))
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!detail || !reply.trim()) return
    setSending(true)
    try {
      await api.post(`/vendor/support/tickets/${detail.id}/messages`, { message: reply })
      toast.success('Reply sent to support desk')
      setReply('')
      refreshDetail()
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const closeTicket = async () => {
    if (!detail) return
    setSending(true)
    try {
      await api.post(`/vendor/support/tickets/${detail.id}/close`)
      toast.success('Ticket marked as resolved')
      refreshDetail()
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const reopenTicket = async () => {
    if (!detail) return
    setSending(true)
    try {
      await api.post(`/vendor/support/tickets/${detail.id}/reopen`)
      toast.success('Ticket reopened')
      refreshDetail()
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSending(false)
    }
  }

  const activeCount = items.filter((t) => ['open', 'pending'].includes(t.status)).length
  const resolvedCount = items.filter((t) => ['resolved', 'closed'].includes(t.status)).length
  const highCount = items.filter((t) => t.priority === 'high').length

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Support & Help Desk</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Get direct assistance from GOSIKA Merchant Operations, Finance, and Logistics teams.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/support/new" className="btn btn-primary btn-sm flex items-center gap-1">
            <Plus size={14} /> Open Support Ticket
          </Link>
        </div>
      </div>

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
            <MessageSquare size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Tickets</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{meta.total}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', flexShrink: 0 }}>
            <PhoneCall size={22} />
          </span>
          <div>
            <div className="text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em', color: '#94a3b8' }}>High Priority</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 2 }}>{highCount} Cases</div>
            <div className="text-xs" style={{ color: '#cbd5e1', fontSize: 11 }}>Require urgent attention</div>
          </div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => changeStatus(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', marginBottom: 16 }}>
        <form onSubmit={applySearch} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search tickets by number or subject…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <select className="select" style={{ width: 160, height: 36 }} value={priorityFilter} onChange={changePriority}>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={80} />)}
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : items.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((t) => {
            const isOpen = ['open', 'pending'].includes(t.status)
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
                onClick={() => loadDetail(t)}
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
                    {t.category && <span className="chip chip-sm" style={{ fontSize: 11 }}>{t.category}</span>}
                    <span className="chip chip-sm" style={{ fontSize: 11, background: t.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg)', color: t.priority === 'high' ? '#ef4444' : 'var(--ink)' }}>
                      {humanizeEnum(t.priority)} priority
                    </span>
                  </div>

                  <div className="font-bold text-sm text-ink truncate" style={{ fontSize: 14 }}>
                    {t.subject}
                  </div>

                  <div className="muted text-xs flex items-center gap-2 mt-1">
                    <span>Opened: {formatDate(t.created_at)}</span>
                    {t.last_message_at && <span>· Last activity: {formatDate(t.last_message_at)}</span>}
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
            <Link to="/vendor/support/new" className="btn btn-primary">
              <Plus size={14} /> Open Ticket
            </Link>
          }
        />
      )}

      {items.length > 0 && (
        <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
      )}

      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`${selectedTicket.ticket_number} · ${selectedTicket.subject}`}
          size="lg"
        >
          {detailLoading ? (
            <Skeleton height={200} />
          ) : detail ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 wrap p-2.5" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <StatusBadge status={detail.status} />
                {detail.category && <span className="chip chip-sm">{detail.category}</span>}
                <span className="chip chip-sm" style={{ background: detail.priority === 'high' ? 'rgba(239,68,68,0.1)' : 'var(--bg)', color: detail.priority === 'high' ? '#ef4444' : 'var(--ink)' }}>
                  {humanizeEnum(detail.priority)} priority
                </span>
                <span className="muted text-xs flex items-center gap-1" style={{ marginLeft: 'auto' }}>
                  <Clock size={12} /> Opened {formatDateTime(detail.created_at)}
                </span>
              </div>

              {detail.description && (
                <div className="card" style={{ padding: 12, background: '#fff', margin: 0 }}>
                  <div className="muted text-xs uppercase font-semibold mb-1">Your Initial Description</div>
                  <p className="text-sm text-ink" style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{detail.description}</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', padding: '6px 2px' }}>
                {!detail.messages || detail.messages.length === 0 ? (
                  <p className="muted text-sm m-0" style={{ textAlign: 'center' }}>No messages yet.</p>
                ) : (
                  detail.messages.map((m, idx) => {
                    const isVendor = m.sender && user && m.sender.id === user.id
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
                            {m.sender?.full_name || (isVendor ? 'You' : 'GOSIKA Support')}
                            {m.is_internal && <span className="chip chip-sm" style={{ marginLeft: 6, fontSize: 10 }}>Internal</span>}
                          </span>
                          <span className="muted text-xs">{formatDateTime(m.created_at)}</span>
                        </div>
                        <p className="text-sm text-ink" style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {m.message}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>

              {['resolved', 'closed'].includes(detail.status) ? (
                <div className="p-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="font-bold text-xs text-success flex items-center justify-center gap-1.5 mb-2">
                    <CheckCircle2 size={14} /> This support ticket has been resolved.
                  </div>
                  <Button variant="outline" size="sm" onClick={reopenTicket} disabled={sending}>
                    Reopen Ticket
                  </Button>
                </div>
              ) : (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <form onSubmit={sendReply} className="flex flex-col gap-2">
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
                        disabled={sending}
                      >
                        <CheckCircle2 size={12} /> Mark as Resolved
                      </button>
                      <Button type="submit" variant="primary" size="sm" icon={Send} disabled={sending || !reply.trim()}>
                        Send Message
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <ErrorState message="Unable to load ticket detail." onRetry={() => loadDetail(selectedTicket)} />
          )}
        </Modal>
      )}
    </div>
  )
}
