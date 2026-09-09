import React, { useState, useEffect } from 'react'
import {
  Users, Sparkles, ShoppingBag, RefreshCw, Layers, ChevronRight
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, timeAgo, initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SEGMENT_STYLE = {
  slate: { bg: '#f1f5f9', text: '#475569', soft: '#e2e8f0' },
  emerald: { bg: '#ecfdf5', text: '#059669', soft: '#d1fae5' },
  sky: { bg: '#f0f9ff', text: '#0284c7', soft: '#e0f2fe' },
  indigo: { bg: '#eef2ff', text: '#4f46e5', soft: '#e0e7ff' },
  amber: { bg: '#fffbeb', text: '#d97706', soft: '#fef3c7' },
  rose: { bg: '#fff1f2', text: '#e11d48', soft: '#ffe4e6' },
}

const SEGMENT_ICON = {
  users: Users,
  sparkles: Sparkles,
  'shopping-bag': ShoppingBag,
  refresh: RefreshCw,
  'trending-up': RefreshCw,
  'alert-triangle': Sparkles,
  layers: Layers,
}

const SEGMENT_ORDER = ['all_customers', 'new_customers', 'active_buyers', 'repeat_buyers', 'high_value', 'at_risk']

export default function AdminCustomerSegments() {
  const toast = useToast()
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)

  const [membersOpen, setMembersOpen] = useState(false)
  const [activeSegment, setActiveSegment] = useState(null)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersPagination, setMembersPagination] = useState(null)
  const [membersPage, setMembersPage] = useState(1)

  const loadSegments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/customers/segments')
      const data = res.data?.data || {}
      const ordered = SEGMENT_ORDER
        .filter(k => data[k])
        .map(k => ({ key: k, ...data[k] }))
      setSegments(ordered)
    } catch (err) {
      toast.error('Failed to load segments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSegments()
  }, [])

  const openMembers = (segment) => {
    setActiveSegment(segment)
    setMembersOpen(true)
    setMembersPage(1)
    loadMembers(segment.key, 1)
  }

  const loadMembers = async (key, page) => {
    setMembersLoading(true)
    try {
      const res = await api.get(`/admin/customers/segments/${key}`, { params: { page, per_page: 15 } })
      setMembers(api.unwrapList(res.data))
      setMembersPagination(res.data?.meta?.pagination || null)
    } catch (err) {
      toast.error('Failed to load segment members.')
    } finally {
      setMembersLoading(false)
    }
  }

  const handleMembersPage = (next) => {
    setMembersPage(next)
    loadMembers(activeSegment.key, next)
  }

  const columns = [
    {
      header: 'Customer',
      render: item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#eff6ff', color: 'var(--primary)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {initials(item.name || 'C')}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--ink)' }}>{item.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Contact',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{item.phone || '—'}</span>
      )
    },
    {
      header: 'Orders',
      render: item => <span style={{ fontSize: 12.5, fontWeight: 700 }}>{item.orders_count ?? 0}</span>
    },
    {
      header: 'Spent',
      render: item => <span style={{ fontSize: 12.5, fontWeight: 700 }}>{money(item.total_spend || 0)}</span>
    },
    {
      header: 'Last Order',
      render: item => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{item.last_order_at ? timeAgo(item.last_order_at) : '—'}</span>
    },
    {
      header: 'Status',
      render: item => <StatusBadge status={item.status || 'active'} />
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Customer Segments"
        description="Dynamic groups computed from live order and account data. Click a segment to browse its members."
        breadcrumbs={[
          { label: 'Customers', to: '/admin/customers' },
          { label: 'Segments' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadSegments}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 150, borderRadius: 14, border: '1px solid var(--border)', background: 'linear-gradient(90deg,#f1f5f9 25%,#f8fafc 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.2s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 }}>
          {segments.map(seg => {
            const style = SEGMENT_STYLE[seg.color] || SEGMENT_STYLE.slate
            const Icon = SEGMENT_ICON[seg.icon] || Users
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => openMembers(seg)}
                className="card btn-tactile"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 18,
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: style.bg, color: style.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{seg.count.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{seg.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{seg.description}</div>
                  <div style={{ display: 'inline-block', marginTop: 8, padding: '3px 8px', borderRadius: 6, background: style.soft, color: style.text, fontSize: 11, fontWeight: 700 }}>
                    {seg.criteria}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Sample members</div>
                  {seg.samples?.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {seg.samples.slice(0, 3).map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: style.bg, color: style.text, fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {initials(s.name)}
                          </div>
                          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>No members yet</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {membersOpen && activeSegment && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setMembersOpen(false) }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 900, background: '#fff', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '86vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{activeSegment.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{activeSegment.criteria} · {activeSegment.count.toLocaleString()} members</div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setMembersOpen(false)}>✕</button>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              <DataTable
                columns={columns}
                data={members}
                loading={membersLoading}
                pagination={membersPagination}
                onPageChange={handleMembersPage}
                emptyTitle="No members in this segment"
                emptyDescription="This segment is currently empty."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}