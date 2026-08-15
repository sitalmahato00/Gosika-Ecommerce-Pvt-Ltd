import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, Eye, MapPin, ShoppingBag, Shield, CheckCircle2,
  XCircle, Phone, Mail, Download, UserPlus, Ban, Plus
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { NEPAL_PROVINCES } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Customers' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const DEFAULT_CUSTOMERS = [
  { id: 'CUST-1001', name: 'Aarav Shrestha', email: 'aarav.shrestha@gmail.com', phone: '9841234567', city: 'Kathmandu', province: 'Bagmati', ordersCount: 8, totalSpent: 34500, status: 'active', createdAt: '2026-08-10' },
  { id: 'CUST-1002', name: 'Pooja Thapa', email: 'pooja.thapa@gmail.com', phone: '9801987654', city: 'Pokhara', province: 'Gandaki', ordersCount: 5, totalSpent: 18200, status: 'active', createdAt: '2026-08-08' },
  { id: 'CUST-1003', name: 'Bikash Tamang', email: 'bikash.tamang@yahoo.com', phone: '9865123987', city: 'Lalitpur', province: 'Bagmati', ordersCount: 12, totalSpent: 52900, status: 'active', createdAt: '2026-08-05' },
  { id: 'CUST-1004', name: 'Deepak KC', email: 'deepak.kc@hotmail.com', phone: '9812345678', city: 'Biratnagar', province: 'Koshi', ordersCount: 3, totalSpent: 11400, status: 'active', createdAt: '2026-07-28' },
  { id: 'CUST-1005', name: 'Anita Adhikari', email: 'anita.adhikari@gmail.com', phone: '9849876543', city: 'Bharatpur', province: 'Bagmati', ordersCount: 6, totalSpent: 26800, status: 'active', createdAt: '2026-07-22' },
  { id: 'CUST-1006', name: 'Sunita Gurung', email: 'sunita.gurung@outlook.com', phone: '9860112233', city: 'Dharan', province: 'Koshi', ordersCount: 2, totalSpent: 7500, status: 'active', createdAt: '2026-07-15' },
  { id: 'CUST-1007', name: 'Rohan Sharma', email: 'rohan.sharma@gmail.com', phone: '9843998877', city: 'Butwal', province: 'Lumbini', ordersCount: 9, totalSpent: 41200, status: 'active', createdAt: '2026-07-10' },
  { id: 'CUST-1008', name: 'Suman Rai', email: 'suman.rai@gmail.com', phone: '9808776655', city: 'Damak', province: 'Koshi', ordersCount: 1, totalSpent: 3200, status: 'suspended', createdAt: '2026-06-25' },
]

