import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Plus, Paperclip, Send, ArrowLeft, X, Store } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, errorMessage } from '../../utils/format'
import { AccountPage, AccountTitle } from './AccountUI'
import { useAuth } from '../../context/AuthContext'

export default function AccountSupport() {
  const toast = useToast()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const storeId = searchParams.get('store')
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
  const [selectedStore, setSelectedStore] = useState(null)
  const [storeLoading, setStoreLoading] = useState(false)
  const [syncError, setSyncError] = useState(false)
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
    if (!storeId) {
      setSelectedStore(null)
      return
    }

    let active = true
    setView('new')
    setStoreLoading(true)
    api.get(`/marketplace/stores/${encodeURIComponent(storeId)}`)
      .then((res) => {
        if (!active) return
        const store = res.data?.data
        setSelectedStore(store)
        setNewSubject(`Question for ${store.name}`)
        setNewCategory('Store Message')
      })
      .catch((err) => {
        if (!active) return
        toast.error(errorMessage(err, 'Could not open this store conversation.'))
        setSearchParams({}, { replace: true })
        setView('list')
      })
      .finally(() => {
        if (active) setStoreLoading(false)
      })

    return () => { active = false }
  }, [storeId, setSearchParams, toast])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [activeTicket?.messages])

  useEffect(() => {
    if (view !== 'detail' || !activeTicket?.id) return undefined

    let alive = true
    const refreshThread = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const res = await api.get(`/customer/support/tickets/${activeTicket.id}`, { skipCache: true })
        if (!alive) return
        setActiveTicket((current) => res.data?.data || current)
        setSyncError(false)
      } catch {
        if (alive) setSyncError(true)
      }
    }
    const timer = setInterval(refreshThread, 8000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [view, activeTicket?.id])

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
        ...(selectedStore ? { store_id: selectedStore.id } : {}),
      })
      const ticket = res.data?.data
      setActiveTicket(ticket)
      setView('detail')
      setSyncError(false)
      toast.success(selectedStore ? 'Message sent to the store.' : 'Message sent to GOSIKA Support.')
      setNewSubject('')
      setNewDescription('')
      setNewAttachments([])
      loadTickets()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleSendReply = async (e) => {
    e?.preventDefault()
    if (!newReplyText.trim()) return
    setReplyLoading(true)
    try {
      const res = await api.post('/customer/support/tickets/' + activeTicket.id + '/messages', {
        message: newReplyText.trim(),
        attachments: replyAttachments,
      })
      setActiveTicket(res.data?.data)
      setSyncError(false)
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

  const leaveNewMessage = () => {
    setView('list')
    setSelectedStore(null)
    setSearchParams({}, { replace: true })
    setNewSubject('')
    setNewDescription('')
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
        <AccountTitle label={selectedStore ? `Message ${selectedStore.name}` : 'Message GOSIKA Support'} />
        <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-ghost btn-xs flex items-center gap-1" onClick={leaveNewMessage}>
            <ArrowLeft size={14} /> Back to Support Tickets
          </button>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {selectedStore ? `Message ${selectedStore.name}` : 'Message GOSIKA Support'}
          </h2>
        </div>

        <form onSubmit={handleCreateTicket} className="flex flex-col gap-3">
          {storeLoading ? (
            <div className="muted text-sm">Opening store conversation…</div>
          ) : selectedStore ? (
            <div className="flex items-center gap-2" style={{ padding: 12, borderRadius: 10, background: '#fff9f2', color: 'var(--ink)' }}>
              <Store size={18} color="var(--primary)" />
              <span className="text-sm">Sending your message to <strong>{selectedStore.name}</strong></span>
            </div>
          ) : (
            <p className="muted text-sm" style={{ margin: 0 }}>
              For live product questions, open the store page and choose “Chat with Store”.
            </p>
          )}

          <Input 
            label="Subject" 
            required 
            placeholder={selectedStore ? 'What would you like to ask the store?' : 'How can GOSIKA Support help?'}
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />

          {!selectedStore && <div className="form-row">
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
          </div>}

          <div className="form-group">
            <label className="label font-bold text-xs">
              Message / Description <span className="req">*</span>
            </label>
            <Textarea 
              rows={5} 
              required 
              placeholder={selectedStore ? 'Write your message to the store…' : 'Describe your question for GOSIKA Support…'}
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
            <button type="button" className="btn btn-outline btn-sm" onClick={leaveNewMessage}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating || storeLoading}>
              {creating ? 'Sending…' : 'Send Message'}
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
      <div className="card card-pad-none" style={{ display: 'flex', flexDirection: 'column', height: 'min(640px, calc(100dvh - 190px))', minHeight: 400, overflow: 'hidden' }}>
        {/* Detail Header */}
        <div style={{ padding: '14px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-ghost btn-xs flex items-center gap-1" onClick={() => { setView('list'); setSelectedStore(null); setSearchParams({}, { replace: true }); loadTickets(); }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>
                {activeTicket.vendor_name || 'GOSIKA Support'}
              </div>
              <div className="muted text-xs mt-0.5">
                {activeTicket.subject} · #{activeTicket.ticket_number || activeTicket.id}
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
              const isOwnMessage = m.sender?.id
                ? m.sender.id === user?.id
                : !m.sender?.is_staff
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                  <div className="muted text-xs mb-1 font-semibold" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {!isOwnMessage
                      ? `${activeTicket.vendor_name || 'GOSIKA Support'}`
                      : 'You'} · {formatDateTime(m.created_at)}
                  </div>
                  <div style={{
                    background: isOwnMessage ? 'var(--primary)' : 'var(--bg)',
                    color: isOwnMessage ? '#fff' : 'var(--ink)',
                    padding: '12px 16px',
                    borderRadius: 10,
                    maxWidth: '75%',
                    border: isOwnMessage ? 'none' : '1px solid var(--border)',
                    lineHeight: 1.5,
                    fontSize: 14,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {m.message}

                    {m.attachments?.length > 0 && (
                      <div className="flex gap-2 wrap mt-2 pt-2" style={{ borderTop: isOwnMessage ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)' }}>
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
            <p className="muted text-center text-sm">No replies yet.</p>
          )}
          {syncError && (
            <p role="status" className="text-xs" style={{ color: '#b45309', textAlign: 'center' }}>
              Couldn’t refresh messages. They’ll update when your connection is restored.
            </p>
          )}
        </div>

        {/* Chat Input Bar */}
        {(
          <div style={{ padding: '12px 18px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
            {isClosed && <div className="muted text-xs mb-2">This conversation is closed. Sending a message will reopen it.</div>}
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
                placeholder={`Message ${activeTicket.vendor_name || 'GOSIKA Support'}…`}
                value={newReplyText}
                onChange={(e) => setNewReplyText(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={replyLoading || !newReplyText.trim()}
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>
        )}
      </div>
      </>
    )
  }

  return (
    <AccountPage
      title="Support Tickets"
      subtitle="Create and follow up on support requests. For quick store conversations, use Chat with Store on the store profile."
      actions={<button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => { setSelectedStore(null); setView('new') }}><Plus size={14} /> New Ticket</button>}
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
                      <span>{t.vendor_name || 'GOSIKA Support'}</span>
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
          title="No support tickets yet"
          message="Create a ticket for help with orders, payments, returns, or your account."
          action={<button className="btn btn-primary" onClick={() => { setSelectedStore(null); setView('new') }}><Plus size={14} /> Create a Support Ticket</button>}
        />
      )}
    </AccountPage>
  )
}
