import { useEffect, useRef, useState } from 'react'

function easeInOutQuart(t) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

/**
 * Rolling number counter. Eases toward the target value on every change.
 * Pass a `format` fn (e.g. money, toLocaleString) for the displayed output.
 */
export default function AnimatedNumber({ value, format = (v) => v, duration = 750 }) {
  const [display, setDisplay] = useState(Number(value) || 0)
  const fromRef = useRef(Number(value) || 0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = fromRef.current
    const to = Number(value) || 0
    if (from === to) return
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = easeInOutQuart(t)
      const current = from + (to - from) * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      fromRef.current = to
    }
  }, [value, duration])

  return <>{format(display)}</>
}