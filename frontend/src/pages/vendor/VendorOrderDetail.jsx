import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, Check, X, PackageCheck, MapPin, Phone, Truck, Printer, FileText } from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { money, formatDateTime, apiImage, errorMessage, getProductImage } from '../../utils/format'
import { qrDataUrl, orderTrackUrl } from '../../utils/qr'
import { useToast } from '../../context/ToastContext'

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const buildDocHtml = (docTitle, docLines, metaRows, billTo, addrHtml, groupsHtml, totalsHtml, footer, qrHtml = '') => {
  const meta = metaRows
    .map(([l, v]) => `<div><b>${esc(l)}</b><span>${esc(v)}</span></div>`)
    .join('')

  const billToHtml = billTo ? `<div class="addr"><h3>Billed To</h3><div class="box">${billTo}</div></div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(docTitle)} - ${esc(docLines.split('·')[0].trim())}</title>
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
  .totals { width: 300px; }
  .trow { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .trow.total { border-top: 2px solid #111; margin-top: 4px; padding-top: 8px; font-size: 16px; font-weight: 900; }
  .totals-duo { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: 18px; }
  .qrcode { text-align: center; }
  .qrcode img { width: 130px; height: 130px; border: 1px solid #ddd; border-radius: 6px; padding: 6px; background: #fff; }
  .qrcode .qcap { font-size: 10.5px; color: #555; margin-top: 5px; max-width: 150px; }
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
      <h3>Items</h3>
      ${groupsHtml}
    </div>

    <div class="totals-duo" style="justify-content:${qrHtml ? 'space-between' : 'flex-end'}">
      <div class="totals">
        ${totalsHtml}
      </div>
      ${qrHtml}
    </div>

    <div class="foot">
      ${footer}
    </div>
  </div>
</body>
</html>`
}

