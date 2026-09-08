import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  ChartTooltip,
  Legend,
)

ChartJS.defaults.font.family = "'Inter', ui-sans-serif, system-ui, sans-serif"
ChartJS.defaults.color = '#64748b'
ChartJS.defaults.animation.duration = 750
ChartJS.defaults.animation.easing = 'easeInOutQuart'
ChartJS.defaults.animation.resizeDuration = 500

export const BRAND = '#ff5500'
export const BRAND_WARM = '#ff7733'
export const NAVY = '#1e293b'
export const MUTED = '#94a3b8'

export function niceMax(value) {
  const v = Number(value) || 0
  if (v <= 0) return 100
  const STEPS = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000]
  const size = STEPS.find((s) => v <= s)
  if (size) return size
  return Math.ceil(v / 1000000) * 1000000
}

export { ChartJS }