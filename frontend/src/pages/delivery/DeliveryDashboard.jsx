import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Inbox, Truck, Navigation, CheckCircle2, AlertTriangle, Store,
  MapPin, Banknote, Calendar, ArrowRight, Radio, RefreshCw,
  Search, Loader2, Package, Check, Phone, ShieldAlert, ChevronRight,
  RotateCcw, Sparkles
} from 'lucide-react'
import api from '../../api/client'
import { useDelivery } from '../../context/DeliveryContext'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, timeAgo, errorMessage } from '../../utils/format'
import { getNepaliDate } from '../../utils/nepalDate'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'

export default function DeliveryDashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const { rider, online, toggleOnline, toggling } = useDelivery()

  const [activeTab, setActiveTab] = useState('available') // 'available' | 'assigned' | 'active' | 'completed' | 'failed'
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Available jobs state
  const [availableJobs, setAvailableJobs] = useState([])
  const [availableLoading, setAvailableLoading] = useState(true)
  const [availableError, setAvailableError] = useState(null)
  const [searchAvailable, setSearchAvailable] = useState('')
  const [areaScope, setAreaScope] = useState('all') // 'all' | 'my_area'
  const [claimingId, setClaimingId] = useState(null)

  // Assigned & Active deliveries state
  const [deliveries, setDeliveries] = useState([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)
  const [deliveriesError, setDeliveriesError] = useState(null)

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/delivery-partner/dashboard-stats', { skipCache: true })
      setStats(res.data?.data || null)
    } catch {
      // Graceful fallback
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load available jobs
  const loadAvailableJobs = useCallback(async () => {
    setAvailableLoading(true)
    setAvailableError(null)
    try {
      const params = { scope: areaScope }
      if (searchAvailable.trim()) params.search = searchAvailable.trim()
      const res = await api.get('/delivery-partner/available-jobs', { params, skipCache: true })
      setAvailableJobs(api.unwrapList(res.data))
    } catch (err) {
      setAvailableError(err.response?.data?.message || 'Failed to load available delivery jobs.')
    } finally {
      setAvailableLoading(false)
    }
  }, [searchAvailable, areaScope])

  // Load assigned/active/history deliveries based on tab
  const loadDeliveries = useCallback(async (tab) => {
    if (tab === 'available') return
    setDeliveriesLoading(true)
    setDeliveriesError(null)
    try {
      let statusParam = ''
      if (tab === 'assigned') statusParam = 'assigned'
      else if (tab === 'active') statusParam = 'picked_up'
      else if (tab === 'completed') statusParam = 'delivered'
      else if (tab === 'failed') statusParam = 'failed'

      const res = await api.get('/delivery-partner/assignments', {
        params: statusParam ? { status: statusParam } : {},
        skipCache: true,
      })
      setDeliveries(api.unwrapList(res.data))
    } catch (err) {
      setDeliveriesError(err.response?.data?.message || 'Failed to load deliveries.')
    } finally {
      setDeliveriesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    if (activeTab === 'available') {
      loadAvailableJobs()
    } else {
      loadDeliveries(activeTab)
    }
  }, [activeTab, loadAvailableJobs, loadDeliveries])

  // Claim job action
  const handleClaim = async (job) => {
    if (!online && rider?.status === 'approved') {
      toast.error('You are currently offline. Please toggle your status to Online before claiming jobs.')
      return
    }

    setClaimingId(job.id)
    try {
      await api.post(`/delivery-partner/available-jobs/${job.id}/claim`)
      toast.success('Shipment claimed successfully! It has been added to your assigned deliveries.')
      
      // Remove from available list immediately
      setAvailableJobs(prev => prev.filter(j => j.id !== job.id))
      loadStats()

      // Navigate to assigned tab so rider can see it right away
      setActiveTab('assigned')
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.message || 'Failed to claim shipment.'
      
      if (status === 409) {
        toast.error('This shipment has already been claimed by another delivery partner.')
        // Refresh available list to remove the claimed job
        loadAvailableJobs()
      } else if (status === 403) {
        toast.error(msg || 'You are not authorized or eligible to claim this delivery job.')
      } else {
        toast.error(msg)
      }
    } finally {
      setClaimingId(null)
    }
  }

  const isApproved = rider?.status === 'approved'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header & Duty Switch */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>Delivery Portal</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
                background: online ? '#ecfdf5' : '#f1f5f9',
                color: online ? '#10b981' : '#64748b',
                border: `1px solid ${online ? '#a7f3d0' : '#e2e8f0'}`,
              }}
            >
              <Radio size={12} className={online ? 'animate-pulse' : ''} /> {online ? 'ONLINE & READY' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0', fontWeight: 500 }}>
            Welcome back, {rider?.name || 'Rider'} · {rider?.vehicle_type ? `${rider.vehicle_type} · ` : ''}Manage jobs & last-mile fulfillment
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Online Toggle Button */}
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
                padding: '8px 16px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                background: online ? '#fef2f2' : '#ecfdf5',
                color: online ? '#dc2626' : '#16a34a',
                border: `1.5px solid ${online ? '#fecaca' : '#bbf7d0'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {toggling ? <Loader2 size={15} className="spin" /> : <Radio size={15} />}
              {online ? 'Go Offline' : 'Go Online to Claim'}
            </button>
          )}

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="#64748b" />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{getNepaliDate()}</span>
          </div>
        </div>
      </div>

      {/* Account Inactive Notice */}
      {!isApproved && rider && (
        <div style={{ padding: '14px 18px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={20} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: 13.5 }}>Application Pending Approval</div>
            <div style={{ color: '#b45309', fontSize: 12.5, marginTop: 2 }}>
              Your delivery partner account is currently pending administrative verification. Once approved, you can set your status to Online and claim jobs.
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div
          onClick={() => setActiveTab('available')}
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: activeTab === 'available' ? 'rgba(255,85,0,0.06)' : '#fff',
            border: `1.5px solid ${activeTab === 'available' ? 'var(--primary)' : 'var(--border)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="btn-tactile"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Available Jobs</span>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#fff0e6', color: '#ff5500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Inbox size={16} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {statsLoading ? <Loader2 size={18} className="spin" /> : (stats?.available_jobs ?? availableJobs.length)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Ready for pickup now</div>
        </div>

        <div
          onClick={() => setActiveTab('assigned')}
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: activeTab === 'assigned' ? 'rgba(99,102,241,0.06)' : '#fff',
            border: `1.5px solid ${activeTab === 'assigned' ? '#6366f1' : 'var(--border)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="btn-tactile"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>My Assigned</span>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#e0e7ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={16} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {statsLoading ? <Loader2 size={18} className="spin" /> : (stats?.assigned ?? 0)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>Pickup queued</div>
        </div>

        <div
          onClick={() => setActiveTab('active')}
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: activeTab === 'active' ? 'rgba(37,99,235,0.06)' : '#fff',
            border: `1.5px solid ${activeTab === 'active' ? '#2563eb' : 'var(--border)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="btn-tactile"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Active Deliveries</span>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={16} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {statsLoading ? <Loader2 size={18} className="spin" /> : (stats?.active_in_transit ?? 0)}
          </div>
          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>On the road</div>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: activeTab === 'completed' ? 'rgba(22,163,74,0.06)' : '#fff',
            border: `1.5px solid ${activeTab === 'completed' ? '#16a34a' : 'var(--border)'}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          className="btn-tactile"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Completed Today</span>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--ink)' }}>
            {statsLoading ? <Loader2 size={18} className="spin" /> : (stats?.today_completed ?? 0)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>Confirmed delivered</div>
        </div>

        <div
          style={{
            padding: '16px 18px',
            borderRadius: 14,
            background: '#fff',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>COD Outstanding</span>
            <span style={{ width: 32, height: 32, borderRadius: 9, background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={16} />
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
            {money(stats?.cod_to_collect ?? 0)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>To turn in to hub</div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--border)', paddingBottom: 2, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            type="button"
            onClick={() => setActiveTab('available')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeTab === 'available' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'available' ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Inbox size={15} />
            Available Jobs
            <span style={{ background: activeTab === 'available' ? 'rgba(255,255,255,0.3)' : '#f1f5f9', color: activeTab === 'available' ? '#fff' : '#0f172a', padding: '1px 7px', borderRadius: 999, fontSize: 11 }}>
              {availableJobs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assigned')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeTab === 'assigned' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'assigned' ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Truck size={15} />
            My Assigned
            {stats?.assigned ? (
              <span style={{ background: activeTab === 'assigned' ? 'rgba(255,255,255,0.3)' : '#f1f5f9', color: activeTab === 'assigned' ? '#fff' : '#0f172a', padding: '1px 7px', borderRadius: 999, fontSize: 11 }}>
                {stats.assigned}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeTab === 'active' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'active' ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Navigation size={15} />
            Active In-Transit
            {stats?.active_in_transit ? (
              <span style={{ background: activeTab === 'active' ? 'rgba(255,255,255,0.3)' : '#f1f5f9', color: activeTab === 'active' ? '#fff' : '#0f172a', padding: '1px 7px', borderRadius: 999, fontSize: 11 }}>
                {stats.active_in_transit}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeTab === 'completed' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'completed' ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckCircle2 size={15} />
            Completed
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('failed')}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeTab === 'failed' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'failed' ? '#fff' : '#64748b',
              border: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={15} />
            Failed / Returns
          </button>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-xs flex items-center gap-1.5"
          onClick={() => {
            loadStats()
            if (activeTab === 'available') loadAvailableJobs()
            else loadDeliveries(activeTab)
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── TAB 1: AVAILABLE JOBS ────────────────────────────────────────── */}
      {activeTab === 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: '1 1 auto' }}>
              <div style={{ position: 'relative', width: 320, maxWidth: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search pickup store, order #, items…"
                  value={searchAvailable}
                  onChange={e => setSearchAvailable(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 34, height: 38, width: '100%', fontSize: 13, borderRadius: 10 }}
                />
              </div>

              {/* Area Scope Selector */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
                <button
                  type="button"
                  onClick={() => setAreaScope('all')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: areaScope === 'all' ? '#fff' : 'transparent',
                    color: areaScope === 'all' ? 'var(--ink)' : '#64748b',
                    boxShadow: areaScope === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  All Available Jobs {stats?.all_available_jobs != null && `(${stats.all_available_jobs})`}
                </button>
                <button
                  type="button"
                  onClick={() => setAreaScope('my_area')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    background: areaScope === 'my_area' ? '#fff' : 'transparent',
                    color: areaScope === 'my_area' ? 'var(--ink)' : '#64748b',
                    boxShadow: areaScope === 'my_area' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  My Service Area {stats?.available_jobs != null && `(${stats.available_jobs})`}
                </button>
              </div>
            </div>

            {!online && isApproved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#dc2626', background: '#fef2f2', padding: '6px 12px', borderRadius: 8, border: '1px solid #fee2e2' }}>
                <AlertTriangle size={14} /> You are Offline. Toggle status to Online above to claim jobs.
              </div>
            )}
          </div>

          {availableLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="card" style={{ padding: 18, borderRadius: 14 }}>
                  <Skeleton height={20} width={120} style={{ marginBottom: 12 }} />
                  <Skeleton height={60} style={{ marginBottom: 12 }} />
                  <Skeleton height={36} />
                </div>
              ))}
            </div>
          ) : availableError ? (
            <ErrorState title="Failed to load available jobs" message={availableError} onRetry={loadAvailableJobs} />
          ) : availableJobs.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff0e6', color: '#ff5500', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Inbox size={28} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                No Available Delivery Jobs
              </h3>
              <p style={{ color: '#64748b', fontSize: 13, maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
                {searchAvailable.trim()
                  ? 'No available jobs match your search filter. Try clearing the search.'
                  : areaScope === 'my_area' && (stats?.all_available_jobs || 0) > 0
                  ? `There are no jobs in your primary zone, but ${stats.all_available_jobs} job(s) are waiting across the marketplace.`
                  : 'There are no prepared shipments waiting for assignment right now. When sellers mark orders Ready for Pickup, they will appear here instantly.'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {areaScope === 'my_area' && (stats?.all_available_jobs || 0) > 0 && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setAreaScope('all')}>
                    View All {stats.all_available_jobs} Marketplace Jobs
                  </button>
                )}
                <button type="button" className="btn btn-outline btn-sm" onClick={loadAvailableJobs}>
                  <RefreshCw size={14} /> Check for New Jobs
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {availableJobs.map(job => (
                <div
                  key={job.id}
                  className="card btn-tactile"
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
                    transition: 'all 0.16s ease',
                  }}
                >
                  {/* Job Header */}
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

                    {/* Store Pickup & Delivery Destination */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: '12px 14px', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Store size={15} style={{ color: '#ff5500', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>PICKUP FROM</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{job.pickup?.store_name}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 1 }} className="truncate">{job.pickup?.address || 'Seller Store Address'}</div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }} />

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <MapPin size={15} style={{ color: '#2563eb', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>DELIVER TO</div>
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
                          {job.payment?.is_cod ? 'COD Payment To Collect' : 'Prepaid Order'}
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

                  {/* Claim Button */}
                  <div style={{ marginTop: 6 }}>
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TABS 2-5: ASSIGNED / ACTIVE / COMPLETED / FAILED DELIVERIES ──── */}
      {activeTab !== 'available' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {deliveriesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="card" style={{ padding: 18, borderRadius: 14 }}>
                  <Skeleton height={24} width={180} style={{ marginBottom: 10 }} />
                  <Skeleton height={40} />
                </div>
              ))}
            </div>
          ) : deliveriesError ? (
            <ErrorState title="Failed to load queue" message={deliveriesError} onRetry={() => loadDeliveries(activeTab)} />
          ) : deliveries.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', borderRadius: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Truck size={28} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                No Deliveries Found in this Tab
              </h3>
              <p style={{ color: '#64748b', fontSize: 13, maxWidth: 380, margin: '0 auto 16px' }}>
                {activeTab === 'assigned' && 'You currently have no newly claimed or assigned shipments awaiting pickup.'}
                {activeTab === 'active' && 'You have no parcels currently out for delivery or picked up.'}
                {activeTab === 'completed' && 'No completed deliveries recorded in this view.'}
                {activeTab === 'failed' && 'No failed or returned deliveries recorded.'}
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveTab('available')}>
                Browse Available Jobs
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {deliveries.map(a => (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: a.status === 'delivered' ? '#ecfdf5' : a.status === 'failed' ? '#fef2f2' : 'rgba(255,85,0,0.08)',
                        color: a.status === 'delivered' ? '#10b981' : a.status === 'failed' ? '#ef4444' : '#ff5500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {a.status === 'delivered' ? <CheckCircle2 size={22} /> : a.status === 'failed' ? <AlertTriangle size={22} /> : <Truck size={22} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>
                          #{a.vendor_order_number || a.id.slice(0, 8)}
                        </span>
                        <DeliveryStatusBadge status={a.status} size="xs" />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        {a.recipient_name ? `Customer: ${a.recipient_name}` : ''}
                        {a.recipient_phone ? ` · ${a.recipient_phone}` : ''}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {a.dropoff_address || 'Destination address'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {Number(a.cod_amount) > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#854d0e' }}>COD TO COLLECT</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#a16207' }}>{money(a.cod_amount)}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {a.status === 'assigned' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm flex items-center gap-1"
                          onClick={async () => {
                            try {
                              await api.post(`/delivery-partner/assignments/${a.id}/accept`)
                              toast.success('Delivery accepted. Proceed to pickup.')
                              loadDeliveries('assigned')
                              loadStats()
                            } catch (e) {
                              toast.error(errorMessage(e))
                            }
                          }}
                        >
                          <Package size={13} /> Accept Delivery
                        </button>
                      )}

                      {a.status === 'accepted' && (
                        <Link to={`/delivery/deliveries/${a.id}/pickup`} className="btn btn-primary btn-sm flex items-center gap-1">
                          <Package size={13} /> Proceed to Pickup
                        </Link>
                      )}

                      {a.status === 'picked_up' && (
                        <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-primary btn-sm flex items-center gap-1">
                          <Navigation size={13} /> Start Delivery
                        </Link>
                      )}

                      {a.status === 'out_for_delivery' && (
                        <Link to={`/delivery/deliveries/${a.id}/deliver`} className="btn btn-success btn-sm flex items-center gap-1">
                          <CheckCircle2 size={13} /> Confirm Delivery
                        </Link>
                      )}

                      <Link to={`/delivery/deliveries/${a.id}`} className="btn btn-outline btn-sm flex items-center gap-1">
                        View Details <ChevronRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
