/* Vertical crosshair + highlight for the fluid line chart */
export const crosshairPlugin = {
  id: 'saasCrosshair',
  afterDatasetDraw(chart, _args, opts) {
    if (!opts?.enabled) return
    const { ctx, chartArea, _active } = chart
    if (!_active || _active.length === 0) return
    const point = _active[0].element
    if (!point) return
    const x = point.x

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = opts.color || '#ff7733'
    ctx.globalAlpha = 0.55
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

/* Gradient fill under the brand line */
export const gradientFillPlugin = {
  id: 'saasGradientFill',
  afterDatasetUpdate(chart, args) {
    const meta = chart.getDatasetMeta(args.index)
    const ctx = chart.ctx
    const top = chart.chartArea?.top ?? 0
    const bottom = chart.chartArea?.bottom ?? 0
    if (meta.dataset && meta.dataset.options?.fill !== false) {
      const grad = ctx.createLinearGradient(0, top, 0, bottom)
      grad.addColorStop(0, optsFor(chart, args.index, 'top'))
      grad.addColorStop(1, optsFor(chart, args.index, 'bottom'))
      meta.dataset.options.backgroundColor = grad
    }
  },
}

function optsFor(chart, index, key) {
  const data = chart.data.datasets[index]
  const base = {
    top: 'rgba(255, 85, 0, 0.32)',
    bottom: 'rgba(255, 85, 0, 0.02)',
  }
  const custom = data?.gradient || {}
  return custom[key] || base[key]
}

export const hoverCursorPlugin = {
  id: 'saasHoverCursor',
  beforeDraw(chart, _args, opts) {
    if (!opts?.enabled) return
    if (!chart.canvas) return
    chart.canvas.style.cursor = chart._active?.length ? 'pointer' : 'default'
  },
}