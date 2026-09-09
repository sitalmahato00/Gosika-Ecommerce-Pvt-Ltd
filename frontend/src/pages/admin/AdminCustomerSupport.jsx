import React, { useState, useEffect } from 'react'
import {
  Headphones, Eye, MessageSquare, RefreshCw, Send, CheckCircle2, Clock
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function AdminCustomerSupport() {
  const toast = useToast()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [closing, setClosing] = useState(false)

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params = { channel: 'customer', page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter

      const res = await api.get('/admin/support/tickets', { params })
      const data = api.unwrapList(res.data)
      setTickets(data)
      setPagination(res.data?.meta?.pagination || {
        current_page: page,
        last_page: 1,
        total: data.length,
        per_page: 15
      })
    } catch (err) {
      toast.error('Failed to load support tickets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [page, statusFilter])

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get(`/admin/support/tickets/${ticket.id}`)
      setDetail(res.data?.data || null)
    } catch (err) {
      toast.error('Failed to load ticket thread.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedTicket) return

    setReplying(true)
    try {
      const res = await api.post(`/admin/support/tickets/${selectedTicket.id}/messages`, {
        message: replyText.trim()
      })
      setDetail(res.data?.data || detail)
      setReplyText('')
      toast.success('Support response sent to customer.')
      loadTickets()
    } catch (err) {
      toast.error('Failed to send response.')
    } finally {
      setReplying(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return
    setClosing(true)
    try {
      await api.post(`/admin/support/tickets/${selectedTicket.id}/close`)
      toast.success('Ticket closed.')
      setSelectedTicket(null)
      setDetail(null)
      loadTickets()
    } catch (err) {
      toast.error('Failed to close ticket.')
    } finally {
      setClosing(false)
    }
  }

  const columns = [
    {
      header: 'Ticket #',
      render: item => (
        <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
          #{item.ticket_number}
        </span>
      )
    },
    {
      header: 'Subject & Inquiry',
      render: item => (
        <div style={{ maxWidth: 300 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{item.subject}</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }} className="truncate">
            {item.description}
          </div>
          {item.order_number && (
            <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>
              Order #{item.order_number} · {item.category}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Customer',
      render: item => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{item.customer?.full_name || 'Customer'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.customer?.email || '—'}</div>
        </div>
      )
    },
    {
      header: 'Priority',
      render: item => {
        const p = item.priority || 'normal'
        const isUrgent = p === 'urgent' || p === 'high'
        const color = isUrgent ? '#dc2626' : p === 'medium' ? '#d97706' : '#16a34a'
        const bg = isUrgent ? '#fee2e2' : p === 'medium' ? '#fef3c7' : '#dcfce7'
        return (
          <span className="chip chip-sm" style={{ background: bg, color, fontWeight: 800, fontSize: 11 }}>
            {p.toUpperCase()}
          </span>
        )
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status || 'open'} />
    },
    {
      header: 'Opened',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {timeAgo(item.created_at)}
        </span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => (
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={() => openTicket(item)}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Eye size={12} /> View Thread
        </button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Support Desk"
        description="Customer inquiries, complaints and dispute threads resolved by the marketplace support team."
        breadcrumbs={[
          { label: 'Customers', to: '/admin/customers' },
          { label: 'Support Desk' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadTickets}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      <FilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'open', label: 'Open Inquiries' },
          { value: 'pending', label: 'Pending Reply' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'closed', label: 'Closed' },
        ]}
        onReset={() => setStatusFilter('all')}
      />

      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No support tickets"
        emptyDescription="There are no active customer support tickets matching your filters."
      />

      {/* Ticket Thread Modal */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedTicket(null) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 620,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '88vh'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  Support Ticket #{selectedTicket.ticket_number}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {selectedTicket.customer?.full_name} ({selectedTicket.customer?.email})
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusBadge status={selectedTicket.status || 'open'} />
                <button className="btn btn-ghost btn-xs" onClick={() => setSelectedTicket(null)}>✕</button>
              </div>
            </div>

            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                {selectedTicket.subject}
              </div>
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                {(detail?.description || selectedTicket.description)}
              </div>
              {selectedTicket.order_number && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  Associated Order: #{selectedTicket.order_number}
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Conversation Thread
            </div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240 }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 16, fontSize: 12.5, color: 'var(--muted)' }}>Loading thread…</div>
              ) : (detail?.messages?.length || 0) === 0 ? (
                <div style={{ textAlign: 'center', padding: 16, fontSize: 12.5, color: 'var(--muted)' }}>No replies yet.</div>
              ) : (
                detail.messages.map((m, idx) => {
                  const fromCustomer = !m.sender || m.sender.id === selectedTicket.customer?.id
                  return (
                    <div key={idx} style={{ alignSelf: fromCustomer ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '9px 12px', borderRadius: 10, background: fromCustomer ? '#f1f5f9' : '#eef2ff', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>{m.message}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>
                        {fromCustomer ? 'Customer' : 'Support Team'} · {m.created_at ? formatDateTime(m.created_at) : ''}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Administrator Response</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your official resolution message to the customer..."
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCloseTicket}
                    disabled={closing}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <CheckCircle2 size={14} /> {closing ? 'Closing…' : 'Close Ticket'}
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={replying || !replyText.trim()}>
                    <Send size={14} style={{ marginRight: 4 }} />
                    {replying ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}