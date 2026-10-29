import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Inbox, Store, MapPin, Package, Check, AlertTriangle, RefreshCw,
  Search, Loader2, Sparkles, Radio, CheckCircle2, ChevronRight
} from 'lucide-react'
import api from '../../api/client'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { money, timeAgo } from '../../utils/format'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryAvailableJobs() {
  const navigate = useNavigate()
  const toast = useToast()
  const { rider, online, toggleOnline, toggling } = useDelivery()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [claimingId, setClaimingId] = useState(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/delivery-partner/available-jobs', { params, skipCache: true })
      setJobs(api.unwrapList(res.data))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available delivery jobs.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleClaim = async (job) => {
    if (!online && rider?.status === 'approved') {
      toast.error('You are currently offline. Please toggle your status to Online before claiming jobs.')
      return
    }

    setClaimingId(job.id)
    try {
      await api.post(`/delivery-partner/available-jobs/${job.id}/claim`)
      toast.success('Shipment claimed successfully! Moving to your assigned deliveries.')
      setJobs(prev => prev.filter(j => j.id !== job.id))
      navigate('/delivery/deliveries')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || 'Failed to claim shipment.'
      if (status === 409) {
        toast.error('This shipment has already been claimed by another delivery partner.')
        loadJobs()
      } else if (status === 403) {
        toast.error(msg || 'You are not eligible to claim this delivery job.')
      } else {
        toast.error(msg)
      }
    } finally {
      setClaimingId(null)
    }
  }

  const isApproved = rider?.status === 'approved'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>Available Delivery Jobs</h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
            Prepared shipments ready for pickup in your approved service area. Claim to start fulfillment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isApproved && (
            <button
              type="button"
              onClick={toggleOnline}
              disabled={toggling}
              className="btn btn-tactile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                borderRadius: 9,
                fontWeight: 800,
                fontSize: 12.5,
                background: online ? '#fef2f2' : '#ecfdf5',
                color: online ? '#dc2626' : '#16a34a',
                border: `1.5px solid ${online ? '#fecaca' : '#bbf7d0'}`,
                cursor: 'pointer',
              }}
            >
              {toggling ? <Loader2 size={14} className="spin" /> : <Radio size={14} />}
              {online ? 'Status: Online' : 'Status: Offline (Click to go Online)'}
            </button>
          )}

          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={loadJobs}>
            <RefreshCw size={14} /> Refresh Jobs
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {!online && isApproved && (
        <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#92400e' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>You are currently offline. You must switch your status to <strong>Online</strong> above to claim shipments.</span>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative', maxWidth: 420 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Search store name, destination, order #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ paddingLeft: 34, height: 38, width: '100%', fontSize: 13, borderRadius: 10 }}
        />
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="card" style={{ padding: 18, borderRadius: 14 }}>
              <Skeleton height={20} width={140} style={{ marginBottom: 12 }} />
              <Skeleton height={60} style={{ marginBottom: 12 }} />
              <Skeleton height={40} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Failed to load jobs" message={error} onRetry={loadJobs} />
      ) : jobs.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff0e6', color: '#ff5500', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Inbox size={28} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
            No Available Delivery Jobs Right Now
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, maxWidth: 420, margin: '0 auto 18px', lineHeight: 1.5 }}>
            {search.trim()
              ? 'No available jobs match your search keywords.'
              : 'Shipments marked Ready for Pickup by marketplace vendors will appear here for self-claiming.'}
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={loadJobs}>
            <RefreshCw size={14} /> Refresh Available Jobs
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {jobs.map(job => (
            <div
              key={job.id}
              className="card"
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: 18,
                border: '1px solid var(--border)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>
                      #{job.vendor_order_number}
                    </span>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                      Ready {job.ready_at ? timeAgo(job.ready_at) : 'recently'}
                    </div>
                  </div>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      padding: '3px 9px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={11} /> Ready for Pickup
                  </span>
                </div>

                {/* Pickup & Destination */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: '12px 14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Store size={15} style={{ color: '#ff5500', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>PICKUP STORE</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{job.pickup?.store_name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }} className="truncate">{job.pickup?.address || 'Seller Store Address'}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }} />

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <MapPin size={15} style={{ color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>DELIVERY AREA</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                        {[job.dropoff?.delivery_area?.municipality, job.dropoff?.delivery_area?.district].filter(Boolean).join(', ') || 'Customer Area'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }} className="truncate">{job.dropoff?.destination}</div>
                    </div>
                  </div>
                </div>

                {/* Package details */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, padding: '0 2px' }}>
                  <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Package size={13} /> {job.package?.item_count ?? 1} item{job.package?.item_count === 1 ? '' : 's'} ({job.package?.items_summary || 'Package items'})
                  </span>
                </div>

                {/* COD & Earnings row */}
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: job.payment?.is_cod ? '#fefce8' : '#f0fdf4', border: `1px solid ${job.payment?.is_cod ? '#fef08a' : '#bbf7d0'}` }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: job.payment?.is_cod ? '#854d0e' : '#166534', textTransform: 'uppercase' }}>
                      {job.payment?.is_cod ? 'COD Amount To Collect' : 'Prepaid Order'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: job.payment?.is_cod ? '#a16207' : '#15803d' }}>
                      {job.payment?.is_cod ? money(job.payment.cod_amount) : 'Paid Online'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Rider Earnings</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>
                      {money(job.delivery_fee || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Claim Action */}
              <button
                type="button"
                onClick={() => handleClaim(job)}
                disabled={claimingId === job.id || !isApproved}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 11,
                  fontSize: 13.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 3px 12px rgba(255,85,0,0.2)',
                  cursor: isApproved ? 'pointer' : 'not-allowed',
                }}
              >
                {claimingId === job.id ? (
                  <>
                    <Loader2 size={16} className="spin" /> Claiming Shipment…
                  </>
                ) : (
                  <>
                    <Check size={16} /> Claim This Job
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
