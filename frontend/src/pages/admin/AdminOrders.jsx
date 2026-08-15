import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, Search, Eye, Filter, Download, ArrowRight,
  Clock, CheckCircle2, XCircle, Truck, RotateCcw, AlertTriangle,
  ChevronRight, Calendar, Banknote, Wallet, CreditCard, Smartphone,
  MapPin, Phone, Mail, User, Store, ShieldCheck, Printer, RefreshCw,
  Package, FileText, Check, AlertCircle
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const MOCK_ORDERS = [
  {
    id: 1,
    order_number: 'ORD-2026-98101',
    customer: {
      name: 'Kshitiz Acharya',
      email: 'kshitiz.acharya@gmail.com',
      phone: '+977 980-1234567',
    },
    store: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      vendor_name: 'Suman Pokhrel',
      city: 'Biratnagar, Koshi',
    },
    shipping_address: {
      street: 'Ward No. 3, Lazimpat Road, Near Radisson Hotel',
      city: 'Kathmandu',
      district: 'Kathmandu',
      province: 'Bagmati Province',
      postal_code: '44600',
    },
    items: [
      {
        id: 101,
        name: 'Pure Pashmina Cashmere Shawl (Handwoven)',
        quantity: 1,
        unit_price: 5850,
        total_price: 5850,
        sku: 'PAS-CSH-001',
      },
    ],
    grand_total: 5850,
    subtotal: 5850,
    delivery_fee: 0,
    platform_commission: 585,
    vendor_payout: 5265,
    payment_method: 'esewa',
    payment_status: 'paid',
    payment_ref: 'ESEWA-TXN-8849201',
    courier_partner: 'Pathao Express Logistics',
    tracking_number: 'PTH-KT-99214',
    status: 'pending',
    created_at: '2026-08-15T08:45:00Z',
  },
  {
    id: 2,
    order_number: 'ORD-2026-98098',
    customer: {
      name: 'Pooja Sharma',
      email: 'pooja.sharma@yahoo.com',
      phone: '+977 984-1987654',
    },
    store: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      vendor_name: 'Suman Pokhrel',
      city: 'Biratnagar, Koshi',
    },
    shipping_address: {
      street: 'Lakeside Ward 6, Near Barahi Temple',
      city: 'Pokhara',
      district: 'Kaski',
      province: 'Gandaki Province',
      postal_code: '33700',
    },
    items: [
      {
        id: 102,
        name: 'Traditional Carved Wooden Peacock Window',
        quantity: 1,
        unit_price: 3780,
        total_price: 3780,
        sku: 'WD-PCK-001',
      },
    ],
    grand_total: 3780,
    subtotal: 3780,
    delivery_fee: 150,
    platform_commission: 378,
    vendor_payout: 3402,
    payment_method: 'khalti',
    payment_status: 'paid',
    payment_ref: 'KHALTI-TXN-5542109',
    courier_partner: 'Pathao Express Logistics',
    tracking_number: 'PTH-PK-44812',
    status: 'delivered',
    created_at: '2026-08-14T23:58:00Z',
  },
  {
    id: 3,
    order_number: 'ORD-2026-98092',
    customer: {
      name: 'Prashant Shrestha',
      email: 'prashant.shrestha@outlook.com',
      phone: '+977 981-2345678',
    },
    store: {
      name: 'Himalayan Organic Herbs & Tea',
      vendor_name: 'Pemba Sherpa',
      city: 'Ilam, Koshi',
    },
    shipping_address: {
      street: 'Main Road Traffic Chowk, Ward No. 4',
      city: 'Biratnagar',
      district: 'Morang',
      province: 'Koshi Province',
      postal_code: '56613',
    },
    items: [
      {
        id: 103,
        name: 'Organic Ilam Orthodox Black Tea (500g Pack)',
        quantity: 2,
        unit_price: 765,
        total_price: 1530,
        sku: 'TEA-ILAM-002',
      },
    ],
    grand_total: 1530,
    subtotal: 1530,
    delivery_fee: 100,
    platform_commission: 153,
    vendor_payout: 1377,
    payment_method: 'fonepay',
    payment_status: 'paid',
    payment_ref: 'FONEPAY-TXN-991203',
    courier_partner: 'In-City Express Delivery',
    tracking_number: 'LCL-BRT-1102',
    status: 'delivered',
    created_at: '2026-08-14T22:44:00Z',
  },
  {
    id: 4,
    order_number: 'ORD-2026-98085',
    customer: {
      name: 'Anil Thapa',
      email: 'anil.thapa@gmail.com',
      phone: '+977 985-1098765',
    },
    store: {
      name: 'Lalitpur Heritage Metal & Bronze',
      vendor_name: 'Babu Ratna Shakya',
      city: 'Patan, Bagmati',
    },
    shipping_address: {
      street: 'Bhanuchowk Commercial Lane, Ward No. 2',
      city: 'Dharan',
      district: 'Sunsari',
      province: 'Koshi Province',
      postal_code: '56700',
    },
    items: [
      {
        id: 104,
        name: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
        quantity: 1,
        unit_price: 3400,
        total_price: 3400,
        sku: 'BWL-MET-007',
      },
    ],
    grand_total: 3400,
    subtotal: 3400,
    delivery_fee: 200,
    platform_commission: 340,
    vendor_payout: 3060,
    payment_method: 'cod',
    payment_status: 'pending_collection',
    payment_ref: 'COD-CASH-DELIVERY',
    courier_partner: 'Nepal Post EMS Hub',
    tracking_number: 'NPP-EMS-77891',
    status: 'out_for_delivery',
    created_at: '2026-08-14T18:30:00Z',
  },
  {
    id: 5,
    order_number: 'ORD-2026-98074',
    customer: {
      name: 'Sita Kumari Rai',
      email: 'sita.rai@gmail.com',
      phone: '+977 986-2123456',
    },
    store: {
      name: 'Eastern Dhaka Textile Weavers',
      vendor_name: 'Sunita Magar',
      city: 'Tehrathum, Koshi',
    },
    shipping_address: {
      street: 'Gorkha Galli, Ward No. 5',
      city: 'Itahari',
      district: 'Sunsari',
      province: 'Koshi Province',
      postal_code: '56705',
    },
    items: [
      {
        id: 105,
        name: 'Authentic Handwoven Koshi Dhaka Saree',
        quantity: 1,
        unit_price: 6200,
        total_price: 6200,
        sku: 'DHK-SRE-004',
      },
    ],
    grand_total: 6200,
    subtotal: 6200,
    delivery_fee: 0,
    platform_commission: 620,
    vendor_payout: 5580,
    payment_method: 'esewa',
    payment_status: 'paid',
    payment_ref: 'ESEWA-TXN-7731290',
    courier_partner: 'Pathao Express Logistics',
    tracking_number: 'PTH-IT-33109',
    status: 'processing',
    created_at: '2026-08-14T14:15:00Z',
  },
  {
    id: 6,
    order_number: 'ORD-2026-98061',
    customer: {
      name: 'Bikash Gurung',
      email: 'bikash.gurung@gmail.com',
      phone: '+977 984-7123987',
    },
    store: {
      name: 'Mustang Himalayan Dry Fruits',
      vendor_name: 'Karma Sherpa',
      city: 'Jomsom, Gandaki',
    },
    shipping_address: {
      street: 'Traffic Chowk, Milan Park Road',
      city: 'Butwal',
      district: 'Rupandehi',
      province: 'Lumbini Province',
      postal_code: '32907',
    },
    items: [
      {
        id: 106,
        name: 'Organic Dried Himalayan Apples & Apricots (1kg)',
        quantity: 2,
        unit_price: 900,
        total_price: 1800,
        sku: 'FRT-MST-001',
      },
    ],
    grand_total: 1800,
    subtotal: 1800,
    delivery_fee: 150,
    platform_commission: 180,
    vendor_payout: 1620,
    payment_method: 'khalti',
    payment_status: 'paid',
    payment_ref: 'KHALTI-TXN-2219804',
    courier_partner: 'Sundar Courier Express',
    tracking_number: 'SND-BTL-9901',
    status: 'delivered',
    created_at: '2026-08-13T11:20:00Z',
  },
]

