import { Line } from 'react-chartjs-2'
import { BRAND, BRAND_WARM, MUTED, niceMax } from './chartSetup'
import { makeHtmlTooltip } from './htmlTooltip'
import { crosshairPlugin, hoverCursorPlugin } from './plugins'

/**
 * Fluid line chart that MORPHS in place when data changes
 * (react-chartjs-2 keeps the same canvas; chart.update() animates 750ms easeInOutQuart).
 */
export default function FluidLineChart({
  labels = [],
  values = [],
  formatValue,
  height = 300,
  max = null,
  weight = 3,
  dashed = false,
  minTicks = 4,
}) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: BRAND_WARM,
        borderWidth: weight,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: BRAND,
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.42,
        borderDash: dashed ? [6, 6] : undefined,
        fill: true,
        gradient: { top: 'rgba(255, 85, 0, 0.30)', bottom: 'rgba(255, 85, 0, 0.02)' },
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 750, easing: 'easeInOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        intersect: false,
        mode: 'index',
        external: makeHtmlTooltip(null, formatValue),
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: MUTED,
          maxTicksLimit: 8,
          maxRotation: 0,
          autoSkip: true,
          padding: 8,
        },
      },
      y: {
        beginAtZero: true,
        max: max ?? niceMax(Math.max(...(values.length ? values : [0]))),
        border: { display: false },
        grid: { color: 'rgba(148, 163, 184, 0.16)', drawTicks: false },
        ticks: {
          color: MUTED,
          padding: 10,
          maxTicksLimit: minTicks,
          callback(value) {
            if (formatValue) {
              const raw = formatValue(value, true)
              return raw.length > 9 ? raw.slice(0, 8) + '…' : raw
            }
            return value
          },
        },
      },
    },
    interaction: { mode: 'index', intersect: false },
  }

  return (
    <div style={{ height }} className="relative">
      <Line
        data={data}
        options={options}
        plugins={[crosshairPlugin, hoverCursorPlugin]}
      />
    </div>
  )
}