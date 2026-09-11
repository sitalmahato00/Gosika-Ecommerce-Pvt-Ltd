import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Receipt, RotateCcw, CheckCircle2 } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDate, apiImage } from '../../utils/format'
import { AccountPage, AccountSkeleton, AccountEmpty, AccountError } from './AccountUI'

const REFUND_STATUSES = ['approved', 'collected', 'inspected', 'refund_pending', 'refunded', 'completed']

export default function AccountRefunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    api
      .get('/customer/returns', { params: { per_page: 100 } })
      .then((res) => {
        const raw = res.data?.data?.data ?? res.data?.data ?? res.data
        const list = Array.isArray(raw) ? raw : []
        setRefunds(list.filter((r) => REFUND_STATUSES.includes(r.status)))
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <AccountPage title="Refund Status" subtitle="Track money you are getting back for returned or cancelled items.">
        <AccountSkeleton rows={3} height={92} />
      </AccountPage>
    )
  }

  if (error) {
    return (
      <AccountPage title="Refund Status" subtitle="Track money you are getting back for returned or cancelled items.">
        <AccountError message="Could not load your refunds." onRetry={load} />
      </AccountPage>
    )
  }

  return (
    <AccountPage
      title="Refund Status"
      subtitle="Track money you are getting back for returned or cancelled items."
      actions={<Link to="/account/returns" className="btn btn-outline btn-sm">Returns & Exchanges</Link>}
    >
      {refunds.length === 0 ? (
        <AccountEmpty
          icon={Receipt}
          title="No refunds yet"
          message="Refunds for returned items will appear here with their latest status. Nothing to worry — we'll notify you when a refund lands."
          action={<Link to="/account/returns" className="btn btn-outline"><RotateCcw size={15} /> View Returns</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {refunds.map((r) => (
            <div key={r.id} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="flex items-center gap-3">
                  {r.product_image && (
                    <img src={apiImage(r.product_image)} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }} />
                  )}
                  <div>
                    <div className="font-semibold" style={{ fontSize: 14 }}>{r.product_name || 'Order item'}</div>
                    <div className="muted text-xs">#{r.return_number}</div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="muted text-sm">
                  {r.refund_amount && r.refund_amount !== '0.00' ? (
                    <span>
                      Refund amount <strong style={{ color: 'var(--success)' }}>{money(Number(r.refund_amount))}</strong>
                    </span>
                  ) : (
                    <span>Refund amount being calculated</span>
                  )}
                  {r.reviewed_at && <span className="muted"> · updated {formatDate(r.reviewed_at)}</span>}
                </div>
                {r.status === 'refunded' && (
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--success)', fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle2 size={15} /> Refunded to your payment method
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  )
}