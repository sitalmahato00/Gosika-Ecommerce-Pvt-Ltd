import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  ShoppingBag, Store, Truck, CreditCard,
  User, MapPin, Phone, Mail, Clock,
  XCircle, Package, Printer, FileText, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import Timeline from '../../components/admin/Timeline'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/admin/ErrorState'
import { money, formatDateTime } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildDocHtml = ({ docTitle, docLines, metaRows, billTo, addrHtml, groupsHtml, totalsHtml, footer }) => {
  const meta = metaRows
    .map(([l, v]) => `<div><b>${esc(l)}</b><span>${esc(v)}</span></div>`)
    .join('')

  const billToHtml = billTo
    ? `<div class="addr"><h3>Billed To</h3><div class="box">${billTo}</div></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(docTitle)} - ${docLines ? esc(String(docLines).split('·')[0].trim()) : ''}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 32px; font-size: 13px; }
  .wrap { max-width: 760px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #111; padding-bottom: 14px; margin-bottom: 18px; }
  .wordmark { font-size: 26px; font-weight: 900; letter-spacing: 1px; }
  .wordmark span { color: #e25700; }
  .tagline { font-size: 11px; color: #555; margin-top: 2px; }
  .doc { text-align: right; }
  .doc h1 { margin: 0; font-size: 20px; letter-spacing: 3px; text-transform: uppercase; }
  .doc .docline { font-size: 11.5px; color: #555; margin-top: 4px; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 18px; font-size: 12.5px; }
  .meta b { font-weight: 700; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 3px 0; }
  .addr-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .addr { margin-bottom: 18px; }
  .addr-duo .addr { margin-bottom: 0; }
  .addr h3, .sec h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px; color: #555; }
  .addr .box { border: 1px solid #bbb; padding: 10px 12px; line-height: 1.55; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #eee; text-align: left; padding: 7px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; }
  td { padding: 7px 8px; border-bottom: 1px solid #ddd; vertical-align: top; }
  .c { text-align: center; }
  .r { text-align: right; }
  .psku { font-size: 11px; color: #666; margin-top: 2px; }
  .group-head { display: flex; gap: 14px; align-items: baseline; margin-top: 16px; font-size: 13px; }
  .group-head span { font-size: 11px; color: #555; }
  .group-sep { height: 14px; }
  .totals { width: 300px; margin-left: auto; margin-top: 18px; }
  .trow { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .trow.total { border-top: 2px solid #111; margin-top: 4px; padding-top: 8px; font-size: 16px; font-weight: 900; }
  .foot { margin-top: 34px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 11.5px; color: #555; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <div>
        <div class="wordmark">GOSI<span>KA</span></div>
        <div class="tagline">The Gosika Marketplace Pvt. Ltd.</div>
      </div>
      <div class="doc">
        <h1>${esc(docTitle)}</h1>
        ${docLines ? `<div class="docline">${esc(docLines)}</div>` : ''}
      </div>
    </div>

    <div class="meta">
      ${meta}
    </div>

    <div class="addr-duo">
      ${billToHtml}
      <div class="addr">
        <h3>Delivery Address</h3>
        <div class="box">${addrHtml}</div>
      </div>
    </div>

    <div class="sec">
      <h3>Items & Packages</h3>
      ${groupsHtml}
    </div>

    <div class="totals">
      ${totalsHtml}
    </div>

    <div class="foot">
      ${footer}
    </div>
  </div>
</body>
</html>`
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const toast = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'cancel' | 'refund'
    loading: false
  })

  const [partnerModal, setPartnerModal] = useState({
    isOpen: false,
    vendorOrder: null,
    assignment: null,
    partnerId: '',
    deliveryFee: '',
    codAmount: '',
    submitting: false
  })
  const [deliveryPartners, setDeliveryPartners] = useState([])
  const [loadingPartners, setLoadingPartners] = useState(false)

  const fetchDeliveryPartners = async () => {
    if (deliveryPartners.length > 0) return
    setLoadingPartners(true)
    try {
      const res = await api.get('/admin/delivery-partners', { params: { per_page: 100 } })
      setDeliveryPartners(api.unwrapList(res.data))
    } catch {
      // ignore
    } finally {
      setLoadingPartners(false)
    }
  }

  const handleOpenAssignModal = (vo) => {
    fetchDeliveryPartners()
    const isCod = order?.payment_method === 'cod' || order?.payment_method === 'cash_on_delivery'
    setPartnerModal({
      isOpen: true,
      vendorOrder: vo,
      assignment: null,
      partnerId: '',
      deliveryFee: vo.delivery_charge ? String(vo.delivery_charge) : '',
      codAmount: isCod && vo.grand_total ? String(vo.grand_total) : '0',
      submitting: false
    })
  }

  const handleOpenReassignModal = (vo, assignment) => {
    fetchDeliveryPartners()
    setPartnerModal({
      isOpen: true,
      vendorOrder: vo,
      assignment: assignment,
      partnerId: assignment.delivery_partner_id || assignment.delivery_partner?.id || '',
      deliveryFee: assignment.delivery_fee ? String(assignment.delivery_fee) : '',
      codAmount: assignment.cod_amount ? String(assignment.cod_amount) : '',
      submitting: false
    })
  }

  const handlePartnerModalSubmit = async (e) => {
    e.preventDefault()
    if (!partnerModal.partnerId) return

    setPartnerModal(prev => ({ ...prev, submitting: true }))
    try {
      if (partnerModal.assignment) {
        const targetId = partnerModal.assignment.id || partnerModal.assignment.uuid
        await api.post(`/admin/deliveries/${targetId}/reassign`, {
          delivery_partner_id: partnerModal.partnerId
        })
        toast.success('Delivery rider reassigned successfully.')
      } else {
        const voId = partnerModal.vendorOrder.id || partnerModal.vendorOrder.uuid
        await api.post('/admin/deliveries', {
          vendor_order_id: voId,
          delivery_partner_id: partnerModal.partnerId,
          delivery_fee: partnerModal.deliveryFee ? Number(partnerModal.deliveryFee) : undefined,
          cod_amount: partnerModal.codAmount ? Number(partnerModal.codAmount) : undefined
        })
        toast.success('Delivery partner assigned successfully. Package is ready in delivery portal.')
      }
      setPartnerModal(prev => ({ ...prev, isOpen: false, submitting: false }))
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update delivery assignment.')
      setPartnerModal(prev => ({ ...prev, submitting: false }))
    }
  }

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/admin/orders/${id}`)
      setOrder(res.data?.data || null)
    } catch (err) {
      setError('Order record could not be retrieved.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  const handleConfirmAction = async (reason) => {
    const { action } = dialogState
    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = order.uuid || order.id

    try {
      if (action === 'cancel') {
        await api.post(`/admin/orders/${targetId}/cancel`, { reason })
        toast.success(`Order #${order.order_number || order.id} has been cancelled.`)
      }

      setDialogState({ isOpen: false, action: null, loading: false })
      loadOrder()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton height={40} width={240} />
        <Skeleton height={140} style={{ borderRadius: 14 }} />
        <Skeleton height={320} style={{ borderRadius: 14 }} />
      </div>
    )
  }

  if (error || !order) {
    return (
      <ErrorState
        title="Order Not Found"
        message={error || 'The requested order details could not be found.'}
        onRetry={loadOrder}
      />
    )
  }

  const customerName = order.customer?.full_name
    || [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(' ').trim()
    || 'Customer'
  const customerEmail = order.customer?.email || '—'
  const customerPhone = order.customer?.phone || order.shipping_address?.phone || '—'
  const customerId = String(order.user_id || order.customer?.id || '')
  const address = order.shipping_address || {}
  const vendorOrders = Array.isArray(order.vendor_orders) ? order.vendor_orders : []
  const payments = Array.isArray(order.payments) ? order.payments : []
  const isCancellable = order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed'

  const addressLines = [
    address.full_name || address.recipient_name || address.name || '',
    [address.address_line_1, address.address_line_2].filter(Boolean).join(', '),
    [address.municipality, address.district, address.province].filter(Boolean).join(', '),
    address.postal_code ? `Postal Code: ${address.postal_code}` : '',
    address.landmark ? `Landmark: ${address.landmark}` : '',
    address.phone ? `Phone: ${address.phone}` : ''
  ].filter(Boolean)

  // Build timeline events
  const timelineEvents = [
    {
      title: 'Order Placed',
      description: `Order #${order.order_number || order.id} created by customer.`,
      status: 'pending',
      created_at: order.created_at || order.placed_at
    }
  ]

  if (order.status_history && Array.isArray(order.status_history)) {
    order.status_history.forEach(h => {
      timelineEvents.push({
        title: `Status: ${h.to_status}`,
        description: h.reason || `Transitioned from ${h.from_status || 'previous'} to ${h.to_status}`,
        status: h.to_status,
        created_at: h.created_at
      })
    })
  }

  const groups = vendorOrders.length > 0
    ? vendorOrders.map((vo, i) => ({
        store: vo.store?.name || vo.vendor_name || `Package #${i + 1}`,
        no: vo.vendor_order_number || vo.id || '',
        status: vo.status || '',
        items: Array.isArray(vo.items) ? vo.items : []
      }))
    : [{
        store: 'Order Items',
        no: order.order_number || order.id || '',
        status: order.status || '',
        items: Array.isArray(order.items) ? order.items : []
      }]

  const addrBlock = addressLines.length > 0
    ? addressLines.map(l => `<div>${esc(l)}</div>`).join('')
    : '<div>Delivery address on file with customer.</div>'

  const billToBlock = [
    `<div style="font-weight:700">${esc(customerName)}</div>`,
    `<div>${esc(customerEmail)}</div>`,
    customerPhone !== '—' ? `<div>${esc(customerPhone)}</div>` : ''
  ].filter(Boolean).join('')

  const groupsHtml = groups.map((g, gi) => {
    const rows = g.items.map((it, ri) => `
      <tr>
        <td class="c">${ri + 1}</td>
        <td>
          <div class="pname">${esc(it.product_name || it.name)}</div>
          <div class="psku">SKU: ${esc(it.sku || '—')}${it.variant_name ? ' · ' + esc(it.variant_name) : ''}</div>
        </td>
        <td class="c">${it.quantity ?? ''}</td>
        <td class="r">${money(it.unit_price ?? it.price)}</td>
        <td class="r">${money(it.line_total ?? ((it.unit_price ?? 0) * (it.quantity ?? 0)))}</td>
      </tr>`).join('')

    return `
      <div class="group">
        <div class="group-head">
          <strong>${esc(g.store)}</strong>
          ${g.no ? `<span>Vendor Order #${esc(g.no)}</span>` : ''}
          ${g.status ? `<span>${esc(g.status.replace(/_/g, ' ')).toUpperCase()}</span>` : ''}
        </div>
        <table>
          <thead>
            <tr><th class="c" style="width:36px">S.No</th><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('<div class="group-sep"></div>')

  const totalRows = `
    <div class="trow"><span>Subtotal</span><span>${money(order.subtotal || order.grand_total || 0)}</span></div>
    ${Number(order.discount) > 0 ? `<div class="trow"><span>Coupon Discount</span><span>- ${money(order.discount)}</span></div>` : ''}
    ${Number(order.tax) > 0 ? `<div class="trow"><span>Tax</span><span>${money(order.tax)}</span></div>` : ''}
    <div class="trow"><span>Delivery Charge</span><span>${money(order.delivery_charge || 0)}</span></div>
    <div class="trow total"><span>Grand Total</span><span>${money(order.grand_total || order.total || 0)}</span></div>`

  const baseMetaRows = [
    ['Order #', order.order_number || order.id],
    ['Placed', formatDateTime(order.created_at || order.placed_at)],
    ['Customer', customerName],
    ['Email', customerEmail],
    ['Phone', customerPhone],
    ['Payment Method', (order.payment_method || 'COD').toUpperCase()],
    ['Payment Status', (order.payment_status || 'pending').toUpperCase()],
    ['Currency', order.currency || 'NPR']
  ]

  const printWindow = (html) => {
    const win = window.open('', '_blank', 'width=860,height=1000')
    if (!win) {
      toast.error('Popup blocked. Allow popups for this page to print.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const printSlip = () => {
    printWindow(buildDocHtml({
      docTitle: 'Package Slip / Bill',
      docLines: `Date: ${formatDateTime(order.created_at || order.placed_at)}`,
      metaRows: baseMetaRows,
      billTo: null,
      addrHtml: addrBlock,
      groupsHtml,
      totalsHtml: totalRows,
      footer: `Thank you for shopping with Gosika Marketplace &nbsp;·&nbsp; This is a system-generated package slip / delivery bill for order ${esc(order.order_number || order.id)}. It is not a tax invoice.`
    }))
  }

  const printInvoice = () => {
    const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    printWindow(buildDocHtml({
      docTitle: 'Tax Invoice',
      docLines: `Invoice Date: ${today}`,
      metaRows: [
        ['Invoice #', order.order_number || order.id],
        ['Order Date', formatDateTime(order.created_at || order.placed_at)],
        ['Customer', customerName],
        ['Email', customerEmail],
        ['Phone', customerPhone],
        ['Payment Method', (order.payment_method || 'COD').toUpperCase()],
        ['Payment Status', (order.payment_status || 'pending').toUpperCase()],
        ['Currency', order.currency || 'NPR']
      ],
      billTo: billToBlock,
      addrHtml: addrBlock,
      groupsHtml,
      totalsHtml: totalRows,
      footer: `Payment status: ${esc((order.payment_status || 'pending').toUpperCase())}. Amount is inclusive of applicable charges as per Gosika Marketplace terms. This tax invoice was generated for order ${esc(order.order_number || order.id)}.`
    }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={`Order #${order.order_number || order.id}`}
        description={`Placed on ${formatDateTime(order.created_at || order.placed_at)} · Grand Total: ${money(order.grand_total || order.total || 0)}`}
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: `#${order.order_number || order.id}` }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={printSlip}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <FileText size={14} /> Print Slip
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={printInvoice}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Printer size={14} /> Print Invoice
            </button>

            {isCancellable && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => setDialogState({ isOpen: true, action: 'cancel', loading: false })}
              >
                <XCircle size={14} style={{ marginRight: 4 }} /> Cancel Order
              </button>
            )}
          </div>
        }
      />

      {/* Top Banner Status Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          borderRadius: 14,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#eff6ff',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>
                Order #{order.order_number || order.id}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              Payment Status: <strong>{order.payment_status?.toUpperCase() || 'PENDING'}</strong> via <strong>{order.payment_method?.toUpperCase() || 'COD'}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
            Grand Total
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#16a34a' }}>
            {money(order.grand_total || order.total || 0)}
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: 20 }} id="admin-order-grid">
        <style>{`@media(max-width:920px){#admin-order-grid{grid-template-columns:1fr!important}}`}</style>

        {/* Left Column: Multi-Vendor Orders Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad-none" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Store size={17} color="var(--primary)" /> Fulfillment Packages ({vendorOrders.length || 1})
              </h3>
              <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Package size={13} /> {order.item_count ?? ((order.items || []).reduce((s, i) => s + (i.quantity || 0), 0))} items
              </span>
            </div>

            {vendorOrders.length === 0 ? (
              /* Fallback if flat items */
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{it.product_name || it.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{it.sku || '—'}</td>
                        <td style={{ textAlign: 'right' }}>{money(it.unit_price || it.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>{money(it.line_total ?? ((it.unit_price || it.price) * it.quantity))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {vendorOrders.map((vo, voIdx) => {
                  const storeName = vo.store?.name || vo.vendor_name || `Vendor Package #${voIdx + 1}`
                  const items = Array.isArray(vo.items) ? vo.items : []
                  const assignment = Array.isArray(vo.assignments) && vo.assignments.length > 0 ? vo.assignments[0] : null
                  const rider = assignment?.delivery_partner || assignment?.deliveryPartner
                  const riderName = rider?.name || rider?.user?.name || assignment?.delivery_partner_name
                  const riderPhone = rider?.phone || rider?.user?.phone
                  const canAssign = vo.status !== 'cancelled' && order.status !== 'cancelled'

                  return (
                    <div
                      key={vo.id || vo.uuid || voIdx}
                      style={{
                        padding: 20,
                        borderBottom: voIdx < vendorOrders.length - 1 ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      {/* Vendor Store Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>
                              Store: {storeName}
                            </span>
                            <StatusBadge status={vo.status} />
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                            Vendor Order #{vo.vendor_order_number || vo.id} · Commission: {vo.commission_rate ?? 10}% ({money(vo.commission_amount || 0)})
                          </div>
                        </div>

                        {/* Delivery Assignment Status & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {assignment ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                <Truck size={14} color="#10b981" />
                                <span>Rider: <strong>{riderName || 'Assigned'}</strong></span>
                                {riderPhone && <span style={{ color: 'var(--muted)', fontSize: 11 }}>({riderPhone})</span>}
                                <StatusBadge status={assignment.status} />
                              </div>
                              {canAssign && assignment.status !== 'delivered' && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs"
                                  style={{ color: 'var(--primary)', fontWeight: 600, padding: '2px 6px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                                  onClick={() => handleOpenReassignModal(vo, assignment)}
                                  title="Reassign another rider"
                                >
                                  <RefreshCw size={11} /> Reassign
                                </button>
                              )}
                            </div>
                          ) : (
                            canAssign && (
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 600, padding: '6px 12px', borderRadius: 8 }}
                                onClick={() => handleOpenAssignModal(vo)}
                              >
                                <Truck size={13} /> Assign Delivery Partner
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {/* Items Table */}
                      <div className="table-wrap" style={{ background: '#fafbfc', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <table className="table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th style={{ textAlign: 'right' }}>Price</th>
                              <th style={{ textAlign: 'right' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it, itIdx) => (
                              <tr key={it.id || itIdx}>
                                <td>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>
                                    {it.product_name || it.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                                    SKU: {it.sku || '—'}{it.variant_name ? ` · ${it.variant_name}` : ''}
                                  </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>{money(it.unit_price || it.price)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{it.quantity}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800 }}>{money(it.line_total || (it.unit_price * it.quantity))}</td>
                              </tr>
                            ))}
                            {items.length === 0 && (
                              <tr><td colSpan={4} style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', padding: 14 }}>No items in this package.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Financial Totals Summary */}
            <div style={{ padding: '16px 20px', background: '#fafbfc', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 320, marginLeft: 'auto', fontSize: 13 }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>{money(order.subtotal || order.grand_total || 0)}</span>
                </div>
                {Number(order.delivery_charge) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Delivery Charge:</span>
                    <span style={{ fontWeight: 600 }}>{money(order.delivery_charge)}</span>
                  </div>
                )}
                {Number(order.tax) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>Tax:</span>
                    <span style={{ fontWeight: 600 }}>{money(order.tax)}</span>
                  </div>
                )}
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between" style={{ color: '#16a34a' }}>
                    <span>Coupon Discount:</span>
                    <span style={{ fontWeight: 700 }}>- {money(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)', fontSize: 15 }}>
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Grand Total:</span>
                  <span style={{ fontWeight: 900, color: '#16a34a' }}>{money(order.grand_total || order.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="var(--primary)" /> Order Event & Audit Timeline
            </h3>
            <Timeline events={timelineEvents} />
          </div>
        </div>

        {/* Right Column: Customer & Delivery Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer Profile Card */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={16} color="var(--primary)" /> Customer Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{customerName}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                  User ID: {customerId ? `#${customerId.slice(0, 8)}` : 'Guest'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                <Mail size={14} color="#94a3b8" />
                <span>{customerEmail}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                <Phone size={14} color="#94a3b8" />
                <span>{customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#e11d48" /> Delivery Address
            </h3>

            {addressLines.length > 0 ? (
              <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
                {addressLines.map((line, i) => (
                  <div key={i} style={i === 0 ? { fontWeight: 700, color: 'var(--ink)' } : undefined}>{line}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{customerName}</div>
                <div>{customerPhone !== '—' ? `Phone: ${customerPhone}` : ''}</div>
                <div>Delivery address on file with customer.</div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="card" style={{ padding: 20, borderRadius: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={16} color="var(--primary)" /> Payment Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Method:</span>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{order.payment_method?.toUpperCase() || 'COD'}</span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Payment Status:</span>
                <StatusBadge status={order.payment_status || 'pending'} />
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>Order Value:</span>
                <span style={{ fontWeight: 700 }}>{money(order.grand_total || order.total || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--muted)' }}>Currency:</span>
                <span style={{ fontWeight: 600 }}>{order.currency || 'NPR'} (Rs.)</span>
              </div>
              {payments.length > 0 && (
                <div className="flex justify-between py-1">
                  <span style={{ color: 'var(--muted)' }}>Transactions:</span>
                  <span style={{ fontWeight: 600 }}>{payments.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={`Cancel Order #${order.order_number || order.id}?`}
        message="Cancelling this order will update all vendor packages and notify the customer."
        variant="danger"
        confirmText="Cancel Order"
        requireReason={true}
        reasonPlaceholder="State the administrative reason for cancelling this order..."
      />

      {/* Assign / Reassign Delivery Partner Modal */}
      {partnerModal.isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget && !partnerModal.submitting) setPartnerModal(prev => ({ ...prev, isOpen: false })) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} color="var(--primary)" />
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {partnerModal.assignment ? 'Reassign Delivery Rider' : 'Assign Delivery Partner'}
                </h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setPartnerModal(prev => ({ ...prev, isOpen: false }))}
                disabled={partnerModal.submitting}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePartnerModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 12.5, color: '#334155' }}>
                <div><strong>Package:</strong> {partnerModal.vendorOrder?.store?.name || partnerModal.vendorOrder?.vendor_name || 'Store Package'}</div>
                <div><strong>Vendor Order #:</strong> {partnerModal.vendorOrder?.vendor_order_number || partnerModal.vendorOrder?.id}</div>
                {order.shipping_address && (
                  <div><strong>Destination:</strong> {[order.shipping_address.address_line_1, order.shipping_address.municipality, order.shipping_address.district].filter(Boolean).join(', ')}</div>
                )}
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                  Select Delivery Partner / Rider *
                </label>
                <select
                  className="input"
                  style={{ width: '100%', height: 40, fontSize: 13, fontWeight: 600 }}
                  value={partnerModal.partnerId}
                  onChange={e => setPartnerModal(prev => ({ ...prev, partnerId: e.target.value }))}
                  required
                >
                  <option value="">{loadingPartners ? 'Loading delivery partners...' : 'Choose a delivery partner / rider...'}</option>
                  {deliveryPartners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.vehicle_type || 'Rider'}{p.vehicle_number ? ` - ${p.vehicle_number}` : ''} · {p.phone}) {p.is_online ? '🟢 Online' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!partnerModal.assignment && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      Delivery Fee (NPR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: 13 }}
                      value={partnerModal.deliveryFee}
                      onChange={e => setPartnerModal(prev => ({ ...prev, deliveryFee: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, display: 'block' }}>
                      COD Amount to Collect (NPR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      style={{ width: '100%', height: 38, fontSize: 13 }}
                      value={partnerModal.codAmount}
                      onChange={e => setPartnerModal(prev => ({ ...prev, codAmount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setPartnerModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={partnerModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={partnerModal.submitting || !partnerModal.partnerId}
                >
                  {partnerModal.submitting ? 'Processing...' : partnerModal.assignment ? 'Confirm Reassignment' : 'Assign Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}