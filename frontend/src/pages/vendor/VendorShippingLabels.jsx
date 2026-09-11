import React, { useEffect, useState } from 'react'
import {
  Printer, FileText, X, Package, MapPin, Building2
} from 'lucide-react'
import api from '../../api/client'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { money, formatDate, errorMessage } from '../../utils/format'

function Barcode({ value }) {
  const bars = []
  let seed = 0
  for (const ch of String(value || 'GOSIKA0')) seed = (seed * 31 + ch.charCodeAt(0)) % 997
  for (let i = 0; i < 32; i += 1) {
    seed = (seed * 97 + 17) % 997
    const w = 1 + (seed % 3)
    bars.push(<span key={i} style={{ width: w, background: '#0f172a', display: 'inline-block', marginRight: 2 }} />)
  }
  return (
    <div className="flex items-end justify-center gap-0" style={{ height: 34 }}>{bars}</div>
  )
}

function LabelSheet({ seller, store, order }) {
  const addr = order.shipping_address || order.order?.shipping_address || {}
  const name = addr?.name || addr?.full_name || 'Customer'
  const street = addr?.street || addr?.address_line_1 || ''
  const addressLine = [street, addr?.municipality || addr?.city, addr?.district, addr?.province].filter(Boolean).join(', ')
  const sellerAddr = store
    ? [store.street || store.municipality || store.city, store.district, store.province].filter(Boolean).join(', ')
    : (seller?.business_email || '')
  const items = order.items || []

  return (
    <div className="print-area card" style={{ width: '100%', maxWidth: 360, margin: '0 auto', padding: 18, fontSize: 12, color: '#0f172a' }}>
      <div className="flex items-center justify-between" style={{ borderBottom: '2px solid #0f172a', paddingBottom: 10, marginBottom: 12 }}>
        <div className="flex items-center gap-2">
          <Building2 size={18} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: 15 }}>Gosika Shipping Label</span>
        </div>
        <span className="font-mono" style={{ fontSize: 10, opacity: 0.7 }}>NPR</span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Ship To</div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div>{addressLine || 'Address not specified'}</div>
        {addr?.phone && <div>Tel: {addr.phone}</div>}
      </div>

      <div style={{ marginBottom: 12, borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
        <div className="muted" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Pickup From</div>
        <div style={{ fontWeight: 700 }}>{store?.name || seller?.company_name || 'Seller Store'}</div>
        <div>{sellerAddr || '—'}</div>
        {store?.contact_phone && <div>Tel: {store.contact_phone}</div>}
      </div>

      <div style={{ borderTop: '2px solid #0f172a', paddingTop: 10 }}>
        <div className="font-mono" style={{ fontWeight: 800, fontSize: 16 }}>{order.vendor_order_number || `#${order.id}`}</div>
        <div className="flex items-center justify-between wrap">
          <div>{items.length} item(s)</div>
          <div>Total {money(order.grand_total)}</div>
        </div>
        <div className="muted" style={{ fontSize: 10 }}>Placed {formatDate(order.created_at)}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Barcode value={order.vendor_order_number || order.id} />
        <div className="font-mono" style={{ fontSize: 9, textAlign: 'center', letterSpacing: '0.16em', marginTop: 4 }}>
          {order.vendor_order_number || order.id}
        </div>
      </div>
    </div>
  )
}

export default function VendorShippingLabels() {
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [printTarget, setPrintTarget] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      api.get('/vendor/orders', { params: { page: 1, per_page: 12 } }),
      api.get('/vendor/me'),
      api.get('/vendor/stores'),
    ])
      .then(([o, m, s]) => {
        const orderList = o.data?.data?.data ?? o.data?.data ?? o.data ?? []
        setOrders(Array.isArray(orderList) ? orderList : [])
        setProfile(m.data?.data || null)
        const storeList = s.data?.data?.data ?? s.data?.data ?? []
        setStore(Array.isArray(storeList) ? storeList[0] || null : null)
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const print = () => {
    window.print()
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Shipping Labels</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Generate and print shipping labels for your recent orders.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : error ? (
        <EmptyState
          icon={FileText}
          title="Could not load orders"
          message="Something went wrong while loading your orders for label printing."
          action={<Button variant="outline" size="sm" onClick={load}>Try again</Button>}
        />
      ) : orders.length ? (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const addr = o.shipping_address || o.order?.shipping_address || {}
            return (
              <div key={o.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                  <span className="avatar" style={{ width: 42, height: 42, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
                    <Package size={20} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-mono font-bold text-sm" style={{ color: 'var(--primary)' }}>{o.vendor_order_number || `#${o.id}`}</div>
                    <div className="muted text-xs mt-0.5 line-clamp-1">{addr?.name || 'Customer'} · {o.items?.length || 1} item({o.items?.length === 1 ? '' : 's'}) · {money(o.grand_total)}</div>
                    <div className="muted text-xs line-clamp-1 flex items-center gap-1"><MapPin size={11} /> {[addr?.municipality || addr?.city, addr?.district, addr?.province].filter(Boolean).join(', ') || 'Address not set'}</div>
                  </div>
                </div>
                <Button variant="primary" size="sm" icon={Printer} onClick={() => setPrintTarget(o)}>
                  Print Label
                </Button>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No orders to label"
          message="When orders are placed, you'll be able to print shipping labels right here."
        />
      )}

      {printTarget && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div className="card" style={{ padding: 18, maxHeight: '92vh', overflow: 'auto', position: 'relative' }}>
              <button
                className="icon-btn icon-btn-sm"
                style={{ position: 'absolute', top: 10, right: 10, border: 'none', zIndex: 5 }}
                onClick={() => setPrintTarget(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <div className="muted text-xs mb-3">Label preview — click Print to produce a physical copy.</div>
              <LabelSheet seller={profile} store={store} order={printTarget} />
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setPrintTarget(null)}>Cancel</Button>
                <Button variant="primary" size="sm" icon={Printer} onClick={print}>Print</Button>
              </div>
            </div>
          </div>

          <div className="print-only">
            <LabelSheet seller={profile} store={store} order={printTarget} />
          </div>

          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .print-only, .print-only * { visibility: visible !important; }
              .print-only { position: absolute; left: 0; top: 0; width: 100%; }
              .print-only .print-area { max-width: 90mm; border: 0; box-shadow: none; padding: 0; margin: 0 auto; }
            }
          `}</style>
        </>
      )}
    </div>
  )
}