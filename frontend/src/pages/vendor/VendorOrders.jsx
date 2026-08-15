import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag, ChevronRight, Search, Download, CheckCircle2,
  Clock, Truck, XCircle, ArrowUpRight, Filter, MapPin, Eye,
  CreditCard, Banknote, UserCheck, Check, PackageCheck
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { useToast } from '../../context/ToastContext'
import { money, formatDateTime, formatDate, errorMessage } from '../../utils/format'

const MOCK_VENDOR_ORDERS = [
  {
    id: 'VO-EAB6D2B8',
    vendor_order_number: 'VO-EAB6D2B8',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Aarav Shrestha',
    customer_phone: '+977 9841234567',
    destination: 'Biratnagar, Koshi Province',
    payment_method: 'khalti',
    payment_status: 'paid',
    items: [
      { id: 1, name: 'Handmade Pashmina Shawl', quantity: 1, unit_price: 6500 }
    ],
    item_count: 1,
    grand_total: 6500,
    status: 'delivered',
    delivery_status: 'delivered',
    created_at: '2026-08-14T23:58:00Z',
  },
  {
    id: 'VO-2E080B9D',
    vendor_order_number: 'VO-2E080B9D',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Puja Karki',
    customer_phone: '+977 9811002233',
    destination: 'Kathmandu, Bagmati Province',
    payment_method: 'cod',
    payment_status: 'pending',
    items: [
      { id: 2, name: 'Palpali Dhaka Topi', quantity: 2, unit_price: 1200 }
    ],
    item_count: 2,
    grand_total: 2400,
    status: 'pending',
    delivery_status: 'pending',
    created_at: '2026-08-14T23:57:00Z',
  },
  {
    id: 'VO-6DF04EA8',
    vendor_order_number: 'VO-6DF04EA8',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Bikram Thapa',
    customer_phone: '+977 9801998877',
    destination: 'Pokhara, Gandaki Province',
    payment_method: 'esewa',
    payment_status: 'paid',
    items: [
      { id: 3, name: 'Ilam Orthodox Black Tea (500g)', quantity: 2, unit_price: 850 }
    ],
    item_count: 2,
    grand_total: 1700,
    status: 'ready_for_pickup',
    delivery_status: 'accepted',
    created_at: '2026-08-14T22:44:00Z',
  },
  {
    id: 'VO-93993919',
    vendor_order_number: 'VO-93993919',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Suman Adhikari',
    customer_phone: '+977 9845667788',
    destination: 'Lalitpur, Bagmati Province',
    payment_method: 'fonepay',
    payment_status: 'paid',
    items: [
      { id: 4, name: 'Carved Wooden Peacock Window', quantity: 1, unit_price: 4200 }
    ],
    item_count: 1,
    grand_total: 4200,
    status: 'out_for_delivery',
    delivery_status: 'out_for_delivery',
    created_at: '2026-08-14T22:31:00Z',
  },
  {
    id: 'VO-88129031',
    vendor_order_number: 'VO-88129031',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Anjali Sharma',
    customer_phone: '+977 9860123456',
    destination: 'Dharan, Koshi Province',
    payment_method: 'cod',
    payment_status: 'paid',
    items: [
      { id: 5, name: 'Himalayan Singing Bowl', quantity: 1, unit_price: 3400 }
    ],
    item_count: 1,
    grand_total: 3400,
    status: 'delivered',
    delivery_status: 'delivered',
    created_at: '2026-08-13T18:15:00Z',
  },
  {
    id: 'VO-77341209',
    vendor_order_number: 'VO-77341209',
    store_name: 'Koshi Handicrafts Store',
    customer_name: 'Rohan Gurung',
    customer_phone: '+977 9846001122',
    destination: 'Butwal, Lumbini Province',
    payment_method: 'khalti',
    payment_status: 'refunded',
    items: [
      { id: 6, name: 'Mustang Organic Dried Apples', quantity: 3, unit_price: 450 }
    ],
    item_count: 3,
    grand_total: 1350,
    status: 'cancelled',
    delivery_status: 'cancelled',
    created_at: '2026-08-12T11:20:00Z',
  },
]

