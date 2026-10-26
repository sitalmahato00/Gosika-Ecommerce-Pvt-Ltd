import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

export default function Drawer({ open, onClose, title, children, side = 'right' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    document.body.classList.add('modal-open')
    // Always clean up on unmount or when open changes — regardless of open state
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [open, onClose])

  // Also ensure overflow is restored if component unmounts while open
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('modal-open')
    }
  }, [])

  if (!open) return null
  return ReactDOM.createPortal(
    <>
      <div
        className="overlay"
        style={{ alignItems: 'stretch', zIndex: 10000 }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      />
      <div
        className={`drawer ${side === 'left' ? 'drawer-left' : ''}`}
        style={{ zIndex: 10001 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="drawer-header">
          <h3 className="m-0" style={{ fontSize: 16 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>,
    document.body
  )
}