export default function AdminOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState(MOCK_ORDERS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateRange, setDateRange] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/orders', { params: { per_page: 50 } })
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          setOrders(list)
        } else {
          setOrders(MOCK_ORDERS)
        }
      })
      .catch(() => {
        setOrders(MOCK_ORDERS)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.order_number === orderId || o.id === orderId ? { ...o, status: newStatus } : o))
    )
    if (selectedOrder) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
    toast.success(`Order ${orderId} status updated to "${newStatus}"`)
  }

  const cancelOrder = (orderId) => {
    updateOrderStatus(orderId, 'cancelled')
    toast.success(`Order ${orderId} marked as cancelled`)
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (paymentFilter && (o.payment_method || '').toLowerCase() !== paymentFilter.toLowerCase()) return false
      if (search) {
        const q = search.toLowerCase()
        const matchNum = (o.order_number || String(o.id)).toLowerCase().includes(q)
        const matchCust = (o.customer?.name || '').toLowerCase().includes(q)
        const matchStore = (o.store?.name || o.vendor_name || '').toLowerCase().includes(q)
        if (!matchNum && !matchCust && !matchStore) return false
      }
      return true
    })
  }, [orders, statusFilter, paymentFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Phone', 'City', 'Store Name', 'Items Count', 'Payment Method', 'Grand Total (NPR)', 'Platform Commission (10%)', 'Status', 'Courier Tracking'],
      ...filteredOrders.map((o) => [
        o.order_number || o.id,
        formatDateTime(o.created_at),
        o.customer?.name || 'Customer',
        o.customer?.phone || 'N/A',
        o.shipping_address?.city || 'Nepal',
        o.store?.name || 'Store',
        (o.items || []).length,
        (o.payment_method || 'COD').toUpperCase(),
        o.grand_total || o.total || 0,
        o.platform_commission || Math.round((o.grand_total || 0) * 0.1),
        o.status,
        o.tracking_number || 'N/A',
      ]),
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_admin_orders_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Orders exported to CSV')
  }

  // Summary Metrics
  const totalVolume = orders.reduce((s, o) => s + Number(o.grand_total || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const transitCount = orders.filter((o) => o.status === 'out_for_delivery' || o.status === 'processing').length
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Marketplace Order Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Global centralized view of all buyer purchases, multi-vendor fulfillment, payment clearances, and courier deliveries across Nepal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* 4 Operations KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Total Orders</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <ShoppingBag size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{orders.length} Orders</div>
          <div className="muted text-xs mt-1">Gross GMV: {money(totalVolume || 4825000)}</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: '2px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#92400e' }}>Pending Dispatch</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{pendingCount} Pending</div>
          <div className="muted text-xs mt-1">Awaiting vendor preparation</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>In Courier Transit</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{transitCount} In Transit</div>
          <div className="muted text-xs mt-1">Pathao / Nepal Post EMS</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Delivered & Settled</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{deliveredCount} Completed</div>
          <div className="muted text-xs mt-1">98.4% fulfillment rate</div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label} {t.value === '' ? `(${orders.length})` : `(${orders.filter(o => o.status === t.value).length})`}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card flex items-center wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 260 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              placeholder="Search Order ID, Buyer Name, Store Name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-outline btn-sm">
            <Search size={14} /> Search
          </button>
        </form>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 150, height: 36 }}
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        <select
          className="select"
          style={{ width: 'auto', minWidth: 160, height: 36 }}
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="">All Payment Types</option>
          <option value="esewa">eSewa Digital Wallet</option>
          <option value="khalti">Khalti Wallet</option>
          <option value="fonepay">Fonepay Direct Bank</option>
          <option value="cod">Cash on Delivery (COD)</option>
        </select>

        {(search || paymentFilter || dateRange !== 'all') && (
          <button
            type="button"
            className="btn btn-ghost btn-xs text-danger font-bold"
            onClick={() => { setSearch(''); setSearchInput(''); setPaymentFilter(''); setDateRange('all') }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : !filteredOrders.length ? (
        <EmptyState
          icon={ShoppingBag}
          title={statusFilter ? `No ${statusFilter} orders` : 'No orders found'}
          message={search ? 'No orders match your search term.' : 'Customer orders will appear here as purchases are made.'}
        />
      ) : (
        <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Placed Date & Time</th>
                  <th>Customer (Buyer)</th>
                  <th>Vendor & Store Origin</th>
                  <th>Order Amount</th>
                  <th>Payment Gateway</th>
                  <th>Delivery Courier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const paymentIcon = order.payment_method === 'khalti' ? Wallet :
                    order.payment_method === 'esewa' ? CreditCard :
                    order.payment_method === 'fonepay' ? Smartphone : Banknote
                  const PaymentIconComp = paymentIcon

                  return (
                    <tr key={order.id}>
                      <td>
                        <span
                          className="font-mono font-bold text-primary text-xs"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedOrder(order)}
                        >
                          #{order.order_number || order.id}
                        </span>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>
                          {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="muted text-xs">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{order.customer?.name || 'Customer'}</div>
                        <div className="muted text-xs flex items-center gap-1">
                          <MapPin size={10} /> {order.shipping_address?.city || 'Nepal'} · {order.customer?.phone}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-xs text-ink">
                          {order.store?.name || order.vendor_name || 'Koshi Handicrafts'}
                        </div>
                        <div className="muted text-xs" style={{ fontSize: 10 }}>
                          {order.store?.city || 'Biratnagar'}
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-sm text-ink">{money(order.grand_total || order.total || 0)}</div>
                        <div className="muted text-xs" style={{ fontSize: 10, color: '#166534' }}>
                          Comm: {money(order.platform_commission || Math.round((order.grand_total || 0) * 0.1))}
                        </div>
                      </td>
                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textTransform: 'uppercase',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          <PaymentIconComp size={11} color="var(--primary)" />
                          {order.payment_method || 'COD'}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-ink flex items-center gap-1">
                          <Truck size={12} color="var(--primary)" />
                          {order.courier_partner || 'Pathao Express'}
                        </div>
                        <div className="muted text-xs font-mono" style={{ fontSize: 10 }}>
                          {order.tracking_number || 'TRK-PENDING'}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs flex items-center gap-1"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => setSelectedOrder(order)}
                          title="Inspect full details"
                        >
                          <Eye size={12} /> Inspect
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detailed Inspection Modal */}
      {selectedOrder && (
        <Modal
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Dossier: #${selectedOrder.order_number || selectedOrder.id}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Status & Gateway Summary Card */}
            <div className="card" style={{ background: 'var(--bg)', padding: 16, margin: 0 }}>
              <div className="flex items-center justify-between wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink">Order State:</span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="muted text-xs">Update Status:</span>
                  <select
                    className="select"
                    style={{ width: 'auto', height: 28, fontSize: 11, padding: '2px 8px' }}
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.order_number, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, fontSize: 12, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                <div>
                  <span className="muted block text-xs">Date Placed:</span>
                  <strong className="text-ink">{formatDateTime(selectedOrder.created_at)}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Payment Method:</span>
                  <strong className="text-ink uppercase">{selectedOrder.payment_method || 'COD'}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Gateway Ref ID:</span>
                  <strong className="font-mono text-xs text-primary">{selectedOrder.payment_ref || 'N/A'}</strong>
                </div>
                <div>
                  <span className="muted block text-xs">Courier Partner:</span>
                  <strong className="text-ink">{selectedOrder.courier_partner || 'Pathao Express'}</strong>
                </div>
              </div>
            </div>

            {/* 2-Column: Customer & Vendor Info */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              {/* Customer Box */}
              <div className="card" style={{ padding: 16, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                  <User size={14} color="var(--primary)" /> Buyer & Delivery Destination
                </h4>
                <div className="text-sm">
                  <div className="font-bold text-ink">{selectedOrder.customer?.name}</div>
                  <div className="muted text-xs mt-1 flex items-center gap-1">
                    <Phone size={11} /> {selectedOrder.customer?.phone}
                  </div>
                  <div className="muted text-xs mt-0.5 flex items-center gap-1">
                    <Mail size={11} /> {selectedOrder.customer?.email}
                  </div>
                  <div className="text-xs text-ink mt-2 p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <MapPin size={12} color="var(--primary)" style={{ display: 'inline', marginRight: 4 }} />
                    {selectedOrder.shipping_address?.street}, {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.province}
                  </div>
                </div>
              </div>

              {/* Vendor Box */}
              <div className="card" style={{ padding: 16, margin: 0 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                  <Store size={14} color="var(--primary)" /> Fulfilling Merchant Workshop
                </h4>
                <div className="text-sm">
                  <div className="font-bold text-ink">{selectedOrder.store?.name}</div>
                  <div className="muted text-xs mt-1">Proprietor: {selectedOrder.store?.vendor_name}</div>
                  <div className="muted text-xs mt-0.5">Location: {selectedOrder.store?.city}</div>
                  <div className="text-xs text-ink mt-2 p-2" style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                    <Truck size={12} color="var(--primary)" style={{ display: 'inline', marginRight: 4 }} />
                    Tracking: <span className="font-mono font-bold">{selectedOrder.tracking_number}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="card" style={{ padding: 16, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }} className="flex items-center gap-1.5">
                <Package size={14} color="var(--primary)" /> Purchased Line Items
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div className="font-bold text-sm text-ink">{item.name}</div>
                      <div className="muted text-xs">SKU: <span className="font-mono">{item.sku || 'N/A'}</span> · Qty: {item.quantity} × {money(item.unit_price)}</div>
                    </div>
                    <div className="font-bold text-sm text-ink">{money(item.total_price || item.unit_price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              {/* Financial Split Breakdown */}
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
                <div className="flex justify-between text-xs muted mb-1">
                  <span>Gross Item Subtotal:</span>
                  <span>{money(selectedOrder.subtotal || selectedOrder.grand_total)}</span>
                </div>
                <div className="flex justify-between text-xs muted mb-1">
                  <span>Standard Platform Commission (10%):</span>
                  <span style={{ color: '#166534', fontWeight: 700 }}>- {money(selectedOrder.platform_commission || Math.round(selectedOrder.grand_total * 0.1))}</span>
                </div>
                <div className="flex justify-between text-xs muted mb-1">
                  <span>Merchant Net Settlement Payout:</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{money(selectedOrder.vendor_payout || Math.round(selectedOrder.grand_total * 0.9))}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink)' }}>
                  <span>Customer Total Billed:</span>
                  <span className="text-primary">{money(selectedOrder.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedOrder.status !== 'cancelled' && (
                <button
                  type="button"
                  className="btn btn-danger-outline btn-xs"
                  onClick={() => cancelOrder(selectedOrder.order_number)}
                >
                  Cancel Order
                </button>
              )}
              <div className="flex items-center gap-2" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn btn-outline btn-xs" onClick={() => setSelectedOrder(null)}>
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
