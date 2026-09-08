import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Drawer({ open, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Always clean up on unmount or when open changes — regardless of open state
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  // Also ensure overflow is restored if component unmounts while open
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  if (!open) return null
  return (
    <>
      <div className="overlay" style={{ alignItems: 'stretch' }} onMouseDown={(e) => e.target === e.currentTarget && onClose()} />
      <div className={`drawer ${side === 'left' ? 'drawer-left' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-header">
          <h3 className="m-0" style={{ fontSize: 16 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  )
}
