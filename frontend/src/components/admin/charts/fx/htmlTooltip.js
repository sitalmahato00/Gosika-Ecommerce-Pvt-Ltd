let tipEl = null

function buildTip() {
  if (tipEl && document.body.contains(tipEl)) return tipEl
  tipEl = document.createElement('div')
  tipEl.id = 'saas-chart-tip'
  tipEl.style.cssText = [
    'position:fixed',
    'z-index:9999',
    'pointer-events:none',
    'opacity:0',
    'transform:translateY(6px)',
    'transition:opacity 180ms ease, transform 180ms ease',
    'background:#1e293b',
    'color:#f8fafc',
    'padding:10px 14px',
    'border-radius:12px',
    'box-shadow:0 12px 30px rgba(2,6,23,0.28)',
    'font-size:12px',
    'line-height:1.45',
    'white-space:nowrap',
  ].join(';')
  document.body.appendChild(tipEl)
  return tipEl
}

export function makeHtmlTooltip(labelFn, valueFn) {
  return function htmlTooltip(context) {
    const { tooltip, chart } = context
    const el = buildTip()
    if (!tooltip || !tooltip.opacity || tooltip.dataPoints?.length === 0) {
      el.style.opacity = '0'
      el.style.transform = 'translateY(6px)'
      return
    }
    chart.canvas.style.cursor = 'pointer'

    const dp = tooltip.dataPoints[0]
    const label = dp.label ?? '—'
    const value = dp.parsed?.y ?? dp.parsed?.r ?? 0
    const heading = labelFn ? labelFn(label) : label
    const body = valueFn ? valueFn(value) : value

    el.innerHTML = `
      <div style="font-weight:600;color:#ff7733;text-transform:uppercase;letter-spacing:.05em;font-size:10.5px;margin-bottom:2px">${heading}</div>
      <div style="font-size:14px;font-weight:700">${body}</div>
    `

    const pos = tooltip.caretX ?? chart.chartArea?.left ?? 0
    const topY = tooltip.caretY ?? chart.chartArea?.top ?? 0
    const box = { width: el.offsetWidth, height: el.offsetHeight }
    tipEl.style.opacity = '1'
    tipEl.style.transform = 'translateY(0)'

    const pad = 12
    el.style.left = `${Math.min(pos + pad, window.innerWidth - box.width - pad)}px`
    el.style.top = `${Math.max(topY - box.height - 10, 8)}px`
  }
}