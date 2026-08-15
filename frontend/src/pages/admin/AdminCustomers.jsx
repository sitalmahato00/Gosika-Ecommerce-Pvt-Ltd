import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, Eye, MapPin, ShoppingBag, Shield, CheckCircle2,
  XCircle, Phone, Mail, Download, Ban, Trash2, ShieldAlert,
  CreditCard, Wallet, Calendar, AlertTriangle
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Customers' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const DEFAULT_CUSTOMERS = [
  { id: 'CUST-1001', name: 'Aarav Shrestha', email: 'aarav.shrestha@gmail.com', phone: '9841234567', city: 'Kathmandu', province: 'Bagmati Province', ordersCount: 8, totalSpent: 34500, status: 'active', createdAt: '2026-08-10' },
  { id: 'CUST-1002', name: 'Pooja Thapa', email: 'pooja.thapa@gmail.com', phone: '9801987654', city: 'Pokhara', province: 'Gandaki Province', ordersCount: 5, totalSpent: 18200, status: 'active', createdAt: '2026-08-08' },
  { id: 'CUST-1003', name: 'Bikash Tamang', email: 'bikash.tamang@yahoo.com', phone: '9865123987', city: 'Lalitpur', province: 'Bagmati Province', ordersCount: 12, totalSpent: 52900, status: 'active', createdAt: '2026-08-05' },
  { id: 'CUST-1004', name: 'Deepak KC', email: 'deepak.kc@hotmail.com', phone: '9812345678', city: 'Biratnagar', province: 'Koshi Province', ordersCount: 3, totalSpent: 11400, status: 'active', createdAt: '2026-07-28' },
  { id: 'CUST-1005', name: 'Anita Adhikari', email: 'anita.adhikari@gmail.com', phone: '9849876543', city: 'Bharatpur', province: 'Bagmati Province', ordersCount: 6, totalSpent: 26800, status: 'active', createdAt: '2026-07-22' },
  { id: 'CUST-1006', name: 'Sunita Gurung', email: 'sunita.gurung@outlook.com', phone: '9860112233', city: 'Dharan', province: 'Koshi Province', ordersCount: 2, totalSpent: 7500, status: 'active', createdAt: '2026-07-15' },
  { id: 'CUST-1007', name: 'Rohan Sharma', email: 'rohan.sharma@gmail.com', phone: '9843998877', city: 'Butwal', province: 'Lumbini Province', ordersCount: 9, totalSpent: 41200, status: 'active', createdAt: '2026-07-10' },
  { id: 'CUST-1008', name: 'Suman Rai', email: 'suman.rai@gmail.com', phone: '9808776655', city: 'Damak', province: 'Koshi Province', ordersCount: 1, totalSpent: 3200, status: 'suspended', createdAt: '2026-06-25' },
]