const printWindow = (html, toast) => {
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

export default function VendorOrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    api.get(`/vendor/orders/${id}`).then((r) => setOrder(r.data.data)).catch((e) => setError(e)).finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const act = async (path, successMsg, body) => {
    setBusy(true)
    try {
      await api.post(`/vendor/orders/${id}/${path}`, body)
      toast.success(successMsg)
      setRejectOpen(false)
      setReason('')
      load()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton height={80} />
        <Skeleton height={200} />
      </div>
    )
  }

  if (error || !order) {
    return <ErrorState message={errorMessage(error, 'Order not found.')} onRetry={load} />
  }

  const addr = order.shipping_address || order.order?.shipping_address || {}

  const buildDocParts = () => {
    const customerName = addr?.name || addr?.full_name || addr?.recipient_name || 'Customer'
    const customerPhone = addr?.phone || '—'
    const addressLines = [
      customerName,
      addr?.street || addr?.address_line_1,
      addr?.municipality || addr?.city,
      addr?.district,
      addr?.province
    ].filter(Boolean)

    const addrHtml = addressLines.length > 0
      ? addressLines.map((l) => `<div>${esc(l)}</div>`).join('')
      : '<div>Delivery address on file with customer.</div>'

    const billTo = [
      `<div style="font-weight:700">${esc(customerName)}</div>`,
      customerPhone !== '—' ? `<div>${esc(customerPhone)}</div>` : ''
    ].filter(Boolean).join('')

    const rows = (order.items || []).map((it, ri) => `
      <tr>
        <td class="c">${ri + 1}</td>
        <td>
          <div class="pname">${esc(it.product_name || it.name)}</div>
          <div class="psku">${it.variant_name ? 'Variant: ' + esc(it.variant_name) : ''}${it.sku ? ' · SKU: ' + esc(it.sku) : ''}</div>
        </td>
        <td class="c">${it.quantity ?? ''}</td>
        <td class="r">${money(it.unit_price ?? it.price)}</td>
        <td class="r">${money(it.line_total ?? ((it.unit_price ?? 0) * (it.quantity ?? 0)))}</td>
      </tr>`).join('')

    const groupsHtml = `
      <div class="group">
        <div class="group-head">
          <strong>${esc(order.store_name || 'Store')}</strong>
          <span>Vendor Order #${esc(order.vendor_order_number)}</span>
          <span>${esc(String(order.status || '').replace(/_/g, ' ')).toUpperCase()}</span>
        </div>
        <table>
          <thead>
            <tr><th class="c" style="width:36px">S.No</th><th>Item</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`

    const totalsHtml = `
      <div class="trow"><span>Subtotal</span><span>${money(order.items_subtotal)}</span></div>
      <div class="trow"><span>Delivery</span><span>${Number(order.delivery_charge) > 0 ? money(order.delivery_charge) : 'Free'}</span></div>
      ${Number(order.tax) > 0 ? `<div class="trow"><span>Tax</span><span>${money(order.tax)}</span></div>` : ''}
      <div class="trow total"><span>Grand Total</span><span>${money(order.grand_total)}</span></div>
      <div class="trow"><span>Commission (${order.commission_rate}%)</span><span>- ${money(order.commission_amount)}</span></div>
      <div class="trow"><span>You receive</span><span>${money(order.vendor_payable)}</span></div>`

    return { customerName, customerPhone, addrHtml, billTo, groupsHtml, totalsHtml }
  }

  const printInvoice = () => {
    const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    const { customerName, customerPhone, addrHtml, billTo, groupsHtml, totalsHtml } = buildDocParts()

    printWindow(buildDocHtml(
      'Tax Invoice',
      `Invoice Date: ${today} · Paid via ${esc(String(order.payment_method || 'COD')).toUpperCase()}`,
      [
        ['Invoice #', order.vendor_order_number],
        ['Order Date', formatDateTime(order.created_at)],
        ['Customer', customerName],
        ['Phone', customerPhone],
        ['Payment Method', (order.payment_method || 'COD').toUpperCase()],
        ['Payment Status', (order.payment_status || order.status || 'pending').toUpperCase()],
        ['Currency', order.currency || 'NPR']
      ],
      billTo,
      addrHtml,
      groupsHtml,
      totalsHtml,
      `Payment status: ${esc((order.payment_status || 'pending').toUpperCase())}. This is a system-generated tax invoice for vendor order ${esc(order.vendor_order_number)} on the Gosika Marketplace.`
    ), toast)
  }

  const printSlip = async () => {
    const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
    const { customerName, customerPhone, addrHtml, billTo, groupsHtml } = buildDocParts()

    const slipTotalsHtml = `
      <div class="trow"><span>Subtotal</span><span>${money(order.items_subtotal)}</span></div>
      <div class="trow"><span>Delivery</span><span>${Number(order.delivery_charge) > 0 ? money(order.delivery_charge) : 'Free'}</span></div>
      ${Number(order.tax) > 0 ? `<div class="trow"><span>Tax</span><span>${money(order.tax)}</span></div>` : ''}
      <div class="trow total"><span>Total Payable</span><span>${money(order.grand_total)}</span></div>`

    const trackUrl = orderTrackUrl(order)
    const qr = trackUrl ? await qrDataUrl(trackUrl, 200) : null
    const qrHtml = qr
      ? `<div class="qrcode"><img src="${qr}" alt="Track order QR" /><div class="qcap">Scan to track this order</div></div>`
      : ''

    printWindow(buildDocHtml(
      'Packing Slip',
      `Prepared for packing · ${today}`,
      [
        ['Vendor Order #', order.vendor_order_number],
        ['Order Date', formatDateTime(order.created_at)],
        ['Store', order.store_name || 'Store'],
        ['Customer', customerName],
        ['Phone', customerPhone],
        ['Status', (order.status || 'pending').toUpperCase()],
        ['Payment Method', (order.payment_method || 'COD').toUpperCase()]
      ],
      billTo,
      addrHtml,
      groupsHtml,
      slipTotalsHtml,
      `Thank you for shopping with Gosika Marketplace &nbsp;·&nbsp; This is a system-generated packing slip for order ${esc(order.vendor_order_number)}. It is not a tax invoice.`,
      qrHtml
    ), toast)
  }

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-1 muted text-sm" aria-label="Breadcrumb">
        <Link to="/vendor/orders">Orders</Link> <ChevronRight size={13} />
        <span className="font-semibold" style={{ color: 'var(--ink)' }}>{order.vendor_order_number}</span>
      </nav>

      <div className="card">
        <div className="flex items-center justify-between wrap gap-2">
          <div>
            <h2 style={{ fontSize: 18, marginBottom: 4 }}>{order.vendor_order_number}</h2>
            <div className="muted text-sm">Placed {formatDateTime(order.created_at)} · {order.store_name}</div>
          </div>
          <div className="flex items-center gap-2 wrap">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.delivery_status} />
            <Button variant="outline" size="sm" icon={Printer} onClick={printInvoice}>Print Invoice</Button>
            <Button variant="outline" size="sm" icon={FileText} onClick={printSlip}>Packing Slip</Button>
            {order.status === 'pending' && (
              <>
                <Button variant="success" size="sm" icon={Check} disabled={busy} onClick={() => act('accept', 'Order accepted')}>Accept</Button>
                <Button variant="danger-outline" size="sm" icon={X} disabled={busy} onClick={() => setRejectOpen(true)}>Reject</Button>
              </>
            )}
            {order.status === 'accepted' && (
              <Button variant="primary" size="sm" icon={PackageCheck} disabled={busy} onClick={() => act('ready-for-pickup', 'Marked ready for pickup')}>
                Ready for pickup
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ fontSize: 16 }} className="mb-2">Items</h3>
          <div className="flex flex-col">
            {(order.items || []).map((it) => (
              <div key={it.id} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="thumb" style={{ width: 44, height: 44 }}>
                  <img
                    src={it.image ? apiImage(it.image) : getProductImage(it)}
                    alt=""
                    className="thumb-img"
                  />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{it.product_name}</div>
                  {it.variant_name && <div className="muted text-xs">{it.variant_name}</div>}
                  <div className="muted text-xs">× {it.quantity} · {money(it.unit_price)}</div>
                </div>
                <div className="font-semibold text-sm">{money(it.line_total)}</div>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div className="flex flex-col gap-1 text-sm" style={{ maxWidth: 360 }}>
            <div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(order.items_subtotal)}</span></div>
            <div className="flex justify-between"><span className="muted">Delivery</span><span>{Number(order.delivery_charge) > 0 ? money(order.delivery_charge) : 'Free'}</span></div>
            {Number(order.tax) > 0 && <div className="flex justify-between"><span className="muted">Tax</span><span>{money(order.tax)}</span></div>}
            <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span className="font-bold">Grand total</span><span className="price-current">{money(order.grand_total)}</span>
            </div>
            <div className="flex justify-between mt-1"><span className="muted">Commission ({order.commission_rate}%)</span><span className="text-danger">-{money(order.commission_amount)}</span></div>
            <div className="flex justify-between"><span className="muted font-semibold">You receive</span><span className="font-bold text-success">{money(order.vendor_payable)}</span></div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card">
            <h3 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><MapPin size={16} color="var(--primary)" /> Delivery address</h3>
            <div className="text-sm">
              <div className="font-semibold" style={{ color: 'var(--ink)', fontSize: 14 }}>
                {addr?.name || addr?.full_name || 'Customer'}
              </div>
              <div className="muted" style={{ marginTop: 2 }}>
                {[addr?.street || addr?.address_line_1, addr?.municipality || addr?.city, addr?.district, addr?.province].filter(Boolean).join(', ') || 'Address not specified'}
              </div>
              {addr?.phone && (
                <div className="muted flex items-center gap-1 mt-1.5" style={{ fontSize: 13, color: 'var(--ink)' }}>
                  <Phone size={13} color="var(--primary)" /> {addr.phone}
                </div>
              )}
            </div>
          </div>

          {order.assignments?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 16 }} className="flex items-center gap-2 mb-2"><Truck size={16} color="var(--primary)" /> Delivery</h3>
              {order.assignments.map((a) => (
                <div key={a.id} className="text-sm flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{a.delivery_partner_name || 'Delivery partner'}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="muted text-xs">Fee: {money(a.delivery_fee)} · COD: {money(a.cod_amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={() => {
          if (!reason.trim()) return toast.error('Please provide a reason')
          act('reject', 'Order rejected', { reason: reason.trim() })
        }}
        danger
        loading={busy}
        title="Reject this order?"
        confirmText="Reject order"
        message="Let us know why you're rejecting this order so we can inform the customer."
      >
        <div className="mt-2">
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Out of stock, unable to fulfil…" />
        </div>
      </ConfirmDialog>
    </div>
  )
}
