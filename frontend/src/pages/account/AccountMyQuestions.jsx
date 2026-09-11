import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircleQuestion, BadgeCheck, Clock } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { apiImage, formatDate } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

export default function AccountMyQuestions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/customer/questions', { params: { per_page: 50 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        setQuestions(Array.isArray(raw) ? raw : [])
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="My Questions & Answers" subtitle="Questions you have asked sellers about products.">
        <AccountSkeleton rows={3} height={110} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="My Questions & Answers" subtitle="Questions you have asked sellers about products.">
        <AccountError message="Could not load your questions." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage title="My Questions & Answers" subtitle="Questions you have asked sellers about products.">
      {questions.length === 0 ? (
        <AccountEmpty
          icon={MessageCircleQuestion}
          title="No questions yet"
          message="Ask a seller anything on a product page and your questions will be tracked here."
          action={<Link to="/shop" className="btn btn-primary">Explore Products</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {questions.map((q) => (
            <div key={q.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.product && (
                <div className="flex items-center gap-3">
                  {q.product.image && (
                    <img src={apiImage(q.product.image)} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                  )}
                  <Link to={`/product/${q.product.id}`} className="font-semibold" style={{ fontSize: 13.5, textDecoration: 'none', color: 'var(--ink)' }}>
                    {q.product.name}
                  </Link>
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{q.question}</div>
                <div className="muted text-xs" style={{ marginTop: 3 }}>Asked {formatDate(q.created_at)}</div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px' }}>
                {q.answer ? (
                  <>
                    <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--success)', fontSize: 12.5, marginBottom: 4 }}>
                      <BadgeCheck size={14} /> Seller answered {q.answered_at ? formatDate(q.answered_at) : ''}
                    </span>
                    <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>{q.answer}</div>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--muted)', fontSize: 13 }}>
                    <Clock size={14} /> Waiting for the seller to answer
                  </span>
                )}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <StatusBadge status={q.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}