/**
 * Professional, Excel-compatible (`.xls`) report exporter shared by every
 * board page in the platform.
 *
 * Plain CSV cannot carry a branded header, styled columns or cell coloring, so
 * reports render as an Excel-compatible HTML worksheet (opens natively in
 * Excel / WPS / LibreOffice with full styling):
 *
 *  - Branded wordmark + company contact block
 *  - Report title, subtitle and metadata bar (prepared by / period / generated / currency)
 *  - Section title bars, branded column headers, zebra rows, totals row
 *  - Explicit column widths for clean cell spacing
 *  - Confidential footer
 */

const DEFAULT_COMPANY = {
  name: 'GOSIKA',
  brandName: 'GOSIKA',
  tagline: "Nepal's Premier Multi-Vendor Marketplace",
  legal: 'GOSIKA Pvt. Ltd.',
  address: 'Baluwatar, Kathmandu, Nepal',
  email: 'support@gosika.com.np',
  phone: '+977-1-4200000',
  currency: 'रु',
  primary: '#FF5B00',
  primaryDark: 'rgba(255,85,0,0.12)',
  ink: '#0F172A',
}

/** Map the platform branding context into the exporter's company model. */
export function companyFromBranding(branding = {}) {
  const name = branding.brand_name || branding.site_name || 'GOSIKA'
  return {
    ...DEFAULT_COMPANY,
    name,
    brandName: name,
    tagline: branding.tagline || DEFAULT_COMPANY.tagline,
    legal: `${name} Pvt. Ltd.`,
    address: branding.business_address || DEFAULT_COMPANY.address,
    email: branding.support_email || DEFAULT_COMPANY.email,
    phone: branding.support_phone || DEFAULT_COMPANY.phone,
    currency: 'रु',
    primary: branding.primary_color || DEFAULT_COMPANY.primary,
  }
}

/** Resolve a human display name for the "prepared by" line. */
export function personLabel(user = {}) {
  return (
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.name ||
    'Administrator'
  )
}

const RIGHT_ALIGN_HINTS = /total|amount|revenue|balance|price|value|fee|commission|count|grand|net|vat|tax|share|stock|qty|quantity|payout|refund|settled|due|gmv|weight|sales|earned|collected|budget|spend/i

/** Heuristic column alignment so numbers sit right, text sits left. */
export function autoAlign(label = '') {
  return RIGHT_ALIGN_HINTS.test(String(label)) ? 'right' : 'left'
}

const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function colWidth(c) {
  const w = Number(c.width)
  return Number.isFinite(w) && w > 0 ? w : 110
}

function cellStyle(align, extra = '') {
  const styles = [`text-align:${align || 'left'}`, 'vertical-align:middle', 'padding:7px 10px', 'border:0.5pt solid #E2E8F0', 'font-size:9.5pt']
  if (extra) styles.push(extra)
  return styles.join(';')
}

function headerCell(label, align, width, primary) {
  return `<th style="width:${width}px;text-align:${align || 'left'};vertical-align:middle;padding:8px 10px;background:${primary};color:#FFFFFF;font-weight:800;font-size:9.5pt;border:0.5pt solid ${primary};letter-spacing:0.02em">${esc(label)}</th>`
}

function dataCell(value, align, primary, zebra) {
  const bg = zebra ? '#F8FAFC' : '#FFFFFF'
  return `<td style="${cellStyle(align)};background:${bg}">${esc(value)}</td>`
}

function totalsCell(value, align, primary) {
  return `<td style="${cellStyle(align)};background:#FFF1E6;font-weight:800;color:${primary};border-top:1.5pt solid ${primary}">${esc(value)}</td>`
}