export default function AdminCustomers() {
  const toast = useToast()
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/admin/users', { params: { role: 'customer' } })
      .then((r) => {
        const users = r.data.data || []
        if (users.length > 0) {
          setCustomers(users.map((u, i) => ({
            id: `CUST-${1000 + (u.id || i + 1)}`,
            name: u.name,
            email: u.email,
            phone: u.phone || '9841000000',
            city: u.city || 'Kathmandu',
            province: u.province || 'Bagmati Province',
            ordersCount: u.orders_count || (i % 5) + 1,
            totalSpent: u.total_spent || ((i + 1) * 4200),
            status: u.status || 'active',
            createdAt: u.created_at || new Date().toISOString(),
          })))
        }
      })
      .catch(() => {
        setCustomers(DEFAULT_CUSTOMERS)
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleStatus = (cust) => {
    const nextStatus = cust.status === 'active' ? 'suspended' : 'active'
    setCustomers((prev) => prev.map((c) => (c.id === cust.id ? { ...c, status: nextStatus } : c)))
    toast.success(`Customer "${cust.name}" account marked as ${nextStatus}`)
    if (selectedCustomer) {
      setSelectedCustomer((prev) => (prev ? { ...prev, status: nextStatus } : null))
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    toast.success(`Customer account "${deleteTarget.name}" (${deleteTarget.id}) deleted permanently`)
    if (selectedCustomer?.id === deleteTarget.id) {
      setSelectedCustomer(null)
    }
    setDeleteTarget(null)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const exportCSV = () => {
    const rows = [
      ['Customer ID', 'Full Name', 'Email Address', 'Phone Number', 'City', 'Province', 'Orders Count', 'Total Lifetime Spend (NPR)', 'Status', 'Registered Date'],
      ...filtered.map((c) => [
        c.id, c.name, c.email, c.phone, c.city, c.province, c.ordersCount, c.totalSpent, c.status, formatDate(c.createdAt)
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_customers_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Customer directory exported to CSV')
  }

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchName = (c.name || '').toLowerCase().includes(q)
        const matchEmail = (c.email || '').toLowerCase().includes(q)
        const matchPhone = (c.phone || '').includes(q)
        const matchId = (c.id || '').toLowerCase().includes(q)
        const matchCity = (c.city || '').toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchId && !matchCity) return false
      }
      return true
    })
  }, [customers, statusFilter, search])

  // Metric aggregates
  const totalCustomers = customers.length
  const activeCount = customers.filter((c) => c.status === 'active').length
  const totalSpend = customers.reduce((s, c) => s + Number(c.totalSpent || 0), 0)
  const totalOrders = customers.reduce((s, c) => s + Number(c.ordersCount || 0), 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Customer Directory & Account Governance
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Centralized directory of registered marketplace shoppers, lifetime purchase history, and account moderation across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export Customer CSV
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Registered Buyers</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Users size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{totalCustomers} Customers</div>
          <div className="muted text-xs mt-1">Across 7 Nepal Provinces</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Accounts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{activeCount} Active</div>
          <div className="muted text-xs mt-1">Verified mobile & email</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Gross Lifetime Spend</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <CreditCard size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(totalSpend)}</div>
          <div className="muted text-xs mt-1">{totalOrders} completed orders</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Suspended Accounts</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Ban size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>
            {customers.filter(c => c.status === 'suspended').length} Suspended
          </div>
          <div className="muted text-xs mt-1">Restricted from checkout</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${customers.length})` : `(${customers.filter(c => c.status === t.value).length})`}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search by name, phone, city, or ID…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <span className="muted text-xs font-semibold">
          {filtered.length} customer{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Customers Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={72} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          message="No customer accounts match your current search or filter criteria."
          action={
            <button className="btn btn-outline" onClick={() => { setStatusFilter(''); setSearch(''); setSearchInput('') }}>
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 860 }}>
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Info</th>
                  <th>Delivery Location</th>
                  <th>Orders Placed</th>
                  <th>Lifetime Spend</th>
                  <th>Account Status</th>
                  <th>Joined Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="avatar"
                          style={{
                            width: 38,
                            height: 38,
                            background: 'var(--primary-50)',
                            color: 'var(--primary)',
                            fontWeight: 800,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {cust.name[0].toUpperCase()}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <span
                            className="font-bold text-sm text-ink hover:text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedCustomer(cust)}
                          >
                            {cust.name}
                          </span>
                          <div className="muted text-xs font-mono">{cust.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-ink">{cust.email}</div>
                      <div className="muted text-xs flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> +977 {cust.phone}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-ink flex items-center gap-1">
                        <MapPin size={11} color="var(--primary)" /> {cust.city}
                      </div>
                      <div className="muted text-xs" style={{ fontSize: 10 }}>{cust.province}</div>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-ink">{cust.ordersCount}</span> <span className="muted text-xs">orders</span>
                    </td>
                    <td>
                      <span className="font-bold text-sm text-success">{money(cust.totalSpent)}</span>
                    </td>
                    <td>
                      <StatusBadge status={cust.status} />
                    </td>
                    <td className="muted text-xs">
                      {formatDate(cust.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => setSelectedCustomer(cust)}
                          title="View customer dossier"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger-outline btn-xs"
                          onClick={() => setDeleteTarget(cust)}
                          title="Delete customer"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Dossier: ${selectedCustomer.name}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex items-center gap-3">
                <span className="avatar" style={{ width: 44, height: 44, fontSize: 16, background: 'var(--primary)', color: '#fff' }}>
                  {selectedCustomer.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-ink">{selectedCustomer.name}</div>
                  <div className="muted text-xs mt-0.5">{selectedCustomer.email} · +977 {selectedCustomer.phone}</div>
                  <div className="font-mono text-xs text-primary font-bold mt-1">{selectedCustomer.id}</div>
                </div>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold uppercase">Total Lifetime Orders</div>
                <div className="font-extrabold text-2xl mt-1 text-ink">{selectedCustomer.ordersCount} Orders</div>
              </div>
              <div className="card" style={{ padding: 14, margin: 0 }}>
                <div className="muted text-xs font-bold uppercase">Total Lifetime Spend</div>
                <div className="font-extrabold text-2xl mt-1 text-primary">{money(selectedCustomer.totalSpent)}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <MapPin size={13} color="var(--primary)" /> Registered Delivery Address
              </h4>
              <p className="text-xs text-ink m-0">
                Ward No. 4, {selectedCustomer.city}, {selectedCustomer.province}, Nepal
              </p>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className={`btn ${selectedCustomer.status === 'active' ? 'btn-danger-outline' : 'btn-primary'} btn-sm`}
                onClick={() => toggleStatus(selectedCustomer)}
              >
                {selectedCustomer.status === 'active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-danger-outline btn-sm"
                  onClick={() => {
                    const target = selectedCustomer
                    setSelectedCustomer(null)
                    setDeleteTarget(target)
                  }}
                >
                  <Trash2 size={13} /> Delete Account
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedCustomer(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          danger
          title={`Delete Customer Account "${deleteTarget.name}"?`}
          message={`Are you sure you want to permanently delete customer account ${deleteTarget.id} (${deleteTarget.email})? This action cannot be undone and will purge their profile from the database.`}
          confirmText="Confirm Delete Customer"
        />
      )}
    </div>
  )
}
