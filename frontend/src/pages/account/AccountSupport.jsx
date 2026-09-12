import React, { useState, useEffect, useRef } from 'react'
import { Headphones, Mail, Phone, MessageSquare, Plus, Paperclip, Send, Clock, CheckCircle2, AlertCircle, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage, apiImage } from '../../utils/format'
import { AccountPage, AccountTitle } from './AccountUI'

export default function AccountSupport() {
  const toast = useToast()
  const [view, setView] = useState('list') // 'list' | 'new' | 'detail'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTicket, setActiveTicket] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [replyLoading, setReplyLoading] = useState(false)
  const [newReplyText, setNewReplyText] = useState('')
  const [replyAttachments, setReplyAttachments] = useState([])
  
  const [newSubject, setNewSubject] = useState('')
  const [newCategory, setNewCategory] = useState('General Inquiry')
  const [newPriority, setNewPriority] = useState('normal')
  const [newDescription, setNewDescription] = useState('')
  const [newAttachments, setNewAttachments] = useState([])
  const [creating, setCreating] = useState(false)

  const fileInputRef = useRef(null)
  const replyFileInputRef = useRef(null)
  const chatScrollRef = useRef(null)

  const loadTickets = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/customer/support/tickets')
      const data = res.data?.data?.data || res.data?.data || []
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [activeTicket?.messages])

  const openDetail = async (ticket) => {
    setView('detail')
    setDetailLoading(true)
    try {
      const res = await api.get('/customer/support/tickets/' + ticket.id)
      setActiveTicket(res.data?.data || ticket)
    } catch (err) {
      toast.error(errorMessage(err))
      setActiveTicket(ticket)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.post('/customer/support/tickets', {
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
        attachments: newAttachments,
      })
      toast.success('Support ticket created successfully')
      setNewSubject('')
      setNewDescription('')
      setNewAttachments([])
      setView('list')
      loadTickets()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleSendReply = async (e) => {
    e?.preventDefault()
    if (!newReplyText.trim() && newAttachments.length === 0) return
    setReplyLoading(true)
    try {
      const res = await api.post('/customer/support/tickets/' + activeTicket.id + '/messages', {
        message: newReplyText,
        attachments: replyAttachments,
      })
      setActiveTicket(res.data?.data)
      setNewReplyText('')
      setReplyAttachments([])
      toast.success('Reply sent')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setReplyLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    try {
      const res = await api.post('/customer/support/tickets/' + activeTicket.id + '/close')
      setActiveTicket(res.data?.data)
      toast.success('Ticket marked as closed')
      loadTickets()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const handleFileAttachment = (e, isReply = false) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target.result
        if (isReply) {
          setReplyAttachments(prev => [...prev, { name: file.name, url: base64 }])
        } else {
          setNewAttachments(prev => [...prev, { name: file.name, url: base64 }])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  if (view === 'new') {
    return (
      <div className="card">
        <AccountTitle label="Create Support Ticket" />
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost btn-xs flex items-center gap-1" onClick={() => setView('list')}>
            <ArrowLeft size={14} /> Back to Tickets
          </button>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Create Support Ticket</h2>
        </div>

        <form onSubmit={handleCreateTicket} className="flex flex-col gap-3">
          <Input 
            label="Subject" 
            required 
            placeholder="e.g. Order delivery status inquiry" 
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />

          <div className="form-row">
            <Select 
              label="Category" 
              value={newCategory} 
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="General Inquiry">General Inquiry</option>
              <option value="Order & Delivery">Order & Delivery</option>
              <option value="Payments & Refund">Payments & Refund</option>
              <option value="Return Request">Return Request</option>
              <option value="Account & Security">Account & Security</option>
            </Select>

            <Select 
              label="Priority" 
              value={newPriority} 
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </Select>
          </div>

          <div className="form-group">
            <label className="label font-bold text-xs">
              Message / Description <span className="req">*</span>
            </label>
            <Textarea 
              rows={5} 
              required 
              placeholder="Describe your issue or question in detail..." 
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>

          {/* Attachments */}
          <div className="form-group">
            <label className="label font-bold text-xs">Attachments / Screenshots (Optional)</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              multiple 
              accept="image/*" 
              onChange={(e) => handleFileAttachment(e, false)} 
            />
            <div className="flex items-center gap-2 wrap">
              <button 
                type="button" 
                className="btn btn-outline btn-sm flex items-center gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={14} /> Add Images
              </button>
              <span className="muted text-xs">Upload screenshots or photos (PNG, JPG)</span>
            </div>

            {newAttachments.length > 0 && (
              <div className="flex gap-2 wrap mt-2">
                {newAttachments.map((att, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={att.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => setNewAttachments(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setView('list')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
              {creating ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  if (view === 'detail' && activeTicket) {
    const isClosed = activeTicket.status === 'closed'
    return (
      <>
      <AccountTitle label="Support Tickets" />
      <div className="card card-pad-none" style={{ display: 'flex', flexDirection: 'column', height: '640px', overflow: 'hidden' }}>
        {/* Detail Header */}
        <div style={{ padding: '14px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-xs flex items-center gap-1" onClick={() => { setView('list'); loadTickets(); }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                {activeTicket.subject}
              </div>
              <div className="muted text-xs mt-0.5">
                Ticket #{activeTicket.ticket_number || activeTicket.id} · {activeTicket.category || 'Support'} · {formatDateTime(activeTicket.created_at)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`chip chip-sm ${!isClosed ? 'badge-in_stock' : 'badge-out_of_stock'}`} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
              {activeTicket.status}
            </span>
            {!isClosed && (
              <button type="button" className="btn btn-outline btn-xs" onClick={handleCloseTicket}>
                Close Ticket
              </button>
            )}
          </div>
        </div>

        {/* Chat / Message Stream */}
        <div ref={chatScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spinner size={20} color="var(--primary)" />
            </div>
          ) : activeTicket.messages?.length ? (
            activeTicket.messages.map((m) => {
              const isStaff = m.sender?.is_staff || m.sender?.name === 'Admin' || m.sender === 'agent'
              return (
                <div key={m.id || Math.random()} style={{ display: 'flex', flexDirection: 'column', alignItems: isStaff ? 'flex-start' : 'flex-end' }}>
                  <div className="muted text-xs mb-1 font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isStaff ? 'GOSIKA Support Team' : 'You'} · {formatDateTime(m.created_at)}
                  </div>
                  <div style={{
                    background: isStaff ? 'var(--bg)' : 'var(--primary)',
                    color: isStaff ? 'var(--ink)' : '#fff',
                    padding: '12px 16px',
                    borderRadius: 10,
                    maxWidth: '75%',
                    border: isStaff ? '1px solid var(--border)' : 'none',
                    lineHeight: 1.5,
                    fontSize: 14,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {m.message}

                    {m.attachments?.length > 0 && (
                      <div className="flex gap-2 wrap mt-2 pt-2" style={{ borderTop: isStaff ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)' }}>
                        {m.attachments.map((att, i) => (
                          <a key={i} href={att.url || att} target="_blank" rel="noreferrer" style={{ display: 'block', width: 50, height: 50, borderRadius: 4, overflow: 'hidden' }}>
                            <img src={att.url || att} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="muted text-center text-sm">No messages yet.</p>
          )}
        </div>

        {/* Chat Input Bar */}
        {!isClosed ? (
          <div style={{ padding: '12px 18px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
            {replyAttachments.length > 0 && (
              <div className="flex gap-2 wrap mb-2">
                {replyAttachments.map((att, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 44, height: 44, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={att.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                      style={{ position: 'absolute', top: 1, right: 1, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={8} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input 
                type="file" 
                ref={replyFileInputRef} 
                style={{ display: 'none' }} 
                multiple 
                accept="image/*" 
                onChange={(e) => handleFileAttachment(e, true)} 
              />
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '8px 12px' }} 
                onClick={() => replyFileInputRef.current?.click()}
                title="Attach image"
              >
                <Paperclip size={16} />
              </button>
              <input 
                type="text" 
                className="input flex-1" 
                placeholder="Type your reply to support..." 
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={replyLoading || (!newReplyText.trim() && replyAttachments.length === 0)}
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        ) : (
          <div style={{ padding: '12px 18px', background: 'var(--bg)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <span className="muted text-xs">This ticket has been marked as closed.</span>
          </div>
        )}
      </div>
      </>
    )
  }

  return (
    <AccountPage
      title="Support Tickets"
      subtitle="Submit support inquiries and chat with our team in real-time."
      actions={<button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => setView('new')}><Plus size={14} /> New Ticket</button>}
    >

      {loading ? (
        <div className="card" style={{ padding: 30, textAlign: 'center' }}>
          <Spinner size={20} color="var(--primary)" />
        </div>
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={loadTickets} />
      ) : tickets.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {tickets.map((t) => {
            const isClosed = t.status === 'closed'
            return (
              <div 
                key={t.id} 
                className="card card-hover flex items-center justify-between wrap gap-3" 
                style={{ padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => openDetail(t)}
              >
                <div className="flex items-center gap-3.5">
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--primary-50)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">{t.subject}</div>
                    <div className="muted text-xs mt-1 flex items-center gap-2 wrap">
                      <span>#{t.ticket_number || t.id}</span>
                      <span>·</span>
                      <span>{t.category || 'General'}</span>
                      <span>·</span>
                      <span>{formatDateTime(t.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`chip chip-sm ${!isClosed ? 'badge-in_stock' : 'badge-out_of_stock'}`} style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                    {t.status}
                  </span>
                  <span className="muted text-sm font-bold">→</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState 
          icon={MessageSquare} 
          title="No support tickets" 
          message="Have a question about an order, payment, or delivery? Open a support ticket and we will assist you." 
          action={<button className="btn btn-primary" onClick={() => setView('new')}><Plus size={14} /> Open Support Ticket</button>} 
        />
      )}
    </AccountPage>
  )
}