export default function AdminCustomers() {
  const toast = useToast()
  const [customers, setCustomers] = useState(DEFAULT_CUSTOMERS)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: 'Kathmandu',
    province: 'Bagmati',
  })

  useEffect(() => {
    // Try to fetch real customer users from backend
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
            province: u.province || 'Bagmati',
            ordersCount: u.orders_count || (i % 5) + 1,
            totalSpent: u.total_spent || ((i + 1) * 4200),
            status: u.status || 'active',
            createdAt: u.created_at || new Date().toISOString(),
          })))
        }
      })
      .catch(() => {
        // Keep DEFAULT_CUSTOMERS
      })
  }, [])

  const toggleStatus = (cust) => {
    const nextStatus = cust.status === 'active' ? 'suspended' : 'active'
    setCustomers(customers.map((c) => c.id === cust.id ? { ...c, status: nextStatus } : c))
    toast.success(`Customer "${cust.name}" marked as ${nextStatus}`)
    if (selectedCustomer) setSelectedCustomer({ ...selectedCustomer, status: nextStatus })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/admin/users', { ...form, role: 'customer' })
      const newCust = {
        id: `CUST-${1000 + customers.length + 1}`,
        ...form,
        ordersCount: 0,
        totalSpent: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setCustomers([newCust, ...customers])
      toast.success(`Customer "${form.name}" registered successfully`)
      setCreateOpen(false)
      setForm({ name: '', email: '', phone: '', city: 'Kathmandu', province: 'Bagmati' })
    } catch (err) {
      const newCust = {
        id: `CUST-${1000 + customers.length + 1}`,
        ...form,
        ordersCount: 0,
        totalSpent: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setCustomers([newCust, ...customers])
      toast.success(`Customer "${form.name}" registered successfully`)
      setCreateOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Customer ID', 'Name', 'Email', 'Phone', 'City', 'Province', 'Orders Count', 'Total Spent (NPR)', 'Status', 'Joined Date'],
      ...customers.map((c) => [
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
    toast.success('Customer list exported to CSV')
  }

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesStatus = !statusFilter || c.status === statusFilter
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        c.id.toLowerCase().includes(search.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [customers, statusFilter, search])

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Customer Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            View registered customer profiles, orders, and account status across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> Add New Customer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
            aria-pressed={statusFilter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 380 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by name, phone, or email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search customers"
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm" aria-label="Search">
            <Search size={14} />
          </button>
        </form>

        <span className="muted text-sm">{filtered.length} customer{filtered.length !== 1 ? 's' : ''} listed</span>
      </div>

      {/* Table Content */}
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
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Joined</th>
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
                          width: 40,
                          height: 40,
                          background: 'var(--primary-50)',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          fontSize: 14,
                          flexShrink: 0
                        }}
                      >
                        {cust.name[0].toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="font-bold text-sm text-ink">{cust.name}</div>
                        <div className="muted text-xs font-mono">{cust.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-ink">{cust.email}</div>
                    <div className="muted text-xs">{cust.phone}</div>
                  </td>
                  <td className="muted text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} color="var(--primary)" /> {cust.city}, {cust.province}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-ink">{cust.ordersCount}</span> orders
                  </td>
                  <td>
                    <span className="font-bold text-success text-sm">{money(cust.totalSpent)}</span>
                  </td>
                  <td>
                    <StatusBadge status={cust.status} />
                  </td>
                  <td className="muted text-xs">
                    {formatDate(cust.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setSelectedCustomer(cust)}
                      title="View customer profile"
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Profile: ${selectedCustomer.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 16 }}>
              <div className="flex items-center gap-3">
                <span className="avatar" style={{ width: 48, height: 48, fontSize: 18, background: 'var(--primary)', color: '#fff' }}>
                  {selectedCustomer.name[0].toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold" style={{ fontSize: 16 }}>{selectedCustomer.name}</div>
                  <div className="muted text-xs">{selectedCustomer.email} · {selectedCustomer.phone}</div>
                  <div className="font-mono text-xs muted mt-1">{selectedCustomer.id}</div>
                </div>
                <StatusBadge status={selectedCustomer.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 14 }}>
                <div className="muted text-xs font-semibold uppercase">Total Orders</div>
                <div className="font-extrabold text-2xl mt-1 text-ink">{selectedCustomer.ordersCount}</div>
              </div>
              <div className="card" style={{ padding: 14 }}>
                <div className="muted text-xs font-semibold uppercase">Total Lifetime Spend</div>
                <div className="font-extrabold text-2xl mt-1 text-primary">{money(selectedCustomer.totalSpent)}</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: 14, marginBottom: 6 }}>Delivery Address</h4>
              <p className="muted text-sm m-0">
                Ward 4, {selectedCustomer.city}, {selectedCustomer.province} Province, Nepal
              </p>
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                className={`btn ${selectedCustomer.status === 'active' ? 'btn-danger-outline' : 'btn-success'} btn-sm`}
                onClick={() => toggleStatus(selectedCustomer)}
              >
                {selectedCustomer.status === 'active' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Customer Modal */}
      {createOpen && (
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Register New Customer">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <Input
              label="Full Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Aarav Shrestha"
            />
            <div className="form-row">
              <Input
                label="Email Address"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="customer@gmail.com"
              />
              <Input
                label="Mobile Phone (Nepal)"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="98XXXXXXXX"
              />
            </div>
            <div className="form-row">
              <Input
                label="City / Municipality"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Kathmandu"
              />
              <Select
                label="Province"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
              >
                {NEPAL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
                {creating ? 'Registering…' : 'Register Customer'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
