import React, { useCallback, useEffect, useState } from 'react'
import {
  MessageSquarePlus, Megaphone, Send, RefreshCw, Eye, Clock, CheckCircle2, Mail
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DetailTabs from '../../components/admin/DetailTabs'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/commerce/StatusBadge'
import { formatDateTime, formatDate } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PRIORITY_COLORS = { low: '#64748b', normal: '#d97706', high: '#dc2626' }
const CHANNEL_LABELS = { in_app: 'In-App', email: 'Email', sms: 'SMS', push: 'Push' }

export default function AdminSellerBulletins() {
  const toast = useToast()

  const [tab, setTab] = useState('inquiries')

  // --- Inquiries ---
  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [ticketsPagination, setTicketsPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [openTicket, setOpenTicket] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)

  // --- Bulletins ---
  const [bulletins, setBulletins] = useState([])
  const [bulletinsLoading, setBulletinsLoading] = useState(true)
  const [bulletinOpen, setBulletinOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [sending, setSending] = useState(false)
  const [bulletinForm, setBulletinForm] = useState({ title: '', message: '', channel: 'in_app' })

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true)
    try {
      const params = { channel: 'vendor', page, per_page: 12 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/support/tickets', { params })
      setTickets(api.unwrapList(res.data))
      setTicketsPagination(res.data?.meta?.pagination || {
        current_page: page,
        last_page: 1,
        total: 0,
        per_page: 12
      })
    } catch (err) {
      toast.error('Failed to load seller inquiries.')
    } finally {
      setTicketsLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => { loadTickets() }, [loadTickets])

  const loadBulletins = useCallback(async () => {
    setBulletinsLoading(true)
    try {
      const res = await api.get('/admin/notifications', { params: { per_page: 100 } })
      const all = api.unwrapList(res.data)
      setBulletins(all.filter((b) => b.target_type === 'vendors'))
    } catch (err) {
      toast.error('Failed to load bulletins.')
    } finally {
      setBulletinsLoading(false)
    }
  }, [])

  useEffect(() => { if (tab === 'bulletins') loadBulletins() }, [tab, loadBulletins])

  const openTicketDetail = async (ticket) => {
    setOpenTicket(ticket)
    setDetailLoading(true)
    setTicketDetail(null)
    setReply('')
    try {
      const res = await api.get(`/admin/support/tickets/${ticket.id}`)
      setTicketDetail(res.data?.data)
    } catch (err) {
      toast.error('Failed to load ticket detail.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !openTicket) return
    setReplying(true)
    try {
      await api.post(`/admin/support/tickets/${openTicket.id}/messages`, { message: reply.trim(), is_internal: false })
      toast.success('Reply sent to seller.')
      setReply('')
      const res = await api.get(`/admin/support/tickets/${openTicket.id}`)
      setTicketDetail(res.data?.data)
      loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reply.')
    } finally {
      setReplying(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!openTicket) return
    try {
      await api.post(`/admin/support/tickets/${openTicket.id}/close`)
      toast.success('Inquiry marked as closed.')
      const res = await api.get(`/admin/support/tickets/${openTicket.id}`)
      setTicketDetail(res.data?.data)
      loadTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not close inquiry.')
    }
  }

  const handleSendBulletin = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.post('/admin/notifications/send', {
        ...bulletinForm,
        target_type: 'vendors',
      })
      toast.success('Bulletin sent to sellers.')
      setBulletinOpen(false)
      setBulletinForm({ title: '', message: '', channel: 'in_app' })
      loadBulletins()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send bulletin.')
    } finally {
      setSending(false)
    }
  }

  const inquiryColumns = [
    {
      header: 'Ticket #',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
          {item.ticket_number}
        </span>
      )
    },
    {
      header: 'Subject',
      render: (item) => (
        <div style={{ maxWidth: 300 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subject}</div>
          <div className="muted" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
        </div>
      )
    },
    {
      header: 'Merchant',
      render: (item) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{item.vendor?.company_name || '—'}</div>
          <div style={{ color: 'var(--muted)', fontSize: 11 }}>{item.vendor?.business_email || item.customer?.email || ''}</div>
        </div>
      )
    },
    {
      header: 'Priority',
      render: (item) => (
        <span className="chip chip-sm" style={{ fontWeight: 700, fontSize: 11, color: PRIORITY_COLORS[item.priority] || '#64748b' }}>
          {(item.priority || 'normal').toUpperCase()}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'Created',
      render: (item) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(item.created_at)}</span>
      )
    },
    {
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <button type="button" className="btn btn-outline btn-xs" onClick={() => openTicketDetail(item)}>
          <Eye size={12} /> Open
        </button>
      )
    }
  ]

  const tabs = [
    { id: 'inquiries', label: 'Seller Inquiries', icon: <MessageSquarePlus size={15} />, badge: ticketsPagination?.total || tickets.length },
    { id: 'bulletins', label: 'Bulletins', icon: <Megaphone size={15} />, badge: bulletins.length },
  ]

  const messages = ticketDetail?.messages || []
  const ticketStatus = ticketDetail?.status || openTicket?.status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Seller Inquiries & Bulletins"
        description="Answer seller support tickets and push official GOSIKA bulletins out to every merchant storefront."
        breadcrumbs={[
          { label: 'Marketplace', to: '/admin/marketplace/vendors' },
          { label: 'Seller Inquiries & Bulletins' }
        ]}
        actions={
          tab === 'bulletins' ? (
            <button type="button" className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setBulletinOpen(true)}>
              <Send size={14} /> Send Bulletin
            </button>
          ) : (
            <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={loadTickets}>
              <RefreshCw size={14} className={ticketsLoading ? 'spin' : ''} /> Refresh
            </button>
          )
        }
      />

      <DetailTabs tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === 'inquiries' && (
        <>
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search seller tickets..."
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={[
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
            ]}
            onReset={() => { setSearch(''); setStatusFilter('all') }}
          />
          <DataTable
            columns={inquiryColumns}
            data={tickets}
            loading={ticketsLoading}
            pagination={ticketsPagination}
            onPageChange={setPage}
            emptyTitle="No seller inquiries"
            emptyDescription="Support tickets raised by merchants will appear here — respond to them directly from this desk."
          />
        </>
      )}

      {tab === 'bulletins' && (
        <DataTable
          columns={[
            {
              header: 'Bulletin',
              render: (item) => (
                <div style={{ maxWidth: 360 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{item.title}</div>
                  <div className="muted" style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.message}</div>
                </div>
              )
            },
            {
              header: 'Channel',
              render: (item) => (
                <span className="chip chip-sm" style={{ fontWeight: 700, fontSize: 11 }}>
                  {CHANNEL_LABELS[item.channel] || item.channel}
                </span>
              )
            },
            {
              header: 'Reach',
              render: (item) => <span style={{ fontWeight: 700 }}>{item.reach ?? 0} sellers</span>
            },
            {
              header: 'Status',
              accessor: 'status',
              render: (item) => <StatusBadge status={item.status} />
            },
            {
              header: 'Sent',
              render: (item) => (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {item.sent_at ? formatDateTime(item.sent_at) : '—'}
                </div>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              render: (item) => (
                <button type="button" className="btn btn-outline btn-xs" onClick={() => setViewing(item)}>
                  <Eye size={12} /> Read
                </button>
              )
            }
          ]}
          data={bulletins}
          loading={bulletinsLoading}
          emptyTitle="No bulletins sent"
          emptyDescription="Send your first marketplace bulletin to reach every active seller on GOSIKA."
        />
      )}

      {/* Ticket detail / reply modal */}
      <Modal
        open={!!openTicket}
        onClose={() => { setOpenTicket(null); setTicketDetail(null) }}
        title={openTicket?.subject || 'Inquiry'}
        size="lg"
      >
        {detailLoading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
              <div>
                <span className="muted">Ticket: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ticketDetail?.ticket_number}</span>
              </div>
              <div>
                <span className="muted">Merchant: </span>
                <span style={{ fontWeight: 700 }}>{ticketDetail?.vendor?.company_name || '—'}</span>
              </div>
              <div>
                <span className="muted">Priority: </span>
                <span style={{ fontWeight: 700, color: PRIORITY_COLORS[ticketDetail?.priority] || '#64748b' }}>
                  {(ticketDetail?.priority || 'normal').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="muted">Status: </span>
                <StatusBadge status={ticketStatus} />
              </div>
              {ticketDetail?.created_at && (
                <div className="muted"><Clock size={12} /> {formatDateTime(ticketDetail.created_at)}</div>
              )}
            </div>

            <div className="card" style={{ padding: 14, borderRadius: 12, background: '#f8fafc', fontSize: 13 }}>
              {ticketDetail?.description || 'No description provided.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
              {messages.length === 0 ? (
                <div className="muted" style={{ fontSize: 12, textAlign: 'center', padding: 12 }}>No messages on this thread yet.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.sender?.is_staff ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: m.sender?.is_staff ? 'var(--primary)' : '#f1f5f9',
                      color: m.sender?.is_staff ? '#fff' : 'var(--ink)',
                      fontSize: 13
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 11, opacity: 0.85, marginBottom: 3 }}>
                      {m.sender?.is_staff ? 'GOSIKA Support' : (m.sender?.name || 'Seller')}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.message}</div>
                    <div style={{ fontSize: 10.5, opacity: 0.75, marginTop: 4 }}>
                      {m.created_at ? formatDateTime(m.created_at) : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            {ticketStatus !== 'closed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Write your reply to the seller…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleCloseTicket}
                    style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    <CheckCircle2 size={13} /> Mark Closed
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm flex items-center gap-1"
                    onClick={handleReply}
                    disabled={!reply.trim() || replying}
                  >
                    <Send size={13} /> {replying ? 'Sending…' : 'Reply to Seller'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Send bulletin modal */}
      <Modal
        open={bulletinOpen}
        onClose={() => setBulletinOpen(false)}
        title="Send Seller Bulletin"
      >
        <form onSubmit={handleSendBulletin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              required
              value={bulletinForm.title}
              onChange={(e) => setBulletinForm({ ...bulletinForm, title: e.target.value })}
              placeholder="e.g. Dashain Season Selling Guidelines"
              maxLength={200}
            />
          </div>
          <div>
            <label className="label">Message *</label>
            <textarea
              className="input"
              required
              rows={5}
              value={bulletinForm.message}
              onChange={(e) => setBulletinForm({ ...bulletinForm, message: e.target.value })}
              placeholder="This bulletin reaches every active seller on the platform…"
            />
          </div>
          <div>
            <label className="label">Channel</label>
            <select
              className="select"
              value={bulletinForm.channel}
              onChange={(e) => setBulletinForm({ ...bulletinForm, channel: e.target.value })}
            >
              <option value="in_app">In-App Notification</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBulletinOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary flex items-center gap-1" disabled={sending}>
              <Megaphone size={14} /> {sending ? 'Sending…' : 'Send to Sellers'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Read bulletin modal */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title || 'Bulletin'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
            <span className="chip chip-sm"><Mail size={11} /> {CHANNEL_LABELS[viewing?.channel] || viewing?.channel}</span>
            <span className="muted">{viewing?.reach ?? 0} sellers reached</span>
            <span className="muted">{viewing?.sent_at ? formatDateTime(viewing.sent_at) : ''}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, whiteSpace: 'pre-wrap' }}>{viewing?.message}</p>
        </div>
      </Modal>
    </div>
  )
}