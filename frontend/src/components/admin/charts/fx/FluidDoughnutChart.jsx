import { Doughnut } from 'react-chartjs-2'
import { MUTED } from './chartSetup'

/**
 * Fluid doughnut with smooth arc morphing + center total readout.
 */
export default function FluidDoughnutChart({
  segments = [],
  centerLabel,
  centerValue,
  height = 168,
}) {
  const data = {
    labels: segments.map((s) => s.label || s.name || 'Other'),
    datasets: [
      {
        data: segments.map((s) => s.value || 0),
        backgroundColor: segments.map((s) => s.color || '#ff5500'),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  }

  const centerPlugin = {
    id: 'saasDoughnutCenter',
    afterDraw(chart) {
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const cx = (chartArea.left + chartArea.right) / 2
      const cy = (chartArea.top + chartArea.bottom) / 2
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = '600 10.5px Inter, sans-serif'
      ctx.fillStyle = MUTED
      ctx.fillText(centerLabel || '', cx, cy - 12)
      ctx.font = '800 15px Inter, sans-serif'
      ctx.fillStyle = '#1e293b'
      ctx.fillText(centerValue === undefined || centerValue === null ? '' : centerValue, cx, cy + 8)
      ctx.restore()
    },
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { duration: 750, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 10,
        cornerRadius: 10,
        titleFont: { weight: '600', size: 12 },
        bodyFont: { size: 12 },
        displayColors: true,
        callbacks: {
          label(ctx) {
            return ` ${ctx.parsed}`
          },
        },
      },
    },
  }

  return (
    <div style={{ height }} className="relative">
      <Doughnut data={data} options={options} plugins={[centerPlugin]} />
    </div>
  )
}