function sectionTable(section, company) {
  const { heading = '', columns = [], rows = [], totals = null } = section
  const totalWidth = columns.reduce((sum, c) => sum + colWidth(c), 0)
  const parts = []

  if (heading) {
    parts.push(
      `<tr><td colspan="${Math.max(columns.length, 1)}" style="background:${company.ink};color:#FFFFFF;font-weight:800;font-size:10pt;letter-spacing:0.08em;padding:9px 10px;border:none">${esc(heading.toUpperCase())}</td></tr>`
    )
  }

  parts.push('<tr>' + columns.map((c) => headerCell(c.label, c.align || autoAlign(c.label), colWidth(c), company.primary)).join('') + '</tr>')

  rows.forEach((row, i) => {
    const zebra = i % 2 === 1
    const tds = columns.map((c, ci) => dataCell(row[ci], c.align || autoAlign(c.label), company.primary, zebra)).join('')
    parts.push(`<tr>${tds}</tr>`)
  })

  if (totals && columns.length) {
    const tds = columns.map((c, ci) => totalsCell(totals[ci], c.align || autoAlign(c.label), company.primary)).join('')
    parts.push(`<tr>${tds}</tr>`)
  }

  return `<table style="border-collapse:collapse;min-width:${totalWidth}px"><colgroup>${columns.map((c) => `<col width="${colWidth(c)}">`).join('')}</colgroup>${parts.join('')}</table>`
}

