import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    // Disable any smooth scroll temporarily to guarantee instantaneous position reset
    const html = document.documentElement
    const prevScrollBehavior = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const frameId = requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
      html.style.scrollBehavior = prevScrollBehavior || ''
    })

    const timer = setTimeout(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }, 50)

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timer)
      html.style.scrollBehavior = prevScrollBehavior || ''
    }
  }, [pathname, search])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  return null
}
