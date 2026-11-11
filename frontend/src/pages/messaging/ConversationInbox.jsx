import React, { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Store, UserRound, Headset, ArrowLeft, ImagePlus, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/client'
import { getChatEcho } from '../../messaging/chatEcho'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errorMessage, formatDateTime } from '../../utils/format'

const API_BASE = {
  customer: '/customer/conversations',
  vendor: '/vendor/conversations',
  admin: '/admin/conversations',
}

function conversationTitle(conversation, portal) {
  if (portal === 'customer') return conversation.type === 'store' ? conversation.store_name || conversation.vendor_name : 'GOSIKA Support'
  if (portal === 'vendor') return conversation.customer_name || 'Customer'
  return conversation.store_name || conversation.vendor_name || 'GOSIKA Support'
}

function messagePreview(conversation) {
  return conversation.last_message?.message
    || (conversation.last_message?.images?.length ? 'Photo' : conversation.subject || 'Start a conversation')
}

function mergeMessage(messages = [], incoming) {
  const existingIndex = messages.findIndex((message) => message.id === incoming.id
    || (incoming.client_uuid && message.client_uuid === incoming.client_uuid))
  const next = existingIndex < 0
    ? [...messages, incoming]
    : messages.map((message, index) => index === existingIndex ? incoming : message)

  return next.sort((left, right) => {
    const timeDifference = new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    if (timeDifference !== 0) return timeDifference
    return (left.cursor || Number.MAX_SAFE_INTEGER) - (right.cursor || Number.MAX_SAFE_INTEGER)
  })
}

function updateConversation(items, conversation) {
  const found = items.some((item) => item.id === conversation.id)
  const next = found
    ? items.map((item) => item.id === conversation.id ? { ...item, ...conversation } : item)
    : [conversation, ...items]
  return next.sort((a, b) => new Date(b.last_message_at || b.created_at) - new Date(a.last_message_at || a.created_at))
}

