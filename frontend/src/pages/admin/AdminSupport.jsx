import React, { useState } from 'react'
import {
  Headphones, Search, AlertTriangle, Eye, Send, Download,
  MessageSquare, CheckCircle2, UserPlus
} from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { formatDateTime, humanizeEnum, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

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
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export default function AdminSupport() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [assignId, setAssignId] = useState('')
  const [sending, setSending] = useState(false)

  const fetchTickets = (page, perPage) =>
    api.get('/admin/support/tickets', {
      params: { status: statusFilter, priority: priorityFilter, search, page, per_page: perPage },
    })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetchTickets, {
    pageSize: 10,
    deps: [statusFilter, priorityFilter, search],
  })

  const applySearch = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const loadDetail = (ticket) => {
    setSelectedTicket(ticket)
    setDetail(null)
    setDetailLoading(true)
    setReplyText('')
    setAssignId('')
    api.get(`/admin/support/tickets/${ticket.id}`)
      .then((r) => setDetail(r.data.data))
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setDetailLoading(false))
  }

  const refreshDetail = () => {
    if (!selectedTicket) return
    api.get(`/admin/support/tickets/${selectedTicket.id}`)
      .then((r) => setDetail(r.data.data))
      .catch((err) => toast.error(errorMessage(err)))
  }

  const handleReply = (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return
    setSending(true)
    api.post(`/admin/support/tickets/${selectedTicket.id}/messages`, {
      message: replyText,
      is_internal: false,
    })
      .then(() => {
        toast.success('Reply dispatched to requester')
        setReplyText('')
        refreshDetail()
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSending(false))
  }

  const handleClose = () => {
    if (!selectedTicket) return
    const resolution = window.prompt('Enter resolution summary (optional):', '')
    if (resolution === null) return
    setSending(true)
    api.post(`/admin/support/tickets/${selectedTicket.id}/close`, { resolution })
      .then(() => {
        toast.success('Ticket closed')
        refreshDetail()
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSending(false))
  }

  const handleAssign = (e) => {
    e.preventDefault()
    if (!assignId.trim() || !selectedTicket) return
    setSending(true)
    api.post(`/admin/support/tickets/${selectedTicket.id}/assign`, { user_id: assignId.trim() })
      .then(() => {
        toast.success('Ticket assigned')
        setAssignId('')
        refreshDetail()
        reload()
      })
      .catch((err) => toast.error(errorMessage(err)))
      .finally(() => setSending(false))
  }

  const exportCSV = () => {
    const rows = [
      ['Ticket Number', 'Subject', 'Requester', 'Priority', 'Status', 'Date Created'],
      ...items.map((t) => [
        t.ticket_number,
        t.subject,
        t.customer?.full_name || t.customer?.email || '',
        t.priority,
        t.status,
        t.created_at || '',
      ]),
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

  const openCount = items.filter((t) => t.status === 'open' || t.status === 'pending').length
  const urgentCount = items.filter((t) => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length
  const resolvedCount = items.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const ticketName = (t) =>
    t.customer?.full_name || [t.customer?.first_name, t.customer?.last_name].filter(Boolean).join(' ') || t.customer?.email || '—'

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Support Desk & Helpdesk Operations
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage incoming customer and artisan vendor inquiries, dispute mediations, and resolution escalations.
          </p>
        </div>
        <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
          <Download size={14} /> Export CSV
        </button>
      </div>

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
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Resolved Tickets</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{resolvedCount} Closed</div>
          <div className="muted text-xs mt-1">Resolutions delivered</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Tickets</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <MessageSquare size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{meta.total} Total</div>
          <div className="muted text-xs mt-1">Across all states</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => {
              setPage(1)
              setStatusFilter(t.value)
            }}
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
            placeholder="Search tickets by subject, number, or requester…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <div className="flex items-center gap-2">
          <select
            className="select"
            style={{ width: 160, height: 36 }}
            value={priorityFilter}
            onChange={(e) => {
              setPage(1)
              setPriorityFilter(e.target.value)
            }}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <span className="muted text-xs font-semibold">
            {meta.total} ticket{meta.total !== 1 ? 's' : ''} listed
          </span>
        </div>
      </div>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject & Case Context</th>
                  <th>Requester</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7}><Skeleton height={22} /></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={Headphones} title="No tickets found" message="Try adjusting your search or filters." />
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="font-mono font-bold text-primary text-xs" style={{ cursor: 'pointer' }} onClick={() => loadDetail(t)}>
                          {t.ticket_number}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink line-clamp-1" style={{ cursor: 'pointer' }} onClick={() => loadDetail(t)}>
                          {t.subject}
                        </div>
                        {t.order_number && (
                          <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>
                            Order Ref: #{t.order_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-sm text-ink">{ticketName(t)}</div>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>{t.customer?.phone || ''}</div>
                      </td>
                      <td>
                        <span
                          className="badge font-bold"
                          style={{
                            background: t.priority === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'high' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg)',
                            color: t.priority === 'urgent' ? '#dc2626' : t.priority === 'high' ? '#d97706' : 'var(--ink)',
                          }}
                        >
                          {humanizeEnum(t.priority)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="muted text-xs">{formatDateTime(t.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="btn btn-outline btn-xs flex items-center gap-1" style={{ marginLeft: 'auto' }} onClick={() => loadDetail(t)}>
                          <Eye size={12} /> Respond
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

      {selectedTicket && (
        <Modal
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Support Case: ${selectedTicket.ticket_number}`}
          size="lg"
        >
          {detailLoading ? (
            <Skeleton height={200} />
          ) : detail ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ background: 'var(--bg)', padding: 14, margin: 0 }}>
                <div className="flex justify-between items-center wrap gap-2 mb-2">
                  <div className="font-bold text-sm text-ink">{detail.subject}</div>
                  <StatusBadge status={detail.status} />
                </div>
                <div className="flex justify-between items-center wrap gap-2 text-xs muted pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <div>
                    Requester: <strong className="text-ink">{ticketName(detail)}</strong> · {humanizeEnum(detail.priority)} priority
                    {detail.assignee?.full_name && <> · Assigned to: <strong className="text-ink">{detail.assignee.full_name}</strong></>}
                  </div>
                  <div style={{ fontSize: 10 }}>Created {formatDateTime(detail.created_at)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto', padding: 10, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                {!detail.messages || detail.messages.length === 0 ? (
                  <p className="muted text-sm m-0" style={{ textAlign: 'center' }}>No messages yet.</p>
                ) : (
                  detail.messages.map((m, i) => {
                    const isStaff = m.sender?.is_staff || !m.sender
                    return (
                      <div
                        key={m.id || i}
                        style={{
                          padding: '10px 14px',
                          background: isStaff ? 'var(--primary-50)' : 'var(--bg)',
                          borderLeft: isStaff ? '3px solid var(--primary)' : '3px solid #cbd5e1',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span style={{ color: isStaff ? 'var(--primary)' : 'var(--ink)' }}>
                            {m.sender?.name || 'System'}
                            {m.is_internal && <span className="chip chip-sm" style={{ marginLeft: 6, fontSize: 10 }}>Internal</span>}
                          </span>
                          <span className="muted font-normal">{formatDateTime(m.created_at)}</span>
                        </div>
                        <p className="text-xs text-ink m-0" style={{ lineHeight: 1.5 }}>{m.message}</p>
                      </div>
                    )
                  })
                )}
              </div>

              <form onSubmit={handleReply} className="flex flex-col gap-2">
                <textarea
                  className="textarea"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official helpdesk response here…"
                />
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleClose} disabled={sending}>
                      Close Ticket
                    </button>
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1" disabled={sending || !replyText.trim()}>
                    <Send size={13} /> Dispatch Reply
                  </button>
                </div>
              </form>

              <form onSubmit={handleAssign} className="flex items-end gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <label className="label">Assign to User (UUID)</label>
                  <input
                    className="input font-mono"
                    value={assignId}
                    onChange={(e) => setAssignId(e.target.value)}
                    placeholder="Paste the user UUID to assign this ticket"
                  />
                </div>
                <button type="submit" className="btn btn-outline btn-sm flex items-center gap-1" disabled={sending || !assignId.trim()}>
                  <UserPlus size={13} /> Assign
                </button>
              </form>
            </div>
          ) : (
            <ErrorState message="Unable to load ticket detail." onRetry={() => loadDetail(selectedTicket)} />
          )}
        </Modal>
      )}
    </div>
  )
}
