import QRCode from 'qrcode'

export async function qrDataUrl(text, width = 220) {
  if (!text) return null
  return QRCode.toDataURL(text, { width, margin: 1, errorCorrectionLevel: 'M' })
}

export function orderTrackUrl(order) {
  const id = order?.order_id || order?.id
  if (!id) return null
  return `${window.location.origin}/orders/${id}`
}