function ChatImage({ url, alt }) {
  const [source, setSource] = useState(url.startsWith('blob:') ? url : null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (url.startsWith('blob:')) {
      setSource(url)
      setFailed(false)
      return undefined
    }

    let active = true
    let objectUrl
    setFailed(false)
    const imagePath = new URL(url, window.location.origin).pathname.replace(/^\/api\/v1/, '')

    api.get(imagePath, { responseType: 'blob', skipCache: true })
      .then(({ data }) => {
        if (!active) return
        objectUrl = URL.createObjectURL(data)
        setSource(objectUrl)
      })
      .catch(() => {
        if (active) {
          setSource(null)
          setFailed(true)
        }
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (failed) return <span className="conversation-inbox__image-loading">Image unavailable</span>

  return source
    ? <a href={source} target="_blank" rel="noreferrer"><img src={source} alt={alt} loading="lazy" /></a>
    : <span className="conversation-inbox__image-loading" role="status">Loading image…</span>
}

export default function ConversationInbox({ portal }) {
  const { user } = useAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const requestedStore = portal === 'customer' ? searchParams.get('store') : null
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState('')
  const [attachments, setAttachments] = useState([])
  const [sendingCount, setSendingCount] = useState(0)
  const [live, setLive] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState('')
  const listRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const previousConversationIdRef = useRef(null)
  const activeIdRef = useRef(null)
  const handledStoreRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewUrlsRef = useRef(new Set())

  const base = API_BASE[portal]
  const sending = sendingCount > 0

  const loadConversations = useCallback(async () => {
    setError(null)
    try {
      const response = await api.get(base, { skipCache: true })
      const items = api.unwrapList(response.data)
      setConversations(items)
      return items
    } catch (requestError) {
      setError(requestError)
      return null
    } finally {
      setLoading(false)
    }
  }, [base])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const markRead = useCallback(async (conversationId) => {
    try {
      await api.post(`${base}/${conversationId}/read`)
      setConversations((items) => items.map((item) => item.id === conversationId ? { ...item, unread_count: 0 } : item))
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Could not update message read status.'))
    }
  }, [base, toast])

  const openConversation = useCallback(async (conversation) => {
    activeIdRef.current = conversation.id
    setActiveConversation((current) => current?.id === conversation.id ? current : conversation)
    setThreadLoading(!conversation.messages)
    try {
      const response = await api.get(`${base}/${conversation.id}`, { skipCache: true })
      const detail = response.data?.data
      if (activeIdRef.current !== conversation.id || !detail) return
      setActiveConversation(detail)
      setConversations((items) => updateConversation(items, detail))
      await markRead(conversation.id)
    } catch (requestError) {
      if (activeIdRef.current === conversation.id) toast.error(errorMessage(requestError, 'Could not load this conversation.'))
    } finally {
      if (activeIdRef.current === conversation.id) setThreadLoading(false)
    }
  }, [base, markRead, toast])

  const startConversation = useCallback(async (type, storeId = null) => {
    try {
      const response = await api.post(base, {
        type,
        ...(storeId ? { store_id: storeId } : {}),
      })
      const conversation = response.data?.data
      if (!conversation) throw new Error('The conversation could not be opened.')
      setConversations((items) => updateConversation(items, conversation))
      await openConversation(conversation)
      return conversation
    } catch (requestError) {
      toast.error(errorMessage(requestError, 'Could not start this conversation.'))
      return null
    }
  }, [base, openConversation, toast])

  useEffect(() => {
    if (!requestedStore || loading || handledStoreRef.current === requestedStore) return
    handledStoreRef.current = requestedStore
    const existing = conversations.find((conversation) => conversation.type === 'store' && conversation.store_id === requestedStore)
    if (existing) openConversation(existing)
    else startConversation('store', requestedStore)
  }, [requestedStore, loading, conversations, openConversation, startConversation])

  useEffect(() => {
    if (!activeConversation?.id) return undefined

    let active = true
    let channel
    let pusher
    const connectionHandlers = {
      state_change: ({ current }) => {
        const connected = current === 'connected'
        setLive(connected)
        setStreamError(!connected)
      },
      connected: () => {
        setLive(true)
        setStreamError(false)
        setConnectionMessage('')
      },
      unavailable: () => {
        setLive(false)
        setStreamError(true)
      },
      failed: () => {
        setLive(false)
        setStreamError(true)
      },
      error: (event) => {
        const data = event?.error?.data || event?.data
        const code = data?.code || event?.error?.code
        const message = event?.error?.message || data?.message || event?.message
        setLive(false)
        setStreamError(true)
        setConnectionMessage(
          [code && `(${code})`, message].filter(Boolean).join(' ')
            || 'Realtime connection failed. Check the WebSocket server and proxy.',
        )
      },
    }

    try {
      const echo = getChatEcho()
      pusher = echo.connector.pusher
      channel = echo.private(`chat.conversation.${activeConversation.id}`)
      channel.listen('.chat.message.sent', ({ message }) => {
        if (!active || !message) return
        setActiveConversation((current) => {
          if (!current || current.id !== activeConversation.id) return current
          return {
            ...current,
            messages: mergeMessage(current.messages, message),
            last_message: message,
            last_message_at: message.created_at,
            unread_count: 0,
          }
        })
        setConversations((items) => {
          const current = items.find((item) => item.id === activeConversation.id) || activeConversation
          return updateConversation(items, {
            ...current,
            last_message: message,
            last_message_at: message.created_at,
            unread_count: 0,
          })
        })
        if (message.sender?.id !== user?.id) {
          api.post(`${base}/${activeConversation.id}/read`)
            .catch(() => {
              setStreamError(true)
              setConnectionMessage('A new message arrived, but its read status could not be updated.')
            })
        }
      })

      Object.entries(connectionHandlers).forEach(([event, handler]) => pusher.connection.bind(event, handler))
    } catch (connectionError) {
      setLive(false)
      setStreamError(true)
      setConnectionMessage(connectionError.message || 'Realtime chat could not connect.')
    }

    return () => {
      active = false
      if (pusher) {
        Object.entries(connectionHandlers).forEach(([event, handler]) => pusher.connection.unbind(event, handler))
      }
      if (channel) channel.stopListening('.chat.message.sent')
      if (channel) getChatEcho().leave(`chat.conversation.${activeConversation.id}`)
      setLive(false)
    }
  }, [activeConversation?.id, base, user?.id])

  useEffect(() => {
    if (previousConversationIdRef.current !== activeConversation?.id) {
      previousConversationIdRef.current = activeConversation?.id || null
      shouldStickToBottomRef.current = true
    }

    if (activeConversation?.id && listRef.current && shouldStickToBottomRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [activeConversation?.id, activeConversation?.messages])

  const sendMessage = async (event) => {
    event.preventDefault()
    const message = draft.trim()
    if ((!message && !attachments.length) || !activeConversation) return
    const conversationId = activeConversation.id
    const clientUuid = crypto.randomUUID()
    const selectedAttachments = attachments
    const sentAt = new Date().toISOString()
    const optimisticMessage = {
      id: `pending-${clientUuid}`,
      client_uuid: clientUuid,
      message,
      images: selectedAttachments.map(({ preview }) => preview),
      sender: { id: user?.id, name: user?.full_name || user?.name || 'You' },
      created_at: sentAt,
      pending: true,
    }

    setActiveConversation((current) => current?.id === conversationId ? {
      ...current,
      messages: mergeMessage(current.messages, optimisticMessage),
      last_message: optimisticMessage,
      last_message_at: sentAt,
    } : current)
    setConversations((items) => {
      const current = items.find((item) => item.id === conversationId) || activeConversation
      return updateConversation(items, { ...current, last_message: optimisticMessage, last_message_at: sentAt })
    })
    setDraft('')
    setAttachments([])
    setSendingCount((count) => count + 1)

    const formData = new FormData()
    formData.append('client_uuid', clientUuid)
    formData.append('message', message)
    selectedAttachments.forEach(({ file }) => formData.append('images[]', file))

    try {
      const response = await api.post(`${base}/${conversationId}/messages`, formData)
      const payload = response.data?.data
      if (payload?.message) {
        setActiveConversation((current) => {
          if (current?.id !== conversationId) return current
          return {
            ...current,
            messages: mergeMessage(current.messages, payload.message),
            last_message: payload.message,
            last_message_at: payload.message.created_at,
          }
        })
        if (payload.conversation) {
          setConversations((items) => updateConversation(items, payload.conversation))
        }
      }
      window.setTimeout(() => {
        selectedAttachments.forEach(({ preview }) => {
          URL.revokeObjectURL(preview)
          previewUrlsRef.current.delete(preview)
        })
      }, 1000)
    } catch (requestError) {
      if (activeIdRef.current === conversationId) {
        setActiveConversation((current) => current?.id === conversationId ? {
          ...current,
          messages: (current.messages || []).filter((item) => item.client_uuid !== clientUuid),
        } : current)
        setDraft((current) => current || message)
        setAttachments((current) => [...selectedAttachments, ...current].slice(0, 5))
      }
      setConversations((items) => items.map((item) => item.id === conversationId
        ? { ...item, last_message: item.last_message?.client_uuid === clientUuid ? null : item.last_message }
        : item))
      toast.error(errorMessage(requestError, 'Your message could not be sent.'))
    } finally {
      setSendingCount((count) => Math.max(0, count - 1))
    }
  }

  const addAttachments = (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const validFiles = files.filter((file) => {
      const supportedType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      if (!supportedType) toast.error(`${file.name}: choose a JPG, PNG, or WebP image.`)
      else if (file.size > 5 * 1024 * 1024) toast.error(`${file.name}: images must be 5 MB or smaller.`)
      return supportedType && file.size <= 5 * 1024 * 1024
    })

    const availableSlots = Math.max(0, 5 - attachments.length)
    const selected = validFiles.slice(0, availableSlots).map((file) => {
      const preview = URL.createObjectURL(file)
      previewUrlsRef.current.add(preview)
      return { id: crypto.randomUUID(), file, preview }
    })
    if (validFiles.length > availableSlots) toast.error('You can attach up to 5 images per message.')
    setAttachments((current) => [...current, ...selected])
  }

  const removeAttachment = (id) => {
    const attachment = attachments.find((item) => item.id === id)
    if (attachment) {
      URL.revokeObjectURL(attachment.preview)
      previewUrlsRef.current.delete(attachment.preview)
    }
    setAttachments((current) => current.filter((item) => item.id !== id))
  }

  const closeThread = () => {
    activeIdRef.current = null
    setActiveConversation(null)
    setDraft('')
    attachments.forEach(({ preview }) => {
      URL.revokeObjectURL(preview)
      previewUrlsRef.current.delete(preview)
    })
    setAttachments([])
  }

  const title = portal === 'customer' ? 'Messages' : portal === 'vendor' ? 'Customer Messages' : 'Customer & Store Messages'

  return (
    <section className={`conversation-inbox conversation-inbox--${portal}`} aria-label={title}>
      <header className="conversation-inbox__heading">
        <div>
          <h1>{title}</h1>
          <p>
            {portal === 'customer'
              ? 'Chat directly with stores or contact GOSIKA Support.'
              : portal === 'vendor'
                ? 'Reply to customer questions about your store.'
                : 'Chat with customers and stores across the marketplace.'}
          </p>
        </div>
        {portal === 'customer' && (
          <button type="button" className="btn btn-primary" onClick={() => startConversation('support')}>
            <Headset size={16} /> GOSIKA Support
          </button>
        )}
      </header>

      <div className={`conversation-inbox__layout${activeConversation ? ' has-active' : ''}`}>
        <aside className={`conversation-inbox__list${activeConversation ? ' is-hidden-mobile' : ''}`} aria-label="Conversation list">
          {loading ? (
            <div className="conversation-inbox__loading"><Spinner size={22} color="var(--primary)" /></div>
          ) : error ? (
            <ErrorState message={errorMessage(error, 'Could not load conversations.')} onRetry={loadConversations} />
          ) : conversations.length ? (
            conversations.map((conversation) => {
              const selected = activeConversation?.id === conversation.id
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`conversation-inbox__item${selected ? ' is-active' : ''}`}
                  onClick={() => openConversation(conversation)}
                >
                  <span className="conversation-inbox__avatar">
                    {conversation.type === 'store' ? <Store size={18} /> : <UserRound size={18} />}
                  </span>
                  <span className="conversation-inbox__item-copy">
                    <span className="conversation-inbox__item-title">{conversationTitle(conversation, portal)}</span>
                    <span className="conversation-inbox__item-preview">{messagePreview(conversation)}</span>
                  </span>
                  <span className="conversation-inbox__item-meta">
                    <time>{formatDateTime(conversation.last_message_at || conversation.created_at)}</time>
                    {conversation.unread_count > 0 && <span className="conversation-inbox__unread">{conversation.unread_count}</span>}
                  </span>
                </button>
              )
            })
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              message={portal === 'customer' ? 'Contact a store from its page or start a conversation with GOSIKA Support.' : 'Customer conversations will appear here when someone sends a message.'}
              action={portal === 'customer' ? <button className="btn btn-primary" onClick={() => startConversation('support')}><Headset size={15} /> Message Support</button> : undefined}
            />
          )}
        </aside>

        <section className={`conversation-inbox__thread${!activeConversation ? ' is-empty' : ''}`} aria-label="Conversation thread">
          {activeConversation ? (
            <>
              <header className="conversation-inbox__thread-header">
                <button type="button" className="conversation-inbox__back" onClick={closeThread} aria-label="Back to conversations">
                  <ArrowLeft size={19} />
                </button>
                <span className="conversation-inbox__avatar"><Store size={18} /></span>
                <span className="conversation-inbox__thread-heading">
                  <strong>{conversationTitle(activeConversation, portal)}</strong>
                  <small>{live ? 'Live chat' : streamError ? 'Reconnecting…' : 'Connecting…'}</small>
                </span>
                <span className={`conversation-inbox__live-dot${live ? ' is-live' : ''}`} aria-label={live ? 'Live connection active' : 'Live connection reconnecting'} />
              </header>

              <div
                className="conversation-inbox__messages"
                ref={listRef}
                onScroll={(event) => {
                  const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
                  shouldStickToBottomRef.current = scrollHeight - scrollTop - clientHeight < 48
                }}
              >
                {threadLoading && !activeConversation.messages?.length ? (
                  <div className="conversation-inbox__loading"><Spinner size={22} color="var(--primary)" /></div>
                ) : activeConversation.messages?.length ? (
                  activeConversation.messages.map((message) => {
                    const own = message.sender?.id === user?.id
                    return (
                      <article key={message.id} className={`conversation-inbox__message${own ? ' is-own' : ''}`}>
                        <span className="conversation-inbox__message-sender">{own ? 'You' : message.sender?.name || conversationTitle(activeConversation, portal)}</span>
                        {message.images?.length > 0 && (
                          <div className="conversation-inbox__message-images">
                            {message.images.map((image, index) => {
                              const imageUrl = typeof image === 'string' ? image : image.url
                              return (
                                <ChatImage key={`${message.id}-image-${index}`} url={imageUrl} alt={`Chat attachment ${index + 1}`} />
                              )
                            })}
                          </div>
                        )}
                        {message.message && <p>{message.message}</p>}
                        <time>{message.pending ? 'Sending…' : formatDateTime(message.created_at)}</time>
                      </article>
                    )
                  })
                ) : (
                  <div className="conversation-inbox__empty-thread">
                    <MessageCircle size={28} />
                    <p>Send a message to start this conversation.</p>
                  </div>
                )}
              </div>

              {streamError && <p className="conversation-inbox__connection-warning">{connectionMessage || 'Connection interrupted. Reconnecting…'}</p>}
              <form className="conversation-inbox__composer" onSubmit={sendMessage}>
                {attachments.length > 0 && (
                  <div className="conversation-inbox__attachment-previews">
                    {attachments.map((attachment) => (
                      <span key={attachment.id} className="conversation-inbox__attachment-preview">
                        <img src={attachment.preview} alt="Selected image preview" />
                        <button type="button" onClick={() => removeAttachment(attachment.id)} aria-label="Remove image">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="conversation-inbox__composer-row">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={addAttachments}
                    aria-label="Attach images"
                  />
                  <button
                    type="button"
                    className="conversation-inbox__attach"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={attachments.length >= 5}
                    aria-label="Attach images"
                    title="Attach images (up to 5)"
                  >
                    <ImagePlus size={19} />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    placeholder="Write a message…"
                    aria-label="Message"
                    rows={1}
                    maxLength={5000}
                  />
                  <button type="submit" className="btn btn-primary" disabled={!draft.trim() && !attachments.length} aria-label="Send message">
                    {sending ? <Spinner size={16} color="#fff" /> : <Send size={16} />}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="conversation-inbox__welcome">
              <MessageCircle size={34} />
              <strong>Select a conversation</strong>
              <span>Messages are delivered live while you chat.</span>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
