import React from 'react'
import referenceLogo from '../../assets/auth/ref_logo.jpg'

export default function GosikaLogo({
  size = 36,
  textColor = '#FF5500',
  showText = true,
  className = '',
}) {
  const imageWidth = Math.round(size * 133 / 34)
  const visibleWidth = Math.round(size * (showText && textColor !== '#FFFFFF' ? 100 : 34) / 34)

  if (textColor !== '#FFFFFF') {
    return (
      <span
        className={`gosika-brand-logo ${className}`}
        role="img"
        aria-label="GOSIKA"
        style={{
          display: 'inline-block',
          position: 'relative',
          width: visibleWidth,
          height: size,
          flex: `0 0 ${visibleWidth}px`,
          overflow: 'hidden',
          verticalAlign: 'middle',
        }}
      >
        <img
          src={referenceLogo}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: imageWidth,
            height: size,
            maxWidth: 'none',
          }}
        />
      </span>
    )
  }

  return (
    <div className={`gosika-brand-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Soft rounded orange background */}
        <rect width="40" height="40" rx="10" fill="#FF5500" />
        
        {/* Bag Handles */}
        <path
          d="M14.5 14V11C14.5 7.96243 16.9624 5.5 20 5.5C23.0376 5.5 25.5 7.96243 25.5 11V14"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        
        {/* Bag Body */}
        <path
          d="M9.5 14H30.5L28.8 32C28.6 33.7 27.2 35 25.5 35H14.5C12.8 35 11.4 33.7 11.2 32L9.5 14Z"
          fill="#FFFFFF"
        />
        
        {/* Center Orange Heart Cutout */}
        <path
          d="M20 25.8C20 25.8 15.5 22.8 15.5 19.8C15.5 18.2 16.7 17 18.2 17C19.1 17 19.8 17.5 20 18.1C20.2 17.5 20.9 17 21.8 17C23.3 17 24.5 18.2 24.5 19.8C24.5 22.8 20 25.8 20 25.8Z"
          fill="#FF5500"
        />
      </svg>
      {showText && (
        <span
          style={{
            color: textColor,
            fontSize: `${Math.round(size * 0.62)}px`,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          GOSIKA
        </span>
      )}
    </div>
  )
}