function nowStamp() {
  const d = new Date()
  const datePart = d.toISOString().slice(0, 10)
  const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${datePart} ${timePart}`
}

/**
 * Export a fully-branded Excel worksheet.
 *
 * Options:
 *  - title, subtitle
 *  - sectionLabel  (default single section heading)
 *  - rangeLabel    (period shown in the metadata bar)
 *  - preparedBy
 *  - fileName
 *  - company       (from companyFromBranding, or default GOSIKA)
 *  - logo          (optional data URI / URL shown in the wordmark block)
 *  - sections      ([{ heading, columns:[{label,align,width}], rows:[[v,...]], totals:[v,...]? }])
 */
export function exportReport({
  title = 'Report',
  subtitle = '',
  sectionLabel,
  rangeLabel,
  preparedBy,
  fileName = 'gosika_report',
  company,
  logo,
  sections = [],
}) {
  const comp = { ...DEFAULT_COMPANY, ...(company || {}), currency: 'रु' }
  const meta = [
    ['Prepared By', preparedBy || 'Administrator'],
    ['Period', rangeLabel || 'All time'],
    ['Generated', nowStamp()],
    ['Currency', comp.currency || 'रु'],
  ]
  const totalSpan = Math.max(...sections.map((s) => s.columns.length), 4)

  const body = []
  body.push(`<table style="border-collapse:collapse;width:100%">`)

  // ── Branded wordmark + company block ────────────────────────────────
  const brandMark = logo
    ? `<img src="${esc(logo)}" alt="${esc(comp.name)}" width="96" style="max-height:44px;object-fit:contain;margin-right:12px;display:inline-block;vertical-align:middle">`
    : `<span style="display:inline-block;background:${comp.primary};color:#FFFFFF;font-weight:900;font-size:15px;padding:4px 10px;border-radius:999px;margin-right:10px;vertical-align:middle;">${esc(comp.name.charAt(0))}</span>`
  const wordmark = `<span style="display:inline-block;vertical-align:middle;"><span style="font-weight:900;font-size:14pt;color:${comp.primary}">${esc(comp.name.toUpperCase())}</span> <span style="font-weight:800;font-size:12pt;color:${comp.ink}">Commerce</span><div style="font-size:8pt;color:#64748B;letter-spacing:0.05em;margin-top:1px">${esc((comp.tagline || '').toUpperCase())}</div></span>`
  body.push(
    `<tr><td colspan="${totalSpan}" style="border:none;padding:0 2px 4px 2px;text-align:center;">${brandMark}${wordmark}</td></tr>`
  )
  body.push(
    `<tr><td colspan="${totalSpan}" style="border:none;padding:0 2px 8px 2px;text-align:center;"><div style="font-size:8.5pt;color:#64748B">${esc(comp.legal)} &nbsp;•&nbsp; ${esc(comp.address)} &nbsp;•&nbsp; ${esc(comp.email)} &nbsp;•&nbsp; ${esc(comp.phone)}</div></td></tr>`
  )
  body.push(
    `<tr><td colspan="${totalSpan}" style="border:none;padding:0 2px;border-bottom:2.5pt solid ${comp.primary};"></td></tr>`
  )

  // ── Report title + subtitle ─────────────────────────────────────────
  body.push(
    `<tr><td colspan="${totalSpan}" style="border:none;padding:14px 2px 4px 2px;"><div style="font-size:14pt;font-weight:900;color:${comp.ink};text-align:left">${esc(title)}</div></td></tr>`
  )
  if (subtitle) {
    body.push(
      `<tr><td colspan="${totalSpan}" style="border:none;padding:0 2px 10px 2px;"><div style="font-size:9.5pt;color:#475569;text-align:left">${esc(subtitle)}</div></td></tr>`
    )
  }

  // ── Metadata bar ─────────────────────────────────────────────────────
  body.push(
    '<tr>' +
      meta
        .map(
          ([k, v]) =>
            `<td style="${cellStyle('left', 'background:#F1F5F9;border:0.5pt solid #E2E8F0;')}"><span style="font-size:7.5pt;color:#64748B;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">${esc(k)}</span><br/><span style="font-size:9pt;font-weight:700;color:${comp.ink}">${esc(v)}</span></td>`
        )
        .join('')
    + '</tr>'
  )
  body.push(`<tr><td colspan="${totalSpan}" style="height:10px;border:none"></td></tr>`)

  // ── Sections ─────────────────────────────────────────────────────────
  const list = sections.map((s, i) => {
    const inner = sectionTable(
      { ...s, heading: s.heading || (i === 0 && sectionLabel ? sectionLabel : s.heading) },
      comp
    )
    return `<tr><td colspan="${totalSpan}" style="border:none;padding:4px 0;">${inner}</td></tr>`
  })
  body.push(list.join(''))

  // ── Confidential footer ──────────────────────────────────────────────
  body.push(
    `<tr><td colspan="${totalSpan}" style="border:none;padding:14px 2px 0 2px;"><div style="border-top:2pt solid ${comp.primary};padding-top:7px;font-size:8pt;color:#94A3B8;line-height:1.55;text-align:left">This report is computer generated by <strong style="color:#64748B">${esc(comp.name)} Commerce</strong> on ${esc(nowStamp())} for internal management use only. Confidential — not for external distribution. &nbsp;•&nbsp; Source: GOSIKA Operations Database</div></td></tr>`
  )

  body.push('</table>')

  const sheetName = (fileName || 'gosika').replace(/[^\w-]+/g, '_').slice(0, 30)
  const html = [
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">',
    '<head>',
    '<meta charset="utf-8">',
    '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>',
    esc(sheetName),
    '</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->',
    `<style>body{font-family:Inter,'Segoe UI',Arial,sans-serif;}</style>`,
    '</head>',
    '<body>',
    ...body,
    '</body>',
    '</html>',
  ].join('')

  triggerDownload(html, `${sanitizeFileName(fileName)}.xls`)
  return html
}

/**
 * Convenience wrapper for the common "header row + data rows" export pattern
 * used across the legacy admin pages. `rows[0]` is treated as the column
 * header row and alignment is inferred per column.
 */
export function exportReportFromRows({
  rows = [],
  columns,
  title,
  subtitle,
  sectionLabel = 'Record',
  fileName,
  company,
  preparedBy,
  rangeLabel,
  totals,
}) {
  const [head = [], ...dataFromRows] = rows
  const data = columns ? rows : dataFromRows
  const headLine = columns ? columns : head
  const cols = headLine.map((c, i) => {
    const label = typeof c === 'object' ? c.label : c
    const meta = typeof c === 'object' ? c : {}
    return { label, align: meta.align || autoAlign(label), width: meta.width }
  })
  return exportReport({
    title,
    subtitle,
    sectionLabel,
    fileName,
    company,
    preparedBy,
    rangeLabel,
    sections: [{ heading: sectionLabel, columns: cols, rows: data, totals }],
  })
}

function sanitizeFileName(name) {
  const base = String(name || 'gosika_report').replace(/[\\/:*?"<>|]/g, '_').replace(/\.xlsx?$/i, '')
  return `${base}`
}

function triggerDownload(html, fileName) {
  const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export default exportReport