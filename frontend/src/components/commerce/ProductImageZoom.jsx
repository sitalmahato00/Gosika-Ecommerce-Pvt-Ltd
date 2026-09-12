import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, X } from 'lucide-react'
import { apiImage } from '../../utils/format'

export default function ProductImageZoom({
  src,
  alt = 'Product image',
  defaultImg,
  compareAt,
  price,
  zoomFactor = 2.5,
}) {
  const [isHovering, setIsHovering] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [dimensions, setDimensions] = useState({
    containerWidth: 460,
    containerHeight: 460,
    zoomWidth: 560,
    zoomHeight: 460,
    lensWidth: 224,
    lensHeight: 184,
  })

  const containerRef = useRef(null)
  const lensRef = useRef(null)
  const zoomImgRef = useRef(null)
  const animationFrameId = useRef(null)

  const imgSrc = apiImage(src) || defaultImg

  // Measure container and compute lens size when mouse enters
  const handleMouseEnter = useCallback(() => {
    if (typeof window === 'undefined' || window.innerWidth < 900) return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const cWidth = rect.width || 460
    const cHeight = rect.height || 460

    // Available horizontal space to the right
    const availableRight = window.innerWidth - rect.right - 40
    const zWidth = Math.max(380, Math.min(580, availableRight > 400 ? availableRight : 520))
    const zHeight = cHeight

    const factor = zoomFactor || 2.5
    const lWidth = Math.round(zWidth / factor)
    const lHeight = Math.round(zHeight / factor)

    setDimensions({
      containerWidth: cWidth,
      containerHeight: cHeight,
      zoomWidth: zWidth,
      zoomHeight: zHeight,
      lensWidth: lWidth,
      lensHeight: lHeight,
    })
    setIsHovering(true)
  }, [zoomFactor])

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const { containerWidth, containerHeight, lensWidth, lensHeight } = dimensions
    if (!containerWidth || !containerHeight) return

    // Center lens over mouse
    let lensX = mouseX - lensWidth / 2
    let lensY = mouseY - lensHeight / 2

    // Clamp within bounds
    lensX = Math.max(0, Math.min(lensX, containerWidth - lensWidth))
    lensY = Math.max(0, Math.min(lensY, containerHeight - lensHeight))

    const factor = zoomFactor || 2.5
    const zoomImgX = -lensX * factor
    const zoomImgY = -lensY * factor

    // Cancel prior animation frame to avoid queue buildup
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }

    animationFrameId.current = requestAnimationFrame(() => {
      if (lensRef.current) {
        lensRef.current.style.transform = `translate3d(${lensX}px, ${lensY}px, 0)`
      }
      if (zoomImgRef.current) {
        zoomImgRef.current.style.transform = `translate3d(${zoomImgX}px, ${zoomImgY}px, 0)`
      }
    })
  }, [dimensions, zoomFactor])

  const handleMouseLeave = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current)
    }
    setIsHovering(false)
  }, [])

  // Auto-hide zoom overlay on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 900) {
        setIsHovering(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e) => e.key === 'Escape' && setLightboxOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  const { containerWidth, containerHeight, zoomWidth, zoomHeight, lensWidth, lensHeight } = dimensions
  const factor = zoomFactor || 2.5
  const zoomedImgWidth = containerWidth * factor
  const zoomedImgHeight = containerHeight * factor

  return (
    <>
      <div
        className="product-gallery-main"
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setLightboxOpen(true)}
        style={{
          cursor: 'crosshair',
          position: 'relative',
        }}
        title="Click to expand full screen"
      >
        {/* Main Base Image */}
        <img
          src={imgSrc}
          alt={alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none',
          }}
          onError={(e) => {
            e.target.onerror = null
            e.target.src = defaultImg
          }}
        />

        {/* Discount Badge */}
        {compareAt > price && (
          <span
            className="discount-tag"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontSize: 13,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            -{Math.round(((compareAt - price) / compareAt) * 100)}% OFF
          </span>
        )}

        {/* Hover-to-zoom indicator badge */}
        <div
          className="product-zoom-hint"
          style={{
            opacity: isHovering ? 0 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          <ZoomIn size={14} />
          <span>Roll over to zoom</span>
        </div>

        {/* Zoom Lens on main image */}
        {isHovering && (
          <div
            ref={lensRef}
            className="product-zoom-lens"
            style={{
              width: `${lensWidth}px`,
              height: `${lensHeight}px`,
              transform: 'translate3d(0, 0, 0)',
            }}
          />
        )}
      </div>

      {/* Zoom Overlay Window to the right */}
      {isHovering && (
        <div
          className="product-zoom-window"
          style={{
            width: `${zoomWidth}px`,
            height: `${zoomHeight}px`,
          }}
        >
          <img
            ref={zoomImgRef}
            src={imgSrc}
            alt={alt}
            className="product-zoom-img"
            style={{
              width: `${zoomedImgWidth}px`,
              height: `${zoomedImgHeight}px`,
              transform: 'translate3d(0, 0, 0)',
            }}
            onError={(e) => {
              e.target.onerror = null
              e.target.src = defaultImg
            }}
          />
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="overlay"
          style={{
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="icon-btn"
              style={{
                position: 'absolute',
                top: -16,
                right: -16,
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 10,
              }}
              aria-label="Close fullscreen preview"
            >
              <X size={18} />
            </button>

            <img
              src={imgSrc}
              alt={alt}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                background: '#ffffff',
              }}
            />
            <div
              style={{
                color: '#ffffff',
                marginTop: 12,
                fontSize: 14,
                fontWeight: 600,
                textAlign: 'center',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              {alt}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