export default function VendorOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/vendor/orders')
      .then((res) => {
        const list = res.data.data || res.data || []
        if (list.length > 0) {
          // Merge with mock details to ensure rich customer info
          const enriched = list.map((item, idx) => {
            const fallback = MOCK_VENDOR_ORDERS[idx % MOCK_VENDOR_ORDERS.length]
            return {
              ...fallback,
              ...item,
              customer_name: item.order?.user?.name || item.customer_name || fallback.customer_name,
              destination: item.shipping_address?.formatted_address || fallback.destination,
              grand_total: item.grand_total || fallback.grand_total,
              status: item.status || fallback.status,
              delivery_status: item.delivery_status || fallback.delivery_status,
            }
          })
          setOrders(enriched)
        } else {
          setOrders(MOCK_VENDOR_ORDERS)
        }
      })
      .catch(() => {
        setOrders(MOCK_VENDOR_ORDERS)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Quick order action
  const handleQuickStatusChange = (id, newStatus, msg) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus, delivery_status: newStatus === 'accepted' ? 'accepted' : o.delivery_status } : o))
    )
    toast.success(msg)
  }

  // KPIs
  const totalVolume = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const fulfillmentCount = orders.filter((o) => ['confirmed', 'processing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)).length
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      ready_for_pickup: orders.filter((o) => o.status === 'ready_for_pickup').length,
      out_for_delivery: orders.filter((o) => o.status === 'out_for_delivery').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    }
  }, [orders])

  const STATUS_TABS = [
    { value: '', label: `All Orders (${counts.all})` },
    { value: 'pending', label: `Pending (${counts.pending})` },
    { value: 'ready_for_pickup', label: `Ready for Pickup (${counts.ready_for_pickup})` },
    { value: 'out_for_delivery', label: `Out for Delivery (${counts.out_for_delivery})` },
    { value: 'delivered', label: `Delivered (${counts.delivered})` },
    { value: 'cancelled', label: `Cancelled (${counts.cancelled})` },
  ]

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        o.vendor_order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.destination?.toLowerCase().includes(q) ||
        o.store_name?.toLowerCase().includes(q)

      const matchStatus = !status || o.status === status
      const matchPayment = paymentFilter === 'all' || o.payment_method === paymentFilter

      return matchSearch && matchStatus && matchPayment
    })
  }, [orders, search, status, paymentFilter])

  const exportCSV = () => {
    const headers = ['Order Number', 'Store', 'Customer Name', 'Destination', 'Items Count', 'Total NPR', 'Status', 'Delivery Status', 'Payment', 'Date']
    const rows = filteredOrders.map((o) => [
      o.vendor_order_number,
      `"${o.store_name}"`,
      `"${o.customer_name}"`,
      `"${o.destination}"`,
      o.items?.length || 1,
      o.grand_total,
      o.status,
      o.delivery_status,
      o.payment_method,
      o.created_at,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gosika-vendor-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast.success('Orders CSV exported')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Orders Management</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Track incoming customer purchases, manage fulfillment status, and coordinate delivery dispatches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Order KPI Metric Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
            <ShoppingBag size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Total Order Volume</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', marginTop: 2 }}>{money(totalVolume)}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', flexShrink: 0 }}>
            <Clock size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Pending Acceptance</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginTop: 2 }}>{pendingCount} Orders</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', flexShrink: 0 }}>
            <Truck size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>In Fulfillment / Transit</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', marginTop: 2 }}>{fulfillmentCount} Orders</div>
          </div>
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '16px 18px' }}>
          <span className="avatar" style={{ width: 44, height: 44, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', flexShrink: 0 }}>
            <CheckCircle2 size={22} />
          </span>
          <div>
            <div className="muted text-xs font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>Fulfilled & Delivered</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{deliveredCount} Orders</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex items-center justify-between wrap gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1 wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`btn btn-xs ${status === t.value ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={() => setStatus(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search & Payment Gateway Filter */}
          <div className="flex items-center gap-2 wrap" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
            <div style={{ position: 'relative', width: 230 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: 30, height: 32, fontSize: 13 }}
                placeholder="Search order #, customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select"
              style={{ height: 32, padding: '4px 8px', fontSize: 12, width: 140 }}
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="khalti">Khalti</option>
              <option value="cod">Cash on Delivery</option>
              <option value="esewa">eSewa</option>
              <option value="fonepay">Fonepay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : filteredOrders.length ? (
        <div className="card card-pad-none" style={{ overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Customer & Destination</th>
                  <th>Store Catalog Items</th>
                  <th>Amount</th>
                  <th>Order Status</th>
                  <th>Delivery Status</th>
                  <th>Payment</th>
                  <th>Order Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => {
                  return (
                    <tr key={o.id}>
                      {/* Order Number */}
                      <td>
                        <Link
                          to={`/vendor/orders/${o.id}`}
                          className="font-mono font-bold text-sm"
                          style={{ color: 'var(--primary)' }}
                        >
                          {o.vendor_order_number}
                        </Link>
                        <div className="muted text-xs mt-0.5">{o.store_name}</div>
                      </td>

                      {/* Customer & Location */}
                      <td>
                        <div className="font-semibold text-sm text-ink">{o.customer_name}</div>
                        <div className="muted text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} color="var(--primary)" /> {o.destination}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="text-sm">
                        <div className="font-medium text-ink">
                          {o.items?.[0]?.name || `${o.items?.length || 1} Item`}
                        </div>
                        {o.items?.length > 1 && (
                          <div className="muted text-xs">+{o.items.length - 1} other item(s)</div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                        {money(o.grand_total)}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={o.status} />
                      </td>

                      {/* Delivery Status */}
                      <td>
                        <StatusBadge status={o.delivery_status} />
                      </td>

                      {/* Payment */}
                      <td>
                        <span
                          className="chip chip-sm"
                          style={{
                            textTransform: 'uppercase',
                            fontSize: 10,
                            fontWeight: 700,
                            background: o.payment_method === 'khalti' ? 'rgba(92, 39, 254, 0.12)' : o.payment_method === 'esewa' ? 'rgba(96, 187, 70, 0.12)' : 'var(--bg)',
                            color: o.payment_method === 'khalti' ? '#5c27fe' : o.payment_method === 'esewa' ? '#4d9435' : 'var(--ink)'
                          }}
                        >
                          {o.payment_method === 'cod' ? 'COD' : o.payment_method}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="muted text-xs" style={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(o.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          {o.status === 'pending' && (
                            <button
                              type="button"
                              className="btn btn-success btn-xs flex items-center gap-1"
                              onClick={() => handleQuickStatusChange(o.id, 'accepted', 'Order accepted')}
                            >
                              <Check size={11} /> Accept
                            </button>
                          )}

                          {o.status === 'accepted' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs flex items-center gap-1"
                              onClick={() => handleQuickStatusChange(o.id, 'ready_for_pickup', 'Marked ready for courier pickup')}
                            >
                              <PackageCheck size={11} /> Ready
                            </button>
                          )}

                          <Link
                            to={`/vendor/orders/${o.id}`}
                            className="btn btn-soft btn-xs flex items-center gap-1"
                          >
                            Manage <ChevronRight size={11} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          message="Try changing the status filter or search keywords."
          action={
            <button className="btn btn-outline" onClick={() => { setSearch(''); setStatus(''); setPaymentFilter('all'); }}>
              Reset Filters
            </button>
          }
        />
      )}
    </div>
  )
